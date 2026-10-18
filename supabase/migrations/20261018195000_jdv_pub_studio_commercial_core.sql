-- JDV Pub Studio + commercial foundation (additive, no existing records removed)
begin;

alter table public.pub_campaigns
  add column if not exists brand_name text,
  add column if not exists headline text,
  add column if not exists message text,
  add column if not exists call_to_action text,
  add column if not exists destination_url text,
  add column if not exists format text not null default 'responsive',
  add column if not exists pricing_model text not null default 'fixed_duration',
  add column if not exists targeting jsonb not null default '{}'::jsonb,
  add column if not exists ai_assisted boolean not null default false,
  add column if not exists submitted_at timestamptz;

alter table public.pub_campaigns drop constraint if exists pub_campaigns_format_check;
alter table public.pub_campaigns add constraint pub_campaigns_format_check
  check (format in ('responsive','square','landscape','vertical','banner','video'));
alter table public.pub_campaigns drop constraint if exists pub_campaigns_pricing_model_check;
alter table public.pub_campaigns add constraint pub_campaigns_pricing_model_check
  check (pricing_model in ('fixed_duration','cpm','cpc','premium','priority'));
alter table public.pub_campaigns drop constraint if exists pub_campaigns_budget_nonnegative_check;
alter table public.pub_campaigns add constraint pub_campaigns_budget_nonnegative_check check (budget_amount >= 0);
alter table public.pub_campaigns drop constraint if exists pub_campaigns_date_order_check;
alter table public.pub_campaigns add constraint pub_campaigns_date_order_check
  check (starts_at is null or ends_at is null or ends_at > starts_at);

alter table public.pub_creatives
  add column if not exists title text,
  add column if not exists headline text,
  add column if not exists body text,
  add column if not exists storage_path text,
  add column if not exists mime_type text,
  add column if not exists file_size_bytes bigint,
  add column if not exists format text,
  add column if not exists alt_text text,
  add column if not exists metadata jsonb not null default '{}'::jsonb;

create table if not exists public.pub_pricing_rules (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  campaign_type text not null default 'standard' check (campaign_type in ('standard','premium','priority')),
  billing_model text not null check (billing_model in ('fixed_duration','cpm','cpc')),
  placement_id uuid references public.pub_placements(id) on delete restrict,
  unit_price numeric(14,2) not null default 0 check (unit_price >= 0),
  currency_id uuid references public.currencies(id) on delete restrict,
  duration_days integer check (duration_days is null or duration_days > 0),
  included_impressions bigint check (included_impressions is null or included_impressions >= 0),
  included_clicks bigint check (included_clicks is null or included_clicks >= 0),
  max_daily_spend numeric(14,2) check (max_daily_spend is null or max_daily_spend >= 0),
  is_active boolean not null default false,
  requires_manual_approval boolean not null default true,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint pub_pricing_fixed_duration_has_duration check (billing_model <> 'fixed_duration' or duration_days is not null)
);

create table if not exists public.pub_partners (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  organization_id uuid,
  display_name text not null,
  website_url text,
  contact_email text,
  status text not null default 'pending' check (status in ('pending','approved','suspended','rejected')),
  payout_currency_id uuid references public.currencies(id) on delete restrict,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id)
);

alter table public.pub_placements
  add column if not exists partner_id uuid references public.pub_partners(id) on delete set null,
  add column if not exists supported_formats text[] not null default array['responsive']::text[],
  add column if not exists max_daily_impressions bigint check (max_daily_impressions is null or max_daily_impressions >= 0),
  add column if not exists max_daily_clicks bigint check (max_daily_clicks is null or max_daily_clicks >= 0),
  add column if not exists inventory_notes text;

create index if not exists pub_campaigns_advertiser_created_idx on public.pub_campaigns (advertiser_id, created_at desc);
create index if not exists pub_creatives_campaign_created_idx on public.pub_creatives (campaign_id, created_at desc);
create index if not exists pub_impressions_campaign_time_idx on public.pub_impressions (campaign_id, occurred_at desc);
create index if not exists pub_pricing_rules_active_model_idx on public.pub_pricing_rules (is_active, billing_model);
create index if not exists pub_placements_partner_idx on public.pub_placements (partner_id, is_active);

alter table public.pub_pricing_rules enable row level security;
alter table public.pub_partners enable row level security;

drop policy if exists pub_pricing_rules_public_active_read on public.pub_pricing_rules;
create policy pub_pricing_rules_public_active_read on public.pub_pricing_rules for select to anon, authenticated using (is_active = true);
drop policy if exists pub_pricing_rules_admin_manage on public.pub_pricing_rules;
create policy pub_pricing_rules_admin_manage on public.pub_pricing_rules for all to authenticated using (is_super_admin()) with check (is_super_admin());

drop policy if exists pub_partners_self_read on public.pub_partners;
create policy pub_partners_self_read on public.pub_partners for select to authenticated using (is_super_admin() or user_id = auth.uid() or is_org_member(organization_id));
drop policy if exists pub_partners_self_insert on public.pub_partners;
create policy pub_partners_self_insert on public.pub_partners for insert to authenticated with check (user_id = auth.uid() and status = 'pending');
drop policy if exists pub_partners_self_update_pending on public.pub_partners;
create policy pub_partners_self_update_pending on public.pub_partners for update to authenticated using (user_id = auth.uid() and status = 'pending') with check (user_id = auth.uid() and status = 'pending');
drop policy if exists pub_partners_admin_manage on public.pub_partners;
create policy pub_partners_admin_manage on public.pub_partners for all to authenticated using (is_super_admin()) with check (is_super_admin());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('jdv-pub-creatives','jdv-pub-creatives',false,26214400,array['image/jpeg','image/png','image/webp','video/mp4','video/webm']::text[])
on conflict (id) do update set public = false, file_size_limit = 26214400, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists jdv_pub_creatives_owner_read on storage.objects;
create policy jdv_pub_creatives_owner_read on storage.objects for select to authenticated using (
  bucket_id = 'jdv-pub-creatives' and exists (
    select 1 from public.pub_campaigns c join public.pub_advertisers a on a.id = c.advertiser_id
    where c.id::text = split_part(name, '/', 2) and a.user_id = auth.uid()
  )
);
drop policy if exists jdv_pub_creatives_owner_insert on storage.objects;
create policy jdv_pub_creatives_owner_insert on storage.objects for insert to authenticated with check (
  bucket_id = 'jdv-pub-creatives' and split_part(name, '/', 1) = auth.uid()::text and exists (
    select 1 from public.pub_campaigns c join public.pub_advertisers a on a.id = c.advertiser_id
    where c.id::text = split_part(name, '/', 2) and a.user_id = auth.uid() and c.status in ('draft','rejected')
  )
);
drop policy if exists jdv_pub_creatives_owner_delete on storage.objects;
create policy jdv_pub_creatives_owner_delete on storage.objects for delete to authenticated using (
  bucket_id = 'jdv-pub-creatives' and split_part(name, '/', 1) = auth.uid()::text and exists (
    select 1 from public.pub_campaigns c join public.pub_advertisers a on a.id = c.advertiser_id
    where c.id::text = split_part(name, '/', 2) and a.user_id = auth.uid() and c.status in ('draft','rejected')
  )
);

create or replace function public.pub_guard_campaign_mutation()
returns trigger language plpgsql security invoker set search_path = public, pg_temp as $$
begin
  if coalesce(is_super_admin(), false) then return new; end if;
  if tg_op = 'INSERT' then new.status := 'draft'; new.submitted_at := null; return new; end if;
  if new.advertiser_id is distinct from old.advertiser_id then raise exception 'L’annonceur d’une campagne ne peut pas être modifié.'; end if;
  if new.status is distinct from old.status then
    if not (old.status in ('draft','rejected') and new.status = 'pending_review' and current_setting('app.pub_campaign_transition', true) = 'submit') then
      raise exception 'Le statut de campagne doit être modifié via le workflow JDV Pub.';
    end if;
  end if;
  if old.status not in ('draft','rejected') then raise exception 'Seules les campagnes en brouillon ou rejetées peuvent être modifiées.'; end if;
  return new;
end;
$$;
drop trigger if exists pub_campaign_guard_mutation on public.pub_campaigns;
create trigger pub_campaign_guard_mutation before insert or update on public.pub_campaigns for each row execute function public.pub_guard_campaign_mutation();

create or replace function public.pub_guard_creative_approval()
returns trigger language plpgsql security invoker set search_path = public, pg_temp as $$
begin
  if coalesce(is_super_admin(), false) then return new; end if;
  if tg_op = 'INSERT' then new.approval_status := 'pending';
  elsif new.approval_status is distinct from old.approval_status then raise exception 'La validation des créations est réservée à JDV Pub Control Center.';
  end if;
  return new;
end;
$$;
drop trigger if exists pub_creative_guard_approval on public.pub_creatives;
create trigger pub_creative_guard_approval before insert or update on public.pub_creatives for each row execute function public.pub_guard_creative_approval();

create or replace function public.pub_submit_campaign(p_campaign_id uuid)
returns public.pub_campaigns language plpgsql security definer set search_path = public, pg_temp as $$
declare v_campaign public.pub_campaigns%rowtype; v_advertiser_status text; v_creative_count integer;
begin
  if auth.uid() is null then raise exception 'Authentification requise.'; end if;
  select c.*, a.status into v_campaign, v_advertiser_status
  from public.pub_campaigns c join public.pub_advertisers a on a.id = c.advertiser_id
  where c.id = p_campaign_id and (a.user_id = auth.uid() or is_org_admin(a.organization_id) or is_super_admin())
  for update of c;
  if not found then raise exception 'Campagne introuvable ou accès refusé.'; end if;
  if v_advertiser_status <> 'active' and not is_super_admin() then raise exception 'Le profil annonceur doit être validé avant de soumettre une campagne.'; end if;
  if v_campaign.status not in ('draft','rejected') then raise exception 'Cette campagne ne peut pas être soumise dans son état actuel.'; end if;
  if v_campaign.name is null or length(trim(v_campaign.name)) = 0 then raise exception 'Le nom de campagne est obligatoire.'; end if;
  if v_campaign.budget_amount <= 0 then raise exception 'Le budget doit être supérieur à zéro.'; end if;
  if v_campaign.starts_at is null or v_campaign.ends_at is null or v_campaign.ends_at <= v_campaign.starts_at then raise exception 'La période de campagne est invalide.'; end if;
  if v_campaign.destination_url is not null and v_campaign.destination_url !~* '^https?://' then raise exception 'La destination doit être une URL HTTP ou HTTPS.'; end if;
  select count(*) into v_creative_count from public.pub_creatives cr where cr.campaign_id = p_campaign_id;
  if v_creative_count = 0 then raise exception 'Ajoutez au moins une création publicitaire avant la soumission.'; end if;
  perform set_config('app.pub_campaign_transition','submit',true);
  update public.pub_campaigns set status = 'pending_review', submitted_at = now(), updated_at = now() where id = p_campaign_id returning * into v_campaign;
  return v_campaign;
end;
$$;
revoke all on function public.pub_submit_campaign(uuid) from public, anon;
grant execute on function public.pub_submit_campaign(uuid) to authenticated;
revoke all on function public.pub_guard_campaign_mutation() from public, anon, authenticated;
revoke all on function public.pub_guard_creative_approval() from public, anon, authenticated;

commit;
