import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Heart, User, Droplets, Phone, MapPin, Save, Loader2,
  LogOut, ArrowLeft, CheckCircle, ToggleLeft, ToggleRight, Calendar,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/db";
import { supabase } from "@/integrations/supabase/client";
import { isEligible, nextEligibleDate, daysUntilEligible } from "@/lib/eligibility";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

export default function Profile() {
  const { user, profile, signOut, refreshProfile, loading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [togglingAvail, setTogglingAvail] = useState(false);
  const [isAvailable, setIsAvailable] = useState(false);

  const [form, setForm] = useState({
    full_name: "",
    phone: "",
    city: "",
    blood_group: "",
    role: "donor",
    last_donated_at: "",
  });

  useEffect(() => {
    if (loading) return;
    if (!user) { navigate("/auth"); return; }
    if (profile) {
      setForm({
        full_name: profile.full_name ?? "",
        phone: profile.phone ?? "",
        city: profile.city ?? "",
        blood_group: profile.blood_group ?? "",
        role: profile.role ?? "donor",
        last_donated_at: profile.last_donated_at ? profile.last_donated_at.split("T")[0] : "",
      });
      setIsAvailable(profile.is_available ?? false);
    }
  }, [profile, user, loading]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    try {
      await db.users.update(user.id, {
        full_name: form.full_name,
        phone: form.phone || null,
        city: form.city || null,
        blood_group: form.blood_group || null,
        role: form.role as any,
        last_donated_at: form.last_donated_at || null,
      });
      await refreshProfile();
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
      toast({ title: "Profile updated!" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally { setSaving(false); }
  };

  const handleToggleAvailability = async () => {
    if (!user) return;
    const newVal = !isAvailable;
    setIsAvailable(newVal); // optimistic update
    setTogglingAvail(true);
    try {
      const { error } = await (supabase as any)
        .from("users")
        .update({ is_available: newVal, updated_at: new Date().toISOString() })
        .eq("auth_id", user.id);
      if (error) throw error;
      await refreshProfile();
      toast({ title: `You are now ${newVal ? "available ✅" : "unavailable"} for donations` });
    } catch (err: any) {
      setIsAvailable(!newVal); // revert on error
      toast({ title: "Error saving availability", description: err.message, variant: "destructive" });
    } finally { setTogglingAvail(false); }
  };

  const initials = profile?.full_name
    ? profile.full_name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2)
    : user?.email?.[0]?.toUpperCase() ?? "?";

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="loader"><div className="loader-square"/><div className="loader-square"/><div className="loader-square"/><div className="loader-square"/><div className="loader-square"/><div className="loader-square"/><div className="loader-square"/></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-white">

      {/* ── Left: Profile Form ── */}
      <div className="w-full md:w-1/2 flex flex-col px-6 py-8 md:px-12 overflow-y-auto">

        {/* Top nav */}
        <div className="flex items-center justify-between mb-8">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
              <Heart className="w-4 h-4 text-primary-foreground" fill="currentColor" />
            </div>
            <span className="font-display text-lg font-bold text-foreground">Instant Blood Connect</span>
          </Link>
          <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
        </div>

        {/* Avatar + name */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-4 mb-8">
          <div className="w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-display font-bold text-2xl shadow-emergency">
            {initials}
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">
              {profile?.full_name || "Your Profile"}
            </h1>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
            <div className="flex items-center gap-2 mt-1">
              {profile?.blood_group && (
                <span className="px-2 py-0.5 bg-primary text-primary-foreground text-xs font-bold rounded-full">
                  {profile.blood_group}
                </span>
              )}
              <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                isAvailable ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
              }`}>
                {isAvailable ? "Available" : "Unavailable"}
              </span>
            </div>
          </div>
        </motion.div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          {[
            { label: "Blood Credits", value: profile?.blood_credits ?? 0 },
            { label: "Role", value: profile?.role ?? "donor" },
            { label: "Last Donated", value: profile?.last_donated_at ? new Date(profile.last_donated_at).toLocaleDateString() : "Never" },
          ].map(({ label, value }) => (
            <div key={label} className="bg-secondary rounded-xl p-3 text-center">
              <p className="font-display font-bold text-foreground text-lg">{value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* Eligibility status */}
        {(() => {
          const eligible = isEligible(profile?.last_donated_at);
          const next = nextEligibleDate(profile?.last_donated_at);
          const days = daysUntilEligible(profile?.last_donated_at);
          return (
            <div className={`flex items-center gap-3 p-3 rounded-xl mb-6 text-sm font-medium ${
              eligible
                ? "bg-green-50 border border-green-200 text-green-700"
                : "bg-orange-50 border border-orange-200 text-orange-700"
            }`}>
              <span className="text-xl">{eligible ? "✅" : "⏳"}</span>
              <div>
                {eligible
                  ? "You are eligible to donate blood."
                  : `Not eligible yet — ${days} day${days !== 1 ? "s" : ""} remaining.`}
                {next && !eligible && (
                  <p className="text-xs mt-0.5 opacity-80">
                    Next eligible date: {next.toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>
          );
        })()}

        {/* Edit form */}
        <form onSubmit={handleSave} className="space-y-4">
          <h2 className="font-display text-lg font-semibold text-foreground">Edit Details</h2>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Full Name</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input type="text" value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })}
                placeholder="Your full name"
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Blood Group</label>
            <div className="relative">
              <Droplets className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <select value={form.blood_group} onChange={e => setForm({ ...form, blood_group: e.target.value })}
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm appearance-none">
                <option value="">Select blood group</option>
                {BLOOD_GROUPS.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Last Donation Date <span className="text-xs text-muted-foreground font-normal">(leave blank if never donated)</span>
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="date"
                value={form.last_donated_at}
                max={new Date().toISOString().split("T")[0]}
                onChange={e => setForm({ ...form, last_donated_at: e.target.value })}
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Phone Number</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
                placeholder="+91 XXXXX XXXXX"
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">City</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input type="text" value={form.city} onChange={e => setForm({ ...form, city: e.target.value })}
                placeholder="Your city"
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm" />
            </div>
          </div>

          {/* Location detect — saves lat/lon for ETA calculation */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Your Location <span className="text-xs text-muted-foreground font-normal">(required for ETA & donor matching)</span>
            </label>
            <button type="button"
              onClick={async () => {
                if (!navigator.geolocation || !user) return;
                navigator.geolocation.getCurrentPosition(async (pos) => {
                  const { latitude: lat, longitude: lon } = pos.coords;
                  // Reverse geocode
                  try {
                    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`, { headers: { "Accept-Language": "en" } });
                    const data = await res.json();
                    const city = data.address?.city || data.address?.town || data.address?.village || "";
                    setForm(f => ({ ...f, city: city || f.city }));
                  } catch {}
                  // Save to DB
                  await (supabase as any).from("users")
                    .update({ latitude: lat, longitude: lon, updated_at: new Date().toISOString() })
                    .eq("auth_id", user.id);
                  await refreshProfile();
                  toast({ title: "📍 Location saved!", description: "Your coordinates are now stored for ETA calculation." });
                }, () => toast({ title: "Location denied", variant: "destructive" }), { enableHighAccuracy: true });
              }}
              className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 text-sm font-medium transition-colors ${
                profile?.latitude ? "border-green-500 bg-green-50 text-green-700" : "border-primary/30 bg-primary/5 text-primary hover:bg-primary/10"
              }`}>
              <MapPin className="w-4 h-4" />
              {profile?.latitude ? `✓ Location saved (${profile.latitude?.toFixed(4)}, ${profile.longitude?.toFixed(4)})` : "Detect & Save My Location"}
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Role</label>
            <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}
              className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm">
              <option value="donor">Donor</option>
              <option value="requester">Requester</option>
            </select>
          </div>

          <div className="flex items-center justify-between p-4 bg-secondary rounded-xl">
            <div>
              <p className="text-sm font-medium text-foreground">Available for Donations</p>
              <p className="text-xs text-muted-foreground">Toggle to appear in donor search</p>
            </div>
            <button type="button" onClick={handleToggleAvailability} disabled={togglingAvail}
              className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${isAvailable ? "bg-green-500" : "bg-gray-300"}`}>
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${isAvailable ? "translate-x-6" : "translate-x-0"}`} />
            </button>
          </div>

          <button type="submit" disabled={saving}
            className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-display font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2">
            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : saved ? <CheckCircle className="w-5 h-5" /> : <Save className="w-5 h-5" />}
            {saving ? "Saving…" : saved ? "Saved!" : "Save Changes"}
          </button>
        </form>

        {/* Sign out */}
        <button onClick={async () => { await signOut(); navigate("/"); }}
          className="mt-4 w-full py-3 border border-border text-foreground rounded-xl font-medium text-sm hover:bg-secondary transition-colors flex items-center justify-center gap-2">
          <LogOut className="w-4 h-4" /> Sign Out
        </button>
      </div>

      {/* ── Right: Animation panel ── */}
      <div className="hidden md:flex w-1/2 items-center justify-center bg-white relative overflow-hidden">
        <div className="relative flex items-center justify-center" style={{ width: 520, height: 520 }}>
          <DotLottieReact src="/blood-donor.lottie" loop autoplay
            style={{ width: 380, height: 380, position: "relative", zIndex: 2 }} />
          {[
            { icon: "🩸", delay: "0s" },
            { icon: "🏥", delay: "-2s" },
            { icon: "💉", delay: "-4s" },
            { icon: "❤️", delay: "-6s" },
            { icon: "🧬", delay: "-8s" },
            { icon: "🩺", delay: "-10s" },
            { icon: "💊", delay: "-12s" },
            { icon: "🫀", delay: "-14s" },
          ].map(({ icon, delay }, i) => (
            <div key={i} className="absolute flex items-center justify-center w-14 h-14 rounded-full bg-white shadow-md border border-red-100 text-2xl"
              style={{ top: "50%", left: "50%", marginTop: -28, marginLeft: -28,
                animation: "orbit-icon 16s linear infinite", animationDelay: delay, willChange: "transform" }}>
              {icon}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
