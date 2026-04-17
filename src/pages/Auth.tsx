import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, Link } from "react-router-dom";
import { Heart, Mail, Lock, User, Loader2, Phone, CheckCircle, ArrowRight, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";

const GoogleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24">
    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);

// ─────────────────────────────────────────────
// Horizontal Slider Sign-Up
// ─────────────────────────────────────────────
interface SignUpProps { onSwitchToSignIn: () => void; }

function SignUpFlow({ onSwitchToSignIn }: SignUpProps) {
  const [step, setStep] = useState(0); // 0-indexed: 0,1,2
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState({ name: "", phone: "", email: "", password: "", confirm: "" });
  const navigate = useNavigate();
  const { toast } = useToast();

  const validate = (s: number) => {
    const e = { name: "", phone: "", email: "", password: "", confirm: "" };
    if (s === 0) {
      e.name  = name.trim()  ? "" : "Name is required";
      e.phone = phone.trim() ? "" : "Phone number is required";
    }
    if (s === 1) {
      e.email = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? "" : "Valid email is required";
    }
    if (s === 2) {
      e.password = password.length >= 6 ? "" : "Minimum 6 characters";
      e.confirm  = password === confirmPassword ? "" : "Passwords do not match";
    }
    setErrors(e);
    return Object.values(e).every(v => v === "");
  };

  const next = () => { if (validate(step)) setStep(s => s + 1); };
  const back = () => setStep(s => s - 1);

  const handleSubmit = async () => {
    if (!validate(2)) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email, password,
        // full_name + phone picked up by handle_new_user() DB trigger
        options: { data: { full_name: name, phone }, emailRedirectTo: `${window.location.origin}/auth` },
      });
      if (error) throw error;
      if (data.user) {
        const { data: login } = await supabase.auth.signInWithPassword({ email, password });
        if (login.session) { setSuccess(true); setTimeout(() => navigate("/dashboard"), 2200); return; }
      }
      toast({ title: "Account Created", description: "Please sign in with your credentials." });
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Sign-up failed", variant: "destructive" });
    } finally { setLoading(false); }
  };

  if (success) {
    return (
      <motion.div initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.5 }} className="text-center py-10">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.15, type: "spring", stiffness: 200 }}>
          <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-5" />
        </motion.div>
        <h2 className="font-display text-2xl font-bold text-foreground mb-2">You're now part of the lifesaving network ❤️</h2>
        <p className="text-muted-foreground text-sm">Redirecting to your dashboard…</p>
      </motion.div>
    );
  }

  const stepLabels = ["Who are you?", "Your email", "Set password"];
  const stepSubs   = ["Let's start with the basics", "We'll use this to reach you", "Keep your account secure"];

  return (
    <>
      {/* Progress bar */}
      <div className="mb-7">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs font-medium text-muted-foreground">Step {step + 1} of 3</span>
          <span className="text-xs font-medium text-primary">{Math.round(((step + 1) / 3) * 100)}%</span>
        </div>
        <div className="h-1.5 w-full bg-border rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-primary rounded-full"
            animate={{ width: `${((step + 1) / 3) * 100}%` }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
          />
        </div>

        {/* Step 1: Lottie animation replaces the circles row */}
        {step === 0 ? (
          <div className="flex justify-center mt-2">
            <DotLottieReact
              src="/blood-donation.lottie"
              loop
              autoplay
              style={{ width: 160, height: 160 }}
            />
          </div>
        ) : step === 1 ? (
          <div className="flex justify-center mt-2">
            <DotLottieReact
              src="/blood-collection-tube.lottie"
              loop
              autoplay
              style={{ width: 160, height: 160 }}
            />
          </div>
        ) : (
          <div className="flex justify-between mt-3">
            {stepLabels.map((label, i) => (
              <div key={i} className="flex flex-col items-center gap-1">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors duration-300 ${i <= step ? "bg-primary text-white" : "bg-border text-muted-foreground"}`}>
                  {i < step ? "✓" : i + 1}
                </div>
                <span className={`text-[10px] font-medium transition-colors duration-300 ${i === step ? "text-primary" : "text-muted-foreground"}`}>{label}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Slider viewport — overflow hidden */}
      <div className="overflow-hidden w-full">
        {/*
          Track is 300% wide. Each panel is 1/3 of that = 100% of viewport.
          We slide the track using CSS transform (not framer x%) to avoid
          percentage-of-self ambiguity.
        */}
        <div
          className="flex"
          style={{
            width: "300%",
            transform: `translateX(calc(-${step} * 33.3333%))`,
            transition: "transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        >
          {/* ── Step 1 ── */}
          <div style={{ width: "33.3333%" }} className="flex-shrink-0">
            <h2 className="font-display text-xl font-bold text-foreground mb-1">{stepLabels[0]}</h2>
            <p className="text-muted-foreground text-sm mb-5">{stepSubs[0]}</p>
            <div className="space-y-3">
              <div>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input type="text" placeholder="Full Name" value={name} onChange={e => setName(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm" />
                </div>
                {errors.name && <p className="text-xs text-red-500 mt-1 ml-1">{errors.name}</p>}
              </div>
              <div>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input type="tel" placeholder="Phone Number" value={phone} onChange={e => setPhone(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm" />
                </div>
                {errors.phone && <p className="text-xs text-red-500 mt-1 ml-1">{errors.phone}</p>}
              </div>
            </div>
            <button onClick={next} className="w-full mt-6 py-3 bg-primary text-primary-foreground rounded-xl font-display font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
              Continue <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* ── Step 2 ── */}
          <div style={{ width: "33.3333%" }} className="flex-shrink-0">
            <h2 className="font-display text-xl font-bold text-foreground mb-1">{stepLabels[1]}</h2>
            <p className="text-muted-foreground text-sm mb-5">{stepSubs[1]}</p>
            <div>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input type="email" placeholder="Email address" value={email} onChange={e => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm" />
              </div>
              {errors.email && <p className="text-xs text-red-500 mt-1 ml-1">{errors.email}</p>}
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={back} className="flex-1 py-3 border border-border text-foreground rounded-xl font-semibold hover:bg-secondary transition-colors flex items-center justify-center gap-2 text-sm">
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              <button onClick={next} className="flex-1 py-3 bg-primary text-primary-foreground rounded-xl font-display font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2 text-sm">
                Continue <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* ── Step 3 ── */}
          <div style={{ width: "33.3333%" }} className="flex-shrink-0">
            <h2 className="font-display text-xl font-bold text-foreground mb-1">{stepLabels[2]}</h2>
            <p className="text-muted-foreground text-sm mb-5">{stepSubs[2]}</p>
            <div className="space-y-3">
              <div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm" />
                </div>
                {errors.password && <p className="text-xs text-red-500 mt-1 ml-1">{errors.password}</p>}
              </div>
              <div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input type="password" placeholder="Confirm Password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm" />
                </div>
                {errors.confirm && <p className="text-xs text-red-500 mt-1 ml-1">{errors.confirm}</p>}
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={back} className="flex-1 py-3 border border-border text-foreground rounded-xl font-semibold hover:bg-secondary transition-colors flex items-center justify-center gap-2 text-sm">
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              <button onClick={handleSubmit} disabled={loading} className="flex-1 py-3 bg-primary text-primary-foreground rounded-xl font-display font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2 text-sm">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                {loading ? "Creating…" : "Create Account"}
              </button>
            </div>
          </div>
        </div>
      </div>

      <p className="text-center text-muted-foreground mt-6 text-sm">
        Already have an account?{" "}
        <button onClick={onSwitchToSignIn} className="text-primary font-semibold hover:underline">Sign In</button>
      </p>
    </>
  );
}

// ─────────────────────────────────────────────
// Sign-In Form (untouched logic)
// ─────────────────────────────────────────────
interface SignInProps { onSwitchToSignUp: () => void; }

function SignInForm({ onSwitchToSignUp }: SignInProps) {
  const [loginMethod, setLoginMethod] = useState<"email" | "phone">("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [verificationStep, setVerificationStep] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [smsLoading, setSmsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const sendSMS = async (phoneNumber: string) => {
    setSmsLoading(true);
    try {
      const res = await fetch("/api/send-verification-code", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ phone: phoneNumber }) });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error || "Failed to send SMS"); }
      toast({ title: "SMS Sent", description: "Verification code sent to your phone" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to send SMS", variant: "destructive" });
    } finally { setSmsLoading(false); }
  };

  const verifyCode = async (code: string) => {
    setSmsLoading(true);
    try {
      const res = await fetch("/api/verify-code", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ phone, code }) });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error || "Invalid code"); }
      return true;
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Verification failed", variant: "destructive" });
      return false;
    } finally { setSmsLoading(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (loginMethod === "phone") {
        if (!verificationStep) { await sendSMS(phone); setVerificationStep(true); setLoading(false); return; }
        const ok = await verifyCode(verificationCode);
        if (!ok) { setLoading(false); return; }
        toast({ title: "Success", description: "Phone verified! Logging in…" });
        setPhone(""); setVerificationCode(""); setVerificationStep(false);
        navigate("/dashboard");
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw new Error(error.message || "Invalid email or password");
        if (data.session) navigate("/dashboard");
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Authentication failed", variant: "destructive" });
    } finally { setLoading(false); }
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });
      if (error) throw error;
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to sign in with Google", variant: "destructive" });
      setGoogleLoading(false);
    }
  };

  return (
    <>
      <h2 className="font-display text-2xl font-bold text-foreground text-center mb-1">Welcome Back</h2>
      <p className="text-muted-foreground text-center mb-6 text-sm">Sign in to your account</p>

      <div className="flex gap-2 mb-6">
        {(["email", "phone"] as const).map(m => (
          <button key={m} type="button"
            onClick={() => { setLoginMethod(m); setEmail(""); setPassword(""); setPhone(""); setVerificationStep(false); setVerificationCode(""); }}
            className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors text-sm min-h-[44px] flex items-center justify-center gap-2 ${loginMethod === m ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground hover:bg-secondary/80"}`}
          >
            {m === "email" ? <><Mail className="w-4 h-4" /> Email</> : <><Phone className="w-4 h-4" /> Phone</>}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {verificationStep ? (
          <>
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-2 text-green-700">
              <CheckCircle className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm font-medium">Code sent to {phone}</span>
            </div>
            <input type="text" placeholder="Enter 6-digit code" value={verificationCode} onChange={e => setVerificationCode(e.target.value.slice(0, 6))} maxLength={6}
              className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring text-center text-2xl tracking-widest" />
            <button type="submit" disabled={smsLoading || verificationCode.length !== 6}
              className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-display font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2">
              {smsLoading && <Loader2 className="w-5 h-5 animate-spin" />} Verify & Sign In
            </button>
            <button type="button" onClick={() => { setVerificationStep(false); setVerificationCode(""); }} className="w-full py-2 text-primary font-medium hover:underline text-sm">Back</button>
          </>
        ) : loginMethod === "phone" ? (
          <>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input type="tel" placeholder="Phone Number (+91XXXXXXXXXX)" value={phone} onChange={e => setPhone(e.target.value)} required
                className="w-full pl-11 pr-4 py-3 rounded-xl bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <button type="submit" disabled={loading}
              className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-display font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2">
              {loading && <Loader2 className="w-5 h-5 animate-spin" />} Send OTP
            </button>
          </>
        ) : (
          <>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input type="email" placeholder="Email address" value={email} onChange={e => setEmail(e.target.value)} required
                className="w-full pl-11 pr-4 py-3 rounded-xl bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6}
                className="w-full pl-11 pr-4 py-3 rounded-xl bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <button type="submit" disabled={loading}
              className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-display font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2">
              {loading && <Loader2 className="w-5 h-5 animate-spin" />} Sign In
            </button>
          </>
        )}
      </form>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
        <div className="relative flex justify-center text-sm"><span className="px-2 bg-card text-muted-foreground">Or continue with</span></div>
      </div>

      <button type="button" onClick={handleGoogleLogin} disabled={googleLoading}
        className="w-full py-3 bg-secondary border border-border text-foreground rounded-xl font-semibold hover:bg-secondary/80 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 text-sm min-h-[44px]">
        {googleLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <GoogleIcon />}
        {googleLoading ? "Signing in…" : "Sign in with Google"}
      </button>

      <p className="text-center text-muted-foreground mt-6 text-sm">
        Don't have an account?{" "}
        <button onClick={onSwitchToSignUp} className="text-primary font-semibold hover:underline">Sign Up</button>
      </p>
    </>
  );
}

// ─────────────────────────────────────────────
// Main Auth Page
// ─────────────────────────────────────────────
const Auth = () => {
  const { user } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (user) navigate("/dashboard", { replace: true });
  }, [user, navigate]);

  return (
    <div className="min-h-screen flex bg-white">
      {/* ── Left column: form ── */}
      <div className="w-full md:w-1/2 flex flex-col items-center justify-center px-6 py-10 md:px-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
          <Link to="/" className="flex items-center gap-2 justify-center mb-8">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <Heart className="w-5 h-5 text-primary-foreground" fill="currentColor" />
            </div>
            <span className="font-display text-2xl font-bold text-foreground">Instant Blood Connect</span>
          </Link>

          <div className="bg-card rounded-2xl border border-border p-8 shadow-card overflow-hidden">
            {isSignUp
              ? <SignUpFlow onSwitchToSignIn={() => setIsSignUp(false)} />
              : <SignInForm onSwitchToSignUp={() => setIsSignUp(true)} />
            }
          </div>
        </motion.div>
      </div>

      {/* ── Right column: animation panel ── */}
      <div className="hidden md:flex w-1/2 items-center justify-center bg-white overflow-hidden" id="auth-animation-panel">
        <div className="relative flex items-center justify-center" style={{ width: 520, height: 520 }}>

          {/* Center Lottie */}
          <DotLottieReact
            src="/blood-donor.lottie"
            loop
            autoplay
            style={{ width: 380, height: 380, position: "relative", zIndex: 2 }}
          />

          {/* 8 icons orbiting — each absolutely centered, translated to radius, then rotated via CSS var */}
          {[
            { icon: "🩸", label: "Blood Drop",  angle: 0   },
            { icon: "🏥", label: "Hospital",    angle: 45  },
            { icon: "💉", label: "Syringe",     angle: 90  },
            { icon: "❤️", label: "Heart",       angle: 135 },
            { icon: "🧬", label: "DNA",         angle: 180 },
            { icon: "🩺", label: "Stethoscope", angle: 225 },
            { icon: "💊", label: "Medicine",    angle: 270 },
            { icon: "🫀", label: "Organ",       angle: 315 },
          ].map(({ icon, label, angle }) => (
            <div
              key={label}
              title={label}
              className="absolute flex items-center justify-center w-14 h-14 rounded-full bg-white shadow-md border border-red-100 text-2xl"
              style={{
                top: "50%",
                left: "50%",
                marginTop: -28,
                marginLeft: -28,
                transformOrigin: "28px 28px",
                animation: "orbit-icon 16s linear infinite",
                // start each icon at its initial angle
                animationDelay: `${-(angle / 360) * 16}s`,
                willChange: "transform",
              }}
            >
              {icon}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Auth;
