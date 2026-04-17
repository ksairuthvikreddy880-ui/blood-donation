import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, CheckCircle, Droplets, Phone } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/db";
import type { UrgencyLevel } from "@/integrations/supabase/types";
import LocationPicker from "./LocationPicker";
import type { LocationResult } from "@/hooks/useLocation";

interface RequestBloodModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

const RequestBloodModal = ({ isOpen, onClose }: RequestBloodModalProps) => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const [form, setForm] = useState({
    bloodGroup: "",
    urgency: "urgent" as UrgencyLevel,
    units: 1,
    hospitalName: "",
    phone: "",
    city: "",
    pincode: "",
    notes: "",
    latitude: null as number | null,
    longitude: null as number | null,
  });

  // Auto-fill phone from profile
  useEffect(() => {
    if (profile?.phone) {
      setForm(f => ({ ...f, phone: profile.phone ?? "" }));
    }
  }, [profile?.phone]);

  const handleLocationDetected = (loc: LocationResult) => {
    setForm(f => ({
      ...f,
      latitude: loc.lat,
      longitude: loc.lon,
      city: loc.city || f.city,
      pincode: loc.pincode || f.pincode,
    }));
  };

  const validatePhone = (p: string) => /^[+\d][\d\s\-]{8,14}$/.test(p.trim());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.bloodGroup) {
      toast({ title: "Select a blood group", variant: "destructive" });
      return;
    }
    if (!form.phone.trim()) {
      toast({ title: "Phone number required", description: "Donors need your number to contact you via WhatsApp.", variant: "destructive" });
      return;
    }
    if (!validatePhone(form.phone)) {
      toast({ title: "Invalid phone number", description: "Enter a valid number with country code e.g. +91XXXXXXXXXX", variant: "destructive" });
      return;
    }
    if (!user) {
      toast({ title: "Please sign in first", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const request = await db.requests.create({
        user_id: user.id,
        blood_group: form.bloodGroup,
        urgency: form.urgency,
        units_needed: form.units,
        hospital_name: form.hospitalName || undefined,
        location: form.city || undefined,
        latitude: form.latitude,
        longitude: form.longitude,
        notes: form.notes || undefined,
        requester_phone: form.phone.trim(),
      } as any);

      // Match & notify available donors
      const matches = await db.matches.createForRequest(request.id, form.bloodGroup);
      await Promise.all(
        matches.map((m: any) =>
          db.notifications.create({
            user_id: m.donor_id,
            title: `🩸 ${form.urgency === "critical" ? "🚨 Critical" : "New"} Blood Request`,
            message: `${form.bloodGroup} blood needed${form.city ? ` in ${form.city}` : ""}.`,
            type: "match",
            request_id: request.id,
          })
        )
      );

      setSuccess(true);
      toast({ title: "Request submitted!", description: `${matches.length} donor(s) notified.` });
      setTimeout(() => {
        setSuccess(false);
        onClose();
        setForm({ bloodGroup: "", urgency: "urgent", units: 1, hospitalName: "", phone: profile?.phone ?? "", city: "", pincode: "", notes: "", latitude: null, longitude: null });
      }, 2000);
    } catch (err: any) {
      toast({ title: "Request failed", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-card border border-border rounded-2xl w-full max-w-md shadow-elevated flex flex-col max-h-[90vh]"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-border flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Droplets className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="font-display text-xl font-bold text-foreground">Request Blood</h2>
                  <p className="text-xs text-muted-foreground">Donors will be notified instantly</p>
                </div>
              </div>
              <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-2">
                <X className="w-5 h-5" />
              </button>
            </div>

            {success ? (
              <div className="p-12 text-center">
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring" }}>
                  <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                </motion.div>
                <h3 className="font-display text-xl font-bold text-foreground mb-2">Request Sent!</h3>
                <p className="text-muted-foreground text-sm">Nearby donors have been notified.</p>
              </div>
            ) : (
              <div className="overflow-y-auto flex-1">
                <form onSubmit={handleSubmit} className="p-6 space-y-4">

                  {/* Blood group chips */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Blood Group Needed *</label>
                    <div className="grid grid-cols-4 gap-2">
                      {BLOOD_GROUPS.map(g => (
                        <button key={g} type="button"
                          onClick={() => setForm(f => ({ ...f, bloodGroup: g }))}
                          className={`py-2.5 rounded-xl text-sm font-bold transition-colors ${
                            form.bloodGroup === g
                              ? "bg-primary text-primary-foreground"
                              : "bg-secondary text-foreground hover:bg-secondary/80"
                          }`}>
                          {g}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Phone — mandatory */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">
                      Your Phone Number * <span className="text-xs text-muted-foreground font-normal">(for WhatsApp contact)</span>
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input
                        type="tel"
                        value={form.phone}
                        onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                        placeholder="+91 XXXXX XXXXX"
                        required
                        className={`w-full pl-10 pr-4 py-2.5 rounded-xl bg-secondary border text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring ${
                          form.phone && !validatePhone(form.phone) ? "border-red-400" : "border-border"
                        }`}
                      />
                    </div>
                    {form.phone && !validatePhone(form.phone) && (
                      <p className="text-xs text-red-500 mt-1">Enter a valid number e.g. +91XXXXXXXXXX</p>
                    )}
                    {profile?.phone && form.phone === profile.phone && (
                      <p className="text-xs text-green-600 mt-1">✓ Auto-filled from your profile</p>
                    )}
                  </div>

                  {/* Urgency + Units */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1.5">Urgency</label>
                      <select value={form.urgency} onChange={e => setForm(f => ({ ...f, urgency: e.target.value as UrgencyLevel }))}
                        className="w-full px-3 py-2.5 rounded-xl bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                        <option value="normal">Normal</option>
                        <option value="urgent">Urgent</option>
                        <option value="critical">Critical 🚨</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1.5">Units Needed</label>
                      <input type="number" min={1} max={10} value={form.units}
                        onChange={e => setForm(f => ({ ...f, units: parseInt(e.target.value) || 1 }))}
                        className="w-full px-3 py-2.5 rounded-xl bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                    </div>
                  </div>

                  {/* Hospital */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">Hospital Name</label>
                    <input type="text" value={form.hospitalName} placeholder="e.g. Apollo Hospitals"
                      onChange={e => setForm(f => ({ ...f, hospitalName: e.target.value }))}
                      className="w-full px-3 py-2.5 rounded-xl bg-secondary border border-border text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                  </div>

                  {/* Location */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">Location</label>
                    <LocationPicker
                      onDetected={handleLocationDetected}
                      city={form.city}
                      pincode={form.pincode}
                      onCityChange={v => setForm(f => ({ ...f, city: v }))}
                      onPincodeChange={v => setForm(f => ({ ...f, pincode: v }))}
                    />
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">Additional Notes</label>
                    <textarea value={form.notes} rows={2} placeholder="Patient name, ward number, etc."
                      onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                      className="w-full px-3 py-2.5 rounded-xl bg-secondary border border-border text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none" />
                  </div>

                  <button type="submit" disabled={loading || !form.bloodGroup || !form.phone.trim()}
                    className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-display font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2">
                    {loading && <Loader2 className="w-5 h-5 animate-spin" />}
                    {loading ? "Submitting…" : "Submit Blood Request"}
                  </button>
                </form>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default RequestBloodModal;
