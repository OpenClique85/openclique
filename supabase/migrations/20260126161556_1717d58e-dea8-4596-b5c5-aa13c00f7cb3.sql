-- Phase 1: AI-Assisted Quest Creation Schema Extensions (Complete)

-- 1.1 Create enum types for quest_objectives
CREATE TYPE public.quest_objective_type AS ENUM ('checkin', 'photo', 'qr', 'task', 'discussion', 'purchase_optional', 'travel');
CREATE TYPE public.quest_completion_rule AS ENUM ('all_members', 'majority', 'any_member', 'per_member');
CREATE TYPE public.quest_proof_type AS ENUM ('none', 'photo', 'qr', 'geo', 'text_confirmation');

-- 1.2 Create enum types for quest_roles
CREATE TYPE public.quest_role_name AS ENUM ('Navigator', 'Timekeeper', 'Vibe Curator', 'Photographer', 'Connector', 'Wildcard');

-- 1.3 Create enum types for quest_constraints
CREATE TYPE public.quest_alcohol_level AS ENUM ('none', 'optional', 'primary');
CREATE TYPE public.quest_age_requirement AS ENUM ('all_ages', '18_plus', '21_plus');
CREATE TYPE public.quest_intensity_level AS ENUM ('low', 'medium', 'high');
CREATE TYPE public.quest_social_intensity AS ENUM ('chill', 'moderate', 'high');
CREATE TYPE public.quest_noise_level AS ENUM ('quiet', 'moderate', 'loud');
CREATE TYPE public.quest_time_of_day AS ENUM ('morning', 'afternoon', 'evening', 'late_night', 'flex');
CREATE TYPE public.quest_indoor_outdoor AS ENUM ('indoor', 'outdoor', 'mixed');
CREATE TYPE public.quest_accessibility_level AS ENUM ('unknown', 'wheelchair_friendly', 'not_wheelchair_friendly', 'mixed');
CREATE TYPE public.quest_budget_level AS ENUM ('free', 'low', 'medium', 'high', 'mixed');
CREATE TYPE public.quest_safety_level AS ENUM ('public_only', 'mixed', 'private_ok_with_host');

-- 1.4 Create enum types for quests table extensions
CREATE TYPE public.quest_event_source AS ENUM ('manual', 'eventbrite');
CREATE TYPE public.quest_price_type AS ENUM ('free', 'paid', 'mixed');

-- 2.1 Create quest_objectives table
CREATE TABLE public.quest_objectives (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  quest_id UUID NOT NULL REFERENCES public.quests(id) ON DELETE CASCADE,
  objective_order INT NOT NULL DEFAULT 1,
  objective_text TEXT NOT NULL,
  objective_type public.quest_objective_type NOT NULL DEFAULT 'task',
  completion_rule public.quest_completion_rule NOT NULL DEFAULT 'all_members',
  proof_type public.quest_proof_type NOT NULL DEFAULT 'none',
  is_required BOOLEAN NOT NULL DEFAULT true,
  ai_generated BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2.2 Create quest_roles table
CREATE TABLE public.quest_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  quest_id UUID NOT NULL REFERENCES public.quests(id) ON DELETE CASCADE,
  role_name public.quest_role_name NOT NULL,
  role_description TEXT,
  ai_generated BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2.3 Create quest_constraints table (one per quest)
CREATE TABLE public.quest_constraints (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  quest_id UUID NOT NULL UNIQUE REFERENCES public.quests(id) ON DELETE CASCADE,
  alcohol public.quest_alcohol_level NOT NULL DEFAULT 'none',
  age_requirement public.quest_age_requirement NOT NULL DEFAULT 'all_ages',
  physical_intensity public.quest_intensity_level NOT NULL DEFAULT 'medium',
  social_intensity public.quest_social_intensity NOT NULL DEFAULT 'moderate',
  noise_level public.quest_noise_level NOT NULL DEFAULT 'moderate',
  time_of_day public.quest_time_of_day NOT NULL DEFAULT 'flex',
  indoor_outdoor public.quest_indoor_outdoor NOT NULL DEFAULT 'mixed',
  accessibility_level public.quest_accessibility_level NOT NULL DEFAULT 'unknown',
  budget_level public.quest_budget_level NOT NULL DEFAULT 'free',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2.4 Create quest_personality_affinity table
CREATE TABLE public.quest_personality_affinity (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  quest_id UUID NOT NULL REFERENCES public.quests(id) ON DELETE CASCADE,
  trait_key TEXT NOT NULL,
  trait_weight INT NOT NULL DEFAULT 50 CHECK (trait_weight >= 0 AND trait_weight <= 100),
  explanation TEXT,
  ai_generated BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(quest_id, trait_key)
);

-- 3.1 Extend quests table with new columns
ALTER TABLE public.quests
  ADD COLUMN IF NOT EXISTS short_teaser TEXT,
  ADD COLUMN IF NOT EXISTS event_source public.quest_event_source DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS price_type public.quest_price_type DEFAULT 'free',
  ADD COLUMN IF NOT EXISTS estimated_cost_min NUMERIC,
  ADD COLUMN IF NOT EXISTS estimated_cost_max NUMERIC,
  ADD COLUMN IF NOT EXISTS safety_level public.quest_safety_level DEFAULT 'public_only',
  ADD COLUMN IF NOT EXISTS creator_notes TEXT,
  ADD COLUMN IF NOT EXISTS ai_generated BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS ai_version TEXT,
  ADD COLUMN IF NOT EXISTS ai_draft_applied_at TIMESTAMPTZ;

-- 4.1 Create indexes for performance
CREATE INDEX idx_quest_objectives_quest_id ON public.quest_objectives(quest_id);
CREATE INDEX idx_quest_objectives_order ON public.quest_objectives(quest_id, objective_order);
CREATE INDEX idx_quest_roles_quest_id ON public.quest_roles(quest_id);
CREATE INDEX idx_quest_constraints_quest_id ON public.quest_constraints(quest_id);
CREATE INDEX idx_quest_personality_affinity_quest_id ON public.quest_personality_affinity(quest_id);
CREATE INDEX idx_quest_personality_affinity_trait ON public.quest_personality_affinity(trait_key);

-- 5.1 Enable RLS on new tables
ALTER TABLE public.quest_objectives ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quest_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quest_constraints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quest_personality_affinity ENABLE ROW LEVEL SECURITY;

-- 5.2 RLS Policies for quest_objectives
CREATE POLICY "Creators can manage objectives for their own quests"
  ON public.quest_objectives
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.quests q
      WHERE q.id = quest_objectives.quest_id
      AND q.creator_id = auth.uid()
      AND q.review_status IN ('draft', 'needs_changes')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.quests q
      WHERE q.id = quest_objectives.quest_id
      AND q.creator_id = auth.uid()
      AND q.review_status IN ('draft', 'needs_changes')
    )
  );

CREATE POLICY "Admins can manage all quest objectives"
  ON public.quest_objectives
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role = 'admin'
    )
  );

CREATE POLICY "Public can view objectives for published quests"
  ON public.quest_objectives
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.quests q
      WHERE q.id = quest_objectives.quest_id
      AND q.status = 'open'
      AND q.review_status = 'approved'
    )
  );

-- 5.3 RLS Policies for quest_roles
CREATE POLICY "Creators can manage roles for their own quests"
  ON public.quest_roles
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.quests q
      WHERE q.id = quest_roles.quest_id
      AND q.creator_id = auth.uid()
      AND q.review_status IN ('draft', 'needs_changes')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.quests q
      WHERE q.id = quest_roles.quest_id
      AND q.creator_id = auth.uid()
      AND q.review_status IN ('draft', 'needs_changes')
    )
  );

CREATE POLICY "Admins can manage all quest roles"
  ON public.quest_roles
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role = 'admin'
    )
  );

CREATE POLICY "Public can view roles for published quests"
  ON public.quest_roles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.quests q
      WHERE q.id = quest_roles.quest_id
      AND q.status = 'open'
      AND q.review_status = 'approved'
    )
  );

-- 5.4 RLS Policies for quest_constraints
CREATE POLICY "Creators can manage constraints for their own quests"
  ON public.quest_constraints
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.quests q
      WHERE q.id = quest_constraints.quest_id
      AND q.creator_id = auth.uid()
      AND q.review_status IN ('draft', 'needs_changes')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.quests q
      WHERE q.id = quest_constraints.quest_id
      AND q.creator_id = auth.uid()
      AND q.review_status IN ('draft', 'needs_changes')
    )
  );

CREATE POLICY "Admins can manage all quest constraints"
  ON public.quest_constraints
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role = 'admin'
    )
  );

CREATE POLICY "Public can view constraints for published quests"
  ON public.quest_constraints
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.quests q
      WHERE q.id = quest_constraints.quest_id
      AND q.status = 'open'
      AND q.review_status = 'approved'
    )
  );

-- 5.5 RLS Policies for quest_personality_affinity
CREATE POLICY "Creators can manage affinities for their own quests"
  ON public.quest_personality_affinity
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.quests q
      WHERE q.id = quest_personality_affinity.quest_id
      AND q.creator_id = auth.uid()
      AND q.review_status IN ('draft', 'needs_changes')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.quests q
      WHERE q.id = quest_personality_affinity.quest_id
      AND q.creator_id = auth.uid()
      AND q.review_status IN ('draft', 'needs_changes')
    )
  );

CREATE POLICY "Admins can manage all quest affinities"
  ON public.quest_personality_affinity
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role = 'admin'
    )
  );

CREATE POLICY "Public can view affinities for published quests"
  ON public.quest_personality_affinity
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.quests q
      WHERE q.id = quest_personality_affinity.quest_id
      AND q.status = 'open'
      AND q.review_status = 'approved'
    )
  );

-- 6.1 Create updated_at triggers for new tables
CREATE TRIGGER update_quest_objectives_updated_at
  BEFORE UPDATE ON public.quest_objectives
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_quest_constraints_updated_at
  BEFORE UPDATE ON public.quest_constraints
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();