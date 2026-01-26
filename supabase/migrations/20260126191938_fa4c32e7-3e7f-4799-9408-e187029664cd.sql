-- =============================================================================
-- FRIEND INVITES: Recruit a Friend Feature
-- =============================================================================

-- 1. Create friend_invites table
CREATE TABLE public.friend_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  referrer_user_id UUID NOT NULL,
  quest_id UUID NOT NULL REFERENCES public.quests(id) ON DELETE CASCADE,
  referred_user_id UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  redeemed_at TIMESTAMPTZ,
  UNIQUE(referrer_user_id, quest_id)
);

-- Add index for code lookups
CREATE INDEX idx_friend_invites_code ON public.friend_invites(code);
CREATE INDEX idx_friend_invites_referrer ON public.friend_invites(referrer_user_id);

-- Enable RLS
ALTER TABLE public.friend_invites ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own invites"
  ON public.friend_invites FOR SELECT
  USING (auth.uid() = referrer_user_id OR auth.uid() = referred_user_id);

CREATE POLICY "Users can create their own invites"
  ON public.friend_invites FOR INSERT
  WITH CHECK (auth.uid() = referrer_user_id);

CREATE POLICY "Admins can view all invites"
  ON public.friend_invites FOR SELECT
  USING (public.is_admin());

-- 2. Generate friend invite code function
CREATE OR REPLACE FUNCTION public.generate_friend_invite_code()
RETURNS TEXT
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result TEXT := 'FRIEND-';
  i INTEGER;
BEGIN
  FOR i IN 1..8 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  RETURN result;
END;
$$;

-- 3. Get or create friend invite function
CREATE OR REPLACE FUNCTION public.get_or_create_friend_invite(p_quest_id UUID)
RETURNS TABLE(code TEXT, created BOOLEAN)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_code TEXT;
  v_existing TEXT;
BEGIN
  -- Check for existing invite
  SELECT fi.code INTO v_existing
  FROM friend_invites fi
  WHERE fi.referrer_user_id = auth.uid()
  AND fi.quest_id = p_quest_id;
  
  IF v_existing IS NOT NULL THEN
    RETURN QUERY SELECT v_existing, false;
    RETURN;
  END IF;
  
  -- Generate new unique code
  LOOP
    v_code := generate_friend_invite_code();
    EXIT WHEN NOT EXISTS (SELECT 1 FROM friend_invites WHERE friend_invites.code = v_code);
  END LOOP;
  
  -- Insert new invite
  INSERT INTO friend_invites (code, referrer_user_id, quest_id)
  VALUES (v_code, auth.uid(), p_quest_id);
  
  RETURN QUERY SELECT v_code, true;
END;
$$;

-- 4. Redeem friend invite function
CREATE OR REPLACE FUNCTION public.redeem_friend_invite(p_code TEXT, p_new_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invite RECORD;
  v_recruit_count INTEGER;
  v_new_achievements JSONB := '[]';
BEGIN
  -- Validate invite code
  SELECT * INTO v_invite FROM friend_invites
  WHERE code = UPPER(TRIM(p_code))
  AND redeemed_at IS NULL;
  
  IF v_invite IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid or already used code');
  END IF;
  
  -- Prevent self-referral
  IF v_invite.referrer_user_id = p_new_user_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Cannot use your own invite code');
  END IF;
  
  -- Mark invite as redeemed
  UPDATE friend_invites SET
    referred_user_id = p_new_user_id,
    redeemed_at = now()
  WHERE id = v_invite.id;
  
  -- Auto-signup new user for the quest
  INSERT INTO quest_signups (user_id, quest_id, status)
  VALUES (p_new_user_id, v_invite.quest_id, 'pending')
  ON CONFLICT (user_id, quest_id) DO NOTHING;
  
  -- Award referrer 50 XP
  PERFORM award_xp(v_invite.referrer_user_id, 50, 'friend_recruit', v_invite.id);
  
  -- Count successful referrals for achievements
  SELECT COUNT(*) INTO v_recruit_count
  FROM friend_invites
  WHERE referrer_user_id = v_invite.referrer_user_id
  AND redeemed_at IS NOT NULL;
  
  -- Check and unlock achievements
  SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json) INTO v_new_achievements
  FROM check_and_unlock_achievements(v_invite.referrer_user_id) t;
  
  -- Link for squad grouping (existing referrals table)
  INSERT INTO referrals (referrer_user_id, quest_id, referral_code, referred_user_id, signed_up_at)
  VALUES (v_invite.referrer_user_id, v_invite.quest_id, p_code, p_new_user_id, now())
  ON CONFLICT (referral_code) DO UPDATE SET
    referred_user_id = p_new_user_id,
    signed_up_at = now();
  
  RETURN jsonb_build_object(
    'success', true,
    'quest_id', v_invite.quest_id,
    'referrer_id', v_invite.referrer_user_id,
    'recruit_count', v_recruit_count,
    'achievements', v_new_achievements
  );
END;
$$;

-- 5. Update check_and_unlock_achievements to include friend_recruit_count criteria
CREATE OR REPLACE FUNCTION public.check_and_unlock_achievements(p_user_id uuid)
RETURNS TABLE(achievement_id uuid, achievement_name text, xp_reward integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_quest_count INTEGER;
  v_total_xp INTEGER;
  v_feedback_count INTEGER;
  v_culture_xp INTEGER;
  v_wellness_xp INTEGER;
  v_connector_xp INTEGER;
  v_recruit_count INTEGER;
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
  
  -- Count friend recruits
  SELECT COUNT(*) INTO v_recruit_count
  FROM friend_invites WHERE referrer_user_id = p_user_id AND redeemed_at IS NOT NULL;
  
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
      
    ELSIF v_criteria->>'type' = 'friend_recruit_count' THEN
      v_qualified := v_recruit_count >= (v_criteria->>'count')::integer;
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

-- 6. Insert achievement templates for friend recruiting
INSERT INTO achievement_templates (name, description, criteria, xp_reward, icon, category, is_active, sort_order)
VALUES 
  ('Friend Recruiter', 'Recruited your first friend to join a quest', '{"type": "friend_recruit_count", "count": 1}'::jsonb, 25, '🤝', 'social', true, 100),
  ('Social Connector', 'Recruited 5 friends to join quests', '{"type": "friend_recruit_count", "count": 5}'::jsonb, 75, '🌟', 'social', true, 101),
  ('Community Builder', 'Recruited 10 friends to join quests', '{"type": "friend_recruit_count", "count": 10}'::jsonb, 150, '🏆', 'social', true, 102);

-- 7. Insert badge template for first friend recruit
INSERT INTO badge_templates (name, description, icon, category, rarity, is_active)
VALUES ('Friend Bringer', 'Recruited your first friend to OpenClique', '👋', 'social', 'common', true);