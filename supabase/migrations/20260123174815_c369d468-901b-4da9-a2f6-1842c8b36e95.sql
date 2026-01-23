-- Add paused state to instance_status enum
ALTER TYPE instance_status ADD VALUE IF NOT EXISTS 'paused';

-- Add lifecycle tracking columns to quest_instances
ALTER TABLE quest_instances 
  ADD COLUMN IF NOT EXISTS paused_at timestamptz,
  ADD COLUMN IF NOT EXISTS paused_reason text,
  ADD COLUMN IF NOT EXISTS previous_status instance_status;

-- Add squad formation reasoning columns
ALTER TABLE quest_squads
  ADD COLUMN IF NOT EXISTS formation_reason jsonb,
  ADD COLUMN IF NOT EXISTS compatibility_score numeric(4,2),
  ADD COLUMN IF NOT EXISTS referral_bonds integer DEFAULT 0;