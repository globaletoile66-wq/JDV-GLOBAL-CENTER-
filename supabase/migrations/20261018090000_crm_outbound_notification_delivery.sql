-- CRM outbound notification preferences and delivery ledger.
-- Channel preferences default OFF until an administrator configures provider credentials
-- and the user explicitly enables the channel.
create table if not exists public.crm_notification_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email_enabled boolean not null default false,
  sms_enabled boolean not null default false,
  whatsapp_enabled boolean not null default false,
  phone_e164 text,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint crm_notification_phone_e164_check
    check (phone_e164 is null or phone_e164 ~ '^\+[1-9][0-9]{7,14}$')
);

alter table public.crm_notification_preferences enable row level security;
revoke all on public.crm_notification_preferences from anon;
grant select, insert, update on public.crm_notification_preferences to authenticated;

drop policy if exists "Users read own CRM notification preferences" on public.crm_notification_preferences;
create policy "Users read own CRM notification preferences"
  on public.crm_notification_preferences for select to authenticated
  using (user_id = auth.uid());

drop policy if exists "Users insert own CRM notification preferences" on public.crm_notification_preferences;
create policy "Users insert own CRM notification preferences"
  on public.crm_notification_preferences for insert to authenticated
  with check (user_id = auth.uid());

drop policy if exists "Users update own CRM notification preferences" on public.crm_notification_preferences;
create policy "Users update own CRM notification preferences"
  on public.crm_notification_preferences for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create table if not exists public.crm_automation_deliveries (
  id uuid primary key default gen_random_uuid(),
  alert_id uuid not null references public.crm_automation_alerts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  channel text not null check (channel in ('email','sms','whatsapp')),
  status text not null default 'pending' check (status in ('pending','sent','failed','skipped')),
  provider_message_id text,
  attempt_count integer not null default 0 check (attempt_count >= 0),
  last_error text,
  created_at timestamptz not null default now(),
  sent_at timestamptz,
  updated_at timestamptz not null default now(),
  unique(alert_id, channel)
);

alter table public.crm_automation_deliveries enable row level security;
revoke all on public.crm_automation_deliveries from anon, authenticated;
create index if not exists crm_automation_deliveries_pending_idx
  on public.crm_automation_deliveries(status, created_at)
  where status in ('pending','failed');
create index if not exists crm_automation_deliveries_user_idx
  on public.crm_automation_deliveries(user_id, created_at desc);

create or replace function public.jdv_crm_get_my_notification_preferences_v1()
returns table (
  email_enabled boolean,
  sms_enabled boolean,
  whatsapp_enabled boolean,
  phone_e164 text
)
language sql
stable
security definer
set search_path = public, pg_catalog
as $function$
  select coalesce(p.email_enabled, false),
         coalesce(p.sms_enabled, false),
         coalesce(p.whatsapp_enabled, false),
         p.phone_e164
  from (select auth.uid() as uid) u
  left join public.crm_notification_preferences p on p.user_id = u.uid
  where u.uid is not null;
$function$;

revoke all on function public.jdv_crm_get_my_notification_preferences_v1() from public, anon;
grant execute on function public.jdv_crm_get_my_notification_preferences_v1() to authenticated;

comment on table public.crm_notification_preferences is
  'Per-user opt-in settings for outbound CRM notifications. All channels default to disabled.';
comment on table public.crm_automation_deliveries is
  'Idempotent per-alert/per-channel outbound delivery ledger; access only via trusted server functions.';
