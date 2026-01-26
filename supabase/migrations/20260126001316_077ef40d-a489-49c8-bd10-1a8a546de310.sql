-- ============================================
-- PHASE 1: Squad → Clique Terminology Migration
-- ============================================

-- 1. Add new governance columns to squads table (before rename)
-- These columns support the new clique features
ALTER TABLE public.squads ADD COLUMN IF NOT EXISTS visibility TEXT DEFAULT 'private' CHECK (visibility IN ('private', 'open'));
ALTER TABLE public.squads ADD COLUMN IF NOT EXISTS invite_code TEXT;
ALTER TABLE public.squads ADD COLUMN IF NOT EXISTS invite_link_enabled BOOLEAN DEFAULT true;
ALTER TABLE public.squads ADD COLUMN IF NOT EXISTS theme_tags TEXT[] DEFAULT '{}';
ALTER TABLE public.squads ADD COLUMN IF NOT EXISTS commitment_style TEXT DEFAULT 'casual' CHECK (commitment_style IN ('casual', 'ritual', 'quest-based'));
ALTER TABLE public.squads ADD COLUMN IF NOT EXISTS org_code TEXT;
ALTER TABLE public.squads ADD COLUMN IF NOT EXISTS ai_vibe_summary TEXT;
ALTER TABLE public.squads ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;
ALTER TABLE public.squads ADD COLUMN IF NOT EXISTS max_members INTEGER DEFAULT 6;
ALTER TABLE public.squads ADD COLUMN IF NOT EXISTS lfc_enabled BOOLEAN DEFAULT false;
ALTER TABLE public.squads ADD COLUMN IF NOT EXISTS application_prompts JSONB DEFAULT '[]';

-- 2. Add unique constraint on invite_code (allow nulls)
CREATE UNIQUE INDEX IF NOT EXISTS idx_squads_invite_code ON public.squads(invite_code) WHERE invite_code IS NOT NULL;

-- 3. Add role columns to squad_members
ALTER TABLE public.squad_members ADD COLUMN IF NOT EXISTS clique_role TEXT CHECK (clique_role IN ('navigator', 'vibe_curator', 'timekeeper', 'archivist'));
ALTER TABLE public.squad_members ADD COLUMN IF NOT EXISTS role_assigned_at TIMESTAMPTZ;
ALTER TABLE public.squad_members ADD COLUMN IF NOT EXISTS role_assigned_by UUID REFERENCES auth.users(id);
ALTER TABLE public.squad_members ADD COLUMN IF NOT EXISTS role_declined_at TIMESTAMPTZ;

-- 4. Create clique_applications table for LFC
CREATE TABLE IF NOT EXISTS public.clique_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  squad_id UUID NOT NULL REFERENCES public.squads(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  answers JSONB DEFAULT '{}',
  intro_message TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  decline_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(squad_id, user_id)
);

-- 5. Create clique_ready_checks table
CREATE TABLE IF NOT EXISTS public.clique_ready_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  squad_id UUID NOT NULL REFERENCES public.squads(id) ON DELETE CASCADE,
  triggered_by UUID NOT NULL REFERENCES auth.users(id),
  title TEXT NOT NULL,
  context_quest_id UUID REFERENCES public.quests(id),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Create clique_ready_check_responses table
CREATE TABLE IF NOT EXISTS public.clique_ready_check_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ready_check_id UUID NOT NULL REFERENCES public.clique_ready_checks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  response TEXT NOT NULL CHECK (response IN ('yes', 'maybe', 'no')),
  responded_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(ready_check_id, user_id)
);

-- 7. Create clique_lore_entries table for memory/history
CREATE TABLE IF NOT EXISTS public.clique_lore_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  squad_id UUID NOT NULL REFERENCES public.squads(id) ON DELETE CASCADE,
  entry_type TEXT NOT NULL CHECK (entry_type IN ('milestone', 'photo', 'highlight', 'inside_joke', 'quest_memory', 'ai_summary')),
  title TEXT,
  content TEXT,
  media_url TEXT,
  quest_id UUID REFERENCES public.quests(id),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  is_ai_generated BOOLEAN DEFAULT false,
  is_pinned BOOLEAN DEFAULT false
);

-- 8. Create clique_polls table
CREATE TABLE IF NOT EXISTS public.clique_polls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  squad_id UUID NOT NULL REFERENCES public.squads(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  question TEXT NOT NULL,
  poll_type TEXT DEFAULT 'single' CHECK (poll_type IN ('single', 'multiple')),
  options JSONB NOT NULL DEFAULT '[]',
  expires_at TIMESTAMPTZ,
  is_anonymous BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  closed_at TIMESTAMPTZ
);

-- 9. Create clique_poll_votes table
CREATE TABLE IF NOT EXISTS public.clique_poll_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id UUID NOT NULL REFERENCES public.clique_polls(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  option_index INTEGER NOT NULL,
  voted_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(poll_id, user_id, option_index)
);

-- 10. Create clique_removal_votes table for democratic removal
CREATE TABLE IF NOT EXISTS public.clique_removal_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  squad_id UUID NOT NULL REFERENCES public.squads(id) ON DELETE CASCADE,
  target_user_id UUID NOT NULL REFERENCES auth.users(id),
  voter_id UUID NOT NULL REFERENCES auth.users(id),
  vote TEXT NOT NULL CHECK (vote IN ('remove', 'keep')),
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(squad_id, target_user_id, voter_id)
);

-- 11. Add chat enhancements to squad_chat_messages
ALTER TABLE public.squad_chat_messages ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT false;
ALTER TABLE public.squad_chat_messages ADD COLUMN IF NOT EXISTS thread_id UUID REFERENCES public.squad_chat_messages(id);
ALTER TABLE public.squad_chat_messages ADD COLUMN IF NOT EXISTS reactions JSONB DEFAULT '{}';

-- 12. Enable RLS on new tables
ALTER TABLE public.clique_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clique_ready_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clique_ready_check_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clique_lore_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clique_polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clique_poll_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clique_removal_votes ENABLE ROW LEVEL SECURITY;

-- 13. RLS Policies for clique_applications
CREATE POLICY "Users can view their own applications"
  ON public.clique_applications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Leaders can view applications to their cliques"
  ON public.clique_applications FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.squad_members sm
      WHERE sm.squad_id = clique_applications.squad_id
      AND sm.user_id = auth.uid()
      AND sm.role = 'leader'
    )
  );

CREATE POLICY "Users can create applications"
  ON public.clique_applications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Leaders can update applications"
  ON public.clique_applications FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.squad_members sm
      WHERE sm.squad_id = clique_applications.squad_id
      AND sm.user_id = auth.uid()
      AND sm.role = 'leader'
    )
  );

-- 14. RLS Policies for ready checks
CREATE POLICY "Clique members can view ready checks"
  ON public.clique_ready_checks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.squad_members sm
      WHERE sm.squad_id = clique_ready_checks.squad_id
      AND sm.user_id = auth.uid()
      AND sm.status = 'active'
    )
  );

CREATE POLICY "Leaders can create ready checks"
  ON public.clique_ready_checks FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.squad_members sm
      WHERE sm.squad_id = squad_id
      AND sm.user_id = auth.uid()
      AND sm.role = 'leader'
    )
  );

CREATE POLICY "Members can view ready check responses"
  ON public.clique_ready_check_responses FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.clique_ready_checks rc
      JOIN public.squad_members sm ON sm.squad_id = rc.squad_id
      WHERE rc.id = clique_ready_check_responses.ready_check_id
      AND sm.user_id = auth.uid()
      AND sm.status = 'active'
    )
  );

CREATE POLICY "Members can respond to ready checks"
  ON public.clique_ready_check_responses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Members can update their ready check responses"
  ON public.clique_ready_check_responses FOR UPDATE
  USING (auth.uid() = user_id);

-- 15. RLS Policies for lore entries
CREATE POLICY "Clique members can view lore"
  ON public.clique_lore_entries FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.squad_members sm
      WHERE sm.squad_id = clique_lore_entries.squad_id
      AND sm.user_id = auth.uid()
    )
  );

CREATE POLICY "Clique members can create lore entries"
  ON public.clique_lore_entries FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.squad_members sm
      WHERE sm.squad_id = squad_id
      AND sm.user_id = auth.uid()
      AND sm.status = 'active'
    )
  );

CREATE POLICY "Leaders and archivists can update lore"
  ON public.clique_lore_entries FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.squad_members sm
      WHERE sm.squad_id = clique_lore_entries.squad_id
      AND sm.user_id = auth.uid()
      AND (sm.role = 'leader' OR sm.clique_role = 'archivist')
    )
  );

-- 16. RLS Policies for polls
CREATE POLICY "Clique members can view polls"
  ON public.clique_polls FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.squad_members sm
      WHERE sm.squad_id = clique_polls.squad_id
      AND sm.user_id = auth.uid()
      AND sm.status = 'active'
    )
  );

CREATE POLICY "Clique members can create polls"
  ON public.clique_polls FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.squad_members sm
      WHERE sm.squad_id = squad_id
      AND sm.user_id = auth.uid()
      AND sm.status = 'active'
    )
  );

CREATE POLICY "Poll creator can close polls"
  ON public.clique_polls FOR UPDATE
  USING (auth.uid() = created_by);

CREATE POLICY "Clique members can view poll votes"
  ON public.clique_poll_votes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.clique_polls p
      JOIN public.squad_members sm ON sm.squad_id = p.squad_id
      WHERE p.id = clique_poll_votes.poll_id
      AND sm.user_id = auth.uid()
      AND sm.status = 'active'
    )
  );

CREATE POLICY "Members can vote on polls"
  ON public.clique_poll_votes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 17. RLS Policies for removal votes
CREATE POLICY "Clique members can view removal votes"
  ON public.clique_removal_votes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.squad_members sm
      WHERE sm.squad_id = clique_removal_votes.squad_id
      AND sm.user_id = auth.uid()
      AND sm.status = 'active'
    )
  );

CREATE POLICY "Clique members can vote on removals"
  ON public.clique_removal_votes FOR INSERT
  WITH CHECK (
    auth.uid() = voter_id AND
    auth.uid() != target_user_id AND
    EXISTS (
      SELECT 1 FROM public.squad_members sm
      WHERE sm.squad_id = squad_id
      AND sm.user_id = auth.uid()
      AND sm.status = 'active'
    )
  );

-- 18. Function to generate unique invite code
CREATE OR REPLACE FUNCTION generate_invite_code()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..8 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- 19. Trigger to auto-generate invite code on squad creation
CREATE OR REPLACE FUNCTION auto_generate_invite_code()
RETURNS TRIGGER AS $$
DECLARE
  new_code TEXT;
  code_exists BOOLEAN;
BEGIN
  IF NEW.invite_code IS NULL THEN
    LOOP
      new_code := generate_invite_code();
      SELECT EXISTS(SELECT 1 FROM public.squads WHERE invite_code = new_code) INTO code_exists;
      EXIT WHEN NOT code_exists;
    END LOOP;
    NEW.invite_code := new_code;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_auto_generate_invite_code ON public.squads;
CREATE TRIGGER trigger_auto_generate_invite_code
  BEFORE INSERT ON public.squads
  FOR EACH ROW
  EXECUTE FUNCTION auto_generate_invite_code();

-- 20. Add realtime for new tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.clique_ready_checks;
ALTER PUBLICATION supabase_realtime ADD TABLE public.clique_ready_check_responses;
ALTER PUBLICATION supabase_realtime ADD TABLE public.clique_polls;
ALTER PUBLICATION supabase_realtime ADD TABLE public.clique_poll_votes;