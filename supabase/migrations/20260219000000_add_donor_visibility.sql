-- Add visibility column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS visibility TEXT DEFAULT 'public' CHECK (visibility IN ('public', 'private'));

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.visibility IS 'Controls whether donor profile is visible in public search (public/private)';

-- Update existing profiles to have public visibility by default
UPDATE public.profiles SET visibility = 'public' WHERE visibility IS NULL;
