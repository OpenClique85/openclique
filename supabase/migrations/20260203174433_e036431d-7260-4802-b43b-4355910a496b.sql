-- ============================================================================
-- MONTHLY META QUESTS SYSTEM
-- ============================================================================

-- Pool of meta quest templates (20 available each month)
CREATE TABLE monthly_meta_quest_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT DEFAULT '🎯',
  
  -- Progress tracking
  criteria_type TEXT NOT NULL, -- quest_count, squad_join, category_new, coins_earned, contact_quest, weekend_quest, follow_creator, streak_days, rating_given, friend_invite
  criteria_target INTEGER NOT NULL DEFAULT 1, -- e.g., 5 quests, 500 coins
  criteria_metadata JSONB DEFAULT '{}', -- additional criteria like { "min_rating": 4 }
  
  -- Rewards
  xp_reward INTEGER DEFAULT 50,
  coin_reward INTEGER DEFAULT 25,
  
  -- Rotation control
  is_seasonal BOOLEAN DEFAULT false, -- seasonal quests only appear certain months
  seasonal_months INTEGER[] DEFAULT NULL, -- e.g., {1, 2} for Jan/Feb
  weight INTEGER DEFAULT 1, -- higher weight = more likely to be selected
  
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Monthly meta quest instances (generated each month from templates)
CREATE TABLE monthly_meta_quests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID REFERENCES monthly_meta_quest_templates(id) ON DELETE CASCADE,
  month_year TEXT NOT NULL, -- e.g., '2026-02' for February 2026
  
  -- Copy from template at generation time
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  criteria_type TEXT NOT NULL,
  criteria_target INTEGER NOT NULL,
  criteria_metadata JSONB DEFAULT '{}',
  xp_reward INTEGER,
  coin_reward INTEGER,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(template_id, month_year)
);

-- User's tracked meta quests (max 5 at a time)
CREATE TABLE user_tracked_meta_quests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  meta_quest_id UUID REFERENCES monthly_meta_quests(id) ON DELETE CASCADE,
  
  tracked_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(user_id, meta_quest_id)
);

-- User progress on ALL meta quests (tracked or not)
CREATE TABLE user_meta_quest_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  meta_quest_id UUID REFERENCES monthly_meta_quests(id) ON DELETE CASCADE,
  
  current_progress INTEGER DEFAULT 0,
  completed_at TIMESTAMPTZ,
  reward_claimed_at TIMESTAMPTZ,
  
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(user_id, meta_quest_id)
);

-- Monthly summary (for end-of-month recap)
CREATE TABLE user_monthly_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  month_year TEXT NOT NULL,
  
  tracked_completed INTEGER DEFAULT 0,
  total_completed INTEGER DEFAULT 0,
  xp_earned INTEGER DEFAULT 0,
  coins_earned INTEGER DEFAULT 0,
  special_reward_id UUID, -- badge or other reward
  
  summary_shown_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(user_id, month_year)
);

-- Indexes
CREATE INDEX idx_monthly_meta_quests_month ON monthly_meta_quests(month_year);
CREATE INDEX idx_user_tracked_meta_quests_user ON user_tracked_meta_quests(user_id);
CREATE INDEX idx_user_meta_quest_progress_user ON user_meta_quest_progress(user_id);
CREATE INDEX idx_user_meta_quest_progress_quest ON user_meta_quest_progress(meta_quest_id);
CREATE INDEX idx_user_monthly_summaries_user ON user_monthly_summaries(user_id);

-- RLS Policies
ALTER TABLE monthly_meta_quest_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_meta_quests ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_tracked_meta_quests ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_meta_quest_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_monthly_summaries ENABLE ROW LEVEL SECURITY;

-- Templates are publicly readable
CREATE POLICY "Templates are publicly readable"
  ON monthly_meta_quest_templates FOR SELECT USING (true);

-- Monthly quests are publicly readable
CREATE POLICY "Monthly quests are publicly readable"
  ON monthly_meta_quests FOR SELECT USING (true);

-- Users can manage their tracked quests
CREATE POLICY "Users can view their tracked quests"
  ON user_tracked_meta_quests FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can track quests"
  ON user_tracked_meta_quests FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can untrack quests"
  ON user_tracked_meta_quests FOR DELETE USING (user_id = auth.uid());

-- Users can view their progress
CREATE POLICY "Users can view their progress"
  ON user_meta_quest_progress FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update their progress"
  ON user_meta_quest_progress FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can modify their progress"
  ON user_meta_quest_progress FOR UPDATE USING (user_id = auth.uid());

-- Users can view their summaries
CREATE POLICY "Users can view their summaries"
  ON user_monthly_summaries FOR SELECT USING (user_id = auth.uid());

-- Seed some initial meta quest templates
INSERT INTO monthly_meta_quest_templates (name, description, icon, criteria_type, criteria_target, xp_reward, coin_reward, weight) VALUES
  ('Quest Explorer', 'Complete 5 quests this month', '🗺️', 'quest_count', 5, 100, 50, 3),
  ('Squad Hopper', 'Join 3 different squads', '👥', 'squad_join', 3, 75, 30, 2),
  ('Category Pioneer', 'Try a quest in a new category', '🧭', 'category_new', 1, 50, 25, 2),
  ('Coin Collector', 'Earn 500 Clique Coins', '💰', 'coins_earned', 500, 75, 0, 2),
  ('Social Adventurer', 'Complete a quest with 3+ new contacts', '🤝', 'contact_quest', 1, 100, 50, 1),
  ('Weekend Warrior', 'Attend 2 weekend quests', '🌅', 'weekend_quest', 2, 75, 40, 2),
  ('Fan Builder', 'Follow 5 creators', '⭐', 'follow_creator', 5, 50, 25, 2),
  ('Streak Master', 'Achieve a 7-day quest streak', '🔥', 'streak_days', 7, 150, 75, 1),
  ('Feedback Champion', 'Give 3 quest ratings of 4+ stars', '⭐', 'rating_given', 3, 50, 25, 2),
  ('Friend Recruiter', 'Invite 3 friends via friend code', '📨', 'friend_invite', 3, 100, 50, 1),
  ('Double Dip', 'Complete 2 quests in one day', '⚡', 'same_day_quests', 2, 75, 30, 2),
  ('Early Bird', 'Sign up for a quest within 1 hour of it being posted', '🐦', 'early_signup', 1, 50, 25, 1),
  ('Culture Vulture', 'Complete 3 culture quests', '🎭', 'quest_category', 3, 75, 35, 2),
  ('Wellness Warrior', 'Complete 3 wellness quests', '🧘', 'quest_category', 3, 75, 35, 2),
  ('Connector King', 'Add 5 new contacts', '🔗', 'contacts_added', 5, 75, 40, 2),
  ('LFG Legend', 'Respond to 3 LFG broadcasts', '📣', 'lfg_response', 3, 50, 25, 1),
  ('Completionist Starter', 'Complete 10 quests this month', '🏆', 'quest_count', 10, 200, 100, 1),
  ('Brand Explorer', 'Complete quests from 3 different brands', '🏷️', 'brand_variety', 3, 75, 40, 1),
  ('Night Owl', 'Attend an evening quest (after 6pm)', '🦉', 'evening_quest', 1, 50, 25, 2),
  ('First Timer', 'Be the first to sign up for a newly posted quest', '🥇', 'first_signup', 1, 75, 35, 1);

-- Function to get current month's meta quests
CREATE OR REPLACE FUNCTION get_current_month_year()
RETURNS TEXT AS $$
  SELECT to_char(now(), 'YYYY-MM');
$$ LANGUAGE SQL STABLE;

-- Function to count user's tracked quests
CREATE OR REPLACE FUNCTION count_user_tracked_meta_quests(p_user_id UUID)
RETURNS INTEGER AS $$
  SELECT COUNT(*)::INTEGER 
  FROM user_tracked_meta_quests utmq
  JOIN monthly_meta_quests mmq ON utmq.meta_quest_id = mmq.id
  WHERE utmq.user_id = p_user_id 
    AND mmq.month_year = get_current_month_year();
$$ LANGUAGE SQL STABLE SECURITY DEFINER;