-- Add listing_templates column to sponsor_profiles
ALTER TABLE public.sponsor_profiles 
ADD COLUMN IF NOT EXISTS listing_templates jsonb DEFAULT '[]'::jsonb;