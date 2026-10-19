-- JDV Media phase 2: rights declarations and creator studio support.
-- Additive migration; no changes to historical CRM or remote schema.
create table if not exists public.media_content_rights (
  id uuid primary key default gen_random_uuid(),
  content_id uuid not null references public.media_contents(id) on delete cascade,
  rights_holder_user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  rights_type text not null check (rights_type in ('original_work','licensed','public_domain','commissioned','third_party_permission')),
  license_scope text not null default 'platform_distribution' check (license_scope in ('platform_distribution','commercial_distribution','advertising','subscription','all_media')),
  territories text[] not null default array['Africa']::text[],
  consent_confirmed boolean not null default false check (consent_confirmed = true),
  evidence_url text check (evidence_url is null or length(evidence_url) <= 2000),
  notes text check (notes is null or length(notes) <= 4000),
  review_status text not null default 'pending' check (review_status in ('pending','verified','changes_requested','rejected')),
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (content_id, rights_holder_user_id)
);
create index if not exists idx_media_rights_owner on public.media_content_rights(rights_holder_user_id, created_at desc);
create index if not exists idx_media_rights_review on public.media_content_rights(review_status, created_at);
alter table public.media_content_rights enable row level security;
drop policy if exists media_rights_owner_read on public.media_content_rights;
create policy media_rights_owner_read on public.media_content_rights for select to authenticated
using (rights_holder_user_id = auth.uid() or public.is_super_admin());
drop policy if exists media_rights_owner_insert on public.media_content_rights;
create policy media_rights_owner_insert on public.media_content_rights for insert to authenticated
with check (
  rights_holder_user_id = auth.uid()
  and review_status = 'pending'
  and reviewed_by is null
  and exists (select 1 from public.media_contents c where c.id = content_id and c.author_user_id = auth.uid())
);
drop policy if exists media_rights_owner_update on public.media_content_rights;
create policy media_rights_owner_update on public.media_content_rights for update to authenticated
using (rights_holder_user_id = auth.uid() and review_status in ('pending','changes_requested'))
with check (
  rights_holder_user_id = auth.uid()
  and review_status in ('pending','changes_requested')
  and reviewed_by is null
);
drop policy if exists media_rights_admin_update on public.media_content_rights;
create policy media_rights_admin_update on public.media_content_rights for update to authenticated
using (public.is_super_admin()) with check (public.is_super_admin());
drop policy if exists media_rights_admin_delete on public.media_content_rights;
create policy media_rights_admin_delete on public.media_content_rights for delete to authenticated
using (public.is_super_admin());
grant select, insert, update on public.media_content_rights to authenticated;
grant delete on public.media_content_rights to authenticated;
create or replace function public.media_guard_rights_review()
returns trigger language plpgsql security invoker set search_path = public
as $$
begin
  if not public.is_super_admin() then
    if tg_op = 'INSERT' then
      new.review_status := 'pending';
      new.reviewed_by := null;
      new.reviewed_at := null;
    elsif new.review_status is distinct from old.review_status
       or new.reviewed_by is distinct from old.reviewed_by
       or new.reviewed_at is distinct from old.reviewed_at then
      raise exception 'Media rights verification requires a media administrator';
    end if;
  else
    if new.review_status in ('verified','changes_requested','rejected') then
      new.reviewed_by := auth.uid();
      new.reviewed_at := now();
    end if;
  end if;
  new.updated_at := now();
  return new;
end;
$$;
drop trigger if exists media_rights_review_guard on public.media_content_rights;
create trigger media_rights_review_guard before insert or update on public.media_content_rights
for each row execute function public.media_guard_rights_review();
