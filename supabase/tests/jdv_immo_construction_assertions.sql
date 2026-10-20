do $$
declare
  rls boolean;
  policies integer;
  foreign_keys integer;
begin
  if to_regclass('public.immo_construction_briefs') is null then
    raise exception 'immo_construction_briefs table is missing';
  end if;
  select c.relrowsecurity into rls
  from pg_class c join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public' and c.relname = 'immo_construction_briefs';
  if rls is distinct from true then raise exception 'RLS must be enabled'; end if;
  select count(*) into policies from pg_policies where schemaname = 'public' and tablename = 'immo_construction_briefs';
  if policies <> 3 then raise exception 'Expected 3 RLS policies, found %', policies; end if;
  select count(*) into foreign_keys from information_schema.table_constraints
  where table_schema = 'public' and table_name = 'immo_construction_briefs' and constraint_type = 'FOREIGN KEY';
  if foreign_keys <> 2 then raise exception 'Expected 2 foreign keys, found %', foreign_keys; end if;
  if has_table_privilege('anon', 'public.immo_construction_briefs', 'select') then raise exception 'anon must not read construction briefs'; end if;
  if not has_table_privilege('authenticated', 'public.immo_construction_briefs', 'select')
     or not has_table_privilege('authenticated', 'public.immo_construction_briefs', 'insert')
     or not has_table_privilege('authenticated', 'public.immo_construction_briefs', 'update') then
    raise exception 'authenticated grants are incomplete';
  end if;
  if to_regclass('public.immo_construction_briefs_assignee_idx') is null then raise exception 'assigned professional index is missing'; end if;
end $$;
