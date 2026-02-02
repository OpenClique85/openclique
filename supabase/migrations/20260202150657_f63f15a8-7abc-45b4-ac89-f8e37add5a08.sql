-- =====================================================
-- COMPREHENSIVE PII & CONSENT PROTECTION MIGRATION
-- Locks down phone numbers, addresses, and enforces consent
-- =====================================================

-- =====================================================
-- 1. QUEST SIGNUPS - Secure phone access function
-- =====================================================

CREATE OR REPLACE FUNCTION public.get_signup_phone(target_signup_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  signup_user_id uuid;
  signup_phone text;
BEGIN
  SELECT user_id, phone INTO signup_user_id, signup_phone
  FROM quest_signups WHERE id = target_signup_id;
  
  IF auth.uid() = signup_user_id OR is_admin() THEN
    RETURN signup_phone;
  ELSE
    RETURN NULL;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_signup_phone(uuid) TO authenticated;
COMMENT ON FUNCTION public.get_signup_phone(uuid) IS 'Securely retrieves signup phone. Only returns to owner or admin.';

-- =====================================================
-- 2. QUESTS - Protect emergency contact info
-- =====================================================

CREATE OR REPLACE VIEW public.quests_public
WITH (security_invoker = true)
AS
SELECT 
  id, slug, title, icon, short_description, full_description, briefing_html, image_url,
  status, visibility, tags, theme, theme_color, highlights, objectives, success_criteria,
  rewards, cost_description, duration_notes, what_to_bring, dress_code, 
  physical_requirements, age_restriction, safety_notes, safety_level,
  meeting_location_name, meeting_address, city,
  start_datetime, end_datetime, default_duration_minutes, default_capacity, default_squad_size,
  capacity_total, base_xp, min_level, min_tree_xp,
  is_repeatable, is_active, is_sponsored, is_ticketed,
  price_type, estimated_cost_min, estimated_cost_max, external_ticket_url,
  creator_id, creator_type, creator_name, org_id, sponsor_id,
  published_at, created_at, updated_at
  -- EXCLUDED: emergency_contact, whatsapp_invite_link, admin_notes, creator_notes
FROM quests
WHERE status IN ('open', 'closed', 'completed') AND deleted_at IS NULL;

COMMENT ON VIEW public.quests_public IS 'Public view of quests with emergency_contact excluded.';

CREATE OR REPLACE FUNCTION public.get_quest_emergency_contact(target_quest_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  quest_creator_id uuid;
  quest_org_id uuid;
  contact_info text;
  is_org_admin boolean := false;
BEGIN
  SELECT creator_id, org_id, emergency_contact 
  INTO quest_creator_id, quest_org_id, contact_info
  FROM quests WHERE id = target_quest_id;
  
  IF quest_org_id IS NOT NULL THEN
    SELECT EXISTS (
      SELECT 1 FROM organization_members
      WHERE org_id = quest_org_id AND user_id = auth.uid()
      AND role IN ('admin', 'owner') AND status = 'active'
    ) INTO is_org_admin;
  END IF;
  
  IF auth.uid() = quest_creator_id OR is_org_admin OR is_admin() THEN
    RETURN contact_info;
  ELSE
    RETURN NULL;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_quest_emergency_contact(uuid) TO authenticated;
COMMENT ON FUNCTION public.get_quest_emergency_contact(uuid) IS 'Returns emergency contact only to creator/org admin/platform admin.';

-- =====================================================
-- 3. VENUE OFFERINGS - Protect address
-- =====================================================

CREATE OR REPLACE VIEW public.venue_offerings_public
WITH (security_invoker = true)
AS
SELECT 
  id, sponsor_id, venue_name, capacity,
  available_days, available_time_blocks, venue_rules, amenities,
  ideal_quest_types, approval_required, status, created_at
  -- EXCLUDED: address
FROM venue_offerings WHERE status = 'active';

COMMENT ON VIEW public.venue_offerings_public IS 'Public view of venues with address excluded.';

CREATE OR REPLACE FUNCTION public.get_venue_address(target_venue_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  sponsor_user_id uuid;
  venue_address text;
BEGIN
  SELECT s.user_id, v.address INTO sponsor_user_id, venue_address
  FROM venue_offerings v
  JOIN sponsor_profiles s ON s.id = v.sponsor_id
  WHERE v.id = target_venue_id;
  
  IF auth.uid() = sponsor_user_id OR is_admin() THEN
    RETURN venue_address;
  ELSE
    RETURN NULL;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_venue_address(uuid) TO authenticated;

-- =====================================================
-- 4. CONSENT ENFORCEMENT
-- =====================================================

CREATE OR REPLACE FUNCTION public.has_user_consent(
  target_user_id uuid,
  target_consent_type text
)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  has_consent boolean;
BEGIN
  SELECT consent_given INTO has_consent
  FROM user_consent_log
  WHERE user_id = target_user_id
  AND consent_type = target_consent_type
  AND withdrawn_at IS NULL
  ORDER BY created_at DESC
  LIMIT 1;
  
  RETURN COALESCE(has_consent, false);
END;
$$;

GRANT EXECUTE ON FUNCTION public.has_user_consent(uuid, text) TO authenticated;
COMMENT ON FUNCTION public.has_user_consent(uuid, text) IS 'Checks if user has active consent for a type.';

-- =====================================================
-- 5. FEEDBACK - Consent-gated access
-- =====================================================

CREATE OR REPLACE VIEW public.feedback_public
WITH (security_invoker = true)
AS
SELECT 
  f.id,
  f.quest_id,
  CASE WHEN f.consent_type = 'public' OR f.is_testimonial_approved = true THEN f.user_id ELSE NULL END AS user_id,
  f.rating_1_5,
  f.belonging_delta,
  f.would_do_again,
  f.submitted_at,
  CASE WHEN f.is_testimonial_approved = true AND f.consent_type IN ('public', 'testimonial')
       THEN f.testimonial_text ELSE NULL END AS testimonial_text,
  f.is_testimonial_approved,
  f.feelings
  -- EXCLUDED: best_part, friction_point, private_notes, recommendation_text
FROM feedback f;

COMMENT ON VIEW public.feedback_public IS 'Feedback view with consent enforcement. Testimonials only visible when approved AND consented.';

CREATE OR REPLACE FUNCTION public.get_feedback_for_admin(target_feedback_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  feedback_record RECORD;
BEGIN
  IF NOT is_admin() THEN
    RETURN jsonb_build_object('error', 'Unauthorized');
  END IF;
  
  SELECT * INTO feedback_record FROM feedback WHERE id = target_feedback_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Not found');
  END IF;
  
  RETURN jsonb_build_object(
    'id', feedback_record.id,
    'quest_id', feedback_record.quest_id,
    'user_id', feedback_record.user_id,
    'rating_1_5', feedback_record.rating_1_5,
    'consent_type', feedback_record.consent_type,
    'is_testimonial_approved', feedback_record.is_testimonial_approved,
    'interview_opt_in', feedback_record.interview_opt_in,
    'can_use_testimonial', (feedback_record.consent_type IN ('public', 'testimonial') AND feedback_record.is_testimonial_approved = true),
    'can_contact_for_interview', COALESCE(feedback_record.interview_opt_in, false),
    'note', 'best_part, friction_point, private_notes are internal only'
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_feedback_for_admin(uuid) TO authenticated;

-- =====================================================
-- 6. LORE CONTENT - Consent check
-- =====================================================

CREATE OR REPLACE FUNCTION public.can_use_lore_content(target_lore_id uuid, usage_type text)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  lore_creator_id uuid;
  lore_ai_generated boolean;
BEGIN
  SELECT created_by, is_ai_generated INTO lore_creator_id, lore_ai_generated
  FROM clique_lore_entries WHERE id = target_lore_id;
  
  IF lore_creator_id IS NULL THEN RETURN false; END IF;
  IF lore_ai_generated = true THEN RETURN true; END IF;
  
  IF usage_type = 'marketing' THEN
    RETURN has_user_consent(lore_creator_id, 'content_marketing');
  ELSIF usage_type = 'public_display' THEN
    RETURN has_user_consent(lore_creator_id, 'content_public');
  ELSIF usage_type = 'squad_only' THEN
    RETURN true;
  ELSE
    RETURN false;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.can_use_lore_content(uuid, text) TO authenticated;

-- =====================================================
-- 7. QUEST INSTANCES - Protect meeting address
-- =====================================================

CREATE OR REPLACE VIEW public.quest_instances_public
WITH (security_invoker = true)
AS
SELECT 
  id, quest_id, instance_slug, title, icon, description, status,
  scheduled_date, start_time, end_time, timezone,
  meeting_point_name,
  capacity, current_signup_count, target_squad_size, squads_locked,
  check_in_opens_at, check_in_closes_at,
  objectives, what_to_bring, safety_notes,
  created_at, updated_at
  -- EXCLUDED: meeting_point_address, meeting_point_coords, whatsapp_invite_link, operator_notes
FROM quest_instances
WHERE archived_at IS NULL;

COMMENT ON VIEW public.quest_instances_public IS 'Public view with meeting address excluded.';

CREATE OR REPLACE FUNCTION public.get_instance_meeting_address(target_instance_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  meeting_addr text;
  is_confirmed_participant boolean;
  quest_creator_id uuid;
BEGIN
  SELECT qi.meeting_point_address, q.creator_id
  INTO meeting_addr, quest_creator_id
  FROM quest_instances qi
  JOIN quests q ON q.id = qi.quest_id
  WHERE qi.id = target_instance_id;
  
  SELECT EXISTS (
    SELECT 1 FROM quest_signups
    WHERE instance_id = target_instance_id AND user_id = auth.uid()
    AND status IN ('confirmed', 'checked_in', 'completed')
  ) INTO is_confirmed_participant;
  
  IF is_confirmed_participant OR auth.uid() = quest_creator_id OR is_admin() THEN
    RETURN meeting_addr;
  ELSE
    RETURN NULL;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_instance_meeting_address(uuid) TO authenticated;

-- =====================================================
-- 8. PII ACCESS LOGGING
-- =====================================================

CREATE OR REPLACE FUNCTION public.log_pii_access(
  access_type text,
  target_table text,
  target_id uuid,
  fields_accessed text[]
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO pii_access_log (user_id, action, target_type, target_id, fields_accessed, created_at)
  VALUES (auth.uid(), access_type, target_table, target_id, fields_accessed, now());
END;
$$;

GRANT EXECUTE ON FUNCTION public.log_pii_access(text, text, uuid, text[]) TO authenticated;

-- =====================================================
-- 9. CONSENT TYPES TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.consent_types (
  id text PRIMARY KEY,
  name text NOT NULL,
  description text,
  is_required boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.consent_types ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read consent types" ON public.consent_types;
CREATE POLICY "Anyone can read consent types" ON public.consent_types FOR SELECT USING (true);

INSERT INTO public.consent_types (id, name, description, is_required) VALUES
  ('terms_of_service', 'Terms of Service', 'Agreement to platform terms', true),
  ('privacy_policy', 'Privacy Policy', 'Data collection acknowledgment', true),
  ('testimonial_public', 'Public Testimonial', 'Display testimonial publicly', false),
  ('feedback_marketing', 'Feedback Marketing', 'Use feedback in marketing', false),
  ('photo_sharing', 'Photo Sharing', 'Share quest photos publicly', false),
  ('interview_contact', 'Interview Contact', 'Contact for research interviews', false),
  ('content_marketing', 'Content Marketing', 'Use UGC in marketing', false),
  ('content_public', 'Content Public Display', 'Display UGC publicly', false),
  ('email_marketing', 'Email Marketing', 'Send marketing emails', false),
  ('partner_sharing', 'Partner Data Sharing', 'Share data with partners', false)
ON CONFLICT (id) DO NOTHING;

COMMENT ON TABLE public.consent_types IS 'Reference table of consent types.';