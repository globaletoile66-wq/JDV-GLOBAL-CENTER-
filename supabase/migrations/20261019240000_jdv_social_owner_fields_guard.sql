-- JDV Social: preserve ownership fields while allowing group/event admins to edit content.
-- Corrective candidate migration; validate with two test accounts before production.
begin;

-- Do not let client updates transfer ownership of groups or events.
-- Column-level UPDATE keeps the owner identifiers and primary keys immutable.
revoke update on table public.social_groups from authenticated;
grant update (name, slug, description, visibility, status, updated_at)
  on table public.social_groups to authenticated;

revoke update on table public.social_events from authenticated;
grant update (title, description, starts_at, ends_at, location, group_id, visibility, status, updated_at)
  on table public.social_events to authenticated;

-- Group admins who are not the original creator must be able to edit a group.
drop policy if exists social_groups_update on public.social_groups;
create policy social_groups_update on public.social_groups
for update to authenticated
using (created_by = (select auth.uid()) or public.social_is_group_admin(id))
with check (created_by = (select auth.uid()) or public.social_is_group_admin(id));

-- Likewise, a group admin may manage an event in their group without changing
-- the immutable created_by owner field.
drop policy if exists social_events_update on public.social_events;
create policy social_events_update on public.social_events
for update to authenticated
using (
  created_by = (select auth.uid())
  or (group_id is not null and public.social_is_group_admin(group_id))
)
with check (
  (
    created_by = (select auth.uid())
    and (group_id is null or public.social_is_group_admin(group_id))
  )
  or (group_id is not null and public.social_is_group_admin(group_id))
);

commit;

notify pgrst, 'reload schema';
