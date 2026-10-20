-- JDV Immo: persist personalized architectural editor drafts.
-- Additive, scoped to JDV Immo. Does not alter historical CRM tables.
create table if not exists public.immo_construction_briefs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'Avant-projet JDV Immo',
  parcel_area numeric(12,2) not null default 0 check (parcel_area >= 0),
  brief jsonb not null default '{}'::jsonb,
  brief_status text not null default 'draft'
    check (brief_status in ('draft','submitted','under_review','quoted','approved','archived')),
  assigned_professional_user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists immo_construction_briefs_user_updated_idx
  on public.immo_construction_briefs(user_id, updated_at desc);

alter table public.immo_construction_briefs enable row level security;

revoke all on table public.immo_construction_briefs from anon, authenticated;
grant select, insert, update on table public.immo_construction_briefs to authenticated;

drop policy if exists "Users read own construction briefs" on public.immo_construction_briefs;
create policy "Users read own construction briefs"
  on public.immo_construction_briefs for select to authenticated
  using (user_id = (select auth.uid()) or assigned_professional_user_id = (select auth.uid()));

drop policy if exists "Users create own construction briefs" on public.immo_construction_briefs;
create policy "Users create own construction briefs"
  on public.immo_construction_briefs for insert to authenticated
  with check (user_id = (select auth.uid()) and assigned_professional_user_id is null and brief_status = 'draft');

drop policy if exists "Users edit own construction drafts" on public.immo_construction_briefs;
create policy "Users edit own construction drafts"
  on public.immo_construction_briefs for update to authenticated
  using (user_id = (select auth.uid()) and brief_status = 'draft')
  with check (user_id = (select auth.uid()) and brief_status = 'draft' and assigned_professional_user_id is null);

comment on table public.immo_construction_briefs is
  'JDV Immo conceptual architecture drafts, user-owned and isolated by row-level security.';
