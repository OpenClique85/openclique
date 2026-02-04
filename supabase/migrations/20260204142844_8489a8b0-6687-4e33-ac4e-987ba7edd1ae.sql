-- Corrected: quest_signups has no squad_id column, so we only add real FKs.

DO $$
BEGIN
  -- quest_signups.user_id -> profiles.id
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'quest_signups_user_id_fkey') THEN
    ALTER TABLE public.quest_signups
      ADD CONSTRAINT quest_signups_user_id_fkey
      FOREIGN KEY (user_id)
      REFERENCES public.profiles(id)
      ON DELETE CASCADE
      NOT VALID;
  END IF;

  -- quest_signups.quest_id -> quests.id
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'quest_signups_quest_id_fkey') THEN
    ALTER TABLE public.quest_signups
      ADD CONSTRAINT quest_signups_quest_id_fkey
      FOREIGN KEY (quest_id)
      REFERENCES public.quests(id)
      ON DELETE CASCADE
      NOT VALID;
  END IF;

  -- quest_signups.instance_id -> quest_instances.id
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'quest_signups_instance_id_fkey') THEN
    ALTER TABLE public.quest_signups
      ADD CONSTRAINT quest_signups_instance_id_fkey
      FOREIGN KEY (instance_id)
      REFERENCES public.quest_instances(id)
      ON DELETE SET NULL
      NOT VALID;
  END IF;

  -- quest_squads.quest_id -> quest_instances.id (in this schema, squads belong to an instance)
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'quest_squads_quest_id_fkey') THEN
    ALTER TABLE public.quest_squads
      ADD CONSTRAINT quest_squads_quest_id_fkey
      FOREIGN KEY (quest_id)
      REFERENCES public.quest_instances(id)
      ON DELETE CASCADE
      NOT VALID;
  END IF;

  -- squad_members.user_id -> profiles.id
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'squad_members_user_id_fkey') THEN
    ALTER TABLE public.squad_members
      ADD CONSTRAINT squad_members_user_id_fkey
      FOREIGN KEY (user_id)
      REFERENCES public.profiles(id)
      ON DELETE CASCADE
      NOT VALID;
  END IF;

  -- squad_members.squad_id -> quest_squads.id
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'squad_members_squad_id_fkey') THEN
    ALTER TABLE public.squad_members
      ADD CONSTRAINT squad_members_squad_id_fkey
      FOREIGN KEY (squad_id)
      REFERENCES public.quest_squads(id)
      ON DELETE CASCADE
      NOT VALID;
  END IF;

  -- squad_members.signup_id -> quest_signups.id (optional but helps integrity)
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'squad_members_signup_id_fkey') THEN
    ALTER TABLE public.squad_members
      ADD CONSTRAINT squad_members_signup_id_fkey
      FOREIGN KEY (signup_id)
      REFERENCES public.quest_signups(id)
      ON DELETE SET NULL
      NOT VALID;
  END IF;
END $$;

ALTER TABLE public.quest_signups VALIDATE CONSTRAINT quest_signups_user_id_fkey;
ALTER TABLE public.quest_signups VALIDATE CONSTRAINT quest_signups_quest_id_fkey;
ALTER TABLE public.quest_signups VALIDATE CONSTRAINT quest_signups_instance_id_fkey;
ALTER TABLE public.quest_squads VALIDATE CONSTRAINT quest_squads_quest_id_fkey;
ALTER TABLE public.squad_members VALIDATE CONSTRAINT squad_members_user_id_fkey;
ALTER TABLE public.squad_members VALIDATE CONSTRAINT squad_members_squad_id_fkey;
ALTER TABLE public.squad_members VALIDATE CONSTRAINT squad_members_signup_id_fkey;
