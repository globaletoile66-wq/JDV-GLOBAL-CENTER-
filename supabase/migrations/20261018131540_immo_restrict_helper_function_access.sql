revoke all on function public.immo_user_can_manage_property(uuid) from public, anon;
revoke all on function public.immo_user_can_access_lease(uuid) from public, anon;
revoke all on function public.immo_user_can_access_maintenance_request(uuid) from public, anon;
grant execute on function public.immo_user_can_manage_property(uuid) to authenticated;
grant execute on function public.immo_user_can_access_lease(uuid) to authenticated;
grant execute on function public.immo_user_can_access_maintenance_request(uuid) to authenticated;