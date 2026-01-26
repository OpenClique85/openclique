-- =============================================================================
-- DELETE_CLIQUE RPC - Permanently remove archived cliques
-- =============================================================================

-- Create RPC to safely delete a clique and all its related data
CREATE OR REPLACE FUNCTION public.delete_clique(p_clique_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_active_members INTEGER;
  v_clique_name TEXT;
BEGIN
  -- Verify clique exists
  SELECT name INTO v_clique_name FROM squads WHERE id = p_clique_id;
  
  IF v_clique_name IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Clique not found');
  END IF;
  
  -- Check for active members
  SELECT COUNT(*) INTO v_active_members
  FROM squad_members 
  WHERE persistent_squad_id = p_clique_id 
  AND status = 'active';
  
  IF v_active_members > 0 THEN
    RETURN jsonb_build_object(
      'success', false, 
      'error', 'Cannot delete clique with active members. Archive or remove members first.',
      'active_members', v_active_members
    );
  END IF;
  
  -- Delete related records in order (respecting FK constraints)
  DELETE FROM squad_chat_messages WHERE squad_id = p_clique_id;
  DELETE FROM squad_quest_invites WHERE squad_id = p_clique_id;
  DELETE FROM clique_role_assignments WHERE clique_id = p_clique_id;
  DELETE FROM clique_lore_entries WHERE squad_id = p_clique_id;
  DELETE FROM clique_polls WHERE squad_id = p_clique_id;
  DELETE FROM clique_ready_checks WHERE squad_id = p_clique_id;
  DELETE FROM clique_applications WHERE squad_id = p_clique_id;
  DELETE FROM squad_members WHERE persistent_squad_id = p_clique_id;
  
  -- Delete the clique itself
  DELETE FROM squads WHERE id = p_clique_id;
  
  RETURN jsonb_build_object(
    'success', true, 
    'deleted_clique', v_clique_name
  );
END;
$$;

-- Grant execute to authenticated users (admin check happens in app layer)
GRANT EXECUTE ON FUNCTION public.delete_clique(UUID) TO authenticated;

-- Add club_onboarding and enterprise_setup subcategories to playbooks
-- These will be used for new documentation

-- Add social_chair role to org_member_role enum if not exists
DO $$
BEGIN
  -- Check if social_chair exists in the enum
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'org_member_role' AND e.enumlabel = 'social_chair'
  ) THEN
    ALTER TYPE public.org_member_role ADD VALUE IF NOT EXISTS 'social_chair';
  END IF;
END $$;

-- Add onboarded_at column to profile_organizations for tracking social chair onboarding
ALTER TABLE public.profile_organizations 
ADD COLUMN IF NOT EXISTS onboarded_at TIMESTAMPTZ;