-- JDV CRM — Garantit que le SUPER ADMIN reste isolé des portefeuilles prospecteurs
drop policy if exists "clients_portfolio_select" on public.clients;
drop policy if exists "clients_portfolio_insert" on public.clients;
drop policy if exists "clients_portfolio_update" on public.clients;
drop policy if exists "prospects_portfolio_select" on public.prospects;
drop policy if exists "prospects_portfolio_insert" on public.prospects;
drop policy if exists "prospects_portfolio_update" on public.prospects;

create policy "clients_portfolio_select" on public.clients for select to authenticated
using (((portfolio_id in (select id from public.client_portfolios where owner_user_id=(select auth.uid()))) and private.has_active_subscription(organization_id))
or (private.is_super_admin() and portfolio_id in (select id from public.client_portfolios where owner_user_id=(select auth.uid()) and owner_type='super_admin'))
or ((not private.is_super_admin()) and private.is_org_admin(organization_id)));

create policy "clients_portfolio_insert" on public.clients for insert to authenticated
with check (((portfolio_id in (select id from public.client_portfolios where owner_user_id=(select auth.uid()))) and private.has_active_subscription(organization_id))
or (private.is_super_admin() and portfolio_id in (select id from public.client_portfolios where owner_user_id=(select auth.uid()) and owner_type='super_admin'))
or ((not private.is_super_admin()) and private.is_org_admin(organization_id)));

create policy "clients_portfolio_update" on public.clients for update to authenticated
using (((portfolio_id in (select id from public.client_portfolios where owner_user_id=(select auth.uid()))) and private.has_active_subscription(organization_id))
or (private.is_super_admin() and portfolio_id in (select id from public.client_portfolios where owner_user_id=(select auth.uid()) and owner_type='super_admin'))
or ((not private.is_super_admin()) and private.is_org_admin(organization_id)))
with check (((portfolio_id in (select id from public.client_portfolios where owner_user_id=(select auth.uid()))) and private.has_active_subscription(organization_id))
or (private.is_super_admin() and portfolio_id in (select id from public.client_portfolios where owner_user_id=(select auth.uid()) and owner_type='super_admin'))
or ((not private.is_super_admin()) and private.is_org_admin(organization_id)));

create policy "prospects_portfolio_select" on public.prospects for select to authenticated
using (((portfolio_id in (select id from public.client_portfolios where owner_user_id=(select auth.uid()))) and private.has_active_subscription(organization_id))
or (private.is_super_admin() and portfolio_id in (select id from public.client_portfolios where owner_user_id=(select auth.uid()) and owner_type='super_admin'))
or ((not private.is_super_admin()) and private.is_org_admin(organization_id)));

create policy "prospects_portfolio_insert" on public.prospects for insert to authenticated
with check (((portfolio_id in (select id from public.client_portfolios where owner_user_id=(select auth.uid()))) and private.has_active_subscription(organization_id))
or (private.is_super_admin() and portfolio_id in (select id from public.client_portfolios where owner_user_id=(select auth.uid()) and owner_type='super_admin'))
or ((not private.is_super_admin()) and private.is_org_admin(organization_id)));

create policy "prospects_portfolio_update" on public.prospects for update to authenticated
using (((portfolio_id in (select id from public.client_portfolios where owner_user_id=(select auth.uid()))) and private.has_active_subscription(organization_id))
or (private.is_super_admin() and portfolio_id in (select id from public.client_portfolios where owner_user_id=(select auth.uid()) and owner_type='super_admin'))
or ((not private.is_super_admin()) and private.is_org_admin(organization_id)))
with check (((portfolio_id in (select id from public.client_portfolios where owner_user_id=(select auth.uid()))) and private.has_active_subscription(organization_id))
or (private.is_super_admin() and portfolio_id in (select id from public.client_portfolios where owner_user_id=(select auth.uid()) and owner_type='super_admin'))
or ((not private.is_super_admin()) and private.is_org_admin(organization_id)));
