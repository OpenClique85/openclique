-- =============================================================================
-- ACHIEVEMENT AUTO-UNLOCK SYSTEM
-- =============================================================================
-- This function checks all achievement criteria for a user and grants any
-- newly qualified achievements. Called automatically after XP is awarded.
-- 
-- Criteria Types Supported:
--   - quest_count: Total quests completed
--   - tree_xp: XP in a specific progression tree (culture/wellness/connector)
--   - total_xp: Overall XP threshold
--   - feedback_count: Number of feedback submissions
--   - streak_days: Consecutive activity days
-- =============================================================================

CREATE OR REPLACE FUNCTION public.check_and_unlock_achievements(p_user_id uuid)
RETURNS TABLE(achievement_id uuid, achievement_name text, xp_reward integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_quest_count INTEGER;
  v_total_xp INTEGER;
  v_feedback_count INTEGER;
  v_culture_xp INTEGER;
  v_wellness_xp INTEGER;
  v_connector_xp INTEGER;
  v_achievement RECORD;
  v_criteria JSONB;
  v_qualified BOOLEAN;
BEGIN
  -- Gather user stats
  SELECT COUNT(*) INTO v_quest_count
  FROM quest_signups WHERE user_id = p_user_id AND status = 'completed';
  
  SELECT COALESCE(total_xp, 0) INTO v_total_xp
  FROM user_xp WHERE user_id = p_user_id;
  
  SELECT COUNT(*) INTO v_feedback_count
  FROM feedback WHERE user_id = p_user_id;
  
  SELECT COALESCE(tree_xp, 0) INTO v_culture_xp
  FROM user_tree_xp WHERE user_id = p_user_id AND tree_id = 'culture';
  
  SELECT COALESCE(tree_xp, 0) INTO v_wellness_xp
  FROM user_tree_xp WHERE user_id = p_user_id AND tree_id = 'wellness';
  
  SELECT COALESCE(tree_xp, 0) INTO v_connector_xp
  FROM user_tree_xp WHERE user_id = p_user_id AND tree_id = 'connector';
  
  -- Check each unlockable achievement
  FOR v_achievement IN
    SELECT at.id, at.name, at.criteria, at.xp_reward
    FROM achievement_templates at
    WHERE at.is_active = true
    AND NOT EXISTS (
      SELECT 1 FROM user_achievements ua 
      WHERE ua.user_id = p_user_id AND ua.achievement_id = at.id
    )
  LOOP
    v_criteria := v_achievement.criteria;
    v_qualified := false;
    
    -- Check criteria type and evaluate
    IF v_criteria->>'type' = 'quest_count' THEN
      v_qualified := v_quest_count >= (v_criteria->>'count')::integer;
      
    ELSIF v_criteria->>'type' = 'total_xp' THEN
      v_qualified := v_total_xp >= (v_criteria->>'amount')::integer;
      
    ELSIF v_criteria->>'type' = 'tree_xp' THEN
      CASE v_criteria->>'tree'
        WHEN 'culture' THEN v_qualified := v_culture_xp >= (v_criteria->>'amount')::integer;
        WHEN 'wellness' THEN v_qualified := v_wellness_xp >= (v_criteria->>'amount')::integer;
        WHEN 'connector' THEN v_qualified := v_connector_xp >= (v_criteria->>'amount')::integer;
        ELSE v_qualified := false;
      END CASE;
      
    ELSIF v_criteria->>'type' = 'feedback_count' THEN
      v_qualified := v_feedback_count >= (v_criteria->>'count')::integer;
    END IF;
    
    -- Grant achievement if qualified
    IF v_qualified THEN
      INSERT INTO user_achievements (user_id, achievement_id)
      VALUES (p_user_id, v_achievement.id);
      
      -- Award XP reward if any
      IF v_achievement.xp_reward > 0 THEN
        PERFORM public.award_xp(p_user_id, v_achievement.xp_reward, 'achievement', v_achievement.id);
      END IF;
      
      achievement_id := v_achievement.id;
      achievement_name := v_achievement.name;
      xp_reward := v_achievement.xp_reward;
      RETURN NEXT;
    END IF;
  END LOOP;
  
  RETURN;
END;
$$;

-- =============================================================================
-- UPDATE AWARD_QUEST_XP TO AUTO-CHECK ACHIEVEMENTS
-- =============================================================================
-- Modified to call check_and_unlock_achievements after awarding XP
-- =============================================================================

CREATE OR REPLACE FUNCTION public.award_quest_xp(p_user_id uuid, p_quest_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_base_xp INTEGER;
  v_tree_id TEXT;
  v_new_total INTEGER;
BEGIN
  -- Get quest XP and tree
  SELECT base_xp, progression_tree INTO v_base_xp, v_tree_id
  FROM quests WHERE id = p_quest_id;
  
  IF v_base_xp IS NULL THEN
    v_base_xp := 50;
  END IF;
  
  -- Award global XP
  v_new_total := public.award_xp(p_user_id, v_base_xp, 'quest_complete', p_quest_id);
  
  -- Award tree XP if tree is set
  IF v_tree_id IS NOT NULL AND v_tree_id != '' THEN
    PERFORM public.award_tree_xp(p_user_id, v_tree_id, v_base_xp);
  END IF;
  
  -- Auto-check and unlock any new achievements
  PERFORM public.check_and_unlock_achievements(p_user_id);
  
  RETURN v_new_total;
END;
$$;

-- =============================================================================
-- GRANT EXECUTE PERMISSIONS
-- =============================================================================

GRANT EXECUTE ON FUNCTION public.check_and_unlock_achievements(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_and_unlock_achievements(uuid) TO service_role;