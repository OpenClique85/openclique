-- ============================================================================
-- PHASE 1A (Part 1): ADD ENUM VALUES FIRST
-- ============================================================================

-- Add new values to org_member_role enum
ALTER TYPE public.org_member_role ADD VALUE IF NOT EXISTS 'social_chair';
ALTER TYPE public.org_member_role ADD VALUE IF NOT EXISTS 'org_admin';