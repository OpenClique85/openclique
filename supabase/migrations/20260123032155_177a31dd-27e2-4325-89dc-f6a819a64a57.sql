-- Create sponsor_listings table for "Seeking Creators" marketplace
CREATE TABLE public.sponsor_listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sponsor_id uuid NOT NULL REFERENCES sponsor_profiles(id) ON DELETE CASCADE,
  
  -- Listing Details
  title text NOT NULL,
  description text,
  quest_type text,
  
  -- What Sponsor Offers
  budget_range text,
  rewards_offered jsonb DEFAULT '[]'::jsonb,
  venue_offered uuid REFERENCES venue_offerings(id),
  includes_branding boolean DEFAULT false,
  
  -- Requirements
  target_audience jsonb DEFAULT '{}'::jsonb,
  preferred_dates text,
  expected_attendance text,
  creator_requirements text,
  
  -- Status & Workflow
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('draft', 'open', 'closed', 'filled')),
  applications_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  expires_at timestamptz
);

-- Create listing_applications table
CREATE TABLE public.listing_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES sponsor_listings(id) ON DELETE CASCADE,
  creator_id uuid NOT NULL,
  
  -- Application Content
  pitch_message text NOT NULL,
  proposed_concept text,
  availability text,
  
  -- Status
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'accepted', 'declined', 'withdrawn')),
  sponsor_notes text,
  created_at timestamptz DEFAULT now(),
  response_at timestamptz
);

-- Enable RLS
ALTER TABLE public.sponsor_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listing_applications ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX idx_sponsor_listings_sponsor_id ON public.sponsor_listings(sponsor_id);
CREATE INDEX idx_sponsor_listings_status ON public.sponsor_listings(status);
CREATE INDEX idx_listing_applications_listing_id ON public.listing_applications(listing_id);
CREATE INDEX idx_listing_applications_creator_id ON public.listing_applications(creator_id);

-- RLS Policies for sponsor_listings
CREATE POLICY "Sponsors can manage their own listings"
ON public.sponsor_listings FOR ALL
USING (sponsor_id IN (SELECT id FROM sponsor_profiles WHERE user_id = auth.uid()));

CREATE POLICY "Anyone can view open listings"
ON public.sponsor_listings FOR SELECT
USING (status = 'open');

CREATE POLICY "Admins can manage all listings"
ON public.sponsor_listings FOR ALL
USING (is_admin());

-- RLS Policies for listing_applications
CREATE POLICY "Creators can create applications"
ON public.listing_applications FOR INSERT
WITH CHECK (creator_id = auth.uid());

CREATE POLICY "Creators can view their own applications"
ON public.listing_applications FOR SELECT
USING (creator_id = auth.uid());

CREATE POLICY "Creators can update their own pending applications"
ON public.listing_applications FOR UPDATE
USING (creator_id = auth.uid() AND status = 'pending');

CREATE POLICY "Sponsors can view applications to their listings"
ON public.listing_applications FOR SELECT
USING (listing_id IN (
  SELECT sl.id FROM sponsor_listings sl
  JOIN sponsor_profiles sp ON sp.id = sl.sponsor_id
  WHERE sp.user_id = auth.uid()
));

CREATE POLICY "Sponsors can update applications to their listings"
ON public.listing_applications FOR UPDATE
USING (listing_id IN (
  SELECT sl.id FROM sponsor_listings sl
  JOIN sponsor_profiles sp ON sp.id = sl.sponsor_id
  WHERE sp.user_id = auth.uid()
));

CREATE POLICY "Admins can manage all applications"
ON public.listing_applications FOR ALL
USING (is_admin());

-- Trigger to update applications_count
CREATE OR REPLACE FUNCTION update_listing_applications_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE sponsor_listings SET applications_count = applications_count + 1 WHERE id = NEW.listing_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE sponsor_listings SET applications_count = applications_count - 1 WHERE id = OLD.listing_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_update_listing_applications_count
AFTER INSERT OR DELETE ON public.listing_applications
FOR EACH ROW EXECUTE FUNCTION update_listing_applications_count();

-- Trigger to update updated_at
CREATE TRIGGER update_sponsor_listings_updated_at
BEFORE UPDATE ON public.sponsor_listings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();