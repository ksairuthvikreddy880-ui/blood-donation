-- Create table for tracking donor acceptances
CREATE TABLE public.donor_acceptances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID REFERENCES public.blood_requests(id) ON DELETE CASCADE NOT NULL,
  donor_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  status TEXT NOT NULL DEFAULT 'accepted' CHECK (status IN ('accepted', 'completed', 'cancelled')),
  units_committed INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (request_id, donor_id)
);

ALTER TABLE public.donor_acceptances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view acceptances" ON public.donor_acceptances FOR SELECT TO authenticated USING (true);
CREATE POLICY "Donors can create acceptances" ON public.donor_acceptances FOR INSERT TO authenticated WITH CHECK (auth.uid() = donor_id);
CREATE POLICY "Donors can update own acceptances" ON public.donor_acceptances FOR UPDATE TO authenticated USING (auth.uid() = donor_id);

-- Add units_fulfilled column to blood_requests
ALTER TABLE public.blood_requests ADD COLUMN IF NOT EXISTS units_fulfilled INTEGER NOT NULL DEFAULT 0;

-- Update trigger for donor_acceptances
CREATE TRIGGER update_acceptances_updated_at 
  BEFORE UPDATE ON public.donor_acceptances 
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Function to calculate distance between two points (Haversine formula)
CREATE OR REPLACE FUNCTION public.calculate_distance(
  lat1 DOUBLE PRECISION,
  lon1 DOUBLE PRECISION,
  lat2 DOUBLE PRECISION,
  lon2 DOUBLE PRECISION
)
RETURNS DOUBLE PRECISION
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  R CONSTANT DOUBLE PRECISION := 6371; -- Earth's radius in km
  dLat DOUBLE PRECISION;
  dLon DOUBLE PRECISION;
  a DOUBLE PRECISION;
  c DOUBLE PRECISION;
BEGIN
  dLat := radians(lat2 - lat1);
  dLon := radians(lon2 - lon1);
  
  a := sin(dLat/2) * sin(dLat/2) +
       cos(radians(lat1)) * cos(radians(lat2)) *
       sin(dLon/2) * sin(dLon/2);
  
  c := 2 * atan2(sqrt(a), sqrt(1-a));
  
  RETURN R * c;
END;
$$;
