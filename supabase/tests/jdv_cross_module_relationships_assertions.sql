do $$
declare
  expected_fks text[] := array[
    'audit_events_user_id_fkey',
    'health_provider_applications_country_id_fkey',
    'immo_maintenance_interventions_provider_business_id_fkey',
    'immo_maintenance_invoices_provider_business_id_fkey',
    'immo_maintenance_quotes_provider_business_id_fkey',
    'immo_maintenance_requests_assigned_provider_business_id_fkey',
    'immo_project_cost_items_business_id_fkey',
    'immo_project_cost_items_vendor_business_id_fkey',
    'insurance_payments_wallet_transaction_id_fkey',
    'insurance_premium_schedules_wallet_transaction_id_fkey',
    'notification_events_user_id_fkey',
    'pub_partners_organization_id_fkey',
    'subscription_payments_checkout_id_fkey',
    'tontine_financial_reconciliations_currency_id_fkey',
    'user_permissions_user_id_fkey',
    'warehouse_users_user_id_fkey',
    'warehouses_manager_user_id_fkey'
  ];
  expected_indexes text[] := array[
    'health_provider_applications_country_id_idx',
    'immo_maintenance_interventions_provider_business_id_idx',
    'immo_maintenance_invoices_provider_business_id_idx',
    'immo_maintenance_quotes_provider_business_id_idx',
    'immo_project_cost_items_business_id_idx',
    'immo_project_cost_items_vendor_business_id_idx',
    'notification_events_user_id_idx',
    'pub_partners_organization_id_idx',
    'tontine_financial_reconciliations_currency_id_idx',
    'warehouse_users_user_id_idx',
    'warehouses_manager_user_id_idx',
    'insurance_payments_wallet_transaction_id_idx',
    'insurance_premium_schedules_wallet_transaction_id_idx',
    'subscription_payments_checkout_id_idx'
  ];
  found_fks integer;
  found_indexes integer;
begin
  select count(*) into found_fks
  from information_schema.table_constraints
  where table_schema='public' and constraint_type='FOREIGN KEY'
    and constraint_name = any(expected_fks);
  if found_fks <> cardinality(expected_fks) then
    raise exception 'Expected % cross-module foreign keys, found %', cardinality(expected_fks), found_fks;
  end if;

  select count(*) into found_indexes from pg_indexes
  where schemaname='public' and indexname = any(expected_indexes);
  if found_indexes <> cardinality(expected_indexes) then
    raise exception 'Expected % supporting indexes, found %', cardinality(expected_indexes), found_indexes;
  end if;
end $$;
