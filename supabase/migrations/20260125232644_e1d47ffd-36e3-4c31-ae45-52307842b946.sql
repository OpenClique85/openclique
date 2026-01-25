-- Add weight columns to user_social_energy
ALTER TABLE user_social_energy 
  ADD COLUMN IF NOT EXISTS energy_weight INTEGER DEFAULT 34,
  ADD COLUMN IF NOT EXISTS structure_weight INTEGER DEFAULT 33,
  ADD COLUMN IF NOT EXISTS focus_weight INTEGER DEFAULT 33;

-- Create role ranking table
CREATE TABLE user_role_rankings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
  rank_1 TEXT NOT NULL CHECK (rank_1 IN ('planner', 'connector', 'stabilizer', 'spark')),
  rank_2 TEXT NOT NULL CHECK (rank_2 IN ('planner', 'connector', 'stabilizer', 'spark')),
  rank_3 TEXT NOT NULL CHECK (rank_3 IN ('planner', 'connector', 'stabilizer', 'spark')),
  rank_4 TEXT NOT NULL CHECK (rank_4 IN ('planner', 'connector', 'stabilizer', 'spark')),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS policies
ALTER TABLE user_role_rankings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view any role rankings"
  ON user_role_rankings FOR SELECT USING (true);

CREATE POLICY "Users can insert own role rankings"
  ON user_role_rankings FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own role rankings"
  ON user_role_rankings FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own role rankings"
  ON user_role_rankings FOR DELETE USING (auth.uid() = user_id);