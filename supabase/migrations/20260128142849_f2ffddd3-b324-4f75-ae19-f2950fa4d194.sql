
-- ============================================================================
-- DATA PROTECTION PART 2: CONSENT LOGGING & PROFILE VISIBILITY
-- ============================================================================

-- 1. CREATE DATA PROTECTION CONSENT LOG
-- Tracks all consent actions for legal compliance (GDPR, CCPA)
CREATE TABLE IF NOT EXISTS public.user_consent_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  consent_type text NOT NULL, -- e.g., 'terms_of_service', 'privacy_policy', 'marketing', 'data_sharing'
  consent_given boolean NOT NULL,
  consent_version text NOT NULL DEFAULT '1.0',
  ip_address_hash text, -- SHA256 hash for privacy, not raw IP
  user_agent_summary text, -- Device category only (mobile/desktop/tablet)
  created_at timestamptz NOT NULL DEFAULT now(),
  withdrawn_at timestamptz
);

-- Enable RLS on consent log
ALTER TABLE public.user_consent_log ENABLE ROW LEVEL SECURITY;

-- Users can view their own consent history (transparency)
CREATE POLICY "Users can view their own consent history"
ON public.user_consent_log FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Users can record their consent decisions
CREATE POLICY "Users can record consent"
ON public.user_consent_log FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Admins can view consent log for compliance audits
CREATE POLICY "Admins can view consent log for compliance"
ON public.user_consent_log FOR SELECT
TO authenticated
USING (is_admin());

-- 2. CREATE SECURE PUBLIC PROFILE VIEW
-- Respects privacy_settings from profiles table
DROP VIEW IF EXISTS public.profiles_public;
CREATE VIEW public.profiles_public
WITH (security_invoker = on) AS
SELECT 
  p.id,
  CASE 
    WHEN (p.privacy_settings->>'profile_visibility')::text = 'private' THEN 'Private User'
    ELSE p.display_name
  END as display_name,
  CASE 
    WHEN (p.privacy_settings->>'profile_visibility')::text = 'private' THEN NULL
    ELSE p.city
  END as city,
  p.created_at,
  COALESCE((p.privacy_settings->>'profile_visibility')::text, 'public') as visibility_level
  -- Excluded: email, preferences, notification_preferences, privacy_settings details
FROM public.profiles p;

-- Grant SELECT on public view to authenticated users only
GRANT SELECT ON public.profiles_public TO authenticated;

-- 3. HELPER FUNCTION: Check if user can view another user's profile
CREATE OR REPLACE FUNCTION public.can_view_profile(_viewer_id uuid, _target_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    _viewer_id = _target_id -- Always can view own profile
    OR is_admin() -- Admins can view all
    OR (
      SELECT 
        CASE 
          WHEN (p.privacy_settings->>'profile_visibility')::text = 'private' THEN false
          WHEN (p.privacy_settings->>'profile_visibility')::text = 'squad_only' THEN 
            EXISTS (
              SELECT 1 FROM squad_members sm1
              JOIN squad_members sm2 ON sm1.persistent_squad_id = sm2.persistent_squad_id
              WHERE sm1.user_id = _viewer_id 
              AND sm2.user_id = _target_id
              AND sm1.status = 'active'
              AND sm2.status = 'active'
            )
          ELSE true -- public visibility
        END
      FROM public.profiles p
      WHERE p.id = _target_id
    )
$$;

-- 4. CREATE INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_user_consent_log_user 
ON public.user_consent_log (user_id, consent_type);

CREATE INDEX IF NOT EXISTS idx_user_consent_log_type_version 
ON public.user_consent_log (consent_type, consent_version);

-- 5. ADD DOCUMENTATION
COMMENT ON TABLE public.user_consent_log IS 'GDPR/CCPA compliant consent tracking. Records all user consent decisions with timestamps. Used for compliance audits and user transparency. IP addresses are hashed (SHA256) to protect user privacy while maintaining audit capability.';

COMMENT ON VIEW public.profiles_public IS 'Privacy-respecting public view of user profiles. Automatically respects user privacy_settings.profile_visibility preference. Excludes: email, notification preferences, and detailed settings. Use this view for public-facing features.';

COMMENT ON FUNCTION public.can_view_profile IS 'Checks if viewer can see target profile based on privacy settings. Considers: ownership, admin status, squad membership for squad_only profiles, and public visibility. Use in RLS policies and application logic.';
