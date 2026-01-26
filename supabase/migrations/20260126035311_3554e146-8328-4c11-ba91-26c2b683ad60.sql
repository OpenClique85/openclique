-- =========================================
-- Phase 2: Eventbrite OAuth Integration Schema
-- =========================================

-- Create eventbrite_connections table for OAuth tokens
CREATE TABLE IF NOT EXISTS public.eventbrite_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  org_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  eventbrite_user_id TEXT,
  eventbrite_email TEXT,
  connected_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_sync_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  UNIQUE(user_id, eventbrite_user_id)
);

-- Create eventbrite_events table for imported events
CREATE TABLE IF NOT EXISTS public.eventbrite_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quest_id UUID REFERENCES public.quests(id) ON DELETE CASCADE,
  eventbrite_event_id TEXT NOT NULL UNIQUE,
  eventbrite_url TEXT NOT NULL,
  organizer_id TEXT,
  organizer_name TEXT,
  venue_id TEXT,
  venue_name TEXT,
  venue_address JSONB,
  ticket_url TEXT,
  ticket_classes JSONB DEFAULT '[]',
  is_free BOOLEAN DEFAULT false,
  currency TEXT DEFAULT 'USD',
  min_ticket_price DECIMAL(10,2),
  max_ticket_price DECIMAL(10,2),
  capacity INTEGER,
  tickets_sold INTEGER DEFAULT 0,
  raw_event_data JSONB,
  last_synced_at TIMESTAMPTZ DEFAULT now(),
  sync_error TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_eventbrite_events_quest_id ON public.eventbrite_events(quest_id);
CREATE INDEX IF NOT EXISTS idx_eventbrite_events_eventbrite_id ON public.eventbrite_events(eventbrite_event_id);
CREATE INDEX IF NOT EXISTS idx_eventbrite_connections_user ON public.eventbrite_connections(user_id);

-- Add eventbrite_event_id to quests table for quick reference
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'quests' AND column_name = 'eventbrite_event_id'
  ) THEN
    ALTER TABLE public.quests ADD COLUMN eventbrite_event_id TEXT;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'quests' AND column_name = 'external_ticket_url'
  ) THEN
    ALTER TABLE public.quests ADD COLUMN external_ticket_url TEXT;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'quests' AND column_name = 'is_ticketed'
  ) THEN
    ALTER TABLE public.quests ADD COLUMN is_ticketed BOOLEAN DEFAULT false;
  END IF;
END $$;

-- Enable RLS
ALTER TABLE public.eventbrite_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.eventbrite_events ENABLE ROW LEVEL SECURITY;

-- RLS policies for eventbrite_connections
CREATE POLICY "Users can view their own Eventbrite connections"
  ON public.eventbrite_connections FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own Eventbrite connections"
  ON public.eventbrite_connections FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own Eventbrite connections"
  ON public.eventbrite_connections FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own Eventbrite connections"
  ON public.eventbrite_connections FOR DELETE
  USING (auth.uid() = user_id);

-- RLS policies for eventbrite_events (linked to quest permissions)
CREATE POLICY "Anyone can view Eventbrite event metadata"
  ON public.eventbrite_events FOR SELECT
  USING (true);

CREATE POLICY "Quest creators can manage Eventbrite events"
  ON public.eventbrite_events FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.quests q 
      WHERE q.id = quest_id AND q.creator_id = auth.uid()
    )
  );

-- Admins can manage all
CREATE POLICY "Admins can manage all Eventbrite connections"
  ON public.eventbrite_connections FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can manage all Eventbrite events"
  ON public.eventbrite_events FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- =========================================
-- Phase 3: LFC (Looking for Clique) System Schema
-- =========================================

-- Add LFC fields to squads if not present (already added in previous migration, but ensure)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'squads' AND column_name = 'lfc_scope'
  ) THEN
    ALTER TABLE public.squads ADD COLUMN lfc_scope TEXT DEFAULT 'event' CHECK (lfc_scope IN ('event', 'club', 'org', 'global'));
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'squads' AND column_name = 'lfc_bio'
  ) THEN
    ALTER TABLE public.squads ADD COLUMN lfc_bio TEXT;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'squads' AND column_name = 'lfc_looking_for'
  ) THEN
    ALTER TABLE public.squads ADD COLUMN lfc_looking_for TEXT[];
  END IF;
END $$;

-- =========================================
-- Phase 4: Moderation & Trust Scoring Schema
-- =========================================

-- Trust scores table for orgs, clubs, and users
CREATE TABLE IF NOT EXISTS public.trust_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL CHECK (entity_type IN ('user', 'org', 'quest')),
  entity_id UUID NOT NULL,
  score DECIMAL(5,2) DEFAULT 50.00 CHECK (score >= 0 AND score <= 100),
  flags_received INTEGER DEFAULT 0,
  warnings_issued INTEGER DEFAULT 0,
  successful_quests INTEGER DEFAULT 0,
  cancelled_quests INTEGER DEFAULT 0,
  avg_rating DECIMAL(3,2),
  last_calculated_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(entity_type, entity_id)
);

-- Moderation flags table
CREATE TABLE IF NOT EXISTS public.moderation_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL,
  target_type TEXT NOT NULL CHECK (target_type IN ('user', 'quest', 'clique', 'message', 'org')),
  target_id UUID NOT NULL,
  reason TEXT NOT NULL CHECK (reason IN ('spam', 'harassment', 'inappropriate', 'safety', 'other')),
  details TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  resolution_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Throttle tracking for spam prevention
CREATE TABLE IF NOT EXISTS public.rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  action_type TEXT NOT NULL CHECK (action_type IN ('quest_create', 'message_send', 'signup', 'flag_submit')),
  window_start TIMESTAMPTZ NOT NULL,
  action_count INTEGER DEFAULT 1,
  UNIQUE(user_id, action_type, window_start)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_trust_scores_entity ON public.trust_scores(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_moderation_flags_status ON public.moderation_flags(status);
CREATE INDEX IF NOT EXISTS idx_moderation_flags_target ON public.moderation_flags(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_rate_limits_user_action ON public.rate_limits(user_id, action_type);

-- Enable RLS
ALTER TABLE public.trust_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.moderation_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- RLS for trust_scores (read-only for most, admin write)
CREATE POLICY "Anyone can view trust scores"
  ON public.trust_scores FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage trust scores"
  ON public.trust_scores FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- RLS for moderation_flags
CREATE POLICY "Users can create flags"
  ON public.moderation_flags FOR INSERT
  WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Users can view their own flags"
  ON public.moderation_flags FOR SELECT
  USING (reporter_id = auth.uid());

CREATE POLICY "Admins can manage all flags"
  ON public.moderation_flags FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- RLS for rate_limits
CREATE POLICY "Users can view their own rate limits"
  ON public.rate_limits FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "System can manage rate limits"
  ON public.rate_limits FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- =========================================
-- Helper Functions
-- =========================================

-- Function to check rate limit
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_user_id UUID,
  p_action_type TEXT,
  p_window_minutes INTEGER DEFAULT 60,
  p_max_actions INTEGER DEFAULT 10
) RETURNS BOOLEAN AS $$
DECLARE
  v_window_start TIMESTAMPTZ;
  v_current_count INTEGER;
BEGIN
  v_window_start := date_trunc('hour', now());
  
  -- Get or create rate limit record
  INSERT INTO public.rate_limits (user_id, action_type, window_start, action_count)
  VALUES (p_user_id, p_action_type, v_window_start, 1)
  ON CONFLICT (user_id, action_type, window_start) 
  DO UPDATE SET action_count = rate_limits.action_count + 1
  RETURNING action_count INTO v_current_count;
  
  RETURN v_current_count <= p_max_actions;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to calculate trust score
CREATE OR REPLACE FUNCTION public.calculate_trust_score(
  p_entity_type TEXT,
  p_entity_id UUID
) RETURNS DECIMAL AS $$
DECLARE
  v_base_score DECIMAL := 50;
  v_flags INTEGER;
  v_warnings INTEGER;
  v_successful INTEGER;
  v_cancelled INTEGER;
  v_avg_rating DECIMAL;
  v_final_score DECIMAL;
BEGIN
  -- Get current metrics
  SELECT flags_received, warnings_issued, successful_quests, cancelled_quests, avg_rating
  INTO v_flags, v_warnings, v_successful, v_cancelled, v_avg_rating
  FROM public.trust_scores
  WHERE entity_type = p_entity_type AND entity_id = p_entity_id;
  
  IF NOT FOUND THEN
    RETURN v_base_score;
  END IF;
  
  -- Calculate score
  v_final_score := v_base_score;
  v_final_score := v_final_score - (COALESCE(v_flags, 0) * 5);
  v_final_score := v_final_score - (COALESCE(v_warnings, 0) * 10);
  v_final_score := v_final_score + (COALESCE(v_successful, 0) * 2);
  v_final_score := v_final_score - (COALESCE(v_cancelled, 0) * 3);
  
  IF v_avg_rating IS NOT NULL THEN
    v_final_score := v_final_score + ((v_avg_rating - 3) * 10);
  END IF;
  
  -- Clamp to 0-100
  v_final_score := GREATEST(0, LEAST(100, v_final_score));
  
  -- Update stored score
  UPDATE public.trust_scores
  SET score = v_final_score, last_calculated_at = now()
  WHERE entity_type = p_entity_type AND entity_id = p_entity_id;
  
  RETURN v_final_score;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function for quest ranking
CREATE OR REPLACE FUNCTION public.get_ranked_quests(
  p_limit INTEGER DEFAULT 20,
  p_org_id UUID DEFAULT NULL,
  p_progression_tree TEXT DEFAULT NULL
) RETURNS TABLE (
  quest_id UUID,
  title TEXT,
  slug TEXT,
  rank_score DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    q.id,
    q.title,
    q.slug,
    (
      -- Liquidity: signups and cliques forming
      COALESCE(signup_counts.cnt, 0) * 2.0 +
      COALESCE(squad_counts.cnt, 0) * 5.0 +
      -- Trust: org/creator trust score
      COALESCE(ts.score, 50) * 0.5 +
      -- Quality: ratings
      COALESCE(q.avg_rating, 3.0) * 10.0 +
      -- Freshness: days until event (closer = higher)
      CASE 
        WHEN q.start_datetime IS NOT NULL 
        THEN GREATEST(0, 30 - EXTRACT(DAY FROM q.start_datetime - now())) * 2
        ELSE 0 
      END
    )::DECIMAL as rank_score
  FROM public.quests q
  LEFT JOIN public.trust_scores ts ON ts.entity_type = 'quest' AND ts.entity_id = q.id
  LEFT JOIN LATERAL (
    SELECT COUNT(*) as cnt FROM public.quest_signups WHERE quest_id = q.id
  ) signup_counts ON true
  LEFT JOIN LATERAL (
    SELECT COUNT(*) as cnt FROM public.quest_squads WHERE quest_id = q.id
  ) squad_counts ON true
  WHERE q.status = 'open'
    AND (p_org_id IS NULL OR q.org_id = p_org_id)
    AND (p_progression_tree IS NULL OR q.progression_tree = p_progression_tree)
  ORDER BY rank_score DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;