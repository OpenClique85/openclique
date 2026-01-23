-- =============================================
-- GAMIFICATION SYSTEM V1 - Phase 1 Migration
-- =============================================

-- 1. Level Thresholds - Admin-configurable level boundaries
CREATE TABLE public.level_thresholds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  level INTEGER NOT NULL UNIQUE,
  min_xp INTEGER NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Seed default level thresholds
INSERT INTO public.level_thresholds (level, min_xp, name) VALUES
  (1, 0, 'Explorer'),
  (2, 100, 'Explorer'),
  (3, 250, 'Explorer'),
  (4, 500, 'Regular'),
  (5, 800, 'Regular'),
  (6, 1200, 'Regular'),
  (7, 1800, 'Local'),
  (8, 2500, 'Local'),
  (9, 3500, 'Local'),
  (10, 5000, 'Connector'),
  (11, 7000, 'Connector'),
  (12, 10000, 'Legend');

ALTER TABLE public.level_thresholds ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Level thresholds are publicly readable"
ON public.level_thresholds FOR SELECT USING (true);

CREATE POLICY "Only admins can manage level thresholds"
ON public.level_thresholds FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- 2. User Tree XP - Track XP per progression tree
CREATE TABLE public.user_tree_xp (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tree_id TEXT NOT NULL,
  tree_xp INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, tree_id)
);

ALTER TABLE public.user_tree_xp ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own tree XP"
ON public.user_tree_xp FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "System can manage tree XP"
ON public.user_tree_xp FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- 3. Badge Templates - Visual identity markers
CREATE TABLE public.badge_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  image_url TEXT,
  rarity TEXT DEFAULT 'common' CHECK (rarity IN ('common', 'rare', 'legendary')),
  category TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.badge_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Badge templates are publicly readable"
ON public.badge_templates FOR SELECT USING (true);

CREATE POLICY "Only admins can manage badge templates"
ON public.badge_templates FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- 4. Achievement Templates - Admin-defined achievement rules
CREATE TABLE public.achievement_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  category TEXT,
  criteria JSONB NOT NULL,
  xp_reward INTEGER DEFAULT 0,
  badge_id UUID REFERENCES public.badge_templates(id),
  is_hidden BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.achievement_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Active achievement templates are publicly readable"
ON public.achievement_templates FOR SELECT 
USING (is_active = true OR public.is_admin());

CREATE POLICY "Only admins can manage achievement templates"
ON public.achievement_templates FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- 5. User Achievements - Track unlocked achievements
CREATE TABLE public.user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES public.achievement_templates(id) ON DELETE CASCADE,
  progress JSONB,
  unlocked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, achievement_id)
);

ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own achievements"
ON public.user_achievements FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "System can manage user achievements"
ON public.user_achievements FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- 6. User Badges - Awarded badges
CREATE TABLE public.user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES public.badge_templates(id) ON DELETE CASCADE,
  awarded_at TIMESTAMPTZ DEFAULT now(),
  is_featured BOOLEAN DEFAULT false,
  UNIQUE(user_id, badge_id)
);

ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own badges"
ON public.user_badges FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their featured badges"
ON public.user_badges FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "System can award badges"
ON public.user_badges FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());

-- 7. Streak Rules - Admin-configurable streak definitions
CREATE TABLE public.streak_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  interval TEXT NOT NULL CHECK (interval IN ('weekly', 'monthly')),
  grace_periods INTEGER DEFAULT 1,
  xp_bonus INTEGER DEFAULT 25,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Seed default streak rules
INSERT INTO public.streak_rules (name, interval, grace_periods, xp_bonus) VALUES
  ('Weekly Adventurer', 'weekly', 1, 25),
  ('Monthly Explorer', 'monthly', 1, 50);

ALTER TABLE public.streak_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Streak rules are publicly readable"
ON public.streak_rules FOR SELECT USING (true);

CREATE POLICY "Only admins can manage streak rules"
ON public.streak_rules FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- 8. User Streaks - Track active streaks
CREATE TABLE public.user_streaks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  streak_rule_id UUID NOT NULL REFERENCES public.streak_rules(id) ON DELETE CASCADE,
  current_count INTEGER DEFAULT 0,
  longest_count INTEGER DEFAULT 0,
  last_activity_at TIMESTAMPTZ,
  streak_broken_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, streak_rule_id)
);

ALTER TABLE public.user_streaks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own streaks"
ON public.user_streaks FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "System can manage user streaks"
ON public.user_streaks FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- 9. Add gamification fields to quests table
ALTER TABLE public.quests ADD COLUMN IF NOT EXISTS base_xp INTEGER DEFAULT 50;
ALTER TABLE public.quests ADD COLUMN IF NOT EXISTS min_level INTEGER DEFAULT 0;
ALTER TABLE public.quests ADD COLUMN IF NOT EXISTS min_tree_xp INTEGER DEFAULT 0;
ALTER TABLE public.quests ADD COLUMN IF NOT EXISTS required_achievement_id UUID REFERENCES public.achievement_templates(id);

-- 10. Function to award tree XP
CREATE OR REPLACE FUNCTION public.award_tree_xp(
  p_user_id UUID,
  p_tree_id TEXT,
  p_amount INTEGER
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_total INTEGER;
BEGIN
  INSERT INTO user_tree_xp (user_id, tree_id, tree_xp, updated_at)
  VALUES (p_user_id, p_tree_id, p_amount, now())
  ON CONFLICT (user_id, tree_id)
  DO UPDATE SET
    tree_xp = user_tree_xp.tree_xp + p_amount,
    updated_at = now()
  RETURNING tree_xp INTO new_total;
  
  RETURN new_total;
END;
$$;

-- 11. Function to award quest completion XP (both global and tree)
CREATE OR REPLACE FUNCTION public.award_quest_xp(
  p_user_id UUID,
  p_quest_id UUID
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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
  
  RETURN v_new_total;
END;
$$;

-- 12. Function to get user level from XP
CREATE OR REPLACE FUNCTION public.get_user_level(p_user_id UUID)
RETURNS TABLE(level INTEGER, name TEXT, current_xp INTEGER, next_level_xp INTEGER)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total_xp INTEGER;
BEGIN
  SELECT COALESCE(total_xp, 0) INTO v_total_xp
  FROM user_xp WHERE user_id = p_user_id;
  
  IF v_total_xp IS NULL THEN
    v_total_xp := 0;
  END IF;
  
  RETURN QUERY
  WITH current_level AS (
    SELECT lt.level, lt.name, lt.min_xp
    FROM level_thresholds lt
    WHERE lt.min_xp <= v_total_xp
    ORDER BY lt.level DESC
    LIMIT 1
  ),
  next_level AS (
    SELECT lt.min_xp
    FROM level_thresholds lt
    WHERE lt.min_xp > v_total_xp
    ORDER BY lt.level ASC
    LIMIT 1
  )
  SELECT 
    COALESCE(cl.level, 1),
    COALESCE(cl.name, 'Explorer'),
    v_total_xp,
    COALESCE(nl.min_xp, 10000)
  FROM current_level cl
  FULL OUTER JOIN next_level nl ON true;
END;
$$;