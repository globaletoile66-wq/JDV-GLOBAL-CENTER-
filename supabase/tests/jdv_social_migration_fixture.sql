-- Disposable PostgreSQL fixture for JDV Social migration syntax/grant smoke tests.
-- Never run this fixture against the production Supabase project.
create role anon nologin;
create role authenticated nologin;

create schema auth;
create table auth.users (id uuid primary key);
create or replace function auth.uid()
returns uuid
language sql stable
as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;

create or replace function public.is_super_admin()
returns boolean
language sql stable
as $$ select false $$;

create table public.social_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  profile_status text not null default 'active'
);
create table public.social_posts (
  id uuid primary key default gen_random_uuid(),
  author_user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'draft',
  visibility text not null default 'private'
);
create table public.social_reactions (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.social_posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade
);
create table public.social_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.social_posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  body text not null
);
create table public.social_app_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade
);
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade
);

grant usage on schema public, auth to anon, authenticated;
grant select, insert, update, delete, truncate, references, trigger
  on public.social_profiles, public.social_posts, public.social_reactions,
     public.social_comments, public.social_app_preferences, public.notifications
  to anon, authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;

alter table public.social_profiles enable row level security;
alter table public.social_posts enable row level security;
alter table public.social_reactions enable row level security;
alter table public.social_comments enable row level security;
alter table public.social_app_preferences enable row level security;
alter table public.notifications enable row level security;
