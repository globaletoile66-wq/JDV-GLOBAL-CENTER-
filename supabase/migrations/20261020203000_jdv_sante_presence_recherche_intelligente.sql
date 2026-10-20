-- JDV Santé: verified provider presence and private, reusable search history.
-- Additive migration: preserves existing provider, appointment and on-call tables.

create table if not exists public.health_provider_presence (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  professional_id uuid null references public.health_professionals(id) on delete cascade,
  business_id uuid null references public.business_profiles(id) on delete cascade,
  presence_status text not null default 'offline' check (presence_status in ('online','busy','offline')),
  accepts_messages boolean not null default false,
  accepts_teleconsultation boolean not null default false,
  last_seen_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint health_provider_presence_owner_target_check check (professional_id is not null or business_id is not null),
  constraint health_provider_presence_unique_professional unique (professional_id),
  constraint health_provider_presence_unique_business unique (business_id)
);
create index if not exists health_provider_presence_recent_idx on public.health_provider_presence (presence_status, last_seen_at desc);
alter table public.health_provider_presence enable row level security;

drop policy if exists health_provider_presence_public_online_read on public.health_provider_presence;
create policy health_provider_presence_public_online_read on public.health_provider_presence
for select to anon, authenticated
using (
  presence_status in ('online','busy')
  and last_seen_at > now() - interval '3 minutes'
  and (
    (professional_id is not null and exists (
      select 1 from public.health_professionals hp
      where hp.id = health_provider_presence.professional_id
        and hp.is_active = true and hp.verification_status::text = 'verified'
    ))
    or
    (business_id is not null and exists (
      select 1 from public.health_provider_profiles hpp
      where hpp.business_id = health_provider_presence.business_id
        and hpp.is_public = true and hpp.verification_status::text = 'verified'
    ))
  )
);
drop policy if exists health_provider_presence_owner_read on public.health_provider_presence;
create policy health_provider_presence_owner_read on public.health_provider_presence
for select to authenticated
using (user_id = (select auth.uid()) or is_super_admin() or (business_id is not null and user_has_business_access(business_id)));
drop policy if exists health_provider_presence_owner_insert on public.health_provider_presence;
create policy health_provider_presence_owner_insert on public.health_provider_presence
for insert to authenticated
with check (
  user_id = (select auth.uid())
  and (
    is_super_admin()
    or (business_id is not null and user_has_business_access(business_id))
    or (professional_id is not null and exists (
      select 1 from public.health_professionals hp
      where hp.id = professional_id and hp.user_id = (select auth.uid())
    ))
  )
);
drop policy if exists health_provider_presence_owner_update on public.health_provider_presence;
create policy health_provider_presence_owner_update on public.health_provider_presence
for update to authenticated
using (user_id = (select auth.uid()) or is_super_admin() or (business_id is not null and user_has_business_access(business_id)))
with check (user_id = (select auth.uid()) or is_super_admin() or (business_id is not null and user_has_business_access(business_id)));

create table if not exists public.health_search_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  search_text text not null check (char_length(trim(search_text)) between 1 and 120),
  category text not null default 'all' check (category in ('all','doctor','pharmacy','laboratory','clinic','hospital','imaging','nurse','midwife','other')),
  city text not null default '' check (char_length(city) <= 100),
  district text not null default '' check (char_length(district) <= 100),
  use_count integer not null default 1 check (use_count >= 1),
  last_used_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint health_search_history_deduplicate unique (user_id, search_text, category, city, district)
);
alter table public.health_search_history alter column city set default '';
alter table public.health_search_history alter column district set default '';
update public.health_search_history set city = '' where city is null;
update public.health_search_history set district = '' where district is null;
alter table public.health_search_history alter column city set not null;
alter table public.health_search_history alter column district set not null;
create index if not exists health_search_history_user_recent_idx on public.health_search_history (user_id, last_used_at desc);
alter table public.health_search_history enable row level security;
drop policy if exists health_search_history_owner_select on public.health_search_history;
create policy health_search_history_owner_select on public.health_search_history for select to authenticated using (user_id = (select auth.uid()));
drop policy if exists health_search_history_owner_insert on public.health_search_history;
create policy health_search_history_owner_insert on public.health_search_history for insert to authenticated with check (user_id = (select auth.uid()));
drop policy if exists health_search_history_owner_update on public.health_search_history;
create policy health_search_history_owner_update on public.health_search_history for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
drop policy if exists health_search_history_owner_delete on public.health_search_history;
create policy health_search_history_owner_delete on public.health_search_history for delete to authenticated using (user_id = (select auth.uid()));

create table if not exists public.health_search_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  remember_searches boolean not null default true,
  preferred_city text null check (preferred_city is null or char_length(preferred_city) <= 100),
  preferred_district text null check (preferred_district is null or char_length(preferred_district) <= 100),
  updated_at timestamptz not null default now()
);
alter table public.health_search_preferences enable row level security;
drop policy if exists health_search_preferences_owner_select on public.health_search_preferences;
create policy health_search_preferences_owner_select on public.health_search_preferences for select to authenticated using (user_id = (select auth.uid()));
drop policy if exists health_search_preferences_owner_insert on public.health_search_preferences;
create policy health_search_preferences_owner_insert on public.health_search_preferences for insert to authenticated with check (user_id = (select auth.uid()));
drop policy if exists health_search_preferences_owner_update on public.health_search_preferences;
create policy health_search_preferences_owner_update on public.health_search_preferences for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

create or replace function public.health_touch_provider_presence(
  p_professional_id uuid default null,
  p_business_id uuid default null,
  p_presence_status text default 'online',
  p_accepts_messages boolean default false,
  p_accepts_teleconsultation boolean default false
) returns public.health_provider_presence
language plpgsql
security invoker
set search_path = public
as $$
declare result_row public.health_provider_presence;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if p_presence_status not in ('online','busy','offline') then raise exception 'Invalid presence status'; end if;
  if p_professional_id is null and p_business_id is null then raise exception 'A professional or business is required'; end if;
  if p_professional_id is not null then
    insert into public.health_provider_presence(user_id, professional_id, business_id, presence_status, accepts_messages, accepts_teleconsultation, last_seen_at, updated_at)
    values (auth.uid(), p_professional_id, p_business_id, p_presence_status, p_accepts_messages, p_accepts_teleconsultation, now(), now())
    on conflict (professional_id) do update set
      business_id = coalesce(excluded.business_id, health_provider_presence.business_id),
      presence_status = excluded.presence_status, accepts_messages = excluded.accepts_messages,
      accepts_teleconsultation = excluded.accepts_teleconsultation, last_seen_at = now(), updated_at = now()
    where health_provider_presence.user_id = auth.uid()
    returning * into result_row;
  else
    insert into public.health_provider_presence(user_id, business_id, presence_status, accepts_messages, accepts_teleconsultation, last_seen_at, updated_at)
    values (auth.uid(), p_business_id, p_presence_status, p_accepts_messages, p_accepts_teleconsultation, now(), now())
    on conflict (business_id) do update set
      presence_status = excluded.presence_status, accepts_messages = excluded.accepts_messages,
      accepts_teleconsultation = excluded.accepts_teleconsultation, last_seen_at = now(), updated_at = now()
    where health_provider_presence.user_id = auth.uid()
    returning * into result_row;
  end if;
  if result_row.id is null then raise exception 'No permission to update this provider presence'; end if;
  return result_row;
end;
$$;
revoke all on function public.health_touch_provider_presence(uuid,uuid,text,boolean,boolean) from public;
grant execute on function public.health_touch_provider_presence(uuid,uuid,text,boolean,boolean) to authenticated;

create or replace function public.health_record_search(
  p_search_text text,
  p_category text default 'all',
  p_city text default null,
  p_district text default null
) returns public.health_search_history
language plpgsql
security invoker
set search_path = public
as $$
declare result_row public.health_search_history;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if p_search_text is null or char_length(trim(p_search_text)) = 0 then return null; end if;
  if not exists (select 1 from public.health_search_preferences where user_id = auth.uid() and remember_searches = false) then
    insert into public.health_search_history(user_id, search_text, category, city, district, use_count, last_used_at)
    values (auth.uid(), left(trim(p_search_text),120), coalesce(p_category,'all'), left(trim(coalesce(p_city,'')),100), left(trim(coalesce(p_district,'')),100), 1, now())
    on conflict (user_id, search_text, category, city, district) do update set use_count = health_search_history.use_count + 1, last_used_at = now()
    returning * into result_row;
  end if;
  return result_row;
end;
$$;
revoke all on function public.health_record_search(text,text,text,text) from public;
grant execute on function public.health_record_search(text,text,text,text) to authenticated;

notify pgrst, 'reload schema';
