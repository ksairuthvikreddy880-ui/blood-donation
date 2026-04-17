import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Heart, Search, MapPin, Droplets, ArrowLeft, Loader2,
  Sparkles, Clock, Navigation, Send, CheckCircle,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { rankDonors, type RankedDonor } from "@/lib/donorRanking";
import { db } from "@/lib/db";
import LocationPicker from "@/components/LocationPicker";
import type { LocationResult } from "@/hooks/useLocation";

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const RADIUS_OPTIONS = [5, 10, 15, 20, 50];

export default function FindDonors() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [bloodGroup, setBloodGroup] = useState("");
  const [radius, setRadius] = useState(10);
  const [userLat, setUserLat] = useState<number | null>(null);
  const [userLon, setUserLon] = useState<number | null>(null);
  const [detectedAddress, setDetectedAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [donors, setDonors] = useState<RankedDonor[]>([]);
  const [searched, setSearched] = useState(false);
  const [requestedIds, setRequestedIds] = useState<Set<string>>(new Set());
  const [requestingId, setRequestingId] = useState<string | null>(null);

  const handleLocationDetected = (loc: LocationResult) => {
    setUserLat(loc.lat);
    setUserLon(loc.lon);
    setDetectedAddress(loc.fullAddress);
  };

  const handleSearch = async () => {
    if (!bloodGroup) {
      toast({ title: "Select a blood group first", variant: "destructive" });
      return;
    }
    setLoading(true);
    setSearched(true);
    try {
      // Fetch available donors with matching blood group
      let query = (supabase as any)
        .from("users")
        .select("*")
        .eq("blood_group", bloodGroup)
        .eq("is_available", true);

      // Only fetch donors with coordinates if we have user location (for distance filtering)
      if (userLat && userLon) {
        query = query.not("latitude", "is", null).not("longitude", "is", null);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Rank and filter by radius
      let ranked = rankDonors(data ?? [], userLat, userLon);

      // If we have location, filter by radius
      if (userLat && userLon) {
        ranked = ranked.filter(d => d.distanceKm === null || d.distanceKm <= radius);
      }

      setDonors(ranked);
    } catch (err: any) {
      toast({ title: "Search failed", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleRequest = async (donor: RankedDonor) => {
    if (!user) { toast({ title: "Sign in to request", variant: "destructive" }); return; }
    setRequestingId(donor.auth_id);
    try {
      // Create a blood request
      const request = await db.requests.create({
        user_id: user.id,
        blood_group: bloodGroup,
        urgency: "urgent",
        units_needed: 1,
      });
      // Create a direct match for this donor
      await (supabase as any).from("matches").insert({
        request_id: request.id,
        donor_id: donor.auth_id,
        status: "pending",
      });
      // Notify the donor
      await db.notifications.create({
        user_id: donor.auth_id,
        title: "🩸 Blood Request",
        message: `Someone needs ${bloodGroup} blood. Can you help?`,
        type: "match",
        request_id: request.id,
      });
      setRequestedIds(prev => new Set([...prev, donor.auth_id]));
      toast({ title: "Request sent!", description: `${donor.full_name} has been notified.` });
    } catch (err: any) {
      toast({ title: "Failed to send request", description: err.message, variant: "destructive" });
    } finally {
      setRequestingId(null);
    }
  };

  const daysSince = (date: string | null) => {
    if (!date) return null;
    return Math.floor((Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24));
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
                <Heart className="w-4 h-4 text-primary-foreground" fill="currentColor" />
              </div>
              <span className="font-display text-lg font-bold text-foreground">Find Donors</span>
            </div>
          </div>
          {searched && !loading && (
            <span className="text-sm text-muted-foreground">{donors.length} donor{donors.length !== 1 ? "s" : ""} found</span>
          )}
        </div>
      </div>

      <div className="container max-w-5xl mx-auto px-4 py-8">

        {/* Search panel */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-soft mb-6">
          <h2 className="font-display text-xl font-bold text-foreground mb-1">Search Blood Donors</h2>
          <p className="text-sm text-muted-foreground mb-5">
            Detect your location for distance-based ranking and radius filtering.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            {/* Blood group */}
            <div>
              <label className="block text-xs font-medium text-foreground mb-1.5">Blood Group *</label>
              <div className="relative">
                <Droplets className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <select value={bloodGroup} onChange={e => setBloodGroup(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm appearance-none">
                  <option value="">Select group</option>
                  {BLOOD_GROUPS.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
            </div>

            {/* Radius */}
            <div>
              <label className="block text-xs font-medium text-foreground mb-1.5">Search Radius</label>
              <select value={radius} onChange={e => setRadius(Number(e.target.value))}
                className="w-full px-4 py-2.5 rounded-xl bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm">
                {RADIUS_OPTIONS.map(r => <option key={r} value={r}>{r} km</option>)}
              </select>
            </div>

            {/* Search button */}
            <div className="flex items-end">
              <button onClick={handleSearch} disabled={loading || !bloodGroup}
                className="w-full py-2.5 bg-primary text-primary-foreground rounded-xl font-display font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2 text-sm">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                {loading ? "Searching…" : "Search"}
              </button>
            </div>
          </div>

          {/* Location picker — full width */}
          <div>
            <label className="block text-xs font-medium text-foreground mb-1.5">Your Location (for distance ranking)</label>
            <LocationPicker
              onDetected={handleLocationDetected}
              compact
            />
            {detectedAddress && (
              <p className="text-xs text-muted-foreground mt-1 ml-1">📍 {detectedAddress}</p>
            )}
          </div>
        </div>

        {/* Results */}
        <AnimatePresence>
          {searched && !loading && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>

              {donors.length === 0 ? (
                <div className="text-center py-16 bg-card border border-border rounded-2xl">
                  <Droplets className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                  <p className="font-display font-semibold text-foreground">No donors found</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Try increasing the radius or selecting a different blood group
                  </p>
                </div>
              ) : (
                <>
                  {/* Summary + ranking explanation */}
                  <div className="flex items-start gap-2 mb-5 p-4 bg-primary/5 border border-primary/20 rounded-xl">
                    <Sparkles className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-foreground">
                      Showing <span className="font-semibold">{donors.length} {bloodGroup}</span> donor{donors.length !== 1 ? "s" : ""}
                      {userLat ? ` within ${radius} km` : ""}, ranked by{" "}
                      <span className="font-semibold">proximity, availability, and activity patterns</span>.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {donors.map((donor, idx) => {
                      const isRecommended = idx < 2;
                      const days = daysSince(donor.last_donated_at);
                      const requested = requestedIds.has(donor.auth_id);

                      return (
                        <motion.div key={donor.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.04 }}
                          className={`bg-card border rounded-2xl p-5 shadow-soft relative ${
                            isRecommended ? "border-primary/40 ring-1 ring-primary/10" : "border-border"
                          }`}>

                          {/* Rank + AI badge */}
                          <div className="flex items-center justify-between mb-4">
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                              isRecommended ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
                            }`}>#{idx + 1}</div>
                            {isRecommended && (
                              <span className="flex items-center gap-1 px-2.5 py-0.5 bg-primary text-primary-foreground rounded-full text-xs font-semibold">
                                <Sparkles className="w-3 h-3" /> AI Recommended
                              </span>
                            )}
                          </div>

                          {/* Donor info */}
                          <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-display font-bold text-xl flex-shrink-0">
                              {donor.full_name?.[0]?.toUpperCase() ?? "?"}
                            </div>
                            <div>
                              <p className="font-display font-semibold text-foreground">{donor.full_name || "Anonymous"}</p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="px-2 py-0.5 bg-primary text-primary-foreground text-xs font-bold rounded-full">
                                  {donor.blood_group}
                                </span>
                                <span className="flex items-center gap-1 text-xs text-green-600 font-medium">
                                  <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                                  Available
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Details */}
                          <div className="space-y-1.5 text-sm text-muted-foreground mb-4">
                            {donor.city && (
                              <div className="flex items-center gap-2">
                                <MapPin className="w-3.5 h-3.5 flex-shrink-0" /> {donor.city}
                              </div>
                            )}
                            {donor.distanceKm !== null && (
                              <div className="flex items-center gap-2 font-medium text-foreground">
                                <Navigation className="w-3.5 h-3.5 flex-shrink-0 text-primary" />
                                {donor.distanceKm} km away
                              </div>
                            )}
                            {days !== null && (
                              <div className="flex items-center gap-2">
                                <Clock className="w-3.5 h-3.5 flex-shrink-0" />
                                {days >= 56
                                  ? <span className="text-green-600">Eligible to donate</span>
                                  : <span className="text-orange-500">Cooldown: {56 - days}d left</span>}
                              </div>
                            )}
                          </div>

                          {/* Score bar */}
                          <div className="mb-4">
                            <div className="flex justify-between text-xs text-muted-foreground mb-1">
                              <span>Match Score</span>
                              <span className="font-semibold text-foreground">{donor.score}/100</span>
                            </div>
                            <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                              <motion.div className="h-full bg-primary rounded-full"
                                initial={{ width: 0 }}
                                animate={{ width: `${donor.score}%` }}
                                transition={{ duration: 0.5, delay: idx * 0.04 }} />
                            </div>
                            <div className="flex gap-3 mt-1 text-xs text-muted-foreground">
                              <span>📍 {donor.scoreBreakdown.distance}pts</span>
                              <span>🟢 {donor.scoreBreakdown.availability}pts</span>
                              <span>⏱ {donor.scoreBreakdown.activity}pts</span>
                            </div>
                          </div>

                          {/* Request button */}
                          <button
                            onClick={() => handleRequest(donor)}
                            disabled={requested || requestingId === donor.auth_id}
                            className={`w-full py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-colors ${
                              requested
                                ? "bg-green-100 text-green-700 cursor-default"
                                : "bg-primary text-primary-foreground hover:opacity-90"
                            } disabled:opacity-60`}>
                            {requestingId === donor.auth_id
                              ? <Loader2 className="w-4 h-4 animate-spin" />
                              : requested
                              ? <><CheckCircle className="w-4 h-4" /> Request Sent</>
                              : <><Send className="w-4 h-4" /> Request Donor</>}
                          </button>
                        </motion.div>
                      );
                    })}
                  </div>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
