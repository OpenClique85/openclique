-- Phase 5: Create RPC functions for unified quest system

-- 1. Create instance from quest (replaces create_instance_from_template)
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
  
  -- Log the event
  INSERT INTO quest_event_log (instance_id, event_type, payload)
  VALUES (v_instance_id, 'instance_created', jsonb_build_object(
    'quest_id', p_quest_id,
    'scheduled_date', p_scheduled_date
  ));
  
  RETURN v_instance_id;
END;
$$;

-- 2. Get upcoming instances for a quest (for instance picker)
CREATE OR REPLACE FUNCTION get_upcoming_instances(p_quest_id UUID)
RETURNS TABLE (
  id UUID,
  instance_slug TEXT,
  title TEXT,
  scheduled_date DATE,
  start_time TIME,
  end_time TIME,
  meeting_point_name TEXT,
  meeting_point_address TEXT,
  capacity INTEGER,
  current_signup_count INTEGER,
  status instance_status,
  spots_remaining INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    qi.id,
    qi.instance_slug,
    qi.title,
    qi.scheduled_date,
    qi.start_time,
    qi.end_time,
    qi.meeting_point_name,
    qi.meeting_point_address,
    qi.capacity,
    qi.current_signup_count,
    qi.status,
    (qi.capacity - qi.current_signup_count) as spots_remaining
  FROM quest_instances qi
  WHERE qi.quest_id = p_quest_id
    AND qi.status IN ('draft', 'recruiting', 'locked')
    AND qi.scheduled_date >= CURRENT_DATE
    AND qi.archived_at IS NULL
  ORDER BY qi.scheduled_date ASC, qi.start_time ASC;
END;
$$;

-- 3. Get or create instance for a quest (auto-create for non-repeatable)
CREATE OR REPLACE FUNCTION get_or_create_instance(
  p_quest_id UUID
)
RETURNS TABLE (
  instance_id UUID,
  needs_picker BOOLEAN,
  instances_available INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_quest RECORD;
  v_instance_count INTEGER;
  v_instance_id UUID;
BEGIN
  -- Get quest
  SELECT * INTO v_quest FROM quests WHERE id = p_quest_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Quest not found: %', p_quest_id;
  END IF;
  
  -- Count upcoming instances
  SELECT COUNT(*) INTO v_instance_count
  FROM quest_instances qi
  WHERE qi.quest_id = p_quest_id
    AND qi.status IN ('draft', 'recruiting', 'locked')
    AND qi.scheduled_date >= CURRENT_DATE
    AND qi.archived_at IS NULL;
  
  -- If repeatable and multiple instances exist, need picker
  IF v_quest.is_repeatable AND v_instance_count > 1 THEN
    RETURN QUERY SELECT NULL::UUID, TRUE, v_instance_count;
    RETURN;
  END IF;
  
  -- If exactly one instance exists, return it
  IF v_instance_count = 1 THEN
    SELECT qi.id INTO v_instance_id
    FROM quest_instances qi
    WHERE qi.quest_id = p_quest_id
      AND qi.status IN ('draft', 'recruiting', 'locked')
      AND qi.scheduled_date >= CURRENT_DATE
      AND qi.archived_at IS NULL
    LIMIT 1;
    
    RETURN QUERY SELECT v_instance_id, FALSE, 1;
    RETURN;
  END IF;
  
  -- No instance exists - auto-create one if quest has start_datetime
  IF v_quest.start_datetime IS NOT NULL THEN
    v_instance_id := create_instance_from_quest(
      p_quest_id,
      v_quest.start_datetime::date,
      v_quest.start_datetime::time,
      v_quest.end_datetime::time,
      v_quest.meeting_location_name,
      v_quest.meeting_address
    );
    
    RETURN QUERY SELECT v_instance_id, FALSE, 1;
    RETURN;
  END IF;
  
  -- Quest has no date info, can't auto-create
  RETURN QUERY SELECT NULL::UUID, FALSE, 0;
END;
$$;

-- 4. Auto-archive completed instances (called by scheduled job)
CREATE OR REPLACE FUNCTION auto_archive_instances()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_archived_count INTEGER;
BEGIN
  WITH archived AS (
    UPDATE quest_instances
    SET 
      status = 'archived'::instance_status,
      archived_at = NOW()
    WHERE status = 'completed'
      AND archived_at IS NULL
      AND updated_at < NOW() - INTERVAL '7 days'
    RETURNING id
  )
  SELECT COUNT(*) INTO v_archived_count FROM archived;
  
  RETURN v_archived_count;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION create_instance_from_quest TO authenticated;
GRANT EXECUTE ON FUNCTION get_upcoming_instances TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_or_create_instance TO authenticated;
GRANT EXECUTE ON FUNCTION auto_archive_instances TO service_role;