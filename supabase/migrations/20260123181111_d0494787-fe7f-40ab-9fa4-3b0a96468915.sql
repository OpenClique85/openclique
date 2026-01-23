-- Add lock tracking columns to quest_squads
ALTER TABLE quest_squads 
  ADD COLUMN IF NOT EXISTS locked_at timestamptz,
  ADD COLUMN IF NOT EXISTS locked_by uuid REFERENCES auth.users(id);

-- Add index for efficient lock queries
CREATE INDEX IF NOT EXISTS idx_quest_squads_locked_at ON quest_squads(locked_at) WHERE locked_at IS NOT NULL;