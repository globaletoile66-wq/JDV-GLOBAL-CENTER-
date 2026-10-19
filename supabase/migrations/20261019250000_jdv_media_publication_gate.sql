-- JDV Media: editorial publication gate.
-- A transition to published requires an organization admin/super-admin, an approved editorial review,
-- and at least one verified rights declaration. No automatic publishing is performed.
create or replace function public.media_guard_publication()
returns trigger language plpgsql security invoker set search_path = public
as $$
declare
  v_org_id uuid;
  v_authorized boolean := false;
begin
  if new.status = 'published' and (tg_op = 'INSERT' or old.status is distinct from 'published') then
    select c.organization_id into v_org_id
      from public.media_channels c
     where c.id = new.channel_id;

    v_authorized := public.is_super_admin()
      or (v_org_id is not null and public.is_org_admin(v_org_id));

    if not v_authorized then
      raise exception 'Publishing requires a media or organization administrator';
    end if;

    if not exists (
      select 1 from public.media_editorial_reviews r
       where r.content_id = new.id and r.decision = 'approved'
    ) then
      raise exception 'An approved editorial review is required before publication';
    end if;

    if not exists (
      select 1 from public.media_content_rights rights
       where rights.content_id = new.id and rights.review_status = 'verified'
    ) then
      raise exception 'At least one verified rights declaration is required before publication';
    end if;

    if new.published_at is null then
      new.published_at := now();
    end if;
  end if;
  return new;
end;
$$;
drop trigger if exists media_publication_gate on public.media_contents;
create trigger media_publication_gate
before insert or update of status, published_at on public.media_contents
for each row execute function public.media_guard_publication();
