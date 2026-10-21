-- Persist country-aware registration metadata into the existing profile row.
-- This migration is committed for review only; it is not applied to the remote database here.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_catalog
as $function$
declare
  v_country_id uuid;
  v_currency_id uuid;
  v_language_id uuid;
  v_timezone text;
begin
  select c.id, c.default_currency_id, c.default_language_id, c.timezone
    into v_country_id, v_currency_id, v_language_id, v_timezone
  from public.countries c
  where c.id::text = nullif(new.raw_user_meta_data->>'country_id', '')
    and c.is_active = true
  limit 1;

  insert into public.profiles (
    id,
    email,
    first_name,
    last_name,
    full_name,
    phone,
    country_id,
    preferred_currency_id,
    preferred_language_id,
    timezone,
    avatar_url,
    account_status
  ) values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'first_name', ''),
    coalesce(new.raw_user_meta_data->>'last_name', ''),
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    nullif(trim(new.raw_user_meta_data->>'phone'), ''),
    v_country_id,
    v_currency_id,
    v_language_id,
    v_timezone,
    coalesce(new.raw_user_meta_data->>'avatar_url', ''),
    'active'
  )
  on conflict (id) do nothing;

  return new;
exception
  when others then
    raise notice 'handle_new_user error: %', sqlerrm;
    return new;
end;
$function$;
