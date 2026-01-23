-- Create function to increment reward redemptions
CREATE OR REPLACE FUNCTION public.increment_reward_redemptions(p_reward_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE rewards 
  SET redemptions_count = COALESCE(redemptions_count, 0) + 1
  WHERE id = p_reward_id;
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.increment_reward_redemptions(uuid) TO authenticated;