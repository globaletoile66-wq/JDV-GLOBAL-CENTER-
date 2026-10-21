do $$
declare
  rls boolean;
  policies integer;
  foreign_keys integer;
  missing_policy text;
begin
  if to_regclass('public.immo_construction_briefs') is null then
    raise exception 'immo_construction_briefs table is missing';
  end if;

  select c.relrowsecurity into rls
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public'
    and c.relname = 'immo_construction_briefs';

  if rls is distinct from true then
    raise exception 'RLS must be enabled';
  end if;

  -- The base construction migration creates three customer policies.
  -- The persistent-workflows migration deliberately adds two active-Super-Admin
  -- policies (review + assignment). This smoke test applies both migrations,
  -- so five policies are expected in the final disposable database.
  select count(*) into policies
  from pg_policies
  where schemaname = 'public'
    and tablename = 'immo_construction_briefs';

  if policies <> 5 then
    raise exception 'Expected 5 RLS policies after persistent workflow migration, found %', policies;
  end if;

  select expected.policy_name into missing_policy
  from (values
    ('Users read own construction briefs'),
    ('Users create own construction briefs'),
    ('Users edit own construction drafts'),
    ('Super admins review construction briefs'),
    ('Super admins assign construction professionals')
  ) as expected(policy_name)
  where not exists (
    select 1
    from pg_policies p
    where p.schemaname = 'public'
      and p.tablename = 'immo_construction_briefs'
      and p.policyname = expected.policy_name
  )
  limit 1;

  if missing_policy is not null then
    raise exception 'Required construction RLS policy is missing: %', missing_policy;
  end if;

  -- Administrative access must remain authenticated-only and gated by an
  -- active row in public.super_admins; no broad authenticated bypass is allowed.
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'immo_construction_briefs'
      and policyname = 'Super admins review construction briefs'
      and cmd = 'SELECT'
      and roles = array['authenticated']::name[]
      and qual like '%super_admins%'
      and qual like '%active%'
  ) then
    raise exception 'Super-admin review policy must be restricted to active authenticated Super Admins';
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'immo_construction_briefs'
      and policyname = 'Super admins assign construction professionals'
      and cmd = 'UPDATE'
      and roles = array['authenticated']::name[]
      and qual like '%super_admins%'
      and qual like '%active%'
      and with_check like '%super_admins%'
      and with_check like '%active%'
  ) then
    raise exception 'Super-admin assignment policy must be restricted to active authenticated Super Admins';
  end if;

  -- Customer creation must stay strict: only a user's own unassigned draft.
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'immo_construction_briefs'
      and policyname = 'Users create own construction briefs'
      and cmd = 'INSERT'
      and with_check like '%user_id%'
      and with_check like '%assigned_professional_user_id IS NULL%'
      and with_check like '%brief_status = ''draft''%'
  ) then
    raise exception 'Strict customer insert policy is missing or weakened';
  end if;

  select count(*) into foreign_keys
  from information_schema.table_constraints
  where table_schema = 'public'
    and table_name = 'immo_construction_briefs'
    and constraint_type = 'FOREIGN KEY';

  if foreign_keys <> 2 then
    raise exception 'Expected 2 foreign keys, found %', foreign_keys;
  end if;

  if has_table_privilege('anon', 'public.immo_construction_briefs', 'select') then
    raise exception 'anon must not read construction briefs';
  end if;

  if not has_table_privilege('authenticated', 'public.immo_construction_briefs', 'select')
     or not has_table_privilege('authenticated', 'public.immo_construction_briefs', 'insert')
     or not has_table_privilege('authenticated', 'public.immo_construction_briefs', 'update') then
    raise exception 'authenticated grants are incomplete';
  end if;

  if to_regclass('public.immo_construction_briefs_assignee_idx') is null then
    raise exception 'assigned professional index is missing';
  end if;
end $$;
