-- =====================================================
-- Unified Profile Hub & Clique Management Migration
-- =====================================================

-- 1. Squad Chat Messages table (for squad group chat)
CREATE TABLE IF NOT EXISTS public.squad_chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  squad_id UUID NOT NULL REFERENCES squads(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  sender_type TEXT DEFAULT 'user' CHECK (sender_type IN ('user', 'admin', 'buggs', 'system')),
  hidden_at TIMESTAMPTZ,
  hidden_by UUID REFERENCES profiles(id),
  hide_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Squad Quest Invitation Responses (RSVP system)
CREATE TABLE IF NOT EXISTS public.squad_invite_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invite_id UUID NOT NULL REFERENCES squad_quest_invites(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  response TEXT NOT NULL CHECK (response IN ('accept', 'decline', 'maybe')),
  responded_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(invite_id, user_id)
);

-- Add proposal tracking to squad_quest_invites
ALTER TABLE squad_quest_invites 
  ADD COLUMN IF NOT EXISTS proposed_by UUID REFERENCES profiles(id),
  ADD COLUMN IF NOT EXISTS proposal_message TEXT,
  ADD COLUMN IF NOT EXISTS proposed_at TIMESTAMPTZ DEFAULT now();

-- 3. Tutorial tracking for profiles
ALTER TABLE profiles 
  ADD COLUMN IF NOT EXISTS tutorial_completed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS tutorial_steps_completed JSONB DEFAULT '[]'::jsonb;

-- 4. Enable RLS on new tables
ALTER TABLE public.squad_chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.squad_invite_responses ENABLE ROW LEVEL SECURITY;

-- Chat policies: Squad members can view their squad's messages
CREATE POLICY "Squad members can view chat messages"
  ON public.squad_chat_messages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM squad_members sm 
      WHERE sm.persistent_squad_id = squad_chat_messages.squad_id
        AND sm.user_id = auth.uid()
        AND sm.status = 'active'
    )
    AND hidden_at IS NULL
  );

-- Squad members can send messages
CREATE POLICY "Squad members can send messages"
  ON public.squad_chat_messages
  FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id
    AND sender_type = 'user'
    AND EXISTS (
      SELECT 1 FROM squad_members sm 
      WHERE sm.persistent_squad_id = squad_chat_messages.squad_id
        AND sm.user_id = auth.uid()
        AND sm.status = 'active'
    )
  );

-- Squad members can view responses for their squad's invites
CREATE POLICY "Squad members can view invite responses"
  ON public.squad_invite_responses
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM squad_quest_invites sqi
      JOIN squad_members sm ON sm.persistent_squad_id = sqi.squad_id
      WHERE sqi.id = squad_invite_responses.invite_id
        AND sm.user_id = auth.uid()
        AND sm.status = 'active'
    )
  );

-- Users can respond to squad invites
CREATE POLICY "Users can respond to squad invites"
  ON public.squad_invite_responses
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM squad_quest_invites sqi
      JOIN squad_members sm ON sm.persistent_squad_id = sqi.squad_id
      WHERE sqi.id = squad_invite_responses.invite_id
        AND sm.user_id = auth.uid()
        AND sm.status = 'active'
    )
  );

-- Users can update their own responses
CREATE POLICY "Users can update own responses"
  ON public.squad_invite_responses
  FOR UPDATE
  USING (auth.uid() = user_id);

-- 5. Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.squad_chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.squad_invite_responses;