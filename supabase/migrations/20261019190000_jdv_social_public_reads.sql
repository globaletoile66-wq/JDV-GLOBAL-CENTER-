-- JDV Social: public profile reads and post-scoped reaction/comment reads.
-- Candidate migration only: validate on an isolated Supabase preview before applying remotely.
begin;

-- Profiles can be displayed on public posts, while writes remain owner/admin-only.
drop policy if exists social_profiles_access on public.social_profiles;
drop policy if exists social_profiles_select on public.social_profiles;
drop policy if exists social_profiles_insert on public.social_profiles;
drop policy if exists social_profiles_update on public.social_profiles;
drop policy if exists social_profiles_delete on public.social_profiles;

create policy social_profiles_select on public.social_profiles
for select to authenticated
using (user_id = (select auth.uid()) or profile_status = 'active' or is_super_admin());

create policy social_profiles_insert on public.social_profiles
for insert to authenticated
with check (
  (user_id = (select auth.uid()) or is_super_admin())
  and exists (
    select 1 from public.social_posts p
    where p.id = social_comments.post_id
      and (
        p.author_user_id = (select auth.uid())
        or (p.status = 'published' and p.visibility = 'public')
        or is_super_admin()
      )
  )
);

create policy social_profiles_update on public.social_profiles
for update to authenticated
using (user_id = (select auth.uid()) or is_super_admin())
with check (user_id = (select auth.uid()) or is_super_admin());

create policy social_profiles_delete on public.social_profiles
for delete to authenticated
using (user_id = (select auth.uid()) or is_super_admin());

-- Read reactions only when the related post is visible to the current member.
drop policy if exists social_reactions_access on public.social_reactions;
drop policy if exists social_reactions_select on public.social_reactions;
drop policy if exists social_reactions_insert on public.social_reactions;
drop policy if exists social_reactions_update on public.social_reactions;
drop policy if exists social_reactions_delete on public.social_reactions;

create policy social_reactions_select on public.social_reactions
for select to authenticated
using (
  user_id = (select auth.uid())
  or is_super_admin()
  or exists (
    select 1 from public.social_posts p
    where p.id = social_reactions.post_id
      and p.status = 'published'
      and (p.visibility = 'public' or p.author_user_id = (select auth.uid()))
  )
);

create policy social_reactions_insert on public.social_reactions
for insert to authenticated
with check (
  (user_id = (select auth.uid()) or is_super_admin())
  and exists (
    select 1 from public.social_posts p
    where p.id = social_reactions.post_id
      and (
        p.author_user_id = (select auth.uid())
        or (p.status = 'published' and p.visibility = 'public')
        or is_super_admin()
      )
  )
);

create policy social_reactions_update on public.social_reactions
for update to authenticated
using (user_id = (select auth.uid()) or is_super_admin())
with check (
  (user_id = (select auth.uid()) or is_super_admin())
  and exists (
    select 1 from public.social_posts p
    where p.id = social_reactions.post_id
      and (
        p.author_user_id = (select auth.uid())
        or (p.status = 'published' and p.visibility = 'public')
        or is_super_admin()
      )
  )
);

create policy social_reactions_delete on public.social_reactions
for delete to authenticated
using (user_id = (select auth.uid()) or is_super_admin());

-- Keep comment ownership and post association immutable through the client.
-- The UI may edit only the comment body; RLS still checks the target post.
revoke update on table public.social_comments from authenticated;
grant update (body) on table public.social_comments to authenticated;

-- Comments are readable when their post is public/published, by the commenter,
-- by the post author, or by the super-administrator.
drop policy if exists social_comments_access on public.social_comments;
drop policy if exists social_comments_select on public.social_comments;
drop policy if exists social_comments_insert on public.social_comments;
drop policy if exists social_comments_update on public.social_comments;
drop policy if exists social_comments_delete on public.social_comments;

create policy social_comments_select on public.social_comments
for select to authenticated
using (
  user_id = (select auth.uid())
  or is_super_admin()
  or exists (
    select 1 from public.social_posts p
    where p.id = social_comments.post_id
      and (
        p.author_user_id = (select auth.uid())
        or (p.status = 'published' and p.visibility = 'public')
      )
  )
);

create policy social_comments_insert on public.social_comments
for insert to authenticated
with check (
  (user_id = (select auth.uid()) or is_super_admin())
  and exists (
    select 1 from public.social_posts p
    where p.id = social_comments.post_id
      and (
        p.author_user_id = (select auth.uid())
        or (p.status = 'published' and p.visibility = 'public')
        or is_super_admin()
      )
  )
);

create policy social_comments_update on public.social_comments
for update to authenticated
using (
  user_id = (select auth.uid())
  or is_super_admin()
  or exists (
    select 1 from public.social_posts p
    where p.id = social_comments.post_id and p.author_user_id = (select auth.uid())
  )
)
with check (user_id = (select auth.uid()) or is_super_admin());

create policy social_comments_delete on public.social_comments
for delete to authenticated
using (
  user_id = (select auth.uid())
  or is_super_admin()
  or exists (
    select 1 from public.social_posts p
    where p.id = social_comments.post_id and p.author_user_id = (select auth.uid())
  )
);

commit;
