-- Create squad status enum
CREATE TYPE public.squad_status AS ENUM ('draft', 'confirmed', 'active', 'completed');

-- Create quest_squads table
CREATE TABLE public.quest_squads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quest_id UUID NOT NULL REFERENCES public.quests(id) ON DELETE CASCADE,
  squad_name TEXT NOT NULL DEFAULT 'Squad',
  status squad_status NOT NULL DEFAULT 'draft',
  whatsapp_link TEXT,
  compatibility_score NUMERIC(3,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  confirmed_at TIMESTAMPTZ
);

-- Create squad_members table
CREATE TABLE public.squad_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  squad_id UUID NOT NULL REFERENCES public.quest_squads(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  signup_id UUID REFERENCES public.quest_signups(id) ON DELETE SET NULL,
  added_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(squad_id, user_id)
);

-- Create index for faster lookups
CREATE INDEX idx_quest_squads_quest_id ON public.quest_squads(quest_id);
CREATE INDEX idx_squad_members_squad_id ON public.squad_members(squad_id);
CREATE INDEX idx_squad_members_user_id ON public.squad_members(user_id);

-- Enable RLS
ALTER TABLE public.quest_squads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.squad_members ENABLE ROW LEVEL SECURITY;

-- RLS policies for quest_squads
CREATE POLICY "Admins can manage quest_squads"
ON public.quest_squads
FOR ALL
USING (is_admin());

CREATE POLICY "Users can view their own squads"
ON public.quest_squads
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.squad_members
    WHERE squad_members.squad_id = quest_squads.id
    AND squad_members.user_id = auth.uid()
  )
);

-- RLS policies for squad_members
CREATE POLICY "Admins can manage squad_members"
ON public.squad_members
FOR ALL
USING (is_admin());

CREATE POLICY "Users can view their own squad memberships"
ON public.squad_members
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can view members of their squads"
ON public.squad_members
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.squad_members AS sm
    WHERE sm.squad_id = squad_members.squad_id
    AND sm.user_id = auth.uid()
  )
);