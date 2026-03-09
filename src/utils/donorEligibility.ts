export interface DonorProfile {
  availability: string;
  visibility?: string;
  verified: boolean;
  last_donation_date: string | null;
}

export type DonorStatus = 
  | "visible" 
  | "hidden" 
  | "cooldown" 
  | "pending_verification";

export interface DonorStatusInfo {
  status: DonorStatus;
  label: string;
  color: string;
  bgColor: string;
  icon: string;
  description: string;
}

/**
 * Calculate days since last donation
 */
export const daysSinceLastDonation = (lastDonationDate: string | null): number => {
  if (!lastDonationDate) return Infinity;
  const lastDate = new Date(lastDonationDate);
  const today = new Date();
  const diffTime = Math.abs(today.getTime() - lastDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

/**
 * Check if donor is eligible based on 56-day rule
 */
export const isDonorEligible = (lastDonationDate: string | null): boolean => {
  const days = daysSinceLastDonation(lastDonationDate);
  return days >= 56; // Minimum 56 days (8 weeks) between donations
};

/**
 * Calculate days remaining until eligible
 */
export const daysUntilEligible = (lastDonationDate: string | null): number => {
  if (!lastDonationDate) return 0;
  const days = daysSinceLastDonation(lastDonationDate);
  return Math.max(0, 56 - days);
};

/**
 * Check if donor should be visible in public search
 */
export const isPubliclyVisible = (
  profile: DonorProfile,
  disableVerification: boolean = false,
  disableEligibility: boolean = false
): boolean => {
  // Must be available
  if (profile.availability !== "available") return false;

  // Must have public visibility
  if (profile.visibility === "private") return false;

  // Must be verified (unless disabled for testing)
  if (!disableVerification && !profile.verified) return false;

  // Must be eligible based on donation date (unless disabled for testing)
  if (!disableEligibility && !isDonorEligible(profile.last_donation_date)) return false;

  return true;
};

/**
 * Get donor status with display information
 */
export const getDonorStatus = (profile: DonorProfile): DonorStatusInfo => {
  // Check verification first
  if (!profile.verified) {
    return {
      status: "pending_verification",
      label: "Pending Verification",
      color: "text-gray-600",
      bgColor: "bg-gray-100",
      icon: "⚪",
      description: "Your profile is under review. You'll be notified once verified.",
    };
  }

  // Check availability
  if (profile.availability !== "available") {
    return {
      status: "hidden",
      label: "Hidden (Availability Off)",
      color: "text-yellow-700",
      bgColor: "bg-yellow-100",
      icon: "🟡",
      description: "You're marked as unavailable. Turn on availability to be visible.",
    };
  }

  // Check eligibility (56-day rule)
  if (!isDonorEligible(profile.last_donation_date)) {
    const daysLeft = daysUntilEligible(profile.last_donation_date);
    return {
      status: "cooldown",
      label: "Not Eligible (Donation Cooldown)",
      color: "text-red-700",
      bgColor: "bg-red-100",
      icon: "🔴",
      description: `You can donate again in ${daysLeft} days. This ensures your safety.`,
    };
  }

  // Check visibility setting
  if (profile.visibility === "private") {
    return {
      status: "hidden",
      label: "Hidden (Private Mode)",
      color: "text-yellow-700",
      bgColor: "bg-yellow-100",
      icon: "🟡",
      description: "Your profile is set to private. Change to public to be visible.",
    };
  }

  // All checks passed - visible
  return {
    status: "visible",
    label: "Visible to Public",
    color: "text-green-700",
    bgColor: "bg-green-100",
    icon: "🟢",
    description: "Your profile is visible to people searching for donors.",
  };
};

/**
 * Mask phone number for privacy
 */
export const maskPhoneNumber = (phone: string | null): string => {
  if (!phone) return "Not provided";
  if (phone.length < 4) return "***";
  return phone.slice(0, 3) + "****" + phone.slice(-2);
};

/**
 * Get area from full address (hide exact location)
 */
export const getAreaOnly = (city: string | null): string => {
  if (!city) return "Location not set";
  // If city contains comma, take only the area part
  const parts = city.split(",");
  return parts[0].trim();
};
