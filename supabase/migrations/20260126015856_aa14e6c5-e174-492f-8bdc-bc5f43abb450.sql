-- =============================================================================
-- Phase 3: Clique Governance & Roles
-- Creates role assignments table and governance functions
-- =============================================================================

-- Create clique_role_assignments table for soft roles
CREATE TABLE IF NOT EXISTS public.clique_role_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clique_id UUID NOT NULL REFERENCES public.squads(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('navigator', 'vibe_curator', 'timekeeper', 'archivist')),
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  assigned_by UUID,
  expires_at TIMESTAMPTZ,
  declined_at TIMESTAMPTZ,
  rotation_enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(clique_id, role) -- Only one person per role per clique
);

-- Enable RLS on clique_role_assignments
ALTER TABLE public.clique_role_assignments ENABLE ROW LEVEL SECURITY;

-- RLS: Members can view role assignments for their cliques
CREATE POLICY "Members can view clique role assignments"
  ON public.clique_role_assignments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.squad_members sm
      WHERE sm.persistent_squad_id = clique_role_assignments.clique_id
        AND sm.user_id = auth.uid()
        AND sm.status = 'active'
    )
  );

-- RLS: Leaders can manage role assignments
CREATE POLICY "Leaders can manage clique role assignments"
  ON public.clique_role_assignments
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.squad_members sm
      WHERE sm.persistent_squad_id = clique_role_assignments.clique_id
        AND sm.user_id = auth.uid()
        AND sm.role = 'leader'
        AND sm.status = 'active'
    )
  );

-- Add governance columns to squads table if not exists
DO $$
BEGIN
  -- Add lfc_listing_enabled if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'squads' AND column_name = 'lfc_listing_enabled'
  ) THEN
    ALTER TABLE public.squads ADD COLUMN lfc_listing_enabled BOOLEAN DEFAULT false;
  END IF;

  -- Add application_prompts for LFC
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'squads' AND column_name = 'application_prompts'
  ) THEN
    ALTER TABLE public.squads ADD COLUMN application_prompts JSONB DEFAULT '[]'::jsonb;
  END IF;

  -- Add clique_rules
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'squads' AND column_name = 'clique_rules'
  ) THEN
    ALTER TABLE public.squads ADD COLUMN clique_rules TEXT;
  END IF;

  -- Add role_rotation_mode
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'squads' AND column_name = 'role_rotation_mode'
  ) THEN
    ALTER TABLE public.squads ADD COLUMN role_rotation_mode TEXT DEFAULT 'manual' CHECK (role_rotation_mode IN ('manual', 'per_quest', 'monthly'));
  END IF;
END $$;

-- Function to transfer leadership
CREATE OR REPLACE FUNCTION public.transfer_clique_leadership(
  p_clique_id UUID,
  p_new_leader_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_current_leader_id UUID;
BEGIN
  -- Get current leader
  SELECT user_id INTO v_current_leader_id
  FROM squad_members
  WHERE persistent_squad_id = p_clique_id
    AND role = 'leader'
    AND status = 'active';
  
  -- Verify caller is current leader
  IF v_current_leader_id != auth.uid() THEN
    RAISE EXCEPTION 'Only the current leader can transfer leadership';
  END IF;
  
  -- Verify new leader is a member
  IF NOT EXISTS (
    SELECT 1 FROM squad_members
    WHERE persistent_squad_id = p_clique_id
      AND user_id = p_new_leader_id
      AND status = 'active'
  ) THEN
    RAISE EXCEPTION 'New leader must be an active member of the clique';
  END IF;
  
  -- Demote current leader to member
  UPDATE squad_members
  SET role = 'member'
  WHERE persistent_squad_id = p_clique_id
    AND user_id = v_current_leader_id;
  
  -- Promote new leader
  UPDATE squad_members
  SET role = 'leader'
  WHERE persistent_squad_id = p_clique_id
    AND user_id = p_new_leader_id;
END;
$$;

-- Function to assign a role
CREATE OR REPLACE FUNCTION public.assign_clique_role(
  p_clique_id UUID,
  p_user_id UUID,
  p_role TEXT,
  p_expires_at TIMESTAMPTZ DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_assignment_id UUID;
BEGIN
  -- Verify caller is leader
  IF NOT EXISTS (
    SELECT 1 FROM squad_members
    WHERE persistent_squad_id = p_clique_id
      AND user_id = auth.uid()
      AND role = 'leader'
      AND status = 'active'
  ) THEN
    RAISE EXCEPTION 'Only the clique leader can assign roles';
  END IF;
  
  -- Verify target is a member
  IF NOT EXISTS (
    SELECT 1 FROM squad_members
    WHERE persistent_squad_id = p_clique_id
      AND user_id = p_user_id
      AND status = 'active'
  ) THEN
    RAISE EXCEPTION 'User must be an active member of the clique';
  END IF;
  
  -- Upsert the role assignment
  INSERT INTO clique_role_assignments (clique_id, user_id, role, assigned_by, expires_at)
  VALUES (p_clique_id, p_user_id, p_role, auth.uid(), p_expires_at)
  ON CONFLICT (clique_id, role)
  DO UPDATE SET
    user_id = EXCLUDED.user_id,
    assigned_by = EXCLUDED.assigned_by,
    assigned_at = now(),
    expires_at = EXCLUDED.expires_at,
    declined_at = NULL
  RETURNING id INTO v_assignment_id;
  
  RETURN v_assignment_id;
END;
$$;

-- Function to decline a role
CREATE OR REPLACE FUNCTION public.decline_clique_role(
  p_clique_id UUID,
  p_role TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE clique_role_assignments
  SET declined_at = now()
  WHERE clique_id = p_clique_id
    AND role = p_role
    AND user_id = auth.uid();
END;
$$;

-- Function to archive a clique (read-only mode)
CREATE OR REPLACE FUNCTION public.archive_clique(p_clique_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Verify caller is leader
  IF NOT EXISTS (
    SELECT 1 FROM squad_members
    WHERE persistent_squad_id = p_clique_id
      AND user_id = auth.uid()
      AND role = 'leader'
      AND status = 'active'
  ) THEN
    RAISE EXCEPTION 'Only the clique leader can archive the clique';
  END IF;
  
  UPDATE squads
  SET archived_at = now()
  WHERE id = p_clique_id;
END;
$$;

-- Function to reactivate an archived clique
CREATE OR REPLACE FUNCTION public.reactivate_clique(p_clique_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Verify caller is leader
  IF NOT EXISTS (
    SELECT 1 FROM squad_members
    WHERE persistent_squad_id = p_clique_id
      AND user_id = auth.uid()
      AND role = 'leader'
      AND status = 'active'
  ) THEN
    RAISE EXCEPTION 'Only the clique leader can reactivate the clique';
  END IF;
  
  UPDATE squads
  SET archived_at = NULL
  WHERE id = p_clique_id;
END;
$$;