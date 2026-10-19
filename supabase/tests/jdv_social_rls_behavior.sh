#!/usr/bin/env bash
set -euo pipefail

expect_denied() {
  local description="$1"
  local user_id="$2"
  local statement="$3"
  if psql -v ON_ERROR_STOP=1 -q -c "SET ROLE authenticated; SET request.jwt.claim.sub = '${user_id}'; ${statement}"; then
    echo "FAIL: operation unexpectedly succeeded: ${description}"
    exit 1
  else
    echo "PASS: denied as expected: ${description}"
  fi
}

expect_count() {
  local description="$1"
  local expected="$2"
  local query="$3"
  local actual
  actual="$(psql -qAt -v ON_ERROR_STOP=1 -c "${query}")"
  if [[ "${actual}" != "${expected}" ]]; then
    echo "FAIL: ${description}; expected '${expected}', got '${actual}'"
    exit 1
  fi
  echo "PASS: ${description}"
}

USER_A="00000000-0000-0000-0000-000000000001"
USER_B="00000000-0000-0000-0000-000000000002"
USER_C="00000000-0000-0000-0000-000000000003"
PRIVATE_GROUP="10000000-0000-0000-0000-000000000001"
ADMIN_GROUP="10000000-0000-0000-0000-000000000002"
EVENT_ONE="20000000-0000-0000-0000-000000000001"
EVENT_TWO="20000000-0000-0000-0000-000000000002"
OWN_EVENT="20000000-0000-0000-0000-000000000003"
GROUP_EVENT="20000000-0000-0000-0000-000000000004"
POST_PUBLIC="30000000-0000-0000-0000-000000000001"
POST_DRAFT="30000000-0000-0000-0000-000000000002"
COMMENT_ID="40000000-0000-0000-0000-000000000001"

expect_denied "private-group pending membership self-approval" "${USER_B}" "UPDATE public.social_group_memberships SET status='active' WHERE group_id='${PRIVATE_GROUP}' AND user_id='${USER_B}'"
psql -v ON_ERROR_STOP=1 -q -c "SET ROLE authenticated; SET request.jwt.claim.sub = '${USER_C}'; DELETE FROM public.social_group_memberships WHERE group_id='${PRIVATE_GROUP}' AND user_id='${USER_C}'"
expect_count "blocked membership row remains after self-delete attempt" "1" "SELECT count(*) FROM public.social_group_memberships WHERE group_id='${PRIVATE_GROUP}' AND user_id='${USER_C}' AND status='blocked'"
expect_denied "event registration event_id mutation" "${USER_B}" "UPDATE public.social_event_registrations SET event_id='${EVENT_TWO}' WHERE event_id='${EVENT_ONE}' AND user_id='${USER_B}'"
expect_denied "comment post_id mutation" "${USER_B}" "UPDATE public.social_comments SET post_id='${POST_DRAFT}' WHERE id='${COMMENT_ID}'"
expect_denied "group created_by mutation" "${USER_B}" "UPDATE public.social_groups SET created_by='${USER_B}' WHERE id='${ADMIN_GROUP}'"
expect_denied "event created_by mutation" "${USER_B}" "UPDATE public.social_events SET created_by='${USER_B}' WHERE id='${GROUP_EVENT}'"
expect_denied "event reassignment to unauthorized group" "${USER_B}" "UPDATE public.social_events SET group_id='${PRIVATE_GROUP}' WHERE id='${OWN_EVENT}'"

psql -v ON_ERROR_STOP=1 -q -c "SET ROLE authenticated; SET request.jwt.claim.sub = '${USER_B}'; UPDATE public.social_groups SET name='Admin team renamed' WHERE id='${ADMIN_GROUP}'"
psql -v ON_ERROR_STOP=1 -q -c "SET ROLE authenticated; SET request.jwt.claim.sub = '${USER_B}'; UPDATE public.social_events SET title='Group event edited' WHERE id='${GROUP_EVENT}'"
echo "PASS: authorized group admin can edit group and event"

psql -v ON_ERROR_STOP=1 -q -c "SET ROLE authenticated; SET request.jwt.claim.sub = '${USER_B}'; INSERT INTO public.social_profiles(user_id, profile_status) VALUES ('${USER_B}', 'active')"
expect_denied "profile creation for another user" "${USER_B}" "INSERT INTO public.social_profiles(user_id, profile_status) VALUES ('${USER_A}', 'active')"

expect_count "published public post visible" "1" "SET ROLE authenticated; SET request.jwt.claim.sub='${USER_B}'; SELECT count(*) FROM public.social_posts WHERE id='${POST_PUBLIC}'"
expect_count "public draft hidden from another member" "0" "SET ROLE authenticated; SET request.jwt.claim.sub='${USER_A}'; SELECT count(*) FROM public.social_posts WHERE id='${POST_DRAFT}'"
psql -v ON_ERROR_STOP=1 -q -c "SET ROLE authenticated; SET request.jwt.claim.sub = '${USER_B}'; DELETE FROM public.social_posts WHERE id='${POST_PUBLIC}'"
expect_count "another member's public post remains intact" "1" "SELECT count(*) FROM public.social_posts WHERE id='${POST_PUBLIC}'"


CONVERSATION_ONE="50000000-0000-0000-0000-000000000001"
MESSAGE_ONE="60000000-0000-0000-0000-000000000001"

expect_count "conversation visible to participant B" "1" "SET ROLE authenticated; SET request.jwt.claim.sub='${USER_B}'; SELECT count(*) FROM public.social_conversations WHERE id='${CONVERSATION_ONE}'"
expect_count "conversation hidden from nonparticipant C" "0" "SET ROLE authenticated; SET request.jwt.claim.sub='${USER_C}'; SELECT count(*) FROM public.social_conversations WHERE id='${CONVERSATION_ONE}'"
expect_count "message visible to participant B" "1" "SET ROLE authenticated; SET request.jwt.claim.sub='${USER_B}'; SELECT count(*) FROM public.social_messages WHERE id='${MESSAGE_ONE}'"
expect_count "message hidden from nonparticipant C" "0" "SET ROLE authenticated; SET request.jwt.claim.sub='${USER_C}'; SELECT count(*) FROM public.social_messages WHERE id='${MESSAGE_ONE}'"
expect_denied "nonparticipant cannot send a direct message" "${USER_C}" "INSERT INTO public.social_messages(conversation_id, sender_user_id, body) VALUES ('${CONVERSATION_ONE}', '${USER_C}', 'Unauthorized message')"
expect_denied "authenticated member cannot edit a sent message body" "${USER_B}" "UPDATE public.social_messages SET body='tampered' WHERE id='${MESSAGE_ONE}'"

psql -v ON_ERROR_STOP=1 -q -c "SET ROLE authenticated; SET request.jwt.claim.sub = '${USER_A}'; UPDATE public.social_messages SET read_at=now() WHERE id='${MESSAGE_ONE}'"
expect_count "sender cannot mark own message as read" "0" "SELECT count(*) FROM public.social_messages WHERE id='${MESSAGE_ONE}' AND read_at IS NOT NULL"
psql -v ON_ERROR_STOP=1 -q -c "SET ROLE authenticated; SET request.jwt.claim.sub = '${USER_B}'; UPDATE public.social_messages SET read_at=now() WHERE id='${MESSAGE_ONE}'"
expect_count "recipient can mark received message as read" "1" "SELECT count(*) FROM public.social_messages WHERE id='${MESSAGE_ONE}' AND read_at IS NOT NULL"

psql -v ON_ERROR_STOP=1 -q -c "SET ROLE authenticated; SET request.jwt.claim.sub = '${USER_B}'; INSERT INTO public.social_messages(conversation_id, sender_user_id, body) VALUES ('${CONVERSATION_ONE}', '${USER_B}', 'Reply from B')"
expect_count "conversation participants can exchange messages" "2" "SELECT count(*) FROM public.social_messages WHERE conversation_id='${CONVERSATION_ONE}'"

echo "JDV Social RLS behavior tests passed"
