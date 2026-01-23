-- Add content hash and export tracking to system_docs
ALTER TABLE public.system_docs 
ADD COLUMN IF NOT EXISTS content_hash TEXT,
ADD COLUMN IF NOT EXISTS last_exported_at TIMESTAMPTZ;

-- Backfill existing documents with hashes using correct column names
UPDATE public.system_docs 
SET content_hash = encode(sha256((COALESCE(title, '') || COALESCE(content_markdown, '') || COALESCE(mermaid_diagram, '') || COALESCE(category, '') || COALESCE(subcategory, ''))::bytea), 'hex')
WHERE content_hash IS NULL;

-- Create or replace function to compute content hash with correct columns
CREATE OR REPLACE FUNCTION public.compute_doc_content_hash()
RETURNS TRIGGER AS $$
BEGIN
  NEW.content_hash := encode(sha256((COALESCE(NEW.title, '') || COALESCE(NEW.content_markdown, '') || COALESCE(NEW.mermaid_diagram, '') || COALESCE(NEW.category, '') || COALESCE(NEW.subcategory, ''))::bytea), 'hex');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS compute_doc_hash_trigger ON public.system_docs;
CREATE TRIGGER compute_doc_hash_trigger
  BEFORE INSERT OR UPDATE ON public.system_docs
  FOR EACH ROW
  EXECUTE FUNCTION public.compute_doc_content_hash();

-- Index for efficient change detection queries
CREATE INDEX IF NOT EXISTS idx_system_docs_export_tracking 
  ON public.system_docs (last_exported_at, content_hash);