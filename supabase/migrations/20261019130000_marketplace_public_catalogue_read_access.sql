-- Public catalogue reads must work for both anonymous visitors and signed-in shoppers.
-- Seller writes remain restricted by marketplace_listings_seller_all.
DROP POLICY IF EXISTS marketplace_listings_public_read ON public.marketplace_listings;
CREATE POLICY marketplace_listings_public_read ON public.marketplace_listings
  FOR SELECT TO public
  USING (listing_status = 'published'::public.marketplace_listing_status);
