-- Add notification type for org quest announcements
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'org_quest_announcement';

-- Add notification type for org creator requests
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'org_creator_request';

-- Create table for org creator requests (different from sponsor proposals)
CREATE TABLE public.org_creator_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  creator_id uuid NOT NULL REFERENCES public.creator_profiles(id) ON DELETE CASCADE,
  requester_id uuid NOT NULL, -- the org admin who made the request
  title text NOT NULL,
  description text,
  quest_theme text,
  preferred_dates text,
  budget_range text,
  estimated_participants integer,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'completed', 'cancelled')),
  creator_response_at timestamptz,
  decline_reason text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.org_creator_requests ENABLE ROW LEVEL SECURITY;

-- Org admins can view and create requests for their org
CREATE POLICY "Org admins can view org requests"
  ON public.org_creator_requests
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profile_organizations po
      WHERE po.org_id = org_creator_requests.org_id
        AND po.profile_id = auth.uid()
        AND po.role = 'admin'
    )
  );

CREATE POLICY "Org admins can create requests"
  ON public.org_creator_requests
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profile_organizations po
      WHERE po.org_id = org_creator_requests.org_id
        AND po.profile_id = auth.uid()
        AND po.role = 'admin'
    )
  );

CREATE POLICY "Org admins can update their requests"
  ON public.org_creator_requests
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profile_organizations po
      WHERE po.org_id = org_creator_requests.org_id
        AND po.profile_id = auth.uid()
        AND po.role = 'admin'
    )
  );

-- Creators can view requests sent to them
CREATE POLICY "Creators can view their requests"
  ON public.org_creator_requests
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM creator_profiles cp
      WHERE cp.id = org_creator_requests.creator_id
        AND cp.user_id = auth.uid()
    )
  );

-- Creators can update status of requests sent to them
CREATE POLICY "Creators can respond to requests"
  ON public.org_creator_requests
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM creator_profiles cp
      WHERE cp.id = org_creator_requests.creator_id
        AND cp.user_id = auth.uid()
    )
  );

-- Create index for faster lookups
CREATE INDEX idx_org_creator_requests_org_id ON public.org_creator_requests(org_id);
CREATE INDEX idx_org_creator_requests_creator_id ON public.org_creator_requests(creator_id);
CREATE INDEX idx_org_creator_requests_status ON public.org_creator_requests(status);