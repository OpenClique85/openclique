-- Recreate the profiles_public view with correct columns (no avatar_url in profiles table)
DROP VIEW IF EXISTS public.profiles_public;

CREATE VIEW public.profiles_public
WITH (security_invoker = false)
AS
SELECT 
  p.id,
  CASE 
    WHEN COALESCE(p.privacy_settings->>'profile_visibility', 'public') = 'private' 
    THEN 'Private User'
    ELSE p.display_name 
  END as display_name,
  CASE 
    WHEN COALESCE(p.privacy_settings->>'profile_visibility', 'public') = 'public' 
    THEN p.city 
    ELSE NULL 
  END as city,
  COALESCE(p.privacy_settings->>'profile_visibility', 'public') as visibility_level,
  p.created_at
FROM public.profiles p;

-- Grant SELECT on the view to authenticated users
GRANT SELECT ON public.profiles_public TO authenticated;

-- Add documentation
COMMENT ON VIEW public.profiles_public IS 
'SECURITY MODEL: Privacy-safe view - NEVER exposes email or PII.
PROTECTED FIELDS: email, notification_preferences, tutorial_*, preferences.
VISIBILITY: public=name+city, squad_only=name only, private=masked.
COMPLIANCE: GDPR Article 5 (data minimization), CCPA 1798.100';

-- Update the helper function with proper search_path
CREATE OR REPLACE FUNCTION public.can_view_profile(_viewer_id uuid, _target_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    _viewer_id = _target_id
    OR has_role(_viewer_id, 'admin')
    OR (
      SELECT 
        CASE 
          WHEN COALESCE((SELECT privacy_settings->>'profile_visibility' FROM profiles WHERE id = _target_id), 'public') = 'private' 
          THEN false
          WHEN COALESCE((SELECT privacy_settings->>'profile_visibility' FROM profiles WHERE id = _target_id), 'public') = 'squad_only' 
          THEN EXISTS (
            SELECT 1 FROM squad_members sm1
            JOIN squad_members sm2 ON sm1.persistent_squad_id = sm2.persistent_squad_id
            WHERE sm1.user_id = _viewer_id 
            AND sm2.user_id = _target_id
            AND sm1.status = 'active'
            AND sm2.status = 'active'
          )
          ELSE true
        END
    )
$$;