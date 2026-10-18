-- Validate public contact form input before inserting through the SECURITY DEFINER RPC.
-- Keep anonymous execution because this RPC is the public site's contact entry point.
CREATE OR REPLACE FUNCTION public.public_submit_contact_message(
  p_name text,
  p_email text,
  p_subject text,
  p_message text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog'
AS $function$
DECLARE
  v_name text := btrim(coalesce(p_name, ''));
  v_email text := lower(btrim(coalesce(p_email, '')));
  v_subject text := btrim(coalesce(p_subject, ''));
  v_message text := btrim(coalesce(p_message, ''));
BEGIN
  IF v_name = '' OR char_length(v_name) > 120 THEN
    RAISE EXCEPTION 'INVALID_NAME';
  END IF;

  IF v_email = '' OR char_length(v_email) > 254
     OR v_email !~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+[.][A-Z]{2,}$' THEN
    RAISE EXCEPTION 'INVALID_EMAIL';
  END IF;

  IF char_length(v_subject) > 160 THEN
    RAISE EXCEPTION 'INVALID_SUBJECT';
  END IF;

  IF v_message = '' OR char_length(v_message) > 5000 THEN
    RAISE EXCEPTION 'INVALID_MESSAGE';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.contact_messages
    WHERE lower(email) = v_email
      AND created_at > now() - interval '1 hour'
    HAVING count(*) >= 3
  ) THEN
    RAISE EXCEPTION 'TOO_MANY_MESSAGES';
  END IF;

  IF (
    SELECT count(*)
    FROM public.contact_messages
    WHERE created_at > now() - interval '1 hour'
  ) >= 100 THEN
    RAISE EXCEPTION 'SERVICE_BUSY';
  END IF;

  INSERT INTO public.contact_messages(name, email, subject, message)
  VALUES (v_name, v_email, nullif(v_subject, ''), v_message);
END
$function$;

REVOKE ALL ON FUNCTION public.public_submit_contact_message(text, text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.public_submit_contact_message(text, text, text, text) TO anon, authenticated;
