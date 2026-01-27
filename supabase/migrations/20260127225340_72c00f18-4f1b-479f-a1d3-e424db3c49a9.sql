-- =============================================================================
-- SECURITY FIX: Add RLS policies to account_deletion_feedback table
-- This table contains sensitive PII (emails, display names, deletion reasons)
-- and must be restricted to admin access only
-- =============================================================================

-- First, ensure RLS is enabled on the table
ALTER TABLE public.account_deletion_feedback ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies to start fresh
DROP POLICY IF EXISTS "Admins can view deletion feedback" ON public.account_deletion_feedback;
DROP POLICY IF EXISTS "Admins can insert deletion feedback" ON public.account_deletion_feedback;
DROP POLICY IF EXISTS "Admins can update deletion feedback" ON public.account_deletion_feedback;
DROP POLICY IF EXISTS "Admins can delete deletion feedback" ON public.account_deletion_feedback;

-- Policy: Only admins can SELECT deletion feedback
-- Uses the existing is_admin() security definer function
CREATE POLICY "Admins can view deletion feedback"
ON public.account_deletion_feedback
FOR SELECT
TO authenticated
USING (public.is_admin());

-- Policy: Only admins can INSERT deletion feedback
-- (Typically inserted by the account deletion system, but admins may need to manually add)
CREATE POLICY "Admins can insert deletion feedback"
ON public.account_deletion_feedback
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());

-- Policy: Only admins can UPDATE deletion feedback
CREATE POLICY "Admins can update deletion feedback"
ON public.account_deletion_feedback
FOR UPDATE
TO authenticated
USING (public.is_admin());

-- Policy: Only admins can DELETE deletion feedback
CREATE POLICY "Admins can delete deletion feedback"
ON public.account_deletion_feedback
FOR DELETE
TO authenticated
USING (public.is_admin());