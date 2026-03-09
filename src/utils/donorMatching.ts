import { supabase } from "@/integrations/supabase/client";
import { isDonorEligible } from "./donorEligibility";

export interface MatchedDonor {
  id: string;
  user_id: string;
  name: string;
  blood_group: string;
  phone: string;
  city: string;
  distance: number;
  last_donation_date: string | null;
  verified: boolean;
  availability: string;
}

export interface BloodRequestWithDetails {
  id: string;
  blood_group: string;
  urgency: string;
  city: string | null;
  status: string;
  created_at: string;
  latitude: number | null;
  longitude: number | null;
  radius_km: number;
  notes: any;
  units_fulfilled: number;
  requester: {
    name: string;
    phone: string;
  };
}

/**
 * Calculate distance between two coordinates using Haversine formula
 */
export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/**
 * Find matching donors for a blood request
 */
export const findMatchingDonors = async (
  bloodGroup: string,
  latitude: number,
  longitude: number,
  radiusKm: number
): Promise<MatchedDonor[]> => {
  try {
    // Fetch all potential donors with matching blood group
    const { data: donors, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("blood_group", bloodGroup)
      .eq("availability", "available")
      .eq("visibility", "public")
      .eq("verified", true)
      .not("latitude", "is", null)
      .not("longitude", "is", null);

    if (error) throw error;
    if (!donors) return [];

    // Filter by distance and eligibility
    const matchedDonors: MatchedDonor[] = donors
      .map((donor) => {
        const distance = calculateDistance(
          latitude,
          longitude,
          donor.latitude!,
          donor.longitude!
        );

        return {
          id: donor.id,
          user_id: donor.user_id,
          name: donor.name,
          blood_group: donor.blood_group!,
          phone: donor.phone!,
          city: donor.city!,
          distance: Math.round(distance * 10) / 10,
          last_donation_date: donor.last_donation_date,
          verified: donor.verified,
          availability: donor.availability,
        };
      })
      .filter((donor) => {
        // Within radius
        if (donor.distance > radiusKm) return false;
        // Eligible based on 56-day rule
        if (!isDonorEligible(donor.last_donation_date)) return false;
        return true;
      })
      .sort((a, b) => a.distance - b.distance); // Sort by nearest first

    return matchedDonors;
  } catch (error) {
    console.error("Error finding matching donors:", error);
    return [];
  }
};

/**
 * Get pending blood requests for a donor
 */
export const getPendingRequestsForDonor = async (
  donorUserId: string
): Promise<BloodRequestWithDetails[]> => {
  try {
    // Get donor profile
    const { data: donorProfile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", donorUserId)
      .single();

    if (profileError) throw profileError;
    if (!donorProfile || !donorProfile.latitude || !donorProfile.longitude) {
      return [];
    }

    // Get all pending requests
    const { data: requests, error: requestsError } = await supabase
      .from("blood_requests")
      .select(`
        *,
        requester:profiles!blood_requests_requester_id_fkey(name, phone)
      `)
      .eq("blood_group", donorProfile.blood_group)
      .in("status", ["pending", "accepted"])
      .not("latitude", "is", null)
      .not("longitude", "is", null);

    if (requestsError) throw requestsError;
    if (!requests) return [];

    // Check if donor already accepted each request
    const { data: acceptances, error: acceptancesError } = await supabase
      .from("donor_acceptances")
      .select("request_id")
      .eq("donor_id", donorUserId);

    if (acceptancesError) throw acceptancesError;

    const acceptedRequestIds = new Set(
      acceptances?.map((a) => a.request_id) || []
    );

    // Filter by distance and not already accepted
    const matchedRequests: BloodRequestWithDetails[] = requests
      .map((request) => {
        const distance = calculateDistance(
          donorProfile.latitude!,
          donorProfile.longitude!,
          request.latitude!,
          request.longitude!
        );

        const notes = typeof request.notes === 'string' 
          ? JSON.parse(request.notes) 
          : request.notes;

        return {
          id: request.id,
          blood_group: request.blood_group,
          urgency: request.urgency,
          city: request.city,
          status: request.status,
          created_at: request.created_at,
          latitude: request.latitude,
          longitude: request.longitude,
          radius_km: request.radius_km,
          notes: notes,
          units_fulfilled: request.units_fulfilled || 0,
          requester: Array.isArray(request.requester) 
            ? request.requester[0] 
            : request.requester,
          distance,
        };
      })
      .filter((request: any) => {
        // Within request radius
        if (request.distance > request.radius_km) return false;
        // Not already accepted by this donor
        if (acceptedRequestIds.has(request.id)) return false;
        // Not fully fulfilled
        const unitsRequired = request.notes?.unitsRequired || 1;
        if (request.units_fulfilled >= unitsRequired) return false;
        return true;
      })
      .sort((a: any, b: any) => {
        // Sort by urgency first, then distance
        const urgencyOrder = { critical: 0, urgent: 1, normal: 2 };
        const urgencyDiff =
          urgencyOrder[a.urgency as keyof typeof urgencyOrder] -
          urgencyOrder[b.urgency as keyof typeof urgencyOrder];
        if (urgencyDiff !== 0) return urgencyDiff;
        return a.distance - b.distance;
      });

    return matchedRequests;
  } catch (error) {
    console.error("Error getting pending requests:", error);
    return [];
  }
};

/**
 * Accept a blood request
 */
export const acceptBloodRequest = async (
  requestId: string,
  donorUserId: string,
  unitsCommitted: number = 1
): Promise<{ success: boolean; error?: string }> => {
  try {
    // Insert acceptance
    const { error: acceptError } = await supabase
      .from("donor_acceptances")
      .insert({
        request_id: requestId,
        donor_id: donorUserId,
        units_committed: unitsCommitted,
        status: "accepted",
      });

    if (acceptError) throw acceptError;

    // Update request units_fulfilled and status
    const { data: request, error: fetchError } = await supabase
      .from("blood_requests")
      .select("units_fulfilled, notes")
      .eq("id", requestId)
      .single();

    if (fetchError) throw fetchError;

    const notes = typeof request.notes === 'string' 
      ? JSON.parse(request.notes) 
      : request.notes;
    const unitsRequired = notes?.unitsRequired || 1;
    const newUnitsFulfilled = (request.units_fulfilled || 0) + unitsCommitted;

    const { error: updateError } = await supabase
      .from("blood_requests")
      .update({
        units_fulfilled: newUnitsFulfilled,
        status: newUnitsFulfilled >= unitsRequired ? "fulfilled" : "accepted",
      })
      .eq("id", requestId);

    if (updateError) throw updateError;

    return { success: true };
  } catch (error: any) {
    console.error("Error accepting request:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Decline a blood request (just hide it, don't record)
 */
export const declineBloodRequest = async (
  requestId: string
): Promise<{ success: boolean }> => {
  // For now, just return success - we're not tracking declines
  // In future, could add a declined_requests table
  return { success: true };
};
