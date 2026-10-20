do $$
declare
  rls_offerings boolean;
  rls_requests boolean;
  offering_policies integer;
  request_policies integer;
  foreign_keys integer;
  triggers integer;
begin
  if to_regclass('public.jdv_service_offerings') is null or to_regclass('public.jdv_service_requests') is null then raise exception 'JDV Services tables are missing'; end if;
  select c.relrowsecurity into rls_offerings from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relname='jdv_service_offerings';
  select c.relrowsecurity into rls_requests from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relname='jdv_service_requests';
  if rls_offerings is distinct from true or rls_requests is distinct from true then raise exception 'RLS must be enabled on both JDV Services tables'; end if;
  select count(*) into offering_policies from pg_policies where schemaname='public' and tablename='jdv_service_offerings';
  select count(*) into request_policies from pg_policies where schemaname='public' and tablename='jdv_service_requests';
  if offering_policies <> 4 then raise exception 'Expected 4 offering policies, found %', offering_policies; end if;
  if request_policies <> 4 then raise exception 'Expected 4 request policies, found %', request_policies; end if;
  select count(*) into foreign_keys from information_schema.table_constraints where table_schema='public' and table_name in ('jdv_service_offerings','jdv_service_requests') and constraint_type='FOREIGN KEY';
  if foreign_keys <> 4 then raise exception 'Expected 4 service foreign keys, found %', foreign_keys; end if;
  select count(*) into triggers from pg_trigger t join pg_class c on c.oid=t.tgrelid join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relname in ('jdv_service_offerings','jdv_service_requests') and not t.tgisinternal;
  if triggers <> 5 then raise exception 'Expected 5 service workflow triggers, found %', triggers; end if;
  if not has_table_privilege('anon','public.jdv_service_offerings','select') then raise exception 'Public catalog read should be granted'; end if;
  if has_table_privilege('anon','public.jdv_service_requests','select') then raise exception 'Anonymous users must not read service requests'; end if;
end $$;
