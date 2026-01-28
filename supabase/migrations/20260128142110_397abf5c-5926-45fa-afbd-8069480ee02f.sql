-- Fix the view to use security_invoker instead of security_definer
DROP VIEW IF EXISTS public.eventbrite_connections_safe;

CREATE VIEW public.eventbrite_connections_safe 
WITH (security_invoker = on) AS
SELECT 
  id,
  user_id,
  org_id,
  eventbrite_user_id,
  eventbrite_email,
  connected_at,
  last_sync_at,
  is_active,
  token_expires_at
FROM public.eventbrite_connections;

-- Re-grant SELECT on the view to authenticated users
GRANT SELECT ON public.eventbrite_connections_safe TO authenticated;

COMMENT ON VIEW public.eventbrite_connections_safe IS 'Secure view excluding OAuth tokens (security_invoker). Use this for client queries instead of the base table.';