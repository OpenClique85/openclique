-- Remove the overly permissive public SELECT policy on creator_profiles base table
-- All public access should go through creator_profiles_public view which excludes email
DROP POLICY IF EXISTS "Anyone can view active creator profiles" ON public.creator_profiles;

-- Add a comment documenting the security pattern
COMMENT ON VIEW public.creator_profiles_public IS 'Public-safe view of creator profiles. Excludes contact_email and respects privacy_settings. Use this view instead of direct table access.';