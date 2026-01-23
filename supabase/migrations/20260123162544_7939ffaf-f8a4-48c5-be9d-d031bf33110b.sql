-- Phase 1: Enrich quests table with all template fields
-- Add fields from QuestFormData not yet in DB

-- Discovery/Content fields
ALTER TABLE quests ADD COLUMN IF NOT EXISTS full_description TEXT;
ALTER TABLE quests ADD COLUMN IF NOT EXISTS highlights JSONB DEFAULT '[]';
ALTER TABLE quests ADD COLUMN IF NOT EXISTS duration_notes TEXT;

-- Preparation & Safety fields
ALTER TABLE quests ADD COLUMN IF NOT EXISTS what_to_bring TEXT;
ALTER TABLE quests ADD COLUMN IF NOT EXISTS dress_code TEXT;
ALTER TABLE quests ADD COLUMN IF NOT EXISTS physical_requirements TEXT;
ALTER TABLE quests ADD COLUMN IF NOT EXISTS age_restriction TEXT;
ALTER TABLE quests ADD COLUMN IF NOT EXISTS emergency_contact TEXT;

-- Template-like fields (defaults for instances)
ALTER TABLE quests ADD COLUMN IF NOT EXISTS default_duration_minutes INTEGER DEFAULT 120;
ALTER TABLE quests ADD COLUMN IF NOT EXISTS default_capacity INTEGER DEFAULT 24;
ALTER TABLE quests ADD COLUMN IF NOT EXISTS default_squad_size INTEGER DEFAULT 6;
ALTER TABLE quests ADD COLUMN IF NOT EXISTS xp_rules JSONB DEFAULT '{"base_xp": 100, "check_in_bonus": 25, "proof_bonus": 50, "feedback_bonus": 25}';
ALTER TABLE quests ADD COLUMN IF NOT EXISTS required_proof_types TEXT[] DEFAULT ARRAY['photo'];
ALTER TABLE quests ADD COLUMN IF NOT EXISTS timeline_prompts JSONB DEFAULT '[]';

-- Operational flags
ALTER TABLE quests ADD COLUMN IF NOT EXISTS is_repeatable BOOLEAN DEFAULT false;
ALTER TABLE quests ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Add comment explaining the unified model
COMMENT ON TABLE quests IS 'Quest templates - defines WHAT the experience is. Can be run multiple times via quest_instances.';
COMMENT ON COLUMN quests.is_repeatable IS 'If true, multiple instances can be created from this quest';
COMMENT ON COLUMN quests.xp_rules IS 'JSON with base_xp, check_in_bonus, proof_bonus, feedback_bonus';
COMMENT ON COLUMN quests.timeline_prompts IS 'JSON array of scheduled messages for Run of Show';