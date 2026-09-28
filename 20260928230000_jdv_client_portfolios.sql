-- JDV CRM — Portefeuilles commerciaux séparés PROSPECTEUR / SUPER ADMIN
create table if not exists public.client_portfolios (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  owner_user_id uuid not null references auth.users(id) on delete restrict,
  owner_type text not null check (owner_type in ('prospecteur','super_admin')),
  name text not null default 'Mon portefeuille clients', status text not null default 'active' check (status in ('active','inactive','archived')),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique (organization_id, owner_type, owner_user_id)
);
alter table public.clients add column if not exists portfolio_id uuid references public.client_portfolios(id) on delete restrict;
alter table public.prospects add column if not exists portfolio_id uuid references public.client_portfolios(id) on delete restrict;
create index if not exists idx_client_portfolios_owner on public.client_portfolios(owner_type, owner_user_id);
create index if not exists idx_clients_portfolio_id on public.clients(portfolio_id);
create index if not exists idx_prospects_portfolio_id on public.prospects(portfolio_id);
alter table public.client_portfolios enable row level security;
grant select, insert, update on public.client_portfolios to authenticated;

-- Les anciens accès globaux du SUPER ADMIN sur clients/prospects sont retirés.
drop policy if exists "JDV Super Admin Full Access clients" on public.clients;
drop policy if exists "JDV Super Admin Full Access prospects" on public.prospects;
drop policy if exists "clients_insert" on public.clients;
drop policy if exists "clients_select" on public.clients;
drop policy if exists "clients_update" on public.clients;
drop policy if exists "prospects_insert" on public.prospects;
drop policy if exists "prospects_select" on public.prospects;
drop policy if exists "prospects_update" on public.prospects;
drop policy if exists "organization_members_read_all_prospects" on public.prospects;
drop policy if exists "subscription_access_guard" on public.clients;
drop policy if exists "subscription_access_guard" on public.prospects;

drop policy if exists "client_portfolios_select_own" on public.client_portfolios;
drop policy if exists "client_portfolios_insert_own" on public.client_portfolios;
drop policy if exists "client_portfolios_update_own" on public.client_portfolios;
create policy "client_portfolios_select_own" on public.client_portfolios for select to authenticated using (owner_user_id=(select auth.uid()));
create policy "client_portfolios_insert_own" on public.client_portfolios for insert to authenticated with check (owner_user_id=(select auth.uid()) and ((owner_type='super_admin' and private.is_super_admin()) or (owner_type='prospecteur' and private.is_prospecteur(organization_id))));
create policy "client_portfolios_update_own" on public.client_portfolios for update to authenticated using (owner_user_id=(select auth.uid())) with check (owner_user_id=(select auth.uid()));

create policy "clients_portfolio_select" on public.clients for select to authenticated using (((portfolio_id in (select id from public.client_portfolios where owner_user_id=(select auth.uid()))) and private.has_active_subscription(organization_id)) or (private.is_super_admin() and portfolio_id in (select id from public.client_portfolios where owner_user_id=(select auth.uid()) and owner_type='super_admin')) or private.is_org_admin(organization_id));
create policy "clients_portfolio_insert" on public.clients for insert to authenticated with check (((portfolio_id in (select id from public.client_portfolios where owner_user_id=(select auth.uid()))) and private.has_active_subscription(organization_id)) or (private.is_super_admin() and portfolio_id in (select id from public.client_portfolios where owner_user_id=(select auth.uid()) and owner_type='super_admin')) or private.is_org_admin(organization_id));
create policy "clients_portfolio_update" on public.clients for update to authenticated using (((portfolio_id in (select id from public.client_portfolios where owner_user_id=(select auth.uid()))) and private.has_active_subscription(organization_id)) or (private.is_super_admin() and portfolio_id in (select id from public.client_portfolios where owner_user_id=(select auth.uid()) and owner_type='super_admin')) or private.is_org_admin(organization_id)) with check (((portfolio_id in (select id from public.client_portfolios where owner_user_id=(select auth.uid()))) and private.has_active_subscription(organization_id)) or (private.is_super_admin() and portfolio_id in (select id from public.client_portfolios where owner_user_id=(select auth.uid()) and owner_type='super_admin')) or private.is_org_admin(organization_id));

create policy "prospects_portfolio_select" on public.prospects for select to authenticated using (((portfolio_id in (select id from public.client_portfolios where owner_user_id=(select auth.uid()))) and private.has_active_subscription(organization_id)) or (private.is_super_admin() and portfolio_id in (select id from public.client_portfolios where owner_user_id=(select auth.uid()) and owner_type='super_admin')) or private.is_org_admin(organization_id));
create policy "prospects_portfolio_insert" on public.prospects for insert to authenticated with check (((portfolio_id in (select id from public.client_portfolios where owner_user_id=(select auth.uid()))) and private.has_active_subscription(organization_id)) or (private.is_super_admin() and portfolio_id in (select id from public.client_portfolios where owner_user_id=(select auth.uid()) and owner_type='super_admin')) or private.is_org_admin(organization_id));
create policy "prospects_portfolio_update" on public.prospects for update to authenticated using (((portfolio_id in (select id from public.client_portfolios where owner_user_id=(select auth.uid()))) and private.has_active_subscription(organization_id)) or (private.is_super_admin() and portfolio_id in (select id from public.client_portfolios where owner_user_id=(select auth.uid()) and owner_type='super_admin')) or private.is_org_admin(organization_id)) with check (((portfolio_id in (select id from public.client_portfolios where owner_user_id=(select auth.uid()))) and private.has_active_subscription(organization_id)) or (private.is_super_admin() and portfolio_id in (select id from public.client_portfolios where owner_user_id=(select auth.uid()) and owner_type='super_admin')) or private.is_org_admin(organization_id));

insert into public.organizations (name,legal_name,country,currency,timezone,language,status,subscription_status,owner_user_id)
select 'JDV CRM — Portefeuille SUPER ADMIN','JDV CRM — Portefeuille SUPER ADMIN','Bénin','XOF','Africa/Porto-Novo','fr','active','active','2e2b8bd7-d736-4e75-ab21-9e6e7b5cb1a1'
where not exists (select 1 from public.organizations where owner_user_id='2e2b8bd7-d736-4e75-ab21-9e6e7b5cb1a1');
insert into public.client_portfolios (organization_id,owner_user_id,owner_type,name)
select id,'2e2b8bd7-d736-4e75-ab21-9e6e7b5cb1a1','super_admin','Portefeuille commercial personnel'
from public.organizations where owner_user_id='2e2b8bd7-d736-4e75-ab21-9e6e7b5cb1a1'
on conflict (organization_id,owner_type,owner_user_id) do nothing;
