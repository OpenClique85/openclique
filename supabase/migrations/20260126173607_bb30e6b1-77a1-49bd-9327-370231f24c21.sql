-- Add missing created_via column to quests table
ALTER TABLE public.quests
ADD COLUMN IF NOT EXISTS created_via TEXT DEFAULT 'manual';