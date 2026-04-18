import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import {
  Droplets, MapPin, Phone, Navigation, CheckCircle,
  Clock, X, ChevronDown, ChevronUp, ExternalLink, RefreshCw,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface DonorDetails {
  full_name: string;
  phone: string | null;
  blood_group: string | null;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
}

interface EnrichedRequest {
  id: string;
  blood_group: string;
  status: string;
  hospital_name: string | null;
  location: string | null;
  created_at: string;
  eta_minutes: number | null;
  distance_km: number | null;
  accepted_by: string | null;
  donor_id: string | null;
  donor: DonorDetails | null;
}

interface Props {
  userId: string;
  onDelete?: (id: string) => void;
}

export default function MyRequestsSection({ userId, onDelete }: Props) {
  const { toast } = useToast();
  const [requests, setRequests] = useState<EnrichedRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const fetchDonor = async (donorAuthId: string): Promise<DonorDetails | null> => {
    const { data } = await (supabase as any)
      .from("users")
      .select("full_name, phone, blood_group, city, latitude, longitude")
      .eq("auth_id", donorAuthId)
      .single();
    return data ?? null;
  };

  const loadRequests = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const { data, error } = await (supabase as any)
        .from("requests")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const enriched: EnrichedRequest[] = await Promise.all(
        (data ?? []).map(async (req: any) => {
          let donor: DonorDetails | null = null;

          // Try accepted_by first, then donor_id, then check matches table
          const donorAuthId = req.accepted_by || req.donor_id;
          if (donorAuthId) {
            donor = await fetchDonor(donorAuthId);
          }

          // Fallback: check matches table for accepted match
          if (!donor && req.status === "accepted") {
            const { data: match } = await (supabase as any)
              .from("matches")
              .select("donor_id")
              .eq("request_id", req.id)
              .eq("status", "accepted")
              .single();
            if (match?.donor_id) {
              donor = await fetchDonor(match.donor_id);
            }
          }

          return {
            id: req.id,
            blood_group: req.blood_group,
            status: req.status,
            hospital_name: req.hospital_name,
            location: req.location,
            created_at: req.created_at,
            eta_minutes: req.eta_minutes ?? null,
            distance_km: req.distance_km ?? null,
            accepted_by: req.accepted_by ?? null,
            donor_id: req.donor_id ?? null,
            donor,
          };
        })
      );

      setRequests(enriched);

      // Auto-expand accepted requests
      const acceptedIds = enriched.filter(r => r.status === "accepted").map(r => r.id);
      if (acceptedIds.length > 0) {
        setExpanded(prev => new Set([...prev, ...acceptedIds]));
      }
    } catch (err: any) {
      toast({ title: "Error loading requests", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadRequests();

    // Realtime — any update to this user's requests
    const channel = (supabase as any)
      .channel(`my-requests-${userId}`)
      .on("postgres_changes", {
        event: "UPDATE",
        schema: "public",
        table: "requests",
        filter: `user_id=eq.${userId}`,
      }, async (payload: any) => {
        const updated = payload.new;
        if (updated.status === "accepted") {
          toast({ title: "🎉 Donor accepted your request!", description: "Donor details are now available." });
          setExpanded(prev => new Set([...prev, updated.id]));
        }
        // Reload to get fresh donor details
        loadRequests();
      })
      .subscribe();

    return () => { (supabase as any).removeChannel(channel); };
  }, [userId, loadRequests]);

  const toggleExpand = (id: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const getMapsLink = (lat: number, lon: number) =>
    `https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}`;

  if (loading) return (
    <div className="flex justify-center py-8">
      <div className="loader">
        {Array.from({ length: 7 }).map((_, i) => <div key={i} className="loader-square" />)}
      </div>
    </div>
  );

  if (requests.length === 0) return (
    <div className="bg-card border border-border rounded-2xl p-8 text-center">
      <Droplets className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
      <p className="text-muted-foreground">No requests yet.</p>
      <p className="text-xs text-muted-foreground mt-1">Create a blood request to get started.</p>
    </div>
  );

  return (
    <div className="space-y-3">
      {/* Refresh button */}
      <div className="flex justify-end">
        <button onClick={loadRequests}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      <AnimatePresence>
        {requests.map((req) => {
          const isAccepted = req.status === "accepted" || req.status === "fulfilled";
          const isExpanded = expanded.has(req.id);
          const donor = req.donor;

          return (
            <motion.div key={req.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={`bg-card border-2 rounded-2xl overflow-hidden transition-colors ${
                isAccepted ? "border-green-300" : "border-border"
              }`}>

              {/* Main row — clickable to detail page */}
              <Link to={`/request/${req.id}`} className="flex items-center justify-between p-4 hover:bg-secondary/30 transition-colors cursor-pointer"
                onClick={e => { if ((e.target as HTMLElement).closest('button')) e.preventDefault(); }}>
                <div className="flex items-center gap-4 min-w-0">
                  <span className="font-display font-bold text-2xl text-primary flex-shrink-0">{req.blood_group}</span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {req.hospital_name ?? "No hospital specified"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {req.location ?? "No location"} · {new Date(req.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={`text-xs px-3 py-1 rounded-full font-semibold ${
                    isAccepted ? "bg-green-100 text-green-700" :
                    req.status === "fulfilled" ? "bg-blue-100 text-blue-700" :
                    req.status === "cancelled" ? "bg-gray-100 text-gray-500" :
                    "bg-yellow-100 text-yellow-700"
                  }`}>
                    {isAccepted ? "✅ Approved" : req.status}
                  </span>

                  {isAccepted && (
                    <button onClick={e => { e.preventDefault(); toggleExpand(req.id); }}
                      className="flex items-center gap-1 px-3 py-1 bg-green-600 text-white rounded-xl text-xs font-semibold hover:bg-green-500 transition-colors">
                      {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      {isExpanded ? "Hide" : "View Donor"}
                    </button>
                  )}

                  {onDelete && (
                    <button onClick={e => { e.preventDefault(); onDelete(req.id); }}
                      className="p-1.5 text-muted-foreground hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </Link>

              {/* Donor details panel */}
              <AnimatePresence>
                {isAccepted && isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-4 pt-0 border-t border-green-100 bg-green-50/50">
                      {donor ? (
                        <div className="pt-3 space-y-3">
                          <p className="text-xs font-semibold text-green-800">Donor Details</p>

                          {/* ETA banner */}
                          {(req.eta_minutes || req.distance_km) && (
                            <div className="flex items-center gap-3 bg-white border border-green-300 rounded-xl px-3 py-2.5">
                              <span className="text-2xl">🚗</span>
                              <div>
                                {req.eta_minutes && (
                                  <p className="text-sm font-bold text-green-800">
                                    Arriving in ~{req.eta_minutes} min
                                  </p>
                                )}
                                {req.distance_km && (
                                  <p className="text-xs text-green-700">Distance: {req.distance_km} km away</p>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Donor info */}
                          <div className="grid grid-cols-2 gap-3">
                            <div className="flex items-center gap-2">
                              <div className="w-9 h-9 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
                                {donor.full_name?.[0]?.toUpperCase() ?? "?"}
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-foreground">{donor.full_name}</p>
                                <p className="text-xs text-muted-foreground">{donor.blood_group}</p>
                              </div>
                            </div>

                            {donor.phone && (
                              <a href={`tel:${donor.phone}`}
                                className="flex items-center gap-2 text-sm text-primary hover:underline">
                                <Phone className="w-4 h-4 flex-shrink-0" />
                                {donor.phone}
                              </a>
                            )}

                            {donor.city && (
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <MapPin className="w-4 h-4 flex-shrink-0" /> {donor.city}
                              </div>
                            )}
                          </div>

                          {/* Google Maps */}
                          {donor.latitude && donor.longitude && (
                            <a href={getMapsLink(donor.latitude, donor.longitude)}
                              target="_blank" rel="noopener noreferrer"
                              className="w-full flex items-center justify-center gap-2 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity">
                              <Navigation className="w-4 h-4" />
                              Get Directions to Donor
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      ) : (
                        <div className="pt-3 flex items-center justify-between">
                          <div className="flex items-center gap-2 text-sm text-green-700">
                            <CheckCircle className="w-4 h-4" />
                            Request accepted! Loading donor details…
                          </div>
                          <button onClick={loadRequests}
                            className="text-xs text-primary hover:underline flex items-center gap-1">
                            <RefreshCw className="w-3 h-3" /> Retry
                          </button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
