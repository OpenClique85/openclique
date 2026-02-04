-- Fix create_instance_from_quest to include actor_type in quest_event_log insert
CREATE OR REPLACE FUNCTION create_instance_from_quest(
  p_quest_id UUID,
  p_scheduled_date DATE,
  p_start_time TIME,
  p_end_time TIME DEFAULT NULL,
  p_meeting_point_name TEXT DEFAULT NULL,
  p_meeting_point_address TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_quest RECORD;
  v_instance_id UUID;
  v_instance_slug TEXT;
BEGIN
  -- Get quest data
  SELECT * INTO v_quest FROM quests WHERE id = p_quest_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Quest not found: %', p_quest_id;
  END IF;
  
  -- Generate unique instance slug
  v_instance_slug := v_quest.slug || '-' || to_char(p_scheduled_date, 'YYYYMMDD');
  
  -- Create instance
  INSERT INTO quest_instances (
    quest_id,
    instance_slug,
    title,
    icon,
    description,
    scheduled_date,
    start_time,
    end_time,
    meeting_point_name,
    meeting_point_address,
    capacity,
    target_squad_size,
    what_to_bring,
    progression_tree,
    xp_rules,
    required_proof_types,
    status,
    quest_card_token
  ) VALUES (
    p_quest_id,
    v_instance_slug,
    v_quest.title,
    v_quest.icon,
    v_quest.short_description,
    p_scheduled_date,
    p_start_time,
    COALESCE(p_end_time, p_start_time + (v_quest.default_duration_minutes || ' minutes')::interval),
    COALESCE(p_meeting_point_name, v_quest.meeting_location_name),
    COALESCE(p_meeting_point_address, v_quest.meeting_address),
    COALESCE(v_quest.default_capacity, v_quest.capacity_total, 24),
    COALESCE(v_quest.default_squad_size, 6),
    v_quest.what_to_bring,
    v_quest.progression_tree,
    v_quest.xp_rules,
    v_quest.required_proof_types,
    'draft'::instance_status,
    gen_random_uuid()::text
  )
  RETURNING id INTO v_instance_id;
  
  -- Log the event with actor_type set to 'system' for automated operations
  INSERT INTO quest_event_log (instance_id, event_type, actor_type, payload)
  VALUES (v_instance_id, 'instance_created', 'system', jsonb_build_object(
    'quest_id', p_quest_id,
    'scheduled_date', p_scheduled_date
  ));
  
  RETURN v_instance_id;
END;
$$;