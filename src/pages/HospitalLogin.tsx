import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Building2, Mail, Lock, Loader2, Heart } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export default function HospitalLogin() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);

    try {
      // 1. Sign in with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password });
      if (authError) throw authError;

      const user = authData.user;
      const domain = email.split("@")[1]?.toLowerCase();
      if (!domain) throw new Error("Invalid email format");

      // 2. Match domain to hospital
      const { data: hospital, error: hospError } = await (supabase as any)
        .from("hospitals")
        .select("id, name")
        .eq("email_domain", domain)
        .single();

      if (hospError || !hospital) {
        await supabase.auth.signOut();
        throw new Error("Unauthorized hospital access. Your email domain is not registered.");
      }

      // 3. Upsert hospital_staff record
      await (supabase as any)
        .from("hospital_staff")
        .upsert({ auth_id: user.id, hospital_id: hospital.id, role: "staff" }, { onConflict: "auth_id" });

      toast({ title: `Welcome to ${hospital.name}!` });
      navigate("/hospital-dashboard");
    } catch (err: any) {
      toast({ title: "Login Failed", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-white">
      {/* Left: form */}
      <div className="w-full md:w-1/2 flex flex-col items-center justify-center px-6 py-10 md:px-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">

          {/* Logo */}
          <div className="flex items-center gap-2 mb-8">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <Heart className="w-5 h-5 text-white" fill="currentColor" />
            </div>
            <span className="font-display text-xl font-bold text-foreground">Instant Blood Connect</span>
          </div>

          <div className="bg-card border border-border rounded-2xl p-8 shadow-card">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h1 className="font-display text-xl font-bold text-foreground">Hospital Admin</h1>
                <p className="text-sm text-muted-foreground">Sign in with your hospital email</p>
              </div>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Hospital Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="you@apollo.com" required
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••" required minLength={6}
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm" />
                </div>
              </div>

              <button type="submit" disabled={loading}
                className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-display font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2">
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Building2 className="w-5 h-5" />}
                {loading ? "Signing in…" : "Sign In to Hospital Panel"}
              </button>
            </form>

            <p className="text-xs text-muted-foreground text-center mt-4">
              Only registered hospital domains can access this panel.
            </p>
          </div>
        </motion.div>
      </div>

      {/* Right: info panel */}
      <div className="hidden md:flex w-1/2 bg-blue-50 flex-col items-center justify-center px-12 text-center">
        <Building2 className="w-20 h-20 text-blue-400 mb-6" />
        <h2 className="font-display text-3xl font-bold text-blue-900 mb-3">Hospital Blood Management</h2>
        <p className="text-blue-700 text-lg mb-8 max-w-sm">
          Update your blood inventory in real-time. Help save lives by keeping availability accurate.
        </p>
        <div className="grid grid-cols-2 gap-4 w-full max-w-xs">
          {["A+","A-","B+","B-","O+","O-","AB+","AB-"].map(g => (
            <div key={g} className="bg-white rounded-xl p-3 text-center shadow-sm">
              <p className="font-display font-bold text-xl text-primary">{g}</p>
              <div className="w-2 h-2 rounded-full bg-green-400 mx-auto mt-1" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
