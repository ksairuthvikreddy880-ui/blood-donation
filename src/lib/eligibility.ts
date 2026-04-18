/**
 * Donor eligibility helpers.
 * Rule: minimum 90 days between donations.
 */

export const DONATION_GAP_DAYS = 90;

/** Returns true if the donor is eligible to donate today */
export function isEligible(lastDonatedAt: string | null | undefined): boolean {
  if (!lastDonatedAt) return true; // never donated → eligible
  const last = new Date(lastDonatedAt);
  const today = new Date();
  const diffMs = today.getTime() - last.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  return diffDays >= DONATION_GAP_DAYS;
}

/** Returns the next eligible date (last + 90 days) */
export function nextEligibleDate(lastDonatedAt: string | null | undefined): Date | null {
  if (!lastDonatedAt) return null;
  const next = new Date(lastDonatedAt);
  next.setDate(next.getDate() + DONATION_GAP_DAYS);
  return next;
}

/** Days remaining until eligible (0 if already eligible) */
export function daysUntilEligible(lastDonatedAt: string | null | undefined): number {
  if (!lastDonatedAt) return 0;
  const next = nextEligibleDate(lastDonatedAt)!;
  const today = new Date();
  const diff = Math.ceil((next.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  return Math.max(0, diff);
}

/** Returns true if the profile is considered complete for donation */
export function isProfileComplete(profile: { blood_group?: string | null; last_donated_at?: string | null } | null): boolean {
  if (!profile) return false;
  return !!profile.blood_group;
}
