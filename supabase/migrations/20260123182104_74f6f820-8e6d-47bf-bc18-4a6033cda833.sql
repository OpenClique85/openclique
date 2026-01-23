-- Add archived tracking for squads
ALTER TABLE quest_squads
  ADD COLUMN IF NOT EXISTS archived_at timestamptz,
  ADD COLUMN IF NOT EXISTS archived_reason text;

-- Create a function to auto-archive completed squads after 30 days
CREATE OR REPLACE FUNCTION public.auto_archive_squads()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_archived_count INTEGER;
BEGIN
  WITH archived AS (
    UPDATE quest_squads qs
    SET 
      archived_at = NOW(),
      archived_reason = 'auto_30_day'
    WHERE qs.archived_at IS NULL
      AND qs.status = 'confirmed'
      AND qs.created_at < NOW() - INTERVAL '30 days'
      AND EXISTS (
        SELECT 1 FROM quest_instances qi
        WHERE qi.id = qs.quest_id
        AND qi.status IN ('completed', 'archived')
      )
    RETURNING qs.id
  )
  SELECT COUNT(*) INTO v_archived_count FROM archived;
  
  RETURN v_archived_count;
END;
$function$;

-- Create squad_archive_reports table for exportable summary reports
CREATE TABLE IF NOT EXISTS public.squad_archive_reports (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  squad_id uuid NOT NULL REFERENCES quest_squads(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  report_data jsonb NOT NULL DEFAULT '{}',
  export_format text NOT NULL DEFAULT 'json',
  file_url text
);

-- Enable RLS
ALTER TABLE public.squad_archive_reports ENABLE ROW LEVEL SECURITY;

-- Admin-only access
CREATE POLICY "Admins can manage archive reports"
ON public.squad_archive_reports
FOR ALL
USING (public.is_admin())
WITH CHECK (public.is_admin());