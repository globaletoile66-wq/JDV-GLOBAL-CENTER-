-- JDVPI: require an active central account for user-owned financial activity.
-- The account identity is Supabase Auth + public.profiles; no parallel user table is introduced.
begin;

create or replace function public.jdvpi_require_active_account(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_catalog
as $function$
declare
  v_status text;
begin
  if p_user_id is null then
    raise exception using errcode = '28000', message = 'Compte JDVPI requis';
  end if;

  select p.account_status::text
    into v_status
    from public.profiles p
   where p.id = p_user_id;

  if not found or v_status is distinct from 'active' then
    raise exception using errcode = '28000', message = 'Compte JDVPI absent, inactif ou suspendu';
  end if;
end;
$function$;

create or replace function public.jdvpi_guard_wallet_transaction_account()
returns trigger
language plpgsql
security definer
set search_path = public, pg_catalog
as $function$
declare
  v_owner_id uuid;
begin
  select w.user_id
    into v_owner_id
    from public.wallets w
   where w.id = new.wallet_id;

  if not found or v_owner_id is null then
    raise exception using errcode = '23503', message = 'Portefeuille JDVPI introuvable ou sans propriétaire';
  end if;

  perform public.jdvpi_require_active_account(v_owner_id);
  return new;
end;
$function$;

create or replace function public.jdvpi_guard_transfer_accounts()
returns trigger
language plpgsql
security definer
set search_path = public, pg_catalog
as $function$
declare
  v_wallet_owner uuid;
begin
  perform public.jdvpi_require_active_account(new.sender_user_id);

  select w.user_id
    into v_wallet_owner
    from public.wallets w
   where w.id = new.sender_wallet_id;

  if not found or v_wallet_owner is distinct from new.sender_user_id then
    raise exception using errcode = '42501', message = 'Le portefeuille expéditeur ne correspond pas au compte JDVPI';
  end if;

  if new.recipient_user_id is not null then
    perform public.jdvpi_require_active_account(new.recipient_user_id);
  end if;

  return new;
end;
$function$;

drop trigger if exists trg_jdvpi_wallet_transaction_account on public.wallet_transactions;
create trigger trg_jdvpi_wallet_transaction_account
before insert on public.wallet_transactions
for each row execute function public.jdvpi_guard_wallet_transaction_account();

drop trigger if exists trg_jdvpi_transfer_accounts on public.transfers;
create trigger trg_jdvpi_transfer_accounts
before insert on public.transfers
for each row execute function public.jdvpi_guard_transfer_accounts();

revoke all on function public.jdvpi_require_active_account(uuid) from public, anon, authenticated;
revoke all on function public.jdvpi_guard_wallet_transaction_account() from public, anon, authenticated;
revoke all on function public.jdvpi_guard_transfer_accounts() from public, anon, authenticated;

commit;
