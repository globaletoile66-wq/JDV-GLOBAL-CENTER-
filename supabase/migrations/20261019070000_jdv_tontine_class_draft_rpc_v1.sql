-- Bind the six configured classes to draft tontines through an authenticated owner-only RPC.
create or replace function public.tontine_set_class_draft(p_tontine_id uuid, p_tontine_class text)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
  v_user uuid := auth.uid();
  v_tontine public.tontines%rowtype;
begin
  if v_user is null then raise exception 'AUTH_REQUIRED'; end if;
  if not exists (select 1 from public.tontine_classes c where c.code = p_tontine_class and c.is_active) then
    raise exception 'INVALID_TONTINE_CLASS';
  end if;
  select * into v_tontine from public.tontines t where t.id = p_tontine_id for update;
  if not found then raise exception 'TONTINE_NOT_FOUND'; end if;
  if v_tontine.created_by <> v_user then raise exception 'TONTINE_OWNER_REQUIRED'; end if;
  if v_tontine.status <> 'draft' then raise exception 'TONTINE_MUST_BE_DRAFT'; end if;
  update public.tontines set tontine_class = p_tontine_class, updated_at = now() where id = p_tontine_id;
  insert into public.audit_logs(user_id, organization_id, module_code, action, entity_type, entity_id, new_data)
  values(v_user, v_tontine.organization_id, 'jdv_tontine', 'set_tontine_class', 'tontine', p_tontine_id::text,
    jsonb_build_object('tontine_class', p_tontine_class));
  return jsonb_build_object('id', p_tontine_id, 'tontine_class', p_tontine_class);
end;
$$;
revoke all on function public.tontine_set_class_draft(uuid,text) from public, anon;
grant execute on function public.tontine_set_class_draft(uuid,text) to authenticated;
