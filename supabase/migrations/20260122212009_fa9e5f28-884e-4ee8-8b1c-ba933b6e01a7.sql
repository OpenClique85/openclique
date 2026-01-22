-- ============================================================================
-- CREATOR PORTAL DATABASE SCHEMA - Part 2: Tables and Policies
-- ============================================================================

-- 1. Create creator_profiles table for extended creator info
CREATE TABLE IF NOT EXISTS public.creator_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  display_name text NOT NULL,
  bio text,
  city text DEFAULT 'Austin',
  photo_url text,
  socials jsonb DEFAULT '{}'::jsonb,
  payout_placeholder jsonb DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'suspended')),
  invited_at timestamptz,
  onboarded_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 2. Create creator_invites table for token-based invitations
CREATE TABLE IF NOT EXISTS public.creator_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  token text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  invited_by uuid NOT NULL,
  application_id uuid REFERENCES public.creator_applications(id) ON DELETE SET NULL,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  redeemed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 3. Extend quests table with creator ownership and review workflow
ALTER TABLE public.quests 
  ADD COLUMN IF NOT EXISTS creator_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS review_status review_status DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS admin_notes text,
  ADD COLUMN IF NOT EXISTS revision_count integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS submitted_at timestamptz,
  ADD COLUMN IF NOT EXISTS published_at timestamptz;

-- 4. Extend feedback table with testimonial support
ALTER TABLE public.feedback
  ADD COLUMN IF NOT EXISTS testimonial_text text,
  ADD COLUMN IF NOT EXISTS is_testimonial_approved boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS private_notes text;

-- 5. Enable RLS on new tables
ALTER TABLE public.creator_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creator_invites ENABLE ROW LEVEL SECURITY;

-- 6. RLS policies for creator_profiles
CREATE POLICY "Creators can view their own profile"
  ON public.creator_profiles
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Creators can update their own profile"
  ON public.creator_profiles
  FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Creators can insert their own profile"
  ON public.creator_profiles
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can view all creator profiles"
  ON public.creator_profiles
  FOR SELECT
  USING (is_admin());

CREATE POLICY "Admins can update creator profiles"
  ON public.creator_profiles
  FOR UPDATE
  USING (is_admin());

-- 7. RLS policies for creator_invites
CREATE POLICY "Admins can manage creator invites"
  ON public.creator_invites
  FOR ALL
  USING (is_admin());

-- Allow public to check if a token is valid (read-only for token verification)
CREATE POLICY "Anyone can verify invite tokens"
  ON public.creator_invites
  FOR SELECT
  USING (token IS NOT NULL AND redeemed_at IS NULL AND expires_at > now());

-- 8. Update quests RLS to allow creators to manage their own quests
CREATE POLICY "Creators can insert their own quests"
  ON public.quests
  FOR INSERT
  WITH CHECK (
    creator_id = auth.uid() 
    AND has_role(auth.uid(), 'quest_creator')
  );

CREATE POLICY "Creators can update their own draft or needs_changes quests"
  ON public.quests
  FOR UPDATE
  USING (
    creator_id = auth.uid() 
    AND has_role(auth.uid(), 'quest_creator')
    AND review_status IN ('draft', 'needs_changes')
  );

CREATE POLICY "Creators can view their own quests"
  ON public.quests
  FOR SELECT
  USING (creator_id = auth.uid());

-- 9. Create updated_at trigger for creator_profiles
CREATE TRIGGER update_creator_profiles_updated_at
  BEFORE UPDATE ON public.creator_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- 10. Create indexes for faster lookup
CREATE INDEX IF NOT EXISTS idx_quests_creator_id ON public.quests(creator_id);
CREATE INDEX IF NOT EXISTS idx_quests_review_status ON public.quests(review_status);
CREATE INDEX IF NOT EXISTS idx_creator_profiles_user_id ON public.creator_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_creator_invites_token ON public.creator_invites(token);
CREATE INDEX IF NOT EXISTS idx_creator_invites_email ON public.creator_invites(email);