
CREATE OR REPLACE FUNCTION public.enforce_email_allowlist()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  allowed text[] := ARRAY[
    'seretoulis@factonet.de',
    'bayer@factonet.de',
    'tim@mtmstudios.de',
    'michael@mtmstudios.de',
    'meron@mtmstudios.de'
  ];
BEGIN
  IF NEW.email IS NULL OR NOT (lower(NEW.email) = ANY(allowed)) THEN
    RAISE EXCEPTION 'Diese E-Mail-Adresse ist nicht zur Registrierung berechtigt.'
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_email_allowlist_trigger ON auth.users;
CREATE TRIGGER enforce_email_allowlist_trigger
  BEFORE INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_email_allowlist();
