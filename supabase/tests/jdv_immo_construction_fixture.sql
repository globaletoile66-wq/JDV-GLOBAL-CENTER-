create schema auth;
create table auth.users (id uuid primary key);
create or replace function auth.uid()
returns uuid
language sql
stable
as $$
  select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
$$;
create role anon nologin;
create role authenticated nologin;
grant usage on schema auth to anon, authenticated;
grant execute on function auth.uid() to anon, authenticated;
insert into auth.users (id) values
  ('00000000-0000-4000-8000-000000000001'),
  ('00000000-0000-4000-8000-000000000002'),
  ('00000000-0000-4000-8000-000000000003');


create table public.organizations (id uuid primary key);
create table public.modules (id uuid primary key, code text not null unique);
create table public.super_admins (
  id uuid primary key,
  user_id uuid not null unique references auth.users(id),
  admin_status text not null
);
create table public.super_admin_modules (
  id uuid primary key,
  user_id uuid not null,
  module_code text not null,
  module_name text not null
);
create table public.article_categories (id uuid primary key, organization_id uuid);
create table public.login_security_events (id uuid primary key, user_id uuid);
create table public.notification_preferences (id uuid primary key, user_id uuid not null);
create table public.user_settings (id uuid primary key, user_id uuid not null);

insert into public.organizations (id) values ('10000000-0000-4000-8000-000000000001');
insert into public.modules (id, code) values ('20000000-0000-4000-8000-000000000001', 'jdv_crm');
insert into public.super_admins (id, user_id, admin_status)
values ('30000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000001', 'active');
-- Historical module code intentionally remains 'crm'; do not rewrite the legacy CRM code.
insert into public.super_admin_modules (id, user_id, module_code, module_name)
values ('40000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000001', 'crm', 'JDV CRM');
insert into public.article_categories (id, organization_id)
values ('50000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001');
insert into public.login_security_events (id, user_id)
values ('60000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000001');
insert into public.notification_preferences (id, user_id)
values ('70000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000001');
insert into public.user_settings (id, user_id)
values ('80000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000001');

create table public.business_profiles (id uuid primary key);

-- Minimal cross-module reference fixture for the direct-FK smoke test.
create table public.countries (id uuid primary key);
create table public.currencies (id uuid primary key);
create table public.documents (id uuid primary key);
create table public.wallet_transactions (id uuid primary key);
create table public.billing_checkouts (id uuid primary key);
create table public.audit_events (id uuid primary key, user_id uuid);
create table public.health_provider_applications (id uuid primary key, country_id uuid);
create table public.immo_maintenance_interventions (id uuid primary key, provider_business_id uuid);
create table public.immo_maintenance_invoices (id uuid primary key, provider_business_id uuid);
create table public.immo_maintenance_quotes (id uuid primary key, provider_business_id uuid);
create table public.immo_maintenance_requests (id uuid primary key, assigned_provider_business_id uuid);
create table public.immo_project_cost_items (id uuid primary key, business_id uuid not null, vendor_business_id uuid);
create table public.insurance_payments (id uuid primary key, wallet_transaction_id uuid);
create table public.insurance_premium_schedules (id uuid primary key, wallet_transaction_id uuid);
create table public.notification_events (id uuid primary key, user_id uuid);
create table public.pub_partners (id uuid primary key, organization_id uuid);
create table public.subscription_payments (id uuid primary key, checkout_id uuid);
create table public.tontine_financial_reconciliations (id uuid primary key, currency_id uuid not null);
create table public.user_permissions (id uuid primary key, user_id uuid not null);
create table public.warehouse_users (id uuid primary key, user_id uuid not null);
create table public.warehouses (id uuid primary key, manager_user_id uuid);
