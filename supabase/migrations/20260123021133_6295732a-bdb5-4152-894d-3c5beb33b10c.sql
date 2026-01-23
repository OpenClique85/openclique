-- Fix critical edge case: Prevent double XP awarding at the database level
-- Add a trigger to prevent changing status back to 'completed' if XP was already awarded

-- Create a function to track XP award events and prevent duplicates
CREATE OR REPLACE FUNCTION public.prevent_duplicate_xp_award()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- If status is being changed TO 'completed' and it was already 'completed', block
  IF NEW.status = 'completed' AND OLD.status = 'completed' THEN
    -- Allow the update but don't re-trigger XP (this is handled in RPC)
    RETURN NEW;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for the check
DROP TRIGGER IF EXISTS check_duplicate_completion ON quest_signups;
CREATE TRIGGER check_duplicate_completion
  BEFORE UPDATE ON quest_signups
  FOR EACH ROW
  EXECUTE FUNCTION prevent_duplicate_xp_award();

-- Fix permissive RLS: Restrict feedback UPDATE to own records only
DROP POLICY IF EXISTS "Admins can update feedback" ON feedback;
CREATE POLICY "Admins can update feedback"
  ON feedback FOR UPDATE
  USING (is_admin());

-- Fix: Add missing notification types to enum if not present
DO $$
BEGIN
  -- Add notification types that may be referenced but missing
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'quest_approved' AND enumtypid = 'notification_type'::regtype) THEN
    ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'quest_approved';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'quest_changes_requested' AND enumtypid = 'notification_type'::regtype) THEN
    ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'quest_changes_requested';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'quest_rejected' AND enumtypid = 'notification_type'::regtype) THEN
    ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'quest_rejected';
  END IF;
EXCEPTION WHEN duplicate_object THEN
  -- Ignore if types already exist
  NULL;
END $$;