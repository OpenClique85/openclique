-- Fix the overly permissive "Anyone can update referral clicks" policy
-- Drop the permissive policy and replace with a more secure one

DROP POLICY IF EXISTS "Anyone can update referral clicks" ON public.referrals;

-- Create a database function to track referral clicks (called via RPC)
CREATE OR REPLACE FUNCTION public.track_referral_click(p_referral_code text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.referrals 
  SET clicked_at = COALESCE(clicked_at, now())
  WHERE referral_code = p_referral_code;
END;
$$;

-- Create a function to record when a referred user signs up
CREATE OR REPLACE FUNCTION public.record_referral_signup(p_referral_code text, p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.referrals 
  SET 
    referred_user_id = p_user_id,
    signed_up_at = now()
  WHERE referral_code = p_referral_code
    AND referred_user_id IS NULL;
END;
$$;