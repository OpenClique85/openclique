-- Enable RLS on account_deletion_feedback table
ALTER TABLE public.account_deletion_feedback ENABLE ROW LEVEL SECURITY;

-- Only admins can view account deletion feedback (contains PII of deleted users)
CREATE POLICY "Only admins can view account deletion feedback"
ON public.account_deletion_feedback
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Only admins can insert account deletion feedback
CREATE POLICY "Only admins can insert account deletion feedback"
ON public.account_deletion_feedback
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Only admins can update account deletion feedback
CREATE POLICY "Only admins can update account deletion feedback"
ON public.account_deletion_feedback
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Only admins can delete account deletion feedback
CREATE POLICY "Only admins can delete account deletion feedback"
ON public.account_deletion_feedback
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Add comment documenting the security model
COMMENT ON TABLE public.account_deletion_feedback IS 
'Stores feedback from users who deleted their accounts. Contains PII (email, display_name).
ACCESS: Admin-only via RLS. No public or user access permitted.
RETENTION: Subject to data retention policy review.';