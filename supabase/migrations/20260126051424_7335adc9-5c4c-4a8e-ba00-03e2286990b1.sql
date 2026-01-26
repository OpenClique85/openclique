-- =============================================================================
-- MULTI-TENANT PRICING & ENTITLEMENT SYSTEM
-- OpenClique is multi-tenant, not cascading. Each payer is independent.
-- =============================================================================

-- Account tier enum (billing entity type)
DO $$ BEGIN
  CREATE TYPE account_tier AS ENUM (
    'city',
    'enterprise',
    'organization',
    'individual_free',
    'individual_premium'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Enterprise sub-type (for UI/sales distinction, NOT backend gating)
DO $$ BEGIN
  CREATE TYPE enterprise_type AS ENUM (
    'company',
    'university',
    'military',
    'program'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Entitlement scope (defines what features unlock)
DO $$ BEGIN
  CREATE TYPE entitlement_scope AS ENUM (
    'city_scope',
    'org_scope',
    'personal_scope'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Billing/pilot status per-tenant
DO $$ BEGIN
  CREATE TYPE billing_status AS ENUM (
    'pilot_active',
    'negotiating',
    'converted',
    'past_due',
    'churned'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Pricing model (configurable per enterprise)
DO $$ BEGIN
  CREATE TYPE pricing_model AS ENUM (
    'per_cohort',
    'per_seat',
    'annual_platform',
    'hybrid'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Overage policy
DO $$ BEGIN
  CREATE TYPE overage_policy AS ENUM (
    'soft_cap_notify',
    'hard_cap_block'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- =============================================================================
-- EXTEND ORGANIZATIONS TABLE (Enterprise Billing Fields)
-- =============================================================================

ALTER TABLE organizations ADD COLUMN IF NOT EXISTS account_tier account_tier;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS enterprise_type enterprise_type;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS billing_status billing_status DEFAULT 'pilot_active';
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS pilot_signup_date timestamptz;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS pilot_end_date timestamptz;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS pricing_model pricing_model;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS price_per_seat numeric;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS price_per_cohort numeric;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS annual_commit numeric;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS seat_cap integer;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS cohort_cap integer;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS overage_policy overage_policy DEFAULT 'soft_cap_notify';
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS intended_plan text;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS estimated_arr numeric;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS billing_contact_email text;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS contract_notes text;

-- =============================================================================
-- USER ENTITLEMENTS TABLE (Scoped, Not Cascading)
-- =============================================================================

CREATE TABLE IF NOT EXISTS user_entitlements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  scope entitlement_scope NOT NULL,
  source_type text NOT NULL CHECK (source_type IN ('org_membership', 'personal_subscription', 'admin_grant')),
  source_org_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  is_active boolean DEFAULT true,
  granted_at timestamptz DEFAULT now(),
  expires_at timestamptz,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, scope, source_org_id)
);

CREATE INDEX IF NOT EXISTS idx_user_entitlements_user ON user_entitlements(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_user_entitlements_scope ON user_entitlements(scope, source_org_id);

ALTER TABLE user_entitlements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own entitlements" ON user_entitlements;
CREATE POLICY "Users can view their own entitlements"
  ON user_entitlements FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins can manage all entitlements" ON user_entitlements;
CREATE POLICY "Admins can manage all entitlements"
  ON user_entitlements FOR ALL
  USING (public.is_admin());

-- =============================================================================
-- TIER APPLICATIONS TABLE (Sales Pipeline)
-- =============================================================================

CREATE TABLE IF NOT EXISTS tier_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  applicant_id uuid REFERENCES profiles(id),
  applicant_email text NOT NULL,
  applicant_name text NOT NULL,
  organization_name text NOT NULL,
  tier account_tier NOT NULL,
  enterprise_type enterprise_type,
  city_name text,
  city_region text,
  estimated_population integer,
  estimated_headcount integer,
  use_case_description text,
  demo_requested boolean DEFAULT false,
  demo_scheduled_at timestamptz,
  demo_completed_at timestamptz,
  intended_plan text,
  intended_pricing_model pricing_model,
  estimated_arr numeric,
  status text DEFAULT 'pending' CHECK (status IN (
    'pending', 'demo_scheduled', 'in_review', 'approved', 'declined', 'converted'
  )),
  reviewed_by uuid,
  reviewed_at timestamptz,
  decline_reason text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE tier_applications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own applications" ON tier_applications;
CREATE POLICY "Users can view their own applications"
  ON tier_applications FOR SELECT
  USING (applicant_id = auth.uid());

DROP POLICY IF EXISTS "Users can create applications" ON tier_applications;
CREATE POLICY "Users can create applications"
  ON tier_applications FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Admin full access tier applications" ON tier_applications;
CREATE POLICY "Admin full access tier applications"
  ON tier_applications FOR ALL
  USING (public.is_admin());

-- =============================================================================
-- PREMIUM INTEREST TABLE (Individual Tracking)
-- =============================================================================

CREATE TABLE IF NOT EXISTS premium_interest (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  intended_plan text CHECK (intended_plan IN ('premium_monthly', 'premium_annual')),
  acknowledged_pricing boolean DEFAULT false,
  pilot_opt_in_date timestamptz,
  feature_usage jsonb DEFAULT '{}',
  ready_to_convert boolean DEFAULT false,
  billing_status billing_status DEFAULT 'pilot_active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE premium_interest ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own premium interest" ON premium_interest;
CREATE POLICY "Users manage own premium interest"
  ON premium_interest FOR ALL
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins can view all premium interest" ON premium_interest;
CREATE POLICY "Admins can view all premium interest"
  ON premium_interest FOR SELECT
  USING (public.is_admin());

-- =============================================================================
-- PRICING ANALYTICS TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS pricing_page_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id),
  session_id text,
  event_type text NOT NULL CHECK (event_type IN (
    'page_view', 'tier_view', 'cta_click', 'demo_request', 
    'application_start', 'application_submit'
  )),
  tier_clicked account_tier,
  enterprise_type_clicked enterprise_type,
  cta_label text,
  metadata jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pricing_events_type ON pricing_page_events(event_type, created_at);

ALTER TABLE pricing_page_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can track pricing events" ON pricing_page_events;
CREATE POLICY "Anyone can track pricing events"
  ON pricing_page_events FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can view pricing analytics" ON pricing_page_events;
CREATE POLICY "Admins can view pricing analytics"
  ON pricing_page_events FOR SELECT
  USING (public.is_admin());

-- =============================================================================
-- HELPER FUNCTION: Check User Entitlement
-- =============================================================================

CREATE OR REPLACE FUNCTION check_user_entitlement(
  p_user_id uuid,
  p_scope entitlement_scope,
  p_org_id uuid DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF p_scope = 'org_scope' AND p_org_id IS NULL THEN
    RETURN false;
  END IF;
  
  RETURN EXISTS (
    SELECT 1 FROM user_entitlements
    WHERE user_id = p_user_id
    AND scope = p_scope
    AND is_active = true
    AND (expires_at IS NULL OR expires_at > now())
    AND (
      (p_scope = 'org_scope' AND source_org_id = p_org_id)
      OR (p_scope = 'personal_scope' AND source_org_id IS NULL)
      OR (p_scope = 'city_scope' AND source_type = 'admin_grant')
    )
  );
END;
$$;