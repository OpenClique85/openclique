-- Enable RLS on the quest_ratings view
ALTER VIEW public.quest_ratings SET (security_invoker = true);

-- Note: Views with security_invoker = true inherit RLS from their base tables.
-- The underlying 'feedback' table already has RLS policies.
-- This ensures any access to quest_ratings respects the feedback table's RLS policies.

-- Add a comment documenting the security model
COMMENT ON VIEW public.quest_ratings IS 'Aggregate view of quest ratings. Uses security_invoker=true to inherit RLS from the underlying feedback table.';