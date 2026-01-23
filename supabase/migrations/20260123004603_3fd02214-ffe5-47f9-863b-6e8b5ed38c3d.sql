-- =============================================
-- LEARNING ENGINE: XP & Feedback System Tables
-- =============================================

-- 1. User XP totals
CREATE TABLE public.user_xp (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  total_xp INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.user_xp ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own XP" ON public.user_xp
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own XP" ON public.user_xp
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own XP" ON public.user_xp
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all XP" ON public.user_xp
  FOR ALL USING (is_admin());

-- 2. XP transaction log
CREATE TABLE public.xp_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  amount INTEGER NOT NULL,
  source TEXT NOT NULL, -- 'feedback_basic', 'feedback_extended', 'feedback_pricing', 'feedback_testimonial', 'quest_complete'
  source_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.xp_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own transactions" ON public.xp_transactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all transactions" ON public.xp_transactions
  FOR ALL USING (is_admin());

-- System can insert via service role, users via their own id
CREATE POLICY "Users can insert their own transactions" ON public.xp_transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 3. Admin-triggered feedback requests
CREATE TABLE public.feedback_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quest_id UUID NOT NULL REFERENCES public.quests(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, basic_complete, extended_complete, pricing_complete, full_complete
  admin_message TEXT,
  xp_basic INTEGER NOT NULL DEFAULT 25,
  xp_extended INTEGER NOT NULL DEFAULT 50,
  xp_pricing INTEGER NOT NULL DEFAULT 50,
  xp_testimonial INTEGER NOT NULL DEFAULT 100,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  UNIQUE(quest_id, user_id)
);

ALTER TABLE public.feedback_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own feedback requests" ON public.feedback_requests
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own feedback requests" ON public.feedback_requests
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all feedback requests" ON public.feedback_requests
  FOR ALL USING (is_admin());

-- 4. Quest design feedback (step 2)
CREATE TABLE public.feedback_quest_design (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feedback_id UUID NOT NULL REFERENCES public.feedback(id) ON DELETE CASCADE,
  worked_well TEXT[] DEFAULT '{}',
  worked_poorly TEXT[] DEFAULT '{}',
  length_rating TEXT, -- 'too_short', 'just_right', 'too_long'
  confusion_notes TEXT,
  comfort_score INTEGER, -- 1-5
  group_fit TEXT, -- 'yes', 'okay', 'not_really'
  reconnect_intent TEXT, -- 'whole_group', 'some_people', 'no', 'not_sure'
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.feedback_quest_design ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own quest design feedback" ON public.feedback_quest_design
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.feedback f 
      WHERE f.id = feedback_quest_design.feedback_id 
      AND f.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own quest design feedback" ON public.feedback_quest_design
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.feedback f 
      WHERE f.id = feedback_quest_design.feedback_id 
      AND f.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all quest design feedback" ON public.feedback_quest_design
  FOR ALL USING (is_admin());

-- 5. Pricing/willingness-to-pay feedback (step 3)
CREATE TABLE public.feedback_pricing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feedback_id UUID NOT NULL REFERENCES public.feedback(id) ON DELETE CASCADE,
  pricing_model_preference TEXT, -- 'per_quest', 'subscription', 'freemium', 'sponsor_supported'
  too_cheap_price TEXT, -- '$0', '$5', '$8', '$12', '$20+'
  fair_price TEXT,
  expensive_price TEXT,
  too_expensive_price TEXT,
  value_drivers TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.feedback_pricing ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own pricing feedback" ON public.feedback_pricing
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.feedback f 
      WHERE f.id = feedback_pricing.feedback_id 
      AND f.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own pricing feedback" ON public.feedback_pricing
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.feedback f 
      WHERE f.id = feedback_pricing.feedback_id 
      AND f.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all pricing feedback" ON public.feedback_pricing
  FOR ALL USING (is_admin());

-- 6. Alter existing feedback table for new fields
ALTER TABLE public.feedback 
  ADD COLUMN IF NOT EXISTS consent_type TEXT, -- 'anonymous', 'first_name_city'
  ADD COLUMN IF NOT EXISTS recommendation_text TEXT,
  ADD COLUMN IF NOT EXISTS feelings TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS interview_opt_in BOOLEAN DEFAULT false;

-- 7. Add city to profiles for testimonial attribution
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS city TEXT DEFAULT 'Austin';

-- 8. Function to award XP and update totals
CREATE OR REPLACE FUNCTION public.award_xp(
  p_user_id UUID,
  p_amount INTEGER,
  p_source TEXT,
  p_source_id UUID DEFAULT NULL
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_total INTEGER;
BEGIN
  -- Insert transaction
  INSERT INTO xp_transactions (user_id, amount, source, source_id)
  VALUES (p_user_id, p_amount, p_source, p_source_id);
  
  -- Upsert user_xp
  INSERT INTO user_xp (user_id, total_xp, updated_at)
  VALUES (p_user_id, p_amount, now())
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    total_xp = user_xp.total_xp + p_amount,
    updated_at = now()
  RETURNING total_xp INTO new_total;
  
  RETURN new_total;
END;
$$;

-- 9. Trigger for updated_at on user_xp
CREATE TRIGGER update_user_xp_updated_at
  BEFORE UPDATE ON public.user_xp
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();