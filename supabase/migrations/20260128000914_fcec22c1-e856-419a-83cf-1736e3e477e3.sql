-- Drop the existing user SELECT policy on base table to prevent token exposure
DROP POLICY IF EXISTS "Users can view their own Eventbrite connections" 
  ON public.eventbrite_connections;

-- The view inherits RLS from the base table via security_invoker
-- Since we removed the SELECT policy on the base table, authenticated users cannot SELECT directly
-- Edge functions using service_role bypass RLS and retain full access