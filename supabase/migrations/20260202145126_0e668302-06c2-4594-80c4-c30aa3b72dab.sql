-- Create a secure function that only returns phone to authorized users
-- (the signup owner themselves or admins)
CREATE OR REPLACE FUNCTION public.get_signup_phone(target_signup_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  signup_phone text;
  signup_user_id uuid;
BEGIN
  -- Get the signup's user_id and phone
  SELECT user_id, phone INTO signup_user_id, signup_phone
  FROM quest_signups
  WHERE id = target_signup_id;
  
  -- Only allow access to own phone or if caller is admin
  IF auth.uid() = signup_user_id OR is_admin() THEN
    RETURN signup_phone;
  ELSE
    RETURN NULL;
  END IF;
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.get_signup_phone(uuid) TO authenticated;

-- Add comment for documentation
COMMENT ON FUNCTION public.get_signup_phone(uuid) IS 'Securely retrieves phone number for a quest signup. Only returns phone if the caller owns the signup or is an admin. Returns NULL otherwise.';

-- Create a safe view for quest_signups that excludes sensitive PII
CREATE OR REPLACE VIEW public.quest_signups_public AS
SELECT 
  id,
  quest_id,
  user_id,
  status,
  signed_up_at,
  updated_at,
  instance_id,
  whatsapp_joined,
  checked_in_at,
  proof_submitted_at,
  completed_at,
  last_activity_at
  -- Excluded: phone, notes_private, cancellation_reason, participant_token
FROM quest_signups;

-- Set security_invoker so view inherits RLS from underlying table
ALTER VIEW public.quest_signups_public SET (security_invoker = true);

COMMENT ON VIEW public.quest_signups_public IS 'Public view of quest signups with PII stripped (no phone, private notes, or tokens). Uses security_invoker=true for RLS inheritance.';