import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = (
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
) as string;

// Safe storage wrapper — tries localStorage, falls back to memory
// This avoids the Web Locks / NavigatorLock timeout error
const safeStorage = (() => {
  const mem: Record<string, string> = {};
  try {
    // Test if localStorage is accessible without locks
    localStorage.setItem('__test__', '1');
    localStorage.removeItem('__test__');
    return {
      getItem: (k: string) => {
        try { return localStorage.getItem(k); } catch { return mem[k] ?? null; }
      },
      setItem: (k: string, v: string) => {
        try { localStorage.setItem(k, v); } catch { mem[k] = v; }
      },
      removeItem: (k: string) => {
        try { localStorage.removeItem(k); } catch { delete mem[k]; }
      },
    };
  } catch {
    return {
      getItem: (k: string) => mem[k] ?? null,
      setItem: (k: string, v: string) => { mem[k] = v; },
      removeItem: (k: string) => { delete mem[k]; },
    };
  }
})();

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: safeStorage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'implicit',   // no PKCE = no Web Locks needed
  },
});
