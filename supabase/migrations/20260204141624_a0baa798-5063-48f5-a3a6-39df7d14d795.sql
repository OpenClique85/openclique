-- Create atomic function to start a quest and link all signups
CREATE OR REPLACE FUNCTION start_quest_and_link_signups(
  p_quest_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_quest RECORD;
  v_instance_id UUID;
BEGIN
  -- Get quest with datetime
  SELECT * INTO v_quest FROM quests WHERE id = p_quest_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Quest not found';
  END IF;
  
  IF v_quest.start_datetime IS NULL THEN
    RAISE EXCEPTION 'Quest has no start date/time set';
  END IF;
  
  -- Create instance using existing function
  v_instance_id := create_instance_from_quest(
    p_quest_id,
    v_quest.start_datetime::date,
    v_quest.start_datetime::time,
    v_quest.end_datetime::time,
    v_quest.meeting_location_name,
    v_quest.meeting_address
  );
  
  -- Set to recruiting immediately (not draft)
  UPDATE quest_instances 
  SET status = 'recruiting' 
  WHERE id = v_instance_id;
  
  -- Link all existing signups to this instance
  UPDATE quest_signups
  SET instance_id = v_instance_id
  WHERE quest_id = p_quest_id
    AND instance_id IS NULL;
  
  -- Update signup count on instance
  UPDATE quest_instances
  SET current_signup_count = (
    SELECT COUNT(*) FROM quest_signups 
    WHERE instance_id = v_instance_id 
    AND status IN ('pending', 'confirmed', 'standby')
  )
  WHERE id = v_instance_id;
  
  RETURN v_instance_id;
END;
$$;