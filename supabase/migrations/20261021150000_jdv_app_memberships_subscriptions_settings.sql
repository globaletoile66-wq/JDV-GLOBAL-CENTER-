-- JDV: separate application memberships and subscriptions from the global identity.
-- This migration is intentionally committed to GitHub only; it is not applied to Supabase.
begin;

create table if not exists public.app_memberships (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  app_key text not null check (app_key ~ '^[a-z][a-z0-9_]{1,63}$'),
  status text not null default 'active' check (status in ('active','suspended','revoked')),
  role text not null default 'member',
  joined_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, app_key)
);

create index if not exists app_memberships_user_app_idx on public.app_memberships(user_id, app_key, status);

create table if not exists public.app_user_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  app_key text not null check (app_key ~ '^[a-z][a-z0-9_]{1,63}$'),
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, app_key)
);

alter table public.app_memberships enable row level security;
alter table public.app_user_settings enable row level security;

drop policy if exists "Users can read their own app memberships" on public.app_memberships;
create policy "Users can read their own app memberships"
  on public.app_memberships for select to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists "Users can read their own app settings" on public.app_user_settings;
create policy "Users can read their own app settings"
  on public.app_user_settings for select to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists "Users can create their own app settings" on public.app_user_settings;
create policy "Users can create their own app settings"
  on public.app_user_settings for insert to authenticated
  with check (user_id = (select auth.uid()));

drop policy if exists "Users can update their own app settings" on public.app_user_settings;
create policy "Users can update their own app settings"
  on public.app_user_settings for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

drop policy if exists "Users can delete their own app settings" on public.app_user_settings;
create policy "Users can delete their own app settings"
  on public.app_user_settings for delete to authenticated
  using (user_id = (select auth.uid()));

-- Create a membership only for the application explicitly chosen during signup.
-- This does not create a subscription and does not grant access to other apps.
create or replace function public.jdv_create_app_membership_on_signup()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_app_key text;
begin
  v_app_key := coalesce(new.raw_user_meta_data ->> 'jdv_app_key', 'global_center');
  if v_app_key not in (
    'global_center', 'marketplace', 'agriculture', 'immo', 'health', 'academy',
    'social', 'media', 'pub', 'pay', 'tontine', 'travel', 'transport',
    'insurance', 'energy', 'business', 'transit', 'services', 'procurement',
    'accounting', 'inventory', 'hr', 'jobs', 'entertainment'
  ) then
    raise exception 'Unsupported JDV application key';
  end if;

  insert into public.app_memberships (user_id, app_key, status, role)
  values (new.id, v_app_key, 'active', 'member')
  on conflict (user_id, app_key) do nothing;

  return new;
end;
$$;

drop trigger if exists jdv_create_app_membership_after_signup on auth.users;
create trigger jdv_create_app_membership_after_signup
  after insert on auth.users
  for each row execute function public.jdv_create_app_membership_on_signup();

-- Existing authenticated users may explicitly enroll in another application.
-- No client-side INSERT policy is granted on app_memberships.
create or replace function public.jdv_join_application(p_app_key text)
returns public.app_memberships
language plpgsql
security definer
set search_path = ''
as $jdv_join$
declare
  v_user_id uuid := auth.uid();
  v_membership public.app_memberships;
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  if p_app_key not in (
    'marketplace', 'agriculture', 'immo', 'health', 'academy', 'social',
    'media', 'pub', 'pay', 'tontine', 'travel', 'transport', 'insurance',
    'energy', 'business', 'transit', 'services', 'procurement', 'accounting',
    'inventory', 'hr', 'jobs', 'entertainment'
  ) then
    raise exception 'Unsupported JDV application key';
  end if;

  insert into public.app_memberships (user_id, app_key, status, role)
  values (v_user_id, p_app_key, 'active', 'member')
  on conflict (user_id, app_key) do nothing;

  select * into v_membership
  from public.app_memberships
  where user_id = v_user_id and app_key = p_app_key;

  if v_membership.status <> 'active' then
    raise exception 'Application membership is not active';
  end if;

  return v_membership;
end;
$jdv_join$;

revoke all on function public.jdv_join_application(text) from public;
grant execute on function public.jdv_join_application(text) to authenticated;

-- Public read-only catalog: exposes only available agricultural offers, never farm ownership data.
create or replace function public.jdv_agriculture_public_catalog()
returns table (
  product_id uuid,
  product_name text,
  product_type text,
  available_quantity numeric,
  unit text,
  unit_price numeric,
  currency_code text,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $jdv_catalog$
  select p.id, p.name, p.product_type, p.quantity, p.unit, p.unit_price, c.code, p.created_at
  from public.agri_products p
  left join public.currencies c on c.id = p.currency_id
  where p.availability_status = 'available'
  order by p.created_at desc
  limit 200;
$jdv_catalog$;

revoke all on function public.jdv_agriculture_public_catalog() from public;
grant execute on function public.jdv_agriculture_public_catalog() to anon, authenticated;

commit;
