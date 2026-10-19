-- JDV Media phase 1: public distribution, creator directory, editorial reviews and production requests.
-- Additive only: reuses media_channels, media_contents, organizations and auth.users.
-- This migration is versioned in GitHub only; it has NOT been applied to Supabase.

create table if not exists public.media_creator_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  display_name text not null check (length(trim(display_name)) between 2 and 120),
  bio text check (bio is null or length(bio) <= 3000),
  country_code text check (country_code is null or country_code ~ '^[A-Z]{2}$'),
  avatar_url text,
  specialties text[] not null default '{}',
  website_url text,
  social_links jsonb not null default '{}'::jsonb,
  verification_status text not null default 'pending' check (verification_status in ('pending','verified','rejected')),
  is_public boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.media_editorial_reviews (
  id uuid primary key default gen_random_uuid(),
  content_id uuid not null references public.media_contents(id) on delete cascade,
  reviewer_user_id uuid not null references auth.users(id) on delete restrict default auth.uid(),
  decision text not null default 'pending' check (decision in ('pending','approved','changes_requested','rejected')),
  notes text check (notes is null or length(notes) <= 5000),
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.media_production_requests (
  id uuid primary key default gen_random_uuid(),
  requester_user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  organization_id uuid references public.organizations(id) on delete set null,
  service_type text not null check (service_type in ('video','audio','photography','live','editing','campaign','other')),
  title text not null check (length(trim(title)) between 3 and 180),
  brief text not null check (length(trim(brief)) between 10 and 8000),
  country_code text check (country_code is null or country_code ~ '^[A-Z]{2}$'),
  budget_amount numeric(14,2) check (budget_amount is null or budget_amount >= 0),
  budget_currency text check (budget_currency is null or budget_currency ~ '^[A-Z]{3}$'),
  desired_date date,
  status text not null default 'submitted' check (status in ('submitted','reviewing','quoted','accepted','in_production','delivered','cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_media_contents_public_feed
  on public.media_contents (published_at desc) where status = 'published';
create index if not exists idx_media_creator_public
  on public.media_creator_profiles (country_code, display_name) where is_public = true and verification_status = 'verified';
create index if not exists idx_media_reviews_content
  on public.media_editorial_reviews (content_id, created_at desc);
create index if not exists idx_media_production_requests_owner
  on public.media_production_requests (requester_user_id, created_at desc);

alter table public.media_creator_profiles enable row level security;
alter table public.media_editorial_reviews enable row level security;
alter table public.media_production_requests enable row level security;

-- Only published items become visible to unauthenticated readers.
drop policy if exists media_public_published_read on public.media_contents;
create policy media_public_published_read on public.media_contents
  for select to anon, authenticated
  using (status = 'published' and published_at is not null and published_at <= now());

-- Creators can maintain their own unverified profile. Verification and public listing
-- are reserved to super admins; a trigger below prevents self-verification.
create or replace function public.media_guard_creator_verification()
returns trigger language plpgsql security invoker set search_path = public
as $$
begin
  if not is_super_admin() then
    if tg_op = 'INSERT' then
      new.verification_status := 'pending';
      new.is_public := false;
    elsif new.verification_status is distinct from old.verification_status
       or new.is_public is distinct from old.is_public then
      raise exception 'Creator verification and public listing require a media administrator';
    end if;
  end if;
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists media_creator_verification_guard on public.media_creator_profiles;
create trigger media_creator_verification_guard
  before insert or update on public.media_creator_profiles
  for each row execute function public.media_guard_creator_verification();

drop policy if exists media_creator_public_read on public.media_creator_profiles;
create policy media_creator_public_read on public.media_creator_profiles
  for select to anon, authenticated
  using (is_public = true and verification_status = 'verified');
drop policy if exists media_creator_owner_read on public.media_creator_profiles;
create policy media_creator_owner_read on public.media_creator_profiles
  for select to authenticated
  using (user_id = auth.uid() or is_super_admin());
drop policy if exists media_creator_owner_insert on public.media_creator_profiles;
create policy media_creator_owner_insert on public.media_creator_profiles
  for insert to authenticated
  with check (user_id = auth.uid() and verification_status = 'pending' and is_public = false);
drop policy if exists media_creator_owner_update on public.media_creator_profiles;
create policy media_creator_owner_update on public.media_creator_profiles
  for update to authenticated
  using (user_id = auth.uid() or is_super_admin())
  with check (user_id = auth.uid() or is_super_admin());
drop policy if exists media_creator_admin_manage on public.media_creator_profiles;
create policy media_creator_admin_manage on public.media_creator_profiles
  for all to authenticated
  using (is_super_admin()) with check (is_super_admin());

-- Editorial decisions are visible to the content author, organization admins and super admins.
drop policy if exists media_editorial_review_read on public.media_editorial_reviews;
create policy media_editorial_review_read on public.media_editorial_reviews
  for select to authenticated
  using (
    reviewer_user_id = auth.uid() or is_super_admin() or exists (
      select 1 from public.media_contents m
      join public.media_channels c on c.id = m.channel_id
      where m.id = content_id and (m.author_user_id = auth.uid() or is_org_admin(c.organization_id))
    )
  );
drop policy if exists media_editorial_review_admin_insert on public.media_editorial_reviews;
create policy media_editorial_review_admin_insert on public.media_editorial_reviews
  for insert to authenticated
  with check (
    reviewer_user_id = auth.uid() and (is_super_admin() or exists (
      select 1 from public.media_contents m
      join public.media_channels c on c.id = m.channel_id
      where m.id = content_id and is_org_admin(c.organization_id)
    ))
  );
drop policy if exists media_editorial_review_admin_update on public.media_editorial_reviews;
create policy media_editorial_review_admin_update on public.media_editorial_reviews
  for update to authenticated
  using (is_super_admin() or exists (
    select 1 from public.media_contents m
    join public.media_channels c on c.id = m.channel_id
    where m.id = content_id and is_org_admin(c.organization_id)
  ))
  with check (is_super_admin() or exists (
    select 1 from public.media_contents m
    join public.media_channels c on c.id = m.channel_id
    where m.id = content_id and is_org_admin(c.organization_id)
  ));

-- Production briefs are private to their requester and super admins in phase 1.
drop policy if exists media_production_request_owner_access on public.media_production_requests;
drop policy if exists media_production_request_owner_read on public.media_production_requests;
drop policy if exists media_production_request_owner_insert on public.media_production_requests;
drop policy if exists media_production_request_admin_update on public.media_production_requests;
drop policy if exists media_production_request_admin_delete on public.media_production_requests;
create policy media_production_request_owner_read on public.media_production_requests
  for select to authenticated
  using (requester_user_id = auth.uid() or is_super_admin());
create policy media_production_request_owner_insert on public.media_production_requests
  for insert to authenticated
  with check (requester_user_id = auth.uid() and status = 'submitted');
create policy media_production_request_admin_update on public.media_production_requests
  for update to authenticated
  using (is_super_admin()) with check (is_super_admin());
create policy media_production_request_admin_delete on public.media_production_requests
  for delete to authenticated
  using (is_super_admin());


-- Explicit API privileges; RLS remains the row-level boundary.
grant select on public.media_contents to anon, authenticated;
grant select, insert, update on public.media_creator_profiles to authenticated;
grant select on public.media_creator_profiles to anon;
grant select, insert, update on public.media_editorial_reviews to authenticated;
grant select, insert, update on public.media_production_requests to authenticated;
