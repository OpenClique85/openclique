-- Fix PostgREST relationship: allow quest_signups -> profiles joins for names/emails
-- Currently quest_signups.user_id FK points to auth.users, which prevents `.select('profiles(...)')` in the app.

ALTER TABLE public.quest_signups
  DROP CONSTRAINT IF EXISTS quest_signups_user_id_fkey;

ALTER TABLE public.quest_signups
  ADD CONSTRAINT quest_signups_user_id_fkey
  FOREIGN KEY (user_id)
  REFERENCES public.profiles(id)
  ON DELETE CASCADE;