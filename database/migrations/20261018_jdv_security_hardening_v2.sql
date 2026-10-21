-- =====================================================================
-- JDV GLOBAL CENTER : durcissement de sécurité v2 (proposé le 2026-10-18)
-- Projet Supabase lncgghdbnkehdcyhqdfo. NON APPLIQUÉE : à valider avant exécution.
-- Aucune donnée n'est supprimée ni modifiée.
-- =====================================================================

-- 1) organization_members : un utilisateur ne pouvait pas seulement s'ajouter à SA propre organisation,
--    mais à n'importe laquelle, avec n'importe quel rôle (policy: user_id = auth.uid()).
--    Désormais : auto-ajout autorisé seulement dans une organisation dont il est le propriétaire (organizations.owner_id).
create or replace function public.org_is_owned_by_me(p_org uuid)
returns boolean language sql stable security definer set search_path = public, pg_catalog as $$
  select exists (select 1 from public.organizations o where o.id = p_org and o.owner_id = auth.uid());
$$;
revoke all on function public.org_is_owned_by_me(uuid) from public, anon;
grant execute on function public.org_is_owned_by_me(uuid) to authenticated;

drop policy if exists org_members_insert on public.organization_members;
create policy org_members_insert on public.organization_members for insert to authenticated
with check (
  public.is_super_admin()
  or public.is_org_admin(organization_id)
  or (user_id = (select auth.uid()) and public.org_is_owned_by_me(organization_id))
);

-- 2) marketplace_sellers : un vendeur pouvait s'insérer avec seller_status='active', is_verified=true, commission 0,
--    et changer seller_status lui-même par UPDATE (champ absent de la protection existante).
create or replace function public.marketplace_protect_seller_system_fields()
returns trigger language plpgsql security definer set search_path = public, pg_catalog as $$
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if public.is_super_admin() then return new; end if;
  if tg_op = 'INSERT' then
    new.user_id := auth.uid();
    new.seller_status := 'pending';
    new.is_verified := false; new.is_featured := false;
    new.commission_rate := 5.00;
    new.rating_average := 0; new.rating_count := 0; new.total_sales := 0;
  elsif tg_op = 'UPDATE' then
    if new.user_id <> old.user_id
       or new.total_sales is distinct from old.total_sales
       or new.rating_average is distinct from old.rating_average
       or new.rating_count is distinct from old.rating_count
       or new.commission_rate is distinct from old.commission_rate
       or new.is_verified is distinct from old.is_verified
       or new.is_featured is distinct from old.is_featured
       or new.seller_status is distinct from old.seller_status then
      raise exception 'Seller system fields cannot be modified directly';
    end if;
  end if;
  return new;
end; $$;
revoke all on function public.marketplace_protect_seller_system_fields() from public, anon, authenticated;

drop trigger if exists trg_marketplace_sellers_protect_system_ins on public.marketplace_sellers;
create trigger trg_marketplace_sellers_protect_system_ins
  before insert on public.marketplace_sellers for each row execute function public.marketplace_protect_seller_system_fields();

-- 3) Fonctions de trigger exposées en RPC sans raison : on retire l'EXECUTE (les triggers continuent de fonctionner).
revoke all on function public.jdvcrm_after_sale_v1() from public, anon, authenticated;
revoke all on function public.jdvcrm_sync_payment_totals_v1() from public, anon, authenticated;

-- 4) Fonction appelée par la page produit (compteur de vues) mais absente de la base.
create or replace function public.increment_listing_views(listing_uuid uuid)
returns void language sql security definer set search_path = public, pg_catalog as $$
  update public.marketplace_listings
     set view_count = coalesce(view_count, 0) + 1
   where id = listing_uuid and listing_status::text = 'active';
$$;
revoke all on function public.increment_listing_views(uuid) from public;
grant execute on function public.increment_listing_views(uuid) to anon, authenticated;
