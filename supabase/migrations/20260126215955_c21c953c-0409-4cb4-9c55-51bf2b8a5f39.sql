-- Add missing columns to org_invite_codes for enhanced invite code system
ALTER TABLE public.org_invite_codes 
ADD COLUMN IF NOT EXISTS label TEXT,
ADD COLUMN IF NOT EXISTS auto_assign_role TEXT DEFAULT 'member';

-- Add comment for documentation
COMMENT ON COLUMN public.org_invite_codes.label IS 'Human-readable label for the code (e.g., Spring 2026 Cohort)';
COMMENT ON COLUMN public.org_invite_codes.auto_assign_role IS 'Role to assign when code is redeemed (default: member)';