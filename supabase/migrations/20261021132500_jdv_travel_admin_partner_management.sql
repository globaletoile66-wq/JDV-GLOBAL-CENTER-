create policy travel_partner_applications_admin_manage on public.travel_partner_applications for all to authenticated using (is_super_admin()) with check (is_super_admin());
