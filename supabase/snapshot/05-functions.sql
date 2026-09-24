-- LIVE SUPABASE PUBLIC FUNCTION/RPC DEFINITIONS
-- Schema only; no table data intentionally exported.

CREATE OR REPLACE FUNCTION public._dump_prefix_ddl(p_prefix text)
 RETURNS text
 LANGUAGE plpgsql
AS $function$
DECLARE
  v_out text := '';
  r record;
  v_cols text;
BEGIN
  FOR r IN
    SELECT t.typname,
      string_agg(quote_literal(e.enumlabel), ',' ORDER BY e.enumsortorder) AS labels
    FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid
    WHERE t.typname LIKE p_prefix || '%'
    GROUP BY t.typname
    ORDER BY t.typname
  LOOP
    v_out := v_out || format(E'DO $do$ BEGIN\n  CREATE TYPE public.%I AS ENUM (%s);\nEXCEPTION WHEN duplicate_object THEN NULL; END $do$;\n\n', r.typname, r.labels);
  END LOOP;

  FOR r IN
    SELECT c.relname FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
    WHERE n.nspname='public' AND c.relkind='r' AND c.relname LIKE p_prefix || '%'
    ORDER BY c.relname
  LOOP
    SELECT string_agg(
      format('  %I %s%s%s',
        col.column_name,
        CASE WHEN col.data_type='USER-DEFINED' THEN col.udt_name
             WHEN col.data_type='ARRAY' THEN (SELECT format_type(a.atttypid, a.atttypmod) FROM pg_attribute a WHERE a.attrelid = (quote_ident('public')||'.'||quote_ident(r.relname))::regclass AND a.attname=col.column_name)
             ELSE col.data_type END
        || CASE WHEN col.character_maximum_length IS NOT NULL THEN '('||col.character_maximum_length||')' ELSE '' END,
        CASE WHEN col.is_nullable='NO' THEN ' NOT NULL' ELSE '' END,
        CASE WHEN col.column_default IS NOT NULL THEN ' DEFAULT ' || col.column_default ELSE '' END
      ), E',\n' ORDER BY col.ordinal_position
    ) INTO v_cols
    FROM information_schema.columns col
    WHERE col.table_schema='public' AND col.table_name = r.relname;

    v_out := v_out || format(E'CREATE TABLE IF NOT EXISTS public.%I (\n%s\n);\n\n', r.relname, v_cols);
  END LOOP;

  FOR r IN
    SELECT conrelid::regclass::text AS tbl, conname, pg_get_constraintdef(oid) AS def
    FROM pg_constraint
    WHERE connamespace = 'public'::regnamespace
      AND conrelid::regclass::text LIKE p_prefix || '%'
      AND contype IN ('p','u','c')
    ORDER BY conrelid::regclass::text, conname
  LOOP
    v_out := v_out || format(E'ALTER TABLE %s ADD CONSTRAINT %I %s;\n', r.tbl, r.conname, r.def);
  END LOOP;
  v_out := v_out || E'\n';

  FOR r IN
    SELECT conrelid::regclass::text AS tbl, conname, pg_get_constraintdef(oid) AS def
    FROM pg_constraint
    WHERE connamespace = 'public'::regnamespace
      AND conrelid::regclass::text LIKE p_prefix || '%'
      AND contype = 'f'
    ORDER BY conrelid::regclass::text, conname
  LOOP
    v_out := v_out || format(E'ALTER TABLE %s ADD CONSTRAINT %I %s;\n', r.tbl, r.conname, r.def);
  END LOOP;
  v_out := v_out || E'\n';

  FOR r IN
    SELECT indexdef FROM pg_indexes
    WHERE schemaname='public' AND tablename LIKE p_prefix || '%'
      AND indexname NOT IN (SELECT conname FROM pg_constraint WHERE contype IN ('p','u'))
    ORDER BY indexname
  LOOP
    v_out := v_out || r.indexdef || E';\n';
  END LOOP;
  v_out := v_out || E'\n';

  FOR r IN
    SELECT pg_get_triggerdef(t.oid) AS def
    FROM pg_trigger t JOIN pg_class c ON c.oid = t.tgrelid
    WHERE c.relname LIKE p_prefix || '%' AND NOT t.tgisinternal
    ORDER BY c.relname, t.tgname
  LOOP
    v_out := v_out || r.def || E';\n';
  END LOOP;
  v_out := v_out || E'\n';

  FOR r IN
    SELECT pg_get_functiondef(p.oid) AS def
    FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
    WHERE n.nspname='public' AND p.proname LIKE p_prefix || '%'
    ORDER BY p.proname
  LOOP
    v_out := v_out || r.def || E';\n\n';
  END LOOP;

  FOR r IN
    SELECT c.relname FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
    WHERE n.nspname='public' AND c.relkind='r' AND c.relname LIKE p_prefix || '%' AND c.relrowsecurity
    ORDER BY c.relname
  LOOP
    v_out := v_out || format(E'ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;\n', r.relname);
  END LOOP;
  v_out := v_out || E'\n';

  FOR r IN
    SELECT tablename, policyname, cmd, qual, with_check
    FROM pg_policies WHERE schemaname='public' AND tablename LIKE p_prefix || '%'
    ORDER BY tablename, policyname
  LOOP
    v_out := v_out || format('CREATE POLICY %I ON public.%I FOR %s',
      r.policyname, r.tablename,
      CASE r.cmd WHEN '*' THEN 'ALL' ELSE r.cmd END);
    IF r.qual IS NOT NULL THEN v_out := v_out || format(E'\n  USING (%s)', r.qual); END IF;
    IF r.with_check IS NOT NULL THEN v_out := v_out || format(E'\n  WITH CHECK (%s)', r.with_check); END IF;
    v_out := v_out || E';\n';
  END LOOP;

  RETURN v_out;
END;
$function$


CREATE OR REPLACE FUNCTION public.ai_add_message(p_conversation_id uuid, p_role text, p_content text, p_provider text DEFAULT NULL::text, p_model text DEFAULT NULL::text, p_token_input integer DEFAULT NULL::integer, p_token_output integer DEFAULT NULL::integer, p_metadata jsonb DEFAULT '{}'::jsonb)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare v_id uuid; v_owner uuid;
begin
 if auth.uid() is null then raise exception 'Authentification requise'; end if;
 select user_id into v_owner from public.ai_conversations where id=p_conversation_id for update;
 if v_owner is null then raise exception 'Conversation introuvable'; end if;
 if v_owner<>auth.uid() and not public.is_super_admin() then raise exception 'Accès refusé'; end if;
 if p_role not in ('system','user','assistant','tool') then raise exception 'Rôle de message invalide'; end if;
 if nullif(trim(p_content),'') is null then raise exception 'Contenu obligatoire'; end if;
 insert into public.ai_messages(conversation_id,user_id,role,content,provider,model,token_input,token_output,metadata)
 values(p_conversation_id, v_owner,p_role,p_content,p_provider,p_model,p_token_input,p_token_output,coalesce(p_metadata,'{}'::jsonb)) returning id into v_id;
 update public.ai_conversations set updated_at=now() where id=p_conversation_id;
 return v_id;
end $function$


CREATE OR REPLACE FUNCTION public.ai_admin_dashboard(p_organization_id uuid DEFAULT NULL::uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare v_uid uuid:=auth.uid(); v_org uuid:=p_organization_id; v_policy jsonb; v_usage jsonb; v_models jsonb; v_logs jsonb;
begin
 if v_uid is null then raise exception 'Authentification requise'; end if;
 if not public.is_super_admin() then raise exception 'Accès Super Admin requis'; end if;
 if v_org is null then
   select organization_id into v_org from public.organizations where owner_id=v_uid order by created_at limit 1;
 end if;
 if v_org is null then
   return jsonb_build_object('organization_id',null,'policy',null,'usage',jsonb_build_object('monthly_tokens',0,'monthly_cost',0,'requests',0),'models',jsonb_build_array(),'recent_access',jsonb_build_array());
 end if;
 select to_jsonb(x) into v_policy from (select organization_id,monthly_token_limit,monthly_cost_limit,default_model,allowed_models,is_enabled from public.ai_org_policies where organization_id=v_org) x;
 select jsonb_build_object('monthly_tokens',coalesce(sum(tokens_input+tokens_output),0),'monthly_cost',coalesce(sum(estimated_cost),0),'requests',count(*)) into v_usage from public.ai_usage where organization_id=v_org and created_at>=date_trunc('month',now());
 select coalesce(jsonb_agg(to_jsonb(x) order by x.created_at desc),'[]'::jsonb) into v_models from (select provider,model,tokens_input,tokens_output,estimated_cost,created_at from public.ai_usage where organization_id=v_org order by created_at desc limit 20) x;
 select coalesce(jsonb_agg(to_jsonb(x) order by x.created_at desc),'[]'::jsonb) into v_logs from (select user_id,conversation_id,action_type,scope,result_count,success,created_at from public.ai_access_log where organization_id=v_org order by created_at desc limit 50) x;
 return jsonb_build_object('organization_id',v_org,'policy',coalesce(v_policy,'{}'::jsonb),'usage',v_usage,'recent_usage',v_models,'recent_access',v_logs);
end $function$


CREATE OR REPLACE FUNCTION public.ai_admin_provider_disable(p_provider text, p_model text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
begin
 if auth.uid() is null then raise exception 'Authentification requise'; end if;
 if not public.is_super_admin() then raise exception 'Accès Super Admin requis'; end if;
 update public.ai_model_catalog set is_enabled=false,updated_at=now() where provider=trim(p_provider) and model=trim(p_model);
 return found;
end $function$


CREATE OR REPLACE FUNCTION public.ai_admin_provider_upsert(p_provider text, p_model text, p_display_name text DEFAULT NULL::text, p_input_cost numeric DEFAULT 0, p_output_cost numeric DEFAULT 0, p_is_enabled boolean DEFAULT true)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare v_id uuid;
begin
 if auth.uid() is null then raise exception 'Authentification requise'; end if;
 if not public.is_super_admin() then raise exception 'Accès Super Admin requis'; end if;
 if nullif(trim(p_provider),'') is null or nullif(trim(p_model),'') is null then raise exception 'Fournisseur et modèle obligatoires'; end if;
 if p_input_cost < 0 or p_output_cost < 0 then raise exception 'Tarifs invalides'; end if;
 insert into public.ai_model_catalog(provider,model,display_name,input_cost_per_1m_tokens,output_cost_per_1m_tokens,is_enabled)
 values(trim(p_provider),trim(p_model),nullif(trim(p_display_name),''),p_input_cost,p_output_cost,p_is_enabled)
 on conflict(provider,model) do update set display_name=excluded.display_name,input_cost_per_1m_tokens=excluded.input_cost_per_1m_tokens,output_cost_per_1m_tokens=excluded.output_cost_per_1m_tokens,is_enabled=excluded.is_enabled,updated_at=now()
 returning id into v_id;
 return v_id;
end $function$


CREATE OR REPLACE FUNCTION public.ai_check_rate_limit(p_max_requests integer DEFAULT 30, p_window_seconds integer DEFAULT 60)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare v_uid uuid:=auth.uid(); v_count integer; v_allowed boolean;
begin
 if v_uid is null then raise exception 'Authentification requise'; end if;
 if p_max_requests < 1 or p_window_seconds < 1 then raise exception 'Paramètres de limite invalides'; end if;
 select count(*) into v_count from public.ai_access_log
 where user_id=v_uid and action_type='message'
 and created_at >= now() - make_interval(secs => p_window_seconds);
 v_allowed := v_count < p_max_requests;
 return jsonb_build_object('allowed',v_allowed,'requests_used',v_count,'requests_limit',p_max_requests,'window_seconds',p_window_seconds,'checked_at',now());
end $function$


CREATE OR REPLACE FUNCTION public.ai_create_conversation(p_title text DEFAULT NULL::text, p_organization_id uuid DEFAULT NULL::uuid, p_context jsonb DEFAULT '{}'::jsonb)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare v_id uuid;
begin
 if auth.uid() is null then raise exception 'Authentification requise'; end if;
 if p_organization_id is not null and not (public.is_super_admin() or public.is_org_admin(p_organization_id)) then raise exception 'Accès organisation refusé'; end if;
 insert into public.ai_conversations(user_id,organization_id,title,context) values(auth.uid(),p_organization_id,nullif(trim(p_title),''),coalesce(p_context,'{}'::jsonb)) returning id into v_id;
 return v_id;
end $function$


CREATE OR REPLACE FUNCTION public.ai_estimate_cost(p_provider text, p_model text, p_tokens_input bigint, p_tokens_output bigint)
 RETURNS numeric
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
 select round((greatest(p_tokens_input,0)::numeric/1000000)*coalesce(c.input_cost_per_1m_tokens,0)+(greatest(p_tokens_output,0)::numeric/1000000)*coalesce(c.output_cost_per_1m_tokens,0),6)
 from (select 1) s left join public.ai_model_catalog c on c.provider=p_provider and c.model=p_model
 where auth.uid() is not null;
$function$


CREATE OR REPLACE FUNCTION public.ai_get_allowed_models(p_organization_id uuid DEFAULT NULL::uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare v_uid uuid:=auth.uid(); v_org uuid:=p_organization_id; v_default text; v_allowed text[]; v_enabled boolean;
begin
 if v_uid is null then raise exception 'Authentification requise'; end if;
 if v_org is null then select organization_id into v_org from public.organization_members where user_id=v_uid and member_status='active' limit 1; end if;
 if v_org is not null and not(public.is_super_admin() or public.is_org_admin(v_org)) then raise exception 'Accès organisation non autorisé'; end if;
 select default_model,allowed_models,is_enabled into v_default,v_allowed,v_enabled from public.ai_org_policies where organization_id=v_org;
 return jsonb_build_object('organization_id',v_org,'enabled',coalesce(v_enabled,true),'default_model',coalesce(v_default,'gpt-4o-mini'),'allowed_models',coalesce(to_jsonb(v_allowed),'[]'::jsonb),'catalog',coalesce((select jsonb_agg(to_jsonb(x) order by x.provider,x.model) from (select provider,model,display_name,input_cost_per_1m_tokens,output_cost_per_1m_tokens from public.ai_model_catalog where is_enabled) x),'[]'::jsonb));
end $function$


CREATE OR REPLACE FUNCTION public.ai_get_context()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare v_uid uuid:=auth.uid(); v_super boolean; v_result jsonb;
begin
 if v_uid is null then raise exception 'Authentification requise'; end if;
 v_super:=public.is_super_admin();
 select jsonb_build_object(
  'user', jsonb_build_object('id',v_uid),
  'super_admin',v_super,
  'organizations',coalesce((select jsonb_agg(jsonb_build_object('id',o.id,'name',o.name,'type',o.org_type,'status',o.org_status)) from public.organizations o join public.organization_members om on om.organization_id=o.id where om.user_id=v_uid and om.member_status='active'),'[]'::jsonb),
  'businesses',coalesce((select jsonb_agg(jsonb_build_object('id',b.id,'name',b.name,'status',b.business_status)) from public.business_profiles b where b.owner_user_id=v_uid or public.is_org_admin(b.organization_id)),'[]'::jsonb),
  'counts',jsonb_build_object(
    'business_clients',(select count(*) from public.business_clients c where c.user_id=v_uid or public.is_org_admin(c.business_id)),
    'business_products',(select count(*) from public.business_products p where public.is_org_admin(p.business_id)),
    'business_sales',(select count(*) from public.business_sales s where public.is_org_admin(s.business_id)),
    'crm_prospects',(select count(*) from public.crm_prospects p where p.user_id=v_uid or public.is_org_admin(p.business_id)),
    'wallets',(select count(*) from public.wallets w where w.user_id=v_uid or public.is_super_admin()),
    'health_appointments',(select count(*) from public.health_appointments a where a.patient_user_id=v_uid or public.is_org_admin(a.business_id)),
    'immo_properties',(select count(*) from public.immo_properties p where p.owner_user_id=v_uid or public.is_org_admin(p.business_id)),
    'travel_bookings',(select count(*) from public.travel_bookings b where b.buyer_user_id=v_uid or public.is_org_admin(b.business_id)),
    'transport_bookings',(select count(*) from public.transport_bookings b where b.passenger_user_id=v_uid or public.is_org_admin(b.business_id))
  )
 ) into v_result;
 return v_result;
end $function$


CREATE OR REPLACE FUNCTION public.ai_get_policy(p_organization_id uuid DEFAULT NULL::uuid, p_model text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare v_uid uuid:=auth.uid(); v_org uuid:=p_organization_id; v_limit bigint:=1000000; v_cost numeric:=100; v_model text:=coalesce(nullif(trim(p_model),''),'gpt-4o-mini'); v_default text:='gpt-4o-mini'; v_allowed text[]:=array['gpt-4o-mini']::text[]; v_enabled boolean:=true; v_used bigint:=0; v_cost_used numeric:=0;
begin
 if v_uid is null then raise exception 'Authentification requise'; end if;
 if v_org is null then select organization_id into v_org from public.ai_conversations where user_id=v_uid and organization_id is not null order by updated_at desc limit 1; end if;
 if v_org is null then select organization_id into v_org from public.organization_members where user_id=v_uid and member_status='active' limit 1; end if;
 if v_org is null and not public.is_super_admin() then raise exception 'Organisation requise'; end if;
 if v_org is not null and not (public.is_super_admin() or public.is_org_admin(v_org)) then raise exception 'Accès organisation non autorisé'; end if;
 if v_org is not null then
   select monthly_token_limit,monthly_cost_limit,default_model,allowed_models,is_enabled into v_limit,v_cost,v_default,v_allowed,v_enabled from public.ai_org_policies where organization_id=v_org;
   v_limit:=coalesce(v_limit,1000000); v_cost:=coalesce(v_cost,100); v_default:=coalesce(v_default,'gpt-4o-mini'); v_allowed:=coalesce(v_allowed,array['gpt-4o-mini']::text[]); v_enabled:=coalesce(v_enabled,true);
   select coalesce(sum(tokens_input+tokens_output),0),coalesce(sum(estimated_cost),0) into v_used,v_cost_used from public.ai_usage where organization_id=v_org and created_at>=date_trunc('month',now());
 end if;
 return jsonb_build_object('organization_id',v_org,'enabled',v_enabled,'requested_model',v_model,'default_model',v_default,'model_allowed',v_model=any(v_allowed),'allowed_models',to_jsonb(v_allowed),'monthly_token_limit',v_limit,'monthly_tokens_used',v_used,'monthly_tokens_remaining',greatest(v_limit-v_used,0),'monthly_cost_limit',v_cost,'monthly_cost_used',v_cost_used,'monthly_cost_remaining',greatest(v_cost-v_cost_used,0),'within_quota',v_used<v_limit and v_cost_used<v_cost);
end $function$


CREATE OR REPLACE FUNCTION public.ai_get_security_status()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare v_uid uuid:=auth.uid(); v_rls integer; v_total integer; v_public_exec integer; v_anon_exec integer;
begin
 if v_uid is null or not public.is_super_admin() then raise exception 'Accès Super Admin requis'; end if;
 select count(*) filter(where c.relrowsecurity),count(*) into v_rls,v_total
 from pg_class c join pg_namespace n on n.oid=c.relnamespace
 where n.nspname='public' and c.relkind='r' and c.relname like 'ai_%';
 select count(*) into v_public_exec from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname like 'ai_%' and has_function_privilege('public',p.oid,'EXECUTE');
 select count(*) into v_anon_exec from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname like 'ai_%' and has_function_privilege('anon',p.oid,'EXECUTE');
 return jsonb_build_object('ai_tables_rls',v_rls,'ai_tables_total',v_total,'ai_public_execute_functions',v_public_exec,'ai_anon_execute_functions',v_anon_exec,'checked_at',now());
end $function$


CREATE OR REPLACE FUNCTION public.ai_log_access(p_action_type text, p_scope text DEFAULT NULL::text, p_organization_id uuid DEFAULT NULL::uuid, p_conversation_id uuid DEFAULT NULL::uuid, p_result_count integer DEFAULT NULL::integer, p_success boolean DEFAULT true)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare v_id uuid;
begin
 if auth.uid() is null then raise exception 'Authentification requise'; end if;
 if p_action_type not in ('context','query','message','usage') then raise exception 'Action IA non autorisée'; end if;
 if p_result_count is not null and p_result_count < 0 then raise exception 'result_count invalide'; end if;
 insert into public.ai_access_log(user_id,organization_id,conversation_id,action_type,scope,result_count,success)
 values(auth.uid(),p_organization_id,p_conversation_id,p_action_type,p_scope,p_result_count,coalesce(p_success,true))
 returning id into v_id;
 return v_id;
end $function$


CREATE OR REPLACE FUNCTION public.ai_query_business(p_scope text, p_query text DEFAULT NULL::text, p_limit integer DEFAULT 20)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare v_uid uuid:=auth.uid(); v_limit integer:=least(greatest(coalesce(p_limit,20),1),50); v_q text:=nullif(trim(coalesce(p_query,'')),''); v_result jsonb;
begin
 if v_uid is null then raise exception 'Authentification requise'; end if;
 if lower(coalesce(p_scope,'')) not in ('clients','products','sales','prospects','wallets') then raise exception 'Scope IA non autorisé'; end if;
 if lower(p_scope)='clients' then
   select coalesce(jsonb_agg(to_jsonb(x)), '[]'::jsonb) into v_result from (
     select c.id,c.business_id,c.first_name,c.last_name,c.company_name,c.city,c.phone,c.email,c.is_active,c.created_at
     from public.business_clients c
     where (c.user_id=v_uid or public.is_org_admin(c.business_id))
       and (v_q is null or concat_ws(' ',c.first_name,c.last_name,c.company_name,c.city,c.phone,c.email) ilike '%'||v_q||'%')
     order by c.created_at desc limit v_limit) x;
 elsif lower(p_scope)='products' then
   select coalesce(jsonb_agg(to_jsonb(x)), '[]'::jsonb) into v_result from (
     select p.id,p.business_id,p.code,p.name,p.unit,p.price,p.cost_price,p.stock_quantity,p.min_stock_alert,p.is_active,p.is_service
     from public.business_products p
     where public.is_org_admin(p.business_id)
       and (v_q is null or concat_ws(' ',p.code,p.name,p.description) ilike '%'||v_q||'%')
     order by p.created_at desc limit v_limit) x;
 elsif lower(p_scope)='sales' then
   select coalesce(jsonb_agg(to_jsonb(x)), '[]'::jsonb) into v_result from (
     select s.id,s.business_id,s.sale_number,s.sale_status,s.subtotal,s.discount_amount,s.tax_amount,s.total_amount,s.amount_paid,s.payment_method,s.sale_date
     from public.business_sales s
     where public.is_org_admin(s.business_id)
       and (v_q is null or concat_ws(' ',s.sale_number,s.sale_status,s.payment_method) ilike '%'||v_q||'%')
     order by s.sale_date desc nulls last limit v_limit) x;
 elsif lower(p_scope)='prospects' then
   select coalesce(jsonb_agg(to_jsonb(x)), '[]'::jsonb) into v_result from (
     select p.id,p.business_id,p.first_name,p.last_name,p.phone,p.email,p.city,p.desired_product,p.requested_amount,p.temperature,p.prospect_status,p.last_contact_at,p.next_follow_up_at,p.created_at
     from public.crm_prospects p
     where (p.created_by=v_uid or public.is_org_admin(p.business_id))
       and (v_q is null or concat_ws(' ',p.first_name,p.last_name,p.phone,p.email,p.city,p.desired_product,p.desired_product_code) ilike '%'||v_q||'%')
     order by p.created_at desc limit v_limit) x;
 else
   select coalesce(jsonb_agg(to_jsonb(x)), '[]'::jsonb) into v_result from (
     select w.id,w.organization_id,w.currency_id,w.balance,w.available_balance,w.pending_balance,w.wallet_status,w.created_at
     from public.wallets w
     where w.user_id=v_uid or public.is_super_admin()
     order by w.created_at desc limit v_limit) x;
 end if;
 return jsonb_build_object('scope',lower(p_scope),'query',v_q,'count',jsonb_array_length(v_result),'data',v_result);
end $function$


CREATE OR REPLACE FUNCTION public.ai_record_usage(p_provider text, p_model text DEFAULT NULL::text, p_tokens_input bigint DEFAULT 0, p_tokens_output bigint DEFAULT 0, p_estimated_cost numeric DEFAULT 0, p_currency_id uuid DEFAULT NULL::uuid, p_conversation_id uuid DEFAULT NULL::uuid, p_organization_id uuid DEFAULT NULL::uuid, p_request_reference text DEFAULT NULL::text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare v_uid uuid:=auth.uid(); v_org uuid:=p_organization_id; v_conv_uid uuid; v_conv_org uuid;
v_id uuid; v_catalog public.ai_model_catalog; v_cost numeric;
begin
  if v_uid is null then raise exception 'Authentification requise'; end if;
  if p_tokens_input is null or p_tokens_input<0 or p_tokens_output is null or p_tokens_output<0 then raise exception 'Tokens invalides'; end if;
  if p_conversation_id is not null then
    select user_id,organization_id into v_conv_uid,v_conv_org from public.ai_conversations where id=p_conversation_id;
    if v_conv_uid is null then raise exception 'Conversation introuvable'; end if;
    if v_conv_uid<>v_uid and not public.is_super_admin() then raise exception 'Accès conversation non autorisé'; end if;
    v_org:=coalesce(v_conv_org,v_org);
  end if;
  if v_org is not null and not(public.is_super_admin() or public.is_org_admin(v_org)) then raise exception 'Accès organisation non autorisé'; end if;
  select * into v_catalog from public.ai_model_catalog where provider=trim(p_provider) and model=trim(p_model) and is_enabled=true limit 1;
  if not found then raise exception 'Fournisseur ou modèle IA non autorisé'; end if;
  v_cost:=round((greatest(p_tokens_input,0)::numeric/1000000)*coalesce(v_catalog.input_cost_per_1m_tokens,0)+(greatest(p_tokens_output,0)::numeric/1000000)*coalesce(v_catalog.output_cost_per_1m_tokens,0),6);
  insert into public.ai_usage(user_id,organization_id,conversation_id,provider,model,tokens_input,tokens_output,estimated_cost,currency_id,request_reference)
  values(v_uid,v_org,p_conversation_id,trim(p_provider),trim(p_model),p_tokens_input,p_tokens_output,v_cost,p_currency_id,p_request_reference)
  returning id into v_id;
  return v_id;
end;
$function$


CREATE OR REPLACE FUNCTION public.business_register_company(p_name text, p_trade_name text DEFAULT NULL::text, p_category_id uuid DEFAULT NULL::uuid, p_country_id uuid DEFAULT NULL::uuid, p_currency_id uuid DEFAULT NULL::uuid, p_phone text DEFAULT NULL::text, p_email text DEFAULT NULL::text, p_website text DEFAULT NULL::text, p_address text DEFAULT NULL::text, p_city text DEFAULT NULL::text, p_description text DEFAULT NULL::text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare
  v_uid uuid := auth.uid();
  v_org_id uuid;
  v_business_id uuid;
  v_slug text;
  v_base_slug text;
begin
  if v_uid is null then
    raise exception 'AUTH_REQUIRED';
  end if;
  if nullif(trim(p_name),'') is null then
    raise exception 'BUSINESS_NAME_REQUIRED';
  end if;

  select id into v_org_id
  from public.organizations
  where owner_id = v_uid
  order by created_at desc
  limit 1;

  if v_org_id is null then
    v_base_slug := regexp_replace(lower(trim(p_name)), '[^a-z0-9]+', '-', 'g');
    v_base_slug := trim(both '-' from v_base_slug);
    if v_base_slug = '' then v_base_slug := 'entreprise'; end if;
    v_slug := v_base_slug;
    if exists (select 1 from public.organizations where slug = v_slug) then
      v_slug := v_base_slug || '-' || substr(replace(gen_random_uuid()::text,'-',''),1,8);
    end if;

    insert into public.organizations(name, legal_name, slug, country_id, default_currency_id, org_type, org_status, owner_id)
    values(trim(p_name), nullif(trim(p_name),''), v_slug, p_country_id, p_currency_id, 'company', 'active', v_uid)
    returning id into v_org_id;

    insert into public.organization_members(organization_id,user_id,role_id,member_status)
    values(
      v_org_id,
      v_uid,
      (select id from public.roles where code='owner' limit 1),
      'active'
    );
  else
    if not exists (
      select 1 from public.organization_members
      where organization_id=v_org_id and user_id=v_uid and member_status='active'
    ) then
      insert into public.organization_members(organization_id,user_id,role_id,member_status)
      values(v_org_id,v_uid,(select id from public.roles where code='owner' limit 1),'active');
    end if;
  end if;

  select id into v_business_id
  from public.business_profiles
  where organization_id=v_org_id
  limit 1;

  if v_business_id is null then
    insert into public.business_profiles(
      organization_id, owner_user_id, category_id, country_id, currency_id,
      name, trade_name, description, phone, email, website, address, city,
      business_status, is_public, accepts_online_payment
    )
    values(
      v_org_id, v_uid, p_category_id, p_country_id, p_currency_id,
      trim(p_name), nullif(trim(p_trade_name),''), nullif(trim(p_description),''),
      nullif(trim(p_phone),''), nullif(trim(p_email),''),
      nullif(trim(p_website),''), nullif(trim(p_address),''), nullif(trim(p_city),''),
      'draft', false, false
    )
    returning id into v_business_id;
  else
    update public.business_profiles
      set name=trim(p_name),
          trade_name=nullif(trim(p_trade_name),''),
          category_id=coalesce(p_category_id,category_id),
          country_id=coalesce(p_country_id,country_id),
          currency_id=coalesce(p_currency_id,currency_id),
          description=coalesce(nullif(trim(p_description),''),description),
          phone=coalesce(nullif(trim(p_phone),''),phone),
          email=coalesce(nullif(trim(p_email),''),email),
          website=coalesce(nullif(trim(p_website),''),website),
          address=coalesce(nullif(trim(p_address),''),address),
          city=coalesce(nullif(trim(p_city),''),city),
          updated_at=now()
    where id=v_business_id and owner_user_id=v_uid;
  end if;

  insert into public.business_members(business_id,user_id,role,is_active)
  values(v_business_id,v_uid,'OWNER',true)
  on conflict (business_id,user_id) do update set role='OWNER',is_active=true;

  return v_business_id;
end;
$function$


CREATE OR REPLACE FUNCTION public.crm_calculate_commission(p_sale_id uuid, p_prospecteur_id uuid)
 RETURNS crm_commissions
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare
  v_sale public.business_sales;
  v_rule public.crm_commission_rules;
  v_amount numeric;
  v_commission public.crm_commissions;
  v_prospecteur public.crm_prospecteurs;
  v_privileged boolean;
begin
  if auth.uid() is null then raise exception 'Authentification requise'; end if;

  select * into v_sale from public.business_sales where id=p_sale_id;
  if not found then raise exception 'Vente introuvable'; end if;

  v_privileged := public.crm_is_business_privileged(v_sale.business_id)
                  or public.is_super_admin();

  if not v_privileged then
    select * into v_prospecteur
    from public.crm_prospecteurs
    where id=p_prospecteur_id
      and business_id=v_sale.business_id
      and user_id=auth.uid()
      and prospecteur_status='active';

    if not found then
      raise exception 'Prospecteur non autorisé pour cette commission';
    end if;
  else
    select * into v_prospecteur
    from public.crm_prospecteurs
    where id=p_prospecteur_id
      and business_id=v_sale.business_id
      and prospecteur_status='active';
    if not found then raise exception 'Prospecteur invalide ou hors entreprise'; end if;
  end if;

  select * into v_commission
  from public.crm_commissions
  where sale_id=p_sale_id and prospecteur_id=p_prospecteur_id;
  if found then return v_commission; end if;

  select * into v_rule
  from public.crm_commission_rules
  where business_id=v_sale.business_id
    and is_active=true
    and (prospecteur_id is null or prospecteur_id=p_prospecteur_id)
  order by priority desc, (prospecteur_id is not null) desc
  limit 1;

  if not found then return null; end if;

  v_amount := case v_rule.commission_basis
    when 'sale_amount' then coalesce(v_sale.total_amount,0)*coalesce(v_rule.percentage,0)/100
    when 'fixed' then coalesce(v_rule.fixed_amount,0)
    else 0
  end;

  if v_amount < 0 then raise exception 'Commission négative interdite'; end if;

  insert into public.crm_commissions
    (business_id,prospecteur_id,sale_id,rule_id,amount,currency_id)
  values
    (v_sale.business_id,p_prospecteur_id,p_sale_id,v_rule.id,v_amount,v_sale.currency_id)
  on conflict (sale_id,prospecteur_id) where sale_id is not null do nothing
  returning * into v_commission;

  if v_commission is null then
    select * into v_commission from public.crm_commissions
    where sale_id=p_sale_id and prospecteur_id=p_prospecteur_id;
  end if;

  return v_commission;
end;
$function$


CREATE OR REPLACE FUNCTION public.crm_convert_prospect_to_client(p_prospect_id uuid)
 RETURNS business_clients
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare
  v_prospect public.crm_prospects;
  v_client public.business_clients;
  v_allowed boolean;
begin
  if auth.uid() is null then raise exception 'Authentification requise'; end if;

  select * into v_prospect
  from public.crm_prospects
  where id=p_prospect_id
  for update;

  if not found then raise exception 'Prospect introuvable'; end if;

  v_allowed := public.crm_is_business_privileged(v_prospect.business_id)
               or public.is_super_admin()
               or public.crm_prospect_is_mine(v_prospect.assigned_prospecteur_id);

  if not v_allowed then raise exception 'Accès refusé'; end if;

  if v_prospect.converted_client_id is not null then
    select * into v_client from public.business_clients
    where id=v_prospect.converted_client_id;
    return v_client;
  end if;

  select * into v_client
  from public.business_clients
  where business_id=v_prospect.business_id
    and (
      (v_prospect.phone is not null and phone=v_prospect.phone)
      or (v_prospect.email is not null and email=v_prospect.email)
    )
  limit 1;

  if not found then
    insert into public.business_clients
      (business_id,first_name,last_name,email,phone,address,city,country_id,notes)
    values
      (v_prospect.business_id,v_prospect.first_name,v_prospect.last_name,
       v_prospect.email,v_prospect.phone,v_prospect.address,v_prospect.city,
       v_prospect.country_id,'Converti depuis JDV CRM (prospect)')
    returning * into v_client;
  end if;

  update public.crm_prospects
  set prospect_status='converted',
      converted_client_id=v_client.id,
      converted_at=now()
  where id=p_prospect_id;

  insert into public.audit_logs
    (user_id,module_code,action,entity_type,entity_id,new_data)
  values
    (auth.uid(),'crm','prospect.converted','crm_prospects',p_prospect_id::text,
     jsonb_build_object('client_id',v_client.id));

  return v_client;
end;
$function$


CREATE OR REPLACE FUNCTION public.crm_fill_schedule_business_id()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  IF NEW.business_id IS NULL THEN
    SELECT business_id INTO NEW.business_id FROM public.crm_credit_terms WHERE id = NEW.credit_term_id;
  END IF;
  RETURN NEW;
END;
$function$


CREATE OR REPLACE FUNCTION public.crm_is_business_privileged(p_business_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.business_members bm
    WHERE bm.business_id = p_business_id
      AND bm.user_id = auth.uid()
      AND bm.is_active = true
      AND bm.role IN ('OWNER','ADMIN','MANAGER','ACCOUNTANT')
  ) OR public.is_super_admin();
$function$


CREATE OR REPLACE FUNCTION public.crm_prospect_is_mine(p_prospecteur_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.crm_prospecteurs p
    WHERE p.id = p_prospecteur_id AND p.user_id = auth.uid()
  );
$function$


CREATE OR REPLACE FUNCTION public.crm_record_payment(p_business_id uuid, p_client_id uuid, p_amount numeric, p_schedule_id uuid DEFAULT NULL::uuid, p_sale_id uuid DEFAULT NULL::uuid, p_currency_id uuid DEFAULT NULL::uuid, p_payment_method text DEFAULT NULL::text, p_jdv_pay_transaction_id uuid DEFAULT NULL::uuid, p_idempotency_key text DEFAULT NULL::text)
 RETURNS crm_payments
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare
  v_payment public.crm_payments;
  v_schedule public.crm_payment_schedules;
  v_sale public.business_sales;
  v_client public.business_clients;
  v_tx public.wallet_transactions;
  v_wallet public.wallets;
  v_new_paid numeric;
  v_currency_id uuid;
begin
  if auth.uid() is null then raise exception 'Authentification requise'; end if;
  if p_amount is null or p_amount <= 0 then raise exception 'Montant de paiement invalide'; end if;
  if not (public.user_has_business_access(p_business_id) or public.is_super_admin()) then
    raise exception 'Accès refusé';
  end if;

  if p_idempotency_key is not null then
    select * into v_payment from public.crm_payments where idempotency_key=p_idempotency_key;
    if found then
      if v_payment.business_id<>p_business_id or v_payment.client_id<>p_client_id then
        raise exception 'Clé d''idempotence déjà utilisée pour une autre opération';
      end if;
      return v_payment;
    end if;
  end if;

  select * into v_client from public.business_clients
  where id=p_client_id and business_id=p_business_id and is_active=true;
  if not found then raise exception 'Client introuvable ou hors entreprise'; end if;

  if p_sale_id is not null then
    select * into v_sale from public.business_sales
    where id=p_sale_id and business_id=p_business_id
      and (client_id is null or client_id=p_client_id);
    if not found then raise exception 'Vente introuvable, hors entreprise ou hors client'; end if;
  end if;

  if p_schedule_id is not null then
    select * into v_schedule from public.crm_payment_schedules
    where id=p_schedule_id and business_id=p_business_id and client_id=p_client_id
      and (p_sale_id is null or sale_id=p_sale_id)
    for update;
    if not found then raise exception 'Échéance introuvable, hors entreprise, hors client ou hors vente'; end if;

    if p_currency_id is not null and v_schedule.currency_id is not null
       and p_currency_id<>v_schedule.currency_id then
      raise exception 'Devise du paiement incompatible avec l''échéance';
    end if;
    if p_sale_id is not null and p_currency_id is not null
       and v_sale.currency_id is not null and p_currency_id<>v_sale.currency_id then
      raise exception 'Devise du paiement incompatible avec la vente';
    end if;
    if v_schedule.amount_paid+p_amount>v_schedule.amount_due then
      raise exception 'Le paiement dépasse le montant restant de l''échéance';
    end if;
    v_currency_id:=coalesce(p_currency_id,v_schedule.currency_id,v_sale.currency_id);
  else
    v_currency_id:=coalesce(p_currency_id,case when p_sale_id is not null then v_sale.currency_id end);
  end if;

  if v_currency_id is null then raise exception 'Devise obligatoire pour ce paiement'; end if;

  if p_jdv_pay_transaction_id is not null then
    if v_client.user_id is null then
      raise exception 'Le client doit être lié à un utilisateur pour un paiement JDV PAY';
    end if;

    select wt.* into v_tx
    from public.wallet_transactions wt
    join public.wallets w on w.id=wt.wallet_id
    where wt.id=p_jdv_pay_transaction_id and w.user_id=v_client.user_id
    for update;

    if not found then raise exception 'Transaction JDV PAY introuvable ou non autorisée'; end if;
    if v_tx.transaction_status<>'completed' then raise exception 'La transaction JDV PAY doit être terminée'; end if;
    if v_tx.transaction_type not in ('withdrawal','payment','transfer_out') then
      raise exception 'La transaction JDV PAY doit être un débit';
    end if;
    if v_tx.amount<>p_amount then raise exception 'Montant JDV PAY différent du paiement CRM'; end if;
    if v_tx.currency_id<>v_currency_id then raise exception 'Devise JDV PAY incompatible avec le paiement CRM'; end if;
    if exists(select 1 from public.crm_payments where jdv_pay_transaction_id=p_jdv_pay_transaction_id) then
      raise exception 'Cette transaction JDV PAY est déjà affectée à un paiement CRM';
    end if;
  end if;

  insert into public.crm_payments(
    business_id,schedule_id,sale_id,client_id,amount,currency_id,
    payment_method,jdv_pay_transaction_id,idempotency_key,recorded_by
  )
  values(
    p_business_id,p_schedule_id,p_sale_id,p_client_id,p_amount,v_currency_id,
    p_payment_method,p_jdv_pay_transaction_id,p_idempotency_key,auth.uid()
  )
  on conflict (idempotency_key) do nothing
  returning * into v_payment;

  if v_payment is null and p_idempotency_key is not null then
    select * into v_payment from public.crm_payments where idempotency_key=p_idempotency_key;
    if not found then raise exception 'Impossible de finaliser le paiement idempotent'; end if;
    return v_payment;
  end if;

  if p_schedule_id is not null then
    v_new_paid:=v_schedule.amount_paid+p_amount;
    update public.crm_payment_schedules
    set amount_paid=v_new_paid,
        remaining_amount=greatest(amount_due-v_new_paid,0),
        schedule_status=case when v_new_paid>=amount_due then 'paid'
                              when v_new_paid>0 then 'partially_paid'
                              else schedule_status end,
        paid_at=case when v_new_paid>=amount_due then now() else paid_at end
    where id=p_schedule_id;
  end if;

  insert into public.audit_logs(user_id,module_code,action,entity_type,entity_id,new_data)
  values(auth.uid(),'crm','payment.recorded','crm_payments',v_payment.id::text,
         jsonb_build_object('business_id',p_business_id,'client_id',p_client_id,
                            'amount',p_amount,'currency_id',v_currency_id,
                            'jdv_pay_transaction_id',p_jdv_pay_transaction_id));
  return v_payment;
end;
$function$


CREATE OR REPLACE FUNCTION public.crm_set_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$


CREATE OR REPLACE FUNCTION public.crm_transfer_stock(p_business_id uuid, p_product_id uuid, p_quantity numeric, p_to_prospecteur_id uuid, p_from_prospecteur_id uuid DEFAULT NULL::uuid, p_reference text DEFAULT NULL::text)
 RETURNS crm_stock_movements
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare
  v_movement public.crm_stock_movements;
  v_from_qty numeric;
begin
  if auth.uid() is null then raise exception 'Authentification requise'; end if;
  if p_quantity is null or p_quantity<=0 then raise exception 'Quantité invalide'; end if;

  if not (public.crm_is_business_privileged(p_business_id) or public.is_super_admin()) then
    raise exception 'Seuls les responsables de l''entreprise peuvent transférer le stock';
  end if;

  if not exists(
    select 1 from public.business_products
    where id=p_product_id and business_id=p_business_id
  ) then raise exception 'Produit introuvable ou hors entreprise'; end if;

  if not exists(
    select 1 from public.crm_prospecteurs
    where id=p_to_prospecteur_id
      and business_id=p_business_id
      and prospecteur_status='active'
  ) then raise exception 'Prospecteur destinataire invalide ou hors entreprise'; end if;

  if p_from_prospecteur_id is not null then
    if not exists(
      select 1 from public.crm_prospecteurs
      where id=p_from_prospecteur_id
        and business_id=p_business_id
        and prospecteur_status='active'
    ) then raise exception 'Prospecteur source invalide ou hors entreprise'; end if;

    select quantity into v_from_qty
    from public.crm_prospecteur_stocks
    where business_id=p_business_id
      and prospecteur_id=p_from_prospecteur_id
      and product_id=p_product_id
    for update;

    if v_from_qty is null or v_from_qty<p_quantity then
      raise exception 'Stock insuffisant pour ce transfert';
    end if;

    update public.crm_prospecteur_stocks
    set quantity=quantity-p_quantity
    where business_id=p_business_id
      and prospecteur_id=p_from_prospecteur_id
      and product_id=p_product_id;
  end if;

  insert into public.crm_prospecteur_stocks
    (business_id,prospecteur_id,product_id,quantity)
  values
    (p_business_id,p_to_prospecteur_id,p_product_id,p_quantity)
  on conflict (business_id,prospecteur_id,product_id)
  do update set quantity=public.crm_prospecteur_stocks.quantity+excluded.quantity,
                updated_at=now();

  insert into public.crm_stock_movements
    (business_id,product_id,movement_type,quantity,from_prospecteur_id,
     to_prospecteur_id,reference,actor_user_id)
  values
    (p_business_id,p_product_id,
     case when p_from_prospecteur_id is null
          then 'reception'::public.crm_stock_movement_type
          else 'transfer'::public.crm_stock_movement_type end,
     p_quantity,p_from_prospecteur_id,p_to_prospecteur_id,p_reference,auth.uid())
  returning * into v_movement;

  return v_movement;
end;
$function$


CREATE OR REPLACE FUNCTION public.export_module_ddl(p_prefix text)
 RETURNS text
 LANGUAGE plpgsql
AS $function$
DECLARE
  v_out text := '';
  r record;
  v_cols text;
  v_col record;
  v_enum_types text[];
BEGIN
  -- 1) ENUM types référencés par les colonnes des tables de ce module
  SELECT array_agg(DISTINCT t.typname) INTO v_enum_types
  FROM pg_attribute a
  JOIN pg_class c ON c.oid = a.attrelid
  JOIN pg_namespace n ON n.oid = c.relnamespace
  JOIN pg_type t ON t.oid = a.atttypid
  WHERE n.nspname = 'public' AND c.relname LIKE p_prefix || '%'
    AND c.relkind = 'r' AND a.attnum > 0 AND NOT a.attisdropped
    AND t.typtype = 'e';

  IF v_enum_types IS NOT NULL THEN
    FOR r IN
      SELECT t.typname,
        string_agg(quote_literal(e.enumlabel), ',' ORDER BY e.enumsortorder) AS labels
      FROM pg_type t JOIN pg_enum e ON e.enumtypid = t.oid
      WHERE t.typname = ANY(v_enum_types)
      GROUP BY t.typname
    LOOP
      v_out := v_out || format(
        E'DO $do$ BEGIN\n  CREATE TYPE public.%I AS ENUM (%s);\nEXCEPTION WHEN duplicate_object THEN NULL; END $do$;\n\n',
        r.typname, r.labels
      );
    END LOOP;
  END IF;

  -- 2) CREATE TABLE (colonnes avec type + default + not null)
  FOR r IN
    SELECT c.relname AS table_name, c.oid
    FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname='public' AND c.relname LIKE p_prefix || '%' AND c.relkind='r'
    ORDER BY c.relname
  LOOP
    v_cols := '';
    FOR v_col IN
      SELECT a.attname,
        pg_catalog.format_type(a.atttypid, a.atttypmod) AS coltype,
        a.attnotnull,
        pg_get_expr(ad.adbin, ad.adrelid) AS coldefault
      FROM pg_attribute a
      LEFT JOIN pg_attrdef ad ON ad.adrelid = a.attrelid AND ad.adnum = a.attnum
      WHERE a.attrelid = r.oid AND a.attnum > 0 AND NOT a.attisdropped
      ORDER BY a.attnum
    LOOP
      v_cols := v_cols || format('  %I %s', v_col.attname, v_col.coltype);
      IF v_col.coldefault IS NOT NULL THEN
        v_cols := v_cols || ' DEFAULT ' || v_col.coldefault;
      END IF;
      IF v_col.attnotnull THEN
        v_cols := v_cols || ' NOT NULL';
      END IF;
      v_cols := v_cols || E',\n';
    END LOOP;
    v_cols := left(v_cols, length(v_cols) - 2);

    v_out := v_out || format(E'CREATE TABLE IF NOT EXISTS public.%I (\n%s\n);\n\n', r.table_name, v_cols);
  END LOOP;

  -- 3) Contraintes (PK, FK, UNIQUE, CHECK)
  FOR r IN
    SELECT conrelid::regclass::text AS tbl, conname, pg_get_constraintdef(oid) AS def
    FROM pg_constraint
    WHERE connamespace = 'public'::regnamespace
      AND conrelid::regclass::text LIKE p_prefix || '%'
    ORDER BY conrelid::regclass::text, conname
  LOOP
    v_out := v_out || format(E'ALTER TABLE public.%s ADD CONSTRAINT %I %s;\n', r.tbl, r.conname, r.def);
  END LOOP;
  v_out := v_out || E'\n';

  -- 4) Index (hors ceux déjà créés par les contraintes ci-dessus)
  FOR r IN
    SELECT indexname, indexdef FROM pg_indexes
    WHERE schemaname='public' AND tablename LIKE p_prefix || '%'
      AND indexname NOT IN (SELECT conname FROM pg_constraint WHERE connamespace='public'::regnamespace)
    ORDER BY indexname
  LOOP
    v_out := v_out || r.indexdef || E';\n';
  END LOOP;
  v_out := v_out || E'\n';

  -- 5) Fonctions du module (même préfixe)
  FOR r IN
    SELECT pg_get_functiondef(p.oid) AS def
    FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
    WHERE n.nspname='public' AND p.proname LIKE p_prefix || '%'
    ORDER BY p.proname
  LOOP
    v_out := v_out || r.def || E';\n\n';
  END LOOP;

  -- 6) Triggers
  FOR r IN
    SELECT pg_get_triggerdef(t.oid) AS def
    FROM pg_trigger t JOIN pg_class c ON c.oid=t.tgrelid
    WHERE c.relname LIKE p_prefix || '%' AND NOT t.tgisinternal
    ORDER BY t.tgname
  LOOP
    v_out := v_out || r.def || E';\n';
  END LOOP;
  v_out := v_out || E'\n';

  -- 7) RLS enable + policies
  FOR r IN
    SELECT relname FROM pg_class WHERE relname LIKE p_prefix || '%' AND relkind='r' AND relnamespace='public'::regnamespace AND relrowsecurity
    ORDER BY relname
  LOOP
    v_out := v_out || format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', r.relname) || E'\n';
  END LOOP;
  v_out := v_out || E'\n';

  FOR r IN
    SELECT tablename, policyname, cmd, qual, with_check, permissive, roles
    FROM pg_policies WHERE schemaname='public' AND tablename LIKE p_prefix || '%'
    ORDER BY tablename, policyname
  LOOP
    v_out := v_out || format(
      'CREATE POLICY %I ON public.%I FOR %s%s%s;',
      r.policyname, r.tablename, r.cmd,
      CASE WHEN r.qual IS NOT NULL THEN format(' USING (%s)', r.qual) ELSE '' END,
      CASE WHEN r.with_check IS NOT NULL THEN format(' WITH CHECK (%s)', r.with_check) ELSE '' END
    ) || E'\n';
  END LOOP;

  RETURN v_out;
END;
$function$


CREATE OR REPLACE FUNCTION public.generate_marketplace_order_number()
 RETURNS text
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_number TEXT;
  v_exists BOOLEAN;
BEGIN
  LOOP
    v_number := 'MKT-' || TO_CHAR(now(), 'YYYYMMDD') || '-' || UPPER(SUBSTRING(gen_random_uuid()::TEXT, 1, 6));
    SELECT EXISTS(SELECT 1 FROM public.marketplace_orders WHERE order_number = v_number) INTO v_exists;
    EXIT WHEN NOT v_exists;
  END LOOP;
  RETURN v_number;
END;
$function$


CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (
    id,
    email,
    first_name,
    last_name,
    full_name,
    avatar_url,
    account_status
  ) VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', ''),
    'active'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'handle_new_user error: %', SQLERRM;
    RETURN NEW;
END;
$function$


CREATE OR REPLACE FUNCTION public.handle_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$


CREATE OR REPLACE FUNCTION public.health_book_appointment(p_professional_id uuid, p_business_id uuid, p_service_id uuid, p_scheduled_at timestamp with time zone, p_duration_minutes integer, p_price numeric, p_currency_id uuid, p_idempotency_key text DEFAULT NULL::text)
 RETURNS health_appointments
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare v_appointment public.health_appointments; v_prof public.health_professionals; v_service public.health_services;
begin
if auth.uid() is null then raise exception 'Authentification requise'; end if;
if p_scheduled_at <= now() then raise exception 'La date du rendez-vous doit être future'; end if;
if p_duration_minutes is not null and p_duration_minutes <= 0 then raise exception 'Durée invalide'; end if;
if p_price is null or p_price < 0 then raise exception 'Prix invalide'; end if;
if p_idempotency_key is not null then select * into v_appointment from public.health_appointments where idempotency_key=p_idempotency_key and patient_user_id=auth.uid(); if found then return v_appointment; end if; end if;
select * into v_prof from public.health_professionals where id=p_professional_id for share;
if not found or not v_prof.is_active or v_prof.verification_status::text <> 'verified' or v_prof.business_id <> p_business_id then raise exception 'Professionnel de santé invalide'; end if;
select * into v_service from public.health_services where id=p_service_id for share;
if not found or not v_service.is_active or v_service.business_id <> p_business_id or (v_service.professional_id is not null and v_service.professional_id <> p_professional_id) then raise exception 'Service de santé invalide'; end if;
if p_price <> v_service.price or p_currency_id <> v_service.currency_id then raise exception 'Prix ou devise du service incompatible'; end if;
if exists(select 1 from public.health_appointments where professional_id=p_professional_id and scheduled_at=p_scheduled_at and appointment_status in ('requested','pending','confirmed')) then raise exception 'Ce créneau n''est plus disponible'; end if;
insert into public.health_appointments(patient_user_id,professional_id,business_id,service_id,scheduled_at,duration_minutes,price,currency_id,idempotency_key)
values(auth.uid(),p_professional_id,p_business_id,p_service_id,p_scheduled_at,coalesce(p_duration_minutes,v_service.duration_minutes,30),p_price,p_currency_id,p_idempotency_key)
returning * into v_appointment; return v_appointment;
end;$function$


CREATE OR REPLACE FUNCTION public.health_can_access_medical_record(p_record_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_record public.health_medical_records;
BEGIN
  SELECT * INTO v_record FROM public.health_medical_records WHERE id = p_record_id;
  IF NOT FOUND THEN RETURN false; END IF;

  IF v_record.patient_user_id = auth.uid() THEN RETURN true; END IF;

  IF EXISTS (SELECT 1 FROM public.health_professionals p WHERE p.id = v_record.author_professional_id AND p.user_id = auth.uid()) THEN
    RETURN true;
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.health_patient_consents c
    WHERE c.patient_user_id = v_record.patient_user_id
      AND c.consent_status = 'active'
      AND (c.expires_at IS NULL OR c.expires_at > now())
      AND c.scope IN ('medical_records','full')
      AND (
        (c.grantee_professional_id IS NOT NULL AND EXISTS (
          SELECT 1 FROM public.health_professionals gp WHERE gp.id = c.grantee_professional_id AND gp.user_id = auth.uid()))
        OR (c.grantee_business_id IS NOT NULL AND public.user_has_business_access(c.grantee_business_id))
      )
  ) THEN
    RETURN true;
  END IF;

  RETURN false; -- le Super Admin n'a PAS d'accès automatique au contenu clinique
END;
$function$


CREATE OR REPLACE FUNCTION public.health_confirm_appointment_payment(p_appointment_id uuid, p_wallet_transaction_id uuid)
 RETURNS health_appointments
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare v_appt public.health_appointments; v_tx public.wallet_transactions; v_wallet public.wallets;
begin
 if auth.uid() is null then raise exception 'Authentification requise'; end if;
 select * into v_appt from public.health_appointments where id=p_appointment_id for update;
 if not found then raise exception 'Rendez-vous introuvable'; end if;
 if v_appt.wallet_transaction_id=p_wallet_transaction_id then return v_appt; end if;
 if v_appt.wallet_transaction_id is not null then raise exception 'Ce rendez-vous possède déjà un paiement différent'; end if;
 if v_appt.patient_user_id<>auth.uid() and not public.user_has_business_access(v_appt.business_id) and not public.is_super_admin() then raise exception 'Accès refusé'; end if;
 select * into v_tx from public.wallet_transactions where id=p_wallet_transaction_id for update;
 if not found or v_tx.transaction_status<>'completed' then raise exception 'Paiement JDV PAY non confirmé'; end if;
 select * into v_wallet from public.wallets where id=v_tx.wallet_id;
 if not found or v_wallet.user_id<>v_appt.patient_user_id then raise exception 'Le portefeuille ne correspond pas au patient'; end if;
 if v_tx.currency_id<>v_appt.currency_id then raise exception 'Devise du paiement incompatible'; end if;
 if v_tx.amount<>coalesce(v_appt.price,0) then raise exception 'Montant du paiement incompatible avec le rendez-vous'; end if;
 if exists(select 1 from public.health_appointments where wallet_transaction_id=p_wallet_transaction_id and id<>p_appointment_id)
 or exists(select 1 from public.immo_reservations where wallet_transaction_id=p_wallet_transaction_id)
 or exists(select 1 from public.transport_bookings where wallet_transaction_id=p_wallet_transaction_id)
 or exists(select 1 from public.travel_bookings where wallet_transaction_id=p_wallet_transaction_id)
 or exists(select 1 from public.transit_invoices where wallet_transaction_id=p_wallet_transaction_id) then raise exception 'Ce paiement est déjà utilisé'; end if;
 update public.health_appointments set wallet_transaction_id=p_wallet_transaction_id,appointment_status='confirmed',updated_at=now() where id=p_appointment_id returning * into v_appt;
 insert into public.audit_logs(user_id,module_code,action,entity_type,entity_id,new_data) values(auth.uid(),'health','appointment.payment_confirmed','health_appointments',p_appointment_id::text,jsonb_build_object('wallet_transaction_id',p_wallet_transaction_id,'amount',v_tx.amount));
 return v_appt;
end $function$


CREATE OR REPLACE FUNCTION public.health_create_prescription(p_patient_user_id uuid, p_appointment_id uuid, p_items jsonb)
 RETURNS health_prescriptions
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_prof public.health_professionals;
  v_presc public.health_prescriptions;
  v_item jsonb;
BEGIN
  SELECT * INTO v_prof FROM public.health_professionals WHERE user_id = auth.uid();
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Seul un professionnel de santé peut créer une prescription';
  END IF;

  INSERT INTO public.health_prescriptions (prescriber_professional_id, patient_user_id, appointment_id)
  VALUES (v_prof.id, p_patient_user_id, p_appointment_id)
  RETURNING * INTO v_presc;

  FOR v_item IN SELECT * FROM jsonb_array_elements(COALESCE(p_items, '[]'::jsonb))
  LOOP
    INSERT INTO public.health_prescription_items (prescription_id, medication_name, dosage, instructions, duration)
    VALUES (v_presc.id, v_item->>'medication_name', v_item->>'dosage', v_item->>'instructions', v_item->>'duration');
  END LOOP;

  INSERT INTO public.audit_logs (user_id, module_code, action, entity_type, entity_id)
  VALUES (auth.uid(), 'health', 'prescription.created', 'health_prescriptions', v_presc.id::text);

  RETURN v_presc;
END;
$function$


CREATE OR REPLACE FUNCTION public.health_grant_consent(p_grantee_professional_id uuid, p_grantee_business_id uuid, p_scope text, p_expires_at timestamp with time zone DEFAULT NULL::timestamp with time zone)
 RETURNS health_patient_consents
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare v_consent public.health_patient_consents;
begin
if auth.uid() is null then raise exception 'Authentification requise'; end if;
if p_grantee_professional_id is null and p_grantee_business_id is null then raise exception 'Destinataire du consentement requis'; end if;
if p_expires_at is not null and p_expires_at<=now() then raise exception 'Expiration du consentement invalide'; end if;
if p_grantee_professional_id is not null and not exists(select 1 from public.health_professionals where id=p_grantee_professional_id and is_active=true and verification_status::text='verified') then raise exception 'Professionnel de santé invalide'; end if;
if p_grantee_business_id is not null and not exists(select 1 from public.business_profiles where id=p_grantee_business_id) then raise exception 'Établissement de santé invalide'; end if;
select * into v_consent from public.health_patient_consents where patient_user_id=auth.uid() and grantee_professional_id is not distinct from p_grantee_professional_id and grantee_business_id is not distinct from p_grantee_business_id and scope=p_scope::public.health_consent_scope and consent_status='active';
if found then return v_consent; end if;
insert into public.health_patient_consents(patient_user_id,grantee_professional_id,grantee_business_id,scope,expires_at) values(auth.uid(),p_grantee_professional_id,p_grantee_business_id,p_scope::public.health_consent_scope,p_expires_at) returning * into v_consent;
insert into public.audit_logs(user_id,module_code,action,entity_type,entity_id,new_data) values(auth.uid(),'health','consent.granted','health_patient_consents',v_consent.id::text,jsonb_build_object('scope',p_scope));
return v_consent;
end;$function$


CREATE OR REPLACE FUNCTION public.health_log_record_access(p_record_id uuid, p_reason text DEFAULT NULL::text)
 RETURNS health_medical_record_access_log
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare v_log public.health_medical_record_access_log;
begin
if auth.uid() is null then raise exception 'Authentification requise'; end if;
if not public.health_can_access_medical_record(p_record_id) then raise exception 'Accès refusé à ce dossier médical'; end if;
insert into public.health_medical_record_access_log(record_id,accessor_user_id,access_reason) values(p_record_id,auth.uid(),p_reason) returning * into v_log;
insert into public.audit_logs(user_id,module_code,action,entity_type,entity_id) values(auth.uid(),'health','medical_record.accessed','health_medical_records',p_record_id::text);
return v_log;
end;$function$


CREATE OR REPLACE FUNCTION public.health_protect_appointment_system_fields()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
begin
  if public.is_super_admin() or current_setting('jdv.health_internal',true)='1' then return new; end if;
  if tg_op='UPDATE' then
    if new.patient_user_id is distinct from old.patient_user_id
       or new.professional_id is distinct from old.professional_id
       or new.business_id is distinct from old.business_id
       or new.service_id is distinct from old.service_id
       or new.price is distinct from old.price
       or new.currency_id is distinct from old.currency_id
       or new.wallet_transaction_id is distinct from old.wallet_transaction_id
       or new.idempotency_key is distinct from old.idempotency_key then
      raise exception 'Champs système du rendez-vous protégés';
    end if;
  end if;
  return new;
end $function$


CREATE OR REPLACE FUNCTION public.health_protect_medical_record_system_fields()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
begin
  if public.is_super_admin() or current_setting('jdv.health_internal',true)='1' then return new; end if;
  if tg_op='UPDATE' then
    if new.patient_user_id is distinct from old.patient_user_id
       or new.author_professional_id is distinct from old.author_professional_id
       or new.business_id is distinct from old.business_id
       or new.appointment_id is distinct from old.appointment_id then
      raise exception 'Champs système du dossier médical protégés';
    end if;
  end if;
  return new;
end $function$


CREATE OR REPLACE FUNCTION public.health_revoke_consent(p_consent_id uuid)
 RETURNS health_patient_consents
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_consent public.health_patient_consents;
BEGIN
  SELECT * INTO v_consent FROM public.health_patient_consents WHERE id = p_consent_id AND patient_user_id = auth.uid() FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Consentement introuvable'; END IF;

  UPDATE public.health_patient_consents
  SET consent_status = 'revoked', revoked_at = now()
  WHERE id = p_consent_id
  RETURNING * INTO v_consent;

  INSERT INTO public.audit_logs (user_id, module_code, action, entity_type, entity_id, new_data)
  VALUES (auth.uid(), 'health', 'consent.revoked', 'health_patient_consents', p_consent_id::text, '{}'::jsonb);

  RETURN v_consent;
END;
$function$


CREATE OR REPLACE FUNCTION public.health_set_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$


CREATE OR REPLACE FUNCTION public.immo_confirm_reservation(p_reservation_id uuid, p_wallet_transaction_id uuid)
 RETURNS immo_reservations
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare v_res public.immo_reservations; v_property public.immo_properties; v_tx public.wallet_transactions; v_wallet public.wallets;
begin
 if auth.uid() is null then raise exception 'Authentification requise'; end if;
 select * into v_res from public.immo_reservations where id=p_reservation_id for update;
 if not found then raise exception 'Réservation introuvable'; end if;
 select * into v_property from public.immo_properties where id=v_res.property_id;
 if not found then raise exception 'Bien immobilier introuvable'; end if;
 if not (v_res.client_user_id=auth.uid() or (v_property.business_id is not null and public.user_has_business_access(v_property.business_id)) or public.is_super_admin()) then raise exception 'Accès refusé'; end if;
 if v_res.reservation_status='confirmed' then
   if v_res.wallet_transaction_id is distinct from p_wallet_transaction_id then raise exception 'Réservation déjà confirmée avec un autre paiement'; end if;
   return v_res;
 end if;
 select * into v_tx from public.wallet_transactions where id=p_wallet_transaction_id for update;
 if not found or v_tx.transaction_status<>'completed' then raise exception 'Paiement JDV PAY non confirmé'; end if;
 select * into v_wallet from public.wallets where id=v_tx.wallet_id;
 if not found or v_wallet.user_id<>v_res.client_user_id then raise exception 'Portefeuille de paiement non autorisé'; end if;
 if v_tx.amount<>v_res.amount then raise exception 'Montant du paiement incompatible avec la réservation'; end if;
 if v_tx.currency_id<>v_res.currency_id then raise exception 'Devise du paiement incompatible'; end if;
 update public.immo_reservations set reservation_status='confirmed',wallet_transaction_id=p_wallet_transaction_id where id=p_reservation_id returning * into v_res;
 update public.immo_properties set property_status='reserved' where id=v_res.property_id and property_status not in ('sold','rented');
 insert into public.audit_logs(user_id,module_code,action,entity_type,entity_id,new_data) values(auth.uid(),'immo','reservation.confirmed','immo_reservations',p_reservation_id::text,to_jsonb(v_res));
 return v_res;
end $function$


CREATE OR REPLACE FUNCTION public.immo_generate_property_slug()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug := lower(regexp_replace(NEW.title, '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substr(gen_random_uuid()::text, 1, 6);
  END IF;
  RETURN NEW;
END;
$function$


CREATE OR REPLACE FUNCTION public.immo_protect_lease_financial_fields()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$ begin if public.is_super_admin() then return new; end if; if auth.uid() is null then raise exception 'Authentification requise'; end if; if new.tenant_user_id is distinct from old.tenant_user_id or new.landlord_user_id is distinct from old.landlord_user_id or new.landlord_business_id is distinct from old.landlord_business_id or new.property_id is distinct from old.property_id or new.rent_amount is distinct from old.rent_amount or new.currency_id is distinct from old.currency_id or new.deposit_amount is distinct from old.deposit_amount then raise exception 'Identite et conditions financieres du bail non modifiables directement'; end if; return new; end; $function$


CREATE OR REPLACE FUNCTION public.immo_protect_offer_system_fields()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$ begin if public.is_super_admin() then return new; end if; if auth.uid() is null then raise exception 'Authentification requise'; end if; if new.buyer_user_id is distinct from old.buyer_user_id or new.property_id is distinct from old.property_id or new.agent_id is distinct from old.agent_id or new.amount is distinct from old.amount or new.currency_id is distinct from old.currency_id then raise exception 'Champs sensibles de la proposition non modifiables directement'; end if; return new; end; $function$


CREATE OR REPLACE FUNCTION public.immo_protect_property_system_fields()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$ begin if public.is_super_admin() then return new; end if; if auth.uid() is null then raise exception 'Authentification requise'; end if; if new.owner_user_id is distinct from old.owner_user_id or new.business_id is distinct from old.business_id or new.verification_status is distinct from old.verification_status or new.published_at is distinct from old.published_at then raise exception 'Champs système du bien non modifiables directement'; end if; return new; end; $function$


CREATE OR REPLACE FUNCTION public.immo_record_rent_payment(p_schedule_id uuid, p_wallet_transaction_id uuid)
 RETURNS immo_rent_schedules
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare
  v_schedule public.immo_rent_schedules;
  v_lease public.immo_leases;
  v_tx public.wallet_transactions;
  v_wallet public.wallets;
  v_new_paid numeric;
begin
  if auth.uid() is null then raise exception 'Authentification requise'; end if;
  select * into v_schedule from public.immo_rent_schedules where id=p_schedule_id for update;
  if not found then raise exception 'Échéance introuvable'; end if;
  select * into v_lease from public.immo_leases where id=v_schedule.lease_id;
  if not found then raise exception 'Bail introuvable'; end if;

  if not (v_lease.tenant_user_id=auth.uid()
    or (v_lease.landlord_business_id is not null and public.user_has_business_access(v_lease.landlord_business_id))
    or public.is_super_admin()) then
    raise exception 'Accès refusé';
  end if;

  if v_schedule.wallet_transaction_id is not null then
    if v_schedule.wallet_transaction_id=p_wallet_transaction_id then return v_schedule; end if;
    raise exception 'Échéance déjà associée à un autre paiement';
  end if;

  select * into v_tx from public.wallet_transactions where id=p_wallet_transaction_id for update;
  if not found or v_tx.transaction_status<>'completed' then raise exception 'Paiement JDV PAY non confirmé'; end if;
  select * into v_wallet from public.wallets where id=v_tx.wallet_id;
  if not found or v_wallet.user_id<>v_lease.tenant_user_id then raise exception 'Portefeuille de paiement non autorisé'; end if;
  if v_tx.amount<=0 then raise exception 'Montant de paiement invalide'; end if;
  if v_tx.currency_id<>v_lease.currency_id then raise exception 'Devise incompatible'; end if;
  if v_tx.amount>greatest(v_schedule.amount_due-v_schedule.amount_paid,0) then raise exception 'Le paiement dépasse le montant restant'; end if;
  if exists(select 1 from public.immo_rent_schedules where wallet_transaction_id=p_wallet_transaction_id and id<>p_schedule_id) then
    raise exception 'Ce paiement est déjà affecté à une autre échéance';
  end if;

  v_new_paid:=v_schedule.amount_paid+v_tx.amount;
  update public.immo_rent_schedules
  set amount_paid=v_new_paid,remaining_amount=greatest(amount_due-v_new_paid,0),
      wallet_transaction_id=p_wallet_transaction_id,
      rent_status=case when v_new_paid>=amount_due then 'paid' else 'partially_paid' end,
      updated_at=now()
  where id=p_schedule_id returning * into v_schedule;

  insert into public.audit_logs(user_id,module_code,action,entity_type,entity_id,new_data)
  values(auth.uid(),'immo','rent.payment_recorded','immo_rent_schedules',p_schedule_id::text,
         jsonb_build_object('wallet_transaction_id',p_wallet_transaction_id,'amount',v_tx.amount,'currency_id',v_tx.currency_id));
  return v_schedule;
end;
$function$


CREATE OR REPLACE FUNCTION public.immo_request_to_crm_prospect(p_request_id uuid, p_business_id uuid)
 RETURNS crm_prospects
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE v_request public.immo_requests; v_prospect public.crm_prospects; v_profile public.profiles;
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Authentification requise'; END IF;
 IF NOT (public.user_has_business_access(p_business_id) OR public.is_super_admin()) THEN RAISE EXCEPTION 'Accès refusé'; END IF;
 SELECT * INTO v_request FROM public.immo_requests WHERE id=p_request_id FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Demande introuvable'; END IF;
 IF v_request.assigned_business_id IS NOT NULL AND v_request.assigned_business_id<>p_business_id THEN RAISE EXCEPTION 'Demande déjà affectée à une autre entreprise'; END IF;
 IF v_request.crm_prospect_id IS NOT NULL THEN
   SELECT * INTO v_prospect FROM public.crm_prospects WHERE id=v_request.crm_prospect_id AND business_id=p_business_id;
   IF NOT FOUND THEN RAISE EXCEPTION 'Prospect CRM incohérent'; END IF;
   RETURN v_prospect;
 END IF;
 SELECT * INTO v_profile FROM public.profiles WHERE id=v_request.requester_user_id;
 INSERT INTO public.crm_prospects(business_id,first_name,last_name,phone,email,country_id,desired_product,requested_amount,prospect_status,created_by)
 VALUES(p_business_id,COALESCE(v_profile.first_name,'Prospect'),v_profile.last_name,v_profile.phone,v_profile.email,v_request.country_id,
        'Bien immobilier ('||COALESCE(v_request.transaction_type::text,'n/a')||')',v_request.budget_max,'new',auth.uid())
 RETURNING * INTO v_prospect;
 UPDATE public.immo_requests SET crm_prospect_id=v_prospect.id,assigned_business_id=p_business_id,request_status='matched' WHERE id=p_request_id;
 RETURN v_prospect;
END;$function$


CREATE OR REPLACE FUNCTION public.immo_set_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$


CREATE OR REPLACE FUNCTION public.immo_stamp_published_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  IF NEW.property_status = 'published' AND (OLD.property_status IS DISTINCT FROM 'published') THEN
    NEW.published_at := now();
  END IF;
  IF NEW.property_status <> 'published' THEN
    NEW.published_at := NULL;
  END IF;
  RETURN NEW;
END;
$function$


CREATE OR REPLACE FUNCTION public.insurance_create_customer(p_full_name text, p_phone text DEFAULT NULL::text, p_email text DEFAULT NULL::text, p_country_id uuid DEFAULT NULL::uuid, p_identity_reference text DEFAULT NULL::text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare v_id uuid;
begin
 if auth.uid() is null then raise exception 'authentication required'; end if;
 insert into public.insurance_customers(user_id,full_name,phone,email,country_id,identity_reference)
 values(auth.uid(),trim(p_full_name),p_phone,p_email,p_country_id,p_identity_reference) returning id into v_id;
 return v_id;
end $function$


CREATE OR REPLACE FUNCTION public.insurance_submit_claim(p_policy_id uuid, p_claim_type text, p_incident_date date, p_description text, p_claimed_amount numeric, p_currency_id uuid DEFAULT NULL::uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare
  v_id uuid;
  v_customer uuid;
  v_policy_currency uuid;
  v_num text;
begin
  if auth.uid() is null then
    raise exception 'authentication required';
  end if;

  if coalesce(trim(p_claim_type),'') = '' then
    raise exception 'claim type required';
  end if;

  if coalesce(trim(p_description),'') = '' then
    raise exception 'claim description required';
  end if;

  if p_incident_date is null or p_incident_date > current_date then
    raise exception 'invalid incident date';
  end if;

  if p_claimed_amount is null or p_claimed_amount <= 0 then
    raise exception 'claimed amount must be greater than zero';
  end if;

  select p.customer_id, p.currency_id
    into v_customer, v_policy_currency
  from public.insurance_policies p
  join public.insurance_customers c on c.id=p.customer_id
  where p.id=p_policy_id
    and c.user_id=auth.uid()
    and p.status='active';

  if v_customer is null then
    raise exception 'policy access denied';
  end if;

  if p_currency_id is not null and p_currency_id <> v_policy_currency then
    raise exception 'claim currency does not match policy currency';
  end if;

  v_num := 'CLM-'||to_char(clock_timestamp(),'YYYYMMDDHH24MISSMS')||'-'||substr(gen_random_uuid()::text,1,8);

  insert into public.insurance_claims(
    claim_number,policy_id,customer_id,claim_type,incident_date,
    description,claimed_amount,currency_id
  )
  values(
    v_num,p_policy_id,v_customer,trim(p_claim_type),p_incident_date,
    trim(p_description),p_claimed_amount,v_policy_currency
  )
  returning id into v_id;

  insert into public.audit_logs(
    user_id,module_code,action,entity_type,entity_id,new_data
  )
  values(
    auth.uid(),'insurance','claim.submitted','insurance_claims',v_id::text,
    jsonb_build_object(
      'policy_id',p_policy_id,
      'claimed_amount',p_claimed_amount,
      'currency_id',v_policy_currency
    )
  );

  return v_id;
end;
$function$


CREATE OR REPLACE FUNCTION public.is_org_admin(org_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select exists (
    select 1
    from public.organization_members om
    join public.roles r on r.id = om.role_id
    where om.organization_id = org_id
      and om.user_id = auth.uid()
      and om.member_status = 'active'
      and r.code in ('owner','admin')
  );
$function$


CREATE OR REPLACE FUNCTION public.is_org_member(org_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select exists (
    select 1
    from public.organization_members om
    where om.organization_id = org_id
      and om.user_id = auth.uid()
      and om.member_status = 'active'
  );
$function$


CREATE OR REPLACE FUNCTION public.is_super_admin()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select exists (
    select 1
    from public.super_admins sa
    where sa.user_id = auth.uid()
      and sa.admin_status = 'active'
  );
$function$


CREATE OR REPLACE FUNCTION public.jdv_ai_protect_message_identity()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
declare v_user uuid;
begin
  select c.user_id into v_user from public.ai_conversations c where c.id=new.conversation_id;
  if v_user is null then raise exception 'Conversation AI introuvable'; end if;
  if new.user_id is distinct from v_user then
    raise exception 'Identité utilisateur AI invalide';
  end if;
  return new;
end;
$function$


CREATE OR REPLACE FUNCTION public.jdv_can_use_module(p_module_code text)
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_module public.modules%rowtype;
begin
  if auth.uid() is null then
    return false;
  end if;

  if public.is_super_admin() then
    return true;
  end if;

  select *
    into v_module
  from public.modules
  where code = lower(trim(p_module_code))
  limit 1;

  if not found then
    return false;
  end if;

  if v_module.module_status not in ('active','development') then
    return false;
  end if;

  -- Subscription enforcement is deliberately centralized here.
  -- Modules marked as not requiring a subscription are immediately usable.
  -- Subscription-required modules remain blocked until a real subscription
  -- record/engine is connected; no demo subscription is created.
  if coalesce(v_module.requires_subscription,false) then
    return false;
  end if;

  return true;
end;
$function$


CREATE OR REPLACE FUNCTION public.jdv_guard_wallet_transaction_reuse()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare
  v_tx uuid;
  v_table text;
  v_count integer;
  v_tables constant text[] := array[
    'health_appointments','immo_rent_schedules','immo_reservations',
    'insurance_payments','insurance_premium_schedules',
    'marketplace_orders','marketplace_refunds','marketplace_settlements',
    'tontine_contributions','tontine_payouts',
    'transit_invoices','transport_bookings','transport_deliveries',
    'transport_rentals','transport_seat_reservations','travel_bookings',
    'crm_payments'
  ];
begin
  v_tx := case when TG_TABLE_NAME='crm_payments'
               then NEW.jdv_pay_transaction_id
               else NEW.wallet_transaction_id end;

  if v_tx is null then return NEW; end if;

  foreach v_table in array v_tables loop
    if v_table='crm_payments' then
      execute format(
        'select count(*) from public.%I where jdv_pay_transaction_id=$1 and id<>coalesce($2,id)',
        v_table
      ) into v_count using v_tx, NEW.id;
    else
      execute format(
        'select count(*) from public.%I where wallet_transaction_id=$1 and id<>coalesce($2,id)',
        v_table
      ) into v_count using v_tx, NEW.id;
    end if;

    if coalesce(v_count,0)>0 then
      raise exception 'Transaction JDV PAY déjà affectée à une autre opération métier';
    end if;
  end loop;

  return NEW;
end;
$function$


CREATE OR REPLACE FUNCTION public.jdv_protect_profile_system_fields()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
begin
  if public.is_super_admin() then return new; end if;

  if TG_TABLE_NAME='health_professionals' then
    new.user_id := old.user_id;
    new.business_id := old.business_id;
    new.verification_status := old.verification_status;
    new.is_active := old.is_active;
  elsif TG_TABLE_NAME='immo_agents' then
    new.user_id := old.user_id;
    new.business_id := old.business_id;
    new.verification_status := old.verification_status;
  elsif TG_TABLE_NAME='pub_advertisers' then
    new.user_id := old.user_id;
    new.organization_id := old.organization_id;
    new.status := old.status;
  end if;

  return new;
end;
$function$


CREATE OR REPLACE FUNCTION public.marketplace_create_order(p_seller_id uuid, p_items jsonb, p_delivery_address_id uuid DEFAULT NULL::uuid, p_idempotency_key text DEFAULT NULL::text, p_notes text DEFAULT NULL::text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare
  v_buyer uuid := auth.uid();
  v_order_id uuid;
  v_order_number text;
  v_subtotal numeric := 0;
  v_commission numeric := 0;
  v_total numeric := 0;
  v_currency uuid;
  v_item jsonb;
  v_listing public.marketplace_listings%rowtype;
  v_qty integer;
  v_line numeric;
  v_rate numeric;
begin
  if v_buyer is null then raise exception 'Authentication required'; end if;
  if p_seller_id is null then raise exception 'Seller is required'; end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'At least one item is required';
  end if;

  if p_idempotency_key is not null then
    select id into v_order_id
    from public.marketplace_orders
    where buyer_id = v_buyer and idempotency_key = p_idempotency_key
    limit 1;
    if v_order_id is not null then return v_order_id; end if;
  end if;

  if p_delivery_address_id is not null
     and not exists (
       select 1 from public.marketplace_addresses
       where id = p_delivery_address_id and user_id = v_buyer
     ) then
    raise exception 'Delivery address does not belong to buyer';
  end if;

  select commission_rate into v_rate
  from public.marketplace_sellers
  where id = p_seller_id and seller_status = 'active'
  for share;

  if not found then raise exception 'Seller is not active'; end if;

  perform set_config('jdv.marketplace_internal','1',true);

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_qty := (v_item->>'quantity')::integer;
    if v_qty <= 0 then raise exception 'Quantity must be greater than zero'; end if;

    select * into v_listing
    from public.marketplace_listings
    where id = (v_item->>'listing_id')::uuid
      and seller_id = p_seller_id
      and listing_status = 'published'
    for update;

    if not found then raise exception 'Listing is unavailable or belongs to another seller'; end if;

    if v_listing.track_inventory then
      if coalesce(v_listing.stock_quantity,0) - coalesce(v_listing.stock_reserved,0) < v_qty
         and not v_listing.allow_backorder then
        raise exception 'Insufficient stock for listing %', v_listing.id;
      end if;

      update public.marketplace_listings
      set stock_reserved = coalesce(stock_reserved,0) + v_qty, updated_at = now()
      where id = v_listing.id;
    end if;

    if v_currency is null then
      v_currency := v_listing.currency_id;
    elsif v_currency is distinct from v_listing.currency_id then
      raise exception 'All order items must use the same currency';
    end if;

    v_line := v_listing.price * v_qty;
    v_subtotal := v_subtotal + v_line;
  end loop;

  v_commission := round(v_subtotal * coalesce(v_rate,0) / 100, 2);
  v_total := v_subtotal;
  v_order_number := public.generate_marketplace_order_number();

  insert into public.marketplace_orders (
    order_number,buyer_id,seller_id,delivery_address_id,order_status,
    subtotal,shipping_cost,discount_amount,commission_amount,total_amount,
    currency_id,notes,idempotency_key,metadata
  )
  values (
    v_order_number,v_buyer,p_seller_id,p_delivery_address_id,'pending',
    v_subtotal,0,0,v_commission,v_total,v_currency,p_notes,p_idempotency_key,'{}'::jsonb
  )
  returning id into v_order_id;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_qty := (v_item->>'quantity')::integer;
    select * into v_listing
    from public.marketplace_listings
    where id = (v_item->>'listing_id')::uuid
      and seller_id = p_seller_id;

    insert into public.marketplace_order_items (
      order_id,listing_id,quantity,unit_price,total_price,currency_id,listing_snapshot
    )
    values (
      v_order_id,v_listing.id,v_qty,v_listing.price,v_listing.price*v_qty,
      v_listing.currency_id,
      jsonb_build_object('title',v_listing.title,'slug',v_listing.slug,'sku',v_listing.sku,
                         'price',v_listing.price,'currency_id',v_listing.currency_id)
    );
  end loop;

  return v_order_id;
end;
$function$


CREATE OR REPLACE FUNCTION public.marketplace_protect_listing_system_fields()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
begin
  if current_setting('jdv.marketplace_internal', true) = '1' then
    return new;
  end if;

  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  if public.is_super_admin() then
    return new;
  end if;

  if tg_op = 'UPDATE' then
    if new.seller_id <> old.seller_id
       or new.rating_average is distinct from old.rating_average
       or new.rating_count is distinct from old.rating_count
       or new.sale_count is distinct from old.sale_count
       or new.view_count is distinct from old.view_count
       or new.stock_reserved is distinct from old.stock_reserved then
      raise exception 'Listing system fields cannot be modified directly';
    end if;
  end if;

  return new;
end;
$function$


CREATE OR REPLACE FUNCTION public.marketplace_protect_order_financial_fields()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  if public.is_super_admin() then
    return new;
  end if;

  if tg_op = 'UPDATE' then
    if new.buyer_id <> old.buyer_id
       or new.seller_id <> old.seller_id
       or new.subtotal is distinct from old.subtotal
       or new.shipping_cost is distinct from old.shipping_cost
       or new.discount_amount is distinct from old.discount_amount
       or new.commission_amount is distinct from old.commission_amount
       or new.total_amount is distinct from old.total_amount
       or new.currency_id is distinct from old.currency_id
       or new.payment_reference is distinct from old.payment_reference
       or new.wallet_transaction_id is distinct from old.wallet_transaction_id
       or new.idempotency_key is distinct from old.idempotency_key
       or new.order_number <> old.order_number then
      raise exception 'Order identity and financial fields cannot be modified directly';
    end if;
  end if;

  return new;
end;
$function$


CREATE OR REPLACE FUNCTION public.marketplace_protect_return_fields()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  if public.is_super_admin() then
    return new;
  end if;

  if tg_op = 'UPDATE' then
    if new.order_id <> old.order_id
       or new.buyer_id <> old.buyer_id
       or new.seller_id <> old.seller_id
       or new.admin_notes is distinct from old.admin_notes
       or new.resolved_at is distinct from old.resolved_at
       or new.return_status is distinct from old.return_status then
      raise exception 'Return identity/resolution fields cannot be modified directly';
    end if;
  end if;

  return new;
end;
$function$


CREATE OR REPLACE FUNCTION public.marketplace_protect_seller_system_fields()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  if public.is_super_admin() then
    return new;
  end if;

  if tg_op = 'UPDATE' then
    if new.user_id <> old.user_id
       or new.total_sales is distinct from old.total_sales
       or new.rating_average is distinct from old.rating_average
       or new.rating_count is distinct from old.rating_count
       or new.commission_rate is distinct from old.commission_rate
       or new.is_verified is distinct from old.is_verified
       or new.is_featured is distinct from old.is_featured then
      raise exception 'Seller system fields cannot be modified directly';
    end if;
  end if;

  return new;
end;
$function$


CREATE OR REPLACE FUNCTION public.marketplace_set_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$


CREATE OR REPLACE FUNCTION public.marketplace_sync_cart_item_price()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare
  v_price numeric;
  v_currency uuid;
  v_status marketplace_listing_status;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  if new.quantity <= 0 then
    raise exception 'Quantity must be greater than zero';
  end if;

  select price, currency_id, listing_status
    into v_price, v_currency, v_status
  from public.marketplace_listings
  where id = new.listing_id
  for share;

  if not found or v_status <> 'published' then
    raise exception 'Listing is not available';
  end if;

  new.unit_price := v_price;
  new.currency_id := v_currency;
  new.updated_at := now();
  return new;
end;
$function$


CREATE OR REPLACE FUNCTION public.pay_get_or_create_wallet(p_currency_id uuid, p_organization_id uuid DEFAULT NULL::uuid)
 RETURNS wallets
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare
  v_wallet public.wallets;
  v_user uuid := auth.uid();
begin
  if v_user is null then
    raise exception 'Authentification requise';
  end if;

  if p_currency_id is null then
    raise exception 'Devise obligatoire';
  end if;

  if p_organization_id is not null
     and not (
       public.is_super_admin()
       or public.is_org_member(p_organization_id)
     ) then
    raise exception 'Organisation non autorisée';
  end if;

  select *
    into v_wallet
  from public.wallets
  where user_id = v_user
    and currency_id = p_currency_id
    and (
      (p_organization_id is null and organization_id is null)
      or organization_id = p_organization_id
    )
  for update;

  if found then
    return v_wallet;
  end if;

  insert into public.wallets (
    user_id, organization_id, currency_id,
    balance, available_balance, pending_balance, wallet_status
  )
  values (
    v_user, p_organization_id, p_currency_id,
    0, 0, 0, 'active'
  )
  returning * into v_wallet;

  return v_wallet;
exception
  when unique_violation then
    select *
      into v_wallet
    from public.wallets
    where user_id = v_user
      and currency_id = p_currency_id
      and (
        (p_organization_id is null and organization_id is null)
        or organization_id = p_organization_id
      );
    if found then
      return v_wallet;
    end if;
    raise;
end;
$function$


CREATE OR REPLACE FUNCTION public.pay_post_wallet_transaction(p_wallet_id uuid, p_transaction_type transaction_type, p_amount numeric, p_reference text, p_description text DEFAULT NULL::text, p_external_reference text DEFAULT NULL::text, p_provider text DEFAULT NULL::text, p_provider_transaction_id text DEFAULT NULL::text, p_transaction_status transaction_status DEFAULT 'completed'::transaction_status, p_fee_amount numeric DEFAULT 0, p_metadata jsonb DEFAULT '{}'::jsonb)
 RETURNS wallet_transactions
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare
  v_wallet public.wallets;
  v_tx public.wallet_transactions;
  v_before numeric;
  v_after numeric;
  v_delta numeric;
  v_fee numeric := coalesce(p_fee_amount,0);
  v_internal boolean := coalesce(current_setting('jdv.pay_internal', true),'') = '1';
begin
  if auth.uid() is null then
    raise exception 'Authentification requise';
  end if;

  if p_amount is null or p_amount <= 0 then
    raise exception 'Le montant doit être supérieur à zéro';
  end if;

  if p_reference is null or btrim(p_reference) = '' then
    raise exception 'Référence obligatoire';
  end if;

  if v_fee < 0 then
    raise exception 'Les frais ne peuvent pas être négatifs';
  end if;

  if p_transaction_type in ('deposit','transfer_in','refund','cashback','adjustment')
     and not v_internal then
    raise exception 'Cette opération JDV PAY doit être créée par un service interne';
  end if;

  select * into v_wallet
  from public.wallets
  where id = p_wallet_id
    and user_id = auth.uid()
  for update;

  if not found then
    raise exception 'Portefeuille introuvable ou non autorisé';
  end if;

  if v_wallet.wallet_status <> 'active' then
    raise exception 'Portefeuille non actif';
  end if;

  select * into v_tx
  from public.wallet_transactions
  where reference = p_reference
  limit 1;

  if found then
    if v_tx.wallet_id <> p_wallet_id
       or v_tx.amount <> p_amount
       or v_tx.transaction_type <> p_transaction_type then
      raise exception 'Référence déjà utilisée avec une opération différente';
    end if;
    return v_tx;
  end if;

  if p_transaction_type in ('deposit','transfer_in','refund','cashback','adjustment') then
    v_delta := p_amount;
  elsif p_transaction_type in ('withdrawal','payment','transfer_out','fee') then
    v_delta := -(p_amount + v_fee);
  elsif p_transaction_type = 'reversed' then
    raise exception 'Utiliser refund ou une opération inverse explicite pour une reprise de fonds';
  else
    raise exception 'Type de transaction non pris en charge pour une variation de solde';
  end if;

  v_before := coalesce(v_wallet.balance,0);
  v_after := v_before + v_delta;

  if v_after < 0 then
    raise exception 'Solde insuffisant';
  end if;

  insert into public.wallet_transactions (
    wallet_id, transaction_type, amount, currency_id,
    balance_before, balance_after, fee_amount, reference,
    external_reference, provider, provider_transaction_id,
    transaction_status, description, metadata
  )
  values (
    v_wallet.id, p_transaction_type, p_amount, v_wallet.currency_id,
    v_before, v_after, v_fee, p_reference,
    p_external_reference, p_provider, p_provider_transaction_id,
    p_transaction_status, p_description, coalesce(p_metadata,'{}'::jsonb)
  )
  returning * into v_tx;

  update public.wallets
  set balance = v_after,
      available_balance = case
        when p_transaction_status = 'completed'
        then greatest(0, coalesce(available_balance,0) + v_delta)
        else available_balance
      end,
      updated_at = now()
  where id = v_wallet.id;

  insert into public.audit_logs(user_id,module_code,action,entity_type,entity_id,new_data)
  values (
    auth.uid(),'jdv_pay','wallet.transaction_posted','wallet_transactions',
    v_tx.id::text,
    jsonb_build_object(
      'wallet_id',v_wallet.id,
      'transaction_type',p_transaction_type,
      'amount',p_amount,
      'currency_id',v_wallet.currency_id,
      'status',p_transaction_status,
      'reference',p_reference
    )
  );

  return v_tx;
end;
$function$


CREATE OR REPLACE FUNCTION public.protect_prospect_assignment()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
begin
  if tg_op='UPDATE'
     and old.assigned_prospecteur_id is distinct from new.assigned_prospecteur_id
     and old.assigned_prospecteur_id is not null then

    if not (
      public.crm_is_business_privileged(new.business_id)
      or public.is_super_admin()
    ) then
      raise exception 'Réattribution de prospect non autorisée';
    end if;

    insert into public.audit_logs
      (user_id,organization_id,module_code,action,entity_type,entity_id,old_data,new_data)
    values
      (auth.uid(),null,'crm','prospect.reassigned','crm_prospects',new.id::text,
       jsonb_build_object('assigned_prospecteur_id',old.assigned_prospecteur_id),
       jsonb_build_object('assigned_prospecteur_id',new.assigned_prospecteur_id));
  end if;
  return new;
end;
$function$


CREATE OR REPLACE FUNCTION public.tontine_apply_late_penalties(p_cycle_id uuid)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare v_cycle public.tontine_cycles; v_tontine public.tontines; v_president uuid; v_count integer:=0;
begin
  select * into v_cycle from public.tontine_cycles where id=p_cycle_id for update;
  if not found then raise exception 'CYCLE_NOT_FOUND'; end if;
  select * into v_tontine from public.tontines where id=v_cycle.tontine_id;
  select m.user_id into v_president from public.tontine_members m where m.id=v_tontine.president_member_id;
  if not(public.is_super_admin() or auth.uid()=v_president) then raise exception 'PRESIDENT_ONLY'; end if;

  update public.tontine_contribution_schedules
  set status='late',late_fee_amount=v_tontine.late_fee_amount,late_marked_at=now(),updated_at=now()
  where cycle_id=p_cycle_id and due_on<current_date and status in('due','partially_paid') and late_marked_at is null;
  get diagnostics v_count=row_count;
  return v_count;
end $function$


CREATE OR REPLACE FUNCTION public.tontine_approve_member(p_member_id uuid, p_approve boolean)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
begin
  raise exception 'MEMBER_APPROVAL_DISABLED_USE_JOIN_LINK';
end;
$function$


CREATE OR REPLACE FUNCTION public.tontine_claim_due_dispatch(p_dispatch_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare d public.tontine_payout_dispatches%rowtype;
begin
  if coalesce(current_setting('request.jwt.claim.role', true),'') <> 'service_role' then
    raise exception 'SYSTEM_ONLY_TONTINE_DISPATCH';
  end if;

  update public.tontine_payout_dispatches
  set status='processing',
      attempts=attempts+1,
      processing_at=coalesce(processing_at,now()),
      updated_at=now()
  where id=p_dispatch_id
    and status='queued'
    and (next_attempt_at is null or next_attempt_at <= now())
  returning * into d;

  if not found then
    return jsonb_build_object('claimed',false,'reason','NOT_QUEUED_OR_ALREADY_CLAIMED');
  end if;

  update public.tontine_payouts
  set status='processing', updated_at=now()
  where id=d.payout_id
    and status in ('pending','approved','processing');

  return jsonb_build_object(
    'claimed',true,
    'dispatch_id',d.id,
    'payout_id',d.payout_id,
    'phone',d.beneficiary_phone,
    'amount',d.amount,
    'provider_code',d.provider_code,
    'idempotency_key',d.idempotency_key
  );
end;
$function$


CREATE OR REPLACE FUNCTION public.tontine_confirm_dispatch(p_dispatch_id uuid, p_provider_reference text, p_provider_request_id text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare d public.tontine_payout_dispatches%rowtype; rec jsonb;
begin
  if coalesce(current_setting('request.jwt.claim.role',true),'')<>'service_role'
     and session_user<>'postgres' then
    raise exception 'SYSTEM_ONLY_TONTINE_DISPATCH'; 
  end if;

  select * into d
  from public.tontine_payout_dispatches
  where id=p_dispatch_id
  for update;

  if not found then raise exception 'DISPATCH_NOT_FOUND'; end if;

  if d.status='confirmed' and d.reconciliation_status='matched' then
    return jsonb_build_object('ok',true,'idempotent',true,'dispatch_id',d.id);
  end if;

  if d.reconciliation_status<>'matched' then
    raise exception 'PAYOUT_NOT_RECONCILED';
  end if;

  rec:=public.tontine_reconcile_dispatch(
    d.id,p_provider_reference,p_provider_request_id,
    d.provider_amount,d.provider_currency_code,d.provider_status,d.provider_payload_hash
  );

  if coalesce((rec->>'ok')::boolean,false)=false then
    raise exception 'PAYOUT_RECONCILIATION_FAILED';
  end if;

  update public.tontine_payout_dispatches
  set status='confirmed',
      provider_reference=coalesce(p_provider_reference,provider_reference),
      provider_request_id=coalesce(p_provider_request_id,provider_request_id),
      confirmed_at=coalesce(confirmed_at,now()),
      updated_at=now()
  where id=d.id;

  update public.tontine_payouts
  set status='paid',
      paid_at=coalesce(paid_at,now()),
      provider_reference=coalesce(p_provider_reference,provider_reference),
      updated_at=now()
  where id=d.payout_id;

  update public.tontine_rotations
  set status='paid',
      effective_payout_on=coalesce(effective_payout_on,current_date),
      updated_at=now()
  where id=d.rotation_id;

  return jsonb_build_object('ok',true,'dispatch_id',d.id,'payout_id',d.payout_id,'rotation_id',d.rotation_id);
end $function$


CREATE OR REPLACE FUNCTION public.tontine_create(p_organization_id uuid, p_country_id uuid, p_currency_id uuid, p_name text, p_description text, p_contribution_amount numeric, p_frequency text, p_cycle_periods integer, p_member_limit integer, p_starts_on date, p_late_fee_amount numeric DEFAULT 0, p_rules jsonb DEFAULT '{}'::jsonb)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare v_id uuid;
begin
 if auth.uid() is null then raise exception 'AUTH_REQUIRED'; end if;
 if not public.is_org_admin(p_organization_id) and not public.is_super_admin() then raise exception 'NOT_AUTHORIZED'; end if;
 insert into public.tontines(organization_id,country_id,currency_id,name,description,contribution_amount,frequency,cycle_periods,member_limit,starts_on,late_fee_amount,rules,created_by)
 values(p_organization_id,p_country_id,p_currency_id,trim(p_name),p_description,p_contribution_amount,p_frequency,p_cycle_periods,p_member_limit,p_starts_on,p_late_fee_amount,coalesce(p_rules,'{}'),auth.uid())
 returning id into v_id;
 insert into public.tontine_members(tontine_id,user_id,role,membership_status,joined_at,approved_by,approved_at)
 values(v_id,auth.uid(),'owner','active',now(),auth.uid(),now());
 insert into public.audit_logs(user_id,organization_id,module_code,action,entity_type,entity_id,new_data)
 values(auth.uid(),p_organization_id,'jdv_tontine','create','tontine',v_id::text,jsonb_build_object('name',trim(p_name),'status','draft'));
 return v_id;
end $function$


CREATE OR REPLACE FUNCTION public.tontine_create_group(p_organization_id uuid, p_country_id uuid, p_currency_id uuid, p_name text, p_description text, p_contribution_amount numeric, p_frequency text, p_cycle_periods integer, p_member_limit integer, p_starts_on date, p_late_fee_amount numeric DEFAULT 0, p_rules jsonb DEFAULT '{}'::jsonb, p_link_expires_at timestamp with time zone DEFAULT NULL::timestamp with time zone)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare v_tontine uuid; v_president_member uuid; v_token text;
begin
  if auth.uid() is null then raise exception 'AUTH_REQUIRED'; end if;
  if not public.is_org_member(p_organization_id) and not public.is_super_admin() then raise exception 'ORGANIZATION_MEMBERSHIP_REQUIRED'; end if;
  if p_contribution_amount<=0 then raise exception 'INVALID_CONTRIBUTION_AMOUNT'; end if;
  if p_member_limit<2 then raise exception 'INVALID_MEMBER_LIMIT'; end if;
  if p_late_fee_amount<0 then raise exception 'INVALID_LATE_FEE'; end if;

  insert into public.tontines(organization_id,country_id,currency_id,name,description,contribution_amount,frequency,cycle_periods,member_limit,starts_on,late_fee_amount,rules,created_by)
  values(p_organization_id,p_country_id,p_currency_id,trim(p_name),p_description,p_contribution_amount,p_frequency,p_cycle_periods,p_member_limit,p_starts_on,p_late_fee_amount,coalesce(p_rules,'{}'::jsonb),auth.uid())
  returning id into v_tontine;

  insert into public.tontine_members(tontine_id,user_id,role,membership_status,joined_at,approved_by,approved_at,rules_accepted_at,rules_version,identity_confirmed_at,identity_confirmation_method)
  values(v_tontine,auth.uid(),'owner','active',now(),auth.uid(),now(),now(),'1.0',now(),'authenticated_account')
  returning id into v_president_member;

  update public.tontines set president_member_id=v_president_member where id=v_tontine;
  v_token:=encode(gen_random_bytes(32),'hex');

  insert into public.tontine_join_links(tontine_id,token_hash,status,expires_at,created_by,rules_version)
  values(v_tontine,encode(digest(v_token,'sha256'),'hex'),'active',p_link_expires_at,auth.uid(),'1.0');

  insert into public.audit_logs(user_id,organization_id,module_code,action,entity_type,entity_id,new_data)
  values(auth.uid(),p_organization_id,'jdv_tontine','create_group','tontine',v_tontine::text,
    jsonb_build_object('president_member_id',v_president_member,'member_validation','join_link_identity_rules','president_controls','group_creation,collection_program,late_penalty','payout_control','system_only'));

  return jsonb_build_object('tontine_id',v_tontine,'president_member_id',v_president_member,'join_token',v_token,'join_path','/tontine/join/'||v_token,'rules_version','1.0','expires_at',p_link_expires_at);
end $function$


CREATE OR REPLACE FUNCTION public.tontine_credit_beneficiary_wallet(p_user_id uuid, p_organization_id uuid, p_currency_id uuid, p_amount numeric, p_reference text, p_description text, p_metadata jsonb DEFAULT '{}'::jsonb)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare
  v_wallet public.wallets;
  v_tx public.wallet_transactions;
  v_before numeric;
  v_after numeric;
begin
  if p_user_id is null or p_currency_id is null or p_amount is null or p_amount <= 0 then
    raise exception 'Paramètres financiers invalides';
  end if;

  select * into v_wallet
  from public.wallets
  where user_id = p_user_id
    and currency_id = p_currency_id
    and organization_id = p_organization_id
  for update;

  if not found then
    insert into public.wallets (
      user_id, organization_id, currency_id,
      balance, available_balance, pending_balance, wallet_status
    )
    values (p_user_id, p_organization_id, p_currency_id, 0, 0, 0, 'active')
    returning * into v_wallet;
  end if;

  if v_wallet.wallet_status <> 'active' then
    raise exception 'Portefeuille bénéficiaire non actif';
  end if;

  select * into v_tx
  from public.wallet_transactions
  where reference = p_reference
  limit 1;

  if found then
    if v_tx.wallet_id <> v_wallet.id
       or v_tx.amount <> p_amount
       or v_tx.transaction_type <> 'transfer_in'::public.transaction_type then
      raise exception 'Référence de versement déjà utilisée avec une opération différente';
    end if;
    return v_tx.id;
  end if;

  v_before := coalesce(v_wallet.balance,0);
  v_after := v_before + p_amount;

  insert into public.wallet_transactions (
    wallet_id, transaction_type, amount, currency_id,
    balance_before, balance_after, fee_amount,
    reference, transaction_status, description, metadata
  )
  values (
    v_wallet.id, 'transfer_in'::public.transaction_type, p_amount, v_wallet.currency_id,
    v_before, v_after, 0, p_reference, 'completed'::public.transaction_status,
    p_description, coalesce(p_metadata,'{}'::jsonb)
  )
  returning * into v_tx;

  update public.wallets
  set balance = v_after,
      available_balance = coalesce(available_balance,0) + p_amount,
      updated_at = now()
  where id = v_wallet.id;

  return v_tx.id;
exception
  when unique_violation then
    select * into v_tx
    from public.wallet_transactions
    where reference = p_reference
    limit 1;

    if found
       and v_tx.wallet_id = v_wallet.id
       and v_tx.amount = p_amount
       and v_tx.transaction_type = 'transfer_in'::public.transaction_type then
      return v_tx.id;
    end if;
    raise;
end;
$function$


CREATE OR REPLACE FUNCTION public.tontine_dashboard(p_tontine_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare
  v_org uuid;
  v_user uuid := auth.uid();
  v_cycle jsonb;
  v_result jsonb;
begin
  select organization_id into v_org
  from public.tontines where id=p_tontine_id;

  if v_org is null then raise exception 'TONTINE_NOT_FOUND'; end if;
  if not public.is_org_member(v_org) and not public.is_super_admin()
    then raise exception 'NOT_AUTHORIZED'; end if;

  if not exists(
    select 1 from public.tontine_members
    where tontine_id=p_tontine_id and user_id=v_user
      and membership_status in ('active','approved')
  ) and not public.is_org_admin(v_org) and not public.is_super_admin()
    then raise exception 'NOT_TONTINE_MEMBER'; end if;

  select jsonb_build_object(
    'id',c.id,
    'cycle_number',c.cycle_number,
    'starts_on',c.starts_on,
    'ends_on',c.ends_on,
    'status',c.status,
    'total_expected',c.total_expected,
    'total_collected',c.total_collected,
    'remaining',greatest(c.total_expected-c.total_collected,0),
    'collection_rate',case when c.total_expected>0 then round((c.total_collected/c.total_expected)*100,2) else 0 end
  )
  into v_cycle
  from public.tontine_cycles c
  where c.tontine_id=p_tontine_id
  order by c.cycle_number desc limit 1;

  select jsonb_build_object(
    'tontine',(select to_jsonb(t) from public.tontines t where t.id=p_tontine_id),
    'current_cycle',v_cycle,
    'members',(select count(*) from public.tontine_members where tontine_id=p_tontine_id and membership_status='active'),
    'members_pending',(select count(*) from public.tontine_members where tontine_id=p_tontine_id and membership_status='pending'),
    'cycles_total',(select count(*) from public.tontine_cycles where tontine_id=p_tontine_id),
    'cycles_closed',(select count(*) from public.tontine_cycles where tontine_id=p_tontine_id and status='closed'),
    'expected_total',coalesce((select sum(total_expected) from public.tontine_cycles where tontine_id=p_tontine_id),0),
    'collected_total',coalesce((select sum(total_collected) from public.tontine_cycles where tontine_id=p_tontine_id),0),
    'outstanding_total',coalesce((
      select sum(s.expected_amount-coalesce((
        select sum(tc.amount) from public.tontine_contributions tc
        where tc.schedule_id=s.id and tc.status='confirmed'
      ),0))
      from public.tontine_contribution_schedules s
      join public.tontine_cycles c on c.id=s.cycle_id
      where c.tontine_id=p_tontine_id
        and s.status in ('due','partially_paid','late')
    ),0),
    'late_schedules',(select count(*) from public.tontine_contribution_schedules s
      join public.tontine_cycles c on c.id=s.cycle_id
      where c.tontine_id=p_tontine_id and s.status='late'),
    'paid_schedules',(select count(*) from public.tontine_contribution_schedules s
      join public.tontine_cycles c on c.id=s.cycle_id
      where c.tontine_id=p_tontine_id and s.status='paid'),
    'payouts_pending',(select count(*) from public.tontine_payout_dispatches d
      where d.tontine_id=p_tontine_id and d.status in ('queued','processing')),
    'payouts_sent',(select count(*) from public.tontine_payout_dispatches d
      where d.tontine_id=p_tontine_id and d.status in ('sent','confirmed')),
    'payouts_failed',(select count(*) from public.tontine_payout_dispatches d
      where d.tontine_id=p_tontine_id and d.status='failed'),
    'next_beneficiary',(select jsonb_build_object(
      'member_id',r.member_id,'order',r.rotation_order,
      'date',r.planned_payout_on,'amount',r.expected_amount,
      'phone',r.beneficiary_phone,'status',r.status)
      from public.tontine_rotations r
      join public.tontine_cycles c on c.id=r.cycle_id
      where c.tontine_id=p_tontine_id
        and r.status in ('planned','eligible','approved')
      order by r.planned_payout_on nulls last,r.rotation_order limit 1),
    'next_cycles',(select count(*) from public.tontine_cycles c
      where c.tontine_id=p_tontine_id and c.status in ('planned','open','active'))
  ) into v_result;

  return v_result;
end
$function$


CREATE OR REPLACE FUNCTION public.tontine_generate_payout(p_rotation_id uuid, p_amount numeric)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare
  v_rotation public.tontine_rotations;
  v_cycle public.tontine_cycles;
  v_tontine public.tontines;
  v_member public.tontine_members;
  v_payout_id uuid;
  v_wallet_tx_id uuid;
  v_collected numeric;
  v_paid numeric;
  v_reference text;
  v_actor uuid := auth.uid();
begin
  if current_user <> 'service_role' then
    raise exception 'SYSTEM_ONLY_PAYOUT_DISPATCH';
  end if;

  select r.* into v_rotation from public.tontine_rotations r
  where r.id=p_rotation_id for update;
  if not found then raise exception 'ROTATION_NOT_FOUND'; end if;

  select c.* into v_cycle from public.tontine_cycles c where c.id=v_rotation.cycle_id for update;
  select t.* into v_tontine from public.tontines t where t.id=v_cycle.tontine_id for update;

  if p_amount is null or p_amount <> v_rotation.expected_amount then
    raise exception 'PAYOUT_AMOUNT_MUST_EQUAL_SCHEDULED_AMOUNT';
  end if;

  if v_rotation.status not in ('planned','eligible','approved') then
    raise exception 'ROTATION_NOT_PAYABLE';
  end if;

  select m.* into v_member
  from public.tontine_members m
  where m.id=v_rotation.member_id
    and m.tontine_id=v_tontine.id
    and m.membership_status='active'
    and m.identity_confirmed_at is not null
  for update;
  if not found then raise exception 'BENEFICIARY_IDENTITY_NOT_CONFIRMED'; end if;

  v_collected:=coalesce(v_cycle.total_collected,0);

  select coalesce(sum(tp.amount),0) into v_paid
  from public.tontine_payouts tp
  join public.tontine_rotations rr on rr.id=tp.rotation_id
  where rr.cycle_id=v_cycle.id and tp.status in ('approved','processing','paid');

  if v_paid+p_amount>v_collected then raise exception 'INSUFFICIENT_COLLECTED_FUNDS'; end if;

  if exists(select 1 from public.tontine_payouts where rotation_id=v_rotation.id) then
    select id into v_payout_id from public.tontine_payouts
    where rotation_id=v_rotation.id limit 1;
    return v_payout_id;
  end if;

  v_reference:='TONTINE-PAYOUT-'||replace(v_rotation.id::text,'-','');

  v_wallet_tx_id:=public.tontine_credit_beneficiary_wallet(
    v_member.user_id,v_tontine.organization_id,v_tontine.currency_id,p_amount,
    v_reference,'Versement automatique tontine '||v_tontine.name,
    jsonb_build_object(
      'module','jdv_tontine','tontine_id',v_tontine.id,
      'cycle_id',v_cycle.id,'rotation_id',v_rotation.id,'automatic',true
    )
  );

  insert into public.tontine_payouts(
    rotation_id,beneficiary_member_id,amount,currency_id,status,
    approved_by,approved_at,paid_at,wallet_transaction_id,beneficiary_phone,metadata
  )
  values(
    v_rotation.id,v_member.id,p_amount,v_tontine.currency_id,'paid',
    null,null,now(),v_wallet_tx_id,v_rotation.beneficiary_phone,
    jsonb_build_object(
      'payment_channel','jdv_pay_wallet',
      'automatic',true,
      'beneficiary_user_id',v_member.user_id,
      'beneficiary_phone',v_rotation.beneficiary_phone,
      'wallet_transaction_id',v_wallet_tx_id
    )
  )
  returning id into v_payout_id;

  update public.tontine_rotations
  set status='paid',effective_payout_on=current_date
  where id=v_rotation.id;

  insert into public.audit_logs(
    user_id,organization_id,module_code,action,entity_type,entity_id,new_data
  )
  values(
    v_actor,v_tontine.organization_id,'jdv_tontine','system_payout',
    'tontine_payout',v_payout_id::text,
    jsonb_build_object(
      'rotation_id',v_rotation.id,
      'beneficiary_user_id',v_member.user_id,
      'beneficiary_phone',v_rotation.beneficiary_phone,
      'amount',p_amount,'currency_id',v_tontine.currency_id,
      'wallet_transaction_id',v_wallet_tx_id,'automatic',true
    )
  );

  return v_payout_id;
end;
$function$


CREATE OR REPLACE FUNCTION public.tontine_join_by_link(p_join_token text, p_accept_rules boolean)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare
  v_user uuid := auth.uid();
  v_link public.tontine_join_links;
  v_tontine public.tontines;
  v_member uuid;
  v_phone text;
  v_phone_confirmed timestamptz;
  v_existing boolean;
  v_member_count integer;
begin
  if v_user is null then raise exception 'AUTH_REQUIRED'; end if;
  if coalesce(trim(p_join_token),'')='' then raise exception 'INVALID_JOIN_LINK'; end if;
  if not p_accept_rules then raise exception 'RULES_ACCEPTANCE_REQUIRED'; end if;

  select * into v_link
  from public.tontine_join_links
  where token_hash=encode(digest(trim(p_join_token),'sha256'),'hex')
    and status='active'
    and (expires_at is null or expires_at > now())
  for update;

  if not found then raise exception 'INVALID_OR_EXPIRED_JOIN_LINK'; end if;

  select * into v_tontine
  from public.tontines
  where id=v_link.tontine_id
  for update;

  if v_tontine.status in ('cancelled','completed') then
    raise exception 'TONTINE_CLOSED';
  end if;

  select phone,phone_confirmed_at into v_phone,v_phone_confirmed
  from auth.users where id=v_user;

  if coalesce(v_phone,'')='' then raise exception 'PHONE_REQUIRED_FOR_TONTINE_IDENTITY'; end if;
  if v_phone_confirmed is null then raise exception 'PHONE_IDENTITY_NOT_CONFIRMED'; end if;

  select exists(
    select 1 from public.tontine_members
    where tontine_id=v_tontine.id and user_id=v_user
  ) into v_existing;

  select count(*) into v_member_count
  from public.tontine_members
  where tontine_id=v_tontine.id
    and membership_status in ('active','pending');

  if not v_existing and v_member_count >= v_tontine.member_limit then
    raise exception 'MEMBER_LIMIT_REACHED';
  end if;

  insert into public.tontine_members(
    tontine_id,user_id,role,membership_status,joined_at,
    rules_accepted_at,rules_version,identity_confirmed_at,identity_confirmation_method
  )
  values(
    v_tontine.id,v_user,'member','active',now(),
    now(),v_link.rules_version,now(),'verified_phone_auth'
  )
  on conflict(tontine_id,user_id) do update
  set membership_status='active',
      rules_accepted_at=now(),
      rules_version=v_link.rules_version,
      identity_confirmed_at=now(),
      identity_confirmation_method='verified_phone_auth',
      updated_at=now()
  returning id into v_member;

  update public.tontine_join_links
  set uses_count=uses_count+case when not v_existing then 1 else 0 end,
      accepted_by=v_user,
      accepted_at=now(),
      status=case
        when max_uses is not null and uses_count+case when not v_existing then 1 else 0 end >= max_uses
          then 'used'
        else 'active'
      end,
      updated_at=now()
  where id=v_link.id;

  insert into public.audit_logs(
    user_id,organization_id,module_code,action,entity_type,entity_id,new_data
  )
  values(
    v_user,v_tontine.organization_id,'jdv_tontine','join_by_link',
    'tontine_member',v_member::text,
    jsonb_build_object(
      'tontine_id',v_tontine.id,
      'identity_confirmed',true,
      'rules_accepted',true,
      'rules_version',v_link.rules_version,
      'shared_group_link',true
    )
  );

  return v_member;
end;
$function$


CREATE OR REPLACE FUNCTION public.tontine_open_cycle(p_tontine_id uuid, p_starts_on date, p_ends_on date)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare v_id uuid; v_president uuid; v_org uuid; v_num integer; v_member_count integer; v_amount numeric; v_periods integer; v_frequency text;
begin
  select t.organization_id,t.contribution_amount,t.cycle_periods,t.frequency,tm.user_id into v_org,v_amount,v_periods,v_frequency,v_president
  from public.tontines t join public.tontine_members tm on tm.id=t.president_member_id
  where t.id=p_tontine_id and tm.membership_status='active';
  if v_org is null then raise exception 'TONTINE_NOT_FOUND'; end if;
  if not(public.is_super_admin() or auth.uid()=v_president) then raise exception 'PRESIDENT_ONLY'; end if;
  if p_ends_on<p_starts_on then raise exception 'INVALID_CYCLE_DATES'; end if;

  select count(*) into v_member_count from public.tontine_members where tontine_id=p_tontine_id and membership_status='active';
  if v_member_count<2 then raise exception 'MINIMUM_MEMBERS_REQUIRED'; end if;
  select coalesce(max(cycle_number),0)+1 into v_num from public.tontine_cycles where tontine_id=p_tontine_id;

  insert into public.tontine_cycles(tontine_id,cycle_number,starts_on,ends_on,status,total_expected)
  values(p_tontine_id,v_num,p_starts_on,p_ends_on,'open',v_amount*v_member_count*v_periods) returning id into v_id;

  insert into public.tontine_contribution_schedules(cycle_id,member_id,period_number,due_on,expected_amount)
  select v_id,tm.id,g,p_starts_on+case when v_frequency='daily' then g-1 when v_frequency='weekly' then 7*(g-1) when v_frequency='biweekly' then 14*(g-1) else 30*(g-1) end,v_amount
  from public.tontine_members tm cross join generate_series(1,v_periods) g
  where tm.tontine_id=p_tontine_id and tm.membership_status='active';

  insert into public.tontine_rotations(cycle_id,member_id,rotation_order,planned_payout_on,expected_amount,beneficiary_phone)
  select v_id,tm.id,row_number() over(order by tm.joined_at,tm.created_at,tm.id)::int,
    p_starts_on+case when v_frequency='daily' then row_number() over(order by tm.joined_at,tm.created_at,tm.id)::int-1
      when v_frequency='weekly' then 7*(row_number() over(order by tm.joined_at,tm.created_at,tm.id)::int-1)
      when v_frequency='biweekly' then 14*(row_number() over(order by tm.joined_at,tm.created_at,tm.id)::int-1)
      else 30*(row_number() over(order by tm.joined_at,tm.created_at,tm.id)::int-1) end,
    v_amount*v_member_count,p.phone
  from public.tontine_members tm join public.profiles p on p.id=tm.user_id
  where tm.tontine_id=p_tontine_id and tm.membership_status='active';

  insert into public.audit_logs(user_id,organization_id,module_code,action,entity_type,entity_id,new_data)
  values(auth.uid(),v_org,'jdv_tontine','open_cycle','tontine_cycle',v_id::text,jsonb_build_object('cycle_number',v_num,'president',true));
  return v_id;
end $function$


CREATE OR REPLACE FUNCTION public.tontine_open_next_cycle_system(p_tontine_id uuid, p_previous_cycle_id uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare
  v_prev public.tontine_cycles;
  v_t public.tontines;
  v_id uuid;
  v_num integer;
  v_members integer;
  v_start date;
  v_end date;
  v_duration integer;
begin
  if current_user <> 'service_role' then
    raise exception 'SYSTEM_ONLY_TONTINE_ENGINE';
  end if;

  select * into v_prev
  from public.tontine_cycles
  where id=p_previous_cycle_id and tontine_id=p_tontine_id
  for update;

  if not found then raise exception 'PREVIOUS_CYCLE_NOT_FOUND'; end if;
  if v_prev.status <> 'closed' then raise exception 'PREVIOUS_CYCLE_NOT_CLOSED'; end if;

  select * into v_t
  from public.tontines
  where id=p_tontine_id
  for update;

  if not found then raise exception 'TONTINE_NOT_FOUND'; end if;
  if v_t.status not in ('open','active','paused') then
    return null;
  end if;

  if exists (
    select 1 from public.tontine_cycles
    where tontine_id=p_tontine_id and starts_on=v_prev.ends_on+1
  ) then
    select id into v_id from public.tontine_cycles
    where tontine_id=p_tontine_id and starts_on=v_prev.ends_on+1
    order by cycle_number desc limit 1;
    return v_id;
  end if;

  select count(*) into v_members
  from public.tontine_members
  where tontine_id=p_tontine_id and membership_status='active';

  if v_members < 2 then
    raise exception 'MINIMUM_MEMBERS_REQUIRED_FOR_NEXT_CYCLE';
  end if;

  v_start := v_prev.ends_on + 1;
  v_duration := greatest(0, v_prev.ends_on - v_prev.starts_on);
  v_end := v_start + v_duration;

  select coalesce(max(cycle_number),0)+1
  into v_num
  from public.tontine_cycles
  where tontine_id=p_tontine_id;

  insert into public.tontine_cycles(
    tontine_id,cycle_number,starts_on,ends_on,status,total_expected,total_collected
  )
  values(
    p_tontine_id,v_num,v_start,v_end,
    case when v_start <= current_date then 'active' else 'open' end,
    v_t.contribution_amount*v_members*v_t.cycle_periods,0
  )
  returning id into v_id;

  insert into public.tontine_contribution_schedules(
    cycle_id,member_id,period_number,due_on,expected_amount,late_fee_amount
  )
  select
    v_id,tm.id,g,
    v_start + case
      when v_t.frequency='daily' then g-1
      when v_t.frequency='weekly' then 7*(g-1)
      when v_t.frequency='biweekly' then 14*(g-1)
      else 30*(g-1)
    end,
    v_t.contribution_amount,
    v_t.late_fee_amount
  from public.tontine_members tm
  cross join generate_series(1,v_t.cycle_periods) g
  where tm.tontine_id=p_tontine_id
    and tm.membership_status='active';

  insert into public.tontine_rotations(
    cycle_id,member_id,rotation_order,planned_payout_on,expected_amount,beneficiary_phone
  )
  select
    v_id,tm.id,
    row_number() over(order by tm.joined_at,tm.created_at,tm.id)::int,
    v_start + case
      when v_t.frequency='daily' then row_number() over(order by tm.joined_at,tm.created_at,tm.id)::int-1
      when v_t.frequency='weekly' then 7*(row_number() over(order by tm.joined_at,tm.created_at,tm.id)::int-1)
      when v_t.frequency='biweekly' then 14*(row_number() over(order by tm.joined_at,tm.created_at,tm.id)::int-1)
      else 30*(row_number() over(order by tm.joined_at,tm.created_at,tm.id)::int-1)
    end,
    v_t.contribution_amount*v_members,
    p.phone
  from public.tontine_members tm
  join public.profiles p on p.id=tm.user_id
  where tm.tontine_id=p_tontine_id
    and tm.membership_status='active';

  insert into public.audit_logs(
    user_id,organization_id,module_code,action,entity_type,entity_id,new_data
  )
  values(
    v_t.created_by,v_t.organization_id,'jdv_tontine','automatic_next_cycle',
    'tontine_cycle',v_id::text,
    jsonb_build_object(
      'previous_cycle_id',p_previous_cycle_id,
      'cycle_number',v_num,
      'starts_on',v_start,
      'ends_on',v_end,
      'automatic',true
    )
  );

  return v_id;
end
$function$


CREATE OR REPLACE FUNCTION public.tontine_process_due_operations()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare
  v_today date:=current_date;
  v_t record; v_c record;
  v_late integer:=0; v_eligible integer:=0; v_closed integer:=0; v_next integer:=0;
  v_late_one integer; v_eligible_one integer; v_id uuid;
begin
  if coalesce(current_setting('request.jwt.claim.role',true),'')<>'service_role'
     and session_user<>'postgres' then
    raise exception 'SYSTEM_ONLY_TONTINE_ENGINE';
  end if;

  for v_t in select id from public.tontines where status in('open','active','paused') loop
    update public.tontines
    set status='active',updated_at=now()
    where id=v_t.id and status='open' and starts_on<=v_today;

    update public.tontine_contribution_schedules s
    set status='late',
        late_marked_at=coalesce(late_marked_at,now()),
        late_fee_amount=case
          when coalesce(s.late_fee_amount,0)>0 then s.late_fee_amount
          else coalesce((
            select t.late_fee_amount
            from public.tontines t
            join public.tontine_cycles c on c.tontine_id=t.id
            where c.id=s.cycle_id
          ),0)
        end,
        penalty_status=case
          when coalesce(s.late_fee_amount,0)>0
               or coalesce((
                 select t.late_fee_amount
                 from public.tontines t
                 join public.tontine_cycles c on c.tontine_id=t.id
                 where c.id=s.cycle_id
               ),0)>0 then 'due'
          else 'not_due'
        end,
        updated_at=now()
    where s.cycle_id in(select id from public.tontine_cycles where tontine_id=v_t.id)
      and s.due_on<v_today
      and s.status in('due','partially_paid');

    get diagnostics v_late_one=row_count;
    v_late:=v_late+coalesce(v_late_one,0);

    for v_c in
      select * from public.tontine_cycles
      where tontine_id=v_t.id and status in('open','active')
      order by cycle_number
    loop
      update public.tontine_cycles c
      set total_expected=coalesce((
            select sum(expected_amount)
            from public.tontine_contribution_schedules
            where cycle_id=c.id and status<>'cancelled'
          ),0),
          total_collected=coalesce((
            select sum(coalesce((tc.metadata->>'principal_allocated')::numeric,0))
            from public.tontine_contributions tc
            join public.tontine_contribution_schedules s on s.id=tc.schedule_id
            where s.cycle_id=c.id and tc.status='confirmed'
          ),0),
          updated_at=now()
      where c.id=v_c.id;

      update public.tontine_rotations r
      set status='eligible',updated_at=now()
      where r.cycle_id=v_c.id
        and r.status='planned'
        and r.planned_payout_on<=v_today
        and r.member_id in(
          select id from public.tontine_members
          where tontine_id=v_t.id
            and membership_status='active'
            and identity_confirmed_at is not null
        )
        and coalesce(r.beneficiary_phone,'')<>''
        and not exists(select 1 from public.tontine_payouts p where p.rotation_id=r.id)
        and (select total_collected from public.tontine_cycles where id=v_c.id)>=r.expected_amount
        and not exists(
          select 1
          from public.tontine_contribution_schedules s
          where s.cycle_id=r.cycle_id
            and s.member_id=r.member_id
            and (
              s.status in('due','partially_paid','late')
              or s.penalty_status in('due','partially_paid')
            )
        );

      get diagnostics v_eligible_one=row_count;
      v_eligible:=v_eligible+coalesce(v_eligible_one,0);

      if v_c.ends_on<v_today
         and not exists(
           select 1 from public.tontine_contribution_schedules s
           where s.cycle_id=v_c.id
             and (
               s.status in('due','partially_paid','late')
               or s.penalty_status in('due','partially_paid')
             )
         )
         and not exists(
           select 1 from public.tontine_rotations r
           where r.cycle_id=v_c.id
             and r.status not in('paid','skipped','cancelled')
         )
      then
        update public.tontine_cycles
        set status='closed',updated_at=now()
        where id=v_c.id;

        v_closed:=v_closed+1;

        begin
          v_id:=public.tontine_open_next_cycle_system(v_t.id,v_c.id);
          if v_id is not null then v_next:=v_next+1; end if;
        exception when others then
          insert into public.audit_logs(
            user_id,organization_id,module_code,action,entity_type,entity_id,new_data
          )
          select null,t.organization_id,'jdv_tontine','next_cycle_open_failed','tontine_cycle',v_c.id::text,
                 jsonb_build_object('error',sqlerrm)
          from public.tontines t where t.id=v_t.id;
        end;
      end if;
    end loop;
  end loop;

  return jsonb_build_object(
    'processed_at',now(),
    'schedules_marked_late',v_late,
    'rotations_marked_eligible',v_eligible,
    'cycles_closed',v_closed,
    'next_cycles_opened',v_next
  );
end $function$


CREATE OR REPLACE FUNCTION public.tontine_program_collection(p_cycle_id uuid, p_rotation_plan jsonb)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare v_cycle public.tontine_cycles; v_tontine public.tontines; v_president uuid; v_item jsonb; v_count integer; v_phone text;
begin
  select * into v_cycle from public.tontine_cycles where id=p_cycle_id for update;
  if not found then raise exception 'CYCLE_NOT_FOUND'; end if;
  select * into v_tontine from public.tontines where id=v_cycle.tontine_id for update;
  select m.user_id into v_president from public.tontine_members m where m.id=v_tontine.president_member_id;
  if not(public.is_super_admin() or auth.uid()=v_president) then raise exception 'PRESIDENT_ONLY'; end if;
  if v_cycle.status not in ('planned','open','active') then raise exception 'CYCLE_NOT_PROGRAMMABLE'; end if;
  if exists(select 1 from public.tontine_payouts tp join public.tontine_rotations r on r.id=tp.rotation_id where r.cycle_id=p_cycle_id) then raise exception 'COLLECTION_PROGRAM_LOCKED_AFTER_PAYOUT'; end if;
  if jsonb_typeof(p_rotation_plan)<>'array' then raise exception 'INVALID_ROTATION_PLAN'; end if;

  select count(*) into v_count from public.tontine_rotations where cycle_id=p_cycle_id;
  if jsonb_array_length(p_rotation_plan)<>v_count then raise exception 'ROTATION_PLAN_MEMBER_COUNT_MISMATCH'; end if;

  for v_item in select * from jsonb_array_elements(p_rotation_plan) loop
    if not(v_item?'member_id' and v_item?'rotation_order' and v_item?'planned_payout_on') then raise exception 'INVALID_ROTATION_PLAN_ITEM'; end if;
    select p.phone into v_phone from public.tontine_members tm join public.profiles p on p.id=tm.user_id
    where tm.id=(v_item->>'member_id')::uuid and tm.tontine_id=v_tontine.id and tm.membership_status='active';
    if not found then raise exception 'INVALID_ROTATION_MEMBER'; end if;

    update public.tontine_rotations r
    set rotation_order=(v_item->>'rotation_order')::integer,planned_payout_on=(v_item->>'planned_payout_on')::date,beneficiary_phone=v_phone,updated_at=now()
    where r.cycle_id=p_cycle_id and r.member_id=(v_item->>'member_id')::uuid;
    if not found then raise exception 'ROTATION_MEMBER_NOT_FOUND'; end if;
  end loop;

  if (select count(*) from public.tontine_rotations where cycle_id=p_cycle_id and rotation_order is not null)<>v_count then raise exception 'INCOMPLETE_ROTATION_PLAN'; end if;

  insert into public.audit_logs(user_id,organization_id,module_code,action,entity_type,entity_id,new_data)
  values(auth.uid(),v_tontine.organization_id,'jdv_tontine','program_collection','tontine_cycle',p_cycle_id::text,jsonb_build_object('rotation_plan',p_rotation_plan));
  return true;
end $function$


CREATE OR REPLACE FUNCTION public.tontine_queue_due_payouts()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare r record; n integer:=0; pid uuid;
begin
  if coalesce(current_setting('request.jwt.claim.role',true),'')<>'service_role'
     and session_user<>'postgres' then
    raise exception 'SYSTEM_ONLY_PAYOUT_QUEUE';
  end if;

  for r in
    select rot.*,cy.tontine_id,cy.total_collected,cy.status as cycle_status,
           t.currency_id as tontine_currency_id,
           tm.user_id,tm.membership_status,tm.identity_confirmed_at
    from public.tontine_rotations rot
    join public.tontine_cycles cy on cy.id=rot.cycle_id
    join public.tontines t on t.id=cy.tontine_id
    join public.tontine_members tm on tm.id=rot.member_id
    where rot.status='eligible'
      and rot.planned_payout_on<=current_date
      and cy.status in ('open','active')
      and t.status in('open','active','paused')
      and cy.total_collected>=rot.expected_amount
      and not exists(select 1 from public.tontine_payouts p where p.rotation_id=rot.id)
      and coalesce(rot.beneficiary_phone,'')<>''
      and tm.membership_status='active'
      and tm.identity_confirmed_at is not null
      and not exists(
        select 1
        from public.tontine_contribution_schedules s
        where s.cycle_id=rot.cycle_id
          and s.member_id=rot.member_id
          and (
            s.status in('due','partially_paid','late')
            or s.penalty_status in('due','partially_paid')
          )
      )
    for update of rot skip locked
  loop
    begin
      insert into public.tontine_payouts(
        rotation_id,beneficiary_member_id,amount,currency_id,status,beneficiary_phone,metadata
      )
      values(
        r.id,r.member_id,r.expected_amount,r.tontine_currency_id,'processing',
        r.beneficiary_phone,jsonb_build_object('source','system_scheduler')
      )
      returning id into pid;

      insert into public.tontine_payout_dispatches(
        payout_id,rotation_id,tontine_id,beneficiary_member_id,beneficiary_user_id,
        beneficiary_phone,amount,currency_id,provider_code,idempotency_key,status,
        queued_at,next_attempt_at,reconciliation_status
      )
      values(
        pid,r.id,r.tontine_id,r.member_id,r.user_id,r.beneficiary_phone,
        r.expected_amount,r.tontine_currency_id,'fedapay',
        'TONTINE-DISPATCH-'||replace(r.id::text,'-',''),'queued',now(),now(),'pending'
      );

      update public.tontine_rotations set status='approved',updated_at=now() where id=r.id;
      n:=n+1;
    exception when unique_violation then
      -- A concurrent worker already created the payout/dispatch.
      null;
    end;
  end loop;

  return n;
end $function$


CREATE OR REPLACE FUNCTION public.tontine_reconcile_dispatch(p_dispatch_id uuid, p_provider_reference text, p_provider_request_id text DEFAULT NULL::text, p_provider_amount numeric DEFAULT NULL::numeric, p_provider_currency_code text DEFAULT NULL::text, p_provider_status text DEFAULT NULL::text, p_provider_payload_hash text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare d public.tontine_payout_dispatches%rowtype; expected_code text;
begin
  if coalesce(current_setting('request.jwt.claim.role',true),'')<>'service_role'
     and session_user<>'postgres' then
    raise exception 'SYSTEM_ONLY_TONTINE_RECONCILIATION';
  end if;

  select * into d
  from public.tontine_payout_dispatches
  where id=p_dispatch_id
  for update;

  if not found then raise exception 'DISPATCH_NOT_FOUND'; end if;

  select c.code into expected_code
  from public.currencies c
  where c.id=d.currency_id;

  update public.tontine_payout_dispatches
  set provider_reference=coalesce(p_provider_reference,provider_reference),
      provider_request_id=coalesce(p_provider_request_id,provider_request_id),
      provider_amount=coalesce(p_provider_amount,provider_amount),
      provider_currency_code=coalesce(p_provider_currency_code,provider_currency_code),
      provider_status=coalesce(p_provider_status,provider_status),
      provider_payload_hash=coalesce(p_provider_payload_hash,provider_payload_hash),
      updated_at=now()
  where id=d.id;

  if p_provider_amount is not null and p_provider_amount<>d.amount then
    update public.tontine_payout_dispatches
    set reconciliation_status='mismatch',updated_at=now()
    where id=d.id;
    return jsonb_build_object('ok',false,'status','mismatch','reason','AMOUNT_MISMATCH','expected_amount',d.amount,'provider_amount',p_provider_amount);
  end if;

  if p_provider_currency_code is not null
     and upper(p_provider_currency_code)<>upper(coalesce(expected_code,'')) then
    update public.tontine_payout_dispatches
    set reconciliation_status='mismatch',updated_at=now()
    where id=d.id;
    return jsonb_build_object('ok',false,'status','mismatch','reason','CURRENCY_MISMATCH','expected_currency',expected_code,'provider_currency',p_provider_currency_code);
  end if;

  insert into public.tontine_financial_reconciliations(
    tontine_id,cycle_id,payout_id,dispatch_id,reconciliation_type,direction,
    expected_amount,actual_amount,currency_id,status,provider_code,
    provider_reference,source_reference,metadata,reconciled_at
  )
  select d.tontine_id,p.cycle_id,d.payout_id,d.id,'payout','debit',
         d.amount,coalesce(p_provider_amount,d.amount),d.currency_id,'matched',
         d.provider_code,coalesce(p_provider_reference,d.provider_reference),
         d.idempotency_key,
         jsonb_build_object('provider_status',p_provider_status,'provider_request_id',coalesce(p_provider_request_id,d.provider_request_id),'payload_hash',coalesce(p_provider_payload_hash,d.provider_payload_hash)),
         now()
  from public.tontine_payouts p
  join public.tontine_rotations r on r.id=d.rotation_id
  join public.tontine_cycles cy on cy.id=r.cycle_id
  where p.id=d.payout_id
  on conflict (dispatch_id,reconciliation_type) do update
  set actual_amount=excluded.actual_amount,
      status='matched',
      provider_reference=excluded.provider_reference,
      metadata=excluded.metadata,
      reconciled_at=now();

  update public.tontine_payout_dispatches
  set reconciliation_status='matched',reconciled_at=now(),updated_at=now()
  where id=d.id;

  return jsonb_build_object('ok',true,'status','matched','dispatch_id',d.id);
end $function$


CREATE OR REPLACE FUNCTION public.tontine_record_contribution(p_schedule_id uuid, p_amount numeric, p_currency_id uuid, p_wallet_transaction_id uuid DEFAULT NULL::uuid, p_payment_request_id uuid DEFAULT NULL::uuid, p_external_reference text DEFAULT NULL::text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare
  v_user uuid:=auth.uid();
  v_s public.tontine_contribution_schedules;
  v_m public.tontine_members;
  v_c public.tontine_cycles;
  v_t public.tontines;
  v_tx public.wallet_transactions;
  v_req public.payment_requests;
  v_id uuid;
  v_principal_paid numeric:=0;
  v_principal_remaining numeric:=0;
  v_penalty_remaining numeric:=0;
  v_principal_part numeric:=0;
  v_penalty_part numeric:=0;
begin
  if v_user is null then raise exception 'Authentification requise'; end if;
  if p_amount is null or p_amount<=0 then raise exception 'Le montant de la contribution doit être supérieur à zéro'; end if;

  select * into v_s from public.tontine_contribution_schedules where id=p_schedule_id for update;
  if not found then raise exception 'Échéance de tontine introuvable'; end if;

  select * into v_m from public.tontine_members where id=v_s.member_id and user_id=v_user for update;
  if not found or v_m.membership_status<>'active' then raise exception 'Échéance non autorisée pour cet utilisateur'; end if;

  select * into v_c from public.tontine_cycles where id=v_s.cycle_id for update;
  select * into v_t from public.tontines where id=v_c.tontine_id for update;

  if v_t.status not in ('open','active') then raise exception 'Tontine non ouverte aux contributions'; end if;
  if p_currency_id<>v_t.currency_id then raise exception 'La devise de la contribution ne correspond pas à la tontine'; end if;

  v_principal_paid:=coalesce((
    select sum(coalesce((tc.metadata->>'principal_allocated')::numeric,0))
    from public.tontine_contributions tc
    where tc.schedule_id=v_s.id and tc.status='confirmed'
  ),0);

  v_principal_remaining:=greatest(0,v_s.expected_amount-v_principal_paid);
  v_penalty_remaining:=greatest(0,coalesce(v_s.late_fee_amount,0)-coalesce(v_s.penalty_paid_amount,0));

  if p_amount > v_principal_remaining+v_penalty_remaining then
    raise exception 'Le montant dépasse le solde de l échéance et de la pénalité';
  end if;

  -- A confirmed contribution must be backed by a completed JDV PAY debit.
  -- External references are intentionally not accepted as proof of funds.
  if p_wallet_transaction_id is null then
    raise exception 'PAIEMENT_JDV_PAY_REQUIS';
  end if;

  select wt.* into v_tx
  from public.wallet_transactions wt
  join public.wallets w on w.id=wt.wallet_id
  where wt.id=p_wallet_transaction_id and w.user_id=v_user
  for update;

  if not found then raise exception 'Transaction JDV PAY introuvable ou non autorisée'; end if;
  if v_tx.transaction_status<>'completed'::public.transaction_status then raise exception 'La transaction JDV PAY doit être terminée'; end if;
  if v_tx.transaction_type not in ('withdrawal'::public.transaction_type,'payment'::public.transaction_type,'transfer_out'::public.transaction_type) then raise exception 'La transaction JDV PAY fournie ne correspond pas à un débit'; end if;
  if v_tx.amount<>p_amount or v_tx.currency_id<>v_t.currency_id then raise exception 'Montant ou devise de la transaction JDV PAY incorrect'; end if;

  if exists(select 1 from public.tontine_contributions where wallet_transaction_id=v_tx.id) then
    raise exception 'Cette transaction JDV PAY est déjà affectée à une contribution de tontine';
  end if;

  if p_payment_request_id is not null then
    select * into v_req from public.payment_requests where id=p_payment_request_id for update;
    if not found or v_req.paid_transaction_id<>v_tx.id or v_req.paid_by_user_id<>v_user or v_req.request_status<>'paid'::public.payment_request_status then
      raise exception 'La demande de paiement ne correspond pas à la transaction JDV PAY';
    end if;
  end if;

  v_principal_part:=least(p_amount,v_principal_remaining);
  v_penalty_part:=p_amount-v_principal_part;

  if v_penalty_part>0 and v_s.late_fee_amount<=0 then
    raise exception 'Aucune pénalité n est due sur cette échéance';
  end if;

  insert into public.tontine_contributions(
    schedule_id,member_id,amount,currency_id,paid_at,payment_method,
    wallet_transaction_id,payment_request_id,external_reference,status,created_by,metadata
  )
  values(
    v_s.id,v_m.id,p_amount,v_t.currency_id,now(),'jdv_pay',
    p_wallet_transaction_id,p_payment_request_id,p_external_reference,'confirmed',v_user,
    jsonb_build_object(
      'source','jdv_pay_tontine',
      'principal_allocated',v_principal_part,
      'penalty_allocated',v_penalty_part,
      'verified_wallet_transaction',true
    )
  ) returning id into v_id;

  update public.tontine_contribution_schedules
  set penalty_paid_amount=coalesce(penalty_paid_amount,0)+v_penalty_part,
      penalty_status=case
        when coalesce(penalty_paid_amount,0)+v_penalty_part >= coalesce(late_fee_amount,0) and coalesce(late_fee_amount,0)>0 then 'paid'
        when coalesce(penalty_paid_amount,0)+v_penalty_part>0 then 'partially_paid'
        when coalesce(late_fee_amount,0)>0 then 'due'
        else 'not_due'
      end,
      status=case
        when v_principal_paid+v_principal_part >= v_s.expected_amount then 'paid'
        when v_principal_paid+v_principal_part>0 then 'partially_paid'
        when v_s.status='late' then 'late'
        else v_s.status
      end,
      updated_at=now()
  where id=v_s.id;

  update public.tontine_cycles
  set total_collected=coalesce((
    select sum(coalesce((tc.metadata->>'principal_allocated')::numeric,0))
    from public.tontine_contributions tc
    join public.tontine_contribution_schedules ts on ts.id=tc.schedule_id
    where ts.cycle_id=v_c.id and tc.status='confirmed'
  ),0),
  updated_at=now()
  where id=v_c.id;

  update public.tontine_members
  set contribution_count=coalesce(contribution_count,0)+1,updated_at=now()
  where id=v_m.id;

  insert into public.tontine_financial_reconciliations(
    tontine_id,cycle_id,contribution_id,reconciliation_type,direction,
    expected_amount,actual_amount,difference,currency_id,status,
    provider_code,provider_reference,source_reference,metadata,reconciled_at
  )
  values(
    v_t.id,v_c.id,v_id,'contribution','credit',
    v_principal_part,v_principal_part,0,v_t.currency_id,'matched',
    coalesce(v_tx.provider,'jdv_pay'),coalesce(v_tx.provider_transaction_id,v_tx.reference),
    'TONTINE-CONTRIBUTION-'||replace(v_id::text,'-','')||'-PRINCIPAL',
    jsonb_build_object('wallet_transaction_id',v_tx.id),
    now()
  );

  if v_penalty_part>0 then
    insert into public.tontine_financial_reconciliations(
      tontine_id,cycle_id,contribution_id,reconciliation_type,direction,
      expected_amount,actual_amount,difference,currency_id,status,
      provider_code,provider_reference,source_reference,metadata,reconciled_at
    )
    values(
      v_t.id,v_c.id,v_id,'penalty','credit',
      v_penalty_part,v_penalty_part,0,v_t.currency_id,'matched',
      coalesce(v_tx.provider,'jdv_pay'),coalesce(v_tx.provider_transaction_id,v_tx.reference),
      'TONTINE-CONTRIBUTION-'||replace(v_id::text,'-','')||'-PENALTY',
      jsonb_build_object('wallet_transaction_id',v_tx.id),
      now()
    );
  end if;

  insert into public.audit_logs(user_id,organization_id,module_code,action,entity_type,entity_id,new_data)
  values(v_user,v_t.organization_id,'jdv_tontine','contribution_confirmed','tontine_contribution',v_id::text,
    jsonb_build_object('schedule_id',v_s.id,'amount',p_amount,'principal_allocated',v_principal_part,
      'penalty_allocated',v_penalty_part,'currency_id',v_t.currency_id,
      'wallet_transaction_id',p_wallet_transaction_id));

  return v_id;
end;
$function$


CREATE OR REPLACE FUNCTION public.tontine_record_dispatch_failure(p_dispatch_id uuid, p_error text, p_retry_after_minutes integer DEFAULT 15)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare d public.tontine_payout_dispatches%rowtype;
begin
  if coalesce(current_setting('request.jwt.claim.role', true),'') <> 'service_role' then
    raise exception 'SYSTEM_ONLY_TONTINE_DISPATCH';
  end if;

  update public.tontine_payout_dispatches
  set status=case when attempts >= 5 then 'failed' else 'queued' end,
      last_error=left(coalesce(p_error,'UNKNOWN_PROVIDER_ERROR'),2000),
      failed_at=case when attempts >= 5 then now() else failed_at end,
      next_attempt_at=case when attempts >= 5 then null else now()+make_interval(mins=>greatest(1,coalesce(p_retry_after_minutes,15))) end,
      updated_at=now()
  where id=p_dispatch_id
  returning * into d;

  if not found then raise exception 'DISPATCH_NOT_FOUND'; end if;

  if d.status='failed' then
    update public.tontine_payouts
    set status='failed', updated_at=now()
    where id=d.payout_id;
  else
    update public.tontine_payouts
    set status='pending', updated_at=now()
    where id=d.payout_id;
  end if;

  return jsonb_build_object('ok',true,'status',d.status,'attempts',d.attempts);
end;
$function$


CREATE OR REPLACE FUNCTION public.tontine_record_dispatch_sent(p_dispatch_id uuid, p_provider_request_id text, p_provider_reference text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare d public.tontine_payout_dispatches%rowtype;
begin
  if coalesce(current_setting('request.jwt.claim.role', true),'') <> 'service_role' then
    raise exception 'SYSTEM_ONLY_TONTINE_DISPATCH';
  end if;

  update public.tontine_payout_dispatches
  set status='sent',
      provider_request_id=coalesce(p_provider_request_id,provider_request_id),
      provider_reference=coalesce(p_provider_reference,provider_reference),
      sent_at=coalesce(sent_at,now()),
      last_error=null,
      updated_at=now()
  where id=p_dispatch_id
  returning * into d;

  if not found then raise exception 'DISPATCH_NOT_FOUND'; end if;

  update public.tontine_payouts
  set status='processing',
      provider_reference=coalesce(p_provider_reference,provider_reference),
      updated_at=now()
  where id=d.payout_id;

  return jsonb_build_object('ok',true,'dispatch_id',d.id);
end;
$function$


CREATE OR REPLACE FUNCTION public.tontine_request_membership(p_tontine_id uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
begin
  raise exception 'DIRECT_MEMBERSHIP_DISABLED_USE_JOIN_LINK';
end;
$function$


CREATE OR REPLACE FUNCTION public.tontine_reverse_dispatch(p_dispatch_id uuid, p_provider_reference text, p_provider_request_id text DEFAULT NULL::text, p_returned_amount numeric DEFAULT NULL::numeric, p_provider_currency_code text DEFAULT NULL::text, p_reason text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare
  v_dispatch public.tontine_payout_dispatches;
  v_payout public.tontine_payouts;
  v_rotation public.tontine_rotations;
  v_expected numeric;
  v_actual numeric;
  v_currency_code text;
  v_diff numeric;
  v_recon_status text;
begin
  if coalesce(auth.role(),'') <> 'service_role' then
    raise exception 'SYSTEM_ONLY_TONTINE_REVERSAL';
  end if;

  select * into v_dispatch
  from public.tontine_payout_dispatches
  where id=p_dispatch_id
  for update;

  if not found then raise exception 'DISPATCH_NOT_FOUND'; end if;

  if v_dispatch.status='reversed' or v_dispatch.reconciliation_status='reversed' then
    return jsonb_build_object('ok',true,'already_reversed',true,'dispatch_id',v_dispatch.id);
  end if;

  if v_dispatch.status <> 'confirmed' then
    raise exception 'ONLY_CONFIRMED_PAYOUT_CAN_BE_REVERSED';
  end if;

  if coalesce(trim(p_provider_reference),'')='' then
    raise exception 'PROVIDER_REFERENCE_REQUIRED_FOR_REVERSAL';
  end if;

  select * into v_payout
  from public.tontine_payouts
  where id=v_dispatch.payout_id
  for update;

  select * into v_rotation
  from public.tontine_rotations
  where id=v_dispatch.rotation_id
  for update;

  select c.code into v_currency_code
  from public.currencies c
  where c.id=v_dispatch.currency_id;

  v_expected:=v_dispatch.amount;
  v_actual:=coalesce(p_returned_amount,v_expected);
  v_diff:=v_actual-v_expected;

  if p_provider_currency_code is not null
     and upper(trim(p_provider_currency_code)) <> upper(coalesce(v_currency_code,'')) then
    v_recon_status:='mismatch';
  elsif v_actual <> v_expected then
    v_recon_status:='mismatch';
  else
    v_recon_status:='matched';
  end if;

  update public.tontine_payout_dispatches
  set provider_reference=coalesce(p_provider_reference,provider_reference),
      provider_request_id=coalesce(p_provider_request_id,provider_request_id),
      provider_amount=v_actual,
      provider_currency_code=coalesce(p_provider_currency_code,v_currency_code),
      provider_status='reversed',
      reconciliation_status='reversed',
      reversed_at=now(),
      last_error=coalesce(p_reason,last_error),
      updated_at=now(),
      status='reversed'
  where id=v_dispatch.id;

  update public.tontine_payouts
  set status='reversed',
      provider_reference=coalesce(p_provider_reference,provider_reference),
      updated_at=now()
  where id=v_payout.id;

  if v_recon_status='matched' then
    insert into public.tontine_financial_reconciliations(
      tontine_id,cycle_id,payout_id,dispatch_id,reconciliation_type,direction,
      expected_amount,actual_amount,difference,currency_id,status,provider_code,
      provider_reference,source_reference,metadata,reconciled_at
    )
    values(
      v_dispatch.tontine_id,
      v_rotation.cycle_id,
      v_payout.id,
      v_dispatch.id,
      'reversal','credit',
      v_expected,v_actual,v_diff,v_dispatch.currency_id,'reversed',
      v_dispatch.provider_code,p_provider_reference,
      'TONTINE-REVERSAL-'||replace(v_dispatch.id::text,'-',''),
      jsonb_build_object('reason',p_reason,'provider_request_id',p_provider_request_id),
      now()
    )
    on conflict (dispatch_id,reconciliation_type)
    where reconciliation_type in ('contribution','penalty','payout','reversal','adjustment')
    do update set
      actual_amount=excluded.actual_amount,
      difference=excluded.difference,
      status='reversed',
      provider_reference=excluded.provider_reference,
      metadata=excluded.metadata,
      reconciled_at=now();
  else
    insert into public.tontine_financial_reconciliations(
      tontine_id,cycle_id,payout_id,dispatch_id,reconciliation_type,direction,
      expected_amount,actual_amount,difference,currency_id,status,provider_code,
      provider_reference,source_reference,metadata
    )
    values(
      v_dispatch.tontine_id,
      v_rotation.cycle_id,
      v_payout.id,
      v_dispatch.id,
      'reversal','credit',
      v_expected,v_actual,v_diff,v_dispatch.currency_id,'mismatch',
      v_dispatch.provider_code,p_provider_reference,
      'TONTINE-REVERSAL-'||replace(v_dispatch.id::text,'-',''),
      jsonb_build_object('reason',p_reason,'provider_request_id',p_provider_request_id,
                         'provider_currency_code',p_provider_currency_code)
    )
    on conflict (dispatch_id,reconciliation_type)
    where reconciliation_type in ('contribution','penalty','payout','reversal','adjustment')
    do update set
      actual_amount=excluded.actual_amount,
      difference=excluded.difference,
      status='mismatch',
      provider_reference=excluded.provider_reference,
      metadata=excluded.metadata;
  end if;

  if v_recon_status='matched' then
    update public.tontine_rotations
    set status='eligible',
        effective_payout_on=null,
        updated_at=now()
    where id=v_rotation.id;
  end if;

  insert into public.audit_logs(
    user_id,organization_id,module_code,action,entity_type,entity_id,new_data
  )
  select null,t.organization_id,'jdv_tontine','payout_reversed',
         'tontine_payout_dispatch',v_dispatch.id::text,
         jsonb_build_object(
           'payout_id',v_payout.id,
           'rotation_id',v_rotation.id,
           'provider_reference',p_provider_reference,
           'expected_amount',v_expected,
           'actual_returned_amount',v_actual,
           'reconciliation_status',v_recon_status,
           'reason',p_reason
         )
  from public.tontines t
  where t.id=v_dispatch.tontine_id;

  return jsonb_build_object(
    'ok',true,
    'dispatch_id',v_dispatch.id,
    'payout_id',v_payout.id,
    'rotation_id',v_rotation.id,
    'reconciliation_status',v_recon_status,
    'retry_eligible',(v_recon_status='matched')
  );
end;
$function$


CREATE OR REPLACE FUNCTION public.transit_accept_quote(p_quote_id uuid)
 RETURNS transit_operations
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare
  v_quote public.transit_quotes;
  v_operation public.transit_operations;
begin
  if auth.uid() is null then raise exception 'Authentification requise'; end if;

  select * into v_quote
  from public.transit_quotes
  where id=p_quote_id
  for update;

  if not found then raise exception 'Devis introuvable'; end if;

  if v_quote.client_user_id <> auth.uid()
     and not public.user_has_business_access(v_quote.business_id)
     and not public.is_super_admin() then
    raise exception 'Accès refusé';
  end if;

  if v_quote.operation_id is not null then
    select * into v_operation
    from public.transit_operations
    where id=v_quote.operation_id;

    if found then return v_operation; end if;
  end if;

  if v_quote.quote_status not in ('sent','viewed') then
    raise exception 'Le devis ne peut pas être accepté dans son état actuel';
  end if;

  if v_quote.valid_until is not null and v_quote.valid_until < now() then
    raise exception 'Le devis est expiré';
  end if;

  insert into public.transit_operations
    (client_user_id,business_id,operation_type,case_status)
  values
    (v_quote.client_user_id,v_quote.business_id,'international','submitted')
  returning * into v_operation;

  update public.transit_quotes
  set quote_status='accepted',
      operation_id=v_operation.id,
      updated_at=now()
  where id=p_quote_id;

  insert into public.audit_logs
    (user_id,module_code,action,entity_type,entity_id,new_data)
  values
    (auth.uid(),'transit','quote.accepted','transit_quotes',
     p_quote_id::text,jsonb_build_object('operation_id',v_operation.id));

  return v_operation;
end;
$function$


CREATE OR REPLACE FUNCTION public.transit_add_tracking_event(p_shipment_id uuid, p_status text, p_location text DEFAULT NULL::text, p_comment text DEFAULT NULL::text, p_source_reference text DEFAULT NULL::text)
 RETURNS transit_tracking_events
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare
  v_shipment public.transit_shipments;
  v_event public.transit_tracking_events;
  v_new_status public.transit_tracking_status;
  v_latest_status public.transit_tracking_status;
begin
  if auth.uid() is null then raise exception 'Authentification requise'; end if;
  if p_status is null or trim(p_status)='' then raise exception 'Statut de suivi requis'; end if;

  begin
    v_new_status := p_status::public.transit_tracking_status;
  exception when invalid_text_representation then
    raise exception 'Statut de suivi invalide';
  end;

  select * into v_shipment
  from public.transit_shipments
  where id=p_shipment_id
  for update;

  if not found then raise exception 'Expédition introuvable'; end if;

  if not public.transit_has_shipment_access(p_shipment_id)
     and not public.is_super_admin() then
    raise exception 'Accès refusé';
  end if;

  if p_source_reference is not null then
    select * into v_event
    from public.transit_tracking_events
    where shipment_id=p_shipment_id
      and event_status=v_new_status
      and source_reference=p_source_reference
    limit 1;

    if found then return v_event; end if;
  end if;

  select event_status into v_latest_status
  from public.transit_tracking_events
  where shipment_id=p_shipment_id
  order by created_at desc
  limit 1;

  if v_latest_status is not null
     and enum_range(null::public.transit_tracking_status) @> array[v_new_status]
     and (
       array_position(enum_range(null::public.transit_tracking_status), v_new_status)
       < array_position(enum_range(null::public.transit_tracking_status), v_latest_status)
     ) then
    raise exception 'Le suivi ne peut pas revenir à un statut antérieur';
  end if;

  insert into public.transit_tracking_events
    (shipment_id,event_status,location,comment,actor_user_id,source_reference)
  values
    (p_shipment_id,v_new_status,p_location,p_comment,auth.uid(),p_source_reference)
  returning * into v_event;

  insert into public.audit_logs
    (user_id,module_code,action,entity_type,entity_id,new_data)
  values
    (auth.uid(),'transit','tracking.event_added','transit_tracking_events',
     v_event.id::text,
     jsonb_build_object(
       'shipment_id',p_shipment_id,
       'status',v_new_status,
       'source_reference',p_source_reference
     ));

  return v_event;
end;
$function$


CREATE OR REPLACE FUNCTION public.transit_audit_operation_status()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.case_status IS DISTINCT FROM NEW.case_status THEN
    INSERT INTO public.audit_logs (user_id, module_code, action, entity_type, entity_id, old_data, new_data)
    VALUES (auth.uid(), 'transit', 'operation.status_changed', 'transit_operations', NEW.id::text,
      jsonb_build_object('status', OLD.case_status), jsonb_build_object('status', NEW.case_status));
  END IF;
  RETURN NEW;
END;
$function$


CREATE OR REPLACE FUNCTION public.transit_has_operation_access(p_operation_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.transit_operations o
    WHERE o.id = p_operation_id
      AND (o.client_user_id = auth.uid()
           OR o.responsible_user_id = auth.uid()
           OR (o.business_id IS NOT NULL AND public.user_has_business_access(o.business_id)))
  ) OR public.is_super_admin();
$function$


CREATE OR REPLACE FUNCTION public.transit_has_shipment_access(p_shipment_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT public.transit_has_operation_access(operation_id) FROM public.transit_shipments WHERE id = p_shipment_id;
$function$


CREATE OR REPLACE FUNCTION public.transit_protect_invoice_financial_fields()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
begin
  if public.is_super_admin() or current_setting('jdv.transit_internal',true)='1' then return new; end if;
  if tg_op='UPDATE' then
    if new.business_id is distinct from old.business_id
       or new.client_user_id is distinct from old.client_user_id
       or new.operation_id is distinct from old.operation_id
       or new.invoice_number is distinct from old.invoice_number
       or new.amount is distinct from old.amount
       or new.currency_id is distinct from old.currency_id
       or new.wallet_transaction_id is distinct from old.wallet_transaction_id
       or new.invoice_status is distinct from old.invoice_status then
      raise exception 'Champs financiers de la facture protégés';
    end if;
  end if;
  return new;
end $function$


CREATE OR REPLACE FUNCTION public.transit_protect_operation_system_fields()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
begin
  if public.is_super_admin() or current_setting('jdv.transit_internal',true)='1' then return new; end if;
  if tg_op='UPDATE' then
    if new.client_user_id is distinct from old.client_user_id
       or new.business_id is distinct from old.business_id
       or new.reference is distinct from old.reference
       or new.case_status is distinct from old.case_status
       or new.responsible_user_id is distinct from old.responsible_user_id
       or new.operation_type is distinct from old.operation_type
       or new.origin_country_id is distinct from old.origin_country_id
       or new.destination_country_id is distinct from old.destination_country_id then
      raise exception 'Champs système de l''opération protégés';
    end if;
  end if;
  return new;
end $function$


CREATE OR REPLACE FUNCTION public.transit_protect_quote_system_fields()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
begin
  if public.is_super_admin() or current_setting('jdv.transit_internal',true)='1' then return new; end if;
  if tg_op='UPDATE' then
    if new.business_id is distinct from old.business_id
       or new.client_user_id is distinct from old.client_user_id
       or new.operation_id is distinct from old.operation_id
       or new.total_amount is distinct from old.total_amount
       or new.currency_id is distinct from old.currency_id
       or new.created_by is distinct from old.created_by then
      raise exception 'Champs système du devis protégés';
    end if;
  end if;
  return new;
end $function$


CREATE OR REPLACE FUNCTION public.transit_protect_request_system_fields()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
begin
  if public.is_super_admin() or current_setting('jdv.transit_internal',true)='1' then return new; end if;
  if tg_op='UPDATE' then
    if new.requester_user_id is distinct from old.requester_user_id
       or new.assigned_business_id is distinct from old.assigned_business_id
       or new.crm_prospect_id is distinct from old.crm_prospect_id
       or new.request_status is distinct from old.request_status then
      raise exception 'Champs système de la demande protégés';
    end if;
  end if;
  return new;
end $function$


CREATE OR REPLACE FUNCTION public.transit_protect_shipment_system_fields()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
begin
  if public.is_super_admin() or current_setting('jdv.transit_internal',true)='1' then return new; end if;
  if tg_op='UPDATE' then
    if new.reference is distinct from old.reference
       or new.operation_id is distinct from old.operation_id
       or new.shipper_user_id is distinct from old.shipper_user_id
       or new.origin_location_id is distinct from old.origin_location_id
       or new.destination_location_id is distinct from old.destination_location_id
       or new.declared_value is distinct from old.declared_value
       or new.currency_id is distinct from old.currency_id
       or new.case_status is distinct from old.case_status then
      raise exception 'Champs système de l''expédition protégés';
    end if;
  end if;
  return new;
end $function$


CREATE OR REPLACE FUNCTION public.transit_protect_tracking_system_fields()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
begin
  if public.is_super_admin() or current_setting('jdv.transit_internal',true)='1' then return new; end if;
  if tg_op='UPDATE' then
    if new.shipment_id is distinct from old.shipment_id
       or new.actor_user_id is distinct from old.actor_user_id
       or new.event_status is distinct from old.event_status
       or new.source_reference is distinct from old.source_reference then
      raise exception 'Champs système du suivi protégés';
    end if;
  end if;
  return new;
end $function$


CREATE OR REPLACE FUNCTION public.transit_record_invoice_payment(p_invoice_id uuid, p_wallet_transaction_id uuid)
 RETURNS transit_invoices
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare
  v_invoice public.transit_invoices;
  v_tx public.wallet_transactions;
  v_wallet public.wallets;
begin
  if auth.uid() is null then raise exception 'Authentification requise'; end if;

  select * into v_invoice
  from public.transit_invoices
  where id=p_invoice_id
  for update;

  if not found then raise exception 'Facture introuvable'; end if;

  if v_invoice.wallet_transaction_id = p_wallet_transaction_id then
    return v_invoice;
  end if;

  if v_invoice.wallet_transaction_id is not null then
    raise exception 'Cette facture possède déjà un paiement différent';
  end if;

  if v_invoice.client_user_id <> auth.uid()
     and not public.user_has_business_access(v_invoice.business_id)
     and not public.is_super_admin() then
    raise exception 'Accès refusé';
  end if;

  select wt.* into v_tx
  from public.wallet_transactions wt
  join public.wallets w on w.id=wt.wallet_id
  where wt.id=p_wallet_transaction_id
  for update;

  if not found then raise exception 'Paiement JDV PAY introuvable'; end if;

  select * into v_wallet
  from public.wallets
  where id=v_tx.wallet_id;

  if not found or v_wallet.user_id <> v_invoice.client_user_id then
    raise exception 'Le portefeuille de paiement ne correspond pas au client';
  end if;

  if v_tx.transaction_status <> 'completed' then
    raise exception 'Paiement JDV PAY non confirmé';
  end if;

  if v_tx.transaction_type not in ('withdrawal','payment','transfer_out') then
    raise exception 'La transaction JDV PAY ne correspond pas à un débit';
  end if;

  if v_tx.currency_id <> v_invoice.currency_id then
    raise exception 'Devise du paiement incompatible avec la facture';
  end if;

  if v_tx.amount <= 0 or v_tx.amount > v_invoice.amount then
    raise exception 'Montant du paiement invalide pour cette facture';
  end if;

  if exists (
    select 1 from public.transit_invoices
    where wallet_transaction_id=p_wallet_transaction_id and id<>p_invoice_id
  ) then
    raise exception 'Ce paiement est déjà utilisé par une autre facture';
  end if;

  update public.transit_invoices
  set wallet_transaction_id=p_wallet_transaction_id,
      invoice_status=case
        when v_tx.amount = v_invoice.amount then 'paid'::public.transit_invoice_status
        else 'partially_paid'::public.transit_invoice_status
      end,
      updated_at=now()
  where id=p_invoice_id
  returning * into v_invoice;

  insert into public.audit_logs
    (user_id,module_code,action,entity_type,entity_id,new_data)
  values
    (auth.uid(),'transit','invoice.payment_recorded','transit_invoices',
     p_invoice_id::text,
     jsonb_build_object(
       'wallet_transaction_id',p_wallet_transaction_id,
       'amount',v_tx.amount,
       'currency_id',v_tx.currency_id,
       'invoice_status',v_invoice.invoice_status
     ));

  return v_invoice;
end;
$function$


CREATE OR REPLACE FUNCTION public.transit_request_to_crm_prospect(p_request_id uuid, p_business_id uuid)
 RETURNS crm_prospects
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare
  v_request public.transit_requests;
  v_prospect public.crm_prospects;
  v_profile public.profiles;
begin
  if auth.uid() is null then raise exception 'Authentification requise'; end if;

  select * into v_request from public.transit_requests where id=p_request_id for update;
  if not found then raise exception 'Demande introuvable'; end if;

  if not (public.user_has_business_access(p_business_id) or public.is_super_admin()) then
    raise exception 'Accès refusé';
  end if;

  if v_request.assigned_business_id is not null
     and v_request.assigned_business_id <> p_business_id then
    raise exception 'Demande déjà affectée à une autre entreprise';
  end if;

  if v_request.crm_prospect_id is not null then
    select * into v_prospect from public.crm_prospects where id=v_request.crm_prospect_id;
    if not found then raise exception 'Prospect CRM référencé introuvable'; end if;
    if v_prospect.business_id <> p_business_id then
      raise exception 'Prospect CRM rattaché à une autre entreprise';
    end if;
    return v_prospect;
  end if;

  select * into v_profile from public.profiles where id=v_request.requester_user_id;
  if not found then raise exception 'Profil du demandeur introuvable'; end if;

  insert into public.crm_prospects
    (business_id,first_name,last_name,phone,email,desired_product,requested_amount,prospect_status,created_by)
  values
    (p_business_id,coalesce(v_profile.first_name,'Prospect'),v_profile.last_name,
     v_profile.phone,v_profile.email,
     'Transit/Logistique ('||coalesce(v_request.operation_type::text,'n/a')||')',
     v_request.budget_max,'new',auth.uid())
  returning * into v_prospect;

  update public.transit_requests
  set crm_prospect_id=v_prospect.id, assigned_business_id=p_business_id, updated_at=now()
  where id=p_request_id;

  insert into public.audit_logs
    (user_id,module_code,action,entity_type,entity_id,new_data)
  values
    (auth.uid(),'transit','request.crm_prospect_created','transit_requests',
     p_request_id::text,jsonb_build_object('crm_prospect_id',v_prospect.id,'business_id',p_business_id));

  return v_prospect;
end;
$function$


CREATE OR REPLACE FUNCTION public.transit_set_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$


CREATE OR REPLACE FUNCTION public.transport_accept_booking(p_booking_id uuid, p_driver_id uuid)
 RETURNS transport_bookings
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare
  v_booking public.transport_bookings;
  v_driver public.transport_drivers;
begin
  if auth.uid() is null then
    raise exception 'Authentification requise';
  end if;

  select * into v_booking
  from public.transport_bookings
  where id=p_booking_id
  for update;

  if not found then
    raise exception 'Course introuvable';
  end if;

  if v_booking.driver_id=p_driver_id
     and v_booking.booking_status in ('accepted','driver_arriving','driver_arrived','in_progress') then
    return v_booking;
  end if;

  if v_booking.booking_status not in ('requested','searching') then
    raise exception 'Cette course a déjà été attribuée ou n''est plus disponible';
  end if;

  select * into v_driver
  from public.transport_drivers
  where id=p_driver_id
    and user_id=auth.uid()
  for share;

  if not found then
    raise exception 'Chauffeur non autorisé';
  end if;

  if v_driver.driver_status <> 'active' then
    raise exception 'Chauffeur non actif';
  end if;

  if v_driver.verification_status <> 'verified' then
    raise exception 'Chauffeur non vérifié';
  end if;

  if v_booking.business_id is distinct from v_driver.business_id then
    raise exception 'Chauffeur hors entreprise pour cette course';
  end if;

  update public.transport_bookings
  set driver_id=p_driver_id,
      vehicle_id=coalesce(v_booking.vehicle_id,v_driver.primary_vehicle_id),
      booking_status='accepted'
  where id=p_booking_id
  returning * into v_booking;

  insert into public.audit_logs(
    user_id,module_code,action,entity_type,entity_id,new_data
  )
  values(
    auth.uid(),'transport','booking.accepted','transport_bookings',
    p_booking_id::text,to_jsonb(v_booking)
  );

  return v_booking;
end;
$function$


CREATE OR REPLACE FUNCTION public.transport_add_delivery_event(p_delivery_id uuid, p_status text, p_location text DEFAULT NULL::text, p_comment text DEFAULT NULL::text)
 RETURNS transport_delivery_events
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_delivery public.transport_deliveries;
  v_event public.transport_delivery_events;
begin
  if auth.uid() is null then raise exception 'Authentification requise'; end if;

  select * into v_delivery from public.transport_deliveries where id=p_delivery_id for update;
  if not found then raise exception 'Livraison introuvable'; end if;

  if not (
    public.is_super_admin()
    or exists (
      select 1 from public.transport_drivers d
      where d.id=v_delivery.driver_id and d.user_id=auth.uid()
    )
    or v_delivery.sender_user_id=auth.uid()
    or (v_delivery.business_id is not null and public.user_has_business_access(v_delivery.business_id))
  ) then
    raise exception 'Accès refusé';
  end if;

  if v_delivery.delivery_status::text=p_status then
    select * into v_event from public.transport_delivery_events
    where delivery_id=p_delivery_id order by created_at desc limit 1;
    return v_event;
  end if;

  insert into public.transport_delivery_events(delivery_id,event_status,location,comment,actor_user_id)
  values(p_delivery_id,p_status::public.transport_delivery_status,p_location,p_comment,auth.uid())
  returning * into v_event;

  update public.transport_deliveries set delivery_status=p_status::public.transport_delivery_status
  where id=p_delivery_id;

  return v_event;
end;
$function$


CREATE OR REPLACE FUNCTION public.transport_calculate_price(p_service_type_id uuid, p_vehicle_type_id uuid, p_country_id uuid, p_distance_km numeric, p_duration_minutes numeric, p_business_id uuid DEFAULT NULL::uuid, p_is_night boolean DEFAULT false)
 RETURNS numeric
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_rule public.transport_pricing_rules;
  v_total numeric;
BEGIN
  SELECT * INTO v_rule FROM public.transport_pricing_rules
  WHERE service_type_id = p_service_type_id
    AND (vehicle_type_id IS NULL OR vehicle_type_id = p_vehicle_type_id)
    AND (country_id IS NULL OR country_id = p_country_id)
    AND (business_id IS NULL OR business_id = p_business_id)
    AND is_active = true
  ORDER BY (vehicle_type_id IS NOT NULL) DESC, (country_id IS NOT NULL) DESC, (business_id IS NOT NULL) DESC
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN NULL; -- aucune règle configurée : pas de prix inventé
  END IF;

  v_total := COALESCE(v_rule.base_fare,0)
    + COALESCE(v_rule.per_km_fare,0) * COALESCE(p_distance_km,0)
    + COALESCE(v_rule.per_minute_fare,0) * COALESCE(p_duration_minutes,0);

  IF p_is_night AND v_rule.night_surcharge_percent IS NOT NULL THEN
    v_total := v_total * (1 + v_rule.night_surcharge_percent/100);
  END IF;

  IF v_rule.minimum_fare IS NOT NULL AND v_total < v_rule.minimum_fare THEN
    v_total := v_rule.minimum_fare;
  END IF;

  RETURN round(v_total, 2);
END;
$function$


CREATE OR REPLACE FUNCTION public.transport_check_rental_overlap()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.transport_rentals r
    WHERE r.vehicle_id = NEW.vehicle_id
      AND r.id <> NEW.id
      AND r.rental_status NOT IN ('cancelled')
      AND (NEW.start_at, NEW.end_at) OVERLAPS (r.start_at, r.end_at)
  ) THEN
    RAISE EXCEPTION 'Ce véhicule est déjà réservé sur cette période';
  END IF;
  RETURN NEW;
END;
$function$


CREATE OR REPLACE FUNCTION public.transport_complete_booking(p_booking_id uuid, p_actual_distance_km numeric, p_actual_duration_minutes numeric)
 RETURNS transport_bookings
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare
  v_booking public.transport_bookings;
  v_price numeric;
begin
  if auth.uid() is null then
    raise exception 'Authentification requise';
  end if;

  if p_actual_distance_km is null or p_actual_distance_km < 0 then
    raise exception 'Distance invalide';
  end if;

  if p_actual_duration_minutes is null or p_actual_duration_minutes < 0 then
    raise exception 'Durée invalide';
  end if;

  select * into v_booking
  from public.transport_bookings
  where id=p_booking_id
  for update;

  if not found then
    raise exception 'Course introuvable';
  end if;

  if not (
    public.is_super_admin()
    or exists (
      select 1
      from public.transport_drivers d
      where d.id=v_booking.driver_id
        and d.user_id=auth.uid()
        and d.driver_status='active'
        and d.verification_status='verified'
        and (v_booking.business_id is null or d.business_id=v_booking.business_id)
    )
    or (v_booking.business_id is not null and public.user_has_business_access(v_booking.business_id))
  ) then
    raise exception 'Seul le chauffeur affecté ou l''opérateur autorisé peut terminer la course';
  end if;

  if v_booking.booking_status='completed' then
    return v_booking;
  end if;

  if v_booking.booking_status <> 'in_progress' then
    raise exception 'La course doit être en cours avant sa clôture';
  end if;

  v_price := public.transport_estimate_price(
    v_booking.service_type_id,
    (select vehicle_type_id from public.transport_vehicles where id=v_booking.vehicle_id),
    v_booking.business_id,
    p_actual_distance_km,
    p_actual_duration_minutes,
    (extract(hour from now()) >= 22 or extract(hour from now()) < 5)
  );

  update public.transport_bookings
  set distance_km=p_actual_distance_km,
      duration_minutes=p_actual_duration_minutes,
      final_price=coalesce(v_price,v_booking.estimated_price),
      booking_status='completed',
      updated_at=now()
  where id=p_booking_id
  returning * into v_booking;

  insert into public.audit_logs(
    user_id,module_code,action,entity_type,entity_id,new_data
  )
  values(
    auth.uid(),'transport','booking.completed','transport_bookings',
    p_booking_id::text,to_jsonb(v_booking)
  );

  return v_booking;
end;
$function$


CREATE OR REPLACE FUNCTION public.transport_confirm_payment(p_booking_id uuid, p_wallet_transaction_id uuid)
 RETURNS transport_bookings
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare v_booking public.transport_bookings; v_tx public.wallet_transactions; v_wallet public.wallets; v_required numeric;
begin
 if auth.uid() is null then raise exception 'Authentification requise'; end if;
 select * into v_booking from public.transport_bookings where id=p_booking_id for update;
 if not found then raise exception 'Course introuvable'; end if;
 if v_booking.wallet_transaction_id is not null then
   if v_booking.wallet_transaction_id=p_wallet_transaction_id then return v_booking; end if;
   raise exception 'Course déjà associée à un autre paiement';
 end if;
 if v_booking.passenger_user_id<>auth.uid() and not (v_booking.business_id is not null and public.user_has_business_access(v_booking.business_id)) and not public.is_super_admin() then raise exception 'Accès refusé'; end if;
 if v_booking.booking_status<>'completed' then raise exception 'La course doit être terminée avant paiement'; end if;
 select * into v_tx from public.wallet_transactions where id=p_wallet_transaction_id for update;
 if not found or v_tx.transaction_status<>'completed' then raise exception 'Paiement JDV PAY non confirmé'; end if;
 select * into v_wallet from public.wallets where id=v_tx.wallet_id;
 if not found or v_wallet.user_id<>v_booking.passenger_user_id then raise exception 'Portefeuille de paiement invalide'; end if;
 if v_tx.currency_id<>v_booking.currency_id then raise exception 'Devise du paiement incompatible'; end if;
 v_required:=coalesce(v_booking.final_price,v_booking.estimated_price,0);
 if v_required>0 and v_tx.amount<>v_required then raise exception 'Montant du paiement incompatible avec la course'; end if;
 if exists(select 1 from public.transport_bookings where wallet_transaction_id=p_wallet_transaction_id and id<>p_booking_id) then raise exception 'Paiement déjà associé à une autre course'; end if;
 update public.transport_bookings set wallet_transaction_id=p_wallet_transaction_id,final_price=coalesce(final_price,v_tx.amount),updated_at=now() where id=p_booking_id returning * into v_booking;
 insert into public.audit_logs(user_id,module_code,action,entity_type,entity_id,new_data) values(auth.uid(),'transport','booking.payment_confirmed','transport_bookings',p_booking_id::text,to_jsonb(v_booking));
 return v_booking;
end $function$


CREATE OR REPLACE FUNCTION public.transport_estimate_price(p_service_type_id uuid, p_vehicle_type_id uuid, p_business_id uuid, p_distance_km numeric, p_duration_minutes numeric, p_is_night boolean DEFAULT false)
 RETURNS numeric
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_rule public.transport_pricing_rules;
  v_total numeric;
BEGIN
  SELECT * INTO v_rule FROM public.transport_pricing_rules
  WHERE service_type_id = p_service_type_id
    AND is_active = true
    AND (business_id = p_business_id OR (business_id IS NULL AND p_business_id IS NULL))
    AND (vehicle_type_id IS NULL OR vehicle_type_id = p_vehicle_type_id)
  ORDER BY (business_id IS NOT NULL) DESC, (vehicle_type_id IS NOT NULL) DESC
  LIMIT 1;

  -- fallback sur règle plateforme générique si aucune règle business spécifique
  IF NOT FOUND THEN
    SELECT * INTO v_rule FROM public.transport_pricing_rules
    WHERE service_type_id = p_service_type_id AND is_active = true AND business_id IS NULL
    ORDER BY (vehicle_type_id IS NOT NULL) DESC
    LIMIT 1;
  END IF;

  IF NOT FOUND THEN
    RETURN NULL; -- aucune règle configurée : pas de prix inventé
  END IF;

  v_total := v_rule.base_fare + (v_rule.per_km_fare * COALESCE(p_distance_km,0)) + (v_rule.per_minute_fare * COALESCE(p_duration_minutes,0));
  IF p_is_night THEN
    v_total := v_total * (1 + v_rule.night_surcharge_percent/100);
  END IF;
  v_total := GREATEST(v_total, v_rule.minimum_fare);

  RETURN round(v_total, 2);
END;
$function$


CREATE OR REPLACE FUNCTION public.transport_protect_booking_system_fields()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  IF public.is_super_admin() OR current_setting('jdv.transport_internal',true)='1' THEN
    RETURN NEW;
  END IF;
  IF TG_OP='UPDATE' THEN
    IF NEW.passenger_user_id IS DISTINCT FROM OLD.passenger_user_id
       OR NEW.business_id IS DISTINCT FROM OLD.business_id
       OR NEW.driver_id IS DISTINCT FROM OLD.driver_id
       OR NEW.vehicle_id IS DISTINCT FROM OLD.vehicle_id
       OR NEW.service_type_id IS DISTINCT FROM OLD.service_type_id
       OR NEW.estimated_price IS DISTINCT FROM OLD.estimated_price
       OR NEW.final_price IS DISTINCT FROM OLD.final_price
       OR NEW.currency_id IS DISTINCT FROM OLD.currency_id
       OR NEW.payment_reference IS DISTINCT FROM OLD.payment_reference
       OR NEW.wallet_transaction_id IS DISTINCT FROM OLD.wallet_transaction_id
       OR NEW.idempotency_key IS DISTINCT FROM OLD.idempotency_key THEN
      RAISE EXCEPTION 'Champs système de course protégés';
    END IF;
  END IF;
  RETURN NEW;
END;
$function$


CREATE OR REPLACE FUNCTION public.transport_protect_delivery_proof_system_fields()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  IF public.is_super_admin() OR current_setting('jdv.transport_internal',true)='1' THEN
    RETURN NEW;
  END IF;
  IF TG_OP='UPDATE' THEN
    IF NEW.delivery_id IS DISTINCT FROM OLD.delivery_id
       OR NEW.proof_type IS DISTINCT FROM OLD.proof_type
       OR NEW.file_url IS DISTINCT FROM OLD.file_url THEN
      RAISE EXCEPTION 'Preuve de livraison protégée';
    END IF;
  END IF;
  RETURN NEW;
END;
$function$


CREATE OR REPLACE FUNCTION public.transport_protect_driver_system_fields()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  IF public.is_super_admin() OR current_setting('jdv.transport_internal',true)='1' THEN
    RETURN NEW;
  END IF;
  IF TG_OP='UPDATE' THEN
    IF NEW.user_id IS DISTINCT FROM OLD.user_id
       OR NEW.business_id IS DISTINCT FROM OLD.business_id
       OR NEW.driver_status IS DISTINCT FROM OLD.driver_status
       OR NEW.verification_status IS DISTINCT FROM OLD.verification_status
       OR NEW.primary_vehicle_id IS DISTINCT FROM OLD.primary_vehicle_id THEN
      RAISE EXCEPTION 'Champs système chauffeur protégés';
    END IF;
  END IF;
  RETURN NEW;
END;
$function$


CREATE OR REPLACE FUNCTION public.transport_protect_vehicle_system_fields()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  IF public.is_super_admin() OR current_setting('jdv.transport_internal',true)='1' THEN
    RETURN NEW;
  END IF;
  IF TG_OP='UPDATE' THEN
    IF NEW.owner_user_id IS DISTINCT FROM OLD.owner_user_id
       OR NEW.business_id IS DISTINCT FROM OLD.business_id
       OR NEW.vehicle_type_id IS DISTINCT FROM OLD.vehicle_type_id
       OR NEW.verification_status IS DISTINCT FROM OLD.verification_status THEN
      RAISE EXCEPTION 'Champs système véhicule protégés';
    END IF;
  END IF;
  RETURN NEW;
END;
$function$


CREATE OR REPLACE FUNCTION public.transport_request_to_crm_prospect(p_request_id uuid, p_business_id uuid)
 RETURNS crm_prospects
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_request public.transport_requests;
  v_prospect public.crm_prospects;
  v_profile public.profiles;
BEGIN
  SELECT * INTO v_request FROM public.transport_requests WHERE id = p_request_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Demande introuvable'; END IF;

  IF NOT (public.user_has_business_access(p_business_id) OR public.is_super_admin()) THEN
    RAISE EXCEPTION 'Accès refusé';
  END IF;

  IF v_request.crm_prospect_id IS NOT NULL THEN
    SELECT * INTO v_prospect FROM public.crm_prospects WHERE id = v_request.crm_prospect_id;
    RETURN v_prospect;
  END IF;

  SELECT * INTO v_profile FROM public.profiles WHERE id = v_request.requester_user_id;

  INSERT INTO public.crm_prospects (
    business_id, first_name, last_name, phone, email,
    desired_product, requested_amount, prospect_status, created_by
  ) VALUES (
    p_business_id, COALESCE(v_profile.first_name,'Prospect'), v_profile.last_name,
    v_profile.phone, v_profile.email,
    'Transport (' || v_request.request_type || ')', v_request.budget_max, 'new', auth.uid()
  ) RETURNING * INTO v_prospect;

  UPDATE public.transport_requests
  SET crm_prospect_id = v_prospect.id, assigned_business_id = p_business_id
  WHERE id = p_request_id;

  RETURN v_prospect;
END;
$function$


CREATE OR REPLACE FUNCTION public.transport_reserve_seat(p_seat_id uuid, p_price numeric, p_currency_id uuid, p_idempotency_key text DEFAULT NULL::text)
 RETURNS transport_seat_reservations
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare
  v_schedule_id uuid;
begin
  if auth.uid() is null then raise exception 'Authentification requise'; end if;
  select schedule_id into v_schedule_id from public.transport_seats where id=p_seat_id;
  if v_schedule_id is null then raise exception 'Siège introuvable'; end if;
  return public.transport_reserve_seat(v_schedule_id,p_seat_id,p_price,p_currency_id,p_idempotency_key);
end;
$function$


CREATE OR REPLACE FUNCTION public.transport_reserve_seat(p_schedule_id uuid, p_seat_id uuid, p_price numeric, p_currency_id uuid, p_idempotency_key text DEFAULT NULL::text)
 RETURNS transport_seat_reservations
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare
  v_seat public.transport_seats;
  v_schedule public.transport_schedules;
  v_reservation public.transport_seat_reservations;
begin
  if auth.uid() is null then raise exception 'Authentification requise'; end if;

  if p_idempotency_key is not null then
    select * into v_reservation from public.transport_seat_reservations where idempotency_key=p_idempotency_key;
    if found then return v_reservation; end if;
  end if;

  select * into v_schedule from public.transport_schedules
  where id=p_schedule_id and is_active=true for share;
  if not found then raise exception 'Horaire introuvable ou inactif'; end if;

  select * into v_seat from public.transport_seats
  where id=p_seat_id and schedule_id=p_schedule_id for update;
  if not found then raise exception 'Siège introuvable pour cet horaire'; end if;
  if v_seat.seat_status<>'available' then raise exception 'Ce siège n''est plus disponible'; end if;

  if p_price is not null and p_price<>v_schedule.price then raise exception 'Prix incompatible avec l''horaire'; end if;
  if p_currency_id is not null and p_currency_id<>v_schedule.currency_id then raise exception 'Devise incompatible avec l''horaire'; end if;

  update public.transport_seats set seat_status='reserved' where id=p_seat_id;

  insert into public.transport_seat_reservations(
    schedule_id,seat_id,passenger_user_id,price,currency_id,reservation_status,idempotency_key
  )
  values(p_schedule_id,p_seat_id,auth.uid(),v_schedule.price,v_schedule.currency_id,'pending',p_idempotency_key)
  returning * into v_reservation;

  insert into public.audit_logs(user_id,module_code,action,entity_type,entity_id,new_data)
  values(auth.uid(),'transport','seat.reserved','transport_seat_reservations',v_reservation.id::text,
         jsonb_build_object('schedule_id',p_schedule_id,'seat_id',p_seat_id,
                            'price',v_schedule.price,'currency_id',v_schedule.currency_id));
  return v_reservation;
end;
$function$


CREATE OR REPLACE FUNCTION public.transport_set_driver_availability(p_availability_status transport_availability_status, p_latitude numeric DEFAULT NULL::numeric, p_longitude numeric DEFAULT NULL::numeric)
 RETURNS transport_driver_availability
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare v_driver_id uuid; v_result public.transport_driver_availability;
begin
  if auth.uid() is null then raise exception 'Authentification requise'; end if;
  select id into v_driver_id from public.transport_drivers
  where user_id=auth.uid() and driver_status='active' and verification_status='verified';
  if v_driver_id is null then raise exception 'Profil chauffeur actif et vérifié introuvable'; end if;
  if p_latitude is not null and (p_latitude < -90 or p_latitude > 90) then raise exception 'Latitude invalide'; end if;
  if p_longitude is not null and (p_longitude < -180 or p_longitude > 180) then raise exception 'Longitude invalide'; end if;
  insert into public.transport_driver_availability(driver_id,availability_status,current_latitude,current_longitude)
  values(v_driver_id,p_availability_status,p_latitude,p_longitude)
  on conflict(driver_id) do update set availability_status=excluded.availability_status,current_latitude=excluded.current_latitude,current_longitude=excluded.current_longitude,updated_at=now()
  returning * into v_result;
  insert into public.audit_logs(user_id,module_code,action,entity_type,entity_id,new_data)
  values(auth.uid(),'transport','driver.availability_changed','transport_driver_availability',v_result.id::text,jsonb_build_object('status',p_availability_status));
  return v_result;
end;
$function$


CREATE OR REPLACE FUNCTION public.transport_set_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$


CREATE OR REPLACE FUNCTION public.transport_touch_availability()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$function$


CREATE OR REPLACE FUNCTION public.transport_update_booking_status(p_booking_id uuid, p_new_status text)
 RETURNS transport_bookings
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare v_booking public.transport_bookings; v_driver public.transport_drivers;
v_allowed jsonb := '{"driver_arriving":["accepted"],"driver_arrived":["driver_arriving"],"in_progress":["driver_arrived"],"completed":["in_progress"]}'::jsonb;
begin
  if auth.uid() is null then raise exception 'Authentification requise'; end if;
  if p_new_status is null or btrim(p_new_status)='' then raise exception 'Statut obligatoire'; end if;
  select * into v_booking from public.transport_bookings where id=p_booking_id for update;
  if not found then raise exception 'Course introuvable'; end if;
  if v_booking.booking_status::text=p_new_status then return v_booking; end if;
  if not public.is_super_admin() then
    select * into v_driver from public.transport_drivers where id=v_booking.driver_id and user_id=auth.uid() for share;
    if not found or v_driver.driver_status<>'active' or v_driver.verification_status<>'verified' then
      raise exception 'Chauffeur affecté non autorisé ou non vérifié';
    end if;
  end if;
  if not (v_allowed ? p_new_status) or not ((v_allowed -> p_new_status) ? v_booking.booking_status::text) then
    raise exception 'Transition de statut invalide: % -> %',v_booking.booking_status,p_new_status;
  end if;
  update public.transport_bookings set booking_status=p_new_status::public.transport_booking_status,updated_at=now()
  where id=p_booking_id returning * into v_booking;
  insert into public.audit_logs(user_id,module_code,action,entity_type,entity_id,new_data)
  values(auth.uid(),'transport','booking.status_changed','transport_bookings',p_booking_id::text,jsonb_build_object('status',p_new_status));
  return v_booking;
end;
$function$


CREATE OR REPLACE FUNCTION public.travel_confirm_booking(p_booking_id uuid, p_wallet_transaction_id uuid)
 RETURNS travel_bookings
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare v_booking public.travel_bookings; v_tx public.wallet_transactions; v_wallet public.wallets; v_avail public.travel_availability;
begin
 if auth.uid() is null then raise exception 'Authentification requise'; end if;
 select * into v_booking from public.travel_bookings where id=p_booking_id for update;
 if not found then raise exception 'Réservation introuvable'; end if;
 if v_booking.booking_status='confirmed' then
   if v_booking.wallet_transaction_id is null or v_booking.wallet_transaction_id=p_wallet_transaction_id then return v_booking; end if;
   raise exception 'Réservation déjà confirmée avec un autre paiement';
 end if;
 if v_booking.buyer_user_id<>auth.uid() and not (v_booking.business_id is not null and public.user_has_business_access(v_booking.business_id)) and not public.is_super_admin() then raise exception 'Accès refusé'; end if;
 select * into v_tx from public.wallet_transactions where id=p_wallet_transaction_id for update;
 if not found or v_tx.transaction_status<>'completed' then raise exception 'Paiement JDV PAY non confirmé'; end if;
 select * into v_wallet from public.wallets where id=v_tx.wallet_id;
 if not found or v_wallet.user_id<>v_booking.buyer_user_id then raise exception 'Portefeuille de paiement invalide'; end if;
 if v_tx.currency_id<>v_booking.currency_id then raise exception 'Devise du paiement incompatible'; end if;
 if v_tx.amount<>v_booking.amount then raise exception 'Montant du paiement incompatible avec la réservation'; end if;
 if exists(select 1 from public.travel_bookings where wallet_transaction_id=p_wallet_transaction_id and id<>p_booking_id) then raise exception 'Paiement déjà associé à une autre réservation'; end if;
 perform set_config('jdv.travel_internal','1',true);
 if v_booking.start_date is not null then
   select * into v_avail from public.travel_availability where resource_type=v_booking.resource_type and resource_id=v_booking.resource_id and available_date=v_booking.start_date for update;
   if found then
     if v_avail.reserved_units+v_booking.travelers_count>v_avail.total_units then raise exception 'Capacité insuffisante pour cette date'; end if;
     update public.travel_availability set reserved_units=reserved_units+v_booking.travelers_count,updated_at=now() where id=v_avail.id;
   end if;
 end if;
 update public.travel_bookings set booking_status='confirmed',wallet_transaction_id=p_wallet_transaction_id,updated_at=now() where id=p_booking_id returning * into v_booking;
 insert into public.audit_logs(user_id,module_code,action,entity_type,entity_id,new_data) values(auth.uid(),'travel','booking.confirmed','travel_bookings',p_booking_id::text,to_jsonb(v_booking));
 return v_booking;
end $function$


CREATE OR REPLACE FUNCTION public.travel_generate_slug()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE v_base text;
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    v_base := lower(regexp_replace(coalesce(NEW.name,'destination'), '[^a-zA-Z0-9]+', '-', 'g'));
    NEW.slug := trim(both '-' from v_base) || '-' || substr(NEW.id::text,1,8);
  END IF;
  RETURN NEW;
END;
$function$


CREATE OR REPLACE FUNCTION public.travel_protect_agency_system_fields()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  IF public.is_super_admin() OR current_setting('jdv.travel_internal', true) = '1' THEN
    RETURN NEW;
  END IF;
  IF TG_OP='UPDATE' THEN
    IF NEW.business_id IS DISTINCT FROM OLD.business_id
       OR NEW.license_number IS DISTINCT FROM OLD.license_number
       OR NEW.verification_status IS DISTINCT FROM OLD.verification_status THEN
      RAISE EXCEPTION 'Champs système agence protégés';
    END IF;
  END IF;
  RETURN NEW;
END;
$function$


CREATE OR REPLACE FUNCTION public.travel_protect_agent_system_fields()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  IF public.is_super_admin() OR current_setting('jdv.travel_internal', true) = '1' THEN
    RETURN NEW;
  END IF;
  IF TG_OP='UPDATE' THEN
    IF NEW.business_id IS DISTINCT FROM OLD.business_id
       OR NEW.user_id IS DISTINCT FROM OLD.user_id
       OR NEW.verification_status IS DISTINCT FROM OLD.verification_status THEN
      RAISE EXCEPTION 'Champs système agent protégés';
    END IF;
  END IF;
  RETURN NEW;
END;
$function$


CREATE OR REPLACE FUNCTION public.travel_protect_availability_reserved_units()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  IF public.is_super_admin() OR current_setting('jdv.travel_internal', true) = '1' THEN
    RETURN NEW;
  END IF;

  IF NEW.reserved_units IS DISTINCT FROM OLD.reserved_units THEN
    RAISE EXCEPTION 'Le stock réservé est géré par le système';
  END IF;
  RETURN NEW;
END;
$function$


CREATE OR REPLACE FUNCTION public.travel_protect_booking_system_fields()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  IF public.is_super_admin() OR current_setting('jdv.travel_internal', true) = '1' THEN
    RETURN NEW;
  END IF;

  IF TG_OP='UPDATE' THEN
    IF NEW.buyer_user_id IS DISTINCT FROM OLD.buyer_user_id
       OR NEW.business_id IS DISTINCT FROM OLD.business_id
       OR NEW.resource_type IS DISTINCT FROM OLD.resource_type
       OR NEW.resource_id IS DISTINCT FROM OLD.resource_id
       OR NEW.quote_id IS DISTINCT FROM OLD.quote_id
       OR NEW.amount IS DISTINCT FROM OLD.amount
       OR NEW.currency_id IS DISTINCT FROM OLD.currency_id
       OR NEW.reference IS DISTINCT FROM OLD.reference
       OR NEW.idempotency_key IS DISTINCT FROM OLD.idempotency_key
       OR NEW.wallet_transaction_id IS DISTINCT FROM OLD.wallet_transaction_id THEN
      RAISE EXCEPTION 'Champs système de réservation protégés';
    END IF;
  END IF;
  RETURN NEW;
END;
$function$


CREATE OR REPLACE FUNCTION public.travel_protect_commission_system_fields()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  IF public.is_super_admin() OR current_setting('jdv.travel_internal', true) = '1' THEN
    RETURN NEW;
  END IF;

  IF TG_OP='UPDATE' THEN
    IF NEW.business_id IS DISTINCT FROM OLD.business_id
       OR NEW.agent_id IS DISTINCT FROM OLD.agent_id
       OR NEW.guide_id IS DISTINCT FROM OLD.guide_id
       OR NEW.booking_id IS DISTINCT FROM OLD.booking_id
       OR NEW.amount IS DISTINCT FROM OLD.amount
       OR NEW.currency_id IS DISTINCT FROM OLD.currency_id THEN
      RAISE EXCEPTION 'Champs système de commission protégés';
    END IF;
  END IF;
  RETURN NEW;
END;
$function$


CREATE OR REPLACE FUNCTION public.travel_protect_quote_system_fields()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  IF public.is_super_admin() OR current_setting('jdv.travel_internal', true) = '1' THEN
    RETURN NEW;
  END IF;

  IF TG_OP='UPDATE' THEN
    IF NEW.business_id IS DISTINCT FROM OLD.business_id
       OR NEW.request_id IS DISTINCT FROM OLD.request_id
       OR NEW.client_user_id IS DISTINCT FROM OLD.client_user_id
       OR NEW.total_amount IS DISTINCT FROM OLD.total_amount
       OR NEW.currency_id IS DISTINCT FROM OLD.currency_id
       OR NEW.created_by IS DISTINCT FROM OLD.created_by THEN
      RAISE EXCEPTION 'Champs système de devis protégés';
    END IF;
  END IF;
  RETURN NEW;
END;
$function$


CREATE OR REPLACE FUNCTION public.travel_request_to_crm_prospect(p_request_id uuid, p_business_id uuid)
 RETURNS crm_prospects
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_request public.travel_requests;
  v_prospect public.crm_prospects;
  v_profile public.profiles;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentification requise';
  END IF;

  SELECT * INTO v_request
  FROM public.travel_requests
  WHERE id = p_request_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Demande introuvable';
  END IF;

  IF NOT (public.user_has_business_access(p_business_id) OR public.is_super_admin()) THEN
    RAISE EXCEPTION 'Accès refusé';
  END IF;

  IF v_request.assigned_business_id IS NOT NULL
     AND v_request.assigned_business_id <> p_business_id
     AND NOT public.is_super_admin() THEN
    RAISE EXCEPTION 'Demande déjà affectée à une autre entreprise';
  END IF;

  IF v_request.crm_prospect_id IS NOT NULL THEN
    SELECT * INTO v_prospect
    FROM public.crm_prospects
    WHERE id = v_request.crm_prospect_id;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Prospect CRM associé introuvable';
    END IF;

    IF v_prospect.business_id <> p_business_id THEN
      RAISE EXCEPTION 'Prospect CRM rattaché à une autre entreprise';
    END IF;

    RETURN v_prospect;
  END IF;

  SELECT * INTO v_profile
  FROM public.profiles
  WHERE id = v_request.requester_user_id;

  INSERT INTO public.crm_prospects (
    business_id, first_name, last_name, phone, email,
    desired_product, requested_amount, prospect_status, created_by
  ) VALUES (
    p_business_id,
    COALESCE(v_profile.first_name, 'Prospect'),
    v_profile.last_name,
    v_profile.phone,
    v_profile.email,
    'Voyage (' || COALESCE(v_request.travel_type, 'n/a') || ')',
    v_request.budget_max,
    'new',
    auth.uid()
  )
  RETURNING * INTO v_prospect;

  UPDATE public.travel_requests
  SET crm_prospect_id = v_prospect.id,
      assigned_business_id = p_business_id,
      updated_at = now()
  WHERE id = p_request_id;

  RETURN v_prospect;
END;
$function$


CREATE OR REPLACE FUNCTION public.travel_set_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$


CREATE OR REPLACE FUNCTION public.update_business_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$function$


CREATE OR REPLACE FUNCTION public.update_listing_rating()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  UPDATE public.marketplace_listings
  SET
    rating_average = (
      SELECT ROUND(AVG(rating)::NUMERIC, 2)
      FROM public.marketplace_reviews
      WHERE listing_id = NEW.listing_id AND review_status = 'published'
    ),
    rating_count = (
      SELECT COUNT(*)
      FROM public.marketplace_reviews
      WHERE listing_id = NEW.listing_id AND review_status = 'published'
    )
  WHERE id = NEW.listing_id;

  UPDATE public.marketplace_sellers
  SET
    rating_average = (
      SELECT ROUND(AVG(rating)::NUMERIC, 2)
      FROM public.marketplace_reviews
      WHERE seller_id = NEW.seller_id AND review_status = 'published'
    ),
    rating_count = (
      SELECT COUNT(*)
      FROM public.marketplace_reviews
      WHERE seller_id = NEW.seller_id AND review_status = 'published'
    )
  WHERE id = NEW.seller_id;

  RETURN NEW;
END;
$function$


CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$


CREATE OR REPLACE FUNCTION public.user_has_business_access(p_business_id uuid)
 RETURNS boolean
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
  select
    auth.uid() is not null
    and (
      exists (
        select 1
        from public.business_profiles bp
        where bp.id = p_business_id
          and bp.owner_user_id = auth.uid()
      )
      or exists (
        select 1
        from public.business_members bm
        where bm.business_id = p_business_id
          and bm.user_id = auth.uid()
          and bm.is_active = true
      )
    );
$function$


