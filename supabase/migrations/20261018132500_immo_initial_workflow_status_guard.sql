-- Prevent client-created records from self-approving work or asserting real payments.
begin;
drop policy if exists immo_maintenance_requests_insert on public.immo_maintenance_requests;
create policy immo_maintenance_requests_insert on public.immo_maintenance_requests for insert to authenticated with check (
 reported_by=(select auth.uid()) and status='submitted' and assigned_agent_id is null and assigned_provider_business_id is null and completed_at is null
 and (public.immo_user_can_manage_property(property_id)
  or exists(select 1 from public.immo_properties p where p.id=immo_maintenance_requests.property_id and p.property_status='published')
  or exists(select 1 from public.immo_leases l where l.property_id=immo_maintenance_requests.property_id and l.tenant_user_id=(select auth.uid())))
);
drop policy if exists immo_maintenance_quotes_insert on public.immo_maintenance_quotes;
create policy immo_maintenance_quotes_insert on public.immo_maintenance_quotes for insert to authenticated with check (
 created_by=(select auth.uid()) and status='submitted' and approved_by is null and approved_at is null
 and ((provider_business_id is not null and public.user_has_business_access(provider_business_id))
  or exists(select 1 from public.immo_maintenance_requests r where r.id=request_id and public.immo_user_can_manage_property(r.property_id)))
);
drop policy if exists immo_maintenance_interventions_insert on public.immo_maintenance_interventions;
create policy immo_maintenance_interventions_insert on public.immo_maintenance_interventions for insert to authenticated with check (
 created_by=(select auth.uid()) and status='scheduled' and started_at is null and completed_at is null
 and ((provider_business_id is not null and public.user_has_business_access(provider_business_id))
  or exists(select 1 from public.immo_maintenance_requests r where r.id=request_id and public.immo_user_can_manage_property(r.property_id)))
);
drop policy if exists immo_maintenance_invoices_insert on public.immo_maintenance_invoices;
create policy immo_maintenance_invoices_insert on public.immo_maintenance_invoices for insert to authenticated with check (
 created_by=(select auth.uid()) and status='submitted' and paid_at is null
 and (document_id is null or exists(select 1 from public.immo_documents d where d.id=document_id and d.uploaded_by=(select auth.uid())))
 and ((provider_business_id is not null and public.user_has_business_access(provider_business_id))
  or exists(select 1 from public.immo_maintenance_requests r where r.id=request_id and public.immo_user_can_manage_property(r.property_id)))
);
drop policy if exists immo_property_inspections_insert on public.immo_property_inspections;
create policy immo_property_inspections_insert on public.immo_property_inspections for insert to authenticated with check (
 created_by=(select auth.uid()) and status='draft' and performed_at is null and acknowledged_by is null and acknowledged_at is null
 and (public.immo_user_can_manage_property(property_id) or (lease_id is not null and public.immo_user_can_access_lease(lease_id)))
);
drop policy if exists immo_lease_events_insert on public.immo_lease_events;
create policy immo_lease_events_insert on public.immo_lease_events for insert to authenticated with check (
 created_by=(select auth.uid()) and event_type in ('note','renewal_requested','termination_requested','document_added')
 and public.immo_user_can_access_lease(lease_id)
);
drop policy if exists immo_project_cost_items_insert on public.immo_project_cost_items;
create policy immo_project_cost_items_insert on public.immo_project_cost_items for insert to authenticated with check (
 created_by=(select auth.uid()) and status in ('planned','committed')
 and (invoice_document_id is null or exists(select 1 from public.immo_documents d where d.id=invoice_document_id and d.uploaded_by=(select auth.uid())))
 and public.user_has_business_access(business_id)
 and exists(select 1 from public.immo_projects p where p.id=immo_project_cost_items.project_id and p.business_id=immo_project_cost_items.business_id)
);
drop policy if exists immo_project_cost_items_update on public.immo_project_cost_items;
create policy immo_project_cost_items_update on public.immo_project_cost_items for update to authenticated
using(public.user_has_business_access(business_id))
with check(public.user_has_business_access(business_id)
 and (invoice_document_id is null or exists(select 1 from public.immo_documents d where d.id=invoice_document_id and d.uploaded_by=(select auth.uid())))
 and exists(select 1 from public.immo_projects p where p.id=immo_project_cost_items.project_id and p.business_id=immo_project_cost_items.business_id));
revoke update on public.immo_project_cost_items from authenticated;
grant update(title,description,planned_amount,committed_amount,currency_id,vendor_business_id,invoice_document_id,due_date,updated_at) on public.immo_project_cost_items to authenticated;
commit;