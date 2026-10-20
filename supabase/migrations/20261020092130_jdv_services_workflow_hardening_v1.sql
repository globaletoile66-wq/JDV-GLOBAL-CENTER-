-- JDV SERVICES workflow hardening: participant-specific transitions.
-- Canonical version matching the applied Supabase migration 20261020092130.

drop policy if exists "jdv_service_requests_customer_decision" on public.jdv_service_requests;
create policy "jdv_service_requests_customer_decision" on public.jdv_service_requests
  for update to authenticated
  using (requester_id = auth.uid())
  with check (requester_id = auth.uid());

create or replace function public.jdv_services_guard_request_workflow()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  actor uuid := auth.uid();
  owner_id uuid;
begin
  if new.offering_id is distinct from old.offering_id
     or new.requester_id is distinct from old.requester_id
     or new.message is distinct from old.message
     or new.created_at is distinct from old.created_at then
    raise exception 'Service request identity and original message are immutable';
  end if;

  select s.provider_id into owner_id
  from public.jdv_service_offerings s
  where s.id = old.offering_id;

  if actor = old.requester_id then
    if new.requested_for is distinct from old.requested_for
       or new.provider_response is distinct from old.provider_response
       or new.proposed_price is distinct from old.proposed_price then
      raise exception 'Customers may only accept a quote or cancel an eligible request';
    end if;

    if not (
      (old.status = 'quoted' and new.status = 'accepted')
      or (old.status in ('submitted', 'quoted') and new.status = 'cancelled')
    ) then
      raise exception 'Invalid customer service-request transition';
    end if;
  elsif actor = owner_id then
    if new.requested_for is distinct from old.requested_for then
      raise exception 'The requested date is immutable in this workflow version';
    end if;

    if old.status = 'submitted' and new.status not in ('quoted', 'declined') then
      raise exception 'Provider may quote or decline a submitted request';
    elsif old.status = 'quoted' and new.status not in ('quoted', 'declined') then
      raise exception 'Provider may revise a quote or decline it';
    elsif old.status = 'accepted' and new.status <> 'completed' then
      raise exception 'Provider may mark an accepted request completed';
    elsif old.status not in ('submitted', 'quoted', 'accepted') then
      raise exception 'This service request is no longer editable';
    end if;

    if old.status = 'accepted' and (
      new.provider_response is distinct from old.provider_response
      or new.proposed_price is distinct from old.proposed_price
    ) then
      raise exception 'Accepted quote values cannot be changed during completion';
    end if;
  else
    raise exception 'Only the customer or assigned provider may update this request';
  end if;

  return new;
end;
$$;

drop trigger if exists jdv_service_requests_guard_workflow on public.jdv_service_requests;
create trigger jdv_service_requests_guard_workflow
before update on public.jdv_service_requests
for each row execute function public.jdv_services_guard_request_workflow();

revoke all on function public.jdv_services_guard_request_workflow() from public, anon, authenticated;
