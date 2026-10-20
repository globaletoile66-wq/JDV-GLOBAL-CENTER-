-- JDV Immo persistent workflows (draft migration; review before applying to Supabase).
-- All workflow tables are isolated to JDV Immo. No historical CRM tables are modified.

create table if not exists public.immo_agent_applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  business_id uuid references public.business_profiles(id) on delete set null,
  full_name text not null,
  phone text,
  territory text,
  specialties text[] not null default '{}',
  license_number text,
  experience_years integer not null default 0 check (experience_years >= 0),
  documents jsonb not null default '[]'::jsonb,
  application_status text not null default 'pending' check (application_status in ('pending','under_review','qualified','rejected','suspended')),
  reviewer_notes text,
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id)
);

create table if not exists public.immo_mandates (
  id uuid primary key default gen_random_uuid(),
  property_id uuid references public.immo_properties(id) on delete set null,
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  agent_user_id uuid references auth.users(id) on delete set null,
  mandate_type text not null default 'rental' check (mandate_type in ('sale','rental','management','valuation','construction')),
  title text not null,
  terms jsonb not null default '{}'::jsonb,
  commission_rate numeric(7,4) not null default 0 check (commission_rate >= 0 and commission_rate <= 100),
  starts_on date,
  expires_on date,
  owner_accepted_at timestamptz,
  agent_accepted_at timestamptz,
  mandate_status text not null default 'draft' check (mandate_status in ('draft','pending_signature','active','expired','terminated','disputed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (expires_on is null or starts_on is null or expires_on >= starts_on)
);

create table if not exists public.immo_commission_rules (
  id uuid primary key default gen_random_uuid(),
  rule_name text not null,
  transaction_type text not null check (transaction_type in ('sale','rental','management','construction','other')),
  country_code text,
  currency_code text not null default 'XOF',
  platform_rate numeric(7,4) not null default 0 check (platform_rate between 0 and 100),
  agent_rate numeric(7,4) not null default 0 check (agent_rate between 0 and 100),
  professional_fee numeric(14,2) not null default 0 check (professional_fee >= 0),
  terms jsonb not null default '{}'::jsonb,
  rule_status text not null default 'draft' check (rule_status in ('draft','under_review','approved','rejected','retired')),
  created_by uuid not null references auth.users(id) on delete cascade,
  validated_by uuid references auth.users(id) on delete set null,
  validated_at timestamptz,
  effective_from date,
  effective_until date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (effective_until is null or effective_from is null or effective_until >= effective_from)
);

create table if not exists public.immo_tenant_followups (
  id uuid primary key default gen_random_uuid(),
  lease_id uuid not null references public.immo_leases(id) on delete cascade,
  author_user_id uuid not null references auth.users(id) on delete cascade,
  followup_type text not null default 'note' check (followup_type in ('note','rent_due','payment_reported','maintenance','inspection','renewal','termination','document','complaint')),
  subject text not null,
  details text not null default '',
  due_at timestamptz,
  followup_status text not null default 'open' check (followup_status in ('open','in_progress','resolved','cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.immo_disputes (
  id uuid primary key default gen_random_uuid(),
  opened_by uuid not null references auth.users(id) on delete cascade,
  respondent_user_id uuid references auth.users(id) on delete set null,
  property_id uuid references public.immo_properties(id) on delete set null,
  lease_id uuid references public.immo_leases(id) on delete set null,
  mandate_id uuid references public.immo_mandates(id) on delete set null,
  subject text not null,
  description text not null,
  evidence jsonb not null default '[]'::jsonb,
  dispute_status text not null default 'open' check (dispute_status in ('open','awaiting_response','mediation','resolved','rejected','closed')),
  resolution_summary text,
  resolved_by uuid references auth.users(id) on delete set null,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.immo_construction_briefs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'Avant-projet JDV Immo',
  parcel_area numeric(12,2) not null default 0 check (parcel_area >= 0),
  brief jsonb not null default '{}'::jsonb,
  brief_status text not null default 'draft' check (brief_status in ('draft','submitted','under_review','quoted','approved','archived')),
  assigned_professional_user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists immo_agent_applications_user_status_idx on public.immo_agent_applications(user_id, application_status);
create index if not exists immo_mandates_owner_status_idx on public.immo_mandates(owner_user_id, mandate_status);
create index if not exists immo_mandates_agent_status_idx on public.immo_mandates(agent_user_id, mandate_status);
create index if not exists immo_commission_rules_status_idx on public.immo_commission_rules(rule_status, transaction_type);
create index if not exists immo_tenant_followups_lease_due_idx on public.immo_tenant_followups(lease_id, due_at);
create index if not exists immo_disputes_parties_status_idx on public.immo_disputes(opened_by, respondent_user_id, dispute_status);
create index if not exists immo_construction_briefs_user_updated_idx on public.immo_construction_briefs(user_id, updated_at desc);

alter table public.immo_agent_applications enable row level security;
alter table public.immo_mandates enable row level security;
alter table public.immo_commission_rules enable row level security;
alter table public.immo_tenant_followups enable row level security;
alter table public.immo_disputes enable row level security;
alter table public.immo_construction_briefs enable row level security;

drop policy if exists "Applicants read own JDV Immo application" on public.immo_agent_applications;
create policy "Applicants read own JDV Immo application" on public.immo_agent_applications for select to authenticated using (user_id = auth.uid());
drop policy if exists "Applicants create own JDV Immo application" on public.immo_agent_applications;
create policy "Applicants create own JDV Immo application" on public.immo_agent_applications for insert to authenticated with check (user_id = auth.uid() and application_status = 'pending');
drop policy if exists "Applicants edit pending JDV Immo application" on public.immo_agent_applications;
create policy "Applicants edit pending JDV Immo application" on public.immo_agent_applications for update to authenticated using (user_id = auth.uid() and application_status = 'pending') with check (user_id = auth.uid() and application_status = 'pending');

drop policy if exists "Owners and assigned agents read mandates" on public.immo_mandates;
create policy "Owners and assigned agents read mandates" on public.immo_mandates for select to authenticated using (owner_user_id = auth.uid() or agent_user_id = auth.uid());
drop policy if exists "Owners create own draft mandates" on public.immo_mandates;
create policy "Owners create own draft mandates" on public.immo_mandates for insert to authenticated with check (owner_user_id = auth.uid() and mandate_status = 'draft');
drop policy if exists "Owners edit own draft mandates" on public.immo_mandates;
create policy "Owners edit own draft mandates" on public.immo_mandates for update to authenticated using (owner_user_id = auth.uid() and mandate_status = 'draft') with check (owner_user_id = auth.uid() and mandate_status = 'draft');

drop policy if exists "Users read approved commission rules and own drafts" on public.immo_commission_rules;
create policy "Users read approved commission rules and own drafts" on public.immo_commission_rules for select to authenticated using (rule_status = 'approved' or created_by = auth.uid());
drop policy if exists "Users submit draft commission rules" on public.immo_commission_rules;
create policy "Users submit draft commission rules" on public.immo_commission_rules for insert to authenticated with check (created_by = auth.uid() and rule_status in ('draft','under_review'));
drop policy if exists "Creators edit unapproved commission drafts" on public.immo_commission_rules;
create policy "Creators edit unapproved commission drafts" on public.immo_commission_rules for update to authenticated using (created_by = auth.uid() and rule_status in ('draft','under_review')) with check (created_by = auth.uid() and rule_status in ('draft','under_review'));

drop policy if exists "Lease participants read tenant followups" on public.immo_tenant_followups;
create policy "Lease participants read tenant followups" on public.immo_tenant_followups for select to authenticated using (exists (select 1 from public.immo_leases l where l.id = lease_id and (l.tenant_user_id = auth.uid() or l.landlord_user_id = auth.uid())));
drop policy if exists "Lease participants create tenant followups" on public.immo_tenant_followups;
create policy "Lease participants create tenant followups" on public.immo_tenant_followups for insert to authenticated with check (author_user_id = auth.uid() and exists (select 1 from public.immo_leases l where l.id = lease_id and (l.tenant_user_id = auth.uid() or l.landlord_user_id = auth.uid())));
drop policy if exists "Authors edit own open tenant followups" on public.immo_tenant_followups;
create policy "Authors edit own open tenant followups" on public.immo_tenant_followups for update to authenticated using (author_user_id = auth.uid() and followup_status = 'open') with check (author_user_id = auth.uid() and followup_status in ('open','in_progress','resolved','cancelled'));

drop policy if exists "Dispute parties read case" on public.immo_disputes;
create policy "Dispute parties read case" on public.immo_disputes for select to authenticated using (opened_by = auth.uid() or respondent_user_id = auth.uid());
drop policy if exists "Users open own disputes" on public.immo_disputes;
create policy "Users open own disputes" on public.immo_disputes for insert to authenticated with check (opened_by = auth.uid() and dispute_status = 'open');
drop policy if exists "Openers edit unresolved disputes" on public.immo_disputes;
create policy "Openers edit unresolved disputes" on public.immo_disputes for update to authenticated using (opened_by = auth.uid() and dispute_status in ('open','awaiting_response')) with check (opened_by = auth.uid() and dispute_status in ('open','awaiting_response'));

drop policy if exists "Users read own construction briefs" on public.immo_construction_briefs;
create policy "Users read own construction briefs" on public.immo_construction_briefs for select to authenticated using (user_id = auth.uid() or assigned_professional_user_id = auth.uid());
drop policy if exists "Users create own construction briefs" on public.immo_construction_briefs;
create policy "Users create own construction briefs" on public.immo_construction_briefs for insert to authenticated with check (user_id = auth.uid());
drop policy if exists "Users edit own construction drafts" on public.immo_construction_briefs;
create policy "Users edit own construction drafts" on public.immo_construction_briefs for update to authenticated using (user_id = auth.uid() and brief_status = 'draft') with check (user_id = auth.uid() and brief_status = 'draft');

comment on table public.immo_agent_applications is 'Applications for JDV Immo agent qualification; final approval is reserved to trusted administration.';
comment on table public.immo_mandates is 'Owner-to-agent mandate workflow with draft and acceptance metadata.';
comment on table public.immo_commission_rules is 'Commission rule proposals; only trusted server-side administration may validate approved rules.';
comment on table public.immo_tenant_followups is 'Persistent lease and tenant follow-up log visible only to lease participants.';
comment on table public.immo_disputes is 'JDV Immo dispute and mediation workflow; resolution is reserved to trusted administration.';
comment on table public.immo_construction_briefs is 'Persisted construction requirements and indicative plans generated by JDV Immo.';


-- Trusted super-admin review policies. The existing server-side super_admins check remains authoritative.
drop policy if exists "Super admins review all agent applications" on public.immo_agent_applications;
create policy "Super admins review all agent applications" on public.immo_agent_applications for select to authenticated using (exists (select 1 from public.super_admins sa where sa.user_id = auth.uid() and sa.admin_status = 'active'));
drop policy if exists "Super admins qualify agent applications" on public.immo_agent_applications;
create policy "Super admins qualify agent applications" on public.immo_agent_applications for update to authenticated using (exists (select 1 from public.super_admins sa where sa.user_id = auth.uid() and sa.admin_status = 'active')) with check (exists (select 1 from public.super_admins sa where sa.user_id = auth.uid() and sa.admin_status = 'active'));

drop policy if exists "Super admins review all commission rules" on public.immo_commission_rules;
create policy "Super admins review all commission rules" on public.immo_commission_rules for select to authenticated using (exists (select 1 from public.super_admins sa where sa.user_id = auth.uid() and sa.admin_status = 'active'));
drop policy if exists "Super admins validate commission rules" on public.immo_commission_rules;
create policy "Super admins validate commission rules" on public.immo_commission_rules for update to authenticated using (exists (select 1 from public.super_admins sa where sa.user_id = auth.uid() and sa.admin_status = 'active')) with check (exists (select 1 from public.super_admins sa where sa.user_id = auth.uid() and sa.admin_status = 'active'));

drop policy if exists "Super admins review all disputes" on public.immo_disputes;
create policy "Super admins review all disputes" on public.immo_disputes for select to authenticated using (exists (select 1 from public.super_admins sa where sa.user_id = auth.uid() and sa.admin_status = 'active'));
drop policy if exists "Super admins resolve disputes" on public.immo_disputes;
create policy "Super admins resolve disputes" on public.immo_disputes for update to authenticated using (exists (select 1 from public.super_admins sa where sa.user_id = auth.uid() and sa.admin_status = 'active')) with check (exists (select 1 from public.super_admins sa where sa.user_id = auth.uid() and sa.admin_status = 'active'));

drop policy if exists "Super admins review all mandates" on public.immo_mandates;
create policy "Super admins review all mandates" on public.immo_mandates for select to authenticated using (exists (select 1 from public.super_admins sa where sa.user_id = auth.uid() and sa.admin_status = 'active'));
drop policy if exists "Super admins administer mandates" on public.immo_mandates;
create policy "Super admins administer mandates" on public.immo_mandates for update to authenticated using (exists (select 1 from public.super_admins sa where sa.user_id = auth.uid() and sa.admin_status = 'active')) with check (exists (select 1 from public.super_admins sa where sa.user_id = auth.uid() and sa.admin_status = 'active'));

drop policy if exists "Super admins review construction briefs" on public.immo_construction_briefs;
create policy "Super admins review construction briefs" on public.immo_construction_briefs for select to authenticated using (exists (select 1 from public.super_admins sa where sa.user_id = auth.uid() and sa.admin_status = 'active'));
drop policy if exists "Super admins assign construction professionals" on public.immo_construction_briefs;
create policy "Super admins assign construction professionals" on public.immo_construction_briefs for update to authenticated using (exists (select 1 from public.super_admins sa where sa.user_id = auth.uid() and sa.admin_status = 'active')) with check (exists (select 1 from public.super_admins sa where sa.user_id = auth.uid() and sa.admin_status = 'active'));

drop policy if exists "Super admins review tenant followups" on public.immo_tenant_followups;
create policy "Super admins review tenant followups" on public.immo_tenant_followups for select to authenticated using (exists (select 1 from public.super_admins sa where sa.user_id = auth.uid() and sa.admin_status = 'active'));
