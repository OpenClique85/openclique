-- Add admin access policy for clique_role_assignments
CREATE POLICY "Admins can manage all clique role assignments"
ON public.clique_role_assignments
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());