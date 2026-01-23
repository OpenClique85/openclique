-- Create export history table with all columns
CREATE TABLE IF NOT EXISTS public.doc_export_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  exported_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  exported_by UUID NOT NULL,
  pack_type TEXT NOT NULL CHECK (pack_type IN ('cto', 'coo', 'full')),
  export_format TEXT NOT NULL CHECK (export_format IN ('json', 'markdown', 'llm_xml')),
  included_categories TEXT[] NOT NULL,
  document_count INTEGER NOT NULL DEFAULT 0,
  total_size_bytes INTEGER,
  file_path TEXT,
  file_url TEXT,
  expires_at TIMESTAMPTZ,
  content_snapshot JSONB,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Enable RLS
ALTER TABLE public.doc_export_history ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admins can view export history" ON public.doc_export_history;
DROP POLICY IF EXISTS "Admins can create export records" ON public.doc_export_history;

-- Admin-only policies for export history
CREATE POLICY "Admins can view export history"
  ON public.doc_export_history
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can create export records"
  ON public.doc_export_history
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update export records"
  ON public.doc_export_history
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Create index for finding recent exports
CREATE INDEX IF NOT EXISTS idx_doc_export_history_pack_format 
  ON public.doc_export_history (pack_type, export_format, exported_at DESC);

-- Create storage bucket for exports
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'doc-exports', 
  'doc-exports', 
  false,
  10485760, -- 10MB limit
  ARRAY['application/json', 'text/markdown', 'application/xml', 'text/xml']
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for doc-exports bucket (admin only)
DROP POLICY IF EXISTS "Admins can upload doc exports" ON storage.objects;
DROP POLICY IF EXISTS "Admins can read doc exports" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete doc exports" ON storage.objects;

CREATE POLICY "Admins can upload doc exports"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'doc-exports' AND
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can read doc exports"
  ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'doc-exports' AND
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can delete doc exports"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'doc-exports' AND
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );