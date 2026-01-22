-- Add slug column to creator_profiles
ALTER TABLE creator_profiles 
ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;

-- Create function to auto-generate slug from display_name
CREATE OR REPLACE FUNCTION public.generate_creator_slug()
RETURNS TRIGGER AS $$
DECLARE
  base_slug TEXT;
  new_slug TEXT;
  counter INTEGER := 0;
BEGIN
  -- Generate base slug from display_name
  base_slug := lower(regexp_replace(NEW.display_name, '[^a-zA-Z0-9]+', '-', 'g'));
  base_slug := trim(BOTH '-' FROM base_slug);
  new_slug := base_slug;
  
  -- Check for collisions and add suffix if needed
  WHILE EXISTS (SELECT 1 FROM creator_profiles WHERE slug = new_slug AND id != NEW.id) LOOP
    counter := counter + 1;
    new_slug := base_slug || '-' || counter;
  END LOOP;
  
  NEW.slug := new_slug;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for slug generation on insert/update
DROP TRIGGER IF EXISTS set_creator_slug ON creator_profiles;
CREATE TRIGGER set_creator_slug
BEFORE INSERT OR UPDATE OF display_name ON creator_profiles
FOR EACH ROW EXECUTE FUNCTION generate_creator_slug();

-- Backfill existing creators with slugs
UPDATE creator_profiles 
SET slug = lower(regexp_replace(display_name, '[^a-zA-Z0-9]+', '-', 'g'))
WHERE slug IS NULL;

-- Add RLS policy for public reads of active creator profiles
CREATE POLICY "Anyone can view active creator profiles"
ON creator_profiles FOR SELECT
USING (status = 'active');

-- Add storage policy for creators to upload photos
CREATE POLICY "Creators can upload to quest-images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'quest-images' 
  AND (
    public.is_admin() 
    OR public.has_role(auth.uid(), 'quest_creator')
  )
);

-- Add storage policy for creators to update their uploads
CREATE POLICY "Creators can update their uploads in quest-images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'quest-images' 
  AND (
    public.is_admin() 
    OR public.has_role(auth.uid(), 'quest_creator')
  )
);

-- Add storage policy for public reads of quest-images
CREATE POLICY "Anyone can view quest-images"
ON storage.objects FOR SELECT
USING (bucket_id = 'quest-images');