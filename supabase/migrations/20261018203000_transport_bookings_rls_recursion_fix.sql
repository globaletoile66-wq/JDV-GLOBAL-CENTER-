-- Break the transport_bookings <-> transport_drivers RLS cycle.
-- The helper reads bookings as its owner, so policy evaluation on transport_bookings
-- does not re-enter transport_bookings through transport_drivers.
create or replace function public.passenger_can_view_transport_driver(p_driver_id uuid)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $function$
  select auth.uid() is not null
    and exists (
      select 1
      from public.transport_bookings b
      where b.driver_id = p_driver_id
        and b.passenger_user_id = auth.uid()
        and b.booking_status in (
          'accepted'::public.transport_booking_status,
          'driver_arriving'::public.transport_booking_status,
          'driver_arrived'::public.transport_booking_status,
          'in_progress'::public.transport_booking_status,
          'completed'::public.transport_booking_status
        )
    );
$function$;

revoke all on function public.passenger_can_view_transport_driver(uuid) from public;
grant execute on function public.passenger_can_view_transport_driver(uuid) to authenticated;

drop policy if exists transport_drivers_select on public.transport_drivers;
create policy transport_drivers_select
on public.transport_drivers
for select
to authenticated
using (
  user_id = (select auth.uid())
  or (business_id is not null and public.user_has_business_access(business_id))
  or public.is_super_admin()
  or public.passenger_can_view_transport_driver(id)
);
