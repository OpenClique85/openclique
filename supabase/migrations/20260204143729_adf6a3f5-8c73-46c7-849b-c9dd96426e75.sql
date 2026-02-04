-- quest_squads.quest_id currently references quests.id, but we need to link to quest_instances.
-- Add instance_id column referencing quest_instances to fix FK errors when creating cliques from control room.

-- 1. Add instance_id column
ALTER TABLE public.quest_squads
ADD COLUMN IF NOT EXISTS instance_id UUID REFERENCES public.quest_instances(id) ON DELETE CASCADE;

-- 2. Create index for performance
CREATE INDEX IF NOT EXISTS idx_quest_squads_instance_id ON public.quest_squads(instance_id);

-- 3. Backfill existing data: set instance_id from quest_id if matching instance exists
UPDATE public.quest_squads qs
SET instance_id = qi.id
FROM public.quest_instances qi
WHERE qs.quest_id = qi.quest_id AND qs.instance_id IS NULL;