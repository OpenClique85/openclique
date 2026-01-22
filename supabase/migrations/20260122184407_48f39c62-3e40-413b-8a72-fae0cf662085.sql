-- ============================================
-- QUEST SYSTEM EXPANSION MIGRATION
-- ============================================

-- 1. Add new columns to quests table
-- ============================================

-- Date range support
ALTER TABLE public.quests ADD COLUMN IF NOT EXISTS end_datetime timestamptz;

-- Quest categorization
ALTER TABLE public.quests ADD COLUMN IF NOT EXISTS progression_tree text CHECK (progression_tree IN ('culture', 'wellness', 'connector'));
ALTER TABLE public.quests ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}';
ALTER TABLE public.quests ADD COLUMN IF NOT EXISTS theme text;
ALTER TABLE public.quests ADD COLUMN IF NOT EXISTS theme_color text DEFAULT 'pink' CHECK (theme_color IN ('pink', 'green', 'amber', 'purple'));

-- User-facing content
ALTER TABLE public.quests ADD COLUMN IF NOT EXISTS short_description text;
ALTER TABLE public.quests ADD COLUMN IF NOT EXISTS rewards text;
ALTER TABLE public.quests ADD COLUMN IF NOT EXISTS cost_description text DEFAULT 'Free';
ALTER TABLE public.quests ADD COLUMN IF NOT EXISTS image_url text;

-- Admin-only internal fields
ALTER TABLE public.quests ADD COLUMN IF NOT EXISTS objectives text;
ALTER TABLE public.quests ADD COLUMN IF NOT EXISTS success_criteria text;

-- 2. Create referrals table for tracking shares
-- ============================================

CREATE TABLE IF NOT EXISTS public.referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_user_id uuid NOT NULL,
  quest_id uuid NOT NULL REFERENCES public.quests(id) ON DELETE CASCADE,
  referral_code text UNIQUE NOT NULL,
  referred_user_id uuid,
  clicked_at timestamptz,
  signed_up_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_referrals_code ON public.referrals(referral_code);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON public.referrals(referrer_user_id, quest_id);
CREATE INDEX IF NOT EXISTS idx_referrals_quest ON public.referrals(quest_id);

-- Enable RLS on referrals
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

-- RLS policies for referrals
CREATE POLICY "Users can view their own referrals"
  ON public.referrals FOR SELECT
  USING (auth.uid() = referrer_user_id);

CREATE POLICY "Users can create their own referrals"
  ON public.referrals FOR INSERT
  WITH CHECK (auth.uid() = referrer_user_id);

CREATE POLICY "Admins can view all referrals"
  ON public.referrals FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Admins can update referrals"
  ON public.referrals FOR UPDATE
  USING (public.is_admin());

CREATE POLICY "Anyone can update referral clicks"
  ON public.referrals FOR UPDATE
  USING (true)
  WITH CHECK (
    -- Only allow updating clicked_at, referred_user_id, signed_up_at
    referrer_user_id = referrer_user_id AND
    quest_id = quest_id AND
    referral_code = referral_code
  );

-- 3. Create storage bucket for quest images
-- ============================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('quest-images', 'quest-images', true)
ON CONFLICT (id) DO NOTHING;

-- RLS: Anyone can view quest images (public bucket)
CREATE POLICY "Public can view quest images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'quest-images');

-- RLS: Admins can upload quest images
CREATE POLICY "Admins can upload quest images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'quest-images' AND public.is_admin());

-- RLS: Admins can update quest images
CREATE POLICY "Admins can update quest images"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'quest-images' AND public.is_admin());

-- RLS: Admins can delete quest images
CREATE POLICY "Admins can delete quest images"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'quest-images' AND public.is_admin());