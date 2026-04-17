import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { User, X, Edit2, Save, Loader2, Droplets, Phone, MapPin, Calendar, LogOut, CheckCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/db";
import { useNavigate } from "react-router-dom";

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

export default function ProfilePanel() {
  const { user, profile, signOut, refreshProfile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const [form, setForm] = useState({
    full_name: "", phone: "", city: "", blood_group: "", role: "donor",
  });

  useEffect(() => {
    if (profile) {
      setForm({
        full_name: profile.full_name ?? "",
        phone: profile.phone ?? "",
        city: profile.city ?? "",
        blood_group: profile.blood_group ?? "",
        role: profile.role ?? "donor",
      });
    }
  }, [profile]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await db.users.update(user.id, {
        full_name: form.full_name,
        phone: form.phone || null,
        city: form.city || null,
        blood_group: form.blood_group || null,
        role: form.role as any,
      });
      await refreshProfile();
      setEditing(false);
      toast({ title: "Profile saved!" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally { setSaving(false); }
  };

  const handleSignOut = async () => {
    await signOut();
    setOpen(false);
    navigate("/");
  };

  const initials = profile?.full_name
    ? profile.full_name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2)
    : user?.email?.[0]?.toUpperCase() ?? "?";

  return (
    <div className="relative" ref={panelRef}>
      {/* Avatar button */}
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-center w-9 h-9 rounded-full bg-primary text-primary-foreground font-display font-bold text-sm hover:opacity-90 transition-opacity ring-2 ring-primary/20"
        title="Profile"
      >
        {initials}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -8 }}
            transition={{ duration: 0.18 }}
            className="absolute right-0 top-12 w-80 bg-card border border-border rounded-2xl shadow-elevated z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="bg-primary/5 px-5 py-4 flex items-center justify-between border-b border-border">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-display font-bold text-lg">
                  {initials}
                </div>
                <div>
                  <p className="font-display font-semibold text-foreground text-sm">
                    {profile?.full_name || "Set your name"}
                  </p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                  {profile?.blood_group && (
                    <span className="inline-block mt-1 px-2 py-0.5 bg-primary text-primary-foreground text-xs font-bold rounded-full">
                      {profile.blood_group}
                    </span>
                  )}
                </div>
              </div>
              <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground p-1">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="p-5">
              {!editing ? (
                <>
                  <div className="space-y-3 mb-5">
                    {[
                      { icon: User,     label: "Name",        value: profile?.full_name },
                      { icon: Droplets, label: "Blood Group", value: profile?.blood_group },
                      { icon: Phone,    label: "Phone",       value: profile?.phone },
                      { icon: MapPin,   label: "City",        value: profile?.city },
                      { icon: User,     label: "Role",        value: profile?.role },
                    ].map(({ icon: Icon, label, value }) => (
                      <div key={label} className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
                          <Icon className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">{label}</p>
                          <p className="text-sm font-medium text-foreground">{value || "—"}</p>
                        </div>
                      </div>
                    ))}
                    {profile?.last_donated_at && (
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Last Donated</p>
                          <p className="text-sm font-medium text-foreground">
                            {new Date(profile.last_donated_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => setEditing(true)}
                    className="w-full flex items-center justify-center gap-2 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity mb-2"
                  >
                    <Edit2 className="w-4 h-4" /> Edit Profile
                  </button>
                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center justify-center gap-2 py-2.5 border border-border text-foreground rounded-xl text-sm font-medium hover:bg-secondary transition-colors"
                  >
                    <LogOut className="w-4 h-4" /> Sign Out
                  </button>
                </>
              ) : (
                <>
                  <div className="space-y-3 mb-4">
                    <div>
                      <label className="block text-xs font-medium text-foreground mb-1">Full Name</label>
                      <input value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-foreground mb-1">Blood Group</label>
                      <select value={form.blood_group} onChange={e => setForm({ ...form, blood_group: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                        <option value="">Select</option>
                        {BLOOD_GROUPS.map(g => <option key={g} value={g}>{g}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-foreground mb-1">Phone</label>
                      <input type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-foreground mb-1">City</label>
                      <input value={form.city} onChange={e => setForm({ ...form, city: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-foreground mb-1">Role</label>
                      <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                        <option value="donor">Donor</option>
                        <option value="requester">Requester</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button onClick={() => setEditing(false)}
                      className="flex-1 py-2.5 border border-border rounded-xl text-sm font-medium hover:bg-secondary transition-colors">
                      Cancel
                    </button>
                    <button onClick={handleSave} disabled={saving}
                      className="flex-1 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2">
                      {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      Save
                    </button>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
