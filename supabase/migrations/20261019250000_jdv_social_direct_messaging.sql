-- JDV Social direct messaging: private one-to-one conversations and messages.
-- Access is participant-scoped; message content is immutable after sending.
begin;

create table if not exists public.social_conversations (
  id uuid primary key default gen_random_uuid(),
  user_a_id uuid not null references auth.users(id) on delete cascade,
  user_b_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint social_conversations_distinct_users check (user_a_id <> user_b_id),
  constraint social_conversations_canonical_pair check (user_a_id < user_b_id),
  constraint social_conversations_pair_unique unique (user_a_id, user_b_id)
);

create table if not exists public.social_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.social_conversations(id) on delete cascade,
  sender_user_id uuid not null references auth.users(id) on delete cascade,
  body text not null check (length(trim(body)) between 1 and 5000),
  created_at timestamptz not null default now(),
  read_at timestamptz
);

create index if not exists social_conversations_user_a_updated_idx
  on public.social_conversations (user_a_id, updated_at desc);
create index if not exists social_conversations_user_b_updated_idx
  on public.social_conversations (user_b_id, updated_at desc);
create index if not exists social_messages_conversation_created_idx
  on public.social_messages (conversation_id, created_at asc);

alter table public.social_conversations enable row level security;
alter table public.social_messages enable row level security;

revoke all on table public.social_conversations, public.social_messages from anon;
revoke all on table public.social_conversations, public.social_messages from authenticated;
grant select, insert on table public.social_conversations to authenticated;
grant select, insert on table public.social_messages to authenticated;
grant update (read_at) on table public.social_messages to authenticated;

drop policy if exists social_conversations_select_participant on public.social_conversations;
create policy social_conversations_select_participant
  on public.social_conversations for select to authenticated
  using (user_a_id = (select auth.uid()) or user_b_id = (select auth.uid()));

drop policy if exists social_conversations_insert_participant on public.social_conversations;
create policy social_conversations_insert_participant
  on public.social_conversations for insert to authenticated
  with check (
    (user_a_id = (select auth.uid()) or user_b_id = (select auth.uid()))
    and user_a_id <> user_b_id
    and user_a_id < user_b_id
  );

drop policy if exists social_messages_select_participant on public.social_messages;
create policy social_messages_select_participant
  on public.social_messages for select to authenticated
  using (
    exists (
      select 1 from public.social_conversations c
      where c.id = social_messages.conversation_id
        and (c.user_a_id = (select auth.uid()) or c.user_b_id = (select auth.uid()))
    )
  );

drop policy if exists social_messages_insert_sender on public.social_messages;
create policy social_messages_insert_sender
  on public.social_messages for insert to authenticated
  with check (
    sender_user_id = (select auth.uid())
    and exists (
      select 1 from public.social_conversations c
      where c.id = social_messages.conversation_id
        and (c.user_a_id = (select auth.uid()) or c.user_b_id = (select auth.uid()))
    )
  );

drop policy if exists social_messages_update_recipient_read_at on public.social_messages;
create policy social_messages_update_recipient_read_at
  on public.social_messages for update to authenticated
  using (
    sender_user_id <> (select auth.uid())
    and exists (
      select 1 from public.social_conversations c
      where c.id = social_messages.conversation_id
        and (c.user_a_id = (select auth.uid()) or c.user_b_id = (select auth.uid()))
    )
  )
  with check (
    sender_user_id <> (select auth.uid())
    and exists (
      select 1 from public.social_conversations c
      where c.id = social_messages.conversation_id
        and (c.user_a_id = (select auth.uid()) or c.user_b_id = (select auth.uid()))
    )
  );

commit;

notify pgrst, 'reload schema';
