-- Restrict property contact request creation and derive routing fields from the property.
-- Harden property contact request routing after the initial schema change.
create or replace function public.immo_link_property_contact_request()
returns trigger
language plpgsql
security invoker
set search_path = public, pg_catalog
as $$
declare
  v_property public.immo_properties%rowtype;
begin
  if new.property_id is null then return new; end if;
  if auth.uid() is null or new.requester_user_id is distinct from auth.uid() then
    raise exception 'AUTHENTICATED_REQUESTER_REQUIRED' using errcode = '42501';
  end if;
  select * into v_property from public.immo_properties where id = new.property_id;
  if not found then raise exception 'PROPERTY_NOT_FOUND' using errcode = '23503'; end if;
  if v_property.property_status <> 'published'
     and v_property.owner_user_id is distinct from auth.uid()
     and not (v_property.business_id is not null and public.user_has_business_access(v_property.business_id))
     and not public.is_super_admin() then
    raise exception 'PROPERTY_NOT_AVAILABLE_FOR_CONTACT' using errcode = '42501';
  end if;
  if new.property_type_id is not null and new.property_type_id <> v_property.property_type_id then
    raise exception 'PROPERTY_TYPE_MISMATCH' using errcode = '22023';
  end if;
  new.property_type_id := v_property.property_type_id;
  new.transaction_type := v_property.transaction_type;
  new.country_id := v_property.country_id;
  new.city := v_property.city;
  new.currency_id := v_property.currency_id;
  new.bedrooms := v_property.bedrooms;
  new.surface_min := v_property.surface;
  new.budget_max := v_property.price;
  new.assigned_business_id := v_property.business_id;
  new.request_status := coalesce(new.request_status, 'open'::public.immo_request_status);
  new.criteria := coalesce(new.criteria, '{}'::jsonb)
    || jsonb_build_object('property_id', v_property.id, 'property_title', v_property.title, 'request_kind', 'property_contact');
  return new;
end;
$$;

drop trigger if exists trg_immo_link_property_contact_request on public.immo_requests;
create trigger trg_immo_link_property_contact_request before insert or update of property_id on public.immo_requests for each row execute function public.immo_link_property_contact_request();
revoke all on function public.immo_link_property_contact_request() from public, anon, authenticated;
grant execute on function public.immo_link_property_contact_request() to authenticated;