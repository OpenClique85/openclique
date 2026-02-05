-- =============================================================================
-- Auto-Close Past Quests & Instance Auto-Complete
-- =============================================================================

-- 1. Function to auto-close quests when end_datetime passes
CREATE OR REPLACE FUNCTION public.auto_close_past_quests()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_closed_count INTEGER;
BEGIN
  WITH closed AS (
    UPDATE quests
    SET status = 'closed'
    WHERE status = 'open'
      AND end_datetime IS NOT NULL
      AND end_datetime < NOW()
    RETURNING id
  )
  SELECT COUNT(*) INTO v_closed_count FROM closed;
  
  RETURN v_closed_count;
END;
$$;

-- 2. Function to check if all cliques in an instance are completed
CREATE OR REPLACE FUNCTION public.check_instance_completion()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_instance_id UUID;
  v_total_cliques INTEGER;
  v_completed_cliques INTEGER;
BEGIN
  -- Get the instance ID for this squad
  v_instance_id := NEW.instance_id;
  
  IF v_instance_id IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Count total and completed cliques
  SELECT 
    COUNT(*),
    COUNT(*) FILTER (WHERE status = 'completed')
  INTO v_total_cliques, v_completed_cliques
  FROM quest_squads
  WHERE instance_id = v_instance_id
    AND status NOT IN ('cancelled', 'archived');
  
  -- If all cliques are completed, complete the instance
  IF v_total_cliques > 0 AND v_total_cliques = v_completed_cliques THEN
    UPDATE quest_instances
    SET status = 'completed'
    WHERE id = v_instance_id
      AND status NOT IN ('completed', 'archived', 'cancelled');
  END IF;
  
  RETURN NEW;
END;
$$;

-- 3. Create trigger for auto-completing instance when all cliques are done
DROP TRIGGER IF EXISTS on_squad_status_change ON quest_squads;
CREATE TRIGGER on_squad_status_change
AFTER UPDATE OF status ON quest_squads
FOR EACH ROW
WHEN (NEW.status = 'completed')
EXECUTE FUNCTION check_instance_completion();