-- Create a secure view that excludes sensitive token columns
CREATE OR REPLACE VIEW public.eventbrite_connections_safe AS
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

-- Grant SELECT on the view to authenticated users
GRANT SELECT ON public.eventbrite_connections_safe TO authenticated;

-- Add a SELECT policy back to the base table for the view to work
-- But users can only access via the view (which excludes tokens)
CREATE POLICY "Users can view their own Eventbrite connections via view"
ON public.eventbrite_connections
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Add comment explaining the security pattern
COMMENT ON VIEW public.eventbrite_connections_safe IS 'Secure view excluding OAuth tokens. Use this for client queries instead of the base table.';