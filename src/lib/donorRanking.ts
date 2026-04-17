import type { UserProfile } from "@/integrations/supabase/types";

export interface RankedDonor extends UserProfile {
  score: number;
  distanceKm: number | null;
  scoreBreakdown: { distance: number; availability: number; activity: number };
}

// Haversine distance in km
export function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function rankDonors(
  donors: UserProfile[],
  userLat?: number | null,
  userLon?: number | null
): RankedDonor[] {
  return donors
    .map((d) => {
      // ── Distance score ──────────────────────────────────────
      let distanceScore = 10;
      let distanceKm: number | null = null;
      if (userLat && userLon && d.latitude && d.longitude) {
        distanceKm = Math.round(haversine(userLat, userLon, d.latitude, d.longitude) * 10) / 10;
        if (distanceKm < 2) distanceScore = 50;
        else if (distanceKm < 5) distanceScore = 30;
        else distanceScore = 10;
      }

      // ── Availability score ───────────────────────────────────
      const availabilityScore = d.is_available ? 30 : 0;

      // ── Activity score (56-day eligibility rule) ─────────────
      let activityScore = 20; // default: never donated = fully eligible
      if (d.last_donated_at) {
        const daysSince = Math.floor(
          (Date.now() - new Date(d.last_donated_at).getTime()) / (1000 * 60 * 60 * 24)
        );
        activityScore = daysSince >= 56 ? 20 : 5;
      }

      const score = distanceScore + availabilityScore + activityScore;

      return {
        ...d,
        score,
        distanceKm,
        scoreBreakdown: { distance: distanceScore, availability: availabilityScore, activity: activityScore },
      };
    })
    .sort((a, b) => b.score - a.score);
}
