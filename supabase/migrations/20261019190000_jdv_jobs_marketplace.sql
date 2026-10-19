-- JDV JOBS: public job marketplace with isolated employer/applicant access.
-- This migration is staged in GitHub only; it is not applied to the production database.
create table if not exists public.jdv_jobs (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(trim(title)) between 3 and 180),
  company_name text not null check (char_length(trim(company_name)) between 2 and 180),
  location text,
  employment_type text not null default 'full_time'
    check (employment_type in ('full_time','part_time','contract','temporary','internship','freelance')),
  description text not null check (char_length(trim(description)) between 20 and 12000),
  salary_min numeric(14,2) check (salary_min is null or salary_min >= 0),
  salary_max numeric(14,2) check (salary_max is null or salary_max >= 0),
  salary_currency text not null default 'XOF' check (char_length(salary_currency) = 3),
  status text not null default 'published' check (status in ('draft','published','closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (salary_min is null or salary_max is null or salary_max >= salary_min)
);

create table if not exists public.jdv_job_applications (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jdv_jobs(id) on delete cascade,
  applicant_id uuid not null references auth.users(id) on delete cascade,
  cover_letter text check (cover_letter is null or char_length(cover_letter) <= 6000),
  status text not null default 'submitted'
    check (status in ('submitted','reviewing','interview','offered','rejected','withdrawn')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (job_id, applicant_id)
);

create index if not exists idx_jdv_jobs_public_search
  on public.jdv_jobs (status, created_at desc);
create index if not exists idx_jdv_jobs_owner
  on public.jdv_jobs (owner_id, created_at desc);
create index if not exists idx_jdv_job_applications_applicant
  on public.jdv_job_applications (applicant_id, created_at desc);
create index if not exists idx_jdv_job_applications_job
  on public.jdv_job_applications (job_id, created_at desc);

alter table public.jdv_jobs enable row level security;
alter table public.jdv_job_applications enable row level security;

drop policy if exists "jdv_jobs_public_read_published" on public.jdv_jobs;
create policy "jdv_jobs_public_read_published" on public.jdv_jobs
  for select to anon, authenticated using (status = 'published' or owner_id = auth.uid());

drop policy if exists "jdv_jobs_owner_insert" on public.jdv_jobs;
create policy "jdv_jobs_owner_insert" on public.jdv_jobs
  for insert to authenticated with check (owner_id = auth.uid());

drop policy if exists "jdv_jobs_owner_update" on public.jdv_jobs;
create policy "jdv_jobs_owner_update" on public.jdv_jobs
  for update to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());

drop policy if exists "jdv_jobs_owner_delete" on public.jdv_jobs;
create policy "jdv_jobs_owner_delete" on public.jdv_jobs
  for delete to authenticated using (owner_id = auth.uid());

drop policy if exists "jdv_job_applications_applicant_or_employer_read" on public.jdv_job_applications;
create policy "jdv_job_applications_applicant_or_employer_read" on public.jdv_job_applications
  for select to authenticated using (
    applicant_id = auth.uid()
    or exists (select 1 from public.jdv_jobs j where j.id = job_id and j.owner_id = auth.uid())
  );

drop policy if exists "jdv_job_applications_applicant_insert" on public.jdv_job_applications;
create policy "jdv_job_applications_applicant_insert" on public.jdv_job_applications
  for insert to authenticated with check (
    applicant_id = auth.uid()
    and exists (
      select 1 from public.jdv_jobs j
      where j.id = job_id and j.status = 'published' and j.owner_id <> auth.uid()
    )
  );

drop policy if exists "jdv_job_applications_employer_update" on public.jdv_job_applications;
create policy "jdv_job_applications_employer_update" on public.jdv_job_applications
  for update to authenticated using (
    exists (select 1 from public.jdv_jobs j where j.id = job_id and j.owner_id = auth.uid())
  ) with check (
    exists (select 1 from public.jdv_jobs j where j.id = job_id and j.owner_id = auth.uid())
  );

create or replace function public.jdv_jobs_set_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists jdv_jobs_updated_at on public.jdv_jobs;
create trigger jdv_jobs_updated_at before update on public.jdv_jobs
  for each row execute function public.jdv_jobs_set_updated_at();
drop trigger if exists jdv_job_applications_updated_at on public.jdv_job_applications;
create trigger jdv_job_applications_updated_at before update on public.jdv_job_applications
  for each row execute function public.jdv_jobs_set_updated_at();
