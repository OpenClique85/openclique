-- Fix confirm_warm_up_readiness function to include actor_type
CREATE OR REPLACE FUNCTION public.confirm_warm_up_readiness(p_squad_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Set readiness_confirmed_at
  UPDATE squad_members
  SET readiness_confirmed_at = now()
  WHERE squad_id = p_squad_id AND user_id = auth.uid();
  
  -- Log event with actor_type
  INSERT INTO quest_event_log (instance_id, event_type, target_user_id, actor_type, payload)
  SELECT qs.quest_id, 'readiness_confirmed', auth.uid(), 'user', jsonb_build_object('squad_id', p_squad_id)
  FROM quest_squads qs WHERE qs.id = p_squad_id;
  
  -- Check if squad is now ready
  PERFORM check_squad_readiness(p_squad_id);
END;
$$;

-- Fix submit_warm_up_prompt function to include actor_type
CREATE OR REPLACE FUNCTION public.submit_warm_up_prompt(p_squad_id uuid, p_response text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Set prompt_response
  UPDATE squad_members
  SET prompt_response = p_response
  WHERE squad_id = p_squad_id AND user_id = auth.uid();
  
  -- Log event with actor_type
  INSERT INTO quest_event_log (instance_id, event_type, target_user_id, actor_type, payload)
  SELECT qs.quest_id, 'prompt_answered', auth.uid(), 'user', jsonb_build_object('squad_id', p_squad_id)
  FROM quest_squads qs WHERE qs.id = p_squad_id;
  
  -- Check if squad is now ready
  PERFORM check_squad_readiness(p_squad_id);
END;
$$;

-- Also fix check_squad_readiness to include actor_type
CREATE OR REPLACE FUNCTION public.check_squad_readiness(p_squad_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_total_members INTEGER;
  v_ready_members INTEGER;
  v_min_ready_pct INTEGER;
  v_is_ready BOOLEAN;
  v_squad_status squad_status;
BEGIN
  -- Get squad status and min ready percentage
  SELECT qs.status, COALESCE(qi.warm_up_min_ready_pct, 100)
  INTO v_squad_status, v_min_ready_pct
  FROM quest_squads qs
  LEFT JOIN quest_instances qi ON qi.id = qs.quest_id
  WHERE qs.id = p_squad_id;
  
  -- Count total and ready members
  SELECT 
    COUNT(*),
    COUNT(*) FILTER (WHERE readiness_confirmed_at IS NOT NULL AND prompt_response IS NOT NULL)
  INTO v_total_members, v_ready_members
  FROM squad_members
  WHERE squad_id = p_squad_id
  AND status != 'dropped';
  
  -- Check if ready (all required members completed)
  v_is_ready := (v_ready_members::float / NULLIF(v_total_members, 0)::float * 100) >= v_min_ready_pct;
  
  -- Auto-transition to ready_for_review if ready and currently warming up
  IF v_is_ready AND v_squad_status = 'warming_up' THEN
    UPDATE quest_squads SET status = 'ready_for_review' WHERE id = p_squad_id;
    
    -- Log event with actor_type
    INSERT INTO quest_event_log (instance_id, event_type, actor_type, payload)
    SELECT qs.quest_id, 'squad_ready_for_review', 'system', jsonb_build_object('squad_id', p_squad_id, 'ready_count', v_ready_members, 'total', v_total_members)
    FROM quest_squads qs WHERE qs.id = p_squad_id;
  END IF;
  
  RETURN jsonb_build_object(
    'total_members', v_total_members,
    'ready_members', v_ready_members,
    'min_ready_pct', v_min_ready_pct,
    'current_pct', ROUND((v_ready_members::float / NULLIF(v_total_members, 0)::float * 100)::numeric, 1),
    'is_ready', v_is_ready
  );
END;
$$;