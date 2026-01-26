-- Create pinned_quests table for "save for later" functionality
CREATE TABLE public.pinned_quests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  quest_id UUID NOT NULL REFERENCES public.quests(id) ON DELETE CASCADE,
  pinned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  notes TEXT,
  UNIQUE(user_id, quest_id)
);

-- Enable RLS
ALTER TABLE public.pinned_quests ENABLE ROW LEVEL SECURITY;

-- Users can manage their own pins
CREATE POLICY "Users can view own pins" ON public.pinned_quests
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can pin quests" ON public.pinned_quests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unpin quests" ON public.pinned_quests
  FOR DELETE USING (auth.uid() = user_id);

-- Index for efficient lookups
CREATE INDEX idx_pinned_quests_user ON public.pinned_quests(user_id);
CREATE INDEX idx_pinned_quests_quest ON public.pinned_quests(quest_id);