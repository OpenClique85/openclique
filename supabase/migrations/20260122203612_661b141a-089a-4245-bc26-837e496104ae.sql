-- Fix security definer view by using security_invoker
DROP VIEW IF EXISTS public.quest_ratings;
CREATE VIEW public.quest_ratings
WITH (security_invoker = on) AS
SELECT 
  quest_id,
  COUNT(*) as review_count,
  ROUND(AVG(rating_1_5)::numeric, 1) as avg_rating
FROM public.feedback
WHERE rating_1_5 IS NOT NULL
GROUP BY quest_id;