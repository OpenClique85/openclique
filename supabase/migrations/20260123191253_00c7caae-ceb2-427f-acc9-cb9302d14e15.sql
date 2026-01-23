-- Add warm_up to the message_templates category check constraint
ALTER TABLE message_templates DROP CONSTRAINT IF EXISTS message_templates_category_check;
ALTER TABLE message_templates ADD CONSTRAINT message_templates_category_check 
  CHECK (category = ANY (ARRAY['reminder', 'instruction', 'objective', 'completion', 'nudge', 'warm_up']));

-- Create warm-up prompts
INSERT INTO message_templates (template_key, category, name, subject, body)
VALUES 
  ('warm_up_ice_breaker', 'warm_up', 'Default Ice Breaker', 'Warm-Up Question', 'What''s one thing you''re hoping to get out of this quest experience?'),
  ('warm_up_fun_fact', 'warm_up', 'Fun Fact', 'Warm-Up Question', 'Share a fun fact about yourself that might surprise your squad!'),
  ('warm_up_excitement', 'warm_up', 'Quest Excitement', 'Warm-Up Question', 'What are you most excited about for this upcoming quest?')
ON CONFLICT (template_key) DO NOTHING;