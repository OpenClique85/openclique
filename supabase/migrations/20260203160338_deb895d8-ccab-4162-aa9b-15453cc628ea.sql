-- =============================================================================
-- Phase 1: Username, Friend Code, User Interactions & Clique Invitations
-- =============================================================================

-- Add username column to profiles (unique, case-insensitive)
ALTER TABLE profiles 
  ADD COLUMN IF NOT EXISTS username TEXT;

-- Add friend_code column for sharing/inviting
ALTER TABLE profiles 
  ADD COLUMN IF NOT EXISTS friend_code TEXT;

-- Create unique indexes
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_username_lower 
  ON profiles (LOWER(username));

CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_friend_code 
  ON profiles (friend_code);

-- Username format validation (3-20 chars, alphanumeric + underscore)
ALTER TABLE profiles 
  DROP CONSTRAINT IF EXISTS username_format;

ALTER TABLE profiles 
  ADD CONSTRAINT username_format 
  CHECK (username IS NULL OR username ~ '^[a-zA-Z0-9_]{3,20}$');

-- Function to generate unique friend codes
CREATE OR REPLACE FUNCTION generate_user_friend_code()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result TEXT := '';
  i INT;
BEGIN
  FOR i IN 1..8 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Trigger function to auto-generate friend code on profile creation
CREATE OR REPLACE FUNCTION auto_generate_user_friend_code()
RETURNS TRIGGER AS $$
DECLARE
  new_code TEXT;
  code_exists BOOLEAN;
BEGIN
  IF NEW.friend_code IS NULL THEN
    LOOP
      new_code := generate_user_friend_code();
      SELECT EXISTS(SELECT 1 FROM profiles WHERE friend_code = new_code) INTO code_exists;
      EXIT WHEN NOT code_exists;
    END LOOP;
    NEW.friend_code := new_code;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for auto-generating friend codes
DROP TRIGGER IF EXISTS trigger_auto_generate_user_friend_code ON profiles;
CREATE TRIGGER trigger_auto_generate_user_friend_code
  BEFORE INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION auto_generate_user_friend_code();

-- Backfill existing users with friend codes
DO $$
DECLARE
  profile_record RECORD;
  new_code TEXT;
  code_exists BOOLEAN;
BEGIN
  FOR profile_record IN SELECT id FROM profiles WHERE friend_code IS NULL LOOP
    LOOP
      new_code := generate_user_friend_code();
      SELECT EXISTS(SELECT 1 FROM profiles WHERE friend_code = new_code) INTO code_exists;
      EXIT WHEN NOT code_exists;
    END LOOP;
    UPDATE profiles SET friend_code = new_code WHERE id = profile_record.id;
  END LOOP;
END $$;

-- =============================================================================
-- User Interactions Table (Structured interactions, NOT messages)
-- =============================================================================

CREATE TABLE IF NOT EXISTS user_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  to_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  interaction_type TEXT NOT NULL CHECK (interaction_type IN ('poke', 'wave', 'quest_share', 'clique_invite')),
  payload JSONB, -- {quest_id: 'xxx'} or {clique_id: 'xxx'}
  message TEXT CHECK (message IS NULL OR length(message) <= 100), -- Optional short context (max 100 chars)
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Index for efficient querying
CREATE INDEX IF NOT EXISTS idx_user_interactions_to_user ON user_interactions(to_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_interactions_from_user ON user_interactions(from_user_id, created_at DESC);

-- Rate limiting function: max 10 interactions per user per day
CREATE OR REPLACE FUNCTION check_interaction_rate_limit()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if user has exceeded daily limit
  IF (
    SELECT COUNT(*) FROM user_interactions 
    WHERE from_user_id = NEW.from_user_id 
    AND created_at > now() - interval '24 hours'
  ) >= 10 THEN
    RAISE EXCEPTION 'Daily interaction limit reached (10/day)';
  END IF;
  
  -- Check if same interaction type to same user within 24 hours
  IF EXISTS (
    SELECT 1 FROM user_interactions 
    WHERE from_user_id = NEW.from_user_id 
    AND to_user_id = NEW.to_user_id 
    AND interaction_type = NEW.interaction_type
    AND created_at > now() - interval '24 hours'
  ) THEN
    RAISE EXCEPTION 'You can only send one % per day to the same person', NEW.interaction_type;
  END IF;
  
  -- Check if user is blocked
  IF EXISTS (
    SELECT 1 FROM user_blocks 
    WHERE (blocker_id = NEW.to_user_id AND blocked_id = NEW.from_user_id)
    OR (blocker_id = NEW.from_user_id AND blocked_id = NEW.to_user_id)
  ) THEN
    RAISE EXCEPTION 'Cannot interact with this user';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS enforce_interaction_rate_limit ON user_interactions;
CREATE TRIGGER enforce_interaction_rate_limit
  BEFORE INSERT ON user_interactions
  FOR EACH ROW EXECUTE FUNCTION check_interaction_rate_limit();

-- Enable RLS
ALTER TABLE user_interactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Users can see interactions involving them" ON user_interactions;
CREATE POLICY "Users can see interactions involving them"
  ON user_interactions FOR SELECT
  USING (from_user_id = auth.uid() OR to_user_id = auth.uid());

DROP POLICY IF EXISTS "Users can create interactions" ON user_interactions;
CREATE POLICY "Users can create interactions"
  ON user_interactions FOR INSERT
  WITH CHECK (from_user_id = auth.uid());

DROP POLICY IF EXISTS "Users can mark their received interactions as read" ON user_interactions;
CREATE POLICY "Users can mark their received interactions as read"
  ON user_interactions FOR UPDATE
  USING (to_user_id = auth.uid())
  WITH CHECK (to_user_id = auth.uid());

-- Admin can see all interactions
DROP POLICY IF EXISTS "Admins can see all interactions" ON user_interactions;
CREATE POLICY "Admins can see all interactions"
  ON user_interactions FOR SELECT
  USING (public.is_admin());

-- =============================================================================
-- Clique Invitations Table (Person-to-person invitations)
-- =============================================================================

CREATE TABLE IF NOT EXISTS clique_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  squad_id UUID NOT NULL REFERENCES squads(id) ON DELETE CASCADE,
  inviter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invitee_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),
  message TEXT CHECK (message IS NULL OR length(message) <= 200), -- Optional invitation message
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  responded_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ DEFAULT now() + interval '7 days',
  UNIQUE(squad_id, invitee_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_clique_invitations_invitee ON clique_invitations(invitee_id, status);
CREATE INDEX IF NOT EXISTS idx_clique_invitations_inviter ON clique_invitations(inviter_id);
CREATE INDEX IF NOT EXISTS idx_clique_invitations_squad ON clique_invitations(squad_id);

-- Enable RLS
ALTER TABLE clique_invitations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Users can see their invitations" ON clique_invitations;
CREATE POLICY "Users can see their invitations"
  ON clique_invitations FOR SELECT
  USING (inviter_id = auth.uid() OR invitee_id = auth.uid());

DROP POLICY IF EXISTS "Clique members can send invitations" ON clique_invitations;
CREATE POLICY "Clique members can send invitations"
  ON clique_invitations FOR INSERT
  WITH CHECK (
    inviter_id = auth.uid() 
    AND EXISTS (
      SELECT 1 FROM squad_members 
      WHERE squad_members.persistent_squad_id = squad_id 
      AND squad_members.user_id = auth.uid()
      AND squad_members.status = 'active'
    )
  );

DROP POLICY IF EXISTS "Invitees can respond to invitations" ON clique_invitations;
CREATE POLICY "Invitees can respond to invitations"
  ON clique_invitations FOR UPDATE
  USING (invitee_id = auth.uid())
  WITH CHECK (invitee_id = auth.uid());

DROP POLICY IF EXISTS "Inviters can cancel invitations" ON clique_invitations;
CREATE POLICY "Inviters can cancel invitations"
  ON clique_invitations FOR DELETE
  USING (inviter_id = auth.uid() AND status = 'pending');

-- Admin can see all invitations
DROP POLICY IF EXISTS "Admins can see all invitations" ON clique_invitations;
CREATE POLICY "Admins can see all invitations"
  ON clique_invitations FOR SELECT
  USING (public.is_admin());

-- =============================================================================
-- User Search Function
-- =============================================================================

CREATE OR REPLACE FUNCTION search_users(
  p_query TEXT,
  p_limit INT DEFAULT 20,
  p_requester_id UUID DEFAULT NULL
) RETURNS TABLE (
  id UUID,
  display_name TEXT,
  username TEXT,
  city TEXT,
  friend_code TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.display_name,
    p.username,
    p.city,
    p.friend_code
  FROM profiles p
  LEFT JOIN user_blocks ub ON ub.blocker_id = p_requester_id AND ub.blocked_id = p.id
  LEFT JOIN user_blocks ub2 ON ub2.blocker_id = p.id AND ub2.blocked_id = p_requester_id
  WHERE 
    (
      p.username ILIKE '%' || p_query || '%'
      OR p.display_name ILIKE '%' || p_query || '%'
      OR p.friend_code = UPPER(TRIM(p_query))
    )
    AND (p.privacy_settings->>'profile_visible')::boolean IS NOT FALSE
    AND ub.blocker_id IS NULL  -- Not blocked by requester
    AND ub2.blocker_id IS NULL -- Not blocking requester
    AND p.id != COALESCE(p_requester_id, '00000000-0000-0000-0000-000000000000'::uuid)
  ORDER BY 
    CASE WHEN p.username ILIKE p_query || '%' THEN 0 ELSE 1 END,
    p.display_name
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- =============================================================================
-- Username Availability Check Function
-- =============================================================================

CREATE OR REPLACE FUNCTION check_username_availability(p_username TEXT, p_user_id UUID DEFAULT NULL)
RETURNS JSONB AS $$
DECLARE
  reserved_words TEXT[] := ARRAY['admin', 'support', 'openclique', 'clique', 'system', 'help', 'moderator', 'mod', 'staff', 'official'];
  normalized_username TEXT;
BEGIN
  normalized_username := LOWER(TRIM(p_username));
  
  -- Check format
  IF NOT (p_username ~ '^[a-zA-Z0-9_]{3,20}$') THEN
    RETURN jsonb_build_object('available', false, 'reason', 'Username must be 3-20 characters, letters, numbers, and underscores only');
  END IF;
  
  -- Check reserved words
  IF normalized_username = ANY(reserved_words) THEN
    RETURN jsonb_build_object('available', false, 'reason', 'This username is reserved');
  END IF;
  
  -- Check if already taken (excluding current user)
  IF EXISTS (
    SELECT 1 FROM profiles 
    WHERE LOWER(username) = normalized_username 
    AND (p_user_id IS NULL OR id != p_user_id)
  ) THEN
    RETURN jsonb_build_object('available', false, 'reason', 'This username is already taken');
  END IF;
  
  RETURN jsonb_build_object('available', true, 'reason', NULL);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;