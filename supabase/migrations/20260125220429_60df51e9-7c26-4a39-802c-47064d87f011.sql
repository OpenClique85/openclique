-- =============================================================================
-- PHASE 1: TRAIT SYSTEM + INTAKE - DATABASE SCHEMA
-- =============================================================================

-- 1. TRAIT LIBRARY - Admin-Managed Trait Catalog
-- =============================================================================
CREATE TABLE public.trait_library (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  category text NOT NULL,
  display_name text NOT NULL,
  description text,
  emoji text,
  is_negative boolean DEFAULT false,
  is_active boolean DEFAULT true,
  version integer DEFAULT 1,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.trait_library ENABLE ROW LEVEL SECURITY;

-- Everyone can read active traits
CREATE POLICY "Anyone can view active traits"
  ON public.trait_library FOR SELECT
  USING (is_active = true);

-- Admins can view all traits (including inactive)
CREATE POLICY "Admins can view all traits"
  ON public.trait_library FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Admins can insert traits
CREATE POLICY "Admins can create traits"
  ON public.trait_library FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Admins can update traits
CREATE POLICY "Admins can update traits"
  ON public.trait_library FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

-- Admins can delete traits
CREATE POLICY "Admins can delete traits"
  ON public.trait_library FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- Index for category filtering
CREATE INDEX idx_trait_library_category ON public.trait_library(category);
CREATE INDEX idx_trait_library_active ON public.trait_library(is_active);

-- 2. DRAFT TRAITS - AI-Generated Suggestions Pending Approval
-- =============================================================================
CREATE TABLE public.draft_traits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  trait_slug text REFERENCES public.trait_library(slug) ON DELETE CASCADE NOT NULL,
  source text NOT NULL CHECK (source IN ('intake', 'post_quest', 'monthly_refresh', 'admin_suggested')),
  source_id uuid,
  confidence numeric(3,2) CHECK (confidence >= 0 AND confidence <= 1),
  explanation text,
  decision_trace jsonb,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'expired')),
  ai_model text,
  ai_prompt_version text,
  created_at timestamptz DEFAULT now(),
  decided_at timestamptz,
  UNIQUE(user_id, trait_slug, source_id)
);

-- Enable RLS
ALTER TABLE public.draft_traits ENABLE ROW LEVEL SECURITY;

-- Users can view their own drafts
CREATE POLICY "Users can view own draft traits"
  ON public.draft_traits FOR SELECT
  USING (auth.uid() = user_id);

-- Admins can view all drafts
CREATE POLICY "Admins can view all draft traits"
  ON public.draft_traits FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Users can update their own drafts (accept/reject)
CREATE POLICY "Users can update own draft traits"
  ON public.draft_traits FOR UPDATE
  USING (auth.uid() = user_id);

-- Admins can update any draft
CREATE POLICY "Admins can update any draft trait"
  ON public.draft_traits FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

-- System inserts via service role (no policy needed for anon insert)

-- Indexes
CREATE INDEX idx_draft_traits_user ON public.draft_traits(user_id);
CREATE INDEX idx_draft_traits_status ON public.draft_traits(status);
CREATE INDEX idx_draft_traits_user_pending ON public.draft_traits(user_id) WHERE status = 'pending';

-- 3. USER TRAITS - Accepted Traits (User-Owned Identity)
-- =============================================================================
CREATE TABLE public.user_traits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  trait_slug text REFERENCES public.trait_library(slug) ON DELETE CASCADE NOT NULL,
  importance integer DEFAULT 50 CHECK (importance >= 1 AND importance <= 100),
  visibility text DEFAULT 'public' CHECK (visibility IN ('public', 'squad_only', 'private')),
  source text NOT NULL CHECK (source IN ('ai_inferred', 'user_selected', 'admin_assigned')),
  source_draft_id uuid REFERENCES public.draft_traits(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, trait_slug)
);

-- Enable RLS
ALTER TABLE public.user_traits ENABLE ROW LEVEL SECURITY;

-- Users can view their own traits
CREATE POLICY "Users can view own traits"
  ON public.user_traits FOR SELECT
  USING (auth.uid() = user_id);

-- Users can view public traits of others (for matching context)
CREATE POLICY "Users can view public traits of others"
  ON public.user_traits FOR SELECT
  USING (visibility = 'public');

-- Admins can view all traits
CREATE POLICY "Admins can view all user traits"
  ON public.user_traits FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Users can insert their own traits
CREATE POLICY "Users can add own traits"
  ON public.user_traits FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Admins can insert traits for any user
CREATE POLICY "Admins can add traits for any user"
  ON public.user_traits FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Users can update their own traits
CREATE POLICY "Users can update own traits"
  ON public.user_traits FOR UPDATE
  USING (auth.uid() = user_id);

-- Admins can update any trait
CREATE POLICY "Admins can update any user trait"
  ON public.user_traits FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

-- Users can delete their own traits
CREATE POLICY "Users can delete own traits"
  ON public.user_traits FOR DELETE
  USING (auth.uid() = user_id);

-- Admins can delete any trait
CREATE POLICY "Admins can delete any user trait"
  ON public.user_traits FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- Indexes
CREATE INDEX idx_user_traits_user ON public.user_traits(user_id);
CREATE INDEX idx_user_traits_slug ON public.user_traits(trait_slug);
CREATE INDEX idx_user_traits_visibility ON public.user_traits(visibility);

-- 4. AI INFERENCE LOG - Complete Audit Trail
-- =============================================================================
CREATE TABLE public.ai_inference_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  run_type text NOT NULL CHECK (run_type IN ('intake', 'post_quest', 'admin_rerun', 'monthly_refresh')),
  source_id uuid,
  input_snapshot jsonb NOT NULL,
  prompt_version text NOT NULL,
  model_used text NOT NULL,
  raw_output jsonb NOT NULL,
  traits_suggested text[] NOT NULL,
  decision_traces jsonb NOT NULL,
  tokens_used integer,
  created_at timestamptz DEFAULT now(),
  admin_triggered_by uuid REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.ai_inference_log ENABLE ROW LEVEL SECURITY;

-- Only admins can view inference logs
CREATE POLICY "Admins can view all inference logs"
  ON public.ai_inference_log FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- System inserts via service role

-- Indexes
CREATE INDEX idx_ai_inference_log_user ON public.ai_inference_log(user_id);
CREATE INDEX idx_ai_inference_log_type ON public.ai_inference_log(run_type);
CREATE INDEX idx_ai_inference_log_created ON public.ai_inference_log(created_at DESC);

-- 5. UPDATED_AT TRIGGERS
-- =============================================================================
CREATE TRIGGER update_trait_library_updated_at
  BEFORE UPDATE ON public.trait_library
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_traits_updated_at
  BEFORE UPDATE ON public.user_traits
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 6. SEED INITIAL TRAIT LIBRARY
-- =============================================================================
INSERT INTO public.trait_library (slug, category, display_name, description, emoji) VALUES
-- Social Energy
('cozy_energy', 'social_energy', 'Thrives in small, cozy groups', 'You feel most comfortable and connected in intimate settings with just a few people.', '🏠'),
('balanced_energy', 'social_energy', 'Enjoys a mix of calm and lively', 'You''re adaptable and enjoy both quiet hangouts and more energetic gatherings.', '⚖️'),
('high_energy', 'social_energy', 'Feeds off lively, social settings', 'You come alive in vibrant, bustling environments with lots of people.', '⚡'),

-- Planning Style
('spontaneous_spirit', 'planning_style', 'Likes to decide in the moment', 'You prefer flexibility and going with the flow rather than rigid plans.', '🎲'),
('light_planner', 'planning_style', 'Prefers a loose plan', 'You like having a general idea but staying open to changes.', '📝'),
('structured_planner', 'planning_style', 'Feels best with clarity and structure', 'You appreciate knowing the details and having a clear plan.', '📋'),

-- Conversation Style
('deep_talker', 'conversation_style', 'Enjoys meaningful conversations', 'You love diving into topics that matter and having real, substantive discussions.', '💭'),
('playful_banter', 'conversation_style', 'Connects through humor and play', 'You bond best through jokes, teasing, and lighthearted exchanges.', '😄'),
('activity_first', 'conversation_style', 'Bonds best while doing something', 'You connect naturally when there''s a shared activity to focus on.', '🎯'),

-- Pace & Intensity
('slow_savorer', 'pace_intensity', 'Enjoys taking things slow', 'You prefer a relaxed pace that allows you to fully experience each moment.', '🐢'),
('steady_pacer', 'pace_intensity', 'Comfortable at a moderate pace', 'You like a balanced rhythm that''s neither rushed nor too slow.', '🚶'),
('go_getter', 'pace_intensity', 'Likes momentum and energy', 'You thrive when there''s forward motion and things are happening.', '🚀'),

-- Adventure Preference
('foodie_explorer', 'adventure_preference', 'Loves discovering food experiences', 'You''re drawn to culinary adventures, new restaurants, and food culture.', '🍽️'),
('culture_seeker', 'adventure_preference', 'Drawn to arts and culture', 'You love museums, galleries, live performances, and cultural events.', '🎭'),
('outdoorsy', 'adventure_preference', 'Happiest in nature', 'You feel most alive when you''re outside, whether hiking, biking, or exploring.', '🏕️'),
('music_driven', 'adventure_preference', 'Connects through music', 'Live shows, concerts, and musical experiences light you up.', '🎵'),
('cozy_chill', 'adventure_preference', 'Prefers low-key hangouts', 'You love relaxed settings like coffee shops, game nights, or chill gatherings.', '☕'),

-- Risk & Novelty
('comfort_seeker', 'risk_novelty', 'Prefers familiar experiences', 'You enjoy the comfort of known places and activities.', '🏡'),
('balanced_explorer', 'risk_novelty', 'Open to new with some familiar', 'You like mixing new experiences with comfortable favorites.', '🧭'),
('novelty_hunter', 'risk_novelty', 'Always seeking new experiences', 'You''re excited by the unknown and love trying things you''ve never done.', '🔮'),

-- Group Roles (Emergent)
('planner_energy', 'group_role', 'Naturally organizes details', 'You tend to take initiative in coordinating logistics and keeping things on track.', '📅'),
('connector_energy', 'group_role', 'Helps people feel included', 'You naturally notice who might be left out and work to bring everyone in.', '🤝'),
('stabilizer_energy', 'group_role', 'Grounding, calm presence', 'You bring a steady, reassuring energy that helps the group feel at ease.', '⚓'),
('spark_energy', 'group_role', 'Brings excitement and momentum', 'You''re the one who suggests the next thing and keeps energy high.', '✨');

-- Note: Earned Identity Badges will be added as a separate badge_library table in Phase 4