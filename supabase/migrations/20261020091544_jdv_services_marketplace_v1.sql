-- JDV SERVICES: service-provider catalog and quote requests.
-- Canonical version matching the applied Supabase migration 20261020091544.
create table if not exists public.jdv_service_offerings (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references auth.users(id) on delete cascade,
  business_id uuid references public.business_profiles(id) on delete set null,
  title text not null check (char_length(trim(title)) between 3 and 180),
  category text not null check (char_length(trim(category)) between 2 and 100),
  description text not null check (char_length(trim(description)) between 20 and 12000),
  location text,
  pricing_mode text not null default 'quote' check (pricing_mode in ('fixed','hourly','quote')),
  base_price numeric(14,2) check (base_price is null or base_price >= 0),
  currency text not null default 'XOF' check (char_length(currency) = 3),
  status text not null default 'published' check (status in ('draft','published','paused','archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (pricing_mode = 'quote' or base_price is not null)
);

create table if not exists public.jdv_service_requests (
  id uuid primary key default gen_random_uuid(),
  offering_id uuid not null references public.jdv_service_offerings(id) on delete cascade,
  requester_id uuid not null references auth.users(id) on delete cascade,
  message text not null check (char_length(trim(message)) between 10 and 6000),
  requested_for timestamptz,
  proposed_price numeric(14,2) check (proposed_price is null or proposed_price >= 0),
  provider_response text check (provider_response is null or char_length(provider_response) <= 6000),
  status text not null default 'submitted' check (status in ('submitted','quoted','accepted','declined','cancelled','completed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_jdv_service_offerings_public on public.jdv_service_offerings(status, created_at desc);
create index if not exists idx_jdv_service_offerings_provider on public.jdv_service_offerings(provider_id, created_at desc);
create index if not exists idx_jdv_service_requests_requester on public.jdv_service_requests(requester_id, created_at desc);
create index if not exists idx_jdv_service_requests_offering on public.jdv_service_requests(offering_id, created_at desc);

grant select on public.jdv_service_offerings to anon, authenticated;
grant insert, update, delete on public.jdv_service_offerings to authenticated;
grant select, insert, update on public.jdv_service_requests to authenticated;

alter table public.jdv_service_offerings enable row level security;
alter table public.jdv_service_requests enable row level security;

drop policy if exists "jdv_services_public_read" on public.jdv_service_offerings;
create policy "jdv_services_public_read" on public.jdv_service_offerings
  for select to anon, authenticated using (status = 'published' or provider_id = auth.uid());
drop policy if exists "jdv_services_provider_insert" on public.jdv_service_offerings;
create policy "jdv_services_provider_insert" on public.jdv_service_offerings
  for insert to authenticated with check (provider_id = auth.uid());
drop policy if exists "jdv_services_provider_update" on public.jdv_service_offerings;
create policy "jdv_services_provider_update" on public.jdv_service_offerings
  for update to authenticated using (provider_id = auth.uid()) with check (provider_id = auth.uid());
drop policy if exists "jdv_services_provider_delete" on public.jdv_service_offerings;
create policy "jdv_services_provider_delete" on public.jdv_service_offerings
  for delete to authenticated using (provider_id = auth.uid());

drop policy if exists "jdv_service_requests_participant_read" on public.jdv_service_requests;
create policy "jdv_service_requests_participant_read" on public.jdv_service_requests
  for select to authenticated using (
    requester_id = auth.uid()
    or exists (select 1 from public.jdv_service_offerings s where s.id = offering_id and s.provider_id = auth.uid())
  );
drop policy if exists "jdv_service_requests_customer_insert" on public.jdv_service_requests;
create policy "jdv_service_requests_customer_insert" on public.jdv_service_requests
  for insert to authenticated with check (
    requester_id = auth.uid()
    and exists (select 1 from public.jdv_service_offerings s where s.id = offering_id and s.status = 'published' and s.provider_id <> auth.uid())
  );
drop policy if exists "jdv_service_requests_provider_update" on public.jdv_service_requests;
create policy "jdv_service_requests_provider_update" on public.jdv_service_requests
  for update to authenticated using (
    exists (select 1 from public.jdv_service_offerings s where s.id = offering_id and s.provider_id = auth.uid())
  ) with check (
    exists (select 1 from public.jdv_service_offerings s where s.id = offering_id and s.provider_id = auth.uid())
  );

create or replace function public.jdv_services_set_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
drop trigger if exists jdv_service_offerings_updated_at on public.jdv_service_offerings;
create trigger jdv_service_offerings_updated_at before update on public.jdv_service_offerings
  for each row execute function public.jdv_services_set_updated_at();
drop trigger if exists jdv_service_requests_updated_at on public.jdv_service_requests;
create trigger jdv_service_requests_updated_at before update on public.jdv_service_requests
  for each row execute function public.jdv_services_set_updated_at();

-- Prevent participant or parent-record reassignment through broad UPDATE grants.
create or replace function public.jdv_services_guard_request_identity()
returns trigger language plpgsql set search_path = '' as $$
begin
  if new.offering_id is distinct from old.offering_id
     or new.requester_id is distinct from old.requester_id
     or new.message is distinct from old.message then
    raise exception 'Service request identity fields are immutable';
  end if;
  return new;
end;
$$;

drop trigger if exists jdv_service_requests_guard_identity on public.jdv_service_requests;
create trigger jdv_service_requests_guard_identity
before update on public.jdv_service_requests
for each row execute function public.jdv_services_guard_request_identity();


-- A provider may edit an offer, but cannot transfer ownership or rewrite its creation history.
create or replace function public.jdv_services_guard_offering_identity()
returns trigger language plpgsql set search_path = '' as $$
begin
  if new.provider_id is distinct from old.provider_id
     or new.business_id is distinct from old.business_id
     or new.created_at is distinct from old.created_at then
    raise exception 'Service offering ownership and creation metadata are immutable';
  end if;
  return new;
end;
$$;

drop trigger if exists jdv_service_offerings_guard_identity on public.jdv_service_offerings;
create trigger jdv_service_offerings_guard_identity
before update on public.jdv_service_offerings
for each row execute function public.jdv_services_guard_offering_identity();

-- Request participants and the original request content are immutable.
-- Provider responses, quote amounts and workflow status remain editable by the provider under RLS.
revoke all on function public.jdv_services_set_updated_at() from public, anon, authenticated;
revoke all on function public.jdv_services_guard_request_identity() from public, anon, authenticated;
revoke all on function public.jdv_services_guard_offering_identity() from public, anon, authenticated;
