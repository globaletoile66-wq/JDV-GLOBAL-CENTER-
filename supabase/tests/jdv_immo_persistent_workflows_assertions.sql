do $$
declare
  secured_tables integer;
  found_indexes integer;
  brief_insert_check text;
begin
  select count(*) into secured_tables
  from pg_class c join pg_namespace n on n.oid=c.relnamespace
  where n.nspname='public'
    and c.relname = any(array['immo_agent_applications','immo_mandates','immo_commission_rules','immo_tenant_followups','immo_disputes','jdv_studio_settings'])
    and c.relrowsecurity;
  if secured_tables <> 6 then raise exception 'Expected 6 persistent workflow tables with RLS, found %', secured_tables; end if;

  select count(*) into found_indexes from pg_indexes where schemaname='public' and indexname = any(array[
    'immo_agent_applications_status_idx','immo_agent_applications_business_id_idx','immo_agent_applications_reviewed_by_idx',
    'immo_mandates_owner_status_idx','immo_mandates_agent_status_idx','immo_mandates_property_id_idx',
    'immo_commission_rules_status_idx','immo_commission_rules_created_by_idx','immo_commission_rules_validated_by_idx',
    'immo_tenant_followups_lease_due_idx','immo_tenant_followups_author_user_id_idx','immo_disputes_parties_status_idx',
    'immo_disputes_respondent_user_id_idx','immo_disputes_property_id_idx','immo_disputes_lease_id_idx',
    'immo_disputes_mandate_id_idx','immo_disputes_resolved_by_idx','jdv_studio_settings_updated_by_idx'
  ]);
  if found_indexes <> 18 then raise exception 'Expected 18 workflow indexes, found %', found_indexes; end if;

  if not exists (select 1 from pg_policies where schemaname='public' and tablename='jdv_studio_settings'
      and policyname='Public read safe global Studio settings' and cmd='SELECT'
      and roles::text like '%anon%' and roles::text like '%authenticated%') then
    raise exception 'Safe Studio settings must be readable by app users';
  end if;
  if not has_column_privilege('anon','public.jdv_studio_settings','config','SELECT')
    or not has_column_privilege('anon','public.jdv_studio_settings','scope_key','SELECT')
    or has_column_privilege('anon','public.jdv_studio_settings','updated_by','SELECT')
    or has_column_privilege('anon','public.jdv_studio_settings','updated_at','SELECT')
    or has_table_privilege('anon','public.jdv_studio_settings','INSERT')
    or has_table_privilege('anon','public.jdv_studio_settings','UPDATE') then
    raise exception 'Anonymous Studio settings privileges are not restricted to safe read columns';
  end if;
  if not exists (select 1 from pg_constraint where conname='jdv_studio_settings_public_config_check') then
    raise exception 'Public Studio settings allowlist constraint is missing';
  end if;

  select with_check into brief_insert_check from pg_policies
  where schemaname='public' and tablename='immo_construction_briefs'
    and policyname='Users create own construction briefs' and cmd='INSERT';
  if brief_insert_check is null
    or position('assigned_professional_user_id IS NULL' in brief_insert_check)=0
    or position('brief_status = ''draft''' in brief_insert_check)=0 then
    raise exception 'Existing strict construction-brief insert policy was weakened or replaced';
  end if;

  if not exists (select 1 from storage.buckets where id='jdv-studio-media' and public=true) then
    raise exception 'Expected public JDV Studio media bucket';
  end if;
  if has_function_privilege('anon','public.submit_immo_mandate(uuid)','EXECUTE')
    or has_function_privilege('anon','public.accept_immo_mandate(uuid)','EXECUTE')
    or has_function_privilege('anon','public.review_immo_agent_application(uuid,text,text)','EXECUTE')
    or has_function_privilege('anon','public.submit_immo_construction_brief(uuid)','EXECUTE') then
    raise exception 'A privileged JDV Immo workflow function is executable by anon';
  end if;
  if not has_function_privilege('authenticated','public.submit_immo_mandate(uuid)','EXECUTE')
    or not has_function_privilege('authenticated','public.accept_immo_mandate(uuid)','EXECUTE')
    or not has_function_privilege('authenticated','public.review_immo_agent_application(uuid,text,text)','EXECUTE')
    or not has_function_privilege('authenticated','public.submit_immo_construction_brief(uuid)','EXECUTE') then
    raise exception 'Authenticated users must have execute rights to participant workflows';
  end if;
end $$;
