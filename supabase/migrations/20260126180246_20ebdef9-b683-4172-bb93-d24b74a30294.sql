-- Phase 1: Add notification_preferences and privacy_settings columns to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT '{
  "email_quest_recommendations": true,
  "email_quest_reminders": true,
  "email_squad_updates": true,
  "email_marketing": false,
  "in_app_quest_recommendations": true,
  "in_app_squad_updates": true,
  "in_app_general": true
}'::jsonb;

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS privacy_settings JSONB DEFAULT '{
  "profile_visibility": "public",
  "show_activity_history": true,
  "allow_matching": true,
  "show_in_squad_lists": true,
  "show_xp_and_badges": true
}'::jsonb;

-- Phase 1.3: Create Account Deletion Feedback Table
CREATE TABLE IF NOT EXISTS public.account_deletion_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email TEXT NOT NULL,
  display_name TEXT,
  reasons TEXT[] DEFAULT '{}',
  other_reason TEXT,
  feedback TEXT,
  would_return BOOLEAN,
  data_exported BOOLEAN DEFAULT false,
  deleted_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS: Only service role can access (blocks all user access)
ALTER TABLE public.account_deletion_feedback ENABLE ROW LEVEL SECURITY;

-- No policies = only service role can access

-- Phase 1.4: Create Account Deletion Requests Table
CREATE TABLE IF NOT EXISTS public.account_deletion_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  user_email TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  scheduled_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '7 days'),
  processed_at TIMESTAMPTZ,
  cancellation_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add constraint using trigger instead of CHECK (for immutability)
CREATE OR REPLACE FUNCTION public.validate_deletion_request_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status NOT IN ('pending', 'processing', 'completed', 'cancelled') THEN
    RAISE EXCEPTION 'Invalid status value: %', NEW.status;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS validate_deletion_request_status_trigger ON public.account_deletion_requests;
CREATE TRIGGER validate_deletion_request_status_trigger
  BEFORE INSERT OR UPDATE ON public.account_deletion_requests
  FOR EACH ROW EXECUTE FUNCTION public.validate_deletion_request_status();

ALTER TABLE public.account_deletion_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own deletion requests" 
  ON public.account_deletion_requests
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own deletion requests" 
  ON public.account_deletion_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can cancel own pending deletion requests" 
  ON public.account_deletion_requests
  FOR UPDATE USING (auth.uid() = user_id AND status = 'pending');