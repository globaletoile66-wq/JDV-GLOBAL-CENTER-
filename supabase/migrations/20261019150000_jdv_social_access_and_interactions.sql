-- JDV Social access rules: public profiles, visibility-aware posts, and real interactions.
-- Additive branch migration only. Review and test before applying to any shared/production database.

begin;

drop policy if exists social_profiles_access on public.social_profiles;
drop policy if exists social_posts_access on public.social_posts;
drop policy if exists social_comments_access on public.social_comments;
drop policy if exists social_reactions_access on public.social_reactions;
drop policy if exists social_follows_access on public.social_follows;

-- Profiles: members can discover active profiles; owners can always read their own.
create policy social_profiles_select on public.social_profiles
for select to authenticated
using (user_id = (select auth.uid()) or profile_status = 'active' or is_super_admin());

create policy social_profiles_insert on public.social_profiles
for insert to authenticated
with check (user_id = (select auth.uid()) and not is_super_admin() or is_super_admin());

create policy social_profiles_update on public.social_profiles
for update to authenticated
using (user_id = (select auth.uid()) or is_super_admin())
with check (user_id = (select auth.uid()) or is_super_admin());

create policy social_profiles_delete on public.social_profiles
for delete to authenticated
using (user_id = (select auth.uid()) or is_super_admin());

-- Posts: respect public / followers / private visibility, and hide non-published posts from other members.
create policy social_posts_select on public.social_posts
for select to authenticated
using (
  author_user_id = (select auth.uid())
  or is_super_admin()
  or (
    status = 'published'
    and (
      visibility = 'public'
      or (
        visibility = 'followers'
        and exists (
          select 1 from public.social_follows f
          where f.follower_user_id = (select auth.uid())
            and f.following_user_id = social_posts.author_user_id
            and f.status = 'active'
        )
      )
    )
  )
);

create policy social_posts_insert on public.social_posts
for insert to authenticated
with check (author_user_id = (select auth.uid()) or is_super_admin());

create policy social_posts_update on public.social_posts
for update to authenticated
using (author_user_id = (select auth.uid()) or is_super_admin())
with check (author_user_id = (select auth.uid()) or is_super_admin());

create policy social_posts_delete on public.social_posts
for delete to authenticated
using (author_user_id = (select auth.uid()) or is_super_admin());

-- Comments: only visible where the parent post is visible to the current member.
create policy social_comments_select on public.social_comments
for select to authenticated
using (
  user_id = (select auth.uid())
  or is_super_admin()
  or exists (
    select 1 from public.social_posts p
    where p.id = social_comments.post_id
      and p.status = 'published'
      and (
        p.author_user_id = (select auth.uid())
        or p.visibility = 'public'
        or (
          p.visibility = 'followers'
          and exists (
            select 1 from public.social_follows f
            where f.follower_user_id = (select auth.uid())
              and f.following_user_id = p.author_user_id
              and f.status = 'active'
          )
        )
      )
  )
);

create policy social_comments_insert on public.social_comments
for insert to authenticated
with check (
  user_id = (select auth.uid())
  and exists (
    select 1 from public.social_posts p
    where p.id = social_comments.post_id
      and p.status = 'published'
      and (
        p.author_user_id = (select auth.uid())
        or p.visibility = 'public'
        or (
          p.visibility = 'followers'
          and exists (
            select 1 from public.social_follows f
            where f.follower_user_id = (select auth.uid())
              and f.following_user_id = p.author_user_id
              and f.status = 'active'
          )
        )
      )
  )
);

create policy social_comments_update on public.social_comments
for update to authenticated
using (user_id = (select auth.uid()) or is_super_admin())
with check (user_id = (select auth.uid()) or is_super_admin());

create policy social_comments_delete on public.social_comments
for delete to authenticated
using (user_id = (select auth.uid()) or is_super_admin());

-- Reactions: visible on posts the member is allowed to see; members may change only their own reactions.
create policy social_reactions_select on public.social_reactions
for select to authenticated
using (
  user_id = (select auth.uid())
  or is_super_admin()
  or exists (
    select 1 from public.social_posts p
    where p.id = social_reactions.post_id
      and p.status = 'published'
      and (
        p.author_user_id = (select auth.uid())
        or p.visibility = 'public'
        or (
          p.visibility = 'followers'
          and exists (
            select 1 from public.social_follows f
            where f.follower_user_id = (select auth.uid())
              and f.following_user_id = p.author_user_id
              and f.status = 'active'
          )
        )
      )
  )
);

create policy social_reactions_insert on public.social_reactions
for insert to authenticated
with check (
  user_id = (select auth.uid())
  and exists (
    select 1 from public.social_posts p
    where p.id = social_reactions.post_id
      and p.status = 'published'
      and (
        p.author_user_id = (select auth.uid())
        or p.visibility = 'public'
        or (
          p.visibility = 'followers'
          and exists (
            select 1 from public.social_follows f
            where f.follower_user_id = (select auth.uid())
              and f.following_user_id = p.author_user_id
              and f.status = 'active'
          )
        )
      )
  )
);

create policy social_reactions_update on public.social_reactions
for update to authenticated
using (user_id = (select auth.uid()) or is_super_admin())
with check (user_id = (select auth.uid()) or is_super_admin());

create policy social_reactions_delete on public.social_reactions
for delete to authenticated
using (user_id = (select auth.uid()) or is_super_admin());

-- Follows: either participant can inspect the relationship; only the follower controls it.
create policy social_follows_select on public.social_follows
for select to authenticated
using (follower_user_id = (select auth.uid()) or following_user_id = (select auth.uid()) or is_super_admin());

create policy social_follows_insert on public.social_follows
for insert to authenticated
with check (
  follower_user_id = (select auth.uid())
  and follower_user_id <> following_user_id
);

create policy social_follows_update on public.social_follows
for update to authenticated
using (follower_user_id = (select auth.uid()) or is_super_admin())
with check (follower_user_id = (select auth.uid()) or is_super_admin());

create policy social_follows_delete on public.social_follows
for delete to authenticated
using (follower_user_id = (select auth.uid()) or is_super_admin());

-- Feed and interaction access paths. Reuse existing author/post/following indexes from the live schema.
create index if not exists social_posts_feed_created_at_idx
  on public.social_posts (created_at desc);
create unique index if not exists social_profiles_user_id_key
  on public.social_profiles (user_id);
create index if not exists social_comments_user_id_idx
  on public.social_comments (user_id);
create index if not exists social_reactions_user_id_idx
  on public.social_reactions (user_id);
create index if not exists social_reactions_post_type_idx
  on public.social_reactions (post_id, reaction_type);

commit;
