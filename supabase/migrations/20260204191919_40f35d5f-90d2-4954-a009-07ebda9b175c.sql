-- Fix confirm_warm_up_readiness function to not use missing columns
CREATE OR REPLACE FUNCTION public.confirm_warm_up_readiness(p_squad_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Just set readiness_confirmed_at (warm_up_progress column doesn't exist)
  UPDATE squad_members
  SET readiness_confirmed_at = now()
  WHERE squad_id = p_squad_id AND user_id = auth.uid();
  
  -- Log event
  INSERT INTO quest_event_log (instance_id, event_type, target_user_id, payload)
  SELECT qs.quest_id, 'readiness_confirmed', auth.uid(), jsonb_build_object('squad_id', p_squad_id)
  FROM quest_squads qs WHERE qs.id = p_squad_id;
  
  -- Check if squad is now ready
  PERFORM check_squad_readiness(p_squad_id);
END;
$$;

-- Also fix submit_warm_up_prompt to not use missing columns
CREATE OR REPLACE FUNCTION public.submit_warm_up_prompt(p_squad_id uuid, p_response text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Just set prompt_response
  UPDATE squad_members
  SET prompt_response = p_response
  WHERE squad_id = p_squad_id AND user_id = auth.uid();
  
  -- Log event
  INSERT INTO quest_event_log (instance_id, event_type, target_user_id, payload)
  SELECT qs.quest_id, 'prompt_answered', auth.uid(), jsonb_build_object('squad_id', p_squad_id)
  FROM quest_squads qs WHERE qs.id = p_squad_id;
  
  -- Check if squad is now ready
  PERFORM check_squad_readiness(p_squad_id);
END;
$$;