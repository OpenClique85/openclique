-- ============================================================================
-- PERSISTENT SQUADS SCHEMA (Phase 0.5 + 1)
-- ============================================================================

-- 1. Create persistent squads table (identity persists across quests)
CREATE TABLE public.squads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL DEFAULT 'Unnamed Squad',
  origin_quest_id UUID REFERENCES public.quests(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on squads
ALTER TABLE public.squads ENABLE ROW LEVEL SECURITY;

-- 2. Add persistent squad support to squad_members
ALTER TABLE public.squad_members 
ADD COLUMN persistent_squad_id UUID REFERENCES public.squads(id) ON DELETE CASCADE,
ADD COLUMN role TEXT DEFAULT 'member',
ADD COLUMN status TEXT DEFAULT 'active';

-- Add constraints
ALTER TABLE public.squad_members 
ADD CONSTRAINT squad_members_role_check CHECK (role IN ('leader', 'member')),
ADD CONSTRAINT squad_members_status_check CHECK (status IN ('active', 'left', 'kicked'));

-- Index for efficient persistent squad lookups
CREATE INDEX idx_squad_members_persistent ON public.squad_members(persistent_squad_id) 
WHERE persistent_squad_id IS NOT NULL;

-- 3. Add re-enlist intent to quest_signups
ALTER TABLE public.quest_signups
ADD COLUMN wants_reenlist BOOLEAN DEFAULT NULL,
ADD COLUMN reenlist_answered_at TIMESTAMPTZ;

-- 4. Create squad quest invites table (for squad-first proposals)
CREATE TABLE public.squad_quest_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  squad_id UUID NOT NULL REFERENCES public.squads(id) ON DELETE CASCADE,
  quest_id UUID NOT NULL REFERENCES public.quests(id) ON DELETE CASCADE,
  proposed_by UUID NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ DEFAULT (now() + interval '7 days'),
  CONSTRAINT squad_quest_invites_status_check CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),
  CONSTRAINT squad_quest_invites_unique UNIQUE(squad_id, quest_id)
);

-- Enable RLS on squad_quest_invites
ALTER TABLE public.squad_quest_invites ENABLE ROW LEVEL SECURITY;

-- 5. Create squad quest RSVPs table (member responses)
CREATE TABLE public.squad_quest_rsvps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invite_id UUID NOT NULL REFERENCES public.squad_quest_invites(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  response TEXT,
  responded_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT squad_quest_rsvps_response_check CHECK (response IN ('yes', 'no', 'maybe')),
  CONSTRAINT squad_quest_rsvps_unique UNIQUE(invite_id, user_id)
);

-- Enable RLS on squad_quest_rsvps
ALTER TABLE public.squad_quest_rsvps ENABLE ROW LEVEL SECURITY;

-- 6. Create squad leader votes table
CREATE TABLE public.squad_leader_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  squad_id UUID NOT NULL REFERENCES public.squads(id) ON DELETE CASCADE,
  voter_id UUID NOT NULL,
  voted_for_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT squad_leader_votes_unique UNIQUE(squad_id, voter_id)
);

-- Enable RLS on squad_leader_votes
ALTER TABLE public.squad_leader_votes ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

-- SQUADS: Users can view squads they belong to
CREATE POLICY "Users can view their squads"
ON public.squads FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.squad_members sm
    WHERE sm.persistent_squad_id = squads.id
    AND sm.user_id = auth.uid()
    AND sm.status = 'active'
  )
);

-- SQUADS: Admins have full access
CREATE POLICY "Admins can manage squads"
ON public.squads FOR ALL
USING (is_admin());

-- SQUAD_MEMBERS: Users can view their own memberships
CREATE POLICY "Users can view their squad memberships"
ON public.squad_members FOR SELECT
USING (user_id = auth.uid());

-- SQUAD_MEMBERS: Users can view fellow squad members
CREATE POLICY "Users can view fellow squad members"
ON public.squad_members FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.squad_members my_membership
    WHERE my_membership.persistent_squad_id = squad_members.persistent_squad_id
    AND my_membership.user_id = auth.uid()
    AND my_membership.status = 'active'
  )
);

-- SQUAD_MEMBERS: Users can update their own membership (leave squad)
CREATE POLICY "Users can update their own membership"
ON public.squad_members FOR UPDATE
USING (user_id = auth.uid());

-- SQUAD_QUEST_INVITES: Squad members can view their squad's invites
CREATE POLICY "Squad members can view invites"
ON public.squad_quest_invites FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.squad_members sm
    WHERE sm.persistent_squad_id = squad_quest_invites.squad_id
    AND sm.user_id = auth.uid()
    AND sm.status = 'active'
  )
);

-- SQUAD_QUEST_INVITES: Squad members can create invites
CREATE POLICY "Squad members can create invites"
ON public.squad_quest_invites FOR INSERT
WITH CHECK (
  proposed_by = auth.uid() AND
  EXISTS (
    SELECT 1 FROM public.squad_members sm
    WHERE sm.persistent_squad_id = squad_quest_invites.squad_id
    AND sm.user_id = auth.uid()
    AND sm.status = 'active'
  )
);

-- SQUAD_QUEST_INVITES: Admins can manage all invites
CREATE POLICY "Admins can manage invites"
ON public.squad_quest_invites FOR ALL
USING (is_admin());

-- SQUAD_QUEST_RSVPS: Users can view RSVPs for their squad invites
CREATE POLICY "Users can view squad RSVPs"
ON public.squad_quest_rsvps FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.squad_quest_invites sqi
    JOIN public.squad_members sm ON sm.persistent_squad_id = sqi.squad_id
    WHERE sqi.id = squad_quest_rsvps.invite_id
    AND sm.user_id = auth.uid()
    AND sm.status = 'active'
  )
);

-- SQUAD_QUEST_RSVPS: Users can manage their own RSVPs
CREATE POLICY "Users can manage their own RSVPs"
ON public.squad_quest_rsvps FOR ALL
USING (user_id = auth.uid());

-- SQUAD_LEADER_VOTES: Squad members can vote
CREATE POLICY "Squad members can vote for leader"
ON public.squad_leader_votes FOR INSERT
WITH CHECK (
  voter_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM public.squad_members sm
    WHERE sm.persistent_squad_id = squad_leader_votes.squad_id
    AND sm.user_id = auth.uid()
    AND sm.status = 'active'
  )
);

-- SQUAD_LEADER_VOTES: Users can view votes for their squads
CREATE POLICY "Users can view squad votes"
ON public.squad_leader_votes FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.squad_members sm
    WHERE sm.persistent_squad_id = squad_leader_votes.squad_id
    AND sm.user_id = auth.uid()
    AND sm.status = 'active'
  )
);

-- SQUAD_LEADER_VOTES: Admins can manage all votes
CREATE POLICY "Admins can manage votes"
ON public.squad_leader_votes FOR ALL
USING (is_admin());

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Auto-update updated_at for squads
CREATE TRIGGER update_squads_updated_at
BEFORE UPDATE ON public.squads
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();