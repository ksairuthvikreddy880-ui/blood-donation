import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, Link } from "react-router-dom";
import {
  Heart, Mail, Lock, User, Loader2, Phone, MapPin,
  Eye, EyeOff, Smartphone, ChevronLeft,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

// ── Auth method tabs ─────────────────────────────────────────────
type AuthMethod = "email" | "phone";

const Auth = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [method, setMethod] = useState<AuthMethod>("email");

  // Email/password fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [bloodGroup, setBloodGroup] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Phone OTP fields
  const [phoneNumber, setPhoneNumber] = useState("+91");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);

  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const navigate = useNavigate();
  const { toast } = useToast();

  const resetAll = () => {
    setEmail(""); setPassword(""); setName(""); setPhone("");
    setCity(""); setBloodGroup(""); setPhoneNumber("+91");
    setOtp(""); setOtpSent(false);
  };

  const handleToggle = () => { setIsSignUp(!isSignUp); resetAll(); };
  const handleMethodSwitch = (m: AuthMethod) => { setMethod(m); resetAll(); };

  // ── Google OAuth ─────────────────────────────────────────────
  const handleGoogleAuth = async () => {
    setGoogleLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${window.location.origin}/dashboard` },
      });
      if (error) throw error;
    } catch (err: any) {
      toast({ title: "Google Sign-In Error", description: err.message, variant: "destructive" });
      setGoogleLoading(false);
    }
  };

  // ── Phone OTP: send ──────────────────────────────────────────
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber || phoneNumber.length < 10) {
      toast({ title: "Invalid number", description: "Enter a valid phone number with country code.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({ phone: phoneNumber });
      if (error) throw error;
      setOtpSent(true);
      toast({ title: "OTP Sent!", description: `A 6-digit OTP was sent to ${phoneNumber}.` });
    } catch (err: any) {
      toast({ title: "Error sending OTP", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  // ── Phone OTP: verify ────────────────────────────────────────
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.verifyOtp({
        phone: phoneNumber,
        token: otp,
        type: "sms",
      });
      if (error) throw error;
      toast({ title: "Signed in!", description: "Welcome to Instant Blood Connect." });
      navigate("/dashboard");
    } catch (err: any) {
      toast({ title: "Invalid OTP", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  // ── Email/Password ───────────────────────────────────────────
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isSignUp) {
        const { data: authData, error: signUpError } = await supabase.auth.signUp({
          email, password,
          options: {
            data: { name, phone, city, blood_group: bloodGroup },
            emailRedirectTo: window.location.origin,
          },
        });
        if (signUpError) throw signUpError;
        if (authData.user) {
          await supabase.from("profiles").update({ name, phone, city, blood_group: bloodGroup }).eq("user_id", authData.user.id);
        }
        toast({ title: "Account created!", description: "Check your email to verify your account." });
        resetAll();
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast({ title: "Welcome back!", description: "You've successfully signed in." });
        navigate("/dashboard");
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const inputCls = "w-full pl-11 pr-4 py-3 rounded-xl bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all";

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 justify-center mb-8">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
            <Heart className="w-5 h-5 text-primary-foreground" fill="currentColor" />
          </div>
          <span className="font-display text-2xl font-bold text-foreground">Instant Blood Connect</span>
        </Link>

        <div className="bg-card rounded-2xl border border-border p-8 shadow-card">
          {/* Header */}
          <h2 className="font-display text-2xl font-bold text-foreground text-center mb-1">
            {isSignUp ? "Create Account" : "Welcome Back"}
          </h2>
          <p className="text-muted-foreground text-center mb-6 text-sm">
            {isSignUp ? "Join our life-saving community" : "Sign in to continue"}
          </p>

          {/* ── Google Button ─────────────────────────────────── */}
          <button
            onClick={handleGoogleAuth}
            disabled={googleLoading}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl border border-border bg-white hover:bg-gray-50 text-gray-700 font-medium text-sm transition-all shadow-sm hover:shadow-md disabled:opacity-60 mb-4"
          >
            {googleLoading ? (
              <Loader2 className="w-5 h-5 animate-spin text-gray-500" />
            ) : (
              /* Google G icon */
              <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
            )}
            {isSignUp ? "Sign up with Google" : "Sign in with Google"}
          </button>

          {/* ── Divider ───────────────────────────────────────── */}
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted-foreground font-medium">OR</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* ── Method Tabs ───────────────────────────────────── */}
          <div className="flex gap-1 p-1 bg-secondary rounded-xl mb-5">
            <button
              onClick={() => handleMethodSwitch("email")}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${method === "email" ? "bg-card shadow text-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              <Mail className="w-4 h-4" /> Email
            </button>
            <button
              onClick={() => handleMethodSwitch("phone")}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${method === "phone" ? "bg-card shadow text-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              <Smartphone className="w-4 h-4" /> Phone
            </button>
          </div>

          <AnimatePresence mode="wait">
            {/* ══ EMAIL / PASSWORD FORM ══════════════════════════ */}
            {method === "email" && (
              <motion.form
                key="email"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
                onSubmit={handleEmailSubmit}
                className="space-y-4"
              >
                {isSignUp && (
                  <>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <input type="text" placeholder="Full Name" value={name} onChange={(e) => setName(e.target.value)} required className={inputCls} />
                    </div>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <input type="tel" placeholder="Phone Number" value={phone} onChange={(e) => setPhone(e.target.value)} required className={inputCls} />
                    </div>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <input type="text" placeholder="City" value={city} onChange={(e) => setCity(e.target.value)} required className={inputCls} />
                    </div>
                    <div className="relative">
                      <Heart className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <select value={bloodGroup} onChange={(e) => setBloodGroup(e.target.value)} required className={`${inputCls} appearance-none`}>
                        <option value="">Select Blood Group</option>
                        {["A+","A-","B+","B-","AB+","AB-","O+","O-"].map((g) => <option key={g} value={g}>{g}</option>)}
                      </select>
                    </div>
                  </>
                )}

                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input type="email" placeholder="Email address" value={email} onChange={(e) => setEmail(e.target.value)} required className={inputCls} />
                </div>

                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required minLength={6}
                    className="w-full pl-11 pr-12 py-3 rounded-xl bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} tabIndex={-1}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors focus:outline-none">
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>

                <button
                  type="submit" disabled={loading}
                  className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-display font-semibold text-base hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading && <Loader2 className="w-5 h-5 animate-spin" />}
                  {isSignUp ? "Create Account" : "Sign In"}
                </button>
              </motion.form>
            )}

            {/* ══ PHONE OTP FORM ══════════════════════════════════ */}
            {method === "phone" && (
              <motion.div
                key="phone"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                {!otpSent ? (
                  /* Step 1 – Enter phone number */
                  <form onSubmit={handleSendOtp} className="space-y-4">
                    <div className="relative">
                      <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <input
                        type="tel"
                        placeholder="+91 XXXXX XXXXX"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        required
                        className={inputCls}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground px-1">
                      Include country code, e.g. <span className="font-mono font-semibold">+91</span> for India.
                      An OTP will be sent via SMS.
                    </p>
                    <button
                      type="submit" disabled={loading}
                      className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-display font-semibold text-base hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {loading && <Loader2 className="w-5 h-5 animate-spin" />}
                      Send OTP
                    </button>
                  </form>
                ) : (
                  /* Step 2 – Enter OTP */
                  <form onSubmit={handleVerifyOtp} className="space-y-4">
                    <div className="text-center mb-2">
                      <p className="text-sm text-muted-foreground">OTP sent to</p>
                      <p className="font-semibold text-foreground">{phoneNumber}</p>
                    </div>

                    {/* OTP digits */}
                    <div className="relative">
                      <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <input
                        type="text"
                        placeholder="Enter 6-digit OTP"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                        maxLength={6}
                        required
                        className={`${inputCls} tracking-[0.5em] text-center font-mono text-lg`}
                      />
                    </div>

                    <button
                      type="submit" disabled={loading || otp.length < 6}
                      className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-display font-semibold text-base hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {loading && <Loader2 className="w-5 h-5 animate-spin" />}
                      Verify & Sign In
                    </button>

                    <button
                      type="button"
                      onClick={() => { setOtpSent(false); setOtp(""); }}
                      className="w-full flex items-center justify-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" /> Change number / Resend OTP
                    </button>
                  </form>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Toggle sign in / sign up */}
          <p className="text-center text-muted-foreground mt-6 text-sm">
            {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
            <button
              type="button" onClick={handleToggle}
              className="text-primary font-semibold hover:underline focus:outline-none"
            >
              {isSignUp ? "Sign In" : "Sign Up"}
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Auth;
