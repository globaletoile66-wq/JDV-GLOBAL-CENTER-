-- Store the country and phone selected during signup in the user's profile.
-- This migration is proposed in GitHub and is not applied to the remote Supabase project.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_country_id uuid;
BEGIN
  IF COALESCE(NEW.raw_user_meta_data->>'country_id', '') ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
    SELECT id
      INTO v_country_id
      FROM public.countries
     WHERE id = (NEW.raw_user_meta_data->>'country_id')::uuid
       AND is_active = true;
  END IF;

  INSERT INTO public.profiles (
    id,
    email,
    first_name,
    last_name,
    full_name,
    phone,
    country_id,
    avatar_url,
    account_status
  ) VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    COALESCE(NULLIF(NEW.raw_user_meta_data->>'full_name', ''), split_part(NEW.email, '@', 1)),
    NULLIF(NEW.raw_user_meta_data->>'phone', ''),
    v_country_id,
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', ''),
    'active'
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    first_name = COALESCE(NULLIF(EXCLUDED.first_name, ''), public.profiles.first_name),
    last_name = COALESCE(NULLIF(EXCLUDED.last_name, ''), public.profiles.last_name),
    full_name = COALESCE(NULLIF(EXCLUDED.full_name, ''), public.profiles.full_name),
    phone = COALESCE(EXCLUDED.phone, public.profiles.phone),
    country_id = COALESCE(EXCLUDED.country_id, public.profiles.country_id);

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'handle_new_user error: %', SQLERRM;
    RETURN NEW;
END;
$function$;
