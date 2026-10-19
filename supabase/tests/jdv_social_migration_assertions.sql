-- Post-migration assertions for the disposable PostgreSQL test database.
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'social_profiles'
      and policyname = 'social_profiles_insert'
  ) then
    raise exception 'social_profiles_insert policy missing';
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'social_posts'
      and policyname = 'social_posts_delete'
  ) then
    raise exception 'separated social_posts_delete policy missing';
  end if;

  if has_table_privilege('anon', 'public.social_posts', 'SELECT') then
    raise exception 'anon unexpectedly retains SELECT on social_posts';
  end if;

  if has_table_privilege('authenticated', 'public.social_posts', 'TRUNCATE') then
    raise exception 'authenticated unexpectedly retains TRUNCATE on social_posts';
  end if;

  if not has_column_privilege('authenticated', 'public.social_event_registrations', 'status', 'UPDATE') then
    raise exception 'authenticated cannot update registration status';
  end if;

  if has_column_privilege('authenticated', 'public.social_event_registrations', 'event_id', 'UPDATE') then
    raise exception 'authenticated unexpectedly can update registration event_id';
  end if;

  if has_column_privilege('authenticated', 'public.social_groups', 'created_by', 'UPDATE') then
    raise exception 'authenticated unexpectedly can transfer group ownership';
  end if;

  if has_column_privilege('authenticated', 'public.social_events', 'created_by', 'UPDATE') then
    raise exception 'authenticated unexpectedly can transfer event ownership';
  end if;

  if not has_column_privilege('authenticated', 'public.social_groups', 'name', 'UPDATE') then
    raise exception 'authenticated cannot update allowed group name field';
  end if;

  if not exists (select 1 from pg_class c join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'public' and c.relname = 'social_conversations' and c.relrowsecurity) then
    raise exception 'social_conversations RLS is not enabled';
  end if;

  if not exists (select 1 from pg_class c join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'public' and c.relname = 'social_messages' and c.relrowsecurity) then
    raise exception 'social_messages RLS is not enabled';
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'social_messages' and policyname = 'social_messages_insert_sender') then
    raise exception 'social_messages_insert_sender policy missing';
  end if;

  if has_table_privilege('anon', 'public.social_messages', 'SELECT') then
    raise exception 'anon unexpectedly retains SELECT on social_messages';
  end if;

  if has_column_privilege('authenticated', 'public.social_messages', 'body', 'UPDATE') then
    raise exception 'authenticated unexpectedly can edit message bodies';
  end if;

  if not has_column_privilege('authenticated', 'public.social_messages', 'read_at', 'UPDATE') then
    raise exception 'authenticated cannot update message read receipts';
  end if;
end
$$;

select 'JDV Social SQL migration smoke test passed' as result;
