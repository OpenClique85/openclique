-- Drop and recreate submit_warm_up_prompt function without warm_up_progress reference
DROP FUNCTION IF EXISTS public.submit_warm_up_prompt(UUID, TEXT);

CREATE OR REPLACE FUNCTION public.submit_warm_up_prompt(p_squad_id UUID, p_response TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update the member's prompt response
  UPDATE squad_members
  SET prompt_response = p_response
  WHERE squad_id = p_squad_id AND user_id = auth.uid();
  
  -- Check if squad is now ready
  PERFORM check_squad_readiness(p_squad_id);
END;
$$;