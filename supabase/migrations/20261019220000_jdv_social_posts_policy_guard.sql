-- JDV Social: separate post read and write policies.
-- The current social_posts_access policy is FOR ALL and includes visibility='public'
-- in USING; that can inadvertently permit deleting another author's public post.
-- Candidate only: validate on an isolated Supabase preview before applying remotely.
begin;

drop policy if exists social_posts_access on public.social_posts;
drop policy if exists social_posts_select on public.social_posts;
drop policy if exists social_posts_insert on public.social_posts;
drop policy if exists social_posts_update on public.social_posts;
drop policy if exists social_posts_delete on public.social_posts;

create policy social_posts_select
on public.social_posts
for select to authenticated
using (
  author_user_id = (select auth.uid())
  or is_super_admin()
  or (status = 'published' and visibility = 'public')
);

create policy social_posts_insert
on public.social_posts
for insert to authenticated
with check (
  author_user_id = (select auth.uid())
  or is_super_admin()
);

create policy social_posts_update
on public.social_posts
for update to authenticated
using (
  author_user_id = (select auth.uid())
  or is_super_admin()
)
with check (
  author_user_id = (select auth.uid())
  or is_super_admin()
);

create policy social_posts_delete
on public.social_posts
for delete to authenticated
using (
  author_user_id = (select auth.uid())
  or is_super_admin()
);

commit;

notify pgrst, 'reload schema';
