-- =============================================================================
-- PILOT MANAGER SYSTEM
-- Tables for tracking pilot programs, notes, and templates
-- =============================================================================

-- Table 1: pilot_programs
CREATE TABLE public.pilot_programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  hypothesis TEXT,
  success_criteria JSONB DEFAULT '[]',
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status TEXT DEFAULT 'planned' CHECK (status IN ('planned', 'active', 'completed', 'cancelled')),
  org_id UUID REFERENCES public.organizations(id),
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Table 2: pilot_notes
CREATE TABLE public.pilot_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pilot_id UUID NOT NULL REFERENCES public.pilot_programs(id) ON DELETE CASCADE,
  note_type TEXT DEFAULT 'observation' CHECK (note_type IN ('observation', 'issue', 'decision', 'milestone', 'risk')),
  content TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  related_quest_id UUID REFERENCES public.quests(id),
  related_user_id UUID,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Table 3: pilot_templates
CREATE TABLE public.pilot_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  default_duration_days INTEGER DEFAULT 28,
  hypothesis_template TEXT,
  success_criteria_template JSONB DEFAULT '[]',
  suggested_metrics TEXT[] DEFAULT '{}',
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.pilot_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pilot_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pilot_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies (Admin-only access)
CREATE POLICY "Admins can manage pilot programs" ON public.pilot_programs FOR ALL USING (public.is_admin());
CREATE POLICY "Admins can manage pilot notes" ON public.pilot_notes FOR ALL USING (public.is_admin());
CREATE POLICY "Admins can manage pilot templates" ON public.pilot_templates FOR ALL USING (public.is_admin());

-- Updated at trigger for pilot_programs
CREATE TRIGGER update_pilot_programs_updated_at
  BEFORE UPDATE ON public.pilot_programs
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- =============================================================================
-- RPC Function: get_pilot_metrics
-- Time-gated metrics calculation for a specific pilot
-- =============================================================================
CREATE OR REPLACE FUNCTION public.get_pilot_metrics(p_pilot_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_pilot RECORD;
  v_start TIMESTAMPTZ;
  v_end TIMESTAMPTZ;
  v_new_users INTEGER;
  v_signups INTEGER;
  v_completed INTEGER;
  v_squads_formed INTEGER;
  v_invites_created INTEGER;
  v_invites_redeemed INTEGER;
  v_repeat_users INTEGER;
  v_cliques INTEGER;
  v_avg_rating NUMERIC;
  v_avg_belonging NUMERIC;
  v_feedback_count INTEGER;
BEGIN
  SELECT * INTO v_pilot FROM pilot_programs WHERE id = p_pilot_id;
  IF v_pilot IS NULL THEN
    RETURN jsonb_build_object('error', 'Pilot not found');
  END IF;

  v_start := v_pilot.start_date::timestamptz;
  v_end := (v_pilot.end_date + 1)::timestamptz;

  -- Engagement metrics
  SELECT COUNT(*) INTO v_new_users FROM profiles 
  WHERE created_at >= v_start AND created_at < v_end;

  SELECT COUNT(*) INTO v_signups FROM quest_signups 
  WHERE signed_up_at >= v_start AND signed_up_at < v_end;

  SELECT COUNT(*) INTO v_completed FROM quest_signups 
  WHERE status = 'completed' AND updated_at >= v_start AND updated_at < v_end;

  SELECT COUNT(*) INTO v_squads_formed FROM quest_squads 
  WHERE created_at >= v_start AND created_at < v_end;

  -- Growth metrics
  SELECT COUNT(*) INTO v_invites_created FROM friend_invites 
  WHERE created_at >= v_start AND created_at < v_end;

  SELECT COUNT(*) INTO v_invites_redeemed FROM friend_invites 
  WHERE redeemed_at >= v_start AND redeemed_at < v_end;

  -- Retention metrics (count users with 2+ signups)
  SELECT COUNT(*) INTO v_repeat_users FROM (
    SELECT user_id FROM quest_signups 
    WHERE signed_up_at >= v_start AND signed_up_at < v_end
    GROUP BY user_id HAVING COUNT(*) >= 2
  ) sub;

  SELECT COUNT(*) INTO v_cliques FROM squads 
  WHERE created_at >= v_start AND created_at < v_end;

  -- Satisfaction metrics
  SELECT AVG(rating_1_5), AVG(belonging_delta), COUNT(*)
  INTO v_avg_rating, v_avg_belonging, v_feedback_count
  FROM feedback 
  WHERE submitted_at >= v_start AND submitted_at < v_end;

  RETURN jsonb_build_object(
    'pilot', jsonb_build_object(
      'id', v_pilot.id,
      'name', v_pilot.name,
      'start_date', v_pilot.start_date,
      'end_date', v_pilot.end_date,
      'status', v_pilot.status,
      'hypothesis', v_pilot.hypothesis,
      'success_criteria', v_pilot.success_criteria
    ),
    'engagement', jsonb_build_object(
      'new_users', COALESCE(v_new_users, 0),
      'quest_signups', COALESCE(v_signups, 0),
      'quests_completed', COALESCE(v_completed, 0),
      'squads_formed', COALESCE(v_squads_formed, 0),
      'completion_rate', CASE WHEN v_signups > 0 
        THEN ROUND((v_completed::numeric / v_signups) * 100, 1) ELSE 0 END
    ),
    'growth', jsonb_build_object(
      'friend_invites_created', COALESCE(v_invites_created, 0),
      'friend_invites_redeemed', COALESCE(v_invites_redeemed, 0),
      'referral_rate', CASE WHEN v_invites_created > 0 
        THEN ROUND((v_invites_redeemed::numeric / v_invites_created) * 100, 1) ELSE 0 END,
      'k_factor', CASE WHEN v_new_users > 0 
        THEN ROUND(v_invites_redeemed::numeric / v_new_users, 2) ELSE 0 END
    ),
    'retention', jsonb_build_object(
      'repeat_users', COALESCE(v_repeat_users, 0),
      'cliques_formed', COALESCE(v_cliques, 0),
      'repeat_rate', CASE WHEN v_new_users > 0 
        THEN ROUND((v_repeat_users::numeric / v_new_users) * 100, 1) ELSE 0 END
    ),
    'satisfaction', jsonb_build_object(
      'avg_rating', ROUND(COALESCE(v_avg_rating, 0), 2),
      'avg_belonging_delta', ROUND(COALESCE(v_avg_belonging, 0), 2),
      'feedback_count', COALESCE(v_feedback_count, 0)
    ),
    'generated_at', now()
  );
END;
$$;

-- =============================================================================
-- Seed Pilot 1: Prove Retention & Growth
-- =============================================================================
INSERT INTO pilot_programs (name, slug, description, hypothesis, success_criteria, start_date, end_date, status)
VALUES (
  'Pilot 1: Prove Retention & Growth',
  'pilot-1-retention-growth',
  'First structured pilot to validate core product assumptions with UT Austin student organizations. Track retention, referral, and satisfaction metrics.',
  'If we provide structured, low-pressure quest experiences with small group formation, users will return for multiple quests and recruit their friends.',
  '[
    {"metric": "Week 1 Retention", "target": "30%", "description": "Users who sign up for 2nd quest within 7 days"},
    {"metric": "Friend Referral Rate", "target": "20%", "description": "Users who invite at least one friend"},
    {"metric": "Repeat Quest Rate", "target": "40%", "description": "Users who complete 2+ quests"},
    {"metric": "Average Rating", "target": "4.0+", "description": "Quest satisfaction rating"}
  ]'::jsonb,
  '2025-02-01',
  '2025-02-28',
  'planned'
);

-- Seed a default pilot template
INSERT INTO pilot_templates (name, description, default_duration_days, hypothesis_template, success_criteria_template, suggested_metrics)
VALUES (
  'Standard 4-Week Pilot',
  'Standard template for a 4-week pilot program focused on retention and growth metrics.',
  28,
  'If we provide [intervention], users will [expected behavior].',
  '[
    {"metric": "Week 1 Retention", "target": "", "description": "Users who return within 7 days"},
    {"metric": "Completion Rate", "target": "", "description": "% of signups that complete"},
    {"metric": "Average Rating", "target": "", "description": "Quest satisfaction rating"}
  ]'::jsonb,
  ARRAY['retention', 'growth', 'satisfaction', 'engagement']
);