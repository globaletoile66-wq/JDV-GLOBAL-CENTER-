create or replace function public.marketplace_public_store(p_slug text)
returns table (
  id uuid,
  shop_name text,
  shop_slug text,
  description text,
  logo_url text,
  cover_url text,
  city text,
  country_id uuid,
  rating_average numeric,
  rating_count integer,
  total_sales integer,
  is_verified boolean
)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select s.id, s.shop_name, s.shop_slug, s.description, s.logo_url, s.cover_url,
         s.city, s.country_id, s.rating_average, s.rating_count, s.total_sales, s.is_verified
  from public.marketplace_sellers s
  where s.shop_slug = p_slug
    and s.seller_status = 'active'::public.marketplace_seller_status
  limit 1;
$$;
revoke all on function public.marketplace_public_store(text) from public;
grant execute on function public.marketplace_public_store(text) to anon, authenticated;
