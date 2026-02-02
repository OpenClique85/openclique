-- =============================================================================
-- Creator Squad Management RLS Policies
-- Enables creators to manage squads, view signups, and send announcements
-- for their own quests while protecting user privacy (no chat reading)
-- =============================================================================

-- Helper function to check if user is the creator of a quest
CREATE OR REPLACE FUNCTION public.is_quest_creator(quest_uuid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.quests q
    WHERE q.id = quest_uuid
      AND q.creator_id = auth.uid()
  )
$$;

-- Helper function to check if user is the creator of a quest (via squad)
CREATE OR REPLACE FUNCTION public.is_squad_quest_creator(squad_uuid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.quest_squads qs
    JOIN public.quests q ON q.id = qs.quest_id
    WHERE qs.id = squad_uuid
      AND q.creator_id = auth.uid()
  )
$$;

-- =============================================================================
-- quest_squads policies for creators
-- =============================================================================

-- Creators can SELECT squads for their quests
CREATE POLICY "Creators can view their quest squads"
ON public.quest_squads
FOR SELECT
TO authenticated
USING (
  public.is_quest_creator(quest_id)
  OR public.is_admin()
);

-- Creators can INSERT squads for their quests
CREATE POLICY "Creators can create squads for their quests"
ON public.quest_squads
FOR INSERT
TO authenticated
WITH CHECK (
  public.is_quest_creator(quest_id)
  OR public.is_admin()
);

-- Creators can UPDATE squads for their quests
CREATE POLICY "Creators can update their quest squads"
ON public.quest_squads
FOR UPDATE
TO authenticated
USING (
  public.is_quest_creator(quest_id)
  OR public.is_admin()
)
WITH CHECK (
  public.is_quest_creator(quest_id)
  OR public.is_admin()
);

-- =============================================================================
-- squad_members policies for creators
-- =============================================================================

-- Creators can SELECT members for their quest squads
CREATE POLICY "Creators can view squad members for their quests"
ON public.squad_members
FOR SELECT
TO authenticated
USING (
  public.is_squad_quest_creator(squad_id)
  OR public.is_admin()
  OR user_id = auth.uid()
);

-- Creators can INSERT members into their quest squads
CREATE POLICY "Creators can add squad members to their quests"
ON public.squad_members
FOR INSERT
TO authenticated
WITH CHECK (
  public.is_squad_quest_creator(squad_id)
  OR public.is_admin()
);

-- Creators can UPDATE members in their quest squads
CREATE POLICY "Creators can update squad members in their quests"
ON public.squad_members
FOR UPDATE
TO authenticated
USING (
  public.is_squad_quest_creator(squad_id)
  OR public.is_admin()
)
WITH CHECK (
  public.is_squad_quest_creator(squad_id)
  OR public.is_admin()
);

-- =============================================================================
-- quest_signups policies for creators
-- =============================================================================

-- Creators can SELECT signups for their quests
CREATE POLICY "Creators can view signups for their quests"
ON public.quest_signups
FOR SELECT
TO authenticated
USING (
  public.is_quest_creator(quest_id)
  OR public.is_admin()
  OR user_id = auth.uid()
);

-- =============================================================================
-- message_templates - allow creators to read warm-up prompts
-- =============================================================================

-- Allow authenticated users to read warm-up and announcement templates
CREATE POLICY "Authenticated users can read message templates"
ON public.message_templates
FOR SELECT
TO authenticated
USING (
  category IN ('warm_up', 'announcement', 'reminder')
  OR public.is_admin()
);

-- =============================================================================
-- creator_announcements table for tracking sent announcements
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.creator_announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quest_id uuid REFERENCES public.quests(id) ON DELETE CASCADE NOT NULL,
  squad_id uuid REFERENCES public.quest_squads(id) ON DELETE SET NULL,
  creator_id uuid NOT NULL,
  message_type text NOT NULL DEFAULT 'general',
  subject text,
  body text NOT NULL,
  recipient_count integer DEFAULT 0,
  sent_at timestamptz DEFAULT now(),
  
  CONSTRAINT creator_announcements_creator_check CHECK (
    creator_id IS NOT NULL
  )
);

-- Enable RLS on creator_announcements
ALTER TABLE public.creator_announcements ENABLE ROW LEVEL SECURITY;

-- Creators can insert announcements for their quests
CREATE POLICY "Creators can send announcements for their quests"
ON public.creator_announcements
FOR INSERT
TO authenticated
WITH CHECK (
  public.is_quest_creator(quest_id)
  AND creator_id = auth.uid()
);

-- Creators can view their own announcements
CREATE POLICY "Creators can view their announcements"
ON public.creator_announcements
FOR SELECT
TO authenticated
USING (
  creator_id = auth.uid()
  OR public.is_admin()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_creator_announcements_quest_id ON public.creator_announcements(quest_id);
CREATE INDEX IF NOT EXISTS idx_creator_announcements_creator_id ON public.creator_announcements(creator_id);