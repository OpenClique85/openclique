-- =============================================================================
-- SOCIAL IDENTITY MAPS & ADMIN AI CONTROL SYSTEM
-- =============================================================================

-- 1. AI Prompts with version control (Admin-controlled)
CREATE TABLE public.ai_prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_key TEXT UNIQUE NOT NULL,
  prompt_name TEXT NOT NULL,
  prompt_template TEXT NOT NULL,
  personality_context TEXT,
  version INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES public.profiles(id)
);

-- 2. AI Prompt version history for rollback
CREATE TABLE public.ai_prompt_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_id UUID REFERENCES public.ai_prompts(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  prompt_template TEXT NOT NULL,
  personality_context TEXT,
  changelog TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES public.profiles(id)
);

-- 3. Template variables available for prompts
CREATE TABLE public.ai_prompt_variables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_id UUID REFERENCES public.ai_prompts(id) ON DELETE CASCADE,
  variable_name TEXT NOT NULL,
  description TEXT,
  example_value JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Social Energy Map positions (user-adjustable)
CREATE TABLE public.user_social_energy (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
  energy_axis INTEGER DEFAULT 50 CHECK (energy_axis >= 0 AND energy_axis <= 100),
  structure_axis INTEGER DEFAULT 50 CHECK (structure_axis >= 0 AND structure_axis <= 100),
  focus_axis INTEGER DEFAULT 50 CHECK (focus_axis >= 0 AND focus_axis <= 100),
  source TEXT DEFAULT 'default',
  is_locked BOOLEAN DEFAULT false,
  visibility TEXT DEFAULT 'public' CHECK (visibility IN ('public', 'squad_only', 'private')),
  use_for_matching BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Squad appreciations / shout-outs
CREATE TABLE public.squad_appreciations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  to_user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  squad_id UUID REFERENCES public.quest_squads(id) ON DELETE CASCADE,
  quest_id UUID REFERENCES public.quests(id) ON DELETE SET NULL,
  appreciation_type TEXT NOT NULL,
  free_text TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(from_user_id, to_user_id, squad_id)
);

-- 6. Group role signals (aggregated from multiple sources)
CREATE TABLE public.user_role_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  role_type TEXT NOT NULL CHECK (role_type IN ('planner', 'connector', 'stabilizer', 'spark')),
  signal_source TEXT NOT NULL,
  source_id UUID,
  weight DECIMAL DEFAULT 1.0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 7. Identity timeline snapshots
CREATE TABLE public.identity_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  snapshot_type TEXT NOT NULL,
  snapshot_data JSONB NOT NULL,
  narrative TEXT,
  milestone_key TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 8. External personality types (user-submitted only)
CREATE TABLE public.user_personality_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  system TEXT NOT NULL CHECK (system IN ('mbti', 'enneagram', 'zodiac', 'strengthsfinder')),
  type_value TEXT NOT NULL,
  visibility TEXT DEFAULT 'private' CHECK (visibility IN ('public', 'squad_only', 'private')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, system)
);

-- 9. Wrapped cards storage
CREATE TABLE public.wrapped_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  card_type TEXT NOT NULL,
  card_data JSONB NOT NULL,
  card_narrative TEXT,
  generated_at TIMESTAMPTZ DEFAULT now(),
  is_included_in_share BOOLEAN DEFAULT true,
  milestone_trigger TEXT,
  period_start DATE,
  period_end DATE
);

-- 10. Personality type mappings (for AI translation)
CREATE TABLE public.personality_type_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  system TEXT NOT NULL,
  type_value TEXT NOT NULL,
  suggested_energy JSONB,
  quest_affinities TEXT[],
  role_tendencies TEXT[],
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(system, type_value)
);

-- Add use_for_matching to existing user_traits table
ALTER TABLE public.user_traits ADD COLUMN IF NOT EXISTS use_for_matching BOOLEAN DEFAULT true;

-- =============================================================================
-- RLS POLICIES
-- =============================================================================

-- AI Prompts (admin only for write, public read for active prompts)
ALTER TABLE public.ai_prompts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage ai_prompts"
  ON public.ai_prompts FOR ALL
  USING (public.is_admin());

CREATE POLICY "Anyone can read active prompts"
  ON public.ai_prompts FOR SELECT
  USING (is_active = true);

-- AI Prompt Versions (admin only)
ALTER TABLE public.ai_prompt_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage ai_prompt_versions"
  ON public.ai_prompt_versions FOR ALL
  USING (public.is_admin());

-- AI Prompt Variables (admin write, public read)
ALTER TABLE public.ai_prompt_variables ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage ai_prompt_variables"
  ON public.ai_prompt_variables FOR ALL
  USING (public.is_admin());

CREATE POLICY "Anyone can read prompt variables"
  ON public.ai_prompt_variables FOR SELECT
  USING (true);

-- User Social Energy (user owns their own)
ALTER TABLE public.user_social_energy ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own social energy"
  ON public.user_social_energy FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Public social energy is viewable"
  ON public.user_social_energy FOR SELECT
  USING (visibility = 'public');

-- Squad Appreciations
ALTER TABLE public.squad_appreciations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create appreciations they send"
  ON public.squad_appreciations FOR INSERT
  WITH CHECK (auth.uid() = from_user_id);

CREATE POLICY "Users can view appreciations they sent or received"
  ON public.squad_appreciations FOR SELECT
  USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);

-- User Role Signals
ALTER TABLE public.user_role_signals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own role signals"
  ON public.user_role_signals FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert role signals"
  ON public.user_role_signals FOR INSERT
  WITH CHECK (true);

-- Identity Snapshots (private)
ALTER TABLE public.identity_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own snapshots"
  ON public.identity_snapshots FOR ALL
  USING (auth.uid() = user_id);

-- User Personality Types
ALTER TABLE public.user_personality_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own personality types"
  ON public.user_personality_types FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Public personality types are viewable"
  ON public.user_personality_types FOR SELECT
  USING (visibility = 'public');

-- Wrapped Cards
ALTER TABLE public.wrapped_cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own wrapped cards"
  ON public.wrapped_cards FOR ALL
  USING (auth.uid() = user_id);

-- Personality Type Mappings (public read, admin write)
ALTER TABLE public.personality_type_mappings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read personality mappings"
  ON public.personality_type_mappings FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage personality mappings"
  ON public.personality_type_mappings FOR ALL
  USING (public.is_admin());

-- =============================================================================
-- INDEXES
-- =============================================================================

CREATE INDEX idx_user_social_energy_user ON public.user_social_energy(user_id);
CREATE INDEX idx_squad_appreciations_to_user ON public.squad_appreciations(to_user_id);
CREATE INDEX idx_squad_appreciations_squad ON public.squad_appreciations(squad_id);
CREATE INDEX idx_user_role_signals_user ON public.user_role_signals(user_id);
CREATE INDEX idx_user_role_signals_type ON public.user_role_signals(role_type);
CREATE INDEX idx_identity_snapshots_user ON public.identity_snapshots(user_id);
CREATE INDEX idx_wrapped_cards_user ON public.wrapped_cards(user_id);
CREATE INDEX idx_wrapped_cards_type ON public.wrapped_cards(card_type);
CREATE INDEX idx_ai_prompts_key ON public.ai_prompts(prompt_key);

-- =============================================================================
-- SEED DEFAULT AI PROMPTS
-- =============================================================================

INSERT INTO public.ai_prompts (prompt_key, prompt_name, prompt_template, personality_context, version) VALUES
('trait_inference', 'Trait Inference', 
'You are analyzing a user''s social preferences to suggest personality traits.

Available traits: {{trait_catalog}}
User preferences: {{user_preferences}}
Quest history summary: {{quest_history}}

Suggest 5-8 traits with confidence scores (0.0-1.0) and brief explanations.
Use tentative language. These are suggestions, not facts.
Focus on positive, actionable traits that help with group matching.

Output JSON array: [{trait_slug, confidence, explanation}]',
'You are Buggs, a friendly rabbit mascot. Be warm, encouraging, and never judgmental. Use "we noticed" not "you are".', 1),

('party_metaphor', 'Party Metaphor Generator',
'Generate a fun, light metaphor for how this user might show up at an OpenClique party.

User traits: {{user_traits}}
Social energy: {{social_energy}}
Role tendencies: {{role_tendencies}}

Create ONE sentence like: "You''d be the one [action]"
Keep it positive, playful, and relatable.
Never negative or awkward.

Output: {metaphor: string}',
'Be playful and clever but not cringey. Think "local guide" not "startup pitch".', 1),

('wrapped_narrative', 'Wrapped Card Narrative',
'Create a short, shareable narrative for a Wrapped-style identity card.

Card type: {{card_type}}
User data: {{card_data}}
Time period: {{period}}

Write 1-2 sentences that feel personal and celebratory.
Use "you" language. Make it feel like an achievement.
Keep it under 30 words.

Output: {headline: string, subtext: string}',
'Warm, confident, non-cringey. Think Spotify Wrapped meets local community.', 1),

('buggs_personality', 'Buggs Core Personality',
'Core personality traits for Buggs the rabbit mascot:
- Warm and encouraging
- Uses "we" language to feel collaborative
- Never judgmental or prescriptive
- Celebrates progress over perfection
- Uses gentle nudges, not commands
- Speaks like a friendly local guide
- Avoids startup jargon and Gen-Z slang
- Maximum enthusiasm level: 7/10 (confident but not hyper)',
NULL, 1),

('compatibility_patterns', 'Compatibility Pattern Analysis',
'Analyze this user''s squad history to identify compatibility patterns.

Squad experiences: {{squad_history}}
Comfort scores: {{comfort_data}}
Reconnect intents: {{reconnect_data}}

Identify patterns like:
- Preferred group size
- Role combinations that worked well
- Quest types where user thrived

Output patterns as observations, not prescriptions.
Use "you tend to" not "you should".

Output: {patterns: [{observation: string, confidence: number}]}',
'Be insightful but humble. These are patterns, not rules.', 1);

-- =============================================================================
-- TRIGGER FOR UPDATED_AT
-- =============================================================================

CREATE TRIGGER update_user_social_energy_updated_at
  BEFORE UPDATE ON public.user_social_energy
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ai_prompts_updated_at
  BEFORE UPDATE ON public.ai_prompts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_personality_types_updated_at
  BEFORE UPDATE ON public.user_personality_types
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();