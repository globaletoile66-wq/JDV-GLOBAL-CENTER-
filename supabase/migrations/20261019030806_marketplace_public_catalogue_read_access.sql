-- Public visitors can read published marketplace listings only.
-- Seller write access remains restricted by marketplace_listings_seller_all.
drop policy if exists marketplace_listings_public_read on public.marketplace_listings;
create policy marketplace_listings_public_read
  on public.marketplace_listings
  for select
  to public
  using (listing_status = 'published'::public.marketplace_listing_status);
