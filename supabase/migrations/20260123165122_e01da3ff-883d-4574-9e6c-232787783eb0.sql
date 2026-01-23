-- Add safety_notes column to quests table
ALTER TABLE quests ADD COLUMN IF NOT EXISTS safety_notes TEXT;