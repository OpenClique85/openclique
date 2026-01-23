
-- Add new notification types
ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'org_sponsor_request';
ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'sponsor_org_request';
ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'collaboration_message';

-- Create org_sponsor_requests table (Organizations petitioning sponsors)
CREATE TABLE public.org_sponsor_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  sponsor_id UUID NOT NULL REFERENCES public.sponsor_profiles(id) ON DELETE CASCADE,
  requester_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  quest_id UUID REFERENCES public.quests(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  event_type TEXT,
  expected_attendance INTEGER,
  budget_ask TEXT,
  preferred_dates TEXT,
  offering_request JSONB DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'pending',
  decline_reason TEXT,
  sponsor_response_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create sponsor_org_requests table (Sponsors reaching out to orgs)
CREATE TABLE public.sponsor_org_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sponsor_id UUID NOT NULL REFERENCES public.sponsor_profiles(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  requester_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  offering JSONB DEFAULT '{}'::jsonb,
  target_demographics TEXT,
  preferred_dates TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  decline_reason TEXT,
  org_response_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create unified collaboration_messages table
CREATE TABLE public.collaboration_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collaboration_type TEXT NOT NULL CHECK (collaboration_type IN ('org_creator', 'org_sponsor', 'sponsor_creator', 'sponsor_org')),
  collaboration_id UUID NOT NULL,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sender_role TEXT NOT NULL CHECK (sender_role IN ('org_admin', 'creator', 'sponsor')),
  message TEXT NOT NULL,
  attachments JSONB DEFAULT NULL,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add sponsor_offering to quests for full customization tracking
ALTER TABLE public.quests ADD COLUMN IF NOT EXISTS sponsor_offering JSONB DEFAULT '{}'::jsonb;

-- Add seeking field to creator_profiles for marketplace listings
ALTER TABLE public.creator_profiles ADD COLUMN IF NOT EXISTS seeking TEXT[] DEFAULT '{}'::text[];

-- Add seeking field to sponsor_profiles for marketplace listings
ALTER TABLE public.sponsor_profiles ADD COLUMN IF NOT EXISTS seeking TEXT[] DEFAULT '{}'::text[];

-- Add seeking field to organizations for marketplace listings
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS seeking TEXT[] DEFAULT '{}'::text[];

-- Enable RLS on new tables
ALTER TABLE public.org_sponsor_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sponsor_org_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collaboration_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for org_sponsor_requests
CREATE POLICY "Org admins can create sponsor requests"
  ON public.org_sponsor_requests FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.profile_organizations po
    WHERE po.org_id = org_sponsor_requests.org_id
    AND po.profile_id = auth.uid()
    AND po.role = 'admin'::org_member_role
  ));

CREATE POLICY "Org admins can view their org's sponsor requests"
  ON public.org_sponsor_requests FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.profile_organizations po
    WHERE po.org_id = org_sponsor_requests.org_id
    AND po.profile_id = auth.uid()
    AND po.role = 'admin'::org_member_role
  ));

CREATE POLICY "Org admins can update their requests"
  ON public.org_sponsor_requests FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.profile_organizations po
    WHERE po.org_id = org_sponsor_requests.org_id
    AND po.profile_id = auth.uid()
    AND po.role = 'admin'::org_member_role
  ));

CREATE POLICY "Sponsors can view requests sent to them"
  ON public.org_sponsor_requests FOR SELECT
  USING (sponsor_id IN (
    SELECT id FROM public.sponsor_profiles WHERE user_id = auth.uid()
  ));

CREATE POLICY "Sponsors can respond to requests"
  ON public.org_sponsor_requests FOR UPDATE
  USING (sponsor_id IN (
    SELECT id FROM public.sponsor_profiles WHERE user_id = auth.uid()
  ));

CREATE POLICY "Admins can manage all org_sponsor_requests"
  ON public.org_sponsor_requests FOR ALL
  USING (is_admin());

-- RLS Policies for sponsor_org_requests
CREATE POLICY "Sponsors can create org requests"
  ON public.sponsor_org_requests FOR INSERT
  WITH CHECK (sponsor_id IN (
    SELECT id FROM public.sponsor_profiles WHERE user_id = auth.uid()
  ));

CREATE POLICY "Sponsors can view their own org requests"
  ON public.sponsor_org_requests FOR SELECT
  USING (sponsor_id IN (
    SELECT id FROM public.sponsor_profiles WHERE user_id = auth.uid()
  ));

CREATE POLICY "Sponsors can update their org requests"
  ON public.sponsor_org_requests FOR UPDATE
  USING (sponsor_id IN (
    SELECT id FROM public.sponsor_profiles WHERE user_id = auth.uid()
  ));

CREATE POLICY "Org admins can view requests sent to their org"
  ON public.sponsor_org_requests FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.profile_organizations po
    WHERE po.org_id = sponsor_org_requests.org_id
    AND po.profile_id = auth.uid()
    AND po.role = 'admin'::org_member_role
  ));

CREATE POLICY "Org admins can respond to sponsor requests"
  ON public.sponsor_org_requests FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.profile_organizations po
    WHERE po.org_id = sponsor_org_requests.org_id
    AND po.profile_id = auth.uid()
    AND po.role = 'admin'::org_member_role
  ));

CREATE POLICY "Admins can manage all sponsor_org_requests"
  ON public.sponsor_org_requests FOR ALL
  USING (is_admin());

-- RLS Policies for collaboration_messages
CREATE POLICY "Users can send messages in their collaborations"
  ON public.collaboration_messages FOR INSERT
  WITH CHECK (sender_id = auth.uid());

CREATE POLICY "Users can view messages in org_creator collaborations"
  ON public.collaboration_messages FOR SELECT
  USING (
    collaboration_type = 'org_creator' AND (
      EXISTS (
        SELECT 1 FROM public.org_creator_requests ocr
        JOIN public.creator_profiles cp ON cp.id = ocr.creator_id
        WHERE ocr.id = collaboration_messages.collaboration_id
        AND cp.user_id = auth.uid()
      )
      OR EXISTS (
        SELECT 1 FROM public.org_creator_requests ocr
        JOIN public.profile_organizations po ON po.org_id = ocr.org_id
        WHERE ocr.id = collaboration_messages.collaboration_id
        AND po.profile_id = auth.uid()
        AND po.role = 'admin'::org_member_role
      )
    )
  );

CREATE POLICY "Users can view messages in org_sponsor collaborations"
  ON public.collaboration_messages FOR SELECT
  USING (
    collaboration_type = 'org_sponsor' AND (
      EXISTS (
        SELECT 1 FROM public.org_sponsor_requests osr
        JOIN public.sponsor_profiles sp ON sp.id = osr.sponsor_id
        WHERE osr.id = collaboration_messages.collaboration_id
        AND sp.user_id = auth.uid()
      )
      OR EXISTS (
        SELECT 1 FROM public.org_sponsor_requests osr
        JOIN public.profile_organizations po ON po.org_id = osr.org_id
        WHERE osr.id = collaboration_messages.collaboration_id
        AND po.profile_id = auth.uid()
        AND po.role = 'admin'::org_member_role
      )
    )
  );

CREATE POLICY "Users can view messages in sponsor_org collaborations"
  ON public.collaboration_messages FOR SELECT
  USING (
    collaboration_type = 'sponsor_org' AND (
      EXISTS (
        SELECT 1 FROM public.sponsor_org_requests sor
        JOIN public.sponsor_profiles sp ON sp.id = sor.sponsor_id
        WHERE sor.id = collaboration_messages.collaboration_id
        AND sp.user_id = auth.uid()
      )
      OR EXISTS (
        SELECT 1 FROM public.sponsor_org_requests sor
        JOIN public.profile_organizations po ON po.org_id = sor.org_id
        WHERE sor.id = collaboration_messages.collaboration_id
        AND po.profile_id = auth.uid()
        AND po.role = 'admin'::org_member_role
      )
    )
  );

CREATE POLICY "Users can view messages in sponsor_creator collaborations"
  ON public.collaboration_messages FOR SELECT
  USING (
    collaboration_type = 'sponsor_creator' AND (
      EXISTS (
        SELECT 1 FROM public.sponsorship_proposals sp
        JOIN public.sponsor_profiles spr ON spr.id = sp.sponsor_id
        WHERE sp.id = collaboration_messages.collaboration_id
        AND spr.user_id = auth.uid()
      )
      OR EXISTS (
        SELECT 1 FROM public.sponsorship_proposals sp
        WHERE sp.id = collaboration_messages.collaboration_id
        AND sp.creator_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can mark messages as read"
  ON public.collaboration_messages FOR UPDATE
  USING (sender_id != auth.uid())
  WITH CHECK (sender_id != auth.uid());

CREATE POLICY "Admins can manage all collaboration_messages"
  ON public.collaboration_messages FOR ALL
  USING (is_admin());

-- Enable realtime for collaboration_messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.collaboration_messages;

-- Create updated_at triggers
CREATE TRIGGER update_org_sponsor_requests_updated_at
  BEFORE UPDATE ON public.org_sponsor_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_sponsor_org_requests_updated_at
  BEFORE UPDATE ON public.sponsor_org_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for performance
CREATE INDEX idx_org_sponsor_requests_org_id ON public.org_sponsor_requests(org_id);
CREATE INDEX idx_org_sponsor_requests_sponsor_id ON public.org_sponsor_requests(sponsor_id);
CREATE INDEX idx_org_sponsor_requests_status ON public.org_sponsor_requests(status);
CREATE INDEX idx_sponsor_org_requests_sponsor_id ON public.sponsor_org_requests(sponsor_id);
CREATE INDEX idx_sponsor_org_requests_org_id ON public.sponsor_org_requests(org_id);
CREATE INDEX idx_sponsor_org_requests_status ON public.sponsor_org_requests(status);
CREATE INDEX idx_collaboration_messages_collab ON public.collaboration_messages(collaboration_type, collaboration_id);
CREATE INDEX idx_collaboration_messages_sender ON public.collaboration_messages(sender_id);
