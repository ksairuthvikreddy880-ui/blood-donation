-- ============================================================
-- DONOR ELIGIBILITY SETUP
-- Run this in your Supabase SQL editor
-- ============================================================

-- 1. Add is_profile_complete column (blood_group & last_donated_at already exist)
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS is_profile_complete BOOLEAN DEFAULT false;

-- 2. Mark existing users with a blood_group as profile-complete
UPDATE public.users
  SET is_profile_complete = true
  WHERE blood_group IS NOT NULL;

-- 3. Helper function: check if a donor is eligible (90-day gap)
CREATE OR REPLACE FUNCTION public.is_donor_eligible(last_donated DATE)
RETURNS BOOLEAN AS $$
BEGIN
  IF last_donated IS NULL THEN
    RETURN TRUE; -- never donated → eligible
  END IF;
  RETURN (CURRENT_DATE - last_donated) >= 90;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 4. Optional view: eligible available donors
CREATE OR REPLACE VIEW public.eligible_donors AS
  SELECT *
  FROM public.users
  WHERE is_available = true
    AND blood_group IS NOT NULL
    AND public.is_donor_eligible(last_donated_at::DATE);

-- ============================================================
-- DONE. No breaking changes — all columns are additive.
-- ============================================================
