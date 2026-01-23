-- Add warm_up event types to quest_event_type enum if not exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'warm_up_started' AND enumtypid = 'quest_event_type'::regtype) THEN
    ALTER TYPE quest_event_type ADD VALUE 'warm_up_started';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'prompt_answered' AND enumtypid = 'quest_event_type'::regtype) THEN
    ALTER TYPE quest_event_type ADD VALUE 'prompt_answered';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'readiness_confirmed' AND enumtypid = 'quest_event_type'::regtype) THEN
    ALTER TYPE quest_event_type ADD VALUE 'readiness_confirmed';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'squad_ready_for_review' AND enumtypid = 'quest_event_type'::regtype) THEN
    ALTER TYPE quest_event_type ADD VALUE 'squad_ready_for_review';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'squad_approved' AND enumtypid = 'quest_event_type'::regtype) THEN
    ALTER TYPE quest_event_type ADD VALUE 'squad_approved';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'squad_force_approved' AND enumtypid = 'quest_event_type'::regtype) THEN
    ALTER TYPE quest_event_type ADD VALUE 'squad_force_approved';
  END IF;
END$$;

-- Function to check and update squad readiness
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
    
    -- Log event
    INSERT INTO quest_event_log (instance_id, event_type, payload)
    SELECT qs.quest_id, 'squad_ready_for_review', jsonb_build_object('squad_id', p_squad_id, 'ready_count', v_ready_members, 'total', v_total_members)
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

-- Function to submit prompt response
CREATE OR REPLACE FUNCTION public.submit_warm_up_prompt(p_squad_id uuid, p_response text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE squad_members
  SET 
    prompt_response = p_response,
    warm_up_progress = warm_up_progress || jsonb_build_object('prompt_answered_at', now())
  WHERE squad_id = p_squad_id AND user_id = auth.uid();
  
  -- Log event
  INSERT INTO quest_event_log (instance_id, event_type, target_user_id, payload)
  SELECT qs.quest_id, 'prompt_answered', auth.uid(), jsonb_build_object('squad_id', p_squad_id)
  FROM quest_squads qs WHERE qs.id = p_squad_id;
  
  -- Check if squad is now ready
  PERFORM check_squad_readiness(p_squad_id);
END;
$$;

-- Function to confirm readiness
CREATE OR REPLACE FUNCTION public.confirm_warm_up_readiness(p_squad_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE squad_members
  SET 
    readiness_confirmed_at = now(),
    warm_up_completed_at = CASE WHEN prompt_response IS NOT NULL THEN now() ELSE NULL END,
    warm_up_progress = warm_up_progress || jsonb_build_object('readiness_confirmed_at', now())
  WHERE squad_id = p_squad_id AND user_id = auth.uid();
  
  -- Log event
  INSERT INTO quest_event_log (instance_id, event_type, target_user_id, payload)
  SELECT qs.quest_id, 'readiness_confirmed', auth.uid(), jsonb_build_object('squad_id', p_squad_id)
  FROM quest_squads qs WHERE qs.id = p_squad_id;
  
  -- Check if squad is now ready
  PERFORM check_squad_readiness(p_squad_id);
END;
$$;

-- Function to approve squad (admin only)
CREATE OR REPLACE FUNCTION public.approve_squad(p_squad_id uuid, p_notes text DEFAULT NULL, p_force boolean DEFAULT false)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_event_type quest_event_type;
BEGIN
  -- Check admin permission
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Only admins can approve squads';
  END IF;
  
  -- Update squad
  UPDATE quest_squads
  SET 
    status = 'approved',
    approved_at = now(),
    approved_by = auth.uid(),
    approval_notes = p_notes
  WHERE id = p_squad_id;
  
  -- Determine event type
  v_event_type := CASE WHEN p_force THEN 'squad_force_approved' ELSE 'squad_approved' END;
  
  -- Log event
  INSERT INTO quest_event_log (instance_id, event_type, actor_id, payload)
  SELECT qs.quest_id, v_event_type, auth.uid(), jsonb_build_object('squad_id', p_squad_id, 'notes', p_notes, 'forced', p_force)
  FROM quest_squads qs WHERE qs.id = p_squad_id;
END;
$$;

-- Function to start squad warm-up
CREATE OR REPLACE FUNCTION public.start_squad_warm_up(p_squad_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Update squad status
  UPDATE quest_squads
  SET status = 'warming_up'
  WHERE id = p_squad_id AND status = 'confirmed';
  
  -- Log event
  INSERT INTO quest_event_log (instance_id, event_type, payload)
  SELECT qs.quest_id, 'warm_up_started', jsonb_build_object('squad_id', p_squad_id)
  FROM quest_squads qs WHERE qs.id = p_squad_id;
END;
$$;