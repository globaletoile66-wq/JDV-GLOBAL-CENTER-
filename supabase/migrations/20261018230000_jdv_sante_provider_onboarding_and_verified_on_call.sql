create table if not exists public.health_provider_applications (
  id uuid primary key default gen_random_uuid(),
  applicant_user_id uuid not null references auth.users(id) on delete cascade,
  provider_type text not null check (provider_type in ('doctor','pharmacy','laboratory','clinic','hospital','nurse','imaging_center','other')),
  legal_name text not null,
  display_name text not null,
  country_id uuid null,
  city text not null,
  address text null,
  phone text not null,
  email text null,
  latitude numeric(10,7) null check (latitude is null or latitude between -90 and 90),
  longitude numeric(10,7) null check (longitude is null or longitude between -180 and 180),
  specialty text null,
  registration_number text null,
  registration_authority text null,
  notes text null,
  review_status text not null default 'pending' check (review_status in ('pending','under_review','approved','rejected','needs_information')),
  review_notes text null,
  reviewed_by uuid null references auth.users(id) on delete set null,
  reviewed_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists health_provider_applications_applicant_idx on public.health_provider_applications(applicant_user_id, created_at desc);
create index if not exists health_provider_applications_review_idx on public.health_provider_applications(review_status, created_at desc);
alter table public.health_provider_applications enable row level security;
drop policy if exists health_provider_applications_select_own on public.health_provider_applications;
create policy health_provider_applications_select_own on public.health_provider_applications for select to authenticated using (applicant_user_id = (select auth.uid()) or public.is_super_admin());
drop policy if exists health_provider_applications_insert_own on public.health_provider_applications;
create policy health_provider_applications_insert_own on public.health_provider_applications for insert to authenticated with check (applicant_user_id = (select auth.uid()) and review_status = 'pending' and reviewed_by is null and reviewed_at is null);
drop policy if exists health_provider_applications_update_own_pending on public.health_provider_applications;
create policy health_provider_applications_update_own_pending on public.health_provider_applications for update to authenticated using (applicant_user_id = (select auth.uid()) and review_status in ('pending','needs_information')) with check (applicant_user_id = (select auth.uid()) and review_status in ('pending','needs_information') and reviewed_by is null and reviewed_at is null);
drop policy if exists health_provider_applications_admin_manage on public.health_provider_applications;
create policy health_provider_applications_admin_manage on public.health_provider_applications for all to authenticated using (public.is_super_admin()) with check (public.is_super_admin());
grant select, insert, update on public.health_provider_applications to authenticated;

create table if not exists public.health_on_call_schedules (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.business_profiles(id) on delete cascade,
  professional_id uuid null references public.health_professionals(id) on delete set null,
  service_type text not null check (service_type in ('pharmacy','doctor','clinic','hospital','laboratory','emergency','other')),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status text not null default 'pending' check (status in ('pending','verified','rejected','expired')),
  verification_source text null,
  verified_by uuid null references auth.users(id) on delete set null,
  verified_at timestamptz null,
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint health_on_call_valid_period check (ends_at > starts_at),
  constraint health_on_call_verified_metadata check ((status <> 'verified') or (verified_at is not null and verification_source is not null))
);
create index if not exists health_on_call_business_period_idx on public.health_on_call_schedules(business_id, starts_at, ends_at);
create index if not exists health_on_call_public_period_idx on public.health_on_call_schedules(status, starts_at, ends_at);
alter table public.health_on_call_schedules enable row level security;
drop policy if exists health_on_call_public_verified_read on public.health_on_call_schedules;
create policy health_on_call_public_verified_read on public.health_on_call_schedules for select to anon, authenticated using (status = 'verified' and starts_at <= now() and ends_at > now());
drop policy if exists health_on_call_business_manage on public.health_on_call_schedules;
create policy health_on_call_business_manage on public.health_on_call_schedules for all to authenticated using (public.is_super_admin() or public.user_has_business_access(business_id)) with check (public.is_super_admin() or (public.user_has_business_access(business_id) and created_by = (select auth.uid()) and status = 'pending' and verified_by is null and verified_at is null));
grant select, insert, update on public.health_on_call_schedules to authenticated;
grant select on public.health_on_call_schedules to anon;
