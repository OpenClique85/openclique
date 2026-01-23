-- Phase 2: Update quest_instances to reference quests table
-- First clean up orphan references, then add FK

-- Set orphan template_ids to NULL (instances referencing non-existent templates)
UPDATE quest_instances 
SET template_id = NULL 
WHERE template_id IS NOT NULL 
  AND template_id NOT IN (SELECT id FROM quests);

-- Now rename template_id to quest_id
ALTER TABLE quest_instances RENAME COLUMN template_id TO quest_id;

-- Add archived_at for auto-archival tracking
ALTER TABLE quest_instances ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;

-- Add comms fields that were on quests table
ALTER TABLE quest_instances ADD COLUMN IF NOT EXISTS whatsapp_invite_link TEXT;
ALTER TABLE quest_instances ADD COLUMN IF NOT EXISTS briefing_html TEXT;

-- Add FK constraint (now safe since orphans are NULL)
ALTER TABLE quest_instances 
  ADD CONSTRAINT quest_instances_quest_id_fkey 
  FOREIGN KEY (quest_id) REFERENCES quests(id) ON DELETE SET NULL;

-- Add comments
COMMENT ON TABLE quest_instances IS 'Quest runs - defines WHEN/WHERE a specific occurrence happens. Operational focus.';
COMMENT ON COLUMN quest_instances.quest_id IS 'Reference to the quest template this instance is based on';
COMMENT ON COLUMN quest_instances.archived_at IS 'When this instance was archived (7 days after completion)';