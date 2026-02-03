-- Drop and recreate the search_users function with correct privacy field name
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
    (p.username ILIKE '%' || p_query || '%'
     OR p.display_name ILIKE '%' || p_query || '%'
     OR p.friend_code = UPPER(p_query))
    AND (
      (p.privacy_settings->>'profile_visibility') IS NULL 
      OR (p.privacy_settings->>'profile_visibility') = 'public'
    )
    AND ub.blocker_id IS NULL  -- Not blocked by requester
    AND ub2.blocker_id IS NULL -- Not blocking requester
    AND p.id != COALESCE(p_requester_id, '00000000-0000-0000-0000-000000000000'::uuid)
  ORDER BY 
    CASE WHEN p.username ILIKE p_query || '%' THEN 0 ELSE 1 END,
    p.display_name
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;