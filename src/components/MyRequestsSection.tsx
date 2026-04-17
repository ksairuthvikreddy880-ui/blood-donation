import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Droplets, MapPin, Phone, Navigation, CheckCircle,
  Clock, X, ChevronDown, ChevronUp, ExternalLink,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { BloodRequest } from "@/integrations/supabase/types";

interface DonorDetails {
  full_name: string;
  phone: string | null;
  blood_group: string | null;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
}

interface RequestWithDonor extends BloodRequest {
  donor?: DonorDetails | null;
}

interface Props {
  userId: string;
  onDelete?: (id: string) => void;
}

export default function MyRequestsSection({ userId, onDelete }: Props) {
  const { toast } = useToast();
  const [requests, setRequests] = useState<RequestWithDonor[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const loadRequests = async () => {
    setLoading(true);
    try {
      const { data, error } = await (supabase as any)
        .from("requests")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // For accepted requests, fetch donor details
      const enriched: RequestWithDonor[] = await Promise.all(
        (data ?? []).map(async (req: BloodRequest) => {
          if (req.status === "accepted" && (req as any).accepted_by) {
            const { data: donor } = await (supabase as any)
              .from("users")
              .select("full_name, phone, blood_group, city, latitude, longitude")
              .eq("auth_id", (req as any).accepted_by)
              .single();
            return { ...req, donor: donor ?? null };
          }
          return { ...req, donor: null };
        })
      );

      setRequests(enriched);
    } catch (err: any) {
      toast({ title: "Error loading requests", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!userId) return;
    loadRequests();

    // Real-time subscription — update instantly when status changes
    const channel = (supabase as any)
      .channel(`my-requests-${userId}`)
      .on("postgres_changes", {
        event: "UPDATE",
        schema: "public",
        table: "requests",
        filter: `user_id=eq.${userId}`,
      }, async (payload: any) => {
        const updated = payload.new;
        // If just accepted, fetch donor details
        if (updated.status === "accepted" && updated.accepted_by) {
          const { data: donor } = await (supabase as any)
            .from("users")
            .select("full_name, phone, blood_group, city, latitude, longitude")
            .eq("auth_id", updated.accepted_by)
            .single();

          setRequests(prev => prev.map(r =>
            r.id === updated.id ? { ...r, ...updated, donor: donor ?? null } : r
          ));

          toast({
            title: "🎉 Your request has been accepted!",
            description: "Donor details are now available.",
          });
          // Auto-expand the accepted card
          setExpanded(prev => new Set([...prev, updated.id]));
        } else {
          setRequests(prev => prev.map(r => r.id === updated.id ? { ...r, ...updated } : r));
        }
      })
      .subscribe();

    return () => { (supabase as any).removeChannel(channel); };
  }, [userId]);

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
      <div className="loader"><div className="loader-square"/><div className="loader-square"/><div className="loader-square"/><div className="loader-square"/><div className="loader-square"/><div className="loader-square"/><div className="loader-square"/></div>
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
      <AnimatePresence>
        {requests.map((req) => {
          const isAccepted = req.status === "accepted";
          const isExpanded = expanded.has(req.id);
          const donor = req.donor;

          return (
            <motion.div key={req.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={`bg-card border-2 rounded-2xl overflow-hidden transition-colors ${
                isAccepted ? "border-green-300" : "border-border"
              }`}>

              {/* Main row */}
              <div className="flex items-center justify-between p-4">
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
                  {/* Status badge */}
                  <span className={`text-xs px-3 py-1 rounded-full font-semibold ${
                    isAccepted ? "bg-green-100 text-green-700" :
                    req.status === "fulfilled" ? "bg-blue-100 text-blue-700" :
                    req.status === "cancelled" ? "bg-gray-100 text-gray-500" :
                    "bg-yellow-100 text-yellow-700"
                  }`}>
                    {isAccepted ? "✅ Approved" : req.status}
                  </span>

                  {/* Expand donor details (only if accepted) */}
                  {isAccepted && (
                    <button onClick={() => toggleExpand(req.id)}
                      className="flex items-center gap-1 px-3 py-1 bg-green-600 text-white rounded-xl text-xs font-semibold hover:bg-green-500 transition-colors">
                      {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      {isExpanded ? "Hide" : "View Donor"}
                    </button>
                  )}

                  {/* Delete */}
                  {onDelete && (
                    <button onClick={() => onDelete(req.id)}
                      className="p-1.5 text-muted-foreground hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

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
                        <div className="pt-3 space-y-2">
                          <p className="text-xs font-semibold text-green-800 mb-2">Donor Details</p>

                          <div className="grid grid-cols-2 gap-3">
                            <div className="flex items-center gap-2 text-sm text-foreground">
                              <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
                                {donor.full_name?.[0]?.toUpperCase() ?? "?"}
                              </div>
                              <div>
                                <p className="font-semibold">{donor.full_name}</p>
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
                                <MapPin className="w-4 h-4 flex-shrink-0" />
                                {donor.city}
                              </div>
                            )}
                          </div>

                          {/* Google Maps direction */}
                          {donor.latitude && donor.longitude && (
                            <a
                              href={getMapsLink(donor.latitude, donor.longitude)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="mt-3 w-full flex items-center justify-center gap-2 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity"
                            >
                              <Navigation className="w-4 h-4" />
                              Get Directions
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      ) : (
                        <div className="pt-3 flex items-center gap-2 text-sm text-green-700">
                          <CheckCircle className="w-4 h-4" />
                          Request accepted! Donor details loading…
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
