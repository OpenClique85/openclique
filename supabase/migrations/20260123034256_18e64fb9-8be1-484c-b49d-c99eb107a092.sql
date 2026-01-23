-- ============================================================================
-- SUPPORT SYSTEM DATABASE FOUNDATION
-- ============================================================================

-- 1. Add new notification types
ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'support_ticket_update';
ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'support_ticket_assigned';
ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'admin_direct_message';

-- 2. Create ticket urgency enum
CREATE TYPE public.ticket_urgency AS ENUM ('low', 'medium', 'urgent');

-- 3. Create ticket status enum
CREATE TYPE public.ticket_status AS ENUM ('open', 'investigating', 'waiting_response', 'resolved', 'closed');

-- 4. Create message sender role enum
CREATE TYPE public.message_sender_role AS ENUM ('user', 'admin', 'system');

-- 5. Create admin message type enum
CREATE TYPE public.admin_message_type AS ENUM ('support', 'announcement', 'feedback_request', 'quest_related');

-- ============================================================================
-- ISSUE CATEGORIES TABLE
-- ============================================================================
CREATE TABLE public.issue_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  severity_default TEXT NOT NULL DEFAULT 'medium',
  requires_escalation BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS for issue_categories
ALTER TABLE public.issue_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Issue categories are publicly readable"
  ON public.issue_categories FOR SELECT
  USING (is_active = true OR is_admin());

CREATE POLICY "Only admins can manage issue categories"
  ON public.issue_categories FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- Seed default issue categories
INSERT INTO public.issue_categories (name, description, severity_default, requires_escalation, display_order) VALUES
  ('Quest logistics', 'Confusion about time, place, or instructions', 'medium', false, 1),
  ('Squad issues', 'No-shows, uncomfortable dynamics, or safety concerns', 'high', true, 2),
  ('Technical bug', 'App errors, crashes, or unexpected behavior', 'medium', false, 3),
  ('Notifications', 'Didn''t receive expected notifications', 'low', false, 4),
  ('Rewards & XP', 'Missing or incorrect XP, badges, or rewards', 'medium', false, 5),
  ('Sponsor or venue', 'Issues with sponsors or venue partners', 'medium', false, 6),
  ('Payment', 'Payment or subscription issues', 'high', false, 7),
  ('Account access', 'Login, password, or account issues', 'high', false, 8),
  ('Safety concern', 'Reporting inappropriate or unsafe behavior', 'high', true, 9),
  ('Other', 'Something else not listed above', 'low', false, 10);

-- ============================================================================
-- SUPPORT TICKETS TABLE
-- ============================================================================
CREATE TABLE public.support_tickets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.issue_categories(id),
  urgency public.ticket_urgency NOT NULL DEFAULT 'low',
  status public.ticket_status NOT NULL DEFAULT 'open',
  description TEXT NOT NULL,
  related_quest_id UUID REFERENCES public.quests(id) ON DELETE SET NULL,
  related_squad_id UUID REFERENCES public.quest_squads(id) ON DELETE SET NULL,
  related_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  assigned_admin_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  internal_notes TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  submitted_from_page TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ,
  CONSTRAINT description_length CHECK (char_length(description) >= 10 AND char_length(description) <= 2000)
);

-- RLS for support_tickets
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own tickets"
  ON public.support_tickets FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own tickets"
  ON public.support_tickets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tickets (limited)"
  ON public.support_tickets FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all tickets"
  ON public.support_tickets FOR ALL
  USING (is_admin());

-- Index for faster queries
CREATE INDEX idx_support_tickets_user_id ON public.support_tickets(user_id);
CREATE INDEX idx_support_tickets_status ON public.support_tickets(status);
CREATE INDEX idx_support_tickets_urgency ON public.support_tickets(urgency);
CREATE INDEX idx_support_tickets_category ON public.support_tickets(category_id);

-- ============================================================================
-- TICKET MESSAGES TABLE
-- ============================================================================
CREATE TABLE public.ticket_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id UUID NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sender_role public.message_sender_role NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS for ticket_messages
ALTER TABLE public.ticket_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view messages on their tickets"
  ON public.ticket_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.support_tickets t
      WHERE t.id = ticket_messages.ticket_id AND t.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can add messages to their tickets"
  ON public.ticket_messages FOR INSERT
  WITH CHECK (
    sender_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.support_tickets t
      WHERE t.id = ticket_messages.ticket_id AND t.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all ticket messages"
  ON public.ticket_messages FOR ALL
  USING (is_admin());

-- Index for faster queries
CREATE INDEX idx_ticket_messages_ticket_id ON public.ticket_messages(ticket_id);

-- Enable realtime for ticket messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.ticket_messages;

-- ============================================================================
-- TICKET ATTACHMENTS TABLE
-- ============================================================================
CREATE TABLE public.ticket_attachments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id UUID NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size_bytes INTEGER NOT NULL,
  uploaded_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT file_size_limit CHECK (file_size_bytes <= 5242880),
  CONSTRAINT valid_file_type CHECK (file_type IN ('image/png', 'image/jpeg', 'image/gif', 'application/pdf'))
);

-- RLS for ticket_attachments
ALTER TABLE public.ticket_attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view attachments on their tickets"
  ON public.ticket_attachments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.support_tickets t
      WHERE t.id = ticket_attachments.ticket_id AND t.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can add attachments to their tickets"
  ON public.ticket_attachments FOR INSERT
  WITH CHECK (
    uploaded_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.support_tickets t
      WHERE t.id = ticket_attachments.ticket_id AND t.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all attachments"
  ON public.ticket_attachments FOR ALL
  USING (is_admin());

-- Index
CREATE INDEX idx_ticket_attachments_ticket_id ON public.ticket_attachments(ticket_id);

-- ============================================================================
-- ADMIN DIRECT MESSAGES TABLE
-- ============================================================================
CREATE TABLE public.admin_direct_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  from_admin_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  to_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message_type public.admin_message_type NOT NULL DEFAULT 'support',
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  context_quest_id UUID REFERENCES public.quests(id) ON DELETE SET NULL,
  context_squad_id UUID REFERENCES public.quest_squads(id) ON DELETE SET NULL,
  context_ticket_id UUID REFERENCES public.support_tickets(id) ON DELETE SET NULL,
  reply_allowed BOOLEAN NOT NULL DEFAULT true,
  email_sent BOOLEAN NOT NULL DEFAULT false,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS for admin_direct_messages
ALTER TABLE public.admin_direct_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view messages sent to them"
  ON public.admin_direct_messages FOR SELECT
  USING (to_user_id = auth.uid());

CREATE POLICY "Users can mark their messages as read"
  ON public.admin_direct_messages FOR UPDATE
  USING (to_user_id = auth.uid())
  WITH CHECK (to_user_id = auth.uid());

CREATE POLICY "Admins can manage all direct messages"
  ON public.admin_direct_messages FOR ALL
  USING (is_admin());

-- Indexes
CREATE INDEX idx_admin_dm_to_user ON public.admin_direct_messages(to_user_id);
CREATE INDEX idx_admin_dm_from_admin ON public.admin_direct_messages(from_admin_id);
CREATE INDEX idx_admin_dm_unread ON public.admin_direct_messages(to_user_id) WHERE read_at IS NULL;

-- Enable realtime for admin DMs
ALTER PUBLICATION supabase_realtime ADD TABLE public.admin_direct_messages;

-- ============================================================================
-- ADMIN DIRECT MESSAGE REPLIES TABLE
-- ============================================================================
CREATE TABLE public.admin_dm_replies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id UUID NOT NULL REFERENCES public.admin_direct_messages(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sender_role public.message_sender_role NOT NULL,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS for admin_dm_replies
ALTER TABLE public.admin_dm_replies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view replies on their messages"
  ON public.admin_dm_replies FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_direct_messages m
      WHERE m.id = admin_dm_replies.message_id AND m.to_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can reply to messages with reply_allowed"
  ON public.admin_dm_replies FOR INSERT
  WITH CHECK (
    sender_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.admin_direct_messages m
      WHERE m.id = admin_dm_replies.message_id 
        AND m.to_user_id = auth.uid() 
        AND m.reply_allowed = true
    )
  );

CREATE POLICY "Admins can manage all replies"
  ON public.admin_dm_replies FOR ALL
  USING (is_admin());

-- Index
CREATE INDEX idx_admin_dm_replies_message_id ON public.admin_dm_replies(message_id);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.admin_dm_replies;

-- ============================================================================
-- FEEDBACK PULSES TABLE (micro-feedback)
-- ============================================================================
CREATE TABLE public.feedback_pulses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  page_path TEXT NOT NULL,
  reaction TEXT NOT NULL CHECK (reaction IN ('positive', 'negative', 'confused')),
  context_quest_id UUID REFERENCES public.quests(id) ON DELETE SET NULL,
  context_squad_id UUID REFERENCES public.quest_squads(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS for feedback_pulses
ALTER TABLE public.feedback_pulses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit feedback pulses"
  ON public.feedback_pulses FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can view all feedback pulses"
  ON public.feedback_pulses FOR SELECT
  USING (is_admin());

-- Index for analytics
CREATE INDEX idx_feedback_pulses_page ON public.feedback_pulses(page_path);
CREATE INDEX idx_feedback_pulses_reaction ON public.feedback_pulses(reaction);
CREATE INDEX idx_feedback_pulses_created ON public.feedback_pulses(created_at);

-- ============================================================================
-- STORAGE BUCKET FOR SUPPORT ATTACHMENTS
-- ============================================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'support-attachments',
  'support-attachments',
  false,
  5242880,
  ARRAY['image/png', 'image/jpeg', 'image/gif', 'application/pdf']
) ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Users can upload support attachments"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'support-attachments' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view their own support attachments"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'support-attachments' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Admins can view all support attachments"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'support-attachments' AND
    is_admin()
  );

-- ============================================================================
-- UPDATE TRIGGERS
-- ============================================================================
CREATE TRIGGER update_issue_categories_updated_at
  BEFORE UPDATE ON public.issue_categories
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_support_tickets_updated_at
  BEFORE UPDATE ON public.support_tickets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();