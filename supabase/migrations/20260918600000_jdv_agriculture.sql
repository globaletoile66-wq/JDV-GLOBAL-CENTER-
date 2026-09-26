-- ============================================================
-- JDV AGRICULTURE — reconstitué depuis le schéma Supabase live
-- NOTE : agriculture_farms / agriculture_products sont d'anciennes
-- tables (vides, dupliquées avec agri_farms/agri_products). Conservées
-- ici pour fidélité avec la base live, mais à ne plus utiliser côté
-- frontend — préférer agri_farms / agri_products.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.agri_farms (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  organization_id uuid REFERENCES organizations(id) ON DELETE SET NULL,
  owner_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  name text NOT NULL,
  farm_type text DEFAULT 'mixed' NOT NULL,
  country_id uuid REFERENCES countries(id) ON DELETE SET NULL,
  city text,
  address text,
  latitude numeric,
  longitude numeric,
  area_hectares numeric CHECK (area_hectares IS NULL OR area_hectares >= 0),
  status text DEFAULT 'active' NOT NULL CHECK (status = ANY (ARRAY['draft','active','inactive','archived'])),
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.agri_crops (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  farm_id uuid NOT NULL REFERENCES agri_farms(id) ON DELETE CASCADE,
  name text NOT NULL,
  variety text,
  season text,
  planted_area_hectares numeric CHECK (planted_area_hectares IS NULL OR planted_area_hectares >= 0),
  planting_date date,
  expected_harvest_date date,
  actual_harvest_date date,
  expected_yield numeric CHECK (expected_yield IS NULL OR expected_yield >= 0),
  actual_yield numeric CHECK (actual_yield IS NULL OR actual_yield >= 0),
  unit text,
  status text DEFAULT 'planned' NOT NULL CHECK (status = ANY (ARRAY['planned','planted','growing','harvested','cancelled'])),
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.agri_production_records (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  crop_id uuid NOT NULL REFERENCES agri_crops(id) ON DELETE CASCADE,
  record_date date DEFAULT CURRENT_DATE NOT NULL,
  activity_type text NOT NULL,
  quantity numeric,
  unit text,
  cost_amount numeric CHECK (cost_amount IS NULL OR cost_amount >= 0),
  currency_id uuid REFERENCES currencies(id) ON DELETE SET NULL,
  notes text,
  recorded_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.agri_products (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  farm_id uuid REFERENCES agri_farms(id) ON DELETE SET NULL,
  name text NOT NULL,
  product_type text NOT NULL,
  quantity numeric DEFAULT 0 NOT NULL CHECK (quantity >= 0),
  unit text NOT NULL,
  unit_price numeric CHECK (unit_price IS NULL OR unit_price >= 0),
  currency_id uuid REFERENCES currencies(id) ON DELETE SET NULL,
  availability_status text DEFAULT 'available' NOT NULL CHECK (availability_status = ANY (ARRAY['available','reserved','sold','unavailable'])),
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.agri_orders (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  buyer_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  organization_id uuid REFERENCES organizations(id) ON DELETE SET NULL,
  status text DEFAULT 'pending' NOT NULL CHECK (status = ANY (ARRAY['pending','confirmed','fulfilled','cancelled'])),
  total_amount numeric DEFAULT 0 NOT NULL CHECK (total_amount >= 0),
  currency_id uuid REFERENCES currencies(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.agri_order_items (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  order_id uuid NOT NULL REFERENCES agri_orders(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES agri_products(id) ON DELETE RESTRICT,
  quantity numeric NOT NULL CHECK (quantity > 0),
  unit_price numeric NOT NULL CHECK (unit_price >= 0),
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Anciennes tables (dépréciées, conservées pour fidélité avec la base live)
CREATE TABLE IF NOT EXISTS public.agriculture_farms (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  owner_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  crop_type text,
  area_hectares numeric CHECK (area_hectares IS NULL OR area_hectares >= 0),
  location text,
  status text DEFAULT 'active' NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.agriculture_products (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  farm_id uuid REFERENCES agriculture_farms(id) ON DELETE SET NULL,
  owner_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  product_type text,
  quantity numeric DEFAULT 0 NOT NULL CHECK (quantity >= 0),
  unit text,
  price numeric CHECK (price IS NULL OR price >= 0),
  currency_id uuid REFERENCES currencies(id) ON DELETE SET NULL,
  status text DEFAULT 'available' NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_agri_crops_farm ON agri_crops (farm_id);
CREATE INDEX IF NOT EXISTS idx_agri_orders_buyer ON agri_orders (buyer_user_id);
CREATE INDEX IF NOT EXISTS idx_agri_production_crop_date ON agri_production_records (crop_id, record_date);
CREATE INDEX IF NOT EXISTS idx_agri_products_farm ON agri_products (farm_id);

-- ============================================================
-- RLS
-- ============================================================
ALTER TABLE public.agri_crops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agri_farms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agri_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agri_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agri_production_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agri_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agriculture_farms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agriculture_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY agri_crops_access ON agri_crops FOR ALL
USING (is_super_admin() OR EXISTS (SELECT 1 FROM agri_farms f WHERE f.id = agri_crops.farm_id AND (f.owner_user_id = auth.uid() OR is_org_member(f.organization_id))))
WITH CHECK (is_super_admin() OR EXISTS (SELECT 1 FROM agri_farms f WHERE f.id = agri_crops.farm_id AND (f.owner_user_id = auth.uid() OR is_org_admin(f.organization_id))));

CREATE POLICY agri_farms_access ON agri_farms FOR ALL
USING (is_super_admin() OR owner_user_id = auth.uid() OR is_org_member(organization_id))
WITH CHECK (is_super_admin() OR owner_user_id = auth.uid() OR is_org_admin(organization_id));

CREATE POLICY agri_order_items_access ON agri_order_items FOR ALL
USING (is_super_admin() OR EXISTS (SELECT 1 FROM agri_orders o WHERE o.id = agri_order_items.order_id AND (o.buyer_user_id = auth.uid() OR is_org_member(o.organization_id))))
WITH CHECK (is_super_admin() OR EXISTS (SELECT 1 FROM agri_orders o WHERE o.id = agri_order_items.order_id AND (o.buyer_user_id = auth.uid() OR is_org_admin(o.organization_id))));

CREATE POLICY agri_orders_access ON agri_orders FOR ALL
USING (is_super_admin() OR buyer_user_id = auth.uid() OR is_org_member(organization_id))
WITH CHECK (is_super_admin() OR buyer_user_id = auth.uid() OR is_org_admin(organization_id));

CREATE POLICY agri_production_access ON agri_production_records FOR ALL
USING (is_super_admin() OR recorded_by = auth.uid() OR EXISTS (SELECT 1 FROM agri_crops c JOIN agri_farms f ON f.id = c.farm_id WHERE c.id = agri_production_records.crop_id AND (f.owner_user_id = auth.uid() OR is_org_member(f.organization_id))))
WITH CHECK (is_super_admin() OR recorded_by = auth.uid() OR EXISTS (SELECT 1 FROM agri_crops c JOIN agri_farms f ON f.id = c.farm_id WHERE c.id = agri_production_records.crop_id AND (f.owner_user_id = auth.uid() OR is_org_admin(f.organization_id))));

CREATE POLICY agri_products_access ON agri_products FOR ALL
USING (is_super_admin() OR EXISTS (SELECT 1 FROM agri_farms f WHERE f.id = agri_products.farm_id AND (f.owner_user_id = auth.uid() OR is_org_member(f.organization_id))))
WITH CHECK (is_super_admin() OR EXISTS (SELECT 1 FROM agri_farms f WHERE f.id = agri_products.farm_id AND (f.owner_user_id = auth.uid() OR is_org_admin(f.organization_id))));

CREATE POLICY agriculture_farms_owner_select ON agriculture_farms FOR SELECT USING ((SELECT auth.uid()) = owner_user_id OR (SELECT is_super_admin()));
CREATE POLICY agriculture_products_owner_select ON agriculture_products FOR SELECT USING ((SELECT auth.uid()) = owner_user_id OR (SELECT is_super_admin()));