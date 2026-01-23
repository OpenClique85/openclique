-- Create invite code types
CREATE TYPE public.invite_code_type AS ENUM ('admin', 'tester', 'early_access');

-- Invite codes table
CREATE TABLE public.invite_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  type invite_code_type NOT NULL DEFAULT 'tester',
  label TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ,
  max_uses INTEGER,
  uses_count INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  notes TEXT
);

-- Invite redemptions tracking
CREATE TABLE public.invite_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code_id UUID NOT NULL REFERENCES public.invite_codes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  redeemed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  user_agent TEXT,
  referral_source TEXT,
  UNIQUE(code_id, user_id)
);

-- Onboarding feedback from invited users
CREATE TABLE public.onboarding_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  redemption_id UUID REFERENCES public.invite_redemptions(id),
  signup_experience_rating INTEGER CHECK (signup_experience_rating >= 1 AND signup_experience_rating <= 5),
  clarity_rating INTEGER CHECK (clarity_rating >= 1 AND clarity_rating <= 5),
  excitement_rating INTEGER CHECK (excitement_rating >= 1 AND excitement_rating <= 5),
  what_excited_you TEXT,
  what_confused_you TEXT,
  suggestions TEXT,
  would_recommend BOOLEAN,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.invite_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invite_redemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.onboarding_feedback ENABLE ROW LEVEL SECURITY;

-- Invite codes policies (admin only for management, public can validate)
CREATE POLICY "Admins can manage invite codes"
ON public.invite_codes FOR ALL
USING (public.is_admin());

CREATE POLICY "Anyone can validate invite codes"
ON public.invite_codes FOR SELECT
USING (is_active = true AND (expires_at IS NULL OR expires_at > now()));

-- Redemptions policies
CREATE POLICY "Admins can view all redemptions"
ON public.invite_redemptions FOR SELECT
USING (public.is_admin());

CREATE POLICY "Users can insert their own redemption"
ON public.invite_redemptions FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own redemption"
ON public.invite_redemptions FOR SELECT
USING (auth.uid() = user_id);

-- Feedback policies
CREATE POLICY "Admins can view all feedback"
ON public.onboarding_feedback FOR SELECT
USING (public.is_admin());

CREATE POLICY "Users can insert their own feedback"
ON public.onboarding_feedback FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own feedback"
ON public.onboarding_feedback FOR SELECT
USING (auth.uid() = user_id);

-- Function to redeem an invite code
CREATE OR REPLACE FUNCTION public.redeem_invite_code(
  p_code TEXT,
  p_user_agent TEXT DEFAULT NULL,
  p_referral_source TEXT DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_code_record invite_codes%ROWTYPE;
  v_redemption_id UUID;
BEGIN
  -- Find and validate the code
  SELECT * INTO v_code_record
  FROM invite_codes
  WHERE code = UPPER(TRIM(p_code))
    AND is_active = true
    AND (expires_at IS NULL OR expires_at > now())
    AND (max_uses IS NULL OR uses_count < max_uses);
  
  IF v_code_record IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid or expired invite code');
  END IF;
  
  -- Check if already redeemed by this user
  IF EXISTS (SELECT 1 FROM invite_redemptions WHERE code_id = v_code_record.id AND user_id = auth.uid()) THEN
    RETURN jsonb_build_object('success', true, 'already_redeemed', true, 'code_type', v_code_record.type);
  END IF;
  
  -- Create redemption record
  INSERT INTO invite_redemptions (code_id, user_id, user_agent, referral_source)
  VALUES (v_code_record.id, auth.uid(), p_user_agent, p_referral_source)
  RETURNING id INTO v_redemption_id;
  
  -- Increment uses count
  UPDATE invite_codes SET uses_count = uses_count + 1 WHERE id = v_code_record.id;
  
  -- If admin code, grant admin role
  IF v_code_record.type = 'admin' THEN
    INSERT INTO user_roles (user_id, role)
    VALUES (auth.uid(), 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  
  RETURN jsonb_build_object(
    'success', true,
    'redemption_id', v_redemption_id,
    'code_type', v_code_record.type,
    'code_label', v_code_record.label
  );
END;
$$;

-- Function to generate a random invite code
CREATE OR REPLACE FUNCTION public.generate_invite_code(
  p_type invite_code_type DEFAULT 'tester',
  p_label TEXT DEFAULT NULL,
  p_max_uses INTEGER DEFAULT NULL,
  p_expires_days INTEGER DEFAULT NULL,
  p_notes TEXT DEFAULT NULL
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_code TEXT;
  v_expires_at TIMESTAMPTZ;
BEGIN
  -- Only admins can generate codes
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Only admins can generate invite codes';
  END IF;
  
  -- Generate unique code (format: TYPE-XXXXXX)
  LOOP
    v_code := UPPER(LEFT(p_type::text, 3)) || '-' || UPPER(SUBSTRING(md5(random()::text) FROM 1 FOR 6));
    EXIT WHEN NOT EXISTS (SELECT 1 FROM invite_codes WHERE code = v_code);
  END LOOP;
  
  -- Calculate expiration
  IF p_expires_days IS NOT NULL THEN
    v_expires_at := now() + (p_expires_days || ' days')::interval;
  END IF;
  
  -- Insert the code
  INSERT INTO invite_codes (code, type, label, created_by, expires_at, max_uses, notes)
  VALUES (v_code, p_type, p_label, auth.uid(), v_expires_at, p_max_uses, p_notes);
  
  RETURN v_code;
END;
$$;

-- Create indexes
CREATE INDEX idx_invite_codes_code ON public.invite_codes(code);
CREATE INDEX idx_invite_codes_type ON public.invite_codes(type);
CREATE INDEX idx_invite_codes_active ON public.invite_codes(is_active) WHERE is_active = true;
CREATE INDEX idx_invite_redemptions_code_id ON public.invite_redemptions(code_id);
CREATE INDEX idx_invite_redemptions_user_id ON public.invite_redemptions(user_id);
CREATE INDEX idx_onboarding_feedback_user_id ON public.onboarding_feedback(user_id);

-- Seed initial admin code for cofounder
INSERT INTO invite_codes (code, type, label, max_uses, notes)
VALUES ('COFOUNDER-2025', 'admin', 'Cofounder Access', 1, 'Initial admin invite for cofounder');