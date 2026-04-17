import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Building2, Droplets, LogOut, Save, Loader2,
  CheckCircle, RefreshCw, Heart,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"];

interface Hospital { id: string; name: string; address: string; city: string; phone: string; }
interface InventoryRow { id: string; blood_group: string; units: number; is_available: boolean; updated_at: string; }

export default function HospitalDashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [hospital, setHospital] = useState<Hospital | null>(null);
  const [inventory, setInventory] = useState<Record<string, InventoryRow>>({});
  const [edits, setEdits] = useState<Record<string, { units: number; is_available: boolean }>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/hospital-login"); return; }

      // Get hospital via staff record
      const { data: staff } = await (supabase as any)
        .from("hospital_staff")
        .select("hospital_id")
        .eq("auth_id", user.id)
        .single();

      if (!staff) { navigate("/hospital-login"); return; }

      const { data: hosp } = await (supabase as any)
        .from("hospitals")
        .select("*")
        .eq("id", staff.hospital_id)
        .single();

      setHospital(hosp);

      const { data: inv } = await (supabase as any)
        .from("blood_inventory")
        .select("*")
        .eq("hospital_id", staff.hospital_id);

      const invMap: Record<string, InventoryRow> = {};
      const editMap: Record<string, { units: number; is_available: boolean }> = {};
      (inv ?? []).forEach((row: InventoryRow) => {
        invMap[row.blood_group] = row;
        editMap[row.blood_group] = { units: row.units, is_available: row.is_available };
      });
      setInventory(invMap);
      setEdits(editMap);
    } catch (err: any) {
      toast({ title: "Error loading data", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!hospital) return;
    setSaving(true);
    try {
      const updates = BLOOD_GROUPS.map(bg => ({
        hospital_id: hospital.id,
        blood_group: bg,
        units: edits[bg]?.units ?? 0,
        is_available: edits[bg]?.is_available ?? false,
      }));

      const { error } = await (supabase as any)
        .from("blood_inventory")
        .upsert(updates, { onConflict: "hospital_id,blood_group" });

      if (error) throw error;

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      toast({ title: "✅ Blood inventory updated successfully!" });
      loadData();
    } catch (err: any) {
      toast({ title: "Save failed", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const markAllAvailable = () => {
    const updated = { ...edits };
    BLOOD_GROUPS.forEach(bg => { updated[bg] = { ...updated[bg], is_available: true }; });
    setEdits(updated);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/hospital-login");
  };

  const timeAgo = (dateStr: string) => {
    const mins = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="loader"><div className="loader-square"/><div className="loader-square"/><div className="loader-square"/><div className="loader-square"/><div className="loader-square"/><div className="loader-square"/><div className="loader-square"/></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white border-b border-border sticky top-0 z-40">
        <div className="container max-w-6xl mx-auto flex items-center justify-between h-16 px-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Heart className="w-4 h-4 text-white" fill="currentColor" />
            </div>
            <div>
              <p className="font-display font-bold text-foreground text-sm leading-tight">
                {hospital?.name ?? "Hospital Panel"}
              </p>
              <p className="text-xs text-muted-foreground">{hospital?.city}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={loadData} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <RefreshCw className="w-4 h-4" /> Refresh
            </button>
            <button onClick={handleSignOut} className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <LogOut className="w-4 h-4" /> Sign Out
            </button>
          </div>
        </div>
      </nav>

      <div className="container max-w-6xl mx-auto px-4 py-8">

        {/* Hospital info card */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-border rounded-2xl p-6 shadow-soft mb-8">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-blue-100 flex items-center justify-center flex-shrink-0">
              <Building2 className="w-7 h-7 text-blue-600" />
            </div>
            <div className="flex-1">
              <h1 className="font-display text-2xl font-bold text-foreground">{hospital?.name}</h1>
              <p className="text-muted-foreground text-sm mt-0.5">{hospital?.address}, {hospital?.city}</p>
              <p className="text-muted-foreground text-sm">📞 {hospital?.phone}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={markAllAvailable}
                className="px-4 py-2 bg-green-100 text-green-700 rounded-xl text-sm font-medium hover:bg-green-200 transition-colors">
                Mark All Available
              </button>
            </div>
          </div>
        </motion.div>

        {/* Blood inventory grid */}
        <div className="mb-6">
          <h2 className="font-display text-xl font-bold text-foreground mb-1">Blood Inventory</h2>
          <p className="text-sm text-muted-foreground mb-5">
            Update units and availability. Changes are saved when you click "Save Inventory".
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {BLOOD_GROUPS.map((bg, idx) => {
              const row = inventory[bg];
              const edit = edits[bg] ?? { units: 0, is_available: false };
              const isAvail = edit.is_available;

              return (
                <motion.div key={bg}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.04 }}
                  className={`bg-white border-2 rounded-2xl p-4 shadow-soft transition-colors ${
                    isAvail ? "border-green-300" : "border-gray-200"
                  }`}>

                  {/* Blood group + status */}
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-display font-bold text-3xl text-primary">{bg}</span>
                    <button
                      onClick={() => setEdits(prev => ({
                        ...prev,
                        [bg]: { ...prev[bg], is_available: !prev[bg]?.is_available }
                      }))}
                      className={`w-6 h-6 rounded-full border-2 transition-colors ${
                        isAvail ? "bg-green-500 border-green-500" : "bg-gray-200 border-gray-300"
                      }`}
                      title={isAvail ? "Available — click to toggle" : "Unavailable — click to toggle"}
                    />
                  </div>

                  {/* Units input */}
                  <div className="mb-2">
                    <label className="block text-xs text-muted-foreground mb-1">Units</label>
                    <input
                      type="number" min={0} max={9999}
                      value={edit.units}
                      onChange={e => setEdits(prev => ({
                        ...prev,
                        [bg]: { ...prev[bg], units: Math.max(0, parseInt(e.target.value) || 0) }
                      }))}
                      className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-border text-foreground text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-ring text-center"
                    />
                  </div>

                  {/* Status label */}
                  <div className={`text-center text-xs font-semibold py-1 rounded-lg ${
                    isAvail ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                  }`}>
                    {isAvail ? "🟢 Available" : "🔴 Unavailable"}
                  </div>

                  {/* Last updated */}
                  {row?.updated_at && (
                    <p className="text-xs text-muted-foreground text-center mt-1.5">
                      Updated {timeAgo(row.updated_at)}
                    </p>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Save button */}
        <div className="flex justify-end">
          <button onClick={handleSave} disabled={saving}
            className="flex items-center gap-2 px-8 py-3 bg-primary text-primary-foreground rounded-xl font-display font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 text-base">
            {saving
              ? <><Loader2 className="w-5 h-5 animate-spin" /> Saving…</>
              : saved
              ? <><CheckCircle className="w-5 h-5" /> Saved!</>
              : <><Save className="w-5 h-5" /> Save Inventory</>}
          </button>
        </div>
      </div>
    </div>
  );
}
