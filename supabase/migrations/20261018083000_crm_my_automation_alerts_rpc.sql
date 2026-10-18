-- Read-only, user-scoped access to active CRM automation alerts.
create or replace function public.jdv_crm_get_my_automation_alerts_v1(p_limit integer default 100)
returns table (
  id uuid,
  alert_type text,
  title text,
  message text,
  action_url text,
  organization_id uuid,
  created_at timestamptz,
  last_triggered_at timestamptz
)
language sql
stable
security definer
set search_path = public, pg_catalog
as $function$
  select a.id, a.alert_type, a.title, a.message, a.action_url,
         a.organization_id, a.created_at, a.last_triggered_at
  from public.crm_automation_alerts a
  where a.recipient_user_id = auth.uid()
    and a.active = true
  order by a.last_triggered_at desc nulls last, a.created_at desc
  limit least(greatest(coalesce(p_limit, 100), 1), 200);
$function$;

revoke all on function public.jdv_crm_get_my_automation_alerts_v1(integer) from public, anon;
grant execute on function public.jdv_crm_get_my_automation_alerts_v1(integer) to authenticated;
