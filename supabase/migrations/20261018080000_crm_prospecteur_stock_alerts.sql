-- Configurable per-prospecteur stock thresholds and automatic stock alerts.
alter table public.prospecteur_stocks
  add column if not exists minimum_quantity numeric not null default 0
  check (minimum_quantity >= 0);

alter table public.crm_prospecteur_stocks
  add column if not exists minimum_quantity numeric not null default 0
  check (minimum_quantity >= 0);

alter table public.crm_automation_alerts
  drop constraint if exists crm_automation_alerts_alert_type_check;

alter table public.crm_automation_alerts
  add constraint crm_automation_alerts_alert_type_check
  check (alert_type in (
    'prospect_followup', 'prospect_stale', 'client_stale',
    'sale_payment_overdue', 'installment_overdue',
    'warehouse_stock_low', 'subwarehouse_stock_low', 'business_product_stock_low',
    'prospecteur_stock_low', 'crm_prospecteur_stock_low'
  ));

create or replace function public.crm_process_prospecteur_stock_alerts()
returns integer
language plpgsql
security definer
set search_path = public, pg_catalog
as $function$
declare
  r record;
  v_alert_id uuid;
  v_key text;
  v_title text;
  v_message text;
  v_count integer := 0;
begin
  -- Organization-based CRM: notify the prospecteur assigned the article.
  for r in
    select ps.id as stock_id, ps.organization_id, ps.prospecteur_id,
           pr.user_id as recipient_user_id, ps.article_id, a.name as article_name,
           ps.quantity, ps.minimum_quantity
    from public.prospecteur_stocks ps
    join public.prospecteurs pr on pr.id = ps.prospecteur_id
      and pr.organization_id = ps.organization_id and pr.user_id is not null
    join public.articles a on a.id = ps.article_id and a.organization_id = ps.organization_id and a.active
    where ps.quantity <= ps.minimum_quantity
  loop
    v_key := 'prospecteur-stock-low:' || r.stock_id::text;
    v_title := case when r.quantity <= 0 then 'Stock épuisé chez le prospecteur' else 'Stock faible chez le prospecteur' end;
    v_message := coalesce(r.article_name, 'Un article') || ' : stock restant '
      || r.quantity || ', seuil défini ' || r.minimum_quantity
      || '. Demandez un réapprovisionnement à l’entrepôt.';
    v_alert_id := null;

    insert into public.crm_automation_alerts
      (alert_key, alert_type, organization_id, recipient_user_id, entity_id, title, message, action_url, active, last_triggered_at, updated_at)
    values
      (v_key, 'prospecteur_stock_low', r.organization_id, r.recipient_user_id, r.article_id, v_title, v_message, '/crm/stock', true, now(), now())
    on conflict (alert_key) do update
      set active = true, last_triggered_at = now(), updated_at = now(),
          recipient_user_id = excluded.recipient_user_id,
          title = excluded.title, message = excluded.message, action_url = excluded.action_url
      where public.crm_automation_alerts.active = false
    returning id into v_alert_id;

    if v_alert_id is not null then
      insert into public.notifications (user_id, organization_id, notification_type, title, message, action_url)
      values (r.recipient_user_id, r.organization_id, 'warning', v_title, v_message, '/crm/stock');
      v_count := v_count + 1;
    end if;
  end loop;

  update public.crm_automation_alerts a
  set active = false, updated_at = now()
  where a.active and a.alert_type = 'prospecteur_stock_low'
    and not exists (
      select 1 from public.prospecteur_stocks ps
      where ('prospecteur-stock-low:' || ps.id::text) = a.alert_key
        and ps.quantity <= ps.minimum_quantity
    );

  -- Business CRM: notify the prospecteur holding a product allocated to them.
  for r in
    select cps.id as stock_id, bp.organization_id, cps.prospecteur_id,
           cp.user_id as recipient_user_id, cps.product_id, p.name as product_name,
           cps.quantity, cps.minimum_quantity
    from public.crm_prospecteur_stocks cps
    join public.crm_prospecteurs cp on cp.id = cps.prospecteur_id
      and cp.business_id = cps.business_id
      and cp.prospecteur_status = 'active'
      and cp.user_id is not null
    join public.business_profiles bp on bp.id = cps.business_id
    join public.business_products p on p.id = cps.product_id and p.business_id = cps.business_id
      and p.is_active and not p.is_service
    where cps.quantity <= cps.minimum_quantity
  loop
    v_key := 'crm-prospecteur-stock-low:' || r.stock_id::text;
    v_title := case when r.quantity <= 0 then 'Stock épuisé chez le prospecteur' else 'Stock faible chez le prospecteur' end;
    v_message := coalesce(r.product_name, 'Un produit') || ' : stock restant '
      || r.quantity || ', seuil défini ' || r.minimum_quantity
      || '. Demandez un réapprovisionnement à l’entrepôt.';
    v_alert_id := null;

    insert into public.crm_automation_alerts
      (alert_key, alert_type, organization_id, recipient_user_id, entity_id, title, message, action_url, active, last_triggered_at, updated_at)
    values
      (v_key, 'crm_prospecteur_stock_low', r.organization_id, r.recipient_user_id, r.product_id, v_title, v_message, '/crm/stock', true, now(), now())
    on conflict (alert_key) do update
      set active = true, last_triggered_at = now(), updated_at = now(),
          recipient_user_id = excluded.recipient_user_id,
          title = excluded.title, message = excluded.message, action_url = excluded.action_url
      where public.crm_automation_alerts.active = false
    returning id into v_alert_id;

    if v_alert_id is not null then
      insert into public.notifications (user_id, organization_id, notification_type, title, message, action_url)
      values (r.recipient_user_id, r.organization_id, 'warning', v_title, v_message, '/crm/stock');
      v_count := v_count + 1;
    end if;
  end loop;

  update public.crm_automation_alerts a
  set active = false, updated_at = now()
  where a.active and a.alert_type = 'crm_prospecteur_stock_low'
    and not exists (
      select 1 from public.crm_prospecteur_stocks cps
      where ('crm-prospecteur-stock-low:' || cps.id::text) = a.alert_key
        and cps.quantity <= cps.minimum_quantity
    );

  return v_count;
end;
$function$;

revoke all on function public.crm_process_prospecteur_stock_alerts() from public, anon, authenticated;

select cron.unschedule(jobid) from cron.job where jobname = 'jdv-crm-automation-alerts';
select cron.schedule(
  'jdv-crm-automation-alerts',
  '*/15 * * * *',
  'select public.crm_process_automation_alerts(); select public.crm_process_prospecteur_stock_alerts();'
);
