-- =============================================================================
-- EMERGING TRAITS SYSTEM
-- Captures AI-detected or user-suggested traits for admin review
-- =============================================================================

-- Table for emerging trait proposals
CREATE TABLE public.emerging_trait_proposals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Proposed trait metadata (AI-suggested or manually filled)
  proposed_slug text NOT NULL,
  proposed_category text NOT NULL,
  proposed_display_name text NOT NULL,
  proposed_description text,
  proposed_emoji text,
  
  -- Detection metadata
  detection_source text NOT NULL CHECK (detection_source IN ('ai_pattern', 'user_request', 'admin_suggestion', 'feedback_analysis')),
  trigger_criteria text[],  -- e.g., ['frequency_threshold', 'ai_confidence_gap']
  
  -- Evidence
  evidence_samples jsonb DEFAULT '[]'::jsonb,  -- Anonymized quotes/preferences that triggered this
  frequency_count integer DEFAULT 0,  -- How many times this pattern was detected
  ai_confidence_gaps jsonb DEFAULT '[]'::jsonb,  -- Log entries where AI wanted to assign unmapped trait
  
  -- Impact analysis
  potential_user_count integer DEFAULT 0,  -- Estimated users who might match this trait
  similar_existing_traits text[],  -- Traits that might overlap
  
  -- Status
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'declined', 'merged')),
  reviewed_by uuid REFERENCES auth.users(id),
  reviewed_at timestamptz,
  review_notes text,
  merged_into_trait_slug text REFERENCES public.trait_library(slug),  -- If declined as duplicate
  
  -- Result
  created_trait_id uuid REFERENCES public.trait_library(id),  -- If approved
  retroactive_drafts_created integer,  -- Count of drafts generated after approval
  
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  
  UNIQUE(proposed_slug)
);

-- RLS policies
ALTER TABLE public.emerging_trait_proposals ENABLE ROW LEVEL SECURITY;

-- Admin can do everything
CREATE POLICY "Admins have full access to emerging trait proposals"
  ON public.emerging_trait_proposals
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_roles.user_id = auth.uid() 
      AND user_roles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_roles.user_id = auth.uid() 
      AND user_roles.role = 'admin'
    )
  );

-- Add version history tracking to trait_library
ALTER TABLE public.trait_library 
  ADD COLUMN IF NOT EXISTS changelog jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS last_modified_by uuid REFERENCES auth.users(id);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_emerging_proposals_status ON public.emerging_trait_proposals(status);
CREATE INDEX IF NOT EXISTS idx_emerging_proposals_detection ON public.emerging_trait_proposals(detection_source);

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_emerging_proposals_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_emerging_trait_proposals_timestamp
  BEFORE UPDATE ON public.emerging_trait_proposals
  FOR EACH ROW
  EXECUTE FUNCTION public.update_emerging_proposals_updated_at();