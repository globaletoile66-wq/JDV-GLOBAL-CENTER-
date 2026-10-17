-- APPLIQUÉ en production le 2026-10-10 (jdv_platform_reviews_v1). Testé : insertion forcée en « pending »,
-- note hors 1-5 refusée, modération réservée aux super admins actifs, visiteurs sans accès à la table.
create table if not exists public.platform_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  rating int not null check (rating between 1 and 5),
  title text check (title is null or char_length(title) <= 120),
  comment text check (comment is null or char_length(comment) <= 1000),
  display_name text not null check (char_length(btrim(display_name)) between 1 and 60),
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.platform_reviews enable row level security;

create policy platform_reviews_owner_select on public.platform_reviews
  for select to authenticated using (user_id = (select auth.uid()) or public.is_super_admin());
create policy platform_reviews_owner_insert on public.platform_reviews
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy platform_reviews_owner_update on public.platform_reviews
  for update to authenticated using (user_id = (select auth.uid()) or public.is_super_admin())
  with check (user_id = (select auth.uid()) or public.is_super_admin());
create policy platform_reviews_owner_delete on public.platform_reviews
  for delete to authenticated using (user_id = (select auth.uid()) or public.is_super_admin());

create or replace function public.platform_reviews_guard()
returns trigger language plpgsql security definer set search_path = public, pg_catalog as $$
begin
  if auth.uid() is not null and public.is_super_admin() and tg_op = 'UPDATE'
     and new.user_id = old.user_id and new.rating = old.rating
     and new.comment is not distinct from old.comment and new.title is not distinct from old.title then
    new.updated_at := now();
    return new;                    -- modération par un super admin : seul le statut change
  end if;
  if auth.uid() is not null then
    if tg_op = 'INSERT' then new.user_id := auth.uid();
    else new.user_id := old.user_id; end if;
    new.status := 'pending';
  end if;
  new.display_name := btrim(new.display_name);
  new.title := nullif(btrim(coalesce(new.title, '')), '');
  new.comment := nullif(btrim(coalesce(new.comment, '')), '');
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists trg_platform_reviews_guard on public.platform_reviews;
create trigger trg_platform_reviews_guard before insert or update on public.platform_reviews
for each row execute function public.platform_reviews_guard();
revoke all on function public.platform_reviews_guard() from public, anon, authenticated;

revoke all on public.platform_reviews from anon;
revoke truncate, references, trigger on public.platform_reviews from authenticated;

create or replace function public.public_platform_reviews(p_limit int default 20)
returns table(id uuid, rating int, title text, comment text, display_name text, created_at timestamptz)
language sql stable security definer set search_path = public, pg_catalog as $$
  select r.id, r.rating, r.title, r.comment, r.display_name, r.created_at
  from public.platform_reviews r
  where r.status = 'approved'
  order by r.created_at desc
  limit least(greatest(coalesce(p_limit, 20), 1), 50);
$$;

create or replace function public.public_platform_review_stats()
returns table(review_count bigint, average_rating numeric)
language sql stable security definer set search_path = public, pg_catalog as $$
  select count(*), round(avg(rating)::numeric, 1) from public.platform_reviews where status = 'approved';
$$;

create or replace function public.platform_review_moderate(p_review_id uuid, p_status text)
returns void language plpgsql security definer set search_path = public, pg_catalog as $$
begin
  if not public.is_super_admin() then raise exception 'Accès réservé aux administrateurs'; end if;
  if p_status not in ('approved','rejected','pending') then raise exception 'Statut invalide'; end if;
  update public.platform_reviews set status = p_status where id = p_review_id;
end $$;

revoke all on function public.public_platform_reviews(int) from public;
revoke all on function public.public_platform_review_stats() from public;
revoke all on function public.platform_review_moderate(uuid, text) from public, anon;
grant execute on function public.public_platform_reviews(int) to anon, authenticated;
grant execute on function public.public_platform_review_stats() to anon, authenticated;
grant execute on function public.platform_review_moderate(uuid, text) to authenticated;
