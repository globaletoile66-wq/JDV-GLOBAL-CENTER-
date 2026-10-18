-- JDV Marketplace: authenticated shoppers must be able to read published listings.
-- Existing public-read policy was limited to anon, which hides the catalogue from signed-in users.
drop policy if exists marketplace_listings_authenticated_public_read on public.marketplace_listings;
create policy marketplace_listings_authenticated_public_read
  on public.marketplace_listings
  for select
  to authenticated
  using (listing_status = 'published'::public.marketplace_listing_status);
