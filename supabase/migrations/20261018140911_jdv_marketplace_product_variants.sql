-- JDV Marketplace: structured product variants (size, colour, model, pack size, etc.).
create table if not exists public.marketplace_product_variants (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.marketplace_listings(id) on delete cascade,
  sku text,
  title text not null,
  option_values jsonb not null default '{}'::jsonb,
  price numeric(14,2),
  stock_quantity integer not null default 0 check (stock_quantity >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint marketplace_product_variants_price_nonnegative check (price is null or price >= 0)
);
create unique index if not exists marketplace_product_variants_listing_sku_unique
  on public.marketplace_product_variants (listing_id, lower(sku))
  where sku is not null and length(trim(sku)) > 0;
create index if not exists marketplace_product_variants_listing_active_idx
  on public.marketplace_product_variants (listing_id, is_active);
alter table public.marketplace_product_variants enable row level security;
drop policy if exists marketplace_variants_read_published_or_owned on public.marketplace_product_variants;
create policy marketplace_variants_read_published_or_owned
  on public.marketplace_product_variants for select to anon, authenticated
  using (
    (is_active and exists (
      select 1 from public.marketplace_listings l
      where l.id = listing_id and l.listing_status = 'published'::public.marketplace_listing_status
    ))
    or exists (
      select 1 from public.marketplace_listings l
      join public.marketplace_sellers s on s.id = l.seller_id
      where l.id = listing_id and s.user_id = (select auth.uid())
    )
  );
drop policy if exists marketplace_variants_insert_owned on public.marketplace_product_variants;
create policy marketplace_variants_insert_owned
  on public.marketplace_product_variants for insert to authenticated
  with check (exists (
    select 1 from public.marketplace_listings l
    join public.marketplace_sellers s on s.id = l.seller_id
    where l.id = listing_id and s.user_id = (select auth.uid())
  ));
drop policy if exists marketplace_variants_update_owned on public.marketplace_product_variants;
create policy marketplace_variants_update_owned
  on public.marketplace_product_variants for update to authenticated
  using (exists (
    select 1 from public.marketplace_listings l
    join public.marketplace_sellers s on s.id = l.seller_id
    where l.id = listing_id and s.user_id = (select auth.uid())
  ))
  with check (exists (
    select 1 from public.marketplace_listings l
    join public.marketplace_sellers s on s.id = l.seller_id
    where l.id = listing_id and s.user_id = (select auth.uid())
  ));
drop policy if exists marketplace_variants_delete_owned on public.marketplace_product_variants;
create policy marketplace_variants_delete_owned
  on public.marketplace_product_variants for delete to authenticated
  using (exists (
    select 1 from public.marketplace_listings l
    join public.marketplace_sellers s on s.id = l.seller_id
    where l.id = listing_id and s.user_id = (select auth.uid())
  ));
