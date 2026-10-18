-- Restrict writes on maintenance operations to the assigned provider or property manager.
begin;
drop policy if exists immo_maintenance_quotes_insert on public.immo_maintenance_quotes;
create policy immo_maintenance_quotes_insert on public.immo_maintenance_quotes for insert to authenticated with check (
 created_by=(select auth.uid()) and (
  (provider_business_id is not null and public.user_has_business_access(provider_business_id))
  or exists(select 1 from public.immo_maintenance_requests r where r.id=request_id and public.immo_user_can_manage_property(r.property_id))
 )
);
drop policy if exists immo_maintenance_interventions_insert on public.immo_maintenance_interventions;
create policy immo_maintenance_interventions_insert on public.immo_maintenance_interventions for insert to authenticated with check (
 created_by=(select auth.uid()) and (
  (provider_business_id is not null and public.user_has_business_access(provider_business_id))
  or exists(select 1 from public.immo_maintenance_requests r where r.id=request_id and public.immo_user_can_manage_property(r.property_id))
 )
);
drop policy if exists immo_maintenance_interventions_update on public.immo_maintenance_interventions;
create policy immo_maintenance_interventions_update on public.immo_maintenance_interventions for update to authenticated
using ((provider_business_id is not null and public.user_has_business_access(provider_business_id)) or exists(select 1 from public.immo_maintenance_requests r where r.id=request_id and public.immo_user_can_manage_property(r.property_id)))
with check ((provider_business_id is not null and public.user_has_business_access(provider_business_id)) or exists(select 1 from public.immo_maintenance_requests r where r.id=request_id and public.immo_user_can_manage_property(r.property_id)));
drop policy if exists immo_maintenance_invoices_insert on public.immo_maintenance_invoices;
create policy immo_maintenance_invoices_insert on public.immo_maintenance_invoices for insert to authenticated with check (
 created_by=(select auth.uid()) and (
  (provider_business_id is not null and public.user_has_business_access(provider_business_id))
  or exists(select 1 from public.immo_maintenance_requests r where r.id=request_id and public.immo_user_can_manage_property(r.property_id))
 )
);
revoke update on public.immo_maintenance_requests from authenticated;
grant update(status,assigned_agent_id,assigned_provider_business_id,completed_at,updated_at) on public.immo_maintenance_requests to authenticated;
revoke update on public.immo_maintenance_interventions from authenticated;
grant update(quote_id,provider_business_id,scheduled_at,started_at,completed_at,status,report,evidence,updated_at) on public.immo_maintenance_interventions to authenticated;
commit;