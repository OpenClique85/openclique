-- Add proposal templates storage to sponsor_profiles
ALTER TABLE sponsor_profiles 
ADD COLUMN IF NOT EXISTS proposal_templates jsonb DEFAULT '[]'::jsonb;

-- Add decline reason to sponsorship_proposals
ALTER TABLE sponsorship_proposals 
ADD COLUMN IF NOT EXISTS decline_reason text;