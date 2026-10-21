-- JDV: separate application memberships and subscriptions from the global identity.
-- This migration is intentionally committed to GitHub only; it is not applied to Supabase.
begin;

create table if not exists public.app_memberships (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  app_key text not null check (app_key ~ '^[a-z][a-z0-9_]{1,63}$'),
  status text not null default 'active' check (status in ('active','suspended','revoked')),
  role text not null default 'member',
  joined_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, app_key)
);

create index if not exists app_memberships_user_app_idx on public.app_memberships(user_id, app_key, status);

create table if not exists public.app_user_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  app_key text not null check (app_key ~ '^[a-z][a-z0-9_]{1,63}$'),
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, app_key)
);

alter table public.app_memberships enable row level security;
alter table public.app_user_settings enable row level security;

-- Restrictive RLS gates prevent authenticated users from using an unrelated
-- JDV account to read/write private Agriculture operations. Public catalog RPC
-- remains read-only and is granted separately below.
do $jdv_agri_rls$
declare
  v_table text;
begin
  foreach v_table in array array[
    'agri_farms',
    'agri_crops',
    'agri_products',
    'agri_production_records',
    'agri_orders',
    'agri_order_items'
  ] loop
    execute format('drop policy if exists jdv_agriculture_membership_required on public.%I', v_table);
    execute format(
      'create policy jdv_agriculture_membership_required on public.%I as restrictive for all to authenticated using (public.is_super_admin() or exists (select 1 from public.app_memberships m where m.user_id = (select auth.uid()) and m.app_key = ''agriculture'' and m.status = ''active'')) with check (public.is_super_admin() or exists (select 1 from public.app_memberships m where m.user_id = (select auth.uid()) and m.app_key = ''agriculture'' and m.status = ''active''))',
      v_table
    );
  end loop;
end;
$jdv_agri_rls$;

drop policy if exists "Users can read their own app memberships" on public.app_memberships;
create policy "Users can read their own app memberships"
  on public.app_memberships for select to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists "Users can read their own app settings" on public.app_user_settings;
create policy "Users can read their own app settings"
  on public.app_user_settings for select to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists "Users can create their own app settings" on public.app_user_settings;
create policy "Users can create their own app settings"
  on public.app_user_settings for insert to authenticated
  with check (user_id = (select auth.uid()));

drop policy if exists "Users can update their own app settings" on public.app_user_settings;
create policy "Users can update their own app settings"
  on public.app_user_settings for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

drop policy if exists "Users can delete their own app settings" on public.app_user_settings;
create policy "Users can delete their own app settings"
  on public.app_user_settings for delete to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists jdv_app_settings_membership_required on public.app_user_settings;
create policy jdv_app_settings_membership_required
  on public.app_user_settings as restrictive for all to authenticated
  using (
    public.is_super_admin()
    or exists (
      select 1 from public.app_memberships m
      where m.user_id = (select auth.uid())
        and m.app_key = app_user_settings.app_key
        and m.status = 'active'
    )
  )
  with check (
    public.is_super_admin()
    or exists (
      select 1 from public.app_memberships m
      where m.user_id = (select auth.uid())
        and m.app_key = app_user_settings.app_key
        and m.status = 'active'
    )
  );

-- Create a membership only for the application explicitly chosen during signup.
-- This does not create a subscription and does not grant access to other apps.
create or replace function public.jdv_create_app_membership_on_signup()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_app_key text;
begin
  v_app_key := coalesce(new.raw_user_meta_data ->> 'jdv_app_key', 'global_center');
  if v_app_key not in (
    'global_center', 'marketplace', 'agriculture', 'immo', 'health', 'academy',
    'social', 'media', 'pub', 'pay', 'tontine', 'travel', 'transport',
    'insurance', 'energy', 'ai', 'business', 'transit', 'services', 'procurement',
    'accounting', 'inventory', 'hr', 'jobs', 'entertainment'
  ) then
    raise exception 'Unsupported JDV application key';
  end if;

  insert into public.app_memberships (user_id, app_key, status, role)
  values (new.id, v_app_key, 'active', 'member')
  on conflict (user_id, app_key) do nothing;

  return new;
end;
$$;

drop trigger if exists jdv_create_app_membership_after_signup on auth.users;
create trigger jdv_create_app_membership_after_signup
  after insert on auth.users
  for each row execute function public.jdv_create_app_membership_on_signup();

-- Existing authenticated users may explicitly enroll in another application.
-- No client-side INSERT policy is granted on app_memberships.
create or replace function public.jdv_join_application(p_app_key text)
returns public.app_memberships
language plpgsql
security definer
set search_path = ''
as $jdv_join$
declare
  v_user_id uuid := auth.uid();
  v_membership public.app_memberships;
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  if p_app_key not in (
    'marketplace', 'agriculture', 'immo', 'health', 'academy', 'social',
    'media', 'pub', 'pay', 'tontine', 'travel', 'transport', 'insurance',
    'energy', 'ai', 'business', 'transit', 'services', 'procurement', 'accounting',
    'inventory', 'hr', 'jobs', 'entertainment'
  ) then
    raise exception 'Unsupported JDV application key';
  end if;

  insert into public.app_memberships (user_id, app_key, status, role)
  values (v_user_id, p_app_key, 'active', 'member')
  on conflict (user_id, app_key) do nothing;

  select * into v_membership
  from public.app_memberships
  where user_id = v_user_id and app_key = p_app_key;

  if v_membership.status <> 'active' then
    raise exception 'Application membership is not active';
  end if;

  return v_membership;
end;
$jdv_join$;

revoke all on function public.jdv_join_application(text) from public;
grant execute on function public.jdv_join_application(text) to authenticated;
revoke all on function public.jdv_create_app_membership_on_signup() from public;

-- Marketplace actions require explicit Marketplace membership. Public listing reads
-- remain public; the restrictive policies below gate authenticated mutations and
-- private commerce records without replacing existing ownership policies.
do $jdv_marketplace_rls$
declare
  v_table text;
begin
  foreach v_table in array array[
    'marketplace_carts',
    'marketplace_cart_items',
    'marketplace_addresses',
    'marketplace_favorites',
    'marketplace_orders',
    'marketplace_order_items',
    'marketplace_returns',
    'marketplace_messages'
  ] loop
    if to_regclass('public.' || v_table) is not null then
      execute format('drop policy if exists jdv_marketplace_membership_required on public.%I', v_table);
      execute format(
        'create policy jdv_marketplace_membership_required on public.%I as restrictive for all to authenticated using (public.is_super_admin() or exists (select 1 from public.app_memberships m where m.user_id = (select auth.uid()) and m.app_key = ''marketplace'' and m.status = ''active'')) with check (public.is_super_admin() or exists (select 1 from public.app_memberships m where m.user_id = (select auth.uid()) and m.app_key = ''marketplace'' and m.status = ''active''))',
        v_table
      );
    end if;
  end loop;

  foreach v_table in array array[
    'marketplace_sellers',
    'marketplace_listings',
    'marketplace_product_variants'
  ] loop
    if to_regclass('public.' || v_table) is not null then
      execute format('drop policy if exists jdv_marketplace_membership_insert on public.%I', v_table);
      execute format('drop policy if exists jdv_marketplace_membership_update on public.%I', v_table);
      execute format('drop policy if exists jdv_marketplace_membership_delete on public.%I', v_table);
      execute format(
        'create policy jdv_marketplace_membership_insert on public.%I as restrictive for insert to authenticated with check (public.is_super_admin() or exists (select 1 from public.app_memberships m where m.user_id = (select auth.uid()) and m.app_key = ''marketplace'' and m.status = ''active''))',
        v_table
      );
      execute format(
        'create policy jdv_marketplace_membership_update on public.%I as restrictive for update to authenticated using (public.is_super_admin() or exists (select 1 from public.app_memberships m where m.user_id = (select auth.uid()) and m.app_key = ''marketplace'' and m.status = ''active'')) with check (public.is_super_admin() or exists (select 1 from public.app_memberships m where m.user_id = (select auth.uid()) and m.app_key = ''marketplace'' and m.status = ''active''))',
        v_table
      );
      execute format(
        'create policy jdv_marketplace_membership_delete on public.%I as restrictive for delete to authenticated using (public.is_super_admin() or exists (select 1 from public.app_memberships m where m.user_id = (select auth.uid()) and m.app_key = ''marketplace'' and m.status = ''active''))',
        v_table
      );
    end if;
  end loop;
end;
$jdv_marketplace_rls$;

create or replace function public.jdv_require_marketplace_membership_for_order()
returns trigger
language plpgsql
security definer
set search_path = ''
as $jdv_order_membership$
begin
  if current_setting('request.jwt.claim.role', true) = 'service_role' then
    return new;
  end if;
  if auth.uid() is null or not exists (
    select 1 from public.app_memberships m
    where m.user_id = auth.uid()
      and m.app_key = 'marketplace'
      and m.status = 'active'
  ) then
    raise exception 'JDV_MARKETPLACE_MEMBERSHIP_REQUIRED';
  end if;
  return new;
end;
$jdv_order_membership$;

revoke all on function public.jdv_require_marketplace_membership_for_order() from public;

drop trigger if exists jdv_marketplace_order_membership_required on public.marketplace_orders;
create trigger jdv_marketplace_order_membership_required
  before insert on public.marketplace_orders
  for each row execute function public.jdv_require_marketplace_membership_for_order();

-- Enforce branch membership at the database layer for the other public-facing apps.
-- Public catalogue tables get mutation-only gates so browsing remains possible.
do $jdv_branch_rls$
declare
  v_table text;
  v_app text;
begin
  -- Private records and user operations: membership plus the table's existing
  -- ownership/role policies are both required.
  foreach v_table in array array[
    'immo_favorites','immo_requests','immo_appointments','immo_agent_applications',
    'immo_mandates','immo_commissions','immo_leases','immo_reservations',
    'immo_disputes','immo_documents','immo_maintenance_requests',
    'immo_maintenance_quotes','immo_maintenance_interventions','immo_maintenance_invoices',
    'immo_rent_schedules','immo_tenant_followups','immo_property_inspections',
    'immo_construction_briefs','immo_project_cost_items','immo_project_cost_payments',
    'health_appointments','health_documents','health_emergency_contacts','health_home_care_requests',
    'health_invoices','health_laboratory_orders','health_laboratory_results',
    'health_medical_record_access_log','health_medical_records','health_patient_consents',
    'health_prescription_items','health_prescriptions','health_search_history',
    'health_search_preferences','health_teleconsultation_requests','health_verification_records',
    'academy_enrollments','academy_lesson_progress','academy_assessment_submissions',
    'academy_certificates','academy_results','academy_lessons','academy_assessments',
    'academy_assessment_questions','academy_assessment_answer_keys','academy_live_sessions',
    'social_reactions','social_comments','social_follows','social_conversations',
    'social_messages','social_event_registrations','social_group_memberships','social_app_preferences',
    'media_content_metrics','media_channels',
    'business_appointments','business_clients','business_documents','business_expenses','business_invoices',
    'business_members','business_orders','business_products','business_sale_items','business_sales','business_suppliers',
    'energy_assets','energy_billing_records','energy_meter_readings','energy_sites',
    'insurance_claim_documents','insurance_claims','insurance_commissions','insurance_coverages',
    'insurance_customers','insurance_payments','insurance_policies','insurance_premium_schedules',
    'transit_customs_cases','transit_customs_declarations','transit_documents','transit_invoices',
    'transit_operations','transit_payment_schedules','transit_quotes','transit_requests','transit_reports',
    'transit_shipment_legs','transit_shipments','transit_storage_records','transit_tracking_events',
    'transport_bookings','transport_commissions','transport_deliveries','transport_delivery_events',
    'transport_delivery_proofs','transport_driver_documents','transport_parcels','transport_rentals',
    'transport_requests','travel_bookings','travel_commissions','travel_documents','travel_favorites',
    'travel_itineraries','travel_itinerary_items','travel_quotes','travel_reports','travel_requests','travelers',
    'ai_access_log','ai_conversations','ai_messages','ai_org_policies','ai_provider_configs','ai_usage',
    'wallets','wallet_transactions','transfers','transfer_events','payment_requests',
    'jdv_service_requests','warehouse_inventory','warehouse_subwarehouse_inventory',
    'pub_advertisers','pub_campaigns','pub_campaign_placements','pub_creatives','pub_impressions','pub_partners',
    'tontine_members','tontine_contribution_schedules','tontine_contributions','tontine_cycles',
    'tontine_documents','tontine_financial_reconciliations','tontine_join_links',
    'tontine_organization_board','tontine_party_verifications','tontine_payout_dispatches',
    'tontine_payouts','tontine_pool_entries','tontine_reminders_sent','tontine_rotations'
  ] loop
    if to_regclass('public.' || v_table) is not null then
      if v_table like 'immo_%' then v_app := 'immo';
      elsif v_table like 'health_%' then v_app := 'health';
      elsif v_table like 'academy_%' then v_app := 'academy';
      elsif v_table like 'social_%' then v_app := 'social';
      elsif v_table like 'media_%' then v_app := 'media';
      elsif v_table like 'pub_%' then v_app := 'pub';
      elsif v_table like 'tontine_%' then v_app := 'tontine';
      elsif v_table like 'business_%' then v_app := 'business';
      elsif v_table like 'energy_%' then v_app := 'energy';
      elsif v_table like 'insurance_%' then v_app := 'insurance';
      elsif v_table like 'transit_%' then v_app := 'transit';
      elsif v_table like 'transport_%' then v_app := 'transport';
      elsif v_table like 'travel_%' then v_app := 'travel';
      elsif v_table like 'ai_%' then v_app := 'ai';
      elsif v_table like 'wallet_%' or v_table like 'transfer%' or v_table = 'payment_requests' then v_app := 'pay';
      elsif v_table like 'jdv_service_%' then v_app := 'services';
      elsif v_table like 'warehouse_%' then v_app := 'inventory';
      end if;
      execute format('drop policy if exists jdv_branch_membership_required on public.%I', v_table);
      execute format(
        'create policy jdv_branch_membership_required on public.%I as restrictive for all to authenticated using (public.is_super_admin() or exists (select 1 from public.app_memberships m where m.user_id = (select auth.uid()) and m.app_key = %L and m.status = ''active'')) with check (public.is_super_admin() or exists (select 1 from public.app_memberships m where m.user_id = (select auth.uid()) and m.app_key = %L and m.status = ''active''))',
        v_table, v_app, v_app
      );
    end if;
  end loop;

  -- Public catalogues can be read without enrollment; any mutation still needs
  -- membership in the application and must satisfy existing owner/admin rules.
  foreach v_table in array array[
    'immo_properties','immo_property_media','immo_property_types','immo_agents','immo_agencies','immo_developers',
    'health_services','health_provider_profiles','health_provider_presence','health_professionals','health_specialties','health_availabilities','health_on_call_schedules',
    'academy_programs','academy_courses',
    'social_profiles','social_posts','social_groups','social_events','social_external_links',
    'media_contents','media_categories','media_content_categories',
    'pub_placements','pub_pricing_rules',
    'tontines','tontine_classes',
    'business_profiles','business_categories','business_product_categories',
    'energy_providers','insurance_products','insurance_providers',
    'transit_document_requirements','transit_goods','transit_locations','transit_partners','transit_warehouses',
    'transport_driver_availability','transport_drivers','transport_pricing_rules','transport_routes','transport_schedules',
    'transport_seats','transport_service_types','transport_stops','transport_vehicle_types','transport_vehicles',
    'travel_accommodation_media','travel_accommodations','travel_activities','travel_activity_media',
    'travel_agencies','travel_agents','travel_availability','travel_destinations','travel_guides',
    'travel_rooms','travel_tour_stops','travel_tours','ai_model_catalog','jdv_service_offerings'
  ] loop
    if to_regclass('public.' || v_table) is not null then
      if v_table like 'immo_%' then v_app := 'immo';
      elsif v_table like 'health_%' then v_app := 'health';
      elsif v_table like 'academy_%' then v_app := 'academy';
      elsif v_table like 'social_%' then v_app := 'social';
      elsif v_table like 'media_%' then v_app := 'media';
      elsif v_table like 'pub_%' then v_app := 'pub';
      elsif v_table like 'tontine_%' then v_app := 'tontine';
      elsif v_table like 'business_%' then v_app := 'business';
      elsif v_table like 'energy_%' then v_app := 'energy';
      elsif v_table like 'insurance_%' then v_app := 'insurance';
      elsif v_table like 'transit_%' then v_app := 'transit';
      elsif v_table like 'transport_%' then v_app := 'transport';
      elsif v_table like 'travel_%' then v_app := 'travel';
      elsif v_table like 'ai_%' then v_app := 'ai';
      elsif v_table like 'wallet_%' or v_table like 'transfer%' or v_table = 'payment_requests' then v_app := 'pay';
      elsif v_table like 'jdv_service_%' then v_app := 'services';
      elsif v_table like 'warehouse_%' then v_app := 'inventory';
      end if;
      execute format('drop policy if exists jdv_branch_membership_insert on public.%I', v_table);
        execute format('drop policy if exists jdv_branch_membership_update on public.%I', v_table);
        execute format('drop policy if exists jdv_branch_membership_delete on public.%I', v_table);
      execute format(
        'create policy jdv_branch_membership_insert on public.%I as restrictive for insert to authenticated with check (public.is_super_admin() or exists (select 1 from public.app_memberships m where m.user_id = (select auth.uid()) and m.app_key = %L and m.status = ''active''))',
          v_table, v_app
        );
      execute format(
        'create policy jdv_branch_membership_update on public.%I as restrictive for update to authenticated using (public.is_super_admin() or exists (select 1 from public.app_memberships m where m.user_id = (select auth.uid()) and m.app_key = %L and m.status = ''active'')) with check (public.is_super_admin() or exists (select 1 from public.app_memberships m where m.user_id = (select auth.uid()) and m.app_key = %L and m.status = ''active''))',
          v_table, v_app, v_app
        );
      execute format(
        'create policy jdv_branch_membership_delete on public.%I as restrictive for delete to authenticated using (public.is_super_admin() or exists (select 1 from public.app_memberships m where m.user_id = (select auth.uid()) and m.app_key = %L and m.status = ''active''))',
        v_table, v_app
      );
    end if;
  end loop;
end;
$jdv_branch_rls$;

-- Public read-only catalog: exposes only available agricultural offers, never farm ownership data.
create or replace function public.jdv_agriculture_public_catalog()
returns table (
  product_id uuid,
  product_name text,
  product_type text,
  available_quantity numeric,
  unit text,
  unit_price numeric,
  currency_code text,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $jdv_catalog$
  select p.id, p.name, p.product_type, p.quantity, p.unit, p.unit_price, c.code, p.created_at
  from public.agri_products p
  left join public.currencies c on c.id = p.currency_id
  where p.availability_status = 'available'
  order by p.created_at desc
  limit 200;
$jdv_catalog$;

revoke all on function public.jdv_agriculture_public_catalog() from public;
grant execute on function public.jdv_agriculture_public_catalog() to anon, authenticated;

commit;
