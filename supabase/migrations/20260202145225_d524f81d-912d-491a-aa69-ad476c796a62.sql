-- Create a secure view for account_deletion_requests that excludes email
CREATE OR REPLACE VIEW public.account_deletion_requests_safe AS
SELECT 
  id,
  user_id,
  status,
  scheduled_at,
  processed_at,
  cancellation_reason,
  created_at
  -- Excluded: user_email (sensitive PII)
FROM account_deletion_requests;

-- Set security_invoker so view inherits RLS from underlying table
ALTER VIEW public.account_deletion_requests_safe SET (security_invoker = true);

COMMENT ON VIEW public.account_deletion_requests_safe IS 'Safe view of account deletion requests with email excluded. Uses security_invoker=true for RLS inheritance.';

-- Create a secure function that only returns email to authorized users
-- (the user themselves or admins - for processing the deletion)
CREATE OR REPLACE FUNCTION public.get_deletion_request_email(target_request_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  request_email text;
  request_user_id uuid;
BEGIN
  -- Get the request's user_id and email
  SELECT user_id, user_email INTO request_user_id, request_email
  FROM account_deletion_requests
  WHERE id = target_request_id;
  
  -- Only allow access to own email or if caller is admin
  IF auth.uid() = request_user_id OR is_admin() THEN
    RETURN request_email;
  ELSE
    RETURN NULL;
  END IF;
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.get_deletion_request_email(uuid) TO authenticated;

COMMENT ON FUNCTION public.get_deletion_request_email(uuid) IS 'Securely retrieves email for a deletion request. Only returns email if the caller owns the request or is an admin. Returns NULL otherwise.';