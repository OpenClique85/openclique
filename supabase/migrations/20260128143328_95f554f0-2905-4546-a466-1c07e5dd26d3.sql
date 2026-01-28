-- Fix profiles RLS to allow viewing public profiles via the secure view
-- The profiles_public view already filters out sensitive data and respects privacy settings

-- Add policy to allow viewing profiles with public visibility
CREATE POLICY "Public profiles are viewable by authenticated users"
ON public.profiles
FOR SELECT
USING (
  -- User viewing their own profile (already covered, but included for clarity)
  auth.uid() = id
  OR
  -- Admin access (already covered separately)
  public.is_admin()
  OR
  -- Public profiles can be viewed by any authenticated user
  (
    auth.uid() IS NOT NULL 
    AND COALESCE(privacy_settings->>'profile_visibility', 'public') = 'public'
  )
  OR
  -- Squad-only profiles can be viewed by squad/clique members
  (
    auth.uid() IS NOT NULL 
    AND COALESCE(privacy_settings->>'profile_visibility', 'public') = 'squad_only'
    AND public.can_view_profile(auth.uid(), id)
  )
);

-- Add comment to document the security model
COMMENT ON VIEW public.profiles_public IS 
'Privacy-respecting public view of user profiles.

SECURITY MODEL:
- Uses security_invoker=on to respect RLS policies
- Automatically filters based on privacy_settings.profile_visibility:
  * "public": display_name and city visible to all authenticated users
  * "squad_only": only visible to squad/clique members
  * "private": shows "Private User" with no location
  
EXCLUDED FIELDS (never exposed):
- email (PII)
- notification_preferences (internal)
- privacy_settings details (internal)
- onboarding data (internal)
- trust_factors (internal)

USAGE: Always query this view for public-facing features, never the base profiles table.';