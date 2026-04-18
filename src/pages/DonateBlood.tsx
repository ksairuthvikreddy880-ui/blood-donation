import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Heart, ArrowLeft, MapPin, Clock, Loader2,
  Navigation, CheckCircle, Building2, Droplets, Phone, MessageCircle, X, AlertTriangle,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/db";
import { haversine } from "@/lib/donorRanking";
import { isEligible, nextEligibleDate, daysUntilEligible } from "@/lib/eligibility";
import type { BloodRequest } from "@/integrations/supabase/types";
import LocationPicker from "@/components/LocationPicker";
import type { LocationResult } from "@/hooks/useLocation";

interface RequestWithDistance extends BloodRequest {
  distanceKm: number | null;
  requesterName?: string;
  priority_value?: number;
}

const URGENCY_STYLE: Record<string, string> = {
  critical: "bg-red-100 text-red-700 border-red-200",
  urgent:   "bg-orange-100 text-orange-700 border-orange-200",
  normal:   "bg-blue-100 text-blue-700 border-blue-200",
};

export default function DonateBlood() {
  const { user, profile } = useAuth();
  const { toast } = useToast();

  const [requests, setRequests] = useState<RequestWithDistance[]>([]);
  const [loading, setLoading] = useState(true);
  const [donorLat, setDonorLat] = useState<number | null>(profile?.latitude ?? null);
  const [donorLon, setDonorLon] = useState<number | null>(profile?.longitude ?? null);
  const [detectedAddress, setDetectedAddress] = useState("");
  const [acceptedIds, setAcceptedIds] = useState<Set<string>>(new Set());
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  // Confirmation modal
  const [confirmRequest, setConfirmRequest] = useState<RequestWithDistance | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  // Phone validation popup
  const [showPhonePopup, setShowPhonePopup] = useState(false);
  const [pendingRequest, setPendingRequest] = useState<RequestWithDistance | null>(null);
  const [donorPhone, setDonorPhone] = useState(profile?.phone ?? "");
  const [savingPhone, setSavingPhone] = useState(false);

  // Eligibility
  const donorEligible = isEligible(profile?.last_donated_at);
  const nextEligible = nextEligibleDate(profile?.last_donated_at);
  const daysLeft = daysUntilEligible(profile?.last_donated_at);

  const handleLocationDetected = (loc: LocationResult) => {
    setDonorLat(loc.lat);
    setDonorLon(loc.lon);
    setDetectedAddress(loc.fullAddress);
  };

  useEffect(() => {
    // Auto-detect location on page load
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setDonorLat(pos.coords.latitude);
          setDonorLon(pos.coords.longitude);
        },
        () => {} // silent fail — user can manually detect
      );
    }
  }, []);

  useEffect(() => {
    loadRequests();
  }, [donorLat, donorLon]);

  const loadRequests = async () => {
    setLoading(true);
    try {
      // Fetch all pending/accepted requests (not own)
      let query = (supabase as any)
        .from("requests")
        .select("*")
        .in("status", ["pending", "accepted"])
        .order("created_at", { ascending: false });

      if (user) query = query.neq("user_id", user.id);

      const { data, error } = await query;
      if (error) throw error;

      // Calculate distance for each request and filter by radius
      const enriched: RequestWithDistance[] = (data ?? [])
        .map((req: BloodRequest) => {
          let distanceKm: number | null = null;
          if (donorLat && donorLon && req.latitude && req.longitude) {
            distanceKm = Math.round(haversine(donorLat, donorLon, req.latitude, req.longitude) * 10) / 10;
          }
          
          // Calculate priority value
          const priorityValue = req.urgency === 'critical' ? 3 : req.urgency === 'urgent' ? 2 : 1;
          
          return { ...req, distanceKm, priority_value: priorityValue };
        })
        .filter((req: RequestWithDistance) => {
          // If requester set a radius and we have distance, only show if within radius
          if (req.distanceKm !== null) {
            const radius = (req as any).radius_km ?? 50;
            return req.distanceKm <= radius;
          }
          return true; // no location data — show anyway
        })
        .sort((a: RequestWithDistance, b: RequestWithDistance) => {
          // PRIORITY-FIRST SORTING: Critical cases always appear first
          // 1. Sort by priority (descending) - higher priority first
          const priorityDiff = (b.priority_value ?? 1) - (a.priority_value ?? 1);
          if (priorityDiff !== 0) return priorityDiff;
          
          // 2. Within same priority, sort by distance (ascending) - closer first
          if (a.distanceKm !== null && b.distanceKm !== null) {
            return a.distanceKm - b.distanceKm;
          }
          
          // 3. If no distance data, sort by created_at (newest first)
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });

      setRequests(enriched);
    } catch (err: any) {
      toast({ title: "Failed to load requests", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const openWhatsApp = (req: RequestWithDistance, phone: string) => {
    const requesterPhone = (req as any).requester_phone;
    if (!requesterPhone) {
      toast({ title: "Requester phone not available", variant: "destructive" });
      return;
    }
    // Clean phone — remove spaces, dashes; ensure starts with country code
    const cleaned = requesterPhone.replace(/[\s\-()]/g, "");
    const number = cleaned.startsWith("+") ? cleaned.slice(1) : cleaned.startsWith("0") ? "91" + cleaned.slice(1) : cleaned;

    const notes = (() => { try { return JSON.parse(req.notes ?? "{}"); } catch { return {}; } })();
    const patientName = notes.patientName || "the patient";

    const message = encodeURIComponent(
      `Hi, I saw your blood request for ${req.blood_group} blood for ${patientName}. ` +
      `I am available to donate and nearby. My phone: ${phone}. Please contact me.`
    );

    toast({ title: "📱 Opening WhatsApp to contact requester…" });
    window.open(`https://wa.me/${number}?text=${message}`, "_blank");
  };

  const handleAccept = async (req: RequestWithDistance) => {
    if (!user) return;
    // Show confirmation modal first
    setConfirmRequest(req);
    setConfirmed(false);
  };

  const handleConfirmProceed = async () => {
    if (!confirmRequest || !user) return;
    setConfirmRequest(null);
    const currentPhone = profile?.phone || donorPhone;
    if (!currentPhone) {
      setPendingRequest(confirmRequest);
      setShowPhonePopup(true);
      return;
    }
    await doAccept(confirmRequest, currentPhone);
  };

  const doAccept = async (req: RequestWithDistance, phone: string) => {
    setAcceptingId(req.id);
    try {
      const { data: match } = await (supabase as any)
        .from("matches")
        .insert({ request_id: req.id, donor_id: user!.id, status: "pending" })
        .select().single();

      // Use full pipeline: ETA + notification + status update
      const result = match
        ? await db.matches.acceptWithETA(match.id, req.id, user!.id, donorLat, donorLon)
        : null;

      setAcceptedIds(prev => new Set([...prev, req.id]));

      // Toast with ETA if available
      if (result?.etaMinutes) {
        toast({ title: "✅ Accepted!", description: `Estimated arrival: ~${result.etaMinutes} min (${result.distanceKm} km away)` });
      } else {
        toast({ title: "✅ Request accepted!", description: "The requester has been notified." });
      }

      // Open WhatsApp with ETA in message
      const requesterPhone = (req as any).requester_phone || result?.requesterPhone;
      if (requesterPhone) {
        const cleaned = requesterPhone.replace(/[\s\-()]/g, "");
        const number = cleaned.startsWith("+") ? cleaned.slice(1) : cleaned.startsWith("0") ? "91" + cleaned.slice(1) : cleaned;
        const etaText = result?.etaMinutes ? ` I will arrive in approximately ${result.etaMinutes} minutes.` : "";
        const message = encodeURIComponent(
          `Hello, I am available to donate ${req.blood_group} blood. I am on the way.${etaText} My phone: ${phone}.`
        );
        toast({ title: "📱 Opening WhatsApp…" });
        window.open(`https://wa.me/${number}?text=${message}`, "_blank");
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setAcceptingId(null);
    }
  };

  const handlePhoneSubmit = async () => {
    if (!donorPhone.trim() || !user || !pendingRequest) return;
    setSavingPhone(true);
    try {
      await db.users.update(user.id, { phone: donorPhone });
      setShowPhonePopup(false);
      await doAccept(pendingRequest, donorPhone);
      setPendingRequest(null);
    } catch (err: any) {
      toast({ title: "Error saving phone", description: err.message, variant: "destructive" });
    } finally {
      setSavingPhone(false);
    }
  };

  const parseNotes = (notes: string | null) => {
    try { return JSON.parse(notes ?? "{}"); } catch { return {}; }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/90 backdrop-blur-xl border-b border-border/50">
        <div className="container max-w-5xl mx-auto flex items-center justify-between h-16 px-4">
          <div className="flex items-center gap-3">
            <Link to="/dashboard" className="text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <Heart className="w-4 h-4 text-white" fill="currentColor" />
              </div>
              <span className="font-display text-lg font-bold text-foreground">Donate Blood</span>
            </div>
          </div>
          <div className="w-72">
            <LocationPicker onDetected={handleLocationDetected} compact />
          </div>
        </div>
      </div>

      <div className="container max-w-5xl mx-auto px-4 py-8">

        {/* Info banner */}
        <div className="flex items-start gap-3 p-4 bg-primary/5 border border-primary/20 rounded-xl mb-6">
          <Heart className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" fill="currentColor" />
          <div>
            <p className="text-sm font-semibold text-foreground">Blood requests near you</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {donorLat
                ? "Showing requests within the radius set by each requester. Sorted by urgency then distance."
                : "Detect your location to see requests within your area. Without location, all pending requests are shown."}
            </p>
          </div>
        </div>

        {/* Eligibility banner */}
        {!donorEligible && (
          <div className="flex items-start gap-3 p-4 bg-orange-50 border border-orange-200 rounded-xl mb-6">
            <AlertTriangle className="w-5 h-5 text-orange-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-orange-800">You are not eligible to donate yet</p>
              <p className="text-xs text-orange-700 mt-0.5">
                Minimum 90-day gap required between donations. {daysLeft} day{daysLeft !== 1 ? "s" : ""} remaining.
                {nextEligible && (
                  <> Next eligible date: <span className="font-semibold">{nextEligible.toLocaleDateString()}</span></>
                )}
              </p>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="loader"><div className="loader-square"/><div className="loader-square"/><div className="loader-square"/><div className="loader-square"/><div className="loader-square"/><div className="loader-square"/><div className="loader-square"/></div>
          </div>
        ) : requests.length === 0 ? (
          <div className="text-center py-20 bg-card border border-border rounded-2xl">
            <Droplets className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="font-display font-semibold text-foreground">No requests in your area</p>
            <p className="text-sm text-muted-foreground mt-1">Check back later or expand your location range</p>
          </div>
        ) : (
          <>
            <p className="text-sm text-muted-foreground mb-4">{requests.length} request{requests.length !== 1 ? "s" : ""} found</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <AnimatePresence>
                {requests.map((req, idx) => {
                  const notes = parseNotes(req.notes);
                  const accepted = acceptedIds.has(req.id);

                  return (
                    <motion.div key={req.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.04 }}
                      className={`bg-card border-2 rounded-2xl p-5 shadow-soft relative ${
                        req.urgency === "critical" ? "border-red-300 shadow-red-100 shadow-lg" :
                        req.urgency === "urgent" ? "border-orange-200" : "border-border"
                      }`}>

                      {/* Critical Priority Indicator */}
                      {req.urgency === "critical" && (
                        <div className="absolute -top-2 -right-2 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg animate-pulse">
                          🚨 HIGH PRIORITY
                        </div>
                      )}

                      {/* Priority Rank Badge (for top 3) */}
                      {idx < 3 && (
                        <div className={`absolute -top-2 -left-2 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shadow-lg ${
                          idx === 0 ? "bg-red-500 text-white" :
                          idx === 1 ? "bg-orange-500 text-white" :
                          "bg-yellow-500 text-white"
                        }`}>
                          #{idx + 1}
                        </div>
                      )}

                      {/* Top row */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                            <span className="font-display font-bold text-2xl text-primary">{req.blood_group}</span>
                          </div>
                          <div>
                            <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold border ${URGENCY_STYLE[req.urgency] ?? "bg-gray-100 text-gray-600 border-gray-200"}`}>
                              {req.urgency === "critical" ? "🚨 " : req.urgency === "urgent" ? "⚡ " : ""}
                              {req.urgency.toUpperCase()}
                            </span>
                            <p className="text-xs text-muted-foreground mt-1">
                              {req.units_needed} unit{req.units_needed !== 1 ? "s" : ""} needed
                            </p>
                          </div>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
                          req.status === "accepted" ? "bg-blue-100 text-blue-700" : "bg-yellow-100 text-yellow-700"
                        }`}>{req.status}</span>
                      </div>

                      {/* Details */}
                      <div className="space-y-1.5 text-sm text-muted-foreground mb-4">
                        {req.hospital_name && (
                          <div className="flex items-center gap-2">
                            <Building2 className="w-3.5 h-3.5 flex-shrink-0" /> {req.hospital_name}
                          </div>
                        )}
                        {req.location && (
                          <div className="flex items-center gap-2">
                            <MapPin className="w-3.5 h-3.5 flex-shrink-0" /> {req.location}
                          </div>
                        )}
                        {req.distanceKm !== null && (
                          <div className="flex items-center gap-2 font-medium text-foreground">
                            <Navigation className="w-3.5 h-3.5 flex-shrink-0 text-primary" />
                            {req.distanceKm} km from you
                          </div>
                        )}
                        {notes.contactPhone && (
                          <div className="flex items-center gap-2">
                            📞 {notes.contactPhone}
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <Clock className="w-3.5 h-3.5 flex-shrink-0" />
                          {new Date(req.created_at).toLocaleString()}
                        </div>
                      </div>

                      {/* Accept button */}
                      {/* Accept / WhatsApp button */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleAccept(req)}
                          disabled={accepted || acceptingId === req.id || !donorEligible}
                          className={`flex-1 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-colors ${
                            !donorEligible
                              ? "bg-orange-100 text-orange-600 cursor-not-allowed"
                              : accepted
                              ? "bg-green-100 text-green-700 cursor-default"
                              : "bg-primary text-primary-foreground hover:opacity-90"
                          } disabled:opacity-60`}>
                          {acceptingId === req.id
                            ? <Loader2 className="w-4 h-4 animate-spin" />
                            : !donorEligible
                            ? <><AlertTriangle className="w-4 h-4" /> Not Eligible Yet</>
                            : accepted
                            ? <><CheckCircle className="w-4 h-4" /> Accepted</>
                            : <><Heart className="w-4 h-4" fill="currentColor" /> I Can Donate</>}
                        </button>
                        {/* WhatsApp button — only visible if requester has phone AND donor is eligible */}
                        {(req as any).requester_phone && donorEligible && (
                          <button
                            onClick={() => openWhatsApp(req, profile?.phone || donorPhone || "")}
                            className="px-3 py-2.5 bg-green-500 text-white rounded-xl text-sm font-semibold hover:bg-green-400 transition-colors flex items-center gap-1"
                            title="Contact on WhatsApp">
                            <MessageCircle className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </>
        )}
      </div>

      {/* Confirmation modal */}
      <AnimatePresence>
        {confirmRequest && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="bg-card border border-border rounded-2xl p-6 w-full max-w-sm shadow-elevated"
            >
              {/* Header */}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-xl">⚠️</span>
                </div>
                <div>
                  <h3 className="font-display text-lg font-bold text-foreground">Confirm Before Proceeding</h3>
                  <p className="text-xs text-muted-foreground">Please read carefully</p>
                </div>
              </div>

              {/* Request summary */}
              <div className="bg-secondary rounded-xl p-3 mb-4 flex items-center gap-3">
                <span className="font-display font-bold text-2xl text-primary">{confirmRequest.blood_group}</span>
                <div>
                  <p className="text-sm font-medium text-foreground">{confirmRequest.hospital_name ?? "Blood needed"}</p>
                  <p className="text-xs text-muted-foreground">{confirmRequest.location ?? ""}</p>
                </div>
              </div>

              {/* Checklist */}
              <div className="space-y-2 mb-4">
                {[
                  "Ensure you have a stable internet connection",
                  "Make sure your phone is reachable",
                  "Only proceed if you are ready to donate",
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm text-foreground">
                    <CheckCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    {item}
                  </div>
                ))}
              </div>

              {/* Emergency emphasis */}
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4">
                <p className="text-xs text-red-700 font-medium text-center">
                  This is an emergency request. Please proceed responsibly.
                </p>
              </div>

              {/* Checkbox */}
              <label className="flex items-start gap-3 cursor-pointer mb-5 p-3 bg-secondary rounded-xl">
                <input
                  type="checkbox"
                  checked={confirmed}
                  onChange={e => setConfirmed(e.target.checked)}
                  className="mt-0.5 w-4 h-4 accent-primary"
                />
                <span className="text-sm text-foreground">
                  I confirm that I am available and ready to donate
                </span>
              </label>

              {/* Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => { setConfirmRequest(null); setConfirmed(false); }}
                  className="flex-1 py-2.5 border border-border text-foreground rounded-xl text-sm font-medium hover:bg-secondary transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmProceed}
                  disabled={!confirmed}
                  className="flex-1 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Heart className="w-4 h-4" fill="currentColor" />
                  Continue
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Phone number popup */}
      <AnimatePresence>
        {showPhonePopup && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card border border-border rounded-2xl p-6 w-full max-w-sm shadow-elevated"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display text-lg font-bold text-foreground">Enter Your Phone Number</h3>
                <button onClick={() => setShowPhonePopup(false)} className="text-muted-foreground hover:text-foreground">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Your phone number is needed so the requester can contact you on WhatsApp.
              </p>
              <div className="relative mb-4">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="tel"
                  value={donorPhone}
                  onChange={e => setDonorPhone(e.target.value)}
                  placeholder="+91 XXXXX XXXXX"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-secondary border border-border text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  autoFocus
                />
              </div>
              <button
                onClick={handlePhoneSubmit}
                disabled={!donorPhone.trim() || savingPhone}
                className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {savingPhone ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageCircle className="w-4 h-4" />}
                Save & Open WhatsApp
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
