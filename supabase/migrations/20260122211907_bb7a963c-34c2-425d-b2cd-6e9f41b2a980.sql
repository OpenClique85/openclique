-- ============================================================================
-- CREATOR PORTAL DATABASE SCHEMA - Part 1: Enum additions
-- ============================================================================

-- 1. Add quest_creator role to existing enum
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'quest_creator';

-- 2. Add new notification types for creator workflow
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'quest_submitted';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'quest_approved';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'quest_changes_requested';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'quest_rejected';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'creator_invite';

-- 3. Create review_status enum for quest review workflow
DO $$ BEGIN
  CREATE TYPE review_status AS ENUM ('draft', 'pending_review', 'needs_changes', 'approved', 'rejected');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;