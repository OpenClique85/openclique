-- Generate meta quests for February 2026 (current month)
INSERT INTO monthly_meta_quests (template_id, month_year, name, description, icon, criteria_type, criteria_target, criteria_metadata, xp_reward, coin_reward)
SELECT 
  id,
  '2026-02',
  name,
  description,
  icon,
  criteria_type,
  criteria_target,
  criteria_metadata,
  xp_reward,
  coin_reward
FROM monthly_meta_quest_templates
WHERE is_active = true
ON CONFLICT (template_id, month_year) DO NOTHING;

-- Function to generate monthly meta quests (for future months)
CREATE OR REPLACE FUNCTION generate_monthly_meta_quests(p_month_year TEXT)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  INSERT INTO monthly_meta_quests (template_id, month_year, name, description, icon, criteria_type, criteria_target, criteria_metadata, xp_reward, coin_reward)
  SELECT 
    id,
    p_month_year,
    name,
    description,
    icon,
    criteria_type,
    criteria_target,
    criteria_metadata,
    xp_reward,
    coin_reward
  FROM monthly_meta_quest_templates
  WHERE is_active = true
    AND (
      seasonal_months IS NULL 
      OR EXTRACT(MONTH FROM (p_month_year || '-01')::DATE)::INTEGER = ANY(seasonal_months)
    )
  ON CONFLICT (template_id, month_year) DO NOTHING;
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;