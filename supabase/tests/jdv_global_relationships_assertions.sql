do $$
declare
  relation_fks integer;
  relation_indexes integer;
begin
  select count(*) into relation_fks
  from information_schema.table_constraints
  where table_schema = 'public'
    and constraint_type = 'FOREIGN KEY'
    and constraint_name in (
      'article_categories_organization_id_fkey',
      'login_security_events_user_id_fkey',
      'notification_preferences_user_id_fkey',
      'user_settings_user_id_fkey',
      'super_admin_modules_user_id_fkey'
    );
  if relation_fks <> 5 then
    raise exception 'Expected 5 relationship foreign keys, found %', relation_fks;
  end if;

  select count(*) into relation_indexes
  from pg_indexes
  where schemaname = 'public'
    and indexname in (
      'article_categories_organization_id_idx',
      'login_security_events_user_id_idx',
      'notification_preferences_user_id_idx',
      'user_settings_user_id_idx',
      'super_admin_modules_user_id_idx'
    );
  if relation_indexes <> 5 then
    raise exception 'Expected 5 supporting indexes, found %', relation_indexes;
  end if;

  if not exists (select 1 from public.super_admin_modules where module_code = 'crm' and module_name = 'JDV CRM') then
    raise exception 'The historical CRM module code was unexpectedly changed';
  end if;

  if exists (
    select 1 from public.super_admin_modules sam
    left join public.super_admins sa on sa.user_id = sam.user_id
    where sa.user_id is null
  ) then
    raise exception 'Orphan super_admin_modules.user_id value exists';
  end if;
end $$;
