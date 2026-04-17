import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type { UserProfile } from "@/integrations/supabase/types";

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null, user: null, profile: null, loading: false,
  signOut: async () => {}, refreshProfile: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (authId: string) => {
    try {
      const { data } = await supabase
        .from("users")
        .select("*")
        .eq("auth_id", authId)
        .single();
      setProfile((data as UserProfile) ?? null);
    } catch {
      setProfile(null);
    }
  };

  const refreshProfile = async () => {
    if (session?.user?.id) await fetchProfile(session.user.id);
  };

  useEffect(() => {
    let done = false;

    const finish = (s: Session | null) => {
      if (done) return;
      done = true;
      setSession(s);
      setLoading(false);
      if (s?.user) fetchProfile(s.user.id);
    };

    // Hard timeout — never hang more than 3 seconds
    const timeout = setTimeout(() => finish(null), 3000);

    // Primary: get existing session
    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        clearTimeout(timeout);
        finish(session);
      })
      .catch(() => {
        clearTimeout(timeout);
        finish(null);
      });

    // Secondary: listen for changes (OAuth redirect, sign in/out)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        clearTimeout(timeout);
        done = true; // allow updates after initial load
        setSession(session);
        setLoading(false);
        if (session?.user) fetchProfile(session.user.id);
        else setProfile(null);
      }
    );

    return () => {
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider value={{
      session, user: session?.user ?? null, profile, loading, signOut, refreshProfile,
    }}>
      {children}
    </AuthContext.Provider>
  );
};
