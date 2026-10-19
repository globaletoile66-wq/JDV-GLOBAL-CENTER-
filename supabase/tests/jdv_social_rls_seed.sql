-- Seed rows for RLS behavior checks in the disposable PostgreSQL database only.
insert into auth.users(id) values
 ('00000000-0000-0000-0000-000000000001'),
 ('00000000-0000-0000-0000-000000000002'),
 ('00000000-0000-0000-0000-000000000003');

insert into public.social_groups(id, name, slug, visibility, status, created_by) values
 ('10000000-0000-0000-0000-000000000001', 'Private team', 'private-team', 'private', 'active', '00000000-0000-0000-0000-000000000001'),
 ('10000000-0000-0000-0000-000000000002', 'Admin team', 'admin-team', 'public', 'active', '00000000-0000-0000-0000-000000000001');

insert into public.social_group_memberships(group_id, user_id, role, status) values
 ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'member', 'pending'),
 ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000003', 'member', 'blocked'),
 ('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000002', 'admin', 'active');

insert into public.social_events(id, title, starts_at, visibility, status, created_by, group_id) values
 ('20000000-0000-0000-0000-000000000001', 'Public event one', now() + interval '1 day', 'public', 'published', '00000000-0000-0000-0000-000000000001', null),
 ('20000000-0000-0000-0000-000000000002', 'Public event two', now() + interval '2 days', 'public', 'published', '00000000-0000-0000-0000-000000000001', null),
 ('20000000-0000-0000-0000-000000000003', 'Member owned event', now() + interval '3 days', 'public', 'published', '00000000-0000-0000-0000-000000000002', null),
 ('20000000-0000-0000-0000-000000000004', 'Group event', now() + interval '4 days', 'public', 'published', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002');

insert into public.social_event_registrations(event_id, user_id, status) values
 ('20000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'registered');

insert into public.social_posts(id, author_user_id, status, visibility) values
 ('30000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'published', 'public'),
 ('30000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000002', 'draft', 'public');

insert into public.social_comments(id, post_id, user_id, body) values
 ('40000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'Test comment');

insert into public.social_conversations(id, user_a_id, user_b_id) values
 ('50000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002');

insert into public.social_messages(id, conversation_id, sender_user_id, body) values
 ('60000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Private message A to B');
