-- APPLIQUÉ en production le 2026-10-10. Testé : 4 tarifs visibles par un visiteur, contact valide envoyé, email invalide
-- et message trop court refusés, 4e message en 1 h refusé, table fermée aux visiteurs, insertion directe refusée.

create or replace function public.public_subscription_plans()
returns table(code text, name text, description text, price numeric, currency text, duration_days int, trial_days int)
language sql stable security definer set search_path = public, pg_catalog as $$
  select p.code, p.name, p.description, p.price, p.currency, p.duration_days,
         nullif((p.features ->> 'trial_days'), '')::int
  from public.subscription_plans p
  where p.active
  order by p.duration_days, p.price;
$$;
revoke all on function public.public_subscription_plans() from public;
grant execute on function public.public_subscription_plans() to anon, authenticated;

create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 1 and 100),
  email text not null check (char_length(email) <= 200 and email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  subject text check (subject is null or char_length(subject) <= 150),
  message text not null check (char_length(btrim(message)) between 5 and 2000),
  status text not null default 'new' check (status in ('new','read','answered','spam')),
  created_at timestamptz not null default now()
);
create index if not exists contact_messages_email_created_idx on public.contact_messages(lower(email), created_at desc);
alter table public.contact_messages enable row level security;
create policy contact_messages_admin_select on public.contact_messages for select to authenticated using (public.is_super_admin());
create policy contact_messages_admin_update on public.contact_messages for update to authenticated using (public.is_super_admin()) with check (public.is_super_admin());
revoke all on public.contact_messages from anon;
revoke insert, delete, truncate, references, trigger on public.contact_messages from authenticated;

create or replace function public.public_submit_contact_message(p_name text, p_email text, p_subject text, p_message text)
returns void language plpgsql security definer set search_path = public, pg_catalog as $$
begin
  if exists (select 1 from public.contact_messages where lower(email) = lower(btrim(p_email)) and created_at > now() - interval '1 hour' having count(*) >= 3) then
    raise exception 'TOO_MANY_MESSAGES';
  end if;
  if (select count(*) from public.contact_messages where created_at > now() - interval '1 hour') >= 100 then
    raise exception 'SERVICE_BUSY';
  end if;
  insert into public.contact_messages(name, email, subject, message)
  values (btrim(p_name), btrim(p_email), nullif(btrim(coalesce(p_subject, '')), ''), btrim(p_message));
end $$;
revoke all on function public.public_submit_contact_message(text, text, text, text) from public;
grant execute on function public.public_submit_contact_message(text, text, text, text) to anon, authenticated;
