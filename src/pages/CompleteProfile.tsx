import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Heart, Droplets, Calendar, CheckCircle, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/db";
import { isEligible, nextEligibleDate, DONATION_GAP_DAYS } from "@/lib/eligibility";

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

export default function CompleteProfile() {
  const { user, refreshProfile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [bloodGroup, setBloodGroup] = useState("");
  const [lastDonated, setLastDonated] = useState("");
  const [neverDonated, setNeverDonated] = useState(false);
  const [saving, setSaving] = useState(false);

  // Preview eligibility as user picks a date
  const previewEligible = neverDonated || !lastDonated || isEligible(lastDonated);
  const previewNext = !neverDonated && lastDonated ? nextEligibleDate(lastDonated) : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bloodGroup) {
      toast({ title: "Please select your blood group", variant: "destructive" });
      return;
    }
    if (!user) return;

    setSaving(true);
    try {
      await db.users.update(user.id, {
        blood_group: bloodGroup,
        last_donated_at: neverDonated ? null : (lastDonated || null),
        is_profile_complete: true,
      } as any);
      await refreshProfile();
      toast({ title: "Profile completed!", description: "Welcome to Blood Connect." });
      navigate("/dashboard", { replace: true });
    } catch (err: any) {
      toast({ title: "Error saving profile", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Heart className="w-8 h-8 text-white" fill="currentColor" />
          </div>
          <h1 className="font-display text-2xl font-bold text-foreground">Complete Your Profile</h1>
          <p className="text-muted-foreground text-sm mt-2">
            We need a few details to match you with blood requests safely.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-card border border-border rounded-2xl p-6 shadow-soft space-y-6">

          {/* Blood Group */}
          <div>
            <label className="block text-sm font-semibold text-foreground mb-3">
              <Droplets className="inline w-4 h-4 mr-1.5 text-primary" />
              Your Blood Group *
            </label>
            <div className="grid grid-cols-4 gap-2">
              {BLOOD_GROUPS.map(g => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setBloodGroup(g)}
                  className={`py-3 rounded-xl text-sm font-bold transition-all border-2 ${
                    bloodGroup === g
                      ? "bg-primary text-primary-foreground border-primary shadow-md scale-105"
                      : "bg-secondary text-foreground border-transparent hover:border-primary/30"
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          {/* Last Donation Date */}
          <div>
            <label className="block text-sm font-semibold text-foreground mb-3">
              <Calendar className="inline w-4 h-4 mr-1.5 text-primary" />
              Last Blood Donation Date
            </label>

            {/* Never donated toggle */}
            <label className="flex items-center gap-3 cursor-pointer mb-3 p-3 bg-secondary rounded-xl">
              <input
                type="checkbox"
                checked={neverDonated}
                onChange={e => {
                  setNeverDonated(e.target.checked);
                  if (e.target.checked) setLastDonated("");
                }}
                className="w-4 h-4 accent-primary"
              />
              <span className="text-sm text-foreground">I have never donated blood before</span>
            </label>

            {!neverDonated && (
              <input
                type="date"
                value={lastDonated}
                max={new Date().toISOString().split("T")[0]}
                onChange={e => setLastDonated(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            )}

            {/* Eligibility preview */}
            {(lastDonated || neverDonated) && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className={`mt-3 p-3 rounded-xl text-sm font-medium flex items-start gap-2 ${
                  previewEligible
                    ? "bg-green-50 border border-green-200 text-green-700"
                    : "bg-orange-50 border border-orange-200 text-orange-700"
                }`}
              >
                <span className="text-base">{previewEligible ? "✅" : "⏳"}</span>
                <div>
                  {previewEligible
                    ? "You are currently eligible to donate blood."
                    : `Not yet eligible. Minimum ${DONATION_GAP_DAYS}-day gap required.`}
                  {previewNext && !previewEligible && (
                    <p className="text-xs mt-0.5 opacity-80">
                      Next eligible date: {previewNext.toLocaleDateString()}
                    </p>
                  )}
                </div>
              </motion.div>
            )}
          </div>

          {/* Info note */}
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">Why do we ask this?</span> Medical guidelines require a minimum {DONATION_GAP_DAYS}-day gap between donations to protect your health. We enforce this automatically.
          </div>

          <button
            type="submit"
            disabled={saving || !bloodGroup}
            className="w-full py-3.5 bg-primary text-primary-foreground rounded-xl font-display font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving
              ? <><Loader2 className="w-5 h-5 animate-spin" /> Saving…</>
              : <><CheckCircle className="w-5 h-5" /> Complete Profile</>
            }
          </button>
        </form>
      </motion.div>
    </div>
  );
}
