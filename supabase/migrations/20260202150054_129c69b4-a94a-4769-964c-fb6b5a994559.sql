-- =====================================================
-- COMPREHENSIVE EMAIL PROTECTION MIGRATION
-- Locks down ALL email/PII visibility across the platform
-- Only owners and admins can see email addresses
-- =====================================================

-- =====================================================
-- 1. CREATOR PROFILES - Create safe public view
-- =====================================================

-- Create a safe public view for creator_profiles that excludes socials (may contain emails)
CREATE OR REPLACE VIEW public.creator_profiles_public
WITH (security_invoker = true)
AS
SELECT 
  id,
  user_id,
  display_name,
  slug,
  bio,
  city,
  photo_url,
  seeking,
  status,
  created_at,
  updated_at,
  onboarded_at
  -- EXCLUDED: socials (may contain email addresses), payout_placeholder, invited_at
FROM creator_profiles
WHERE status = 'active';

COMMENT ON VIEW public.creator_profiles_public IS 'Public view of creator profiles with socials and contact info EXCLUDED. Uses security_invoker=true for RLS inheritance.';

-- Secure function to get creator socials - only accessible to the creator themselves or admin
CREATE OR REPLACE FUNCTION public.get_creator_socials(target_creator_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  creator_user_id uuid;
  creator_socials jsonb;
BEGIN
  -- Get the user_id for this creator profile
  SELECT user_id, socials INTO creator_user_id, creator_socials
  FROM creator_profiles
  WHERE id = target_creator_id;
  
  -- Only the creator themselves or admins can see socials
  IF auth.uid() = creator_user_id OR is_admin() THEN
    RETURN creator_socials;
  ELSE
    RETURN NULL;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_creator_socials(uuid) TO authenticated;

COMMENT ON FUNCTION public.get_creator_socials(uuid) IS 'Securely retrieves creator socials. Only returns data to the creator themselves or admins.';

-- =====================================================
-- 2. SPONSOR PROFILES - Create safe public view
-- =====================================================

-- Create a safe public view for sponsor_profiles that excludes contact_email
CREATE OR REPLACE VIEW public.sponsor_profiles_public
WITH (security_invoker = true)
AS
SELECT 
  id,
  user_id,
  name,
  slug,
  description,
  logo_url,
  city,
  sponsor_type,
  seeking,
  preferred_quest_types,
  target_audience,
  brand_tone,
  budget_range,
  website,
  status,
  created_at,
  updated_at
  -- EXCLUDED: contact_email, contact_name, listing_templates, proposal_templates
FROM sponsor_profiles
WHERE status = 'active';

COMMENT ON VIEW public.sponsor_profiles_public IS 'Public view of sponsor profiles with contact_email EXCLUDED. Uses security_invoker=true for RLS inheritance.';

-- Secure function to get sponsor contact email
CREATE OR REPLACE FUNCTION public.get_sponsor_contact_email(target_sponsor_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  sponsor_user_id uuid;
  sponsor_email text;
BEGIN
  -- Get the user_id and contact_email for this sponsor
  SELECT user_id, contact_email INTO sponsor_user_id, sponsor_email
  FROM sponsor_profiles
  WHERE id = target_sponsor_id;
  
  -- Only the sponsor owner or admins can see contact email
  IF auth.uid() = sponsor_user_id OR is_admin() THEN
    RETURN sponsor_email;
  ELSE
    RETURN NULL;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_sponsor_contact_email(uuid) TO authenticated;

COMMENT ON FUNCTION public.get_sponsor_contact_email(uuid) IS 'Securely retrieves sponsor contact email. Only returns data to the sponsor owner or admins.';

-- =====================================================
-- 3. ORGANIZATIONS - Create safe public view
-- =====================================================

-- Create a safe public view for organizations that excludes all email fields
CREATE OR REPLACE VIEW public.organizations_public
WITH (security_invoker = true)
AS
SELECT 
  id,
  name,
  slug,
  description,
  logo_url,
  category,
  type,
  visibility,
  is_active,
  is_verified,
  is_umbrella,
  parent_org_id,
  website_url,
  primary_color,
  school_affiliation,
  seeking,
  status,
  created_at,
  updated_at
  -- EXCLUDED: contact_email, billing_contact_email, admin_notes, contract_notes, 
  -- verified_domains, all pricing/billing fields
FROM organizations
WHERE is_active = true;

COMMENT ON VIEW public.organizations_public IS 'Public view of organizations with ALL email fields EXCLUDED. Uses security_invoker=true for RLS inheritance.';

-- Secure function to get organization contact emails
CREATE OR REPLACE FUNCTION public.get_org_contact_emails(target_org_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  is_org_member boolean;
  contact text;
  billing text;
BEGIN
  -- Check if the caller is a member of this organization
  SELECT EXISTS (
    SELECT 1 FROM organization_members
    WHERE org_id = target_org_id
    AND user_id = auth.uid()
    AND status = 'active'
  ) INTO is_org_member;
  
  -- Only org members or admins can see contact emails
  IF is_org_member OR is_admin() THEN
    SELECT contact_email, billing_contact_email INTO contact, billing
    FROM organizations
    WHERE id = target_org_id;
    
    RETURN jsonb_build_object(
      'contact_email', contact,
      'billing_contact_email', billing
    );
  ELSE
    RETURN NULL;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_org_contact_emails(uuid) TO authenticated;

COMMENT ON FUNCTION public.get_org_contact_emails(uuid) IS 'Securely retrieves organization emails. Only returns data to org members or admins.';

-- =====================================================
-- 4. STRENGTHEN PROFILES EMAIL PROTECTION
-- =====================================================

-- Ensure the profiles email column is never leaked through any RLS bypass
-- Update the existing get_user_email function to be more restrictive
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
  -- No exceptions for squad members, org members, etc.
  IF auth.uid() = target_user_id THEN
    SELECT email INTO user_email FROM profiles WHERE id = target_user_id;
    RETURN user_email;
  ELSIF is_admin() THEN
    SELECT email INTO user_email FROM profiles WHERE id = target_user_id;
    RETURN user_email;
  ELSE
    RETURN NULL;
  END IF;
END;
$$;

-- =====================================================
-- 5. APPLICATION TABLES - Protect applicant emails
-- =====================================================

-- Secure view for creator_applications (admin only)
CREATE OR REPLACE VIEW public.creator_applications_safe
WITH (security_invoker = true)
AS
SELECT 
  id,
  name,
  creator_type,
  status,
  created_at
  -- EXCLUDED: email, message, social_links
FROM creator_applications;

COMMENT ON VIEW public.creator_applications_safe IS 'Safe view of creator applications with email EXCLUDED. Full data accessible only to admins.';

-- Secure view for sponsor_applications (admin only)  
CREATE OR REPLACE VIEW public.sponsor_applications_safe
WITH (security_invoker = true)
AS
SELECT 
  id,
  business_name,
  contact_name,
  sponsor_type,
  status,
  created_at
  -- EXCLUDED: contact_email, message, description, internal_notes
FROM sponsor_applications;

COMMENT ON VIEW public.sponsor_applications_safe IS 'Safe view of sponsor applications with email EXCLUDED. Full data accessible only to admins.';

-- Secure function to get application email (admin only)
CREATE OR REPLACE FUNCTION public.get_application_email(
  table_name text,
  target_id uuid
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result_email text;
BEGIN
  -- Only admins can retrieve application emails
  IF NOT is_admin() THEN
    RETURN NULL;
  END IF;
  
  -- Get email based on table type
  IF table_name = 'creator_applications' THEN
    SELECT email INTO result_email FROM creator_applications WHERE id = target_id;
  ELSIF table_name = 'sponsor_applications' THEN
    SELECT contact_email INTO result_email FROM sponsor_applications WHERE id = target_id;
  ELSIF table_name = 'tier_applications' THEN
    SELECT applicant_email INTO result_email FROM tier_applications WHERE id = target_id;
  ELSIF table_name = 'volunteer_applications' THEN
    SELECT email INTO result_email FROM volunteer_applications WHERE id = target_id;
  ELSIF table_name = 'partner_applications' THEN
    SELECT contact_email INTO result_email FROM partner_applications WHERE id = target_id;
  ELSE
    RETURN NULL;
  END IF;
  
  RETURN result_email;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_application_email(text, uuid) TO authenticated;

COMMENT ON FUNCTION public.get_application_email(text, uuid) IS 'Admin-only function to retrieve application emails. Returns NULL for non-admins.';

-- =====================================================
-- 6. INVITE TABLES - Protect invite emails
-- =====================================================

-- Secure view for creator_invites
CREATE OR REPLACE VIEW public.creator_invites_safe
WITH (security_invoker = true)
AS
SELECT 
  id,
  application_id,
  invited_by,
  created_at,
  expires_at,
  redeemed_at
  -- EXCLUDED: email, token
FROM creator_invites;

COMMENT ON VIEW public.creator_invites_safe IS 'Safe view of creator invites with email and token EXCLUDED.';

-- Secure view for sponsor_invites
CREATE OR REPLACE VIEW public.sponsor_invites_safe
WITH (security_invoker = true)
AS
SELECT 
  id,
  application_id,
  invited_by,
  created_at,
  expires_at,
  redeemed_at
  -- EXCLUDED: email, token
FROM sponsor_invites;

COMMENT ON VIEW public.sponsor_invites_safe IS 'Safe view of sponsor invites with email and token EXCLUDED.';

-- =====================================================
-- 7. TIER APPLICATIONS - Admin only view
-- =====================================================

CREATE OR REPLACE VIEW public.tier_applications_safe
WITH (security_invoker = true)
AS
SELECT 
  id,
  applicant_id,
  applicant_name,
  organization_name,
  tier,
  status,
  created_at,
  updated_at,
  reviewed_at,
  reviewed_by
  -- EXCLUDED: applicant_email, notes, and all sensitive business details
FROM tier_applications;

COMMENT ON VIEW public.tier_applications_safe IS 'Safe view of tier applications with email EXCLUDED.';

-- =====================================================
-- 8. PARTNER APPLICATIONS - Admin only view
-- =====================================================

CREATE OR REPLACE VIEW public.partner_applications_safe
WITH (security_invoker = true)
AS
SELECT 
  id,
  business_name,
  contact_name,
  category,
  status,
  created_at
  -- EXCLUDED: contact_email, message
FROM partner_applications;

COMMENT ON VIEW public.partner_applications_safe IS 'Safe view of partner applications with email EXCLUDED.';

-- =====================================================
-- 9. VOLUNTEER APPLICATIONS - Admin only view
-- =====================================================

CREATE OR REPLACE VIEW public.volunteer_applications_safe
WITH (security_invoker = true)
AS
SELECT 
  id,
  name,
  role_interest,
  status,
  created_at
  -- EXCLUDED: email, experience, message
FROM volunteer_applications;

COMMENT ON VIEW public.volunteer_applications_safe IS 'Safe view of volunteer applications with email EXCLUDED.';