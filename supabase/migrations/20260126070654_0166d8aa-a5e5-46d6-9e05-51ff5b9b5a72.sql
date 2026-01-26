-- Create a security definer function to check squad membership without recursion
CREATE OR REPLACE FUNCTION public.is_squad_member(p_squad_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM squad_members
    WHERE squad_id = p_squad_id
    AND user_id = auth.uid()
  )
$$;

-- Create a security definer function to check persistent squad (clique) membership
CREATE OR REPLACE FUNCTION public.is_clique_member(p_clique_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM squad_members
    WHERE persistent_squad_id = p_clique_id
    AND user_id = auth.uid()
    AND status = 'active'
  )
$$;

-- Drop the problematic self-referencing policies
DROP POLICY IF EXISTS "Users can view fellow squad members" ON squad_members;
DROP POLICY IF EXISTS "Users can view members of their squads" ON squad_members;
DROP POLICY IF EXISTS "Users can view their own squad memberships" ON squad_members;
DROP POLICY IF EXISTS "Users can view their squad memberships" ON squad_members;

-- Create new non-recursive SELECT policies
CREATE POLICY "Users can view their own memberships"
ON squad_members FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can view fellow clique members"
ON squad_members FOR SELECT
USING (public.is_clique_member(persistent_squad_id));

CREATE POLICY "Users can view fellow quest squad members"
ON squad_members FOR SELECT
USING (public.is_squad_member(squad_id));

-- Add INSERT policy for users to create their own membership (needed for clique creation)
CREATE POLICY "Users can insert their own membership"
ON squad_members FOR INSERT
WITH CHECK (user_id = auth.uid());

-- Fix the squads SELECT policy that also has recursion
DROP POLICY IF EXISTS "Users can view their squads" ON squads;

CREATE POLICY "Users can view their cliques"
ON squads FOR SELECT
USING (public.is_clique_member(id));

-- Add INSERT policy for squads (users can create cliques)
CREATE POLICY "Authenticated users can create squads"
ON squads FOR INSERT
TO authenticated
WITH CHECK (true);