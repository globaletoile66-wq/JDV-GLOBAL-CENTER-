-- JDV Social: prevent members from self-approving private-group requests.
-- Corrective migration: the original groups/events migration may already be applied.
-- Validate on an isolated Supabase preview before applying to production.
begin;

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
