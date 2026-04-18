import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import {
  ArrowLeft, Heart, Droplets, MapPin, Phone, Clock,
  Building2, Navigation, ExternalLink, CheckCircle,
  AlertTriangle, User, RefreshCw, MessageCircle,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface RequestData {
  id: string;
  blood_group: string;
  urgency: string;
  status: string;
  units_needed: number;
  units_fulfilled: number;
  hospital_name: string | null;
  location: string | null;
  latitude: number | null;
  longitude: number | null;
  notes: string | null;
  requester_phone: string | null;
  eta_minutes: number | null;
  distance_km: number | null;
  accepted_by: string | null;
  donor_id: string | null;
  created_at: string;
  updated_at: string;
}

interface DonorInfo {
  full_name: string;
  phone: string | null;
  blood_group: string | null;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
}

const URGENCY_COLOR: Record<string, string> = {
  critical: "bg-red-100 text-red-700 border-red-300",
  urgent:   "bg-orange-100 text-orange-700 border-orange-300",
  normal:   "bg-blue-100 text-blue-700 border-blue-300",
};

const STATUS_COLOR: Record<string, string> = {
  pending:   "bg-yellow-100 text-yellow-700",
  accepted:  "bg-green-100 text-green-700",
  fulfilled: "bg-blue-100 text-blue-700",
  cancelled: "bg-gray-100 text-gray-500",
  expired:   "bg-gray-100 text-gray-400",
};

export default function RequestDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [request, setRequest] = useState<RequestData | null>(null);
  const [donor, setDonor] = useState<DonorInfo | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const { data: req, error } = await (supabase as any)
        .from("requests").select("*").eq("id", id).single();
      if (error) throw error;

      // Always check matches table regardless of status
      const { data: matches } = await (supabase as any)
        .from("matches")
        .select("donor_id, status")
        .eq("request_id", id)
        .order("created_at", { ascending: false });

      // Find accepted match
      const acceptedMatch = matches?.find((m: any) =>
        ["accepted", "completed", "pending"].includes(m.status)
      );

      // Determine donor auth id from all sources
      const donorAuthId = req.accepted_by || req.donor_id || acceptedMatch?.donor_id;

      // If matches exist but request still shows pending, treat as accepted
      const effectiveStatus = (acceptedMatch && req.status === "pending")
        ? "accepted"
        : req.status;

      setRequest({ ...req, status: effectiveStatus });

      if (donorAuthId) {
        // Try auth_id
        let { data: d } = await (supabase as any)
          .from("users")
          .select("full_name, phone, blood_group, city, latitude, longitude")
          .eq("auth_id", donorAuthId)
          .single();

        // Fallback: try id column
        if (!d) {
          const res = await (supabase as any)
            .from("users")
            .select("full_name, phone, blood_group, city, latitude, longitude")
            .eq("id", donorAuthId)
            .single();
          d = res.data;
        }

        console.log("Donor found:", d);
        setDonor(d ?? null);

        // Calculate ETA on the fly from coordinates
        if (d?.latitude && d?.longitude && req.latitude && req.longitude) {
          const R = 6371;
          const dLat = ((d.latitude - req.latitude) * Math.PI) / 180;
          const dLon = ((d.longitude - req.longitude) * Math.PI) / 180;
          const a = Math.sin(dLat/2)**2 +
            Math.cos(req.latitude * Math.PI/180) * Math.cos(d.latitude * Math.PI/180) *
            Math.sin(dLon/2)**2;
          const distKm = Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)) * 10) / 10;
          const etaMins = Math.round((distKm / 30) * 60);
          setRequest((prev: any) => prev ? {
            ...prev,
            status: effectiveStatus,
            distance_km: prev.distance_km ?? distKm,
            eta_minutes: prev.eta_minutes ?? etaMins,
          } : prev);
        }

        // Sync DB status if mismatch
        if (d && req.status === "pending") {
          await (supabase as any)
            .from("requests")
            .update({ status: "accepted", accepted_by: donorAuthId, updated_at: new Date().toISOString() })
            .eq("id", id);
        }
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // Realtime
    const channel = (supabase as any).channel(`req-detail-${id}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "requests", filter: `id=eq.${id}` },
        () => load())
      .subscribe();
    return () => { (supabase as any).removeChannel(channel); };
  }, [id]);

  const parseNotes = (n: string | null) => { try { return JSON.parse(n ?? "{}"); } catch { return {}; } };
  const mapsLink = (lat: number, lon: number) => `https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}`;

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="loader">{Array.from({length:7}).map((_,i)=><div key={i} className="loader-square"/>)}</div>
    </div>
  );

  if (!request) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <p className="text-muted-foreground">Request not found.</p>
    </div>
  );

  const notes = parseNotes(request.notes);
  const isAccepted = request.status === "accepted" || request.status === "fulfilled";

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/90 backdrop-blur-xl border-b border-border/50">
        <div className="container max-w-3xl mx-auto flex items-center justify-between h-16 px-4">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <Heart className="w-4 h-4 text-white" fill="currentColor" />
              </div>
              <span className="font-display text-lg font-bold text-foreground">Request Details</span>
            </div>
          </div>
          <button onClick={load} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
        </div>
      </div>

      <div className="container max-w-3xl mx-auto px-4 py-8 space-y-5">

        {/* Status banner */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          className={`flex items-center justify-between p-4 rounded-2xl border-2 ${
            isAccepted ? "bg-green-50 border-green-300" : "bg-yellow-50 border-yellow-200"
          }`}>
          <div className="flex items-center gap-3">
            {isAccepted
              ? <CheckCircle className="w-6 h-6 text-green-600" />
              : <AlertTriangle className="w-6 h-6 text-yellow-600" />}
            <div>
              <p className="font-semibold text-foreground">
                {isAccepted ? "Donor Found — Help is on the way!" : "Waiting for a donor…"}
              </p>
              <p className="text-xs text-muted-foreground">
                {isAccepted ? "A donor has accepted your request." : "Your request is visible to nearby donors."}
              </p>
            </div>
          </div>
          <span className={`text-xs px-3 py-1 rounded-full font-bold ${STATUS_COLOR[request.status] ?? "bg-gray-100 text-gray-600"}`}>
            {isAccepted ? "✅ Approved" : request.status}
          </span>
        </motion.div>

        {/* Blood group + urgency */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="bg-card border border-border rounded-2xl p-6 shadow-soft">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                <span className="font-display font-bold text-3xl text-primary">{request.blood_group}</span>
              </div>
              <div>
                <p className="font-display text-xl font-bold text-foreground">Blood Request</p>
                <span className={`inline-block mt-1 px-3 py-0.5 rounded-full text-xs font-bold border ${URGENCY_COLOR[request.urgency] ?? ""}`}>
                  {request.urgency === "critical" ? "🚨 " : request.urgency === "urgent" ? "⚡ " : ""}
                  {request.urgency?.toUpperCase()}
                </span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-foreground">{request.units_needed}</p>
              <p className="text-xs text-muted-foreground">units needed</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            {request.hospital_name && (
              <div className="flex items-center gap-2 text-foreground">
                <Building2 className="w-4 h-4 text-primary flex-shrink-0" />
                <span>{request.hospital_name}</span>
              </div>
            )}
            {request.location && (
              <div className="flex items-center gap-2 text-foreground">
                <MapPin className="w-4 h-4 text-primary flex-shrink-0" />
                <span>{request.location}</span>
              </div>
            )}
            {request.requester_phone && (
              <a href={`tel:${request.requester_phone}`} className="flex items-center gap-2 text-primary hover:underline">
                <Phone className="w-4 h-4 flex-shrink-0" />
                {request.requester_phone}
              </a>
            )}
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="w-4 h-4 flex-shrink-0" />
              {new Date(request.created_at).toLocaleString()}
            </div>
          </div>

          {/* Notes */}
          {(notes.patientName || notes.contactPerson || notes.contactPhone || notes.hospitalAddress) && (
            <div className="mt-4 pt-4 border-t border-border space-y-1.5 text-sm">
              {notes.patientName && <p><span className="font-medium text-foreground">Patient:</span> <span className="text-muted-foreground">{notes.patientName}</span></p>}
              {notes.contactPerson && <p><span className="font-medium text-foreground">Contact:</span> <span className="text-muted-foreground">{notes.contactPerson}</span></p>}
              {notes.contactPhone && <p><span className="font-medium text-foreground">Phone:</span> <span className="text-muted-foreground">{notes.contactPhone}</span></p>}
              {notes.hospitalAddress && <p><span className="font-medium text-foreground">Address:</span> <span className="text-muted-foreground">{notes.hospitalAddress}</span></p>}
            </div>
          )}
        </motion.div>

        {/* Donor details — shown when accepted */}
        {isAccepted && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="bg-green-50 border-2 border-green-300 rounded-2xl p-6 shadow-soft">
            <p className="font-display text-lg font-bold text-green-800 mb-4">Donor Information</p>

            {/* ETA */}
            {(request.eta_minutes || request.distance_km) && (
              <div className="flex items-center gap-3 bg-white border border-green-200 rounded-xl p-3 mb-4">
                <DotLottieReact
                  src="/red-car.lottie"
                  loop
                  autoplay
                  style={{ width: 56, height: 56, flexShrink: 0 }}
                />
                <div>
                  {request.eta_minutes && <p className="font-bold text-green-800 text-lg">Arriving in ~{request.eta_minutes} min</p>}
                  {request.distance_km && <p className="text-sm text-green-700">📍 Distance: {request.distance_km} km away</p>}
                </div>
              </div>
            )}

            {/* If no stored ETA but donor has location, show live-calculated */}
            {!request.eta_minutes && !request.distance_km && donor?.latitude && donor?.longitude && (
              <div className="flex items-center gap-3 bg-white border border-green-200 rounded-xl p-3 mb-4">
                <DotLottieReact
                  src="/red-car.lottie"
                  loop
                  autoplay
                  style={{ width: 56, height: 56, flexShrink: 0 }}
                />
                <p className="text-sm text-green-700">Donor location available — click Get Directions below</p>
              </div>
            )}

            {donor ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center font-bold text-lg flex-shrink-0">
                    {donor.full_name?.[0]?.toUpperCase() ?? "?"}
                  </div>
                  <div>
                    <p className="font-semibold text-foreground text-lg">{donor.full_name}</p>
                    <span className="inline-block px-2 py-0.5 bg-primary text-white text-xs font-bold rounded-full">{donor.blood_group}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  {donor.phone && (
                    <a href={`tel:${donor.phone}`} className="flex items-center gap-2 text-primary hover:underline font-medium">
                      <Phone className="w-4 h-4" /> {donor.phone}
                    </a>
                  )}
                  {donor.city && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="w-4 h-4" /> {donor.city}
                    </div>
                  )}
                </div>

                <div className="flex gap-3 mt-2">
                  {donor.latitude && donor.longitude && (
                    <a href={mapsLink(donor.latitude, donor.longitude)} target="_blank" rel="noopener noreferrer"
                      className="flex-1 flex items-center justify-center gap-2 py-3 bg-primary text-white rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity">
                      <Navigation className="w-4 h-4" /> Get Directions <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                  {donor.phone && (
                    <a href={`https://wa.me/${donor.phone.replace(/[\s\-()]/g,"").replace(/^\+/,"")}`}
                      target="_blank" rel="noopener noreferrer"
                      className="flex-1 flex items-center justify-center gap-2 py-3 bg-green-500 text-white rounded-xl text-sm font-semibold hover:bg-green-400 transition-colors">
                      <MessageCircle className="w-4 h-4" /> WhatsApp
                    </a>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <p className="text-sm text-green-700">Loading donor details…</p>
                <button onClick={load} className="text-xs text-primary hover:underline flex items-center gap-1">
                  <RefreshCw className="w-3 h-3" /> Retry
                </button>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}
