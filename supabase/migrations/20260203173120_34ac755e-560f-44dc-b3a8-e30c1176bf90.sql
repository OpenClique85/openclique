-- Create user_follows table for following creators and sponsors
CREATE TABLE public.user_follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Polymorphic target: either a creator OR a sponsor (not both)
  creator_id UUID REFERENCES public.creator_profiles(id) ON DELETE CASCADE,
  sponsor_id UUID REFERENCES public.sponsor_profiles(id) ON DELETE CASCADE,
  
  -- Notification preferences (future opt-in)
  notify_new_quests BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  
  -- Constraints
  CONSTRAINT follow_has_target CHECK (
    (creator_id IS NOT NULL AND sponsor_id IS NULL) OR
    (creator_id IS NULL AND sponsor_id IS NOT NULL)
  ),
  CONSTRAINT unique_creator_follow UNIQUE (follower_id, creator_id),
  CONSTRAINT unique_sponsor_follow UNIQUE (follower_id, sponsor_id)
);

-- Indexes for fast lookups
CREATE INDEX idx_user_follows_follower ON public.user_follows(follower_id);
CREATE INDEX idx_user_follows_creator ON public.user_follows(creator_id) WHERE creator_id IS NOT NULL;
CREATE INDEX idx_user_follows_sponsor ON public.user_follows(sponsor_id) WHERE sponsor_id IS NOT NULL;

-- Enable Row Level Security
ALTER TABLE public.user_follows ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Anyone can read follower counts (for public profile display)
CREATE POLICY "Anyone can view follows for counts"
  ON public.user_follows FOR SELECT
  USING (true);

-- Users can insert their own follows
CREATE POLICY "Users can follow"
  ON public.user_follows FOR INSERT
  WITH CHECK (follower_id = auth.uid());

-- Users can update their own follows (e.g., notification preferences)
CREATE POLICY "Users can update own follows"
  ON public.user_follows FOR UPDATE
  USING (follower_id = auth.uid());

-- Users can unfollow (delete their own follows)
CREATE POLICY "Users can unfollow"
  ON public.user_follows FOR DELETE
  USING (follower_id = auth.uid());

-- Function to get creator follower count
CREATE OR REPLACE FUNCTION public.get_creator_follower_count(p_creator_id UUID)
RETURNS BIGINT AS $$
  SELECT COUNT(*) FROM public.user_follows WHERE creator_id = p_creator_id;
$$ LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public;

-- Function to get sponsor follower count
CREATE OR REPLACE FUNCTION public.get_sponsor_follower_count(p_sponsor_id UUID)
RETURNS BIGINT AS $$
  SELECT COUNT(*) FROM public.user_follows WHERE sponsor_id = p_sponsor_id;
$$ LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public;