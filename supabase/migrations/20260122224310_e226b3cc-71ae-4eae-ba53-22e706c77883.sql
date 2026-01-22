-- Phase 1: Sponsor Portal Database Schema

-- 1.1 Add sponsor role to existing enum
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'sponsor';

-- 1.2 Add new notification types for sponsorships
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'sponsorship_proposal_received';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'sponsorship_proposal_accepted';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'sponsorship_proposal_declined';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'sponsored_quest_approved';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'sponsor_quest_completed';

-- 1.3 Create sponsor_profiles table
CREATE TABLE public.sponsor_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  name text NOT NULL,
  slug text UNIQUE,
  sponsor_type text NOT NULL DEFAULT 'brand' CHECK (sponsor_type IN ('brand', 'venue', 'both')),
  logo_url text,
  website text,
  description text,
  contact_name text,
  contact_email text,
  city text DEFAULT 'Austin',
  target_audience jsonb DEFAULT '{}',
  preferred_quest_types text[] DEFAULT '{}',
  budget_range text,
  brand_tone text,
  status text NOT NULL DEFAULT 'pending_review' CHECK (status IN ('pending_review', 'approved', 'paused', 'suspended')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Trigger for sponsor slug generation
CREATE OR REPLACE FUNCTION public.generate_sponsor_slug()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  base_slug TEXT;
  new_slug TEXT;
  counter INTEGER := 0;
BEGIN
  base_slug := lower(regexp_replace(NEW.name, '[^a-zA-Z0-9]+', '-', 'g'));
  base_slug := trim(BOTH '-' FROM base_slug);
  new_slug := base_slug;
  
  WHILE EXISTS (SELECT 1 FROM sponsor_profiles WHERE slug = new_slug AND id != NEW.id) LOOP
    counter := counter + 1;
    new_slug := base_slug || '-' || counter;
  END LOOP;
  
  NEW.slug := new_slug;
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_sponsor_slug
  BEFORE INSERT OR UPDATE OF name ON public.sponsor_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_sponsor_slug();

-- Trigger for updated_at
CREATE TRIGGER update_sponsor_profiles_updated_at
  BEFORE UPDATE ON public.sponsor_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- 1.4 Create venue_offerings table
CREATE TABLE public.venue_offerings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sponsor_id uuid NOT NULL REFERENCES public.sponsor_profiles(id) ON DELETE CASCADE,
  venue_name text NOT NULL,
  address text,
  capacity integer,
  available_days text[] DEFAULT '{}',
  available_time_blocks jsonb DEFAULT '[]',
  venue_rules text,
  amenities text[] DEFAULT '{}',
  ideal_quest_types text[] DEFAULT '{}',
  approval_required boolean DEFAULT true,
  status text NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'unavailable', 'pending')),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 1.5 Create rewards table
CREATE TABLE public.rewards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sponsor_id uuid NOT NULL REFERENCES public.sponsor_profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  fulfillment_type text NOT NULL DEFAULT 'code' CHECK (fulfillment_type IN ('qr', 'code', 'on_site', 'link')),
  fulfillment_data text,
  max_redemptions integer,
  redemptions_count integer DEFAULT 0,
  expires_at timestamptz,
  quest_requirements jsonb DEFAULT '{}',
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'expired')),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 1.6 Create sponsorship_proposals table
CREATE TABLE public.sponsorship_proposals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sponsor_id uuid NOT NULL REFERENCES public.sponsor_profiles(id) ON DELETE CASCADE,
  quest_id uuid REFERENCES public.quests(id) ON DELETE SET NULL,
  creator_id uuid,
  proposal_type text NOT NULL CHECK (proposal_type IN ('sponsor_existing', 'request_new')),
  message text,
  budget_or_reward text,
  venue_offering_id uuid REFERENCES public.venue_offerings(id) ON DELETE SET NULL,
  reward_ids uuid[] DEFAULT '{}',
  status text NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'accepted', 'declined', 'pending_admin', 'approved', 'live', 'cancelled')),
  creator_response_at timestamptz,
  admin_approved_at timestamptz,
  admin_notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 1.7 Create sponsored_quests join table
CREATE TABLE public.sponsored_quests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quest_id uuid NOT NULL REFERENCES public.quests(id) ON DELETE CASCADE,
  sponsor_id uuid NOT NULL REFERENCES public.sponsor_profiles(id) ON DELETE CASCADE,
  proposal_id uuid REFERENCES public.sponsorship_proposals(id) ON DELETE SET NULL,
  rewards_attached uuid[] DEFAULT '{}',
  analytics_access_level text DEFAULT 'basic' CHECK (analytics_access_level IN ('basic', 'full')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(quest_id, sponsor_id)
);

-- 1.8 Create reward_redemptions tracking table
CREATE TABLE public.reward_redemptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reward_id uuid NOT NULL REFERENCES public.rewards(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  quest_id uuid REFERENCES public.quests(id) ON DELETE SET NULL,
  redeemed_at timestamptz NOT NULL DEFAULT now()
);

-- 1.9 Create sponsor_applications table (extends partner pattern)
CREATE TABLE public.sponsor_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_name text NOT NULL,
  sponsor_type text NOT NULL DEFAULT 'brand' CHECK (sponsor_type IN ('brand', 'venue', 'both')),
  contact_name text NOT NULL,
  contact_email text NOT NULL,
  website text,
  description text,
  target_audience jsonb DEFAULT '{}',
  preferred_quest_types text[] DEFAULT '{}',
  message text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  internal_notes text,
  created_at timestamptz DEFAULT now()
);

-- 1.10 Create sponsor_invites table
CREATE TABLE public.sponsor_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  token text NOT NULL UNIQUE DEFAULT encode(extensions.gen_random_bytes(32), 'hex'),
  application_id uuid REFERENCES public.sponsor_applications(id) ON DELETE SET NULL,
  invited_by uuid NOT NULL,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  redeemed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 1.11 Update quests table with sponsor fields
ALTER TABLE public.quests ADD COLUMN IF NOT EXISTS is_sponsored boolean DEFAULT false;
ALTER TABLE public.quests ADD COLUMN IF NOT EXISTS sponsor_id uuid REFERENCES public.sponsor_profiles(id) ON DELETE SET NULL;

-- ============================================
-- RLS POLICIES
-- ============================================

-- Enable RLS on all new tables
ALTER TABLE public.sponsor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.venue_offerings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sponsorship_proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sponsored_quests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reward_redemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sponsor_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sponsor_invites ENABLE ROW LEVEL SECURITY;

-- sponsor_profiles policies
CREATE POLICY "Sponsors can view their own profile"
  ON public.sponsor_profiles FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Sponsors can insert their own profile"
  ON public.sponsor_profiles FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Sponsors can update their own profile"
  ON public.sponsor_profiles FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Anyone can view approved sponsor profiles"
  ON public.sponsor_profiles FOR SELECT
  USING (status = 'approved');

CREATE POLICY "Admins can manage all sponsor profiles"
  ON public.sponsor_profiles FOR ALL
  USING (is_admin());

-- venue_offerings policies
CREATE POLICY "Sponsors can manage their own venues"
  ON public.venue_offerings FOR ALL
  USING (sponsor_id IN (SELECT id FROM public.sponsor_profiles WHERE user_id = auth.uid()));

CREATE POLICY "Anyone can view available venues"
  ON public.venue_offerings FOR SELECT
  USING (status = 'available');

CREATE POLICY "Admins can manage all venues"
  ON public.venue_offerings FOR ALL
  USING (is_admin());

-- rewards policies
CREATE POLICY "Sponsors can manage their own rewards"
  ON public.rewards FOR ALL
  USING (sponsor_id IN (SELECT id FROM public.sponsor_profiles WHERE user_id = auth.uid()));

CREATE POLICY "Anyone can view active rewards"
  ON public.rewards FOR SELECT
  USING (status = 'active');

CREATE POLICY "Admins can manage all rewards"
  ON public.rewards FOR ALL
  USING (is_admin());

-- sponsorship_proposals policies
CREATE POLICY "Sponsors can manage their own proposals"
  ON public.sponsorship_proposals FOR ALL
  USING (sponsor_id IN (SELECT id FROM public.sponsor_profiles WHERE user_id = auth.uid()));

CREATE POLICY "Creators can view proposals sent to them"
  ON public.sponsorship_proposals FOR SELECT
  USING (creator_id = auth.uid() OR quest_id IN (SELECT id FROM public.quests WHERE creator_id = auth.uid()));

CREATE POLICY "Creators can update proposals sent to them"
  ON public.sponsorship_proposals FOR UPDATE
  USING (creator_id = auth.uid() OR quest_id IN (SELECT id FROM public.quests WHERE creator_id = auth.uid()));

CREATE POLICY "Admins can manage all proposals"
  ON public.sponsorship_proposals FOR ALL
  USING (is_admin());

-- sponsored_quests policies
CREATE POLICY "Sponsors can view their sponsored quests"
  ON public.sponsored_quests FOR SELECT
  USING (sponsor_id IN (SELECT id FROM public.sponsor_profiles WHERE user_id = auth.uid()));

CREATE POLICY "Anyone can view sponsored quest links"
  ON public.sponsored_quests FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage sponsored quests"
  ON public.sponsored_quests FOR ALL
  USING (is_admin());

-- reward_redemptions policies
CREATE POLICY "Users can view their own redemptions"
  ON public.reward_redemptions FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can redeem rewards"
  ON public.reward_redemptions FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Sponsors can view redemptions for their rewards"
  ON public.reward_redemptions FOR SELECT
  USING (reward_id IN (SELECT id FROM public.rewards WHERE sponsor_id IN (SELECT id FROM public.sponsor_profiles WHERE user_id = auth.uid())));

CREATE POLICY "Admins can manage all redemptions"
  ON public.reward_redemptions FOR ALL
  USING (is_admin());

-- sponsor_applications policies
CREATE POLICY "Anyone can submit sponsor applications"
  ON public.sponsor_applications FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can view sponsor applications"
  ON public.sponsor_applications FOR SELECT
  USING (is_admin());

CREATE POLICY "Admins can update sponsor applications"
  ON public.sponsor_applications FOR UPDATE
  USING (is_admin());

-- sponsor_invites policies
CREATE POLICY "Admins can manage sponsor invites"
  ON public.sponsor_invites FOR ALL
  USING (is_admin());

CREATE POLICY "Anyone can verify invite tokens"
  ON public.sponsor_invites FOR SELECT
  USING (token IS NOT NULL AND redeemed_at IS NULL AND expires_at > now());