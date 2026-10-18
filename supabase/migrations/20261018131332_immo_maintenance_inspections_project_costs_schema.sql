-- New JDV Immo operational domains. All tables are RLS protected.
begin;
create table if not exists public.immo_maintenance_requests (
 id uuid primary key default gen_random_uuid(), property_id uuid not null references public.immo_properties(id) on delete restrict,
 reported_by uuid not null default auth.uid(), title text not null check(length(trim(title)) between 3 and 180),
 description text not null check(length(trim(description)) between 3 and 8000),
 priority text not null default 'normal' check(priority in ('low','normal','high','urgent')),
 status text not null default 'submitted' check(status in ('submitted','triaged','quoted','approved','scheduled','in_progress','completed','rejected','cancelled')),
 assigned_agent_id uuid references public.immo_agents(id) on delete set null, assigned_provider_business_id uuid,
 media jsonb not null default '[]'::jsonb, reported_at timestamptz not null default now(), completed_at timestamptz,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.immo_maintenance_quotes (
 id uuid primary key default gen_random_uuid(), request_id uuid not null references public.immo_maintenance_requests(id) on delete cascade,
 provider_business_id uuid, amount numeric(14,2) not null check(amount>=0), currency_id uuid references public.currencies(id),
 description text, status text not null default 'submitted' check(status in ('submitted','approved','rejected','expired','withdrawn')),
 valid_until date, created_by uuid not null default auth.uid(), approved_by uuid, approved_at timestamptz,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.immo_maintenance_interventions (
 id uuid primary key default gen_random_uuid(), request_id uuid not null references public.immo_maintenance_requests(id) on delete cascade,
 quote_id uuid references public.immo_maintenance_quotes(id) on delete set null, provider_business_id uuid,
 scheduled_at timestamptz, started_at timestamptz, completed_at timestamptz,
 status text not null default 'scheduled' check(status in ('scheduled','in_progress','completed','cancelled')),
 report text, evidence jsonb not null default '[]'::jsonb, created_by uuid not null default auth.uid(),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.immo_maintenance_invoices (
 id uuid primary key default gen_random_uuid(), request_id uuid not null references public.immo_maintenance_requests(id) on delete cascade,
 intervention_id uuid references public.immo_maintenance_interventions(id) on delete set null, provider_business_id uuid,
 invoice_number text, amount numeric(14,2) not null check(amount>=0), currency_id uuid references public.currencies(id),
 document_id uuid references public.immo_documents(id) on delete set null,
 status text not null default 'submitted' check(status in ('submitted','approved','paid','disputed','cancelled')),
 due_date date, paid_at timestamptz, created_by uuid not null default auth.uid(),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.immo_property_inspections (
 id uuid primary key default gen_random_uuid(), property_id uuid not null references public.immo_properties(id) on delete restrict,
 lease_id uuid references public.immo_leases(id) on delete set null,
 inspection_type text not null check(inspection_type in ('move_in','move_out','maintenance','routine')),
 status text not null default 'draft' check(status in ('draft','in_progress','submitted','acknowledged','disputed','finalized')),
 scheduled_at timestamptz, performed_at timestamptz, report text,
 condition_items jsonb not null default '[]'::jsonb check(jsonb_typeof(condition_items)='array'),
 photos jsonb not null default '[]'::jsonb check(jsonb_typeof(photos)='array'), damage_notes text,
 created_by uuid not null default auth.uid(), acknowledged_by uuid, acknowledged_at timestamptz,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.immo_lease_events (
 id uuid primary key default gen_random_uuid(), lease_id uuid not null references public.immo_leases(id) on delete restrict,
 event_type text not null check(event_type in ('created','activated','amended','signature_requested','signed','payment_due','payment_received','renewal_requested','termination_requested','terminated','deposit_settled','document_added','inspection_completed','note')),
 event_at timestamptz not null default now(), details jsonb not null default '{}'::jsonb,
 document_id uuid references public.immo_documents(id) on delete set null, created_by uuid not null default auth.uid(),
 created_at timestamptz not null default now()
);
create table if not exists public.immo_project_cost_items (
 id uuid primary key default gen_random_uuid(), project_id uuid not null references public.immo_projects(id) on delete cascade,
 business_id uuid not null, title text not null check(length(trim(title)) between 3 and 180), description text,
 planned_amount numeric(14,2) not null default 0 check(planned_amount>=0),
 committed_amount numeric(14,2) not null default 0 check(committed_amount>=0), currency_id uuid references public.currencies(id),
 vendor_business_id uuid, invoice_document_id uuid references public.immo_documents(id) on delete set null,
 status text not null default 'planned' check(status in ('planned','committed','invoiced','partially_paid','paid','cancelled')),
 due_date date, created_by uuid not null default auth.uid(), created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(), check(committed_amount<=planned_amount or planned_amount=0)
);
create table if not exists public.immo_project_cost_payments (
 id uuid primary key default gen_random_uuid(), cost_item_id uuid not null references public.immo_project_cost_items(id) on delete restrict,
 amount numeric(14,2) not null check(amount>0), currency_id uuid references public.currencies(id), payment_reference text,
 payment_status text not null default 'pending' check(payment_status in ('pending','confirmed','failed','refunded')),
 paid_at timestamptz, confirmed_by uuid, created_by uuid not null default auth.uid(),
 created_at timestamptz not null default now(), check(payment_status='pending' and paid_at is null)
);
create index if not exists immo_maintenance_requests_property_idx on public.immo_maintenance_requests(property_id,status,reported_at desc);
create index if not exists immo_maintenance_requests_provider_idx on public.immo_maintenance_requests(assigned_provider_business_id,status);
create index if not exists immo_maintenance_quotes_request_idx on public.immo_maintenance_quotes(request_id,status);
create index if not exists immo_maintenance_interventions_request_idx on public.immo_maintenance_interventions(request_id,status);
create index if not exists immo_maintenance_invoices_request_idx on public.immo_maintenance_invoices(request_id,status);
create index if not exists immo_property_inspections_property_idx on public.immo_property_inspections(property_id,inspection_type,scheduled_at desc);
create index if not exists immo_property_inspections_lease_idx on public.immo_property_inspections(lease_id) where lease_id is not null;
create index if not exists immo_lease_events_lease_idx on public.immo_lease_events(lease_id,event_at desc);
create index if not exists immo_project_cost_items_project_idx on public.immo_project_cost_items(project_id,status);
create index if not exists immo_project_cost_payments_item_idx on public.immo_project_cost_payments(cost_item_id,payment_status);
alter table public.immo_maintenance_requests enable row level security;
alter table public.immo_maintenance_quotes enable row level security;
alter table public.immo_maintenance_interventions enable row level security;
alter table public.immo_maintenance_invoices enable row level security;
alter table public.immo_property_inspections enable row level security;
alter table public.immo_lease_events enable row level security;
alter table public.immo_project_cost_items enable row level security;
alter table public.immo_project_cost_payments enable row level security;
grant select,insert,update on public.immo_maintenance_requests to authenticated;
grant select,insert on public.immo_maintenance_quotes to authenticated;
grant select,insert,update on public.immo_maintenance_interventions to authenticated;
grant select,insert on public.immo_maintenance_invoices to authenticated;
grant select,insert,update on public.immo_property_inspections to authenticated;
grant select,insert on public.immo_lease_events to authenticated;
grant select,insert,update on public.immo_project_cost_items to authenticated;
grant select,insert on public.immo_project_cost_payments to authenticated;
create or replace function public.immo_user_can_manage_property(p_property_id uuid)
returns boolean language sql stable security invoker set search_path=public,pg_catalog as $$
 select exists(select 1 from public.immo_properties p where p.id=p_property_id and (p.owner_user_id=(select auth.uid()) or (p.business_id is not null and public.user_has_business_access(p.business_id)) or public.is_super_admin()))
$$;
create or replace function public.immo_user_can_access_lease(p_lease_id uuid)
returns boolean language sql stable security invoker set search_path=public,pg_catalog as $$
 select exists(select 1 from public.immo_leases l where l.id=p_lease_id and (l.tenant_user_id=(select auth.uid()) or l.landlord_user_id=(select auth.uid()) or (l.landlord_business_id is not null and public.user_has_business_access(l.landlord_business_id))))
$$;
create or replace function public.immo_user_can_access_maintenance_request(p_request_id uuid)
returns boolean language sql stable security invoker set search_path=public,pg_catalog as $$
 select exists(select 1 from public.immo_maintenance_requests r where r.id=p_request_id and (r.reported_by=(select auth.uid()) or public.immo_user_can_manage_property(r.property_id) or (r.assigned_provider_business_id is not null and public.user_has_business_access(r.assigned_provider_business_id))))
$$;
grant execute on function public.immo_user_can_manage_property(uuid) to authenticated;
grant execute on function public.immo_user_can_access_lease(uuid) to authenticated;
grant execute on function public.immo_user_can_access_maintenance_request(uuid) to authenticated;
commit;