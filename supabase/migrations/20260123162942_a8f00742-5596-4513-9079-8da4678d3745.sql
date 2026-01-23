-- Drop the deprecated quest_templates table
-- All template functionality is now in the quests table
DROP TABLE IF EXISTS quest_templates CASCADE;