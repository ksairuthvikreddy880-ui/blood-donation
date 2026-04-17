import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Heart, MapPin, Clock, Droplets, ArrowLeft, Loader2, CheckCircle, XCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/db";
import { supabase } from "@/integrations/supabase/client";
import type { BloodRequest } from "@/integrations/supabase/types";

type Filter = "all" | "pending" | "accepted" | "fulfilled";

const URGENCY_STYLE: Record<string, string> = {
  critical: "bg-red-100 text-red-700",
  urgent:   "bg-orange-100 text-orange-700",
  normal:   "bg-blue-100 text-blue-700",
};

const STATUS_STYLE: Record<string, string> = {
  pending:   "bg-yellow-100 text-yellow-700",
  accepted:  "bg-blue-100 text-blue-700",
  fulfilled: "bg-green-100 text-green-700",
  cancelled: "bg-gray-100 text-gray-600",
  expired:   "bg-gray-100 text-gray-500",
};

export default function BloodRequests() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [requests, setRequests] = useState<BloodRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("all");
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [myMatchIds, setMyMatchIds] = useState<Set<string>>(new Set());

  const load = async () => {
    setLoading(true);
    const data = await db.requests.listAll();
    setRequests(data);
    setLoading(false);
  };

  const loadMyMatches = async () => {
    if (!user) return;
    const matches = await db.matches.forDonor(user.id);
    setMyMatchIds(new Set(matches.map((m: any) => m.request_id)));
  };

  useEffect(() => {
    load();
    loadMyMatches();

    // Realtime subscription
    const channel = supabase.channel("all-requests")
      .on("postgres_changes", { event: "*", schema: "public", table: "requests" }, () => load())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const handleAccept = async (requestId: string, bloodGroup: string) => {
    if (!user) return;
    setAcceptingId(requestId);
    try {
      // Find or create match
      const { data: existing } = await (supabase as any)
        .from("matches").select("id").eq("request_id", requestId).eq("donor_id", user.id).single();

      if (existing) {
        await db.matches.accept(existing.id, requestId, user.id);
      } else {
        const { data: newMatch } = await (supabase as any)
          .from("matches").insert({ request_id: requestId, donor_id: user.id, status: "pending" })
          .select().single();
        if (newMatch) await db.matches.accept(newMatch.id, requestId, user.id);
      }

      toast({ title: "Request accepted!", description: "The requester has been notified." });
      setMyMatchIds((prev) => new Set([...prev, requestId]));
      load();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally { setAcceptingId(null); }
  };

  const filtered = requests.filter((r) => filter === "all" || r.status === filter);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/90 backdrop-blur-xl border-b border-border/50">
        <div className="container max-w-6xl mx-auto flex items-center justify-between h-16 px-4">
          <div className="flex items-center gap-3">
            <Link to="/dashboard" className="text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <Heart className="w-4 h-4 text-primary-foreground" fill="currentColor" />
              </div>
              <span className="font-display text-lg font-bold text-foreground">Blood Requests</span>
            </div>
          </div>
          <span className="text-sm text-muted-foreground">{filtered.length} request{filtered.length !== 1 ? "s" : ""}</span>
        </div>
      </div>

      <div className="container max-w-6xl mx-auto px-4 py-6">
        {/* Filters */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {(["all", "pending", "accepted", "fulfilled"] as Filter[]).map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors capitalize ${
                filter === f ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground hover:bg-secondary/80"
              }`}>{f}</button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <Droplets className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No {filter !== "all" ? filter : ""} requests found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map((req) => {
              const isOwn = req.user_id === user?.id;
              const alreadyAccepted = myMatchIds.has(req.id);
              const notes = (() => { try { return JSON.parse(req.notes ?? "{}"); } catch { return {}; } })();

              return (
                <div key={req.id} className="bg-card border border-border rounded-2xl p-5 shadow-soft">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${URGENCY_STYLE[req.urgency] ?? "bg-gray-100 text-gray-600"}`}>
                        {req.urgency.toUpperCase()}
                      </span>
                      <p className="font-display font-bold text-3xl text-primary mt-1">{req.blood_group}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full font-semibold ${STATUS_STYLE[req.status] ?? "bg-gray-100 text-gray-600"}`}>
                      {req.status}
                    </span>
                  </div>

                  <div className="space-y-1 text-sm text-muted-foreground mb-4">
                    {req.hospital_name && <p>🏥 {req.hospital_name}</p>}
                    {req.location && <p className="flex items-center gap-1"><MapPin className="w-3 h-3" />{req.location}</p>}
                    {notes.patientName && <p>👤 Patient: {notes.patientName}</p>}
                    {notes.contactPhone && <p>📞 {notes.contactPhone}</p>}
                    <p className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />{new Date(req.created_at).toLocaleString()}
                    </p>
                    <p>Units: {req.units_fulfilled}/{req.units_needed}</p>
                  </div>

                  {!isOwn && req.status === "pending" && (
                    <button
                      onClick={() => handleAccept(req.id, req.blood_group)}
                      disabled={alreadyAccepted || acceptingId === req.id}
                      className={`w-full py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-colors ${
                        alreadyAccepted
                          ? "bg-green-100 text-green-700 cursor-default"
                          : "bg-primary text-primary-foreground hover:opacity-90"
                      } disabled:opacity-60`}
                    >
                      {acceptingId === req.id ? <Loader2 className="w-4 h-4 animate-spin" /> :
                       alreadyAccepted ? <><CheckCircle className="w-4 h-4" /> Accepted</> :
                       <><CheckCircle className="w-4 h-4" /> Accept Request</>}
                    </button>
                  )}
                  {isOwn && (
                    <p className="text-xs text-center text-muted-foreground py-2">Your request</p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
