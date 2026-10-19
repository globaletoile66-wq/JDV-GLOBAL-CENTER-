-- JDV Social: groups, memberships, events and registrations.
-- Additive migration. Test in an isolated Supabase preview before applying to production.
begin;

create table if not exists public.social_groups (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) between 2 and 120),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  description text,
  visibility text not null default 'public' check (visibility in ('public', 'private')),
  status text not null default 'active' check (status in ('active', 'archived')),
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.social_group_memberships (
  group_id uuid not null references public.social_groups(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'admin', 'member')),
  status text not null default 'active' check (status in ('active', 'pending', 'left', 'blocked')),
  joined_at timestamptz not null default now(),
  primary key (group_id, user_id)
);

create table if not exists public.social_events (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(trim(title)) between 3 and 160),
  description text,
  starts_at timestamptz not null,
  ends_at timestamptz,
  location text,
  group_id uuid references public.social_groups(id) on delete set null,
  visibility text not null default 'public' check (visibility in ('public', 'members')),
  status text not null default 'published' check (status in ('draft', 'published', 'cancelled')),
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at is null or ends_at >= starts_at)
);

create table if not exists public.social_event_registrations (
  event_id uuid not null references public.social_events(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'registered' check (status in ('registered', 'cancelled')),
  registered_at timestamptz not null default now(),
  primary key (event_id, user_id)
);

create or replace function public.social_is_group_member(p_group_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, auth, pg_temp
set row_security = off
as $$
  select exists (
    select 1 from public.social_group_memberships m
    where m.group_id = p_group_id
      and m.user_id = auth.uid()
      and m.status = 'active'
  );
$$;

create or replace function public.social_is_group_admin(p_group_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, auth, pg_temp
set row_security = off
as $$
  select exists (
    select 1 from public.social_groups g
    where g.id = p_group_id and g.created_by = auth.uid()
  ) or exists (
    select 1 from public.social_group_memberships m
    where m.group_id = p_group_id
      and m.user_id = auth.uid()
      and m.status = 'active'
      and m.role in ('owner', 'admin')
  );
$$;

create or replace function public.social_is_group_public(p_group_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, auth, pg_temp
set row_security = off
as $
  select exists (
    select 1 from public.social_groups g
    where g.id = p_group_id and g.visibility = 'public' and g.status = 'active'
  );
$;

create or replace function public.social_has_group_request(p_group_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, auth, pg_temp
set row_security = off
as $
  select exists (
    select 1 from public.social_group_memberships m
    where m.group_id = p_group_id
      and m.user_id = auth.uid()
      and m.status in ('active', 'pending')
  );
$;

revoke all on function public.social_is_group_member(uuid) from public, anon;
revoke all on function public.social_is_group_admin(uuid) from public, anon;
revoke all on function public.social_is_group_public(uuid) from public, anon;\nrevoke all on function public.social_has_group_request(uuid) from public, anon;
grant execute on function public.social_is_group_member(uuid) to authenticated;
grant execute on function public.social_is_group_admin(uuid) to authenticated;
grant execute on function public.social_is_group_public(uuid) to authenticated;\ngrant execute on function public.social_has_group_request(uuid) to authenticated;

alter table public.social_groups enable row level security;
alter table public.social_group_memberships enable row level security;
alter table public.social_events enable row level security;
alter table public.social_event_registrations enable row level security;

drop policy if exists social_groups_select on public.social_groups;
drop policy if exists social_groups_insert on public.social_groups;
drop policy if exists social_groups_update on public.social_groups;
drop policy if exists social_groups_delete on public.social_groups;
create policy social_groups_select on public.social_groups for select to authenticated
using ((visibility = 'public' and status = 'active') or created_by = (select auth.uid()) or public.social_is_group_member(id) or public.social_is_group_admin(id) or public.social_has_group_request(id));
create policy social_groups_insert on public.social_groups for insert to authenticated
with check (created_by = (select auth.uid()));
create policy social_groups_update on public.social_groups for update to authenticated
using (created_by = (select auth.uid()) or public.social_is_group_admin(id))
with check (created_by = (select auth.uid()) or public.social_is_group_admin(id));
create policy social_groups_delete on public.social_groups for delete to authenticated
using (created_by = (select auth.uid()) or public.social_is_group_admin(id));

drop policy if exists social_group_memberships_select on public.social_group_memberships;
drop policy if exists social_group_memberships_insert on public.social_group_memberships;
drop policy if exists social_group_memberships_update on public.social_group_memberships;
drop policy if exists social_group_memberships_delete on public.social_group_memberships;
create policy social_group_memberships_select on public.social_group_memberships for select to authenticated
using (user_id = (select auth.uid()) or public.social_is_group_admin(group_id));
create policy social_group_memberships_insert on public.social_group_memberships for insert to authenticated
with check (
  (user_id = (select auth.uid()) and role = 'member' and (
    (status = 'active' and public.social_is_group_public(group_id))
    or (status = 'pending' and not public.social_is_group_public(group_id))
  ))
  or (public.social_is_group_admin(group_id) and role in ('owner', 'admin', 'member'))
);
create policy social_group_memberships_update on public.social_group_memberships for update to authenticated
using (user_id = (select auth.uid()) or public.social_is_group_admin(group_id))
with check (
  (user_id = (select auth.uid()) and role = 'member' and status in ('active', 'pending', 'left'))
  or (public.social_is_group_admin(group_id) and role in ('owner', 'admin', 'member'))
);
create policy social_group_memberships_delete on public.social_group_memberships for delete to authenticated
using (user_id = (select auth.uid()) or public.social_is_group_admin(group_id));

drop policy if exists social_events_select on public.social_events;
drop policy if exists social_events_insert on public.social_events;
drop policy if exists social_events_update on public.social_events;
drop policy if exists social_events_delete on public.social_events;
create policy social_events_select on public.social_events for select to authenticated
using (
  created_by = (select auth.uid())
  or (status = 'published' and visibility = 'public')
  or (status = 'published' and visibility = 'members' and group_id is not null and public.social_is_group_member(group_id))
  or (group_id is not null and public.social_is_group_admin(group_id))
);
create policy social_events_insert on public.social_events for insert to authenticated
with check (created_by = (select auth.uid()) and (group_id is null or public.social_is_group_admin(group_id)));
create policy social_events_update on public.social_events for update to authenticated
using (created_by = (select auth.uid()) or (group_id is not null and public.social_is_group_admin(group_id)))
with check (created_by = (select auth.uid()) or (group_id is not null and public.social_is_group_admin(group_id)));
create policy social_events_delete on public.social_events for delete to authenticated
using (created_by = (select auth.uid()) or (group_id is not null and public.social_is_group_admin(group_id)));

drop policy if exists social_event_registrations_select on public.social_event_registrations;
drop policy if exists social_event_registrations_insert on public.social_event_registrations;
drop policy if exists social_event_registrations_update on public.social_event_registrations;
drop policy if exists social_event_registrations_delete on public.social_event_registrations;
create policy social_event_registrations_select on public.social_event_registrations for select to authenticated
using (
  user_id = (select auth.uid())
  or exists (select 1 from public.social_events e where e.id = event_id and e.created_by = (select auth.uid()))
);
create policy social_event_registrations_insert on public.social_event_registrations for insert to authenticated
with check (
  user_id = (select auth.uid())
  and exists (
    select 1 from public.social_events e
    where e.id = event_id and e.status = 'published'
      and (e.visibility = 'public' or (e.group_id is not null and public.social_is_group_member(e.group_id)))
  )
);
create policy social_event_registrations_update on public.social_event_registrations for update to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()) and status in ('registered', 'cancelled'));
create policy social_event_registrations_delete on public.social_event_registrations for delete to authenticated
using (user_id = (select auth.uid()));

create index if not exists social_groups_status_created_idx on public.social_groups (status, created_at desc);
create index if not exists social_group_memberships_user_status_idx on public.social_group_memberships (user_id, status);
create index if not exists social_events_start_status_idx on public.social_events (starts_at, status);
create index if not exists social_events_group_start_idx on public.social_events (group_id, starts_at);
create index if not exists social_event_registrations_user_status_idx on public.social_event_registrations (user_id, status);

commit;
