create table if not exists public.health_teleconsultation_requests (
  id uuid primary key default gen_random_uuid(),
  patient_user_id uuid not null references auth.users(id) on delete cascade,
  professional_id uuid not null references public.health_professionals(id) on delete restrict,
  requested_at timestamptz null,
  consultation_mode text not null default 'video' check (consultation_mode in ('video','phone','in_person')),
  reason_summary text not null check (length(trim(reason_summary)) between 5 and 2000),
  request_status text not null default 'requested' check (request_status in ('requested','accepted','declined','completed','cancelled')),
  meeting_url text null,
  professional_notes text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists health_teleconsult_patient_idx on public.health_teleconsultation_requests(patient_user_id, created_at desc);
create index if not exists health_teleconsult_professional_idx on public.health_teleconsultation_requests(professional_id, request_status, created_at desc);
alter table public.health_teleconsultation_requests enable row level security;
drop policy if exists health_teleconsult_select_participants on public.health_teleconsultation_requests;
create policy health_teleconsult_select_participants on public.health_teleconsultation_requests for select to authenticated using (patient_user_id = (select auth.uid()) or exists (select 1 from public.health_professionals hp where hp.id = professional_id and hp.user_id = (select auth.uid())) or public.is_super_admin());
drop policy if exists health_teleconsult_patient_insert on public.health_teleconsultation_requests;
create policy health_teleconsult_patient_insert on public.health_teleconsultation_requests for insert to authenticated with check (patient_user_id = (select auth.uid()) and request_status = 'requested' and meeting_url is null and professional_notes is null and exists (select 1 from public.health_professionals hp where hp.id = professional_id and hp.is_active = true and hp.verification_status::text = 'verified'));
drop policy if exists health_teleconsult_professional_update on public.health_teleconsultation_requests;
create policy health_teleconsult_professional_update on public.health_teleconsultation_requests for update to authenticated using (exists (select 1 from public.health_professionals hp where hp.id = professional_id and hp.user_id = (select auth.uid())) or public.is_super_admin()) with check (exists (select 1 from public.health_professionals hp where hp.id = professional_id and hp.user_id = (select auth.uid())) or public.is_super_admin());
grant select, insert on public.health_teleconsultation_requests to authenticated;
grant update (requested_at, request_status, meeting_url, professional_notes, updated_at) on public.health_teleconsultation_requests to authenticated;