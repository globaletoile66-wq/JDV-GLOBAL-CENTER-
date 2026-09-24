-- ============================================================
-- JDV MARKETPLACE MODULE — Migration
-- Timestamp: 20260918300000
-- Depends on: JDV CORE (profiles, organizations, currencies, countries, notifications, audit_logs)
--             JDV PAY (wallets, wallet_transactions)
--             JDV BUSINESS (business_profiles, business_products)
-- ============================================================

-- ============================================================
-- 1. ENUM TYPES
-- ============================================================

DROP TYPE IF EXISTS public.marketplace_listing_status CASCADE;
CREATE TYPE public.marketplace_listing_status AS ENUM (
  'draft', 'pending_review', 'published', 'paused', 'sold_out', 'archived', 'rejected'
);

DROP TYPE IF EXISTS public.marketplace_order_status CASCADE;
CREATE TYPE public.marketplace_order_status AS ENUM (
  'pending', 'awaiting_payment', 'paid', 'confirmed', 'preparing', 'ready',
  'picked_up', 'in_transit', 'delivered', 'cancelled', 'refunded', 'returned'
);

DROP TYPE IF EXISTS public.marketplace_seller_status CASCADE;
CREATE TYPE public.marketplace_seller_status AS ENUM (
  'pending', 'active', 'suspended', 'rejected'
);

DROP TYPE IF EXISTS public.marketplace_return_status CASCADE;
CREATE TYPE public.marketplace_return_status AS ENUM (
  'requested', 'approved', 'rejected', 'received', 'refunded', 'failed'
);

DROP TYPE IF EXISTS public.marketplace_refund_status CASCADE;
CREATE TYPE public.marketplace_refund_status AS ENUM (
  'pending', 'approved', 'rejected', 'processing', 'completed', 'failed'
);

DROP TYPE IF EXISTS public.marketplace_review_status CASCADE;
CREATE TYPE public.marketplace_review_status AS ENUM (
  'pending', 'published', 'rejected', 'hidden'
);

DROP TYPE IF EXISTS public.marketplace_message_status CASCADE;
CREATE TYPE public.marketplace_message_status AS ENUM (
  'sent', 'delivered', 'read'
);

DROP TYPE IF EXISTS public.marketplace_settlement_status CASCADE;
CREATE TYPE public.marketplace_settlement_status AS ENUM (
  'pending', 'processing', 'completed', 'failed'
);

-- ============================================================
-- 2. CORE TABLES
-- ============================================================

-- Marketplace categories
CREATE TABLE IF NOT EXISTS public.marketplace_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID REFERENCES public.marketplace_categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  icon_name TEXT,
  image_url TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Seller profiles (linked to business_profiles or user profiles)
CREATE TABLE IF NOT EXISTS public.marketplace_sellers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  business_profile_id UUID REFERENCES public.business_profiles(id) ON DELETE SET NULL,
  shop_name TEXT NOT NULL,
  shop_slug TEXT NOT NULL UNIQUE,
  description TEXT,
  logo_url TEXT,
  cover_url TEXT,
  phone TEXT,
  email TEXT,
  website TEXT,
  country_id UUID REFERENCES public.countries(id) ON DELETE SET NULL,
  city TEXT,
  address TEXT,
  seller_status public.marketplace_seller_status DEFAULT 'pending',
  rating_average NUMERIC(3,2) DEFAULT 0,
  rating_count INTEGER DEFAULT 0,
  total_sales INTEGER DEFAULT 0,
  commission_rate NUMERIC(5,2) DEFAULT 5.00,
  is_verified BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Product listings
CREATE TABLE IF NOT EXISTS public.marketplace_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES public.marketplace_sellers(id) ON DELETE CASCADE,
  business_product_id UUID REFERENCES public.business_products(id) ON DELETE SET NULL,
  category_id UUID REFERENCES public.marketplace_categories(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  short_description TEXT,
  sku TEXT,
  price NUMERIC(18,2) NOT NULL,
  compare_at_price NUMERIC(18,2),
  currency_id UUID REFERENCES public.currencies(id) ON DELETE SET NULL,
  stock_quantity INTEGER DEFAULT 0,
  stock_reserved INTEGER DEFAULT 0,
  track_inventory BOOLEAN DEFAULT true,
  allow_backorder BOOLEAN DEFAULT false,
  weight NUMERIC(10,3),
  weight_unit TEXT DEFAULT 'kg',
  listing_status public.marketplace_listing_status DEFAULT 'draft',
  is_featured BOOLEAN DEFAULT false,
  is_digital BOOLEAN DEFAULT false,
  tags TEXT[],
  attributes JSONB DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  view_count INTEGER DEFAULT 0,
  sale_count INTEGER DEFAULT 0,
  rating_average NUMERIC(3,2) DEFAULT 0,
  rating_count INTEGER DEFAULT 0,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_marketplace_listings_slug_seller
  ON public.marketplace_listings(seller_id, slug);

-- Listing media (photos/videos)
CREATE TABLE IF NOT EXISTS public.marketplace_listing_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES public.marketplace_listings(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  media_type TEXT DEFAULT 'image',
  alt_text TEXT,
  sort_order INTEGER DEFAULT 0,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Price history
CREATE TABLE IF NOT EXISTS public.marketplace_price_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES public.marketplace_listings(id) ON DELETE CASCADE,
  old_price NUMERIC(18,2) NOT NULL,
  new_price NUMERIC(18,2) NOT NULL,
  changed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  changed_at TIMESTAMPTZ DEFAULT now()
);

-- Shopping carts
CREATE TABLE IF NOT EXISTS public.marketplace_carts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  session_id TEXT,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_marketplace_carts_user
  ON public.marketplace_carts(user_id);

-- Cart items
CREATE TABLE IF NOT EXISTS public.marketplace_cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_id UUID NOT NULL REFERENCES public.marketplace_carts(id) ON DELETE CASCADE,
  listing_id UUID NOT NULL REFERENCES public.marketplace_listings(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price NUMERIC(18,2) NOT NULL,
  currency_id UUID REFERENCES public.currencies(id) ON DELETE SET NULL,
  added_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Delivery addresses
CREATE TABLE IF NOT EXISTS public.marketplace_addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  label TEXT DEFAULT 'Domicile',
  full_name TEXT NOT NULL,
  phone TEXT,
  address_line1 TEXT NOT NULL,
  address_line2 TEXT,
  city TEXT NOT NULL,
  state TEXT,
  postal_code TEXT,
  country_id UUID REFERENCES public.countries(id) ON DELETE SET NULL,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Orders
CREATE TABLE IF NOT EXISTS public.marketplace_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT NOT NULL UNIQUE,
  buyer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  seller_id UUID NOT NULL REFERENCES public.marketplace_sellers(id) ON DELETE RESTRICT,
  delivery_address_id UUID REFERENCES public.marketplace_addresses(id) ON DELETE SET NULL,
  order_status public.marketplace_order_status DEFAULT 'pending',
  subtotal NUMERIC(18,2) NOT NULL,
  shipping_cost NUMERIC(18,2) DEFAULT 0,
  discount_amount NUMERIC(18,2) DEFAULT 0,
  commission_amount NUMERIC(18,2) DEFAULT 0,
  total_amount NUMERIC(18,2) NOT NULL,
  currency_id UUID REFERENCES public.currencies(id) ON DELETE SET NULL,
  payment_reference TEXT,
  wallet_transaction_id UUID REFERENCES public.wallet_transactions(id) ON DELETE SET NULL,
  notes TEXT,
  tracking_number TEXT,
  estimated_delivery TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  cancellation_reason TEXT,
  idempotency_key TEXT UNIQUE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Order items
CREATE TABLE IF NOT EXISTS public.marketplace_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.marketplace_orders(id) ON DELETE CASCADE,
  listing_id UUID NOT NULL REFERENCES public.marketplace_listings(id) ON DELETE RESTRICT,
  quantity INTEGER NOT NULL,
  unit_price NUMERIC(18,2) NOT NULL,
  total_price NUMERIC(18,2) NOT NULL,
  currency_id UUID REFERENCES public.currencies(id) ON DELETE SET NULL,
  listing_snapshot JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Shipping / delivery tracking
CREATE TABLE IF NOT EXISTS public.marketplace_shipments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.marketplace_orders(id) ON DELETE CASCADE,
  carrier TEXT,
  tracking_number TEXT,
  tracking_url TEXT,
  shipment_status TEXT DEFAULT 'preparing',
  shipped_at TIMESTAMPTZ,
  estimated_delivery TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Favorites (products & shops)
CREATE TABLE IF NOT EXISTS public.marketplace_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  listing_id UUID REFERENCES public.marketplace_listings(id) ON DELETE CASCADE,
  seller_id UUID REFERENCES public.marketplace_sellers(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_marketplace_favorites_listing
  ON public.marketplace_favorites(user_id, listing_id) WHERE listing_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_marketplace_favorites_seller
  ON public.marketplace_favorites(user_id, seller_id) WHERE seller_id IS NOT NULL;

-- Reviews & ratings
CREATE TABLE IF NOT EXISTS public.marketplace_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.marketplace_orders(id) ON DELETE CASCADE,
  listing_id UUID NOT NULL REFERENCES public.marketplace_listings(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES public.marketplace_sellers(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  title TEXT,
  comment TEXT,
  seller_reply TEXT,
  seller_replied_at TIMESTAMPTZ,
  review_status public.marketplace_review_status DEFAULT 'pending',
  is_verified_purchase BOOLEAN DEFAULT true,
  helpful_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_marketplace_reviews_order_listing
  ON public.marketplace_reviews(order_id, listing_id);

-- Messaging between buyers and sellers
CREATE TABLE IF NOT EXISTS public.marketplace_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES public.marketplace_sellers(id) ON DELETE CASCADE,
  listing_id UUID REFERENCES public.marketplace_listings(id) ON DELETE SET NULL,
  order_id UUID REFERENCES public.marketplace_orders(id) ON DELETE SET NULL,
  last_message_at TIMESTAMPTZ DEFAULT now(),
  buyer_unread_count INTEGER DEFAULT 0,
  seller_unread_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.marketplace_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.marketplace_conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  attachment_url TEXT,
  message_status public.marketplace_message_status DEFAULT 'sent',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Promotions
CREATE TABLE IF NOT EXISTS public.marketplace_promotions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES public.marketplace_sellers(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  discount_type TEXT NOT NULL DEFAULT 'percentage',
  discount_value NUMERIC(10,2) NOT NULL,
  minimum_order NUMERIC(18,2),
  max_uses INTEGER,
  used_count INTEGER DEFAULT 0,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Coupons
CREATE TABLE IF NOT EXISTS public.marketplace_coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID REFERENCES public.marketplace_sellers(id) ON DELETE CASCADE,
  code TEXT NOT NULL UNIQUE,
  discount_type TEXT NOT NULL DEFAULT 'percentage',
  discount_value NUMERIC(10,2) NOT NULL,
  minimum_order NUMERIC(18,2),
  max_uses INTEGER,
  used_count INTEGER DEFAULT 0,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Returns
CREATE TABLE IF NOT EXISTS public.marketplace_returns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.marketplace_orders(id) ON DELETE RESTRICT,
  buyer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  seller_id UUID NOT NULL REFERENCES public.marketplace_sellers(id) ON DELETE RESTRICT,
  reason TEXT NOT NULL,
  description TEXT,
  evidence_urls TEXT[],
  return_status public.marketplace_return_status DEFAULT 'requested',
  admin_notes TEXT,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Refunds
CREATE TABLE IF NOT EXISTS public.marketplace_refunds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.marketplace_orders(id) ON DELETE RESTRICT,
  return_id UUID REFERENCES public.marketplace_returns(id) ON DELETE SET NULL,
  buyer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  amount NUMERIC(18,2) NOT NULL,
  currency_id UUID REFERENCES public.currencies(id) ON DELETE SET NULL,
  refund_status public.marketplace_refund_status DEFAULT 'pending',
  wallet_transaction_id UUID REFERENCES public.wallet_transactions(id) ON DELETE SET NULL,
  reason TEXT,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Seller settlements (payouts)
CREATE TABLE IF NOT EXISTS public.marketplace_settlements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES public.marketplace_sellers(id) ON DELETE RESTRICT,
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  gross_amount NUMERIC(18,2) NOT NULL,
  commission_amount NUMERIC(18,2) NOT NULL,
  refund_amount NUMERIC(18,2) DEFAULT 0,
  net_amount NUMERIC(18,2) NOT NULL,
  currency_id UUID REFERENCES public.currencies(id) ON DELETE SET NULL,
  settlement_status public.marketplace_settlement_status DEFAULT 'pending',
  wallet_transaction_id UUID REFERENCES public.wallet_transactions(id) ON DELETE SET NULL,
  notes TEXT,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Moderation / reports
CREATE TABLE IF NOT EXISTS public.marketplace_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  listing_id UUID REFERENCES public.marketplace_listings(id) ON DELETE CASCADE,
  seller_id UUID REFERENCES public.marketplace_sellers(id) ON DELETE CASCADE,
  review_id UUID REFERENCES public.marketplace_reviews(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  description TEXT,
  report_status TEXT DEFAULT 'pending',
  resolved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 3. INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_marketplace_sellers_user_id ON public.marketplace_sellers(user_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_sellers_status ON public.marketplace_sellers(seller_status);
CREATE INDEX IF NOT EXISTS idx_marketplace_listings_seller_id ON public.marketplace_listings(seller_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_listings_category_id ON public.marketplace_listings(category_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_listings_status ON public.marketplace_listings(listing_status);
CREATE INDEX IF NOT EXISTS idx_marketplace_listings_created_at ON public.marketplace_listings(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_marketplace_orders_buyer_id ON public.marketplace_orders(buyer_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_orders_seller_id ON public.marketplace_orders(seller_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_orders_status ON public.marketplace_orders(order_status);
CREATE INDEX IF NOT EXISTS idx_marketplace_orders_created_at ON public.marketplace_orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_marketplace_reviews_listing_id ON public.marketplace_reviews(listing_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_reviews_seller_id ON public.marketplace_reviews(seller_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_cart_items_cart_id ON public.marketplace_cart_items(cart_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_messages_conversation_id ON public.marketplace_messages(conversation_id);

-- ============================================================
-- 4. FUNCTIONS
-- ============================================================

-- Generate order number
CREATE OR REPLACE FUNCTION public.generate_marketplace_order_number()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  v_number TEXT;
  v_exists BOOLEAN;
BEGIN
  LOOP
    v_number := 'MKT-' || TO_CHAR(now(), 'YYYYMMDD') || '-' || UPPER(SUBSTRING(gen_random_uuid()::TEXT, 1, 6));
    SELECT EXISTS(SELECT 1 FROM public.marketplace_orders WHERE order_number = v_number) INTO v_exists;
    EXIT WHEN NOT v_exists;
  END LOOP;
  RETURN v_number;
END;
$$;

-- Update listing rating after review
CREATE OR REPLACE FUNCTION public.update_listing_rating()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.marketplace_listings
  SET
    rating_average = (
      SELECT ROUND(AVG(rating)::NUMERIC, 2)
      FROM public.marketplace_reviews
      WHERE listing_id = NEW.listing_id AND review_status = 'published'
    ),
    rating_count = (
      SELECT COUNT(*)
      FROM public.marketplace_reviews
      WHERE listing_id = NEW.listing_id AND review_status = 'published'
    )
  WHERE id = NEW.listing_id;

  UPDATE public.marketplace_sellers
  SET
    rating_average = (
      SELECT ROUND(AVG(rating)::NUMERIC, 2)
      FROM public.marketplace_reviews
      WHERE seller_id = NEW.seller_id AND review_status = 'published'
    ),
    rating_count = (
      SELECT COUNT(*)
      FROM public.marketplace_reviews
      WHERE seller_id = NEW.seller_id AND review_status = 'published'
    )
  WHERE id = NEW.seller_id;

  RETURN NEW;
END;
$$;

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION public.marketplace_set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ============================================================
-- 5. ENABLE RLS
-- ============================================================

ALTER TABLE public.marketplace_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_sellers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_listing_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_price_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_returns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_refunds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_settlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_reports ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 6. RLS POLICIES
-- ============================================================

-- Categories: public read
DROP POLICY IF EXISTS "marketplace_categories_public_read" ON public.marketplace_categories;
CREATE POLICY "marketplace_categories_public_read" ON public.marketplace_categories
  FOR SELECT TO public USING (is_active = true);

-- Sellers: public read active, owner manages own
DROP POLICY IF EXISTS "marketplace_sellers_public_read" ON public.marketplace_sellers;
CREATE POLICY "marketplace_sellers_public_read" ON public.marketplace_sellers
  FOR SELECT TO public USING (seller_status = 'active');

DROP POLICY IF EXISTS "marketplace_sellers_owner_all" ON public.marketplace_sellers;
CREATE POLICY "marketplace_sellers_owner_all" ON public.marketplace_sellers
  FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Listings: public read published, seller manages own
DROP POLICY IF EXISTS "marketplace_listings_public_read" ON public.marketplace_listings;
CREATE POLICY "marketplace_listings_public_read" ON public.marketplace_listings
  FOR SELECT TO public USING (listing_status = 'published');

DROP POLICY IF EXISTS "marketplace_listings_seller_all" ON public.marketplace_listings;
CREATE POLICY "marketplace_listings_seller_all" ON public.marketplace_listings
  FOR ALL TO authenticated
  USING (seller_id IN (SELECT id FROM public.marketplace_sellers WHERE user_id = auth.uid()))
  WITH CHECK (seller_id IN (SELECT id FROM public.marketplace_sellers WHERE user_id = auth.uid()));

-- Listing media: public read, seller manages
DROP POLICY IF EXISTS "marketplace_listing_media_public_read" ON public.marketplace_listing_media;
CREATE POLICY "marketplace_listing_media_public_read" ON public.marketplace_listing_media
  FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "marketplace_listing_media_seller_all" ON public.marketplace_listing_media;
CREATE POLICY "marketplace_listing_media_seller_all" ON public.marketplace_listing_media
  FOR ALL TO authenticated
  USING (listing_id IN (
    SELECT l.id FROM public.marketplace_listings l
    JOIN public.marketplace_sellers s ON l.seller_id = s.id
    WHERE s.user_id = auth.uid()
  ))
  WITH CHECK (listing_id IN (
    SELECT l.id FROM public.marketplace_listings l
    JOIN public.marketplace_sellers s ON l.seller_id = s.id
    WHERE s.user_id = auth.uid()
  ));

-- Price history: public read
DROP POLICY IF EXISTS "marketplace_price_history_read" ON public.marketplace_price_history;
CREATE POLICY "marketplace_price_history_read" ON public.marketplace_price_history
  FOR SELECT TO public USING (true);

-- Carts: user manages own
DROP POLICY IF EXISTS "marketplace_carts_owner_all" ON public.marketplace_carts;
CREATE POLICY "marketplace_carts_owner_all" ON public.marketplace_carts
  FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Cart items: user manages own via cart
DROP POLICY IF EXISTS "marketplace_cart_items_owner_all" ON public.marketplace_cart_items;
CREATE POLICY "marketplace_cart_items_owner_all" ON public.marketplace_cart_items
  FOR ALL TO authenticated
  USING (cart_id IN (SELECT id FROM public.marketplace_carts WHERE user_id = auth.uid()))
  WITH CHECK (cart_id IN (SELECT id FROM public.marketplace_carts WHERE user_id = auth.uid()));

-- Addresses: user manages own
DROP POLICY IF EXISTS "marketplace_addresses_owner_all" ON public.marketplace_addresses;
CREATE POLICY "marketplace_addresses_owner_all" ON public.marketplace_addresses
  FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Orders: buyer and seller can see their own
DROP POLICY IF EXISTS "marketplace_orders_buyer_read" ON public.marketplace_orders;
CREATE POLICY "marketplace_orders_buyer_read" ON public.marketplace_orders
  FOR SELECT TO authenticated USING (buyer_id = auth.uid());

DROP POLICY IF EXISTS "marketplace_orders_seller_read" ON public.marketplace_orders;
CREATE POLICY "marketplace_orders_seller_read" ON public.marketplace_orders
  FOR SELECT TO authenticated
  USING (seller_id IN (SELECT id FROM public.marketplace_sellers WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "marketplace_orders_buyer_insert" ON public.marketplace_orders;
CREATE POLICY "marketplace_orders_buyer_insert" ON public.marketplace_orders
  FOR INSERT TO authenticated WITH CHECK (buyer_id = auth.uid());

DROP POLICY IF EXISTS "marketplace_orders_buyer_update" ON public.marketplace_orders;
CREATE POLICY "marketplace_orders_buyer_update" ON public.marketplace_orders
  FOR UPDATE TO authenticated
  USING (buyer_id = auth.uid())
  WITH CHECK (buyer_id = auth.uid());

DROP POLICY IF EXISTS "marketplace_orders_seller_update" ON public.marketplace_orders;
CREATE POLICY "marketplace_orders_seller_update" ON public.marketplace_orders
  FOR UPDATE TO authenticated
  USING (seller_id IN (SELECT id FROM public.marketplace_sellers WHERE user_id = auth.uid()))
  WITH CHECK (seller_id IN (SELECT id FROM public.marketplace_sellers WHERE user_id = auth.uid()));

-- Order items: buyer and seller can see
DROP POLICY IF EXISTS "marketplace_order_items_read" ON public.marketplace_order_items;
CREATE POLICY "marketplace_order_items_read" ON public.marketplace_order_items
  FOR SELECT TO authenticated
  USING (order_id IN (
    SELECT id FROM public.marketplace_orders
    WHERE buyer_id = auth.uid()
       OR seller_id IN (SELECT id FROM public.marketplace_sellers WHERE user_id = auth.uid())
  ));

DROP POLICY IF EXISTS "marketplace_order_items_insert" ON public.marketplace_order_items;
CREATE POLICY "marketplace_order_items_insert" ON public.marketplace_order_items
  FOR INSERT TO authenticated
  WITH CHECK (order_id IN (
    SELECT id FROM public.marketplace_orders WHERE buyer_id = auth.uid()
  ));

-- Shipments: buyer and seller can see
DROP POLICY IF EXISTS "marketplace_shipments_read" ON public.marketplace_shipments;
CREATE POLICY "marketplace_shipments_read" ON public.marketplace_shipments
  FOR SELECT TO authenticated
  USING (order_id IN (
    SELECT id FROM public.marketplace_orders
    WHERE buyer_id = auth.uid()
       OR seller_id IN (SELECT id FROM public.marketplace_sellers WHERE user_id = auth.uid())
  ));

DROP POLICY IF EXISTS "marketplace_shipments_seller_manage" ON public.marketplace_shipments;
CREATE POLICY "marketplace_shipments_seller_manage" ON public.marketplace_shipments
  FOR ALL TO authenticated
  USING (order_id IN (
    SELECT id FROM public.marketplace_orders
    WHERE seller_id IN (SELECT id FROM public.marketplace_sellers WHERE user_id = auth.uid())
  ))
  WITH CHECK (order_id IN (
    SELECT id FROM public.marketplace_orders
    WHERE seller_id IN (SELECT id FROM public.marketplace_sellers WHERE user_id = auth.uid())
  ));

-- Favorites: user manages own
DROP POLICY IF EXISTS "marketplace_favorites_owner_all" ON public.marketplace_favorites;
CREATE POLICY "marketplace_favorites_owner_all" ON public.marketplace_favorites
  FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Reviews: public read published, buyer creates, seller replies
DROP POLICY IF EXISTS "marketplace_reviews_public_read" ON public.marketplace_reviews;
CREATE POLICY "marketplace_reviews_public_read" ON public.marketplace_reviews
  FOR SELECT TO public USING (review_status = 'published');

DROP POLICY IF EXISTS "marketplace_reviews_buyer_insert" ON public.marketplace_reviews;
CREATE POLICY "marketplace_reviews_buyer_insert" ON public.marketplace_reviews
  FOR INSERT TO authenticated WITH CHECK (reviewer_id = auth.uid());

DROP POLICY IF EXISTS "marketplace_reviews_buyer_update" ON public.marketplace_reviews;
CREATE POLICY "marketplace_reviews_buyer_update" ON public.marketplace_reviews
  FOR UPDATE TO authenticated
  USING (reviewer_id = auth.uid())
  WITH CHECK (reviewer_id = auth.uid());

-- Conversations: buyer and seller
DROP POLICY IF EXISTS "marketplace_conversations_participant_all" ON public.marketplace_conversations;
CREATE POLICY "marketplace_conversations_participant_all" ON public.marketplace_conversations
  FOR ALL TO authenticated
  USING (
    buyer_id = auth.uid()
    OR seller_id IN (SELECT id FROM public.marketplace_sellers WHERE user_id = auth.uid())
  )
  WITH CHECK (
    buyer_id = auth.uid()
    OR seller_id IN (SELECT id FROM public.marketplace_sellers WHERE user_id = auth.uid())
  );

-- Messages: participants
DROP POLICY IF EXISTS "marketplace_messages_participant_all" ON public.marketplace_messages;
CREATE POLICY "marketplace_messages_participant_all" ON public.marketplace_messages
  FOR ALL TO authenticated
  USING (
    conversation_id IN (
      SELECT id FROM public.marketplace_conversations
      WHERE buyer_id = auth.uid()
         OR seller_id IN (SELECT id FROM public.marketplace_sellers WHERE user_id = auth.uid())
    )
  )
  WITH CHECK (
    conversation_id IN (
      SELECT id FROM public.marketplace_conversations
      WHERE buyer_id = auth.uid()
         OR seller_id IN (SELECT id FROM public.marketplace_sellers WHERE user_id = auth.uid())
    )
  );

-- Promotions: seller manages own
DROP POLICY IF EXISTS "marketplace_promotions_seller_all" ON public.marketplace_promotions;
CREATE POLICY "marketplace_promotions_seller_all" ON public.marketplace_promotions
  FOR ALL TO authenticated
  USING (seller_id IN (SELECT id FROM public.marketplace_sellers WHERE user_id = auth.uid()))
  WITH CHECK (seller_id IN (SELECT id FROM public.marketplace_sellers WHERE user_id = auth.uid()));

-- Coupons: public read active, seller manages own
DROP POLICY IF EXISTS "marketplace_coupons_public_read" ON public.marketplace_coupons;
CREATE POLICY "marketplace_coupons_public_read" ON public.marketplace_coupons
  FOR SELECT TO public USING (is_active = true);

DROP POLICY IF EXISTS "marketplace_coupons_seller_all" ON public.marketplace_coupons;
CREATE POLICY "marketplace_coupons_seller_all" ON public.marketplace_coupons
  FOR ALL TO authenticated
  USING (seller_id IN (SELECT id FROM public.marketplace_sellers WHERE user_id = auth.uid()))
  WITH CHECK (seller_id IN (SELECT id FROM public.marketplace_sellers WHERE user_id = auth.uid()));

-- Returns: buyer and seller
DROP POLICY IF EXISTS "marketplace_returns_participant_all" ON public.marketplace_returns;
CREATE POLICY "marketplace_returns_participant_all" ON public.marketplace_returns
  FOR ALL TO authenticated
  USING (
    buyer_id = auth.uid()
    OR seller_id IN (SELECT id FROM public.marketplace_sellers WHERE user_id = auth.uid())
  )
  WITH CHECK (
    buyer_id = auth.uid()
    OR seller_id IN (SELECT id FROM public.marketplace_sellers WHERE user_id = auth.uid())
  );

-- Refunds: buyer and seller
DROP POLICY IF EXISTS "marketplace_refunds_participant_read" ON public.marketplace_refunds;
CREATE POLICY "marketplace_refunds_participant_read" ON public.marketplace_refunds
  FOR SELECT TO authenticated
  USING (
    buyer_id = auth.uid()
    OR order_id IN (
      SELECT id FROM public.marketplace_orders
      WHERE seller_id IN (SELECT id FROM public.marketplace_sellers WHERE user_id = auth.uid())
    )
  );

-- Settlements: seller reads own
DROP POLICY IF EXISTS "marketplace_settlements_seller_read" ON public.marketplace_settlements;
CREATE POLICY "marketplace_settlements_seller_read" ON public.marketplace_settlements
  FOR SELECT TO authenticated
  USING (seller_id IN (SELECT id FROM public.marketplace_sellers WHERE user_id = auth.uid()));

-- Reports: user creates, reads own
DROP POLICY IF EXISTS "marketplace_reports_user_all" ON public.marketplace_reports;
CREATE POLICY "marketplace_reports_user_all" ON public.marketplace_reports
  FOR ALL TO authenticated
  USING (reporter_id = auth.uid())
  WITH CHECK (reporter_id = auth.uid());

-- ============================================================
-- 7. TRIGGERS
-- ============================================================

DROP TRIGGER IF EXISTS trg_marketplace_sellers_updated_at ON public.marketplace_sellers;
CREATE TRIGGER trg_marketplace_sellers_updated_at
  BEFORE UPDATE ON public.marketplace_sellers
  FOR EACH ROW EXECUTE FUNCTION public.marketplace_set_updated_at();

DROP TRIGGER IF EXISTS trg_marketplace_listings_updated_at ON public.marketplace_listings;
CREATE TRIGGER trg_marketplace_listings_updated_at
  BEFORE UPDATE ON public.marketplace_listings
  FOR EACH ROW EXECUTE FUNCTION public.marketplace_set_updated_at();

DROP TRIGGER IF EXISTS trg_marketplace_orders_updated_at ON public.marketplace_orders;
CREATE TRIGGER trg_marketplace_orders_updated_at
  BEFORE UPDATE ON public.marketplace_orders
  FOR EACH ROW EXECUTE FUNCTION public.marketplace_set_updated_at();

DROP TRIGGER IF EXISTS trg_marketplace_reviews_rating ON public.marketplace_reviews;
CREATE TRIGGER trg_marketplace_reviews_rating
  AFTER INSERT OR UPDATE ON public.marketplace_reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_listing_rating();

-- ============================================================
-- 8. SEED DATA — Categories
-- ============================================================

INSERT INTO public.marketplace_categories (id, name, slug, description, icon_name, sort_order) VALUES
  (gen_random_uuid(), 'Électronique', 'electronique', 'Téléphones, ordinateurs, accessoires', 'Smartphone', 1),
  (gen_random_uuid(), 'Vêtements & Mode', 'vetements-mode', 'Vêtements, chaussures, accessoires de mode', 'Shirt', 2),
  (gen_random_uuid(), 'Maison & Jardin', 'maison-jardin', 'Meubles, décoration, jardinage', 'Home', 3),
  (gen_random_uuid(), 'Alimentation', 'alimentation', 'Produits alimentaires et boissons', 'ShoppingBasket', 4),
  (gen_random_uuid(), 'Automobile', 'automobile', 'Pièces auto, accessoires, véhicules', 'Car', 5),
  (gen_random_uuid(), 'Artisanat', 'artisanat', 'Produits artisanaux et faits main', 'Palette', 6),
  (gen_random_uuid(), 'Agriculture', 'agriculture', 'Produits agricoles et équipements', 'Leaf', 7),
  (gen_random_uuid(), 'Services', 'services', 'Prestations de services professionnels', 'Briefcase', 8),
  (gen_random_uuid(), 'Santé & Beauté', 'sante-beaute', 'Produits de santé, cosmétiques, bien-être', 'Heart', 9),
  (gen_random_uuid(), 'Sport & Loisirs', 'sport-loisirs', 'Équipements sportifs et loisirs', 'Trophy', 10)
ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- 9. UPDATE MODULE STATUS
-- ============================================================

UPDATE public.modules
SET module_status = 'active', updated_at = now()
WHERE code = 'jdv_marketplace';
