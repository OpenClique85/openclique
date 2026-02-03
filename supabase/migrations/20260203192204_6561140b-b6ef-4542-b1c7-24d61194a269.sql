-- Drop and recreate view with privacy controls
DROP VIEW IF EXISTS public.creator_profiles_public CASCADE;

CREATE VIEW public.creator_profiles_public
WITH (security_invoker = true)
AS
SELECT 
  cp.id,
  cp.user_id,
  cp.display_name,
  cp.slug,
  CASE 
    WHEN COALESCE((cp.privacy_settings->>'show_bio')::boolean, true) = true THEN cp.bio 
    ELSE NULL 
  END as bio,
  CASE 
    WHEN COALESCE((cp.privacy_settings->>'show_city')::boolean, true) = true THEN cp.city 
    ELSE NULL 
  END as city,
  cp.photo_url,
  CASE 
    WHEN COALESCE((cp.privacy_settings->>'show_seeking')::boolean, true) = true THEN cp.seeking 
    ELSE NULL 
  END as seeking,
  CASE 
    WHEN COALESCE((cp.privacy_settings->>'show_socials')::boolean, true) = true THEN cp.socials 
    ELSE NULL 
  END as socials,
  cp.status,
  cp.created_at,
  cp.updated_at,
  cp.onboarded_at
FROM public.creator_profiles cp
WHERE cp.status = 'active';

GRANT SELECT ON public.creator_profiles_public TO authenticated, anon;

COMMENT ON VIEW public.creator_profiles_public IS 'Public view of creator profiles with privacy controls';