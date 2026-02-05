-- Create clique_save_requests table for mutual member selection
CREATE TABLE public.clique_save_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id uuid NOT NULL REFERENCES public.quest_instances(id) ON DELETE CASCADE,
  squad_id uuid NOT NULL REFERENCES public.squads(id) ON DELETE CASCADE,
  requester_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  selected_member_ids uuid[] NOT NULL DEFAULT '{}',
  wants_to_save boolean NOT NULL DEFAULT true,
  premium_acknowledged boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  processed_at timestamptz,
  UNIQUE(instance_id, requester_id)
);

-- Enable RLS
ALTER TABLE public.clique_save_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own save requests"
ON public.clique_save_requests FOR SELECT
USING (requester_id = auth.uid());

CREATE POLICY "Users can create own save requests"
ON public.clique_save_requests FOR INSERT
WITH CHECK (requester_id = auth.uid());

CREATE POLICY "Users can update own unprocessed save requests"
ON public.clique_save_requests FOR UPDATE
USING (requester_id = auth.uid() AND processed_at IS NULL);

-- Add completion_xp_awarded column to quest_signups
ALTER TABLE public.quest_signups
ADD COLUMN IF NOT EXISTS completion_xp_awarded boolean DEFAULT false;

-- Add index for efficient lookups
CREATE INDEX idx_clique_save_requests_instance ON public.clique_save_requests(instance_id);
CREATE INDEX idx_clique_save_requests_squad ON public.clique_save_requests(squad_id);
CREATE INDEX idx_clique_save_requests_unprocessed ON public.clique_save_requests(processed_at) WHERE processed_at IS NULL;