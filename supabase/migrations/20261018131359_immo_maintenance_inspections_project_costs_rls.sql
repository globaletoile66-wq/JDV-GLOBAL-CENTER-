begin;
create policy immo_maintenance_requests_select on public.immo_maintenance_requests for select to authenticated using (
 reported_by=(select auth.uid()) or public.immo_user_can_manage_property(property_id)
 or (assigned_provider_business_id is not null and public.user_has_business_access(assigned_provider_business_id))
 or exists(select 1 from public.immo_leases l where l.property_id=immo_maintenance_requests.property_id and l.tenant_user_id=(select auth.uid()))
);
create policy immo_maintenance_requests_insert on public.immo_maintenance_requests for insert to authenticated with check (
 reported_by=(select auth.uid()) and (
  public.immo_user_can_manage_property(property_id)
  or exists(select 1 from public.immo_properties p where p.id=immo_maintenance_requests.property_id and p.property_status='published')
  or exists(select 1 from public.immo_leases l where l.property_id=immo_maintenance_requests.property_id and l.tenant_user_id=(select auth.uid()))
 )
);
create policy immo_maintenance_requests_update on public.immo_maintenance_requests for update to authenticated
using(public.immo_user_can_manage_property(property_id) or (assigned_provider_business_id is not null and public.user_has_business_access(assigned_provider_business_id)))
with check(public.immo_user_can_manage_property(property_id) or (assigned_provider_business_id is not null and public.user_has_business_access(assigned_provider_business_id)));
create policy immo_maintenance_quotes_select on public.immo_maintenance_quotes for select to authenticated using ((provider_business_id is not null and public.user_has_business_access(provider_business_id)) or public.immo_user_can_access_maintenance_request(request_id));
create policy immo_maintenance_quotes_insert on public.immo_maintenance_quotes for insert to authenticated with check(created_by=(select auth.uid()) and ((provider_business_id is not null and public.user_has_business_access(provider_business_id)) or public.immo_user_can_access_maintenance_request(request_id)));
create policy immo_maintenance_interventions_select on public.immo_maintenance_interventions for select to authenticated using ((provider_business_id is not null and public.user_has_business_access(provider_business_id)) or public.immo_user_can_access_maintenance_request(request_id));
create policy immo_maintenance_interventions_insert on public.immo_maintenance_interventions for insert to authenticated with check(created_by=(select auth.uid()) and ((provider_business_id is not null and public.user_has_business_access(provider_business_id)) or public.immo_user_can_access_maintenance_request(request_id)));
create policy immo_maintenance_interventions_update on public.immo_maintenance_interventions for update to authenticated using ((provider_business_id is not null and public.user_has_business_access(provider_business_id)) or public.immo_user_can_access_maintenance_request(request_id)) with check ((provider_business_id is not null and public.user_has_business_access(provider_business_id)) or public.immo_user_can_access_maintenance_request(request_id));
create policy immo_maintenance_invoices_select on public.immo_maintenance_invoices for select to authenticated using ((provider_business_id is not null and public.user_has_business_access(provider_business_id)) or public.immo_user_can_access_maintenance_request(request_id));
create policy immo_maintenance_invoices_insert on public.immo_maintenance_invoices for insert to authenticated with check(created_by=(select auth.uid()) and ((provider_business_id is not null and public.user_has_business_access(provider_business_id)) or public.immo_user_can_access_maintenance_request(request_id)));
create policy immo_property_inspections_select on public.immo_property_inspections for select to authenticated using (created_by=(select auth.uid()) or public.immo_user_can_manage_property(property_id) or (lease_id is not null and public.immo_user_can_access_lease(lease_id)));
create policy immo_property_inspections_insert on public.immo_property_inspections for insert to authenticated with check(created_by=(select auth.uid()) and (public.immo_user_can_manage_property(property_id) or (lease_id is not null and public.immo_user_can_access_lease(lease_id))));
create policy immo_lease_events_select on public.immo_lease_events for select to authenticated using(public.immo_user_can_access_lease(lease_id));
create policy immo_lease_events_insert on public.immo_lease_events for insert to authenticated with check(created_by=(select auth.uid()) and public.immo_user_can_access_lease(lease_id));
create policy immo_project_cost_items_select on public.immo_project_cost_items for select to authenticated using(public.user_has_business_access(business_id));
create policy immo_project_cost_items_insert on public.immo_project_cost_items for insert to authenticated with check(created_by=(select auth.uid()) and public.user_has_business_access(business_id) and exists(select 1 from public.immo_projects p where p.id=immo_project_cost_items.project_id and p.business_id=immo_project_cost_items.business_id));
create policy immo_project_cost_items_update on public.immo_project_cost_items for update to authenticated using(public.user_has_business_access(business_id)) with check(public.user_has_business_access(business_id) and exists(select 1 from public.immo_projects p where p.id=immo_project_cost_items.project_id and p.business_id=immo_project_cost_items.business_id));
create policy immo_project_cost_payments_select on public.immo_project_cost_payments for select to authenticated using(exists(select 1 from public.immo_project_cost_items c where c.id=cost_item_id and public.user_has_business_access(c.business_id)));
create policy immo_project_cost_payments_insert on public.immo_project_cost_payments for insert to authenticated with check(created_by=(select auth.uid()) and payment_status='pending' and paid_at is null and exists(select 1 from public.immo_project_cost_items c where c.id=immo_project_cost_payments.cost_item_id and public.user_has_business_access(c.business_id)));
commit;