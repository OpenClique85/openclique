-- Drop the old FK constraint that points to quest_templates
ALTER TABLE quest_instances DROP CONSTRAINT IF EXISTS quest_instances_template_id_fkey;

-- Phase 3: Data migration - Create instances for existing quests and link signups

-- Step 1: Ensure quest_signups has instance_id column
ALTER TABLE quest_signups ADD COLUMN IF NOT EXISTS instance_id UUID REFERENCES quest_instances(id);

-- Step 2: Create instances for existing quests that have start_datetime but no instance
INSERT INTO quest_instances (
  quest_id, 
  instance_slug, 
  title, 
  icon, 
  description,
  scheduled_date, 
  start_time, 
  end_time,
  meeting_point_name, 
  meeting_point_address,
  capacity, 
  what_to_bring,
  progression_tree,
  status,
  quest_card_token
)
SELECT 
  q.id,
  q.slug,
  q.title,
  q.icon,
  q.short_description,
  q.start_datetime::date,
  q.start_datetime::time,
  q.end_datetime::time,
  q.meeting_location_name,
  q.meeting_address,
  q.capacity_total,
  q.what_to_bring,
  q.progression_tree,
  CASE 
    WHEN q.status = 'open' THEN 'recruiting'::instance_status
    WHEN q.status = 'closed' THEN 'locked'::instance_status
    WHEN q.status = 'completed' THEN 'completed'::instance_status
    ELSE 'draft'::instance_status
  END,
  gen_random_uuid()::text
FROM quests q
WHERE q.start_datetime IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM quest_instances qi WHERE qi.quest_id = q.id
  );

-- Step 3: Link existing signups to their instances
UPDATE quest_signups qs
SET instance_id = qi.id
FROM quest_instances qi
WHERE qs.quest_id = qi.quest_id
  AND qs.instance_id IS NULL;