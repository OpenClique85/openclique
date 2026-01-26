-- Drop the simple generate_invite_code and recreate with a distinct name
DROP FUNCTION IF EXISTS public.generate_invite_code();

-- Create a uniquely named function for the trigger
CREATE OR REPLACE FUNCTION public.generate_simple_invite_code()
RETURNS text
LANGUAGE plpgsql
SET search_path = public
AS $function$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..8 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  RETURN result;
END;
$function$;

-- Update the trigger function to use the new name
CREATE OR REPLACE FUNCTION public.auto_generate_invite_code()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
DECLARE
  new_code TEXT;
  code_exists BOOLEAN;
BEGIN
  IF NEW.invite_code IS NULL THEN
    LOOP
      new_code := generate_simple_invite_code();
      SELECT EXISTS(SELECT 1 FROM public.squads WHERE invite_code = new_code) INTO code_exists;
      EXIT WHEN NOT code_exists;
    END LOOP;
    NEW.invite_code := new_code;
  END IF;
  RETURN NEW;
END;
$function$;

-- Ensure the trigger exists on squads table
DROP TRIGGER IF EXISTS trigger_auto_generate_invite_code ON squads;
CREATE TRIGGER trigger_auto_generate_invite_code
  BEFORE INSERT ON squads
  FOR EACH ROW
  EXECUTE FUNCTION auto_generate_invite_code();