-- =============================================================================
-- CONTACTS & LFG SYSTEM
-- =============================================================================

-- User Contacts (mutual acceptance required)
CREATE TABLE user_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, accepted, declined
  nickname TEXT, -- Optional custom nickname
  notes TEXT, -- Private notes about this contact
  source TEXT, -- quest, friend_code, search, invite
  source_id UUID, -- Optional: quest_id if source is quest
  requested_at TIMESTAMPTZ DEFAULT now(),
  accepted_at TIMESTAMPTZ,
  
  CONSTRAINT unique_contact_pair UNIQUE (user_id, contact_id),
  CONSTRAINT no_self_contact CHECK (user_id != contact_id)
);

-- Indexes for efficient lookups
CREATE INDEX idx_user_contacts_user_id ON user_contacts(user_id);
CREATE INDEX idx_user_contacts_contact_id ON user_contacts(contact_id);
CREATE INDEX idx_user_contacts_status ON user_contacts(status);

-- Enable RLS
ALTER TABLE user_contacts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own contacts and incoming requests"
  ON user_contacts FOR SELECT
  USING (user_id = auth.uid() OR contact_id = auth.uid());

CREATE POLICY "Users can create contact requests"
  ON user_contacts FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own contacts or respond to requests"
  ON user_contacts FOR UPDATE
  USING (user_id = auth.uid() OR contact_id = auth.uid());

CREATE POLICY "Users can delete their own contacts"
  ON user_contacts FOR DELETE
  USING (user_id = auth.uid() OR contact_id = auth.uid());

-- =============================================================================
-- LFG BROADCASTS
-- =============================================================================

CREATE TABLE lfg_broadcasts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  quest_id UUID NOT NULL REFERENCES quests(id) ON DELETE CASCADE,
  squad_id UUID REFERENCES quest_squads(id) ON DELETE SET NULL,
  spots_available INT NOT NULL DEFAULT 1,
  message TEXT, -- Optional: "Looking for 2 more for trivia night!"
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN DEFAULT true,
  
  CONSTRAINT positive_spots CHECK (spots_available > 0)
);

-- Index for active broadcasts
CREATE INDEX idx_lfg_broadcasts_user_id ON lfg_broadcasts(user_id);
CREATE INDEX idx_lfg_broadcasts_quest_id ON lfg_broadcasts(quest_id);
CREATE INDEX idx_lfg_broadcasts_active ON lfg_broadcasts(is_active) WHERE is_active = true;

-- Enable RLS
ALTER TABLE lfg_broadcasts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view broadcasts from their contacts"
  ON lfg_broadcasts FOR SELECT
  USING (
    user_id = auth.uid() 
    OR EXISTS (
      SELECT 1 FROM user_contacts 
      WHERE status = 'accepted' 
      AND (
        (user_id = auth.uid() AND contact_id = lfg_broadcasts.user_id)
        OR (contact_id = auth.uid() AND user_id = lfg_broadcasts.user_id)
      )
    )
  );

CREATE POLICY "Users can create their own broadcasts"
  ON lfg_broadcasts FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own broadcasts"
  ON lfg_broadcasts FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own broadcasts"
  ON lfg_broadcasts FOR DELETE
  USING (user_id = auth.uid());

-- =============================================================================
-- LFG RESPONSES
-- =============================================================================

CREATE TABLE lfg_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  broadcast_id UUID NOT NULL REFERENCES lfg_broadcasts(id) ON DELETE CASCADE,
  responder_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'interested', -- interested, confirmed, withdrawn
  responded_at TIMESTAMPTZ DEFAULT now(),
  confirmed_at TIMESTAMPTZ,
  
  CONSTRAINT unique_response UNIQUE (broadcast_id, responder_id)
);

-- Enable RLS
ALTER TABLE lfg_responses ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Broadcast owner and responders can view responses"
  ON lfg_responses FOR SELECT
  USING (
    responder_id = auth.uid() 
    OR EXISTS (
      SELECT 1 FROM lfg_broadcasts 
      WHERE id = lfg_responses.broadcast_id 
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can respond to broadcasts"
  ON lfg_responses FOR INSERT
  WITH CHECK (responder_id = auth.uid());

CREATE POLICY "Responders can update their own responses"
  ON lfg_responses FOR UPDATE
  USING (responder_id = auth.uid());

-- =============================================================================
-- HELPER FUNCTION: Get accepted contacts for a user
-- =============================================================================

CREATE OR REPLACE FUNCTION get_user_contacts(p_user_id UUID)
RETURNS TABLE (
  contact_id UUID,
  display_name TEXT,
  username TEXT,
  avatar_url TEXT,
  nickname TEXT,
  notes TEXT,
  source TEXT,
  accepted_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    CASE 
      WHEN uc.user_id = p_user_id THEN uc.contact_id 
      ELSE uc.user_id 
    END as contact_id,
    p.display_name,
    p.username,
    p.avatar_url,
    uc.nickname,
    uc.notes,
    uc.source,
    uc.accepted_at
  FROM user_contacts uc
  JOIN profiles p ON p.id = CASE 
    WHEN uc.user_id = p_user_id THEN uc.contact_id 
    ELSE uc.user_id 
  END
  WHERE uc.status = 'accepted'
  AND (uc.user_id = p_user_id OR uc.contact_id = p_user_id)
  ORDER BY uc.accepted_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- HELPER FUNCTION: Get pending contact requests for a user
-- =============================================================================

CREATE OR REPLACE FUNCTION get_pending_contact_requests(p_user_id UUID)
RETURNS TABLE (
  request_id UUID,
  requester_id UUID,
  display_name TEXT,
  username TEXT,
  avatar_url TEXT,
  source TEXT,
  requested_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    uc.id as request_id,
    uc.user_id as requester_id,
    p.display_name,
    p.username,
    p.avatar_url,
    uc.source,
    uc.requested_at
  FROM user_contacts uc
  JOIN profiles p ON p.id = uc.user_id
  WHERE uc.contact_id = p_user_id
  AND uc.status = 'pending'
  ORDER BY uc.requested_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;