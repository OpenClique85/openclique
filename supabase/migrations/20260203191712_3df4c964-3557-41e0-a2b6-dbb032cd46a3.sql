-- Remove phone numbers from the platform - all contact through in-app messaging only

-- Step 1: Drop the dependent views first
DROP VIEW IF EXISTS public.quest_signups_for_creators;
DROP VIEW IF EXISTS public.quest_signups_public;

-- Step 2: Drop the phone and whatsapp columns from quest_signups
ALTER TABLE public.quest_signups DROP COLUMN IF EXISTS phone;
ALTER TABLE public.quest_signups DROP COLUMN IF EXISTS whatsapp_joined;

-- Step 3: Drop the whatsapp_link column from quest_squads
ALTER TABLE public.quest_squads DROP COLUMN IF EXISTS whatsapp_link;

-- Step 4: Drop the whatsapp_invite_link column from quests
ALTER TABLE public.quests DROP COLUMN IF EXISTS whatsapp_invite_link;

-- Step 5: Drop the get_signup_phone function (no longer needed)
DROP FUNCTION IF EXISTS public.get_signup_phone(uuid);

-- Step 6: Recreate quest_signups_public view without whatsapp_joined
CREATE OR REPLACE VIEW public.quest_signups_public
WITH (security_invoker = true)
AS
SELECT
  id,
  quest_id,
  user_id,
  status,
  signed_up_at,
  updated_at,
  wants_reenlist,
  reenlist_answered_at,
  instance_id,
  checked_in_at,
  proof_submitted_at,
  completed_at,
  last_activity_at
FROM quest_signups;

-- Step 7: Recreate quest_signups_for_creators view
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
  qs.checked_in_at,
  qs.proof_submitted_at,
  qs.completed_at,
  qs.last_activity_at,
  qs.check_in_verified,
  qs.xp_awarded_at
FROM public.quest_signups qs
WHERE 
  is_quest_creator(qs.quest_id) OR is_admin();

-- Step 8: Grant access
GRANT SELECT ON public.quest_signups_public TO authenticated;
GRANT SELECT ON public.quest_signups_for_creators TO authenticated;

-- Step 9: Comments
COMMENT ON VIEW public.quest_signups_public IS 'Public view of quest signups - excludes all PII';
COMMENT ON VIEW public.quest_signups_for_creators IS 'Secure view for quest creators to see signups - phone numbers removed from platform';