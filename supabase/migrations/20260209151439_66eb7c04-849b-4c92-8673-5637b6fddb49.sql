
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS tutorial_quest_completed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS tutorial_quest_step INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS tutorial_quest_dismissed_count INT DEFAULT 0;
