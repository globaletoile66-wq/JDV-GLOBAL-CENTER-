-- Restore missing relationships only after verifying that existing rows have no orphans.
do $$
begin
  if exists (select 1 from public.article_categories ac left join public.organizations o on o.id = ac.organization_id where ac.organization_id is not null and o.id is null) then
    raise exception 'Orphan article_categories.organization_id values exist';
  end if;
  if exists (select 1 from public.login_security_events e left join auth.users u on u.id = e.user_id where e.user_id is not null and u.id is null) then
    raise exception 'Orphan login_security_events.user_id values exist';
  end if;
  if exists (select 1 from public.notification_preferences n left join auth.users u on u.id = n.user_id where u.id is null) then
    raise exception 'Orphan notification_preferences.user_id values exist';
  end if;
  if exists (select 1 from public.user_settings s left join auth.users u on u.id = s.user_id where u.id is null) then
    raise exception 'Orphan user_settings.user_id values exist';
  end if;
  if exists (select 1 from public.super_admin_modules sam left join public.super_admins sa on sa.user_id = sam.user_id where sa.user_id is null) then
    raise exception 'Orphan super_admin_modules.user_id values exist';
  end if;
end $$;

alter table public.article_categories
  add constraint article_categories_organization_id_fkey
  foreign key (organization_id) references public.organizations(id) on delete cascade;
alter table public.login_security_events
  add constraint login_security_events_user_id_fkey
  foreign key (user_id) references auth.users(id) on delete set null;
alter table public.notification_preferences
  add constraint notification_preferences_user_id_fkey
  foreign key (user_id) references auth.users(id) on delete cascade;
alter table public.user_settings
  add constraint user_settings_user_id_fkey
  foreign key (user_id) references auth.users(id) on delete cascade;
alter table public.super_admin_modules
  add constraint super_admin_modules_user_id_fkey
  foreign key (user_id) references public.super_admins(user_id) on delete cascade;

create index if not exists article_categories_organization_id_idx
  on public.article_categories(organization_id) where organization_id is not null;
create index if not exists login_security_events_user_id_idx
  on public.login_security_events(user_id) where user_id is not null;
create index if not exists notification_preferences_user_id_idx
  on public.notification_preferences(user_id);
create index if not exists user_settings_user_id_idx
  on public.user_settings(user_id);
create index if not exists super_admin_modules_user_id_idx
  on public.super_admin_modules(user_id);
