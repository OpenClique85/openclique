-- Fix function search_path for update_listing_applications_count
CREATE OR REPLACE FUNCTION public.update_listing_applications_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE sponsor_listings SET applications_count = applications_count + 1 WHERE id = NEW.listing_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE sponsor_listings SET applications_count = applications_count - 1 WHERE id = OLD.listing_id;
  END IF;
  RETURN NULL;
END;
$function$;

-- Restrict feedback_pulses INSERT to authenticated users only (prevents spam)
DROP POLICY IF EXISTS "Anyone can submit feedback pulses" ON feedback_pulses;
CREATE POLICY "Authenticated users can submit feedback pulses"
ON feedback_pulses
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

-- Restrict quest_event_log INSERT to authenticated users and system (via RPC)
DROP POLICY IF EXISTS "System can insert events" ON quest_event_log;
CREATE POLICY "Authenticated users and system can insert events"
ON quest_event_log
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);