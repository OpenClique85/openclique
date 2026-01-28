-- Add INSERT policy for service role to allow automated rate monitoring logging
CREATE POLICY "Service can insert rate monitor events"
ON public.auth_rate_monitor
FOR INSERT
TO service_role
WITH CHECK (true);