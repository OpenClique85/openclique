-- Make squad_id nullable since clique memberships don't require a quest_squad
ALTER TABLE squad_members ALTER COLUMN squad_id DROP NOT NULL;