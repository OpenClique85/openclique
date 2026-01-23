-- Create ops event type enum
CREATE TYPE public.ops_event_type AS ENUM (
  'signup_created', 'signup_status_changed', 'signup_xp_awarded',
  'squad_created', 'squad_member_added', 'squad_member_removed',
  'quest_created', 'quest_published', 'quest_status_changed',
  'xp_awarded', 'achievement_unlocked', 'streak_updated',
  'notification_sent', 'notification_failed', 'email_sent', 'email_failed',
  'ticket_created', 'ticket_resolved', 'admin_action', 'manual_override',
  'feature_flag_changed', 'shadow_session_started', 'shadow_session_ended'
);

-- Unified ops events table
CREATE TABLE public.ops_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type ops_event_type NOT NULL,
  correlation_id UUID DEFAULT gen_random_uuid(),
  
  -- Entity references (all nullable for flexible filtering)
  user_id UUID,
  quest_id UUID,
  squad_id UUID,
  signup_id UUID,
  listing_id UUID,
  ticket_id UUID,
  org_id UUID,
  sponsor_id UUID,
  creator_id UUID,
  
  -- Payload diff
  before_state JSONB,
  after_state JSONB,
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Actor tracking
  actor_user_id UUID,
  actor_type TEXT DEFAULT 'system',
  
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for fast filtering
CREATE INDEX idx_ops_events_type ON ops_events(event_type);
CREATE INDEX idx_ops_events_user ON ops_events(user_id);
CREATE INDEX idx_ops_events_quest ON ops_events(quest_id);
CREATE INDEX idx_ops_events_squad ON ops_events(squad_id);
CREATE INDEX idx_ops_events_created ON ops_events(created_at DESC);
CREATE INDEX idx_ops_events_correlation ON ops_events(correlation_id);
CREATE INDEX idx_ops_events_actor ON ops_events(actor_user_id);

-- Enable RLS
ALTER TABLE ops_events ENABLE ROW LEVEL SECURITY;

-- Only admins can access ops_events
CREATE POLICY "Only admins can view ops_events"
ON ops_events FOR SELECT
USING (is_admin());

CREATE POLICY "Only admins can insert ops_events"
ON ops_events FOR INSERT
WITH CHECK (is_admin());

-- Feature flags table
CREATE TABLE public.feature_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  
  is_enabled BOOLEAN DEFAULT false,
  
  -- Cohort targeting
  target_roles app_role[] DEFAULT '{}',
  target_org_ids UUID[] DEFAULT '{}',
  target_user_ids UUID[] DEFAULT '{}',
  rollout_percentage INTEGER DEFAULT 100 CHECK (rollout_percentage >= 0 AND rollout_percentage <= 100),
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID
);

-- Feature flag audit log
CREATE TABLE public.feature_flag_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flag_id UUID REFERENCES feature_flags(id) ON DELETE CASCADE,
  changed_by UUID NOT NULL,
  old_state JSONB,
  new_state JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on feature flags
ALTER TABLE feature_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_flag_audit ENABLE ROW LEVEL SECURITY;

-- Feature flags readable by all (for client-side checks), writable by admins
CREATE POLICY "Feature flags are publicly readable"
ON feature_flags FOR SELECT
USING (true);

CREATE POLICY "Only admins can manage feature flags"
ON feature_flags FOR ALL
USING (is_admin())
WITH CHECK (is_admin());

CREATE POLICY "Only admins can view feature flag audit"
ON feature_flag_audit FOR SELECT
USING (is_admin());

CREATE POLICY "Only admins can insert feature flag audit"
ON feature_flag_audit FOR INSERT
WITH CHECK (is_admin());

-- Admin shadow sessions table
CREATE TABLE public.admin_shadow_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID NOT NULL,
  target_user_id UUID NOT NULL,
  reason TEXT NOT NULL,
  started_at TIMESTAMPTZ DEFAULT now(),
  ended_at TIMESTAMPTZ,
  accessed_tables TEXT[] DEFAULT '{}',
  actions_taken JSONB DEFAULT '[]'::jsonb
);

-- Enable RLS
ALTER TABLE admin_shadow_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can manage shadow sessions"
ON admin_shadow_sessions FOR ALL
USING (is_admin())
WITH CHECK (is_admin());

-- Add incident grouping to support tickets
ALTER TABLE support_tickets 
ADD COLUMN IF NOT EXISTS incident_id UUID,
ADD COLUMN IF NOT EXISTS parent_ticket_id UUID REFERENCES support_tickets(id);

-- Extend comms_log with status tracking
ALTER TABLE comms_log 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'sent',
ADD COLUMN IF NOT EXISTS error_message TEXT,
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Create trigger for feature flag audit
CREATE OR REPLACE FUNCTION log_feature_flag_change()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO feature_flag_audit (flag_id, changed_by, old_state, new_state)
  VALUES (
    COALESCE(NEW.id, OLD.id),
    auth.uid(),
    CASE WHEN TG_OP = 'INSERT' THEN NULL ELSE to_jsonb(OLD) END,
    CASE WHEN TG_OP = 'DELETE' THEN NULL ELSE to_jsonb(NEW) END
  );
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER feature_flag_audit_trigger
AFTER INSERT OR UPDATE OR DELETE ON feature_flags
FOR EACH ROW EXECUTE FUNCTION log_feature_flag_change();

-- Update feature_flags updated_at trigger
CREATE OR REPLACE FUNCTION update_feature_flags_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_feature_flags_timestamp
BEFORE UPDATE ON feature_flags
FOR EACH ROW EXECUTE FUNCTION update_feature_flags_updated_at();