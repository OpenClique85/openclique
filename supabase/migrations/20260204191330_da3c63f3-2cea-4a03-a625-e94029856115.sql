-- Fix missing column referenced by warm-up RPCs
ALTER TABLE public.quest_instances
ADD COLUMN IF NOT EXISTS warm_up_min_ready_pct numeric NOT NULL DEFAULT 100;