-- ============================================================================
-- PHASE 1A (Part 2): ORGANIZATION HIERARCHY & CLUB SYSTEM
-- ============================================================================

-- 1) Organization Status Enum
CREATE TYPE public.org_status AS ENUM ('pending', 'active', 'suspended', 'disabled');

-- 2) Add hierarchy and status columns to organizations
ALTER TABLE public.organizations 
  ADD COLUMN IF NOT EXISTS parent_org_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS status public.org_status NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS is_umbrella BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS visibility TEXT NOT NULL DEFAULT 'public' CHECK (visibility IN ('public', 'private', 'invite_only')),
  ADD COLUMN IF NOT EXISTS verified_domains TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS member_limit INTEGER,
  ADD COLUMN IF NOT EXISTS admin_notes TEXT,
  ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS suspended_by UUID,
  ADD COLUMN IF NOT EXISTS suspend_reason TEXT,
  ADD COLUMN IF NOT EXISTS category TEXT;

-- 3) Organization Applications Table (for org/club creation requests)
CREATE TABLE public.org_applications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  applicant_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  parent_org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type public.organization_type NOT NULL DEFAULT 'club',
  description TEXT,
  category TEXT,
  visibility TEXT NOT NULL DEFAULT 'public' CHECK (visibility IN ('public', 'private', 'invite_only')),
  intended_audience TEXT,
  requested_admins TEXT[],
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'declined')),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES public.profiles(id),
  decline_reason TEXT,
  agreed_to_terms BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.org_applications ENABLE ROW LEVEL SECURITY;

-- 4) Organization Invite Codes Table
CREATE TABLE public.org_invite_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  code TEXT NOT NULL UNIQUE,
  created_by UUID NOT NULL REFERENCES public.profiles(id),
  max_uses INTEGER,
  uses_count INTEGER NOT NULL DEFAULT 0,
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.org_invite_codes ENABLE ROW LEVEL SECURITY;

-- 5) Verified Email Domains for umbrella orgs
CREATE TABLE public.org_verified_emails (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  domain TEXT NOT NULL,
  verified_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (org_id, user_id)
);

ALTER TABLE public.org_verified_emails ENABLE ROW LEVEL SECURITY;

-- 6) RLS Policies for org_applications
CREATE POLICY "Users view own applications" ON public.org_applications 
  FOR SELECT USING (applicant_id = auth.uid());

CREATE POLICY "Users create applications" ON public.org_applications 
  FOR INSERT WITH CHECK (applicant_id = auth.uid());

CREATE POLICY "Admins manage applications" ON public.org_applications 
  FOR ALL USING (public.is_admin());

CREATE POLICY "Org admins view club applications" ON public.org_applications
  FOR SELECT USING (
    parent_org_id IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM public.profile_organizations po
      WHERE po.org_id = org_applications.parent_org_id
      AND po.profile_id = auth.uid()
      AND po.role IN ('admin', 'org_admin')
    )
  );

-- 7) RLS Policies for org_invite_codes
CREATE POLICY "Org admins manage invite codes" ON public.org_invite_codes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profile_organizations po
      WHERE po.org_id = org_invite_codes.org_id
      AND po.profile_id = auth.uid()
      AND po.role IN ('admin', 'org_admin', 'social_chair')
    )
  );

CREATE POLICY "Anyone can validate invite codes" ON public.org_invite_codes
  FOR SELECT USING (is_active = true);

-- 8) RLS Policies for org_verified_emails
CREATE POLICY "Users view own verified emails" ON public.org_verified_emails
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins view all verified emails" ON public.org_verified_emails
  FOR SELECT USING (public.is_admin());

CREATE POLICY "System inserts verified emails" ON public.org_verified_emails
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- 9) Update organizations RLS to handle visibility and status
DROP POLICY IF EXISTS "View verified orgs" ON public.organizations;

CREATE POLICY "View accessible orgs" ON public.organizations
  FOR SELECT USING (
    status = 'active' AND is_active = true AND (
      visibility = 'public' OR
      public.is_admin() OR
      EXISTS (
        SELECT 1 FROM public.profile_organizations po
        WHERE po.org_id = organizations.id AND po.profile_id = auth.uid()
      ) OR
      (parent_org_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM public.profile_organizations po
        WHERE po.org_id = organizations.parent_org_id AND po.profile_id = auth.uid()
      ))
    )
  );

-- 10) Helper function to check if user has org role
CREATE OR REPLACE FUNCTION public.has_org_role(p_org_id UUID, p_roles org_member_role[])
RETURNS BOOLEAN
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profile_organizations
    WHERE org_id = p_org_id
    AND profile_id = auth.uid()
    AND role = ANY(p_roles)
  )
$$;

-- 11) Function to join org via verified email
CREATE OR REPLACE FUNCTION public.join_org_via_email(p_org_id UUID, p_email TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_domain TEXT;
  v_org RECORD;
BEGIN
  v_domain := split_part(p_email, '@', 2);
  SELECT * INTO v_org FROM public.organizations WHERE id = p_org_id;
  
  IF v_org IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Organization not found');
  END IF;
  
  IF NOT (v_domain = ANY(v_org.verified_domains)) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Email domain not authorized for this organization');
  END IF;
  
  INSERT INTO public.org_verified_emails (org_id, user_id, email, domain)
  VALUES (p_org_id, auth.uid(), p_email, v_domain)
  ON CONFLICT (org_id, user_id) DO NOTHING;
  
  INSERT INTO public.profile_organizations (profile_id, org_id, role)
  VALUES (auth.uid(), p_org_id, 'member')
  ON CONFLICT (profile_id, org_id) DO NOTHING;
  
  RETURN jsonb_build_object('success', true, 'org_name', v_org.name);
END;
$$;

-- 12) Function to redeem org invite code
CREATE OR REPLACE FUNCTION public.redeem_org_invite(p_code TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invite RECORD;
BEGIN
  SELECT oi.*, o.name as org_name INTO v_invite
  FROM public.org_invite_codes oi
  JOIN public.organizations o ON o.id = oi.org_id
  WHERE oi.code = UPPER(TRIM(p_code))
  AND oi.is_active = true
  AND (oi.expires_at IS NULL OR oi.expires_at > now())
  AND (oi.max_uses IS NULL OR oi.uses_count < oi.max_uses);
  
  IF v_invite IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid or expired invite code');
  END IF;
  
  IF EXISTS (SELECT 1 FROM public.profile_organizations WHERE profile_id = auth.uid() AND org_id = v_invite.org_id) THEN
    RETURN jsonb_build_object('success', true, 'already_member', true, 'org_name', v_invite.org_name);
  END IF;
  
  INSERT INTO public.profile_organizations (profile_id, org_id, role)
  VALUES (auth.uid(), v_invite.org_id, 'member');
  
  UPDATE public.org_invite_codes SET uses_count = uses_count + 1 WHERE id = v_invite.id;
  
  RETURN jsonb_build_object('success', true, 'org_id', v_invite.org_id, 'org_name', v_invite.org_name);
END;
$$;

-- 13) Update triggers
CREATE TRIGGER update_org_applications_updated_at 
  BEFORE UPDATE ON public.org_applications 
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 14) Update UT Austin org with verified domains and umbrella status
UPDATE public.organizations 
SET 
  is_umbrella = true,
  verified_domains = ARRAY['utexas.edu', 'mba.utexas.edu'],
  status = 'active',
  category = 'University'
WHERE slug = 'ut-austin-community';

-- 15) Create Pilot Org
INSERT INTO public.organizations (name, slug, type, is_umbrella, status, description, is_verified, is_active, category)
VALUES ('Pilot Org', 'pilot-org', 'other', true, 'active', 'Internal testing and demos', true, true, 'Internal')
ON CONFLICT (slug) DO NOTHING;

-- 16) Indexes for performance
CREATE INDEX IF NOT EXISTS idx_organizations_parent_org ON public.organizations(parent_org_id);
CREATE INDEX IF NOT EXISTS idx_organizations_status ON public.organizations(status);
CREATE INDEX IF NOT EXISTS idx_org_applications_status ON public.org_applications(status);
CREATE INDEX IF NOT EXISTS idx_org_verified_emails_domain ON public.org_verified_emails(domain);