-- APPLIQUÉ en production le 2026-10-10. Testé : insertion/modification directe refusée, essai unique par organisation,
-- utilisateur extérieur refusé, statut existant (jdvcrm_get_current_subscription_v1) inchangé.
-- Abonnements : un administrateur d'organisation pouvait créer/modifier/supprimer ses propres abonnements, paiements
-- et événements d'abonnement depuis le navigateur. Désormais : lecture seule côté client.

revoke all on public.organization_subscriptions, public.subscription_payments, public.subscription_events,
  public.subscription_limits, public.subscription_plans from anon;

revoke insert, update, delete, truncate, references, trigger on public.organization_subscriptions,
  public.subscription_payments, public.subscription_events, public.subscription_limits from authenticated;
revoke truncate, references, trigger on public.subscription_plans from authenticated;

create or replace function public.billing_start_trial(p_organization_id uuid, p_plan_code text default 'mensuel')
returns public.organization_subscriptions
language plpgsql security definer set search_path = public, pg_catalog as $$
declare p public.subscription_plans; s public.organization_subscriptions; v_days int;
begin
  if auth.uid() is null then raise exception 'AUTHENTICATION_REQUIRED'; end if;
  if not public.is_org_admin(p_organization_id) then raise exception 'ACCESS_DENIED'; end if;
  perform pg_advisory_xact_lock(hashtext('billing_trial:' || p_organization_id::text));
  if exists (select 1 from public.organization_subscriptions where organization_id = p_organization_id) then
    raise exception 'TRIAL_ALREADY_USED';
  end if;
  select * into p from public.subscription_plans where code = p_plan_code and active;
  if not found then raise exception 'PLAN_NOT_FOUND'; end if;
  v_days := coalesce((p.features ->> 'trial_days')::int, 14);
  insert into public.organization_subscriptions(organization_id, plan_id, status, started_at, expires_at, auto_renew)
  values (p_organization_id, p.id, 'trial', now(), now() + make_interval(days => v_days), false)
  returning * into s;
  insert into public.subscription_events(organization_id, subscription_id, event_type, provider, metadata)
  values (p_organization_id, s.id, 'trial_started', 'system',
          jsonb_build_object('plan_code', p.code, 'trial_days', v_days, 'started_by', auth.uid()));
  return s;
end $$;

revoke all on function public.billing_start_trial(uuid, text) from public, anon;
grant execute on function public.billing_start_trial(uuid, text) to authenticated;
