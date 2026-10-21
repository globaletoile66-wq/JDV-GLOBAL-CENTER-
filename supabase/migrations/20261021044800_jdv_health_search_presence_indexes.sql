-- JDV Santé: indexes for the verified on-call directory, live presence and private search memory.
-- Existing tables and RLS policies are preserved; these indexes only improve lookup performance.
create index if not exists health_search_history_user_recent_idx
  on public.health_search_history (user_id, last_used_at desc);
create index if not exists health_provider_presence_recent_idx
  on public.health_provider_presence (last_seen_at desc)
  where presence_status in ('online','busy');
create index if not exists health_on_call_active_window_idx
  on public.health_on_call_schedules (starts_at, ends_at, business_id, professional_id)
  where status = 'verified';
create index if not exists health_services_active_business_idx
  on public.health_services (business_id, is_active)
  where is_active = true;
create index if not exists business_profiles_public_city_idx
  on public.business_profiles (city, region)
  where is_public = true;
notify pgrst, 'reload schema';
