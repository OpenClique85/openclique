-- =============================================
-- PILOT RUNTIME SYSTEM - PHASE 1: DATA MODEL
-- =============================================

-- 1. Create quest_templates table (reusable quest definitions)
CREATE TABLE public.quest_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  icon TEXT DEFAULT '🎯',
  description TEXT,
  short_description TEXT,
  
  -- Objectives as JSONB array: [{text, required_proof, proof_type}]
  objectives JSONB DEFAULT '[]'::jsonb,
  
  -- Defaults for instances
  default_capacity INTEGER DEFAULT 24,
  default_duration_minutes INTEGER DEFAULT 120,
  default_squad_size INTEGER DEFAULT 6,
  
  -- Proof configuration
  required_proof_types TEXT[] DEFAULT ARRAY['photo']::TEXT[],
  
  -- XP rules as JSONB: {base_xp, check_in_bonus, proof_bonus, feedback_bonus}
  xp_rules JSONB DEFAULT '{"base_xp": 100, "check_in_bonus": 25, "proof_bonus": 50, "feedback_bonus": 25}'::jsonb,
  
  -- Timeline prompts: [{trigger: "T-24h", template_key: "reminder_24h"}]
  timeline_prompts JSONB DEFAULT '[]'::jsonb,
  
  -- Categorization
  progression_tree TEXT CHECK (progression_tree IN ('culture', 'wellness', 'connector')),
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  theme_color TEXT DEFAULT 'pink',
  
  -- What to bring, safety notes (template defaults)
  what_to_bring TEXT,
  safety_notes TEXT,
  
  -- Metadata
  created_by UUID REFERENCES auth.users(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Create instance_status enum
CREATE TYPE public.instance_status AS ENUM (
  'draft',
  'recruiting', 
  'locked',
  'live',
  'completed',
  'cancelled',
  'archived'
);

-- 3. Create quest_instances table (scheduled runs of templates)
CREATE TABLE public.quest_instances (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  template_id UUID REFERENCES public.quest_templates(id) ON DELETE SET NULL,
  instance_slug TEXT NOT NULL UNIQUE,
  
  -- Copied from template (can be customized per instance)
  title TEXT NOT NULL,
  icon TEXT DEFAULT '🎯',
  description TEXT,
  
  -- Status workflow
  status public.instance_status NOT NULL DEFAULT 'draft',
  
  -- Scheduling
  scheduled_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME,
  timezone TEXT DEFAULT 'America/Chicago',
  
  -- Location
  meeting_point_name TEXT,
  meeting_point_address TEXT,
  meeting_point_coords POINT,
  
  -- Capacity
  capacity INTEGER NOT NULL DEFAULT 24,
  current_signup_count INTEGER DEFAULT 0,
  
  -- Squad configuration
  target_squad_size INTEGER DEFAULT 6,
  squads_locked BOOLEAN DEFAULT false,
  
  -- Check-in window (admin controlled)
  check_in_opens_at TIMESTAMPTZ,
  check_in_closes_at TIMESTAMPTZ,
  
  -- Access token for Quest Card
  quest_card_token TEXT NOT NULL DEFAULT encode(gen_random_bytes(16), 'hex'),
  
  -- Operator notes (admin only)
  operator_notes TEXT,
  
  -- Inherit from template
  objectives JSONB DEFAULT '[]'::jsonb,
  xp_rules JSONB DEFAULT '{"base_xp": 100, "check_in_bonus": 25, "proof_bonus": 50, "feedback_bonus": 25}'::jsonb,
  required_proof_types TEXT[] DEFAULT ARRAY['photo']::TEXT[],
  what_to_bring TEXT,
  safety_notes TEXT,
  progression_tree TEXT,
  
  -- Metadata
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Create proof_status enum
CREATE TYPE public.proof_status AS ENUM (
  'pending',
  'approved',
  'flagged',
  'resubmit_requested'
);

-- 5. Create participant_proofs table
CREATE TABLE public.participant_proofs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  instance_id UUID NOT NULL REFERENCES public.quest_instances(id) ON DELETE CASCADE,
  signup_id UUID REFERENCES public.quest_signups(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  
  -- Proof content
  proof_type TEXT NOT NULL CHECK (proof_type IN ('photo', 'video', 'text_note')),
  file_url TEXT,
  text_content TEXT,
  
  -- Which objective this proves (optional)
  objective_index INTEGER,
  
  -- Review status
  status public.proof_status NOT NULL DEFAULT 'pending',
  admin_notes TEXT,
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. Create message_templates table
CREATE TABLE public.message_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  template_key TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL CHECK (category IN ('reminder', 'instruction', 'objective', 'completion', 'nudge')),
  
  name TEXT NOT NULL,
  subject TEXT,
  body TEXT NOT NULL,
  
  -- Placeholders available: {{name}}, {{quest_title}}, {{meeting_point}}, {{whatsapp_link}}, {{quest_card_url}}, etc.
  available_placeholders TEXT[] DEFAULT ARRAY[]::TEXT[],
  
  -- System templates can't be deleted
  is_system BOOLEAN DEFAULT false,
  
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. Create quest_event_type enum
CREATE TYPE public.quest_event_type AS ENUM (
  'instance_created',
  'status_change',
  'signup',
  'confirm',
  'cancel',
  'squad_assigned',
  'squad_moved',
  'whatsapp_joined',
  'check_in',
  'proof_submitted',
  'proof_approved',
  'proof_flagged',
  'completion',
  'xp_awarded',
  'message_sent',
  'admin_override',
  'no_show_marked'
);

-- 8. Create quest_event_log table
CREATE TABLE public.quest_event_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  instance_id UUID REFERENCES public.quest_instances(id) ON DELETE CASCADE,
  
  event_type public.quest_event_type NOT NULL,
  
  -- Who triggered this event
  actor_type TEXT NOT NULL CHECK (actor_type IN ('user', 'admin', 'system')),
  actor_id UUID REFERENCES auth.users(id),
  
  -- Who was affected (if applicable)
  target_user_id UUID REFERENCES auth.users(id),
  
  -- Event-specific data
  payload JSONB DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 9. Extend quest_signups with pilot-specific fields
ALTER TABLE public.quest_signups 
ADD COLUMN IF NOT EXISTS instance_id UUID REFERENCES public.quest_instances(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS whatsapp_joined BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS checked_in_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS proof_submitted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS last_activity_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS participant_token TEXT DEFAULT encode(gen_random_bytes(12), 'hex');

-- 10. Add indexes for performance
CREATE INDEX idx_quest_instances_status ON public.quest_instances(status);
CREATE INDEX idx_quest_instances_scheduled_date ON public.quest_instances(scheduled_date);
CREATE INDEX idx_quest_instances_token ON public.quest_instances(quest_card_token);
CREATE INDEX idx_quest_signups_instance ON public.quest_signups(instance_id);
CREATE INDEX idx_quest_signups_token ON public.quest_signups(participant_token);
CREATE INDEX idx_participant_proofs_instance ON public.participant_proofs(instance_id);
CREATE INDEX idx_participant_proofs_status ON public.participant_proofs(status);
CREATE INDEX idx_quest_event_log_instance ON public.quest_event_log(instance_id);
CREATE INDEX idx_quest_event_log_type ON public.quest_event_log(event_type);
CREATE INDEX idx_quest_event_log_created ON public.quest_event_log(created_at DESC);

-- 11. Enable RLS on all new tables
ALTER TABLE public.quest_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quest_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.participant_proofs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quest_event_log ENABLE ROW LEVEL SECURITY;

-- 12. RLS Policies for quest_templates
CREATE POLICY "Admins can manage quest templates"
ON public.quest_templates FOR ALL
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "Anyone can view active templates"
ON public.quest_templates FOR SELECT
USING (is_active = true);

-- 13. RLS Policies for quest_instances
CREATE POLICY "Admins can manage quest instances"
ON public.quest_instances FOR ALL
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "Participants can view their instances"
ON public.quest_instances FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.quest_signups qs 
    WHERE qs.instance_id = quest_instances.id 
    AND qs.user_id = auth.uid()
  )
);

-- 14. RLS Policies for participant_proofs
CREATE POLICY "Users can manage their own proofs"
ON public.participant_proofs FOR ALL
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can manage all proofs"
ON public.participant_proofs FOR ALL
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- 15. RLS Policies for message_templates
CREATE POLICY "Admins can manage message templates"
ON public.message_templates FOR ALL
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "System templates are read-only for non-admins"
ON public.message_templates FOR SELECT
USING (true);

-- 16. RLS Policies for quest_event_log
CREATE POLICY "Admins can read all events"
ON public.quest_event_log FOR SELECT
USING (public.is_admin());

CREATE POLICY "System can insert events"
ON public.quest_event_log FOR INSERT
WITH CHECK (true);

-- 17. Triggers for updated_at
CREATE TRIGGER update_quest_templates_updated_at
BEFORE UPDATE ON public.quest_templates
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_quest_instances_updated_at
BEFORE UPDATE ON public.quest_instances
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_participant_proofs_updated_at
BEFORE UPDATE ON public.participant_proofs
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_message_templates_updated_at
BEFORE UPDATE ON public.message_templates
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 18. Seed default message templates
INSERT INTO public.message_templates (template_key, category, name, subject, body, available_placeholders, is_system) VALUES
('reminder_24h', 'reminder', '24-Hour Reminder', 'Tomorrow: {{quest_title}}', 
 E'Hey {{name}}! 👋\n\n{{quest_title}} is TOMORROW!\n\n📍 Meet at: {{meeting_point}}\n⏰ Time: {{start_time}}\n\nMake sure you''ve joined your squad''s WhatsApp group. See you there!',
 ARRAY['name', 'quest_title', 'meeting_point', 'start_time'], true),

('reminder_2h', 'reminder', '2-Hour Reminder', 'Starting Soon: {{quest_title}}',
 E'{{name}}, just 2 hours until {{quest_title}}! 🚀\n\n📍 {{meeting_point}}\n⏰ {{start_time}}\n\n{{what_to_bring}}\n\nSee you soon!',
 ARRAY['name', 'quest_title', 'meeting_point', 'start_time', 'what_to_bring'], true),

('confirm_spot', 'nudge', 'Confirm Your Spot', 'Confirm: {{quest_title}}',
 E'Hey {{name}}! 🎯\n\nYou''re on the list for {{quest_title}}!\n\nPlease confirm your spot: {{quest_card_url}}\n\nSpots are limited - confirm now to lock yours in.',
 ARRAY['name', 'quest_title', 'quest_card_url'], true),

('join_whatsapp', 'instruction', 'Join WhatsApp Group', 'Join Your Squad',
 E'{{name}}, your squad is ready! 🎉\n\nJoin your WhatsApp group now:\n{{whatsapp_link}}\n\nThis is where we''ll coordinate on quest day. Don''t miss the fun!',
 ARRAY['name', 'whatsapp_link'], true),

('check_in_open', 'instruction', 'Check-in Open', 'Check In Now!',
 E'Check-in is now OPEN for {{quest_title}}! ✅\n\nTap here to check in:\n{{quest_card_url}}\n\nCheck in when you arrive at {{meeting_point}}.',
 ARRAY['quest_title', 'quest_card_url', 'meeting_point'], true),

('quest_starting', 'instruction', 'Quest Starting', 'GO TIME! 🚀',
 E'{{quest_title}} is starting NOW! 🎯\n\n📍 Head to: {{meeting_point}}\n\nLook for your squad and get ready for adventure!',
 ARRAY['quest_title', 'meeting_point'], true),

('objective_reveal', 'objective', 'Objective Reveal', 'New Objective! 🎯',
 E'🎯 OBJECTIVE {{objective_number}}:\n\n{{objective_text}}\n\n{{objective_instructions}}',
 ARRAY['objective_number', 'objective_text', 'objective_instructions'], true),

('completion_link', 'completion', 'Submit Completion', 'Complete Your Quest',
 E'Amazing work, {{name}}! 🎉\n\nSubmit your proof to complete {{quest_title}}:\n{{quest_card_url}}\n\nUpload a photo or video of your adventure!',
 ARRAY['name', 'quest_title', 'quest_card_url'], true),

('feedback_request', 'completion', 'Feedback Request', 'Quick Feedback = +50 XP',
 E'Thanks for joining {{quest_title}}, {{name}}! 🙏\n\nShare quick feedback (2 min) and earn +50 XP:\n{{feedback_url}}\n\nYour input shapes future quests!',
 ARRAY['name', 'quest_title', 'feedback_url'], true),

('whatsapp_nudge', 'nudge', 'WhatsApp Reminder', 'Join Your Squad''s Chat',
 E'Hey {{name}}! 👀\n\nWe noticed you haven''t joined your squad''s WhatsApp yet.\n\nJoin here: {{whatsapp_link}}\n\nThis is where we''ll share live updates during the quest!',
 ARRAY['name', 'whatsapp_link'], true);

-- 19. Create storage bucket for proof uploads
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'pilot-proofs', 
  'pilot-proofs', 
  false, 
  10485760, -- 10MB
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/quicktime']
)
ON CONFLICT (id) DO NOTHING;

-- 20. Storage policies for pilot-proofs bucket
CREATE POLICY "Users can upload their own proofs"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'pilot-proofs' 
  AND auth.uid()::text = (storage.foldername(name))[2]
);

CREATE POLICY "Users can view their own proofs"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'pilot-proofs' 
  AND auth.uid()::text = (storage.foldername(name))[2]
);

CREATE POLICY "Admins can view all proofs"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'pilot-proofs' 
  AND public.is_admin()
);

CREATE POLICY "Admins can manage all proofs"
ON storage.objects FOR ALL
USING (
  bucket_id = 'pilot-proofs' 
  AND public.is_admin()
);

-- 21. Function to log quest events
CREATE OR REPLACE FUNCTION public.log_quest_event(
  p_instance_id UUID,
  p_event_type quest_event_type,
  p_actor_type TEXT,
  p_actor_id UUID DEFAULT NULL,
  p_target_user_id UUID DEFAULT NULL,
  p_payload JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_event_id UUID;
BEGIN
  INSERT INTO quest_event_log (instance_id, event_type, actor_type, actor_id, target_user_id, payload)
  VALUES (p_instance_id, p_event_type, p_actor_type, COALESCE(p_actor_id, auth.uid()), p_target_user_id, p_payload)
  RETURNING id INTO v_event_id;
  
  RETURN v_event_id;
END;
$$;

-- 22. Function to create instance from template
CREATE OR REPLACE FUNCTION public.create_instance_from_template(
  p_template_id UUID,
  p_scheduled_date DATE,
  p_start_time TIME,
  p_meeting_point_name TEXT DEFAULT NULL,
  p_meeting_point_address TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_template quest_templates%ROWTYPE;
  v_instance_id UUID;
  v_slug TEXT;
  v_counter INTEGER := 0;
BEGIN
  -- Get template
  SELECT * INTO v_template FROM quest_templates WHERE id = p_template_id;
  
  IF v_template IS NULL THEN
    RAISE EXCEPTION 'Template not found';
  END IF;
  
  -- Generate unique slug
  v_slug := v_template.slug || '-' || to_char(p_scheduled_date, 'YYYYMMDD');
  WHILE EXISTS (SELECT 1 FROM quest_instances WHERE instance_slug = v_slug) LOOP
    v_counter := v_counter + 1;
    v_slug := v_template.slug || '-' || to_char(p_scheduled_date, 'YYYYMMDD') || '-' || v_counter;
  END LOOP;
  
  -- Create instance
  INSERT INTO quest_instances (
    template_id, instance_slug, title, icon, description,
    scheduled_date, start_time,
    meeting_point_name, meeting_point_address,
    capacity, target_squad_size,
    objectives, xp_rules, required_proof_types,
    what_to_bring, safety_notes, progression_tree,
    created_by
  ) VALUES (
    p_template_id, v_slug, v_template.title, v_template.icon, v_template.description,
    p_scheduled_date, p_start_time,
    p_meeting_point_name, p_meeting_point_address,
    v_template.default_capacity, v_template.default_squad_size,
    v_template.objectives, v_template.xp_rules, v_template.required_proof_types,
    v_template.what_to_bring, v_template.safety_notes, v_template.progression_tree,
    auth.uid()
  )
  RETURNING id INTO v_instance_id;
  
  -- Log event
  PERFORM log_quest_event(v_instance_id, 'instance_created', 'admin', auth.uid(), NULL, 
    jsonb_build_object('template_id', p_template_id, 'template_title', v_template.title));
  
  RETURN v_instance_id;
END;
$$;