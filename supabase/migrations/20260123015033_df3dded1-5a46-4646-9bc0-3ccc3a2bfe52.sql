-- =============================================================================
-- STREAK TRACKING SYSTEM
-- =============================================================================
-- Updates user streaks when a quest is completed. Called after XP is awarded.
-- Handles weekly and monthly streak intervals with grace period logic.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.update_user_streaks(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_rule RECORD;
  v_last_activity TIMESTAMPTZ;
  v_now TIMESTAMPTZ := now();
  v_interval_start TIMESTAMPTZ;
  v_should_increment BOOLEAN;
  v_streak_broken BOOLEAN;
BEGIN
  -- Process each active streak rule
  FOR v_rule IN
    SELECT * FROM streak_rules WHERE is_active = true
  LOOP
    -- Get or create user streak record
    INSERT INTO user_streaks (user_id, streak_rule_id, current_count, longest_count)
    VALUES (p_user_id, v_rule.id, 0, 0)
    ON CONFLICT (user_id, streak_rule_id) DO NOTHING;
    
    -- Get current streak data
    SELECT last_activity_at INTO v_last_activity
    FROM user_streaks
    WHERE user_id = p_user_id AND streak_rule_id = v_rule.id;
    
    -- Calculate interval start based on rule type
    IF v_rule.interval = 'weekly' THEN
      v_interval_start := date_trunc('week', v_now);
    ELSE -- monthly
      v_interval_start := date_trunc('month', v_now);
    END IF;
    
    -- Determine if we should increment the streak
    v_should_increment := false;
    v_streak_broken := false;
    
    IF v_last_activity IS NULL THEN
      -- First activity ever - start streak at 1
      v_should_increment := true;
    ELSIF v_last_activity >= v_interval_start THEN
      -- Already completed in this interval - no change
      v_should_increment := false;
    ELSE
      -- Check if streak is still valid (within grace period)
      IF v_rule.interval = 'weekly' THEN
        -- Streak valid if last activity was in previous week (allowing grace periods)
        IF v_last_activity >= (v_interval_start - (v_rule.grace_periods + 1) * INTERVAL '1 week') THEN
          v_should_increment := true;
        ELSE
          v_streak_broken := true;
        END IF;
      ELSE -- monthly
        IF v_last_activity >= (v_interval_start - (v_rule.grace_periods + 1) * INTERVAL '1 month') THEN
          v_should_increment := true;
        ELSE
          v_streak_broken := true;
        END IF;
      END IF;
    END IF;
    
    -- Update the streak
    IF v_streak_broken THEN
      -- Reset streak to 1 (this activity counts as new start)
      UPDATE user_streaks
      SET 
        current_count = 1,
        last_activity_at = v_now,
        streak_broken_at = v_now
      WHERE user_id = p_user_id AND streak_rule_id = v_rule.id;
    ELSIF v_should_increment THEN
      -- Increment streak
      UPDATE user_streaks
      SET 
        current_count = current_count + 1,
        longest_count = GREATEST(longest_count, current_count + 1),
        last_activity_at = v_now,
        streak_broken_at = NULL
      WHERE user_id = p_user_id AND streak_rule_id = v_rule.id;
    END IF;
  END LOOP;
END;
$$;

-- =============================================================================
-- CHECK STREAK BONUS - Awards XP bonus for maintaining streaks
-- =============================================================================

CREATE OR REPLACE FUNCTION public.check_streak_bonus(p_user_id uuid)
RETURNS TABLE(streak_name text, bonus_xp integer, current_count integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_streak RECORD;
  v_milestone INTEGER;
BEGIN
  FOR v_streak IN
    SELECT us.*, sr.name, sr.xp_bonus
    FROM user_streaks us
    JOIN streak_rules sr ON us.streak_rule_id = sr.id
    WHERE us.user_id = p_user_id
    AND sr.is_active = true
  LOOP
    -- Award bonus at milestones: 4, 8, 12, etc. (every 4 weeks/months)
    v_milestone := (v_streak.current_count / 4) * 4;
    
    -- Check if we just hit a new milestone
    IF v_streak.current_count > 0 AND v_streak.current_count = v_milestone AND v_streak.current_count > 0 THEN
      -- Award the streak bonus
      PERFORM public.award_xp(p_user_id, v_streak.xp_bonus, 'streak_bonus', v_streak.streak_rule_id);
      
      streak_name := v_streak.name;
      bonus_xp := v_streak.xp_bonus;
      current_count := v_streak.current_count;
      RETURN NEXT;
    END IF;
  END LOOP;
  
  RETURN;
END;
$$;

-- =============================================================================
-- UPDATE AWARD_QUEST_XP TO INCLUDE STREAK TRACKING
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
  
  -- Update streaks
  PERFORM public.update_user_streaks(p_user_id);
  
  -- Check for streak bonuses
  PERFORM public.check_streak_bonus(p_user_id);
  
  -- Auto-check and unlock any new achievements
  PERFORM public.check_and_unlock_achievements(p_user_id);
  
  RETURN v_new_total;
END;
$$;

-- =============================================================================
-- SEED DEFAULT STREAK RULES
-- =============================================================================

INSERT INTO streak_rules (id, name, interval, grace_periods, xp_bonus, is_active)
VALUES 
  (gen_random_uuid(), 'Weekly Warrior', 'weekly', 1, 25, true),
  (gen_random_uuid(), 'Monthly Explorer', 'monthly', 0, 50, true)
ON CONFLICT DO NOTHING;

-- =============================================================================
-- GRANT PERMISSIONS
-- =============================================================================

GRANT EXECUTE ON FUNCTION public.update_user_streaks(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_user_streaks(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.check_streak_bonus(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_streak_bonus(uuid) TO service_role;