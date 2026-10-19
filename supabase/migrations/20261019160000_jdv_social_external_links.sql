-- JDV Social external network links (link-only stage; no OAuth tokens stored here).
begin;

create table if not exists public.social_external_links (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  platform text not null check (platform in (
    'whatsapp', 'whatsapp_business', 'facebook', 'instagram', 'x',
    'tiktok', 'youtube', 'telegram', 'linkedin', 'snapchat', 'pinterest'
  )),
  label text,
  handle text,
  profile_url text not null check (profile_url ~* '^https?://'),
  visibility text not null default 'public' check (visibility in ('public', 'private')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, platform, profile_url)
);

alter table public.social_external_links enable row level security;

drop policy if exists social_external_links_select on public.social_external_links;
drop policy if exists social_external_links_insert on public.social_external_links;
drop policy if exists social_external_links_update on public.social_external_links;
drop policy if exists social_external_links_delete on public.social_external_links;

create policy social_external_links_select on public.social_external_links
for select to authenticated
using (user_id = (select auth.uid()) or visibility = 'public' or is_super_admin());

create policy social_external_links_insert on public.social_external_links
for insert to authenticated
with check (user_id = (select auth.uid()));

create policy social_external_links_update on public.social_external_links
for update to authenticated
using (user_id = (select auth.uid()) or is_super_admin())
with check (user_id = (select auth.uid()) or is_super_admin());

create policy social_external_links_delete on public.social_external_links
for delete to authenticated
using (user_id = (select auth.uid()) or is_super_admin());

create index if not exists social_external_links_user_idx
  on public.social_external_links (user_id, created_at desc);
create index if not exists social_external_links_public_idx
  on public.social_external_links (platform, visibility)
  where visibility = 'public';

commit;
