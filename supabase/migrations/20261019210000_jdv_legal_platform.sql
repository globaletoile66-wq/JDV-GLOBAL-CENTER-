-- JDV Legal: directory, public legal library and private consultation requests.
-- Apply only after review in the project's migration workflow.
create extension if not exists pgcrypto;

create table if not exists public.legal_professionals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  display_name text not null check (length(trim(display_name)) between 2 and 180),
  professional_type text not null check (professional_type in ('lawyer','law_firm','notary','bailiff','legal_advisor','mediator','legal_aid')),
  country_code text not null check (country_code ~ '^[A-Z]{2}$'),
  city text,
  firm_name text,
  specialties text[] not null default '{}',
  languages text[] not null default '{}',
  biography text,
  verification_status text not null default 'pending' check (verification_status in ('pending','verified','rejected','suspended')),
  verification_notes text,
  is_active boolean not null default false,
  public_contact_email text,
  public_phone text,
  website_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists legal_professionals_directory_idx
  on public.legal_professionals (country_code, professional_type, verification_status, is_active);

create table if not exists public.legal_resources (
  id uuid primary key default gen_random_uuid(),
  title text not null check (length(trim(title)) between 2 and 300),
  summary text,
  resource_type text not null check (resource_type in ('law','case_law','book','guide','article','template')),
  country_code text not null check (country_code ~ '^[A-Z]{2}$'),
  legal_area text,
  language text not null default 'fr',
  author text,
  publisher text,
  publication_date date,
  source_url text,
  rights_status text not null default 'source_link' check (rights_status in ('public_domain','licensed','source_link','permission_pending')),
  publication_status text not null default 'draft' check (publication_status in ('draft','published','archived')),
  source_name text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists legal_resources_search_idx
  on public.legal_resources (country_code, resource_type, publication_status, publication_date desc);
create index if not exists legal_resources_title_idx on public.legal_resources using gin (to_tsvector('simple', title));

create table if not exists public.legal_consultation_requests (
  id uuid primary key default gen_random_uuid(),
  requester_user_id uuid not null references auth.users(id) on delete cascade,
  professional_id uuid not null references public.legal_professionals(id) on delete restrict,
  subject text not null check (length(trim(subject)) between 3 and 160),
  description text not null check (length(trim(description)) between 15 and 5000),
  legal_area text not null,
  country_code text not null check (country_code ~ '^[A-Z]{2}$'),
  status text not null default 'requested' check (status in ('requested','pending','accepted','rejected','completed','cancelled')),
  scheduled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists legal_consultation_owner_idx
  on public.legal_consultation_requests (requester_user_id, created_at desc);
create index if not exists legal_consultation_professional_idx
  on public.legal_consultation_requests (professional_id, status, created_at desc);

alter table public.legal_professionals enable row level security;
alter table public.legal_resources enable row level security;
alter table public.legal_consultation_requests enable row level security;

drop policy if exists "legal professionals public verified directory" on public.legal_professionals;
create policy "legal professionals public verified directory"
  on public.legal_professionals for select to anon, authenticated
  using (verification_status = 'verified' and is_active = true);

drop policy if exists "legal professionals owner read own profile" on public.legal_professionals;
create policy "legal professionals owner read own profile"
  on public.legal_professionals for select to authenticated
  using (user_id = auth.uid());

drop policy if exists "legal professionals owner submit profile" on public.legal_professionals;
create policy "legal professionals owner submit profile"
  on public.legal_professionals for insert to authenticated
  with check (user_id = auth.uid() and verification_status = 'pending' and is_active = false);

drop policy if exists "legal professionals owner update pending profile" on public.legal_professionals;
create policy "legal professionals owner update pending profile"
  on public.legal_professionals for update to authenticated
  using (user_id = auth.uid() and verification_status in ('pending','rejected'))
  with check (user_id = auth.uid() and verification_status in ('pending','rejected') and is_active = false);

drop policy if exists "legal resources public published" on public.legal_resources;
create policy "legal resources public published"
  on public.legal_resources for select to anon, authenticated
  using (publication_status = 'published');

drop policy if exists "legal consultations requester read own" on public.legal_consultation_requests;
create policy "legal consultations requester read own"
  on public.legal_consultation_requests for select to authenticated
  using (requester_user_id = auth.uid());

drop policy if exists "legal consultations requester create own" on public.legal_consultation_requests;
create policy "legal consultations requester create own"
  on public.legal_consultation_requests for insert to authenticated
  with check (
    requester_user_id = auth.uid()
    and exists (
      select 1 from public.legal_professionals p
      where p.id = professional_id and p.verification_status = 'verified' and p.is_active = true
    )
  );

-- No public write policies for legal resources and no client-side publication/verification privileges.
-- Consultation access for the selected professional and privileged moderation require dedicated audited policies/RPCs.

drop policy if exists "legal consultations assigned professional read" on public.legal_consultation_requests;
create policy "legal consultations assigned professional read"
  on public.legal_consultation_requests for select to authenticated
  using (
    exists (
      select 1 from public.legal_professionals p
      where p.id = professional_id and p.user_id = auth.uid()
        and p.verification_status = 'verified' and p.is_active = true
    )
  );

-- A professional can only see requests explicitly assigned to their verified profile.
-- Status transitions are intentionally not exposed to the client until an audited workflow is added.
