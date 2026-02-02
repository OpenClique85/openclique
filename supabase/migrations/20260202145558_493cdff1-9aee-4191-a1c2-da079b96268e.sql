-- Drop the existing profiles_public view and recreate with updated structure
DROP VIEW IF EXISTS public.profiles_public;

-- Create a comprehensive safe view for profiles that never exposes email
-- This view respects privacy settings and excludes all sensitive PII
CREATE VIEW public.profiles_public
WITH (security_invoker = true)
AS
SELECT 
  id,
  CASE
    WHEN COALESCE(privacy_settings->>'profile_visibility', 'public') = 'private' THEN 'Private User'
    ELSE display_name
  END AS display_name,
  CASE
    WHEN COALESCE(privacy_settings->>'profile_visibility', 'public') = 'public' THEN city
    ELSE NULL
  END AS city,
  COALESCE(privacy_settings->>'profile_visibility', 'public') AS visibility_level,
  created_at
  -- NEVER exposed: email, preferences, notification_preferences, privacy_settings details
FROM profiles;

COMMENT ON VIEW public.profiles_public IS 'Public view of profiles with ALL PII stripped. Email is NEVER exposed through this view. Uses security_invoker=true for RLS inheritance.';

-- Update the get_user_email function to be more explicit about access control
CREATE OR REPLACE FUNCTION public.get_user_email(target_user_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_email text;
BEGIN
  -- STRICT ACCESS CONTROL: Only the user themselves or admins can see email
  IF auth.uid() = target_user_id THEN
    -- User requesting their own email
    SELECT email INTO user_email FROM profiles WHERE id = target_user_id;
    RETURN user_email;
  ELSIF is_admin() THEN
    -- Admin access for operational purposes
    SELECT email INTO user_email FROM profiles WHERE id = target_user_id;
    RETURN user_email;
  ELSE
    -- Everyone else gets NULL - no email exposure
    RETURN NULL;
  END IF;
END;
$$;

COMMENT ON FUNCTION public.get_user_email(uuid) IS 'Securely retrieves email for a user. STRICT ACCESS: Only returns email to the user themselves or admins. All other requests return NULL.';

-- Create a helper function to check if current user can see another user's email
CREATE OR REPLACE FUNCTION public.can_view_user_email(target_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT auth.uid() = target_user_id OR is_admin();
$$;

GRANT EXECUTE ON FUNCTION public.can_view_user_email(uuid) TO authenticated;

COMMENT ON FUNCTION public.can_view_user_email(uuid) IS 'Returns true if the current user can view the target user email (only self or admins).';