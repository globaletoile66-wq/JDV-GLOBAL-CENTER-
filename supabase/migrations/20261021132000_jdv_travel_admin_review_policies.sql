create policy travel_airlines_admin_read on public.travel_airlines for select to authenticated using (is_super_admin());
create policy travel_restaurants_admin_read on public.travel_restaurants for select to authenticated using (is_super_admin());
