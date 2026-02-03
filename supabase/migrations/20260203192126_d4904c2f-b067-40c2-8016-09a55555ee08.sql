-- Step 1: Add privacy_settings column to creator_profiles
ALTER TABLE public.creator_profiles 
ADD COLUMN privacy_settings JSONB DEFAULT '{"show_seeking": true, "show_bio": true, "show_socials": true, "show_city": true}'::jsonb;

COMMENT ON COLUMN public.creator_profiles.privacy_settings IS 'Creator privacy controls: show_seeking, show_bio, show_socials, show_city - all default to true for public visibility';