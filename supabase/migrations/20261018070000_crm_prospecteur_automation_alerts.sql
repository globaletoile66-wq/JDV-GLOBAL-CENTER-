-- JDV CRM: scheduled, idempotent in-app alerts for prospect follow-ups,
-- overdue payments and low stock. This migration does not alter existing records.

create table if not exists public.crm_automation_alerts (
  id uuid primary key default gen_random_uuid(),
  alert_key text not null unique,
  alert_type text not null check (alert_type in (
    'prospect_followup', 'prospect_stale', 'client_stale',
    'sale_payment_overdue', 'installment_overdue',
    'warehouse_stock_low', 'subwarehouse_stock_low', 'business_product_stock_low'
  )),
  organization_id uuid references public.organizations(id) on delete cascade,
  recipient_user_id uuid not null references auth.users(id) on delete cascade,
  entity_id uuid not null,
  title text not null,
  message text not null,
  action_url text,
  active boolean not null default true,
  last_triggered_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists crm_automation_alerts_active_type_idx
  on public.crm_automation_alerts(alert_type, active);

alter table public.crm_automation_alerts enable row level security;
revoke all on public.crm_automation_alerts from anon, authenticated;

create or replace function public.crm_process_automation_alerts()
returns integer
language plpgsql
security definer
set search_path = public, pg_catalog
as $function$
declare
  r record;
  v_alert_id uuid;
  v_alert_type text;
  v_title text;
  v_message text;
  v_key text;
  v_url text;
  v_count integer := 0;
begin
  -- A prospect is due for a follow-up or has not been contacted for at least 7 days.
  for r in
    select p.id, p.organization_id, p.prospecteur_id, pr.user_id as recipient_user_id,
           concat_ws(' ', p.first_name, p.last_name) as person_name,
           p.next_follow_up_at, coalesce(p.last_contact_at, p.created_at) as last_contact,
           p.temperature
    from public.prospects p
    join public.prospecteurs pr on pr.id = p.prospecteur_id
      and pr.organization_id = p.organization_id
      and pr.user_id is not null
    where p.archived_at is null
      and p.status not in ('converted', 'lost', 'closed', 'archived')
      and (
        p.next_follow_up_at <= now()
        or (
          coalesce(p.last_contact_at, p.created_at) <= now() - interval '7 days'
          and (p.next_follow_up_at is null or p.next_follow_up_at <= now())
        )
      )
  loop
    if r.next_follow_up_at is not null and r.next_follow_up_at <= now() then
      v_alert_type := 'prospect_followup';
      v_key := 'prospect-followup:' || r.id::text;
      v_title := 'Relance prospect à effectuer';
      v_message := 'Relancer ' || coalesce(nullif(r.person_name, ''), 'ce prospect')
        || ' : la relance prévue est arrivée à échéance.';
    else
      v_alert_type := 'prospect_stale';
      v_key := 'prospect-sans-contact:' || r.id::text;
      v_title := 'Prospect sans contact récent';
      v_message := 'Reprendre contact avec ' || coalesce(nullif(r.person_name, ''), 'ce prospect')
        || ' : aucun contact enregistré depuis au moins 7 jours.';
    end if;
    v_url := '/crm/prospects/' || r.id::text;

    v_alert_id := null;
    insert into public.crm_automation_alerts
      (alert_key, alert_type, organization_id, recipient_user_id, entity_id, title, message, action_url, active, last_triggered_at, updated_at)
    values
      (v_key, v_alert_type, r.organization_id, r.recipient_user_id, r.id, v_title, v_message, v_url, true, now(), now())
    on conflict (alert_key) do update
      set active = true, last_triggered_at = now(), updated_at = now(),
          recipient_user_id = excluded.recipient_user_id,
          title = excluded.title, message = excluded.message, action_url = excluded.action_url
      where public.crm_automation_alerts.active = false
    returning id into v_alert_id;

    if v_alert_id is not null then
      insert into public.notifications (user_id, organization_id, notification_type, title, message, action_url)
      values (r.recipient_user_id, r.organization_id, 'warning', v_title, v_message, v_url);

      insert into public.call_center_tasks
        (organization_id, prospect_id, prospecteur_id, assigned_to, task_type, priority, due_at, status, notes)
      values
        (r.organization_id, r.id, r.prospecteur_id, r.recipient_user_id,
         case when v_alert_type = 'prospect_followup' then 'follow_up' else 'recontact' end,
         case when r.temperature = 'hot' or v_alert_type = 'prospect_followup' then 'high' else 'normal' end,
         now(), 'pending', v_message);
      v_count := v_count + 1;
    end if;
  end loop;

  -- Reset prospect alerts once a contact/follow-up has been recorded or the prospect is closed.
  update public.crm_automation_alerts a
  set active = false, updated_at = now()
  where a.active and a.alert_type in ('prospect_followup', 'prospect_stale')
    and not exists (
      select 1 from public.prospects p
      where p.id = a.entity_id and p.archived_at is null
        and p.status not in ('converted', 'lost', 'closed', 'archived')
        and (
          (a.alert_type = 'prospect_followup' and p.next_follow_up_at <= now())
          or (
            a.alert_type = 'prospect_stale'
            and coalesce(p.last_contact_at, p.created_at) <= now() - interval '7 days'
            and (p.next_follow_up_at is null or p.next_follow_up_at <= now())
          )
        )
    );

  -- Client reactivation reminders after 7 days without a recorded contact.
  for r in
    select c.id, c.organization_id, c.prospecteur_id, pr.user_id as recipient_user_id,
           concat_ws(' ', c.first_name, c.last_name) as person_name,
           coalesce(c.last_contact_at, c.last_activity_at, c.created_at) as last_contact
    from public.clients c
    join public.prospecteurs pr on pr.id = c.prospecteur_id
      and pr.organization_id = c.organization_id
      and pr.user_id is not null
    where c.archived_at is null
      and c.status not in ('inactive', 'archived', 'completed')
      and coalesce(c.last_contact_at, c.last_activity_at, c.created_at) <= now() - interval '7 days'
  loop
    v_key := 'client-sans-contact:' || r.id::text;
    v_title := 'Client à recontacter';
    v_message := 'Reprendre contact avec ' || coalesce(nullif(r.person_name, ''), 'ce client')
      || ' : aucun contact enregistré depuis au moins 7 jours.';
    v_url := '/crm/clients/' || r.id::text;
    v_alert_id := null;

    insert into public.crm_automation_alerts
      (alert_key, alert_type, organization_id, recipient_user_id, entity_id, title, message, action_url, active, last_triggered_at, updated_at)
    values
      (v_key, 'client_stale', r.organization_id, r.recipient_user_id, r.id, v_title, v_message, v_url, true, now(), now())
    on conflict (alert_key) do update
      set active = true, last_triggered_at = now(), updated_at = now(),
          recipient_user_id = excluded.recipient_user_id,
          title = excluded.title, message = excluded.message, action_url = excluded.action_url
      where public.crm_automation_alerts.active = false
    returning id into v_alert_id;

    if v_alert_id is not null then
      insert into public.notifications (user_id, organization_id, notification_type, title, message, action_url)
      values (r.recipient_user_id, r.organization_id, 'warning', v_title, v_message, v_url);

      insert into public.call_center_tasks
        (organization_id, client_id, prospecteur_id, assigned_to, task_type, priority, due_at, status, notes)
      values
        (r.organization_id, r.id, r.prospecteur_id, r.recipient_user_id,
         'client_reactivation', 'normal', now(), 'pending', v_message);
      v_count := v_count + 1;
    end if;
  end loop;

  update public.crm_automation_alerts a
  set active = false, updated_at = now()
  where a.active and a.alert_type = 'client_stale'
    and not exists (
      select 1 from public.clients c
      where c.id = a.entity_id and c.archived_at is null
        and c.status not in ('inactive', 'archived', 'completed')
        and coalesce(c.last_contact_at, c.last_activity_at, c.created_at) <= now() - interval '7 days'
    );

  -- Late instalments in the business CRM: notify the business owner.
  for r in
    select ps.id, bp.organization_id, bp.owner_user_id as recipient_user_id,
           concat_ws(' ', bc.first_name, bc.last_name) as person_name,
           ps.due_date, coalesce(ps.remaining_amount, ps.amount_due - coalesce(ps.amount_paid, 0)) as remaining
    from public.crm_payment_schedules ps
    join public.business_profiles bp on bp.id = ps.business_id
    join public.business_clients bc on bc.id = ps.client_id and bc.business_id = bp.id
    where bp.owner_user_id is not null
      and ps.due_date < current_date
      and coalesce(ps.remaining_amount, ps.amount_due - coalesce(ps.amount_paid, 0)) > 0
      and ps.schedule_status in ('pending', 'partially_paid', 'overdue')
  loop
    v_key := 'installment-overdue:' || r.id::text;
    v_title := 'Échéance client impayée';
    v_message := 'L’échéance du ' || to_char(r.due_date, 'DD/MM/YYYY') || ' de '
      || coalesce(nullif(r.person_name, ''), 'ce client') || ' est en retard. Reste dû : '
      || to_char(r.remaining, 'FM999G999G999G990D00') || '.';
    v_url := '/crm/collections';
    v_alert_id := null;

    insert into public.crm_automation_alerts
      (alert_key, alert_type, organization_id, recipient_user_id, entity_id, title, message, action_url, active, last_triggered_at, updated_at)
    values
      (v_key, 'installment_overdue', r.organization_id, r.recipient_user_id, r.id, v_title, v_message, v_url, true, now(), now())
    on conflict (alert_key) do update
      set active = true, last_triggered_at = now(), updated_at = now(),
          recipient_user_id = excluded.recipient_user_id,
          title = excluded.title, message = excluded.message, action_url = excluded.action_url
      where public.crm_automation_alerts.active = false
    returning id into v_alert_id;

    if v_alert_id is not null then
      insert into public.notifications (user_id, organization_id, notification_type, title, message, action_url)
      values (r.recipient_user_id, r.organization_id, 'warning', v_title, v_message, v_url);
      v_count := v_count + 1;
    end if;
  end loop;

  update public.crm_automation_alerts a
  set active = false, updated_at = now()
  where a.active and a.alert_type = 'installment_overdue'
    and not exists (
      select 1 from public.crm_payment_schedules ps
      where ps.id = a.entity_id and ps.due_date < current_date
        and coalesce(ps.remaining_amount, ps.amount_due - coalesce(ps.amount_paid, 0)) > 0
        and ps.schedule_status in ('pending', 'partially_paid', 'overdue')
    );

  -- Late repayments in the organization-based CRM sales model.
  for r in
    select s.id, s.organization_id, s.prospecteur_id, pr.user_id as recipient_user_id,
           concat_ws(' ', c.first_name, c.last_name) as person_name,
           s.deadline_date, s.amount_remaining
    from public.sales s
    join public.prospecteurs pr on pr.id = s.prospecteur_id
      and pr.organization_id = s.organization_id and pr.user_id is not null
    left join public.clients c on c.id = s.client_id and c.organization_id = s.organization_id
    where s.deadline_date < current_date and coalesce(s.amount_remaining, 0) > 0
      and coalesce(s.status, '') not in ('cancelled', 'canceled', 'void', 'completed', 'paid')
  loop
    v_key := 'sale-payment-overdue:' || r.id::text;
    v_title := 'Paiement client en retard';
    v_message := 'Le paiement attendu le ' || to_char(r.deadline_date, 'DD/MM/YYYY') || ' pour '
      || coalesce(nullif(r.person_name, ''), 'ce client') || ' n’est pas soldé. Reste dû : '
      || to_char(r.amount_remaining, 'FM999G999G999G990D00') || '.';
    v_url := '/crm/collections';
    v_alert_id := null;

    insert into public.crm_automation_alerts
      (alert_key, alert_type, organization_id, recipient_user_id, entity_id, title, message, action_url, active, last_triggered_at, updated_at)
    values
      (v_key, 'sale_payment_overdue', r.organization_id, r.recipient_user_id, r.id, v_title, v_message, v_url, true, now(), now())
    on conflict (alert_key) do update
      set active = true, last_triggered_at = now(), updated_at = now(),
          recipient_user_id = excluded.recipient_user_id,
          title = excluded.title, message = excluded.message, action_url = excluded.action_url
      where public.crm_automation_alerts.active = false
    returning id into v_alert_id;

    if v_alert_id is not null then
      insert into public.notifications (user_id, organization_id, notification_type, title, message, action_url)
      values (r.recipient_user_id, r.organization_id, 'warning', v_title, v_message, v_url);
      insert into public.call_center_tasks
        (organization_id, client_id, prospecteur_id, assigned_to, task_type, priority, due_at, status, notes)
      values
        (r.organization_id, (select c.id from public.clients c where c.id = (
          select s2.client_id from public.sales s2 where s2.id = r.id
        )), r.prospecteur_id, r.recipient_user_id, 'payment_follow_up', 'urgent', now(), 'pending', v_message);
      v_count := v_count + 1;
    end if;
  end loop;

  update public.crm_automation_alerts a
  set active = false, updated_at = now()
  where a.active and a.alert_type = 'sale_payment_overdue'
    and not exists (
      select 1 from public.sales s
      where s.id = a.entity_id and s.deadline_date < current_date
        and coalesce(s.amount_remaining, 0) > 0
        and coalesce(s.status, '') not in ('cancelled', 'canceled', 'void', 'completed', 'paid')
    );

  -- Low stock in main warehouses.
  for r in
    select wi.id, wi.organization_id, wi.warehouse_id, wi.article_id,
           w.manager_user_id as recipient_user_id, w.name as warehouse_name,
           a.name as article_name, greatest(wi.quantity - wi.reserved_quantity, 0) as available,
           wi.minimum_quantity
    from public.warehouse_inventory wi
    join public.warehouses w on w.id = wi.warehouse_id and w.organization_id = wi.organization_id and w.active
    join public.articles a on a.id = wi.article_id and a.organization_id = wi.organization_id and a.active
    where w.manager_user_id is not null
      and greatest(wi.quantity - wi.reserved_quantity, 0) <= wi.minimum_quantity
  loop
    v_key := 'warehouse-stock-low:' || r.id::text;
    v_title := case when r.available <= 0 then 'Rupture de stock' else 'Stock sous le seuil minimum' end;
    v_message := coalesce(r.article_name, 'Un article') || ' dans l’entrepôt '
      || coalesce(r.warehouse_name, '') || ' : disponible ' || r.available
      || ', seuil minimum ' || r.minimum_quantity || '.';
    v_url := '/crm/stock';
    v_alert_id := null;

    insert into public.crm_automation_alerts
      (alert_key, alert_type, organization_id, recipient_user_id, entity_id, title, message, action_url, active, last_triggered_at, updated_at)
    values
      (v_key, 'warehouse_stock_low', r.organization_id, r.recipient_user_id, r.article_id, v_title, v_message, v_url, true, now(), now())
    on conflict (alert_key) do update
      set active = true, last_triggered_at = now(), updated_at = now(),
          recipient_user_id = excluded.recipient_user_id,
          title = excluded.title, message = excluded.message, action_url = excluded.action_url
      where public.crm_automation_alerts.active = false
    returning id into v_alert_id;

    if v_alert_id is not null then
      insert into public.notifications (user_id, organization_id, notification_type, title, message, action_url)
      values (r.recipient_user_id, r.organization_id, 'warning', v_title, v_message, v_url);
      v_count := v_count + 1;
    end if;
  end loop;

  update public.crm_automation_alerts a
  set active = false, updated_at = now()
  where a.active and a.alert_type = 'warehouse_stock_low'
    and not exists (
      select 1 from public.warehouse_inventory wi
      where wi.id = split_part(a.alert_key, ':', 2)::uuid
        and greatest(wi.quantity - wi.reserved_quantity, 0) <= wi.minimum_quantity
    );

  -- Low stock in sub-warehouses, notifying the manager of the parent warehouse.
  for r in
    select swi.id, swi.organization_id, swi.warehouse_id, swi.subwarehouse_id, swi.article_id,
           w.manager_user_id as recipient_user_id, w.name as warehouse_name,
           a.name as article_name, greatest(swi.quantity - swi.reserved_quantity, 0) as available,
           swi.minimum_quantity
    from public.warehouse_subwarehouse_inventory swi
    join public.warehouses w on w.id = swi.warehouse_id and w.organization_id = swi.organization_id and w.active
    join public.articles a on a.id = swi.article_id and a.organization_id = swi.organization_id and a.active
    where w.manager_user_id is not null
      and greatest(swi.quantity - swi.reserved_quantity, 0) <= swi.minimum_quantity
  loop
    v_key := 'subwarehouse-stock-low:' || r.id::text;
    v_title := case when r.available <= 0 then 'Rupture de stock du sous-entrepôt' else 'Stock faible du sous-entrepôt' end;
    v_message := coalesce(r.article_name, 'Un article') || ' dans un sous-entrepôt de '
      || coalesce(r.warehouse_name, '') || ' : disponible ' || r.available
      || ', seuil minimum ' || r.minimum_quantity || '.';
    v_url := '/crm/stock';
    v_alert_id := null;

    insert into public.crm_automation_alerts
      (alert_key, alert_type, organization_id, recipient_user_id, entity_id, title, message, action_url, active, last_triggered_at, updated_at)
    values
      (v_key, 'subwarehouse_stock_low', r.organization_id, r.recipient_user_id, r.article_id, v_title, v_message, v_url, true, now(), now())
    on conflict (alert_key) do update
      set active = true, last_triggered_at = now(), updated_at = now(),
          recipient_user_id = excluded.recipient_user_id,
          title = excluded.title, message = excluded.message, action_url = excluded.action_url
      where public.crm_automation_alerts.active = false
    returning id into v_alert_id;

    if v_alert_id is not null then
      insert into public.notifications (user_id, organization_id, notification_type, title, message, action_url)
      values (r.recipient_user_id, r.organization_id, 'warning', v_title, v_message, v_url);
      v_count := v_count + 1;
    end if;
  end loop;

  update public.crm_automation_alerts a
  set active = false, updated_at = now()
  where a.active and a.alert_type = 'subwarehouse_stock_low'
    and not exists (
      select 1 from public.warehouse_subwarehouse_inventory swi
      where swi.id = split_part(a.alert_key, ':', 2)::uuid
        and greatest(swi.quantity - swi.reserved_quantity, 0) <= swi.minimum_quantity
    );

  -- Low stock in the business storefront/catalog model.
  for r in
    select bp.id as business_id, bp.organization_id, bp.owner_user_id as recipient_user_id,
           p.id as product_id, p.name as product_name, p.stock_quantity, p.min_stock_alert
    from public.business_products p
    join public.business_profiles bp on bp.id = p.business_id
    where bp.owner_user_id is not null and p.is_active and not p.is_service
      and p.min_stock_alert is not null
      and p.stock_quantity <= p.min_stock_alert
  loop
    v_key := 'business-product-stock-low:' || r.product_id::text;
    v_title := case when r.stock_quantity <= 0 then 'Produit épuisé sur la vitrine' else 'Stock faible sur la vitrine' end;
    v_message := coalesce(r.product_name, 'Un produit') || ' : stock disponible '
      || r.stock_quantity || ', seuil d’alerte ' || r.min_stock_alert || '.';
    v_url := '/crm/stock';
    v_alert_id := null;

    insert into public.crm_automation_alerts
      (alert_key, alert_type, organization_id, recipient_user_id, entity_id, title, message, action_url, active, last_triggered_at, updated_at)
    values
      (v_key, 'business_product_stock_low', r.organization_id, r.recipient_user_id, r.product_id, v_title, v_message, v_url, true, now(), now())
    on conflict (alert_key) do update
      set active = true, last_triggered_at = now(), updated_at = now(),
          recipient_user_id = excluded.recipient_user_id,
          title = excluded.title, message = excluded.message, action_url = excluded.action_url
      where public.crm_automation_alerts.active = false
    returning id into v_alert_id;

    if v_alert_id is not null then
      insert into public.notifications (user_id, organization_id, notification_type, title, message, action_url)
      values (r.recipient_user_id, r.organization_id, 'warning', v_title, v_message, v_url);
      v_count := v_count + 1;
    end if;
  end loop;

  update public.crm_automation_alerts a
  set active = false, updated_at = now()
  where a.active and a.alert_type = 'business_product_stock_low'
    and not exists (
      select 1 from public.business_products p
      where p.id = a.entity_id and p.is_active and not p.is_service
        and p.min_stock_alert is not null and p.stock_quantity <= p.min_stock_alert
    );

  return v_count;
end;
$function$;

revoke all on function public.crm_process_automation_alerts() from public, anon, authenticated;

-- Run every 15 minutes; replace only this function's own scheduled job if it already exists.
select cron.unschedule(jobid) from cron.job where jobname = 'jdv-crm-automation-alerts';
select cron.schedule('jdv-crm-automation-alerts', '*/15 * * * *', 'select public.crm_process_automation_alerts();');
