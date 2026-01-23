-- Expand quest_status enum with new lifecycle states
ALTER TYPE quest_status ADD VALUE IF NOT EXISTS 'paused';
ALTER TYPE quest_status ADD VALUE IF NOT EXISTS 'revoked';

-- Add operational metadata columns to quests table for lifecycle management
ALTER TABLE quests ADD COLUMN IF NOT EXISTS paused_at timestamptz;
ALTER TABLE quests ADD COLUMN IF NOT EXISTS paused_reason text;
ALTER TABLE quests ADD COLUMN IF NOT EXISTS paused_by uuid REFERENCES auth.users(id);
ALTER TABLE quests ADD COLUMN IF NOT EXISTS revoked_at timestamptz;
ALTER TABLE quests ADD COLUMN IF NOT EXISTS revoked_reason text;
ALTER TABLE quests ADD COLUMN IF NOT EXISTS revoked_by uuid REFERENCES auth.users(id);
ALTER TABLE quests ADD COLUMN IF NOT EXISTS priority_flag boolean DEFAULT false;
ALTER TABLE quests ADD COLUMN IF NOT EXISTS city text;
ALTER TABLE quests ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE quests ADD COLUMN IF NOT EXISTS previous_status quest_status;