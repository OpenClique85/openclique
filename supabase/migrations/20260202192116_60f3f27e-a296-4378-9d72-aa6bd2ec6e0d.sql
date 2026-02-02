-- Add warm-up prompt columns to quests table
ALTER TABLE public.quests 
ADD COLUMN IF NOT EXISTS warm_up_prompt_id uuid REFERENCES public.message_templates(id),
ADD COLUMN IF NOT EXISTS warm_up_prompt_custom text;

-- Add extended squad statuses to the squad_status enum
ALTER TYPE squad_status ADD VALUE IF NOT EXISTS 'warming_up';
ALTER TYPE squad_status ADD VALUE IF NOT EXISTS 'ready_for_review';
ALTER TYPE squad_status ADD VALUE IF NOT EXISTS 'approved';
ALTER TYPE squad_status ADD VALUE IF NOT EXISTS 'cancelled';
ALTER TYPE squad_status ADD VALUE IF NOT EXISTS 'archived';

-- Add prompt_response and readiness columns to squad_members if not present
ALTER TABLE public.squad_members
ADD COLUMN IF NOT EXISTS prompt_response text,
ADD COLUMN IF NOT EXISTS readiness_confirmed_at timestamptz;