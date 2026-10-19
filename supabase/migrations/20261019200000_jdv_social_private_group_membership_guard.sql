-- JDV Social: prevent members from self-approving private-group requests.
-- Restrict client updates to status/role; group_id and user_id remain immutable.
-- Candidate corrective migration: validate on an isolated Supabase preview before production.
begin;

revoke update on table public.social_group_memberships from authenticated;
grant update (status, role) on table public.social_group_memberships to authenticated;

drop policy if exists social_group_memberships_update on public.social_group_memberships;
create policy social_group_memberships_update
on public.social_group_memberships
for update to authenticated
using (
  (user_id = (select auth.uid()) and status <> 'blocked')
  or public.social_is_group_admin(group_id)
)
with check (
  (
    user_id = (select auth.uid())
    and role = 'member'
    and (
      status in ('pending', 'left')
      or (
        status = 'active'
        and (
          public.social_is_group_public(group_id)
          or public.social_is_group_member(group_id)
        )
      )
    )
  )
  or (
    public.social_is_group_admin(group_id)
    and role in ('owner', 'admin', 'member')
  )
);

-- A blocked member must not be able to remove their blocked row and rejoin.
drop policy if exists social_group_memberships_delete on public.social_group_memberships;
create policy social_group_memberships_delete
on public.social_group_memberships
for delete to authenticated
using (
  (user_id = (select auth.uid()) and status <> 'blocked')
  or public.social_is_group_admin(group_id)
);

commit;

notify pgrst, 'reload schema';
