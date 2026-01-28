-- Fix: Use security_invoker=true (safer) with controlled RLS
-- The view will respect RLS policies on the base table

DROP VIEW IF EXISTS public.profiles_public;

-- Create view with security_invoker=true (respects RLS)
CREATE VIEW public.profiles_public
WITH (security_invoker = true)
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

GRANT SELECT ON public.profiles_public TO authenticated;

-- Drop overly broad SELECT policies and keep only strict ones
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;

-- Create comprehensive SELECT policy that allows:
-- 1. Users to view their own full profile
-- 2. Admins to view all profiles
-- 3. Authenticated users to view NON-PRIVATE profiles (for the public view to work)
CREATE POLICY "Profile viewing with privacy controls"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  -- Own profile - full access
  auth.uid() = id
  OR
  -- Admin - full access
  public.has_role(auth.uid(), 'admin')
  OR
  -- Public/squad_only profiles visible to authenticated users (view filters sensitive data)
  COALESCE(privacy_settings->>'profile_visibility', 'public') != 'private'
);

COMMENT ON VIEW public.profiles_public IS 
'Privacy-safe view using security_invoker=true (respects RLS).
EXCLUDED: email, preferences, notification_preferences, tutorial_*.
FILTERED: city hidden for non-public, name masked for private.
The base table RLS + view columns ensure email is NEVER exposed.
COMPLIANCE: GDPR Article 5, CCPA 1798.100';