-- ============================================================================
-- LEGAL COMPLIANCE & USER SAFETY INFRASTRUCTURE
-- ============================================================================

-- ============================================================================
-- Part 1: Age Verification (profiles table updates)
-- ============================================================================

-- Add date of birth and age verification columns to profiles
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS date_of_birth date,
  ADD COLUMN IF NOT EXISTS age_verified_at timestamptz;

-- ============================================================================
-- Part 2: Check-in Location Data (quest_signups table updates)
-- ============================================================================

-- Add location tracking columns for optional geo-check-in
ALTER TABLE public.quest_signups
  ADD COLUMN IF NOT EXISTS check_in_method text,
  ADD COLUMN IF NOT EXISTS check_in_lat double precision,
  ADD COLUMN IF NOT EXISTS check_in_lng double precision,
  ADD COLUMN IF NOT EXISTS location_consent_given boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS check_in_verified boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS check_in_photo_url text,
  ADD COLUMN IF NOT EXISTS xp_awarded_at timestamptz;

-- ============================================================================
-- Part 3: User Blocks System
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.user_blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  blocked_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (blocker_id, blocked_id),
  CONSTRAINT cannot_block_self CHECK (blocker_id != blocked_id)
);

-- Enable RLS on user_blocks
ALTER TABLE public.user_blocks ENABLE ROW LEVEL SECURITY;

-- Users can see their own blocks
CREATE POLICY "Users can view their own blocks"
  ON public.user_blocks
  FOR SELECT
  USING (auth.uid() = blocker_id);

-- Users can create blocks
CREATE POLICY "Users can create blocks"
  ON public.user_blocks
  FOR INSERT
  WITH CHECK (auth.uid() = blocker_id);

-- Users can delete their own blocks
CREATE POLICY "Users can unblock users"
  ON public.user_blocks
  FOR DELETE
  USING (auth.uid() = blocker_id);

-- ============================================================================
-- Part 4: User Reports System
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.user_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
  reported_user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  reported_message_id uuid,
  reported_quest_id uuid REFERENCES public.quests(id) ON DELETE SET NULL,
  reason text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'pending',
  priority text DEFAULT 'normal',
  created_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz,
  reviewed_by uuid,
  action_taken text,
  reviewer_notes text
);

-- Enable RLS on user_reports
ALTER TABLE public.user_reports ENABLE ROW LEVEL SECURITY;

-- Users can create reports
CREATE POLICY "Users can create reports"
  ON public.user_reports
  FOR INSERT
  WITH CHECK (auth.uid() = reporter_id);

-- Users can view their own submitted reports
CREATE POLICY "Users can view own reports"
  ON public.user_reports
  FOR SELECT
  USING (auth.uid() = reporter_id);

-- Admins can view all reports
CREATE POLICY "Admins can view all reports"
  ON public.user_reports
  FOR ALL
  USING (public.is_admin());

-- ============================================================================
-- Part 5: SOS Emergency Alerts System
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.sos_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  quest_id uuid REFERENCES public.quests(id) ON DELETE SET NULL,
  squad_id uuid REFERENCES public.quest_squads(id) ON DELETE SET NULL,
  location_lat double precision,
  location_lng double precision,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz,
  resolved_by uuid,
  resolution_notes text,
  false_alarm boolean DEFAULT false,
  admin_notified_at timestamptz
);

-- Enable RLS on sos_alerts
ALTER TABLE public.sos_alerts ENABLE ROW LEVEL SECURITY;

-- Users can create SOS alerts
CREATE POLICY "Users can create SOS alerts"
  ON public.sos_alerts
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can view their own SOS alerts
CREATE POLICY "Users can view own SOS alerts"
  ON public.sos_alerts
  FOR SELECT
  USING (auth.uid() = user_id);

-- Admins can manage all SOS alerts
CREATE POLICY "Admins can manage SOS alerts"
  ON public.sos_alerts
  FOR ALL
  USING (public.is_admin());

-- ============================================================================
-- Part 6: Helper Functions
-- ============================================================================

-- Function to check if one user has blocked another
CREATE OR REPLACE FUNCTION public.is_blocked(user_a uuid, user_b uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_blocks
    WHERE (blocker_id = user_a AND blocked_id = user_b)
       OR (blocker_id = user_b AND blocked_id = user_a)
  );
$$;

-- Function to round coordinates for privacy (approximately 1km accuracy)
CREATE OR REPLACE FUNCTION public.round_coordinates(lat double precision, lng double precision)
RETURNS TABLE(rounded_lat double precision, rounded_lng double precision)
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT ROUND(lat::numeric, 2)::double precision, ROUND(lng::numeric, 2)::double precision;
$$;

-- Function to calculate age from date of birth
CREATE OR REPLACE FUNCTION public.calculate_age(dob date)
RETURNS integer
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT EXTRACT(YEAR FROM age(CURRENT_DATE, dob))::integer;
$$;

-- Function to check if user is 18+
CREATE OR REPLACE FUNCTION public.is_adult(target_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = target_user_id 
      AND p.date_of_birth IS NOT NULL
      AND public.calculate_age(p.date_of_birth) >= 18
  );
$$;

-- ============================================================================
-- Part 7: Auto-cleanup for old location data (90 days)
-- ============================================================================

-- Function to clean up old location data
CREATE OR REPLACE FUNCTION public.cleanup_old_location_data()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  affected_rows integer;
BEGIN
  UPDATE public.quest_signups
  SET 
    check_in_lat = NULL,
    check_in_lng = NULL,
    check_in_method = 'manual_historic'
  WHERE check_in_lat IS NOT NULL
    AND checked_in_at < NOW() - INTERVAL '90 days';
  
  GET DIAGNOSTICS affected_rows = ROW_COUNT;
  RETURN affected_rows;
END;
$$;

-- ============================================================================
-- Part 8: Indexes for performance
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_user_blocks_blocker ON public.user_blocks(blocker_id);
CREATE INDEX IF NOT EXISTS idx_user_blocks_blocked ON public.user_blocks(blocked_id);
CREATE INDEX IF NOT EXISTS idx_user_reports_status ON public.user_reports(status);
CREATE INDEX IF NOT EXISTS idx_user_reports_reporter ON public.user_reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_sos_alerts_status ON public.sos_alerts(status);
CREATE INDEX IF NOT EXISTS idx_sos_alerts_user ON public.sos_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_age_verified ON public.profiles(age_verified_at) WHERE date_of_birth IS NOT NULL;