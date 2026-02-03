-- Fix: Prevent quest creators from accessing participant phone numbers
-- Strategy: Create a secure view for creator access that excludes sensitive fields

-- Step 1: Drop the existing policy that exposes phone to creators
DROP POLICY IF EXISTS "Creators can view signups for their quests" ON public.quest_signups;

-- Step 2: Create a secure view for creator access (excludes phone, notes_private, location data)
CREATE OR REPLACE VIEW public.quest_signups_for_creators
WITH (security_invoker = true)
AS
SELECT 
  qs.id,
  qs.quest_id,
  qs.user_id,
  qs.status,
  qs.signed_up_at,
  qs.updated_at,
  qs.wants_reenlist,
  qs.reenlist_answered_at,
  qs.instance_id,
  qs.whatsapp_joined,
  qs.checked_in_at,
  qs.proof_submitted_at,
  qs.completed_at,
  qs.last_activity_at,
  qs.check_in_verified,
  qs.xp_awarded_at
  -- Excluded: phone, notes_private, participant_token, check_in_lat, check_in_lng, check_in_photo_url, check_in_method, location_consent_given, cancellation_reason
FROM public.quest_signups qs
WHERE 
  -- Creator can only see signups for their own quests
  public.is_quest_creator(qs.quest_id)
  -- Or admin
  OR public.is_admin();

-- Step 3: Grant select on the view
GRANT SELECT ON public.quest_signups_for_creators TO authenticated;

-- Step 4: Add a comment explaining the view's purpose
COMMENT ON VIEW public.quest_signups_for_creators IS 'Secure view for quest creators to see signups without access to phone numbers or location data';

-- Step 5: Users can still view their own signups (full data) via existing policy
-- "Users can view their own signups" - qual: (auth.uid() = user_id) - this remains intact

-- Step 6: Admins can still view all signups (full data) via existing policy  
-- "Admins can view all signups" - qual: is_admin() - this remains intact