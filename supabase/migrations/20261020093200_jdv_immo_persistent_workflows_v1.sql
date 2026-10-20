-- JDV Immo persistent workflows, reconciled with the active schema.
-- Preserves the stricter existing construction-brief customer policies and keeps generic Studio config private.
-- No historical CRM tables are modified.

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

create index if not exists immo_agent_applications_status_idx on public.immo_agent_applications(application_status);
create index if not exists immo_agent_applications_business_id_idx on public.immo_agent_applications(business_id);
create index if not exists immo_agent_applications_reviewed_by_idx on public.immo_agent_applications(reviewed_by);
create index if not exists immo_mandates_owner_status_idx on public.immo_mandates(owner_user_id, mandate_status);
create index if not exists immo_mandates_agent_status_idx on public.immo_mandates(agent_user_id, mandate_status);
create index if not exists immo_mandates_property_id_idx on public.immo_mandates(property_id);
create index if not exists immo_commission_rules_status_idx on public.immo_commission_rules(rule_status, transaction_type);
create index if not exists immo_commission_rules_created_by_idx on public.immo_commission_rules(created_by);
create index if not exists immo_commission_rules_validated_by_idx on public.immo_commission_rules(validated_by);
create index if not exists immo_tenant_followups_lease_due_idx on public.immo_tenant_followups(lease_id, due_at);
create index if not exists immo_tenant_followups_author_user_id_idx on public.immo_tenant_followups(author_user_id);
create index if not exists immo_disputes_parties_status_idx on public.immo_disputes(opened_by, respondent_user_id, dispute_status);
create index if not exists immo_disputes_respondent_user_id_idx on public.immo_disputes(respondent_user_id);
create index if not exists immo_disputes_property_id_idx on public.immo_disputes(property_id);
create index if not exists immo_disputes_lease_id_idx on public.immo_disputes(lease_id);
create index if not exists immo_disputes_mandate_id_idx on public.immo_disputes(mandate_id);
create index if not exists immo_disputes_resolved_by_idx on public.immo_disputes(resolved_by);
create index if not exists immo_construction_briefs_user_updated_idx on public.immo_construction_briefs(user_id, updated_at desc);

alter table public.immo_agent_applications enable row level security;
alter table public.immo_mandates enable row level security;
alter table public.immo_commission_rules enable row level security;
alter table public.immo_tenant_followups enable row level security;
alter table public.immo_disputes enable row level security;
alter table public.immo_construction_briefs enable row level security;

grant select, insert, update on public.immo_agent_applications, public.immo_mandates, public.immo_commission_rules, public.immo_tenant_followups, public.immo_disputes to authenticated;

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

-- Existing customer policies for immo_construction_briefs are deliberately preserved.

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


-- Global Studio preferences and public brand media. Only active Super Admins can publish global settings/assets.
create table if not exists public.jdv_studio_settings (
  scope_key text primary key check (scope_key = 'global'),
  config jsonb not null default '{}'::jsonb,
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now(),
  constraint jdv_studio_settings_public_config_check check (
    (config - array['theme','design']) = '{}'::jsonb
    and (
      not (config ? 'theme') or (
        jsonb_typeof(config->'theme') = 'object'
        and (config->'theme' - array['primary','accent']) = '{}'::jsonb
        and coalesce(config->'theme'->>'primary','') ~ '^#[0-9A-Fa-f]{6}$'
        and coalesce(config->'theme'->>'accent','') ~ '^#[0-9A-Fa-f]{6}$'
      )
    )
    and (
      not (config ? 'design') or (
        jsonb_typeof(config->'design') = 'object'
        and (config->'design' - array['font','radius','density','cardStyle','showMedia','showHighlights','showAnimations','imageUrl','videoUrl','imageData','videoData']) = '{}'::jsonb
        and coalesce(config->'design'->>'imageData','') = ''
        and coalesce(config->'design'->>'videoData','') = ''
      )
    )
  )
);
create index if not exists jdv_studio_settings_updated_by_idx on public.jdv_studio_settings(updated_by);
insert into public.jdv_studio_settings (scope_key, config) values ('global', '{}'::jsonb) on conflict (scope_key) do nothing;
alter table public.jdv_studio_settings enable row level security;
grant select, insert, update on public.jdv_studio_settings to authenticated;
drop policy if exists "Super admins read global Studio settings" on public.jdv_studio_settings;
drop policy if exists "Authenticated users read global Studio settings" on public.jdv_studio_settings;
create policy "Public read safe global Studio settings" on public.jdv_studio_settings for select to anon, authenticated using (true);
grant select (scope_key, config) on public.jdv_studio_settings to anon;
drop policy if exists "Super admins create global Studio settings" on public.jdv_studio_settings;
create policy "Super admins create global Studio settings" on public.jdv_studio_settings for insert to authenticated with check (exists (select 1 from public.super_admins sa where sa.user_id = auth.uid() and sa.admin_status = 'active'));
drop policy if exists "Super admins update global Studio settings" on public.jdv_studio_settings;
create policy "Super admins update global Studio settings" on public.jdv_studio_settings for update to authenticated using (exists (select 1 from public.super_admins sa where sa.user_id = auth.uid() and sa.admin_status = 'active')) with check (exists (select 1 from public.super_admins sa where sa.user_id = auth.uid() and sa.admin_status = 'active'));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('jdv-studio-media', 'jdv-studio-media', true, 10485760, array['image/jpeg','image/png','image/webp','image/gif','video/mp4','video/webm','video/quicktime'])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;
drop policy if exists "Public read JDV Studio brand media" on storage.objects;
create policy "Public read JDV Studio brand media" on storage.objects for select to public using (bucket_id = 'jdv-studio-media');
drop policy if exists "Super admins upload JDV Studio brand media" on storage.objects;
create policy "Super admins upload JDV Studio brand media" on storage.objects for insert to authenticated with check (bucket_id = 'jdv-studio-media' and exists (select 1 from public.super_admins sa where sa.user_id = auth.uid() and sa.admin_status = 'active'));
drop policy if exists "Super admins update JDV Studio brand media" on storage.objects;
create policy "Super admins update JDV Studio brand media" on storage.objects for update to authenticated using (bucket_id = 'jdv-studio-media' and exists (select 1 from public.super_admins sa where sa.user_id = auth.uid() and sa.admin_status = 'active')) with check (bucket_id = 'jdv-studio-media' and exists (select 1 from public.super_admins sa where sa.user_id = auth.uid() and sa.admin_status = 'active'));
drop policy if exists "Super admins delete JDV Studio brand media" on storage.objects;
create policy "Super admins delete JDV Studio brand media" on storage.objects for delete to authenticated using (bucket_id = 'jdv-studio-media' and exists (select 1 from public.super_admins sa where sa.user_id = auth.uid() and sa.admin_status = 'active'));



-- Owners may submit their own draft mandate for signatures; only this function advances the workflow.
create or replace function public.submit_immo_mandate(p_mandate_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  submitted_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;
  update public.immo_mandates
  set mandate_status = 'pending_signature', updated_at = now()
  where id = p_mandate_id and owner_user_id = auth.uid() and mandate_status = 'draft'
  returning id into submitted_id;
  if submitted_id is null then
    raise exception 'Draft mandate not found or not owned by current user';
  end if;
  return submitted_id;
end;
$$;
revoke all on function public.submit_immo_mandate(uuid) from public;
grant execute on function public.submit_immo_mandate(uuid) to authenticated;

-- A participant can accept only their own side of a mandate; activation requires both acceptances.
create or replace function public.accept_immo_mandate(p_mandate_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  accepted_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  update public.immo_mandates m
  set owner_accepted_at = case
        when m.owner_user_id = auth.uid() then coalesce(m.owner_accepted_at, now())
        else m.owner_accepted_at
      end,
      agent_accepted_at = case
        when m.agent_user_id = auth.uid() then coalesce(m.agent_accepted_at, now())
        else m.agent_accepted_at
      end,
      mandate_status = case
        when (m.owner_accepted_at is not null or m.owner_user_id = auth.uid())
         and (m.agent_accepted_at is not null or m.agent_user_id = auth.uid())
         and m.agent_user_id is not null then 'active'
        else 'pending_signature'
      end,
      updated_at = now()
  where m.id = p_mandate_id
    and m.mandate_status = 'pending_signature'
    and (m.owner_user_id = auth.uid() or m.agent_user_id = auth.uid())
  returning m.id into accepted_id;

  if accepted_id is null then
    raise exception 'Mandate not found, not awaiting signatures, or user is not a participant';
  end if;
  return accepted_id;
end;
$$;
revoke all on function public.accept_immo_mandate(uuid) from public;
grant execute on function public.accept_immo_mandate(uuid) to authenticated;


-- Qualification writes are centralized here so an approved application becomes a usable Immo agent.
create or replace function public.review_immo_agent_application(
  p_application_id uuid,
  p_status text,
  p_reviewer_notes text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_application public.immo_agent_applications%rowtype;
  v_agent_id uuid;
begin
  if auth.uid() is null or not exists (
    select 1 from public.super_admins sa
    where sa.user_id = auth.uid() and sa.admin_status = 'active'
  ) then
    raise exception 'Active Super Admin required';
  end if;
  if p_status not in ('under_review','qualified','rejected','suspended') then
    raise exception 'Unsupported qualification status';
  end if;

  select * into v_application
  from public.immo_agent_applications
  where id = p_application_id
  for update;

  if not found then
    raise exception 'Agent application not found';
  end if;
  if p_status = 'qualified' and v_application.business_id is null then
    raise exception 'A business profile must be assigned before qualifying this agent';
  end if;

  update public.immo_agent_applications
  set application_status = p_status,
      reviewer_notes = p_reviewer_notes,
      reviewed_by = auth.uid(),
      reviewed_at = now(),
      updated_at = now()
  where id = p_application_id;

  select id into v_agent_id
  from public.immo_agents
  where user_id = v_application.user_id
  order by created_at asc
  limit 1;

  if p_status = 'qualified' then
    if v_agent_id is null then
      insert into public.immo_agents (user_id, business_id, specialties, zones, verification_status)
      values (
        v_application.user_id,
        v_application.business_id,
        coalesce(v_application.specialties, '{}'::text[]),
        case when nullif(trim(v_application.territory), '') is null then '{}'::text[] else array[v_application.territory] end,
        'verified'
      );
    else
      update public.immo_agents
      set business_id = coalesce(v_application.business_id, business_id),
          specialties = coalesce(v_application.specialties, '{}'::text[]),
          zones = case when nullif(trim(v_application.territory), '') is null then zones else array[v_application.territory] end,
          verification_status = 'verified',
          updated_at = now()
      where id = v_agent_id;
    end if;
  elsif p_status in ('rejected','suspended') and v_agent_id is not null then
    update public.immo_agents
    set verification_status = p_status::public.immo_verification_status,
        updated_at = now()
    where id = v_agent_id;
  end if;

  return p_application_id;
end;
$$;
revoke all on function public.review_immo_agent_application(uuid, text, text) from public;
grant execute on function public.review_immo_agent_application(uuid, text, text) to authenticated;


create or replace function public.submit_immo_construction_brief(p_brief_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  submitted_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;
  update public.immo_construction_briefs
  set brief_status = 'submitted', updated_at = now()
  where id = p_brief_id and user_id = auth.uid() and brief_status = 'draft'
  returning id into submitted_id;
  if submitted_id is null then
    raise exception 'Draft not found or not owned by current user';
  end if;
  return submitted_id;
end;
$$;
revoke all on function public.submit_immo_construction_brief(uuid) from public;
grant execute on function public.submit_immo_construction_brief(uuid) to authenticated;

        and coalesce(config->'theme'->>'accent','') ~ '^#[0-9A-Fa-f]{6}
create index if not exists jdv_studio_settings_updated_by_idx on public.jdv_studio_settings(updated_by);
insert into public.jdv_studio_settings (scope_key, config) values ('global', '{}'::jsonb) on conflict (scope_key) do nothing;
alter table public.jdv_studio_settings enable row level security;
grant select, insert, update on public.jdv_studio_settings to authenticated;
drop policy if exists "Super admins read global Studio settings" on public.jdv_studio_settings;
create policy "Super admins read global Studio settings" on public.jdv_studio_settings for select to authenticated using (exists (select 1 from public.super_admins sa where sa.user_id = auth.uid() and sa.admin_status = 'active'));
drop policy if exists "Super admins create global Studio settings" on public.jdv_studio_settings;
create policy "Super admins create global Studio settings" on public.jdv_studio_settings for insert to authenticated with check (exists (select 1 from public.super_admins sa where sa.user_id = auth.uid() and sa.admin_status = 'active'));
drop policy if exists "Super admins update global Studio settings" on public.jdv_studio_settings;
create policy "Super admins update global Studio settings" on public.jdv_studio_settings for update to authenticated using (exists (select 1 from public.super_admins sa where sa.user_id = auth.uid() and sa.admin_status = 'active')) with check (exists (select 1 from public.super_admins sa where sa.user_id = auth.uid() and sa.admin_status = 'active'));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('jdv-studio-media', 'jdv-studio-media', true, 10485760, array['image/jpeg','image/png','image/webp','image/gif','video/mp4','video/webm','video/quicktime'])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;
drop policy if exists "Public read JDV Studio brand media" on storage.objects;
create policy "Public read JDV Studio brand media" on storage.objects for select to public using (bucket_id = 'jdv-studio-media');
drop policy if exists "Super admins upload JDV Studio brand media" on storage.objects;
create policy "Super admins upload JDV Studio brand media" on storage.objects for insert to authenticated with check (bucket_id = 'jdv-studio-media' and exists (select 1 from public.super_admins sa where sa.user_id = auth.uid() and sa.admin_status = 'active'));
drop policy if exists "Super admins update JDV Studio brand media" on storage.objects;
create policy "Super admins update JDV Studio brand media" on storage.objects for update to authenticated using (bucket_id = 'jdv-studio-media' and exists (select 1 from public.super_admins sa where sa.user_id = auth.uid() and sa.admin_status = 'active')) with check (bucket_id = 'jdv-studio-media' and exists (select 1 from public.super_admins sa where sa.user_id = auth.uid() and sa.admin_status = 'active'));
drop policy if exists "Super admins delete JDV Studio brand media" on storage.objects;
create policy "Super admins delete JDV Studio brand media" on storage.objects for delete to authenticated using (bucket_id = 'jdv-studio-media' and exists (select 1 from public.super_admins sa where sa.user_id = auth.uid() and sa.admin_status = 'active'));



-- Owners may submit their own draft mandate for signatures; only this function advances the workflow.
create or replace function public.submit_immo_mandate(p_mandate_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  submitted_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;
  update public.immo_mandates
  set mandate_status = 'pending_signature', updated_at = now()
  where id = p_mandate_id and owner_user_id = auth.uid() and mandate_status = 'draft'
  returning id into submitted_id;
  if submitted_id is null then
    raise exception 'Draft mandate not found or not owned by current user';
  end if;
  return submitted_id;
end;
$$;
revoke all on function public.submit_immo_mandate(uuid) from public;
grant execute on function public.submit_immo_mandate(uuid) to authenticated;

-- A participant can accept only their own side of a mandate; activation requires both acceptances.
create or replace function public.accept_immo_mandate(p_mandate_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  accepted_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  update public.immo_mandates m
  set owner_accepted_at = case
        when m.owner_user_id = auth.uid() then coalesce(m.owner_accepted_at, now())
        else m.owner_accepted_at
      end,
      agent_accepted_at = case
        when m.agent_user_id = auth.uid() then coalesce(m.agent_accepted_at, now())
        else m.agent_accepted_at
      end,
      mandate_status = case
        when (m.owner_accepted_at is not null or m.owner_user_id = auth.uid())
         and (m.agent_accepted_at is not null or m.agent_user_id = auth.uid())
         and m.agent_user_id is not null then 'active'
        else 'pending_signature'
      end,
      updated_at = now()
  where m.id = p_mandate_id
    and m.mandate_status = 'pending_signature'
    and (m.owner_user_id = auth.uid() or m.agent_user_id = auth.uid())
  returning m.id into accepted_id;

  if accepted_id is null then
    raise exception 'Mandate not found, not awaiting signatures, or user is not a participant';
  end if;
  return accepted_id;
end;
$$;
revoke all on function public.accept_immo_mandate(uuid) from public;
grant execute on function public.accept_immo_mandate(uuid) to authenticated;


-- Qualification writes are centralized here so an approved application becomes a usable Immo agent.
create or replace function public.review_immo_agent_application(
  p_application_id uuid,
  p_status text,
  p_reviewer_notes text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_application public.immo_agent_applications%rowtype;
  v_agent_id uuid;
begin
  if auth.uid() is null or not exists (
    select 1 from public.super_admins sa
    where sa.user_id = auth.uid() and sa.admin_status = 'active'
  ) then
    raise exception 'Active Super Admin required';
  end if;
  if p_status not in ('under_review','qualified','rejected','suspended') then
    raise exception 'Unsupported qualification status';
  end if;

  select * into v_application
  from public.immo_agent_applications
  where id = p_application_id
  for update;

  if not found then
    raise exception 'Agent application not found';
  end if;
  if p_status = 'qualified' and v_application.business_id is null then
    raise exception 'A business profile must be assigned before qualifying this agent';
  end if;

  update public.immo_agent_applications
  set application_status = p_status,
      reviewer_notes = p_reviewer_notes,
      reviewed_by = auth.uid(),
      reviewed_at = now(),
      updated_at = now()
  where id = p_application_id;

  select id into v_agent_id
  from public.immo_agents
  where user_id = v_application.user_id
  order by created_at asc
  limit 1;

  if p_status = 'qualified' then
    if v_agent_id is null then
      insert into public.immo_agents (user_id, business_id, specialties, zones, verification_status)
      values (
        v_application.user_id,
        v_application.business_id,
        coalesce(v_application.specialties, '{}'::text[]),
        case when nullif(trim(v_application.territory), '') is null then '{}'::text[] else array[v_application.territory] end,
        'verified'
      );
    else
      update public.immo_agents
      set business_id = coalesce(v_application.business_id, business_id),
          specialties = coalesce(v_application.specialties, '{}'::text[]),
          zones = case when nullif(trim(v_application.territory), '') is null then zones else array[v_application.territory] end,
          verification_status = 'verified',
          updated_at = now()
      where id = v_agent_id;
    end if;
  elsif p_status in ('rejected','suspended') and v_agent_id is not null then
    update public.immo_agents
    set verification_status = p_status::public.immo_verification_status,
        updated_at = now()
    where id = v_agent_id;
  end if;

  return p_application_id;
end;
$$;
revoke all on function public.review_immo_agent_application(uuid, text, text) from public;
grant execute on function public.review_immo_agent_application(uuid, text, text) to authenticated;


create or replace function public.submit_immo_construction_brief(p_brief_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  submitted_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;
  update public.immo_construction_briefs
  set brief_status = 'submitted', updated_at = now()
  where id = p_brief_id and user_id = auth.uid() and brief_status = 'draft'
  returning id into submitted_id;
  if submitted_id is null then
    raise exception 'Draft not found or not owned by current user';
  end if;
  return submitted_id;
end;
$$;
revoke all on function public.submit_immo_construction_brief(uuid) from public;
grant execute on function public.submit_immo_construction_brief(uuid) to authenticated;

      )
    )
    and (
      not (config ? 'design') or (
        jsonb_typeof(config->'design') = 'object'
        and (config->'design' - array['font','radius','density','cardStyle','showMedia','showHighlights','showAnimations','imageUrl','videoUrl','imageData','videoData']) = '{}'::jsonb
        and coalesce(config->'design'->>'imageData','') = ''
        and coalesce(config->'design'->>'videoData','') = ''
      )
    )
  )
);
create index if not exists jdv_studio_settings_updated_by_idx on public.jdv_studio_settings(updated_by);
insert into public.jdv_studio_settings (scope_key, config) values ('global', '{}'::jsonb) on conflict (scope_key) do nothing;
alter table public.jdv_studio_settings enable row level security;
grant select, insert, update on public.jdv_studio_settings to authenticated;
drop policy if exists "Super admins read global Studio settings" on public.jdv_studio_settings;
create policy "Super admins read global Studio settings" on public.jdv_studio_settings for select to authenticated using (exists (select 1 from public.super_admins sa where sa.user_id = auth.uid() and sa.admin_status = 'active'));
drop policy if exists "Super admins create global Studio settings" on public.jdv_studio_settings;
create policy "Super admins create global Studio settings" on public.jdv_studio_settings for insert to authenticated with check (exists (select 1 from public.super_admins sa where sa.user_id = auth.uid() and sa.admin_status = 'active'));
drop policy if exists "Super admins update global Studio settings" on public.jdv_studio_settings;
create policy "Super admins update global Studio settings" on public.jdv_studio_settings for update to authenticated using (exists (select 1 from public.super_admins sa where sa.user_id = auth.uid() and sa.admin_status = 'active')) with check (exists (select 1 from public.super_admins sa where sa.user_id = auth.uid() and sa.admin_status = 'active'));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('jdv-studio-media', 'jdv-studio-media', true, 10485760, array['image/jpeg','image/png','image/webp','image/gif','video/mp4','video/webm','video/quicktime'])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;
drop policy if exists "Public read JDV Studio brand media" on storage.objects;
create policy "Public read JDV Studio brand media" on storage.objects for select to public using (bucket_id = 'jdv-studio-media');
drop policy if exists "Super admins upload JDV Studio brand media" on storage.objects;
create policy "Super admins upload JDV Studio brand media" on storage.objects for insert to authenticated with check (bucket_id = 'jdv-studio-media' and exists (select 1 from public.super_admins sa where sa.user_id = auth.uid() and sa.admin_status = 'active'));
drop policy if exists "Super admins update JDV Studio brand media" on storage.objects;
create policy "Super admins update JDV Studio brand media" on storage.objects for update to authenticated using (bucket_id = 'jdv-studio-media' and exists (select 1 from public.super_admins sa where sa.user_id = auth.uid() and sa.admin_status = 'active')) with check (bucket_id = 'jdv-studio-media' and exists (select 1 from public.super_admins sa where sa.user_id = auth.uid() and sa.admin_status = 'active'));
drop policy if exists "Super admins delete JDV Studio brand media" on storage.objects;
create policy "Super admins delete JDV Studio brand media" on storage.objects for delete to authenticated using (bucket_id = 'jdv-studio-media' and exists (select 1 from public.super_admins sa where sa.user_id = auth.uid() and sa.admin_status = 'active'));



-- Owners may submit their own draft mandate for signatures; only this function advances the workflow.
create or replace function public.submit_immo_mandate(p_mandate_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  submitted_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;
  update public.immo_mandates
  set mandate_status = 'pending_signature', updated_at = now()
  where id = p_mandate_id and owner_user_id = auth.uid() and mandate_status = 'draft'
  returning id into submitted_id;
  if submitted_id is null then
    raise exception 'Draft mandate not found or not owned by current user';
  end if;
  return submitted_id;
end;
$$;
revoke all on function public.submit_immo_mandate(uuid) from public;
grant execute on function public.submit_immo_mandate(uuid) to authenticated;

-- A participant can accept only their own side of a mandate; activation requires both acceptances.
create or replace function public.accept_immo_mandate(p_mandate_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  accepted_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  update public.immo_mandates m
  set owner_accepted_at = case
        when m.owner_user_id = auth.uid() then coalesce(m.owner_accepted_at, now())
        else m.owner_accepted_at
      end,
      agent_accepted_at = case
        when m.agent_user_id = auth.uid() then coalesce(m.agent_accepted_at, now())
        else m.agent_accepted_at
      end,
      mandate_status = case
        when (m.owner_accepted_at is not null or m.owner_user_id = auth.uid())
         and (m.agent_accepted_at is not null or m.agent_user_id = auth.uid())
         and m.agent_user_id is not null then 'active'
        else 'pending_signature'
      end,
      updated_at = now()
  where m.id = p_mandate_id
    and m.mandate_status = 'pending_signature'
    and (m.owner_user_id = auth.uid() or m.agent_user_id = auth.uid())
  returning m.id into accepted_id;

  if accepted_id is null then
    raise exception 'Mandate not found, not awaiting signatures, or user is not a participant';
  end if;
  return accepted_id;
end;
$$;
revoke all on function public.accept_immo_mandate(uuid) from public;
grant execute on function public.accept_immo_mandate(uuid) to authenticated;


-- Qualification writes are centralized here so an approved application becomes a usable Immo agent.
create or replace function public.review_immo_agent_application(
  p_application_id uuid,
  p_status text,
  p_reviewer_notes text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_application public.immo_agent_applications%rowtype;
  v_agent_id uuid;
begin
  if auth.uid() is null or not exists (
    select 1 from public.super_admins sa
    where sa.user_id = auth.uid() and sa.admin_status = 'active'
  ) then
    raise exception 'Active Super Admin required';
  end if;
  if p_status not in ('under_review','qualified','rejected','suspended') then
    raise exception 'Unsupported qualification status';
  end if;

  select * into v_application
  from public.immo_agent_applications
  where id = p_application_id
  for update;

  if not found then
    raise exception 'Agent application not found';
  end if;
  if p_status = 'qualified' and v_application.business_id is null then
    raise exception 'A business profile must be assigned before qualifying this agent';
  end if;

  update public.immo_agent_applications
  set application_status = p_status,
      reviewer_notes = p_reviewer_notes,
      reviewed_by = auth.uid(),
      reviewed_at = now(),
      updated_at = now()
  where id = p_application_id;

  select id into v_agent_id
  from public.immo_agents
  where user_id = v_application.user_id
  order by created_at asc
  limit 1;

  if p_status = 'qualified' then
    if v_agent_id is null then
      insert into public.immo_agents (user_id, business_id, specialties, zones, verification_status)
      values (
        v_application.user_id,
        v_application.business_id,
        coalesce(v_application.specialties, '{}'::text[]),
        case when nullif(trim(v_application.territory), '') is null then '{}'::text[] else array[v_application.territory] end,
        'verified'
      );
    else
      update public.immo_agents
      set business_id = coalesce(v_application.business_id, business_id),
          specialties = coalesce(v_application.specialties, '{}'::text[]),
          zones = case when nullif(trim(v_application.territory), '') is null then zones else array[v_application.territory] end,
          verification_status = 'verified',
          updated_at = now()
      where id = v_agent_id;
    end if;
  elsif p_status in ('rejected','suspended') and v_agent_id is not null then
    update public.immo_agents
    set verification_status = p_status::public.immo_verification_status,
        updated_at = now()
    where id = v_agent_id;
  end if;

  return p_application_id;
end;
$$;
revoke all on function public.review_immo_agent_application(uuid, text, text) from public;
grant execute on function public.review_immo_agent_application(uuid, text, text) to authenticated;


create or replace function public.submit_immo_construction_brief(p_brief_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  submitted_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;
  update public.immo_construction_briefs
  set brief_status = 'submitted', updated_at = now()
  where id = p_brief_id and user_id = auth.uid() and brief_status = 'draft'
  returning id into submitted_id;
  if submitted_id is null then
    raise exception 'Draft not found or not owned by current user';
  end if;
  return submitted_id;
end;
$$;
revoke all on function public.submit_immo_construction_brief(uuid) from public;
grant execute on function public.submit_immo_construction_brief(uuid) to authenticated;
