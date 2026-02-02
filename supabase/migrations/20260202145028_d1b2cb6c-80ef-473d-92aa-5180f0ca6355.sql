-- Secure the profiles_public view with security_invoker
-- This ensures the view respects RLS of the underlying table
ALTER VIEW public.profiles_public SET (security_invoker = true);

COMMENT ON VIEW public.profiles_public IS 'Public view of profiles with PII stripped. Uses security_invoker=true for RLS inheritance. Email is never exposed through this view.';

-- Create a secure function that only returns email to authorized users
-- (the user themselves or admins)
CREATE OR REPLACE FUNCTION public.get_user_email(target_user_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_email text;
BEGIN
  -- Only allow access to own email or if caller is admin
  IF auth.uid() = target_user_id OR is_admin() THEN
    SELECT email INTO user_email
    FROM profiles
    WHERE id = target_user_id;
    
    RETURN user_email;
  ELSE
    RETURN NULL;
  END IF;
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.get_user_email(uuid) TO authenticated;

-- Add comment for documentation
COMMENT ON FUNCTION public.get_user_email(uuid) IS 'Securely retrieves email for a user. Only returns email if the caller is the user themselves or an admin. Returns NULL otherwise.';