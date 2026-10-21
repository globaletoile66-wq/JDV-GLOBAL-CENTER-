create policy travel_airlines_owner_read on public.travel_airlines for select to authenticated using (created_by = auth.uid());
create policy travel_restaurants_owner_read on public.travel_restaurants for select to authenticated using (created_by = auth.uid());
