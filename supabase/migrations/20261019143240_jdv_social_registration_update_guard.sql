-- JDV Social: prevent changing the event/user keys of an existing registration.
-- Also prevent reactivating a registration for an unpublished or inaccessible event.
-- Candidate corrective migration: validate in an isolated Supabase preview first.
begin;

-- The client only changes registration status. Do not grant authenticated users
-- table-wide UPDATE, which would let them change event_id and bypass INSERT RLS.
revoke update on table public.social_event_registrations from authenticated;
grant update (status) on table public.social_event_registrations to authenticated;

drop policy if exists social_event_registrations_update on public.social_event_registrations;

create policy social_event_registrations_update
on public.social_event_registrations
for update to authenticated
using (user_id = (select auth.uid()))
with check (
  user_id = (select auth.uid())
  and status in ('registered', 'cancelled')
  and (
    status = 'cancelled'
    or exists (
      select 1
      from public.social_events e
      where e.id = social_event_registrations.event_id
        and e.status = 'published'
        and (
          e.visibility = 'public'
          or (
            e.visibility = 'members'
            and e.group_id is not null
            and public.social_is_group_member(e.group_id)
          )
        )
    )
  )
);

commit;

notify pgrst, 'reload schema';
