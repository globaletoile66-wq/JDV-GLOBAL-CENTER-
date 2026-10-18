-- Keep provider access scoped to the provider assigned to the request.
-- Also ensure a lease-linked inspection always refers to the lease's property.
begin;
create or replace function public.immo_validate_inspection_lease()
returns trigger language plpgsql security invoker set search_path=public,pg_catalog as $$
declare v_property_id uuid;
begin
 if new.lease_id is null then return new; end if;
 select l.property_id into v_property_id from public.immo_leases l where l.id=new.lease_id;
 if not found then raise exception 'LEASE_NOT_FOUND' using errcode='23503'; end if;
 if v_property_id is distinct from new.property_id then raise exception 'INSPECTION_PROPERTY_LEASE_MISMATCH' using errcode='23514'; end if;
 return new;
end; $$;
drop trigger if exists trg_immo_validate_inspection_lease on public.immo_property_inspections;
create trigger trg_immo_validate_inspection_lease before insert or update on public.immo_property_inspections for each row execute function public.immo_validate_inspection_lease();
revoke all on function public.immo_validate_inspection_lease() from public,anon,authenticated;
drop policy if exists immo_maintenance_quotes_select on public.immo_maintenance_quotes;
create policy immo_maintenance_quotes_select on public.immo_maintenance_quotes for select to authenticated using (
 (provider_business_id is not null and public.user_has_business_access(provider_business_id) and exists(select 1 from public.immo_maintenance_requests r where r.id=request_id and r.assigned_provider_business_id=provider_business_id))
 or exists(select 1 from public.immo_maintenance_requests r where r.id=request_id and public.immo_user_can_manage_property(r.property_id))
 or exists(select 1 from public.immo_maintenance_requests r where r.id=request_id and r.reported_by=(select auth.uid()))
);
drop policy if exists immo_maintenance_quotes_insert on public.immo_maintenance_quotes;
create policy immo_maintenance_quotes_insert on public.immo_maintenance_quotes for insert to authenticated with check (
 created_by=(select auth.uid()) and status='submitted' and approved_by is null and approved_at is null and (
 (provider_business_id is not null and public.user_has_business_access(provider_business_id) and exists(select 1 from public.immo_maintenance_requests r where r.id=request_id and r.assigned_provider_business_id=provider_business_id))
 or exists(select 1 from public.immo_maintenance_requests r where r.id=request_id and public.immo_user_can_manage_property(r.property_id)))
);
drop policy if exists immo_maintenance_interventions_select on public.immo_maintenance_interventions;
create policy immo_maintenance_interventions_select on public.immo_maintenance_interventions for select to authenticated using (
 (provider_business_id is not null and public.user_has_business_access(provider_business_id) and exists(select 1 from public.immo_maintenance_requests r where r.id=request_id and r.assigned_provider_business_id=provider_business_id))
 or public.immo_user_can_access_maintenance_request(request_id)
);
drop policy if exists immo_maintenance_interventions_insert on public.immo_maintenance_interventions;
create policy immo_maintenance_interventions_insert on public.immo_maintenance_interventions for insert to authenticated with check (
 created_by=(select auth.uid()) and status='scheduled' and started_at is null and completed_at is null and (
 (provider_business_id is not null and public.user_has_business_access(provider_business_id) and exists(select 1 from public.immo_maintenance_requests r where r.id=request_id and r.assigned_provider_business_id=provider_business_id))
 or exists(select 1 from public.immo_maintenance_requests r where r.id=request_id and public.immo_user_can_manage_property(r.property_id)))
);
drop policy if exists immo_maintenance_interventions_update on public.immo_maintenance_interventions;
create policy immo_maintenance_interventions_update on public.immo_maintenance_interventions for update to authenticated
using ((provider_business_id is not null and public.user_has_business_access(provider_business_id) and exists(select 1 from public.immo_maintenance_requests r where r.id=request_id and r.assigned_provider_business_id=provider_business_id)) or exists(select 1 from public.immo_maintenance_requests r where r.id=request_id and public.immo_user_can_manage_property(r.property_id)))
with check ((provider_business_id is not null and public.user_has_business_access(provider_business_id) and exists(select 1 from public.immo_maintenance_requests r where r.id=request_id and r.assigned_provider_business_id=provider_business_id)) or exists(select 1 from public.immo_maintenance_requests r where r.id=request_id and public.immo_user_can_manage_property(r.property_id)));
drop policy if exists immo_maintenance_invoices_select on public.immo_maintenance_invoices;
create policy immo_maintenance_invoices_select on public.immo_maintenance_invoices for select to authenticated using (
 (provider_business_id is not null and public.user_has_business_access(provider_business_id) and exists(select 1 from public.immo_maintenance_requests r where r.id=request_id and r.assigned_provider_business_id=provider_business_id))
 or public.immo_user_can_access_maintenance_request(request_id)
);
drop policy if exists immo_maintenance_invoices_insert on public.immo_maintenance_invoices;
create policy immo_maintenance_invoices_insert on public.immo_maintenance_invoices for insert to authenticated with check (
 created_by=(select auth.uid()) and status='submitted' and paid_at is null
 and (document_id is null or exists(select 1 from public.immo_documents d where d.id=document_id and d.uploaded_by=(select auth.uid())))
 and ((provider_business_id is not null and public.user_has_business_access(provider_business_id) and exists(select 1 from public.immo_maintenance_requests r where r.id=request_id and r.assigned_provider_business_id=provider_business_id))
 or exists(select 1 from public.immo_maintenance_requests r where r.id=request_id and public.immo_user_can_manage_property(r.property_id)))
);
commit;