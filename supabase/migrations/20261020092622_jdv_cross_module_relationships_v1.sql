-- Cross-module FK reconciliation for confirmed, direct references.
-- Data was checked for orphan rows in the connected Supabase project before applying.
-- Polymorphic identifiers and historical CRM tables are intentionally excluded.

create index if not exists health_provider_applications_country_id_idx on public.health_provider_applications(country_id);
create index if not exists immo_maintenance_interventions_provider_business_id_idx on public.immo_maintenance_interventions(provider_business_id);
create index if not exists immo_maintenance_invoices_provider_business_id_idx on public.immo_maintenance_invoices(provider_business_id);
create index if not exists immo_maintenance_quotes_provider_business_id_idx on public.immo_maintenance_quotes(provider_business_id);
create index if not exists immo_project_cost_items_business_id_idx on public.immo_project_cost_items(business_id);
create index if not exists immo_project_cost_items_vendor_business_id_idx on public.immo_project_cost_items(vendor_business_id);
create index if not exists notification_events_user_id_idx on public.notification_events(user_id);
create index if not exists pub_partners_organization_id_idx on public.pub_partners(organization_id);
create index if not exists tontine_financial_reconciliations_currency_id_idx on public.tontine_financial_reconciliations(currency_id);
create index if not exists warehouse_users_user_id_idx on public.warehouse_users(user_id);
create index if not exists warehouses_manager_user_id_idx on public.warehouses(manager_user_id);
create index if not exists insurance_payments_wallet_transaction_id_idx on public.insurance_payments(wallet_transaction_id);
create index if not exists insurance_premium_schedules_wallet_transaction_id_idx on public.insurance_premium_schedules(wallet_transaction_id);
create index if not exists subscription_payments_checkout_id_idx on public.subscription_payments(checkout_id);

alter table public.audit_events
  add constraint audit_events_user_id_fkey foreign key (user_id) references auth.users(id) on delete set null;
alter table public.health_provider_applications
  add constraint health_provider_applications_country_id_fkey foreign key (country_id) references public.countries(id) on delete set null;
alter table public.immo_maintenance_interventions
  add constraint immo_maintenance_interventions_provider_business_id_fkey foreign key (provider_business_id) references public.business_profiles(id) on delete set null;
alter table public.immo_maintenance_invoices
  add constraint immo_maintenance_invoices_provider_business_id_fkey foreign key (provider_business_id) references public.business_profiles(id) on delete set null;
alter table public.immo_maintenance_quotes
  add constraint immo_maintenance_quotes_provider_business_id_fkey foreign key (provider_business_id) references public.business_profiles(id) on delete set null;
alter table public.immo_maintenance_requests
  add constraint immo_maintenance_requests_assigned_provider_business_id_fkey foreign key (assigned_provider_business_id) references public.business_profiles(id) on delete set null;
alter table public.immo_project_cost_items
  add constraint immo_project_cost_items_business_id_fkey foreign key (business_id) references public.business_profiles(id) on delete restrict;
alter table public.immo_project_cost_items
  add constraint immo_project_cost_items_vendor_business_id_fkey foreign key (vendor_business_id) references public.business_profiles(id) on delete set null;
alter table public.insurance_payments
  add constraint insurance_payments_wallet_transaction_id_fkey foreign key (wallet_transaction_id) references public.wallet_transactions(id) on delete restrict;
alter table public.insurance_premium_schedules
  add constraint insurance_premium_schedules_wallet_transaction_id_fkey foreign key (wallet_transaction_id) references public.wallet_transactions(id) on delete restrict;
alter table public.notification_events
  add constraint notification_events_user_id_fkey foreign key (user_id) references auth.users(id) on delete set null;
alter table public.pub_partners
  add constraint pub_partners_organization_id_fkey foreign key (organization_id) references public.organizations(id) on delete set null;
alter table public.subscription_payments
  add constraint subscription_payments_checkout_id_fkey foreign key (checkout_id) references public.billing_checkouts(id) on delete set null;
alter table public.tontine_financial_reconciliations
  add constraint tontine_financial_reconciliations_currency_id_fkey foreign key (currency_id) references public.currencies(id) on delete restrict;
alter table public.user_permissions
  add constraint user_permissions_user_id_fkey foreign key (user_id) references auth.users(id) on delete cascade;
alter table public.warehouse_users
  add constraint warehouse_users_user_id_fkey foreign key (user_id) references auth.users(id) on delete cascade;
alter table public.warehouses
  add constraint warehouses_manager_user_id_fkey foreign key (manager_user_id) references auth.users(id) on delete set null;
