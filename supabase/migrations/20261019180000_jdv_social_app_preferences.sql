create table if not exists public.social_app_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  app_key text not null check (app_key in ('whatsapp','whatsapp_business','facebook','instagram','x','tiktok','youtube','telegram','linkedin','snapchat','pinterest')),
  is_added boolean not null default true,
  is_visible boolean not null default true,
  sort_order integer not null default 0,
  category text not null default 'Réseaux sociaux' check (char_length(trim(category)) between 1 and 60),
  notifications_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, app_key)
);

alter table public.social_app_preferences enable row level security;

drop policy if exists "Users can view their own social app preferences" on public.social_app_preferences;
create policy "Users can view their own social app preferences"
  on public.social_app_preferences for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can add their own social app preferences" on public.social_app_preferences;
create policy "Users can add their own social app preferences"
  on public.social_app_preferences for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update their own social app preferences" on public.social_app_preferences;
create policy "Users can update their own social app preferences" for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete their own social app preferences" on public.social_app_preferences;
create policy "Users can delete their own social app preferences"
  on public.social_app_preferences for delete to authenticated
  using ((select auth.uid()) = user_id);

grant select, insert, update, delete on public.social_app_preferences to authenticated;
notify pgrst, 'reload schema';
