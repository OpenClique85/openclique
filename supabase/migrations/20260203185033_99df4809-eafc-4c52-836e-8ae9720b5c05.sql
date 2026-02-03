-- Add synthetic flag to profiles for bot identification
ALTER TABLE profiles 
  ADD COLUMN IF NOT EXISTS is_synthetic BOOLEAN DEFAULT false;

-- Add simulation tracking to quest_squads
ALTER TABLE quest_squads
  ADD COLUMN IF NOT EXISTS is_simulation BOOLEAN DEFAULT false;

-- Create index for filtering out synthetic profiles
CREATE INDEX IF NOT EXISTS idx_profiles_is_synthetic ON profiles(is_synthetic) WHERE is_synthetic = true;

-- Create index for filtering out simulation squads
CREATE INDEX IF NOT EXISTS idx_quest_squads_is_simulation ON quest_squads(is_simulation) WHERE is_simulation = true;