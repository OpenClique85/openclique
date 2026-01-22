-- Add creator attribution fields to quests table
ALTER TABLE public.quests ADD COLUMN IF NOT EXISTS creator_type TEXT DEFAULT 'openclique' CHECK (creator_type IN ('openclique', 'community', 'partner'));
ALTER TABLE public.quests ADD COLUMN IF NOT EXISTS creator_name TEXT;
ALTER TABLE public.quests ADD COLUMN IF NOT EXISTS creator_social_url TEXT;

-- Create a view for quest ratings aggregation
CREATE OR REPLACE VIEW public.quest_ratings AS
SELECT 
  quest_id,
  COUNT(*) as review_count,
  ROUND(AVG(rating_1_5)::numeric, 1) as avg_rating
FROM public.feedback
WHERE rating_1_5 IS NOT NULL
GROUP BY quest_id;