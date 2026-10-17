-- ============================================================
-- JDV BUSINESS MODULE — MIGRATION
-- Version: 1.0.0
-- Depends on: 20260918000000_jdv_core_foundation.sql
--             20260918100000_jdv_pay_module.sql
-- ============================================================
-- IMPORTANT: This migration NEVER recreates JDV CORE tables.
-- It only adds JDV BUSINESS-specific tables.
-- ============================================================

-- ============================================================
-- 1. ENUM TYPES FOR JDV BUSINESS
-- ============================================================

DO $$ BEGIN
  CREATE TYPE public.business_status AS ENUM ('draft', 'active', 'suspended', 'archived');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.business_member_role AS ENUM ('OWNER', 'ADMIN', 'MANAGER', 'ACCOUNTANT', 'SALES', 'CASHIER', 'EMPLOYEE', 'VIEWER');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.sale_status AS ENUM ('pending', 'confirmed', 'paid', 'partially_paid', 'cancelled', 'refunded');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.invoice_status AS ENUM ('draft', 'issued', 'paid', 'partially_paid', 'overdue', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.order_status AS ENUM ('pending', 'confirmed', 'processing', 'ready', 'shipped', 'delivered', 'cancelled', 'returned');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.appointment_status AS ENUM ('scheduled', 'confirmed', 'completed', 'cancelled', 'no_show');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.expense_status AS ENUM ('pending', 'approved', 'rejected', 'paid');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================
-- 2. BUSINESS CATEGORIES
-- ============================================================

CREATE TABLE IF NOT EXISTS public.business_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  icon VARCHAR(50),
  parent_id UUID REFERENCES public.business_categories(id) ON DELETE SET NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 3. BUSINESS PROFILES (core business entity)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.business_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  category_id UUID REFERENCES public.business_categories(id) ON DELETE SET NULL,
  country_id UUID REFERENCES public.countries(id) ON DELETE SET NULL,
  currency_id UUID REFERENCES public.currencies(id) ON DELETE SET NULL,
  -- Identity
  name VARCHAR(200) NOT NULL,
  trade_name VARCHAR(200),
  description TEXT,
  tagline VARCHAR(300),
  logo_url TEXT,
  cover_url TEXT,
  -- Contact
  phone VARCHAR(50),
  email VARCHAR(255),
  website VARCHAR(500),
  -- Location
  address TEXT,
  city VARCHAR(100),
  region VARCHAR(100),
  postal_code VARCHAR(20),
  latitude NUMERIC(10, 7),
  longitude NUMERIC(10, 7),
  -- Settings
  business_status public.business_status NOT NULL DEFAULT 'draft',
  is_public BOOLEAN NOT NULL DEFAULT false,
  accepts_online_payment BOOLEAN NOT NULL DEFAULT false,
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(organization_id)
);

-- ============================================================
-- 4. BUSINESS MEMBERS (team)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.business_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.business_profiles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.business_member_role NOT NULL DEFAULT 'EMPLOYEE',
  is_active BOOLEAN NOT NULL DEFAULT true,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(business_id, user_id)
);

-- ============================================================
-- 5. PRODUCT CATEGORIES
-- ============================================================

CREATE TABLE IF NOT EXISTS public.business_product_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.business_profiles(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  parent_id UUID REFERENCES public.business_product_categories(id) ON DELETE SET NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 6. PRODUCTS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.business_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.business_profiles(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.business_product_categories(id) ON DELETE SET NULL,
  code VARCHAR(100),
  name VARCHAR(200) NOT NULL,
  description TEXT,
  unit VARCHAR(50),
  price NUMERIC(20, 4) NOT NULL DEFAULT 0,
  cost_price NUMERIC(20, 4),
  tax_rate NUMERIC(5, 2) NOT NULL DEFAULT 0,
  stock_quantity NUMERIC(20, 4) NOT NULL DEFAULT 0,
  min_stock_alert NUMERIC(20, 4),
  image_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_service BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(business_id, code)
);

-- ============================================================
-- 7. CLIENTS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.business_clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.business_profiles(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  company_name VARCHAR(200),
  email VARCHAR(255),
  phone VARCHAR(50),
  address TEXT,
  city VARCHAR(100),
  country_id UUID REFERENCES public.countries(id) ON DELETE SET NULL,
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 8. SUPPLIERS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.business_suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.business_profiles(id) ON DELETE CASCADE,
  name VARCHAR(200) NOT NULL,
  contact_name VARCHAR(200),
  email VARCHAR(255),
  phone VARCHAR(50),
  address TEXT,
  city VARCHAR(100),
  country_id UUID REFERENCES public.countries(id) ON DELETE SET NULL,
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 9. SALES
-- ============================================================

CREATE TABLE IF NOT EXISTS public.business_sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.business_profiles(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.business_clients(id) ON DELETE SET NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  sale_number VARCHAR(50) NOT NULL,
  sale_status public.sale_status NOT NULL DEFAULT 'pending',
  subtotal NUMERIC(20, 4) NOT NULL DEFAULT 0,
  discount_amount NUMERIC(20, 4) NOT NULL DEFAULT 0,
  tax_amount NUMERIC(20, 4) NOT NULL DEFAULT 0,
  total_amount NUMERIC(20, 4) NOT NULL DEFAULT 0,
  amount_paid NUMERIC(20, 4) NOT NULL DEFAULT 0,
  currency_id UUID REFERENCES public.currencies(id) ON DELETE SET NULL,
  payment_method VARCHAR(50),
  pay_transaction_id UUID,
  notes TEXT,
  sale_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(business_id, sale_number)
);

-- ============================================================
-- 10. SALE ITEMS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.business_sale_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id UUID NOT NULL REFERENCES public.business_sales(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.business_products(id) ON DELETE SET NULL,
  product_name VARCHAR(200) NOT NULL,
  product_code VARCHAR(100),
  quantity NUMERIC(20, 4) NOT NULL DEFAULT 1,
  unit_price NUMERIC(20, 4) NOT NULL DEFAULT 0,
  discount_percent NUMERIC(5, 2) NOT NULL DEFAULT 0,
  tax_rate NUMERIC(5, 2) NOT NULL DEFAULT 0,
  line_total NUMERIC(20, 4) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 11. INVOICES
-- ============================================================

CREATE TABLE IF NOT EXISTS public.business_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.business_profiles(id) ON DELETE CASCADE,
  sale_id UUID REFERENCES public.business_sales(id) ON DELETE SET NULL,
  client_id UUID REFERENCES public.business_clients(id) ON DELETE SET NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  invoice_number VARCHAR(50) NOT NULL,
  invoice_status public.invoice_status NOT NULL DEFAULT 'draft',
  subtotal NUMERIC(20, 4) NOT NULL DEFAULT 0,
  discount_amount NUMERIC(20, 4) NOT NULL DEFAULT 0,
  tax_amount NUMERIC(20, 4) NOT NULL DEFAULT 0,
  total_amount NUMERIC(20, 4) NOT NULL DEFAULT 0,
  amount_paid NUMERIC(20, 4) NOT NULL DEFAULT 0,
  currency_id UUID REFERENCES public.currencies(id) ON DELETE SET NULL,
  due_date DATE,
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  pay_transaction_id UUID,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(business_id, invoice_number)
);

-- ============================================================
-- 12. ORDERS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.business_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.business_profiles(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.business_clients(id) ON DELETE SET NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  order_number VARCHAR(50) NOT NULL,
  order_status public.order_status NOT NULL DEFAULT 'pending',
  total_amount NUMERIC(20, 4) NOT NULL DEFAULT 0,
  currency_id UUID REFERENCES public.currencies(id) ON DELETE SET NULL,
  delivery_address TEXT,
  notes TEXT,
  ordered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(business_id, order_number)
);

-- ============================================================
-- 13. EXPENSES
-- ============================================================

CREATE TABLE IF NOT EXISTS public.business_expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.business_profiles(id) ON DELETE CASCADE,
  supplier_id UUID REFERENCES public.business_suppliers(id) ON DELETE SET NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  category VARCHAR(100),
  description TEXT NOT NULL,
  amount NUMERIC(20, 4) NOT NULL DEFAULT 0,
  currency_id UUID REFERENCES public.currencies(id) ON DELETE SET NULL,
  expense_status public.expense_status NOT NULL DEFAULT 'pending',
  receipt_url TEXT,
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  pay_transaction_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 14. APPOINTMENTS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.business_appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.business_profiles(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.business_clients(id) ON DELETE SET NULL,
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  appointment_status public.appointment_status NOT NULL DEFAULT 'scheduled',
  start_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ,
  location TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 15. DOCUMENTS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.business_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.business_profiles(id) ON DELETE CASCADE,
  uploaded_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  name VARCHAR(200) NOT NULL,
  document_type VARCHAR(100),
  file_url TEXT NOT NULL,
  file_size INTEGER,
  mime_type VARCHAR(100),
  is_public BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 16. INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_business_profiles_organization ON public.business_profiles(organization_id);
CREATE INDEX IF NOT EXISTS idx_business_profiles_owner ON public.business_profiles(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_business_profiles_status ON public.business_profiles(business_status);
CREATE INDEX IF NOT EXISTS idx_business_members_business ON public.business_members(business_id);
CREATE INDEX IF NOT EXISTS idx_business_members_user ON public.business_members(user_id);
CREATE INDEX IF NOT EXISTS idx_business_products_business ON public.business_products(business_id);
CREATE INDEX IF NOT EXISTS idx_business_clients_business ON public.business_clients(business_id);
CREATE INDEX IF NOT EXISTS idx_business_suppliers_business ON public.business_suppliers(business_id);
CREATE INDEX IF NOT EXISTS idx_business_sales_business ON public.business_sales(business_id);
CREATE INDEX IF NOT EXISTS idx_business_sales_client ON public.business_sales(client_id);
CREATE INDEX IF NOT EXISTS idx_business_sales_status ON public.business_sales(sale_status);
CREATE INDEX IF NOT EXISTS idx_business_invoices_business ON public.business_invoices(business_id);
CREATE INDEX IF NOT EXISTS idx_business_invoices_status ON public.business_invoices(invoice_status);
CREATE INDEX IF NOT EXISTS idx_business_orders_business ON public.business_orders(business_id);
CREATE INDEX IF NOT EXISTS idx_business_expenses_business ON public.business_expenses(business_id);
CREATE INDEX IF NOT EXISTS idx_business_appointments_business ON public.business_appointments(business_id);

-- ============================================================
-- 17. ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE public.business_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_product_categories ENABLE ROW LEVEL SECURITY;

-- business_categories: public read
DROP POLICY IF EXISTS "business_categories_read" ON public.business_categories;
CREATE POLICY "business_categories_read" ON public.business_categories
  FOR SELECT USING (true);

-- business_profiles: owner or member can read
DROP POLICY IF EXISTS "business_profiles_select" ON public.business_profiles;
CREATE POLICY "business_profiles_select" ON public.business_profiles
  FOR SELECT USING (
    owner_user_id = auth.uid()
    OR id IN (
      SELECT business_id FROM public.business_members
      WHERE user_id = auth.uid() AND is_active = true
    )
    OR is_public = true
  );

DROP POLICY IF EXISTS "business_profiles_insert" ON public.business_profiles;
CREATE POLICY "business_profiles_insert" ON public.business_profiles
  FOR INSERT WITH CHECK (owner_user_id = auth.uid());

DROP POLICY IF EXISTS "business_profiles_update" ON public.business_profiles;
CREATE POLICY "business_profiles_update" ON public.business_profiles
  FOR UPDATE USING (
    owner_user_id = auth.uid()
    OR id IN (
      SELECT business_id FROM public.business_members
      WHERE user_id = auth.uid() AND role IN ('OWNER','ADMIN','MANAGER') AND is_active = true
    )
  );

-- business_members: owner/admin can manage, members can read
DROP POLICY IF EXISTS "business_members_select" ON public.business_members;
CREATE POLICY "business_members_select" ON public.business_members
  FOR SELECT USING (
    user_id = auth.uid()
    OR business_id IN (
      SELECT id FROM public.business_profiles WHERE owner_user_id = auth.uid()
    )
    OR business_id IN (
      SELECT business_id FROM public.business_members bm2
      WHERE bm2.user_id = auth.uid() AND bm2.is_active = true
    )
  );

DROP POLICY IF EXISTS "business_members_insert" ON public.business_members;
CREATE POLICY "business_members_insert" ON public.business_members
  FOR INSERT WITH CHECK (
    business_id IN (
      SELECT id FROM public.business_profiles WHERE owner_user_id = auth.uid()
    )
    OR business_id IN (
      SELECT business_id FROM public.business_members bm2
      WHERE bm2.user_id = auth.uid() AND bm2.role IN ('OWNER','ADMIN') AND bm2.is_active = true
    )
  );

DROP POLICY IF EXISTS "business_members_update" ON public.business_members;
CREATE POLICY "business_members_update" ON public.business_members
  FOR UPDATE USING (
    business_id IN (
      SELECT id FROM public.business_profiles WHERE owner_user_id = auth.uid()
    )
    OR business_id IN (
      SELECT business_id FROM public.business_members bm2
      WHERE bm2.user_id = auth.uid() AND bm2.role IN ('OWNER','ADMIN') AND bm2.is_active = true
    )
  );

-- Helper function for business access check
CREATE OR REPLACE FUNCTION public.user_has_business_access(p_business_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.business_profiles bp
    WHERE bp.id = p_business_id AND bp.owner_user_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM public.business_members bm
    WHERE bm.business_id = p_business_id AND bm.user_id = auth.uid() AND bm.is_active = true
  );
$$;

-- Products RLS
DROP POLICY IF EXISTS "business_products_select" ON public.business_products;
CREATE POLICY "business_products_select" ON public.business_products
  FOR SELECT USING (public.user_has_business_access(business_id));

DROP POLICY IF EXISTS "business_products_insert" ON public.business_products;
CREATE POLICY "business_products_insert" ON public.business_products
  FOR INSERT WITH CHECK (public.user_has_business_access(business_id));

DROP POLICY IF EXISTS "business_products_update" ON public.business_products;
CREATE POLICY "business_products_update" ON public.business_products
  FOR UPDATE USING (public.user_has_business_access(business_id));

-- Product categories RLS
DROP POLICY IF EXISTS "business_product_categories_select" ON public.business_product_categories;
CREATE POLICY "business_product_categories_select" ON public.business_product_categories
  FOR SELECT USING (public.user_has_business_access(business_id));

DROP POLICY IF EXISTS "business_product_categories_insert" ON public.business_product_categories;
CREATE POLICY "business_product_categories_insert" ON public.business_product_categories
  FOR INSERT WITH CHECK (public.user_has_business_access(business_id));

-- Clients RLS
DROP POLICY IF EXISTS "business_clients_select" ON public.business_clients;
CREATE POLICY "business_clients_select" ON public.business_clients
  FOR SELECT USING (public.user_has_business_access(business_id));

DROP POLICY IF EXISTS "business_clients_insert" ON public.business_clients;
CREATE POLICY "business_clients_insert" ON public.business_clients
  FOR INSERT WITH CHECK (public.user_has_business_access(business_id));

DROP POLICY IF EXISTS "business_clients_update" ON public.business_clients;
CREATE POLICY "business_clients_update" ON public.business_clients
  FOR UPDATE USING (public.user_has_business_access(business_id));

-- Suppliers RLS
DROP POLICY IF EXISTS "business_suppliers_select" ON public.business_suppliers;
CREATE POLICY "business_suppliers_select" ON public.business_suppliers
  FOR SELECT USING (public.user_has_business_access(business_id));

DROP POLICY IF EXISTS "business_suppliers_insert" ON public.business_suppliers;
CREATE POLICY "business_suppliers_insert" ON public.business_suppliers
  FOR INSERT WITH CHECK (public.user_has_business_access(business_id));

DROP POLICY IF EXISTS "business_suppliers_update" ON public.business_suppliers;
CREATE POLICY "business_suppliers_update" ON public.business_suppliers
  FOR UPDATE USING (public.user_has_business_access(business_id));

-- Sales RLS
DROP POLICY IF EXISTS "business_sales_select" ON public.business_sales;
CREATE POLICY "business_sales_select" ON public.business_sales
  FOR SELECT USING (public.user_has_business_access(business_id));

DROP POLICY IF EXISTS "business_sales_insert" ON public.business_sales;
CREATE POLICY "business_sales_insert" ON public.business_sales
  FOR INSERT WITH CHECK (public.user_has_business_access(business_id));

DROP POLICY IF EXISTS "business_sales_update" ON public.business_sales;
CREATE POLICY "business_sales_update" ON public.business_sales
  FOR UPDATE USING (public.user_has_business_access(business_id));

-- Sale items RLS
DROP POLICY IF EXISTS "business_sale_items_select" ON public.business_sale_items;
CREATE POLICY "business_sale_items_select" ON public.business_sale_items
  FOR SELECT USING (
    sale_id IN (
      SELECT id FROM public.business_sales bs
      WHERE public.user_has_business_access(bs.business_id)
    )
  );

DROP POLICY IF EXISTS "business_sale_items_insert" ON public.business_sale_items;
CREATE POLICY "business_sale_items_insert" ON public.business_sale_items
  FOR INSERT WITH CHECK (
    sale_id IN (
      SELECT id FROM public.business_sales bs
      WHERE public.user_has_business_access(bs.business_id)
    )
  );

-- Invoices RLS
DROP POLICY IF EXISTS "business_invoices_select" ON public.business_invoices;
CREATE POLICY "business_invoices_select" ON public.business_invoices
  FOR SELECT USING (public.user_has_business_access(business_id));

DROP POLICY IF EXISTS "business_invoices_insert" ON public.business_invoices;
CREATE POLICY "business_invoices_insert" ON public.business_invoices
  FOR INSERT WITH CHECK (public.user_has_business_access(business_id));

DROP POLICY IF EXISTS "business_invoices_update" ON public.business_invoices;
CREATE POLICY "business_invoices_update" ON public.business_invoices
  FOR UPDATE USING (public.user_has_business_access(business_id));

-- Orders RLS
DROP POLICY IF EXISTS "business_orders_select" ON public.business_orders;
CREATE POLICY "business_orders_select" ON public.business_orders
  FOR SELECT USING (public.user_has_business_access(business_id));

DROP POLICY IF EXISTS "business_orders_insert" ON public.business_orders;
CREATE POLICY "business_orders_insert" ON public.business_orders
  FOR INSERT WITH CHECK (public.user_has_business_access(business_id));

DROP POLICY IF EXISTS "business_orders_update" ON public.business_orders;
CREATE POLICY "business_orders_update" ON public.business_orders
  FOR UPDATE USING (public.user_has_business_access(business_id));

-- Expenses RLS
DROP POLICY IF EXISTS "business_expenses_select" ON public.business_expenses;
CREATE POLICY "business_expenses_select" ON public.business_expenses
  FOR SELECT USING (public.user_has_business_access(business_id));

DROP POLICY IF EXISTS "business_expenses_insert" ON public.business_expenses;
CREATE POLICY "business_expenses_insert" ON public.business_expenses
  FOR INSERT WITH CHECK (public.user_has_business_access(business_id));

DROP POLICY IF EXISTS "business_expenses_update" ON public.business_expenses;
CREATE POLICY "business_expenses_update" ON public.business_expenses
  FOR UPDATE USING (public.user_has_business_access(business_id));

-- Appointments RLS
DROP POLICY IF EXISTS "business_appointments_select" ON public.business_appointments;
CREATE POLICY "business_appointments_select" ON public.business_appointments
  FOR SELECT USING (public.user_has_business_access(business_id));

DROP POLICY IF EXISTS "business_appointments_insert" ON public.business_appointments;
CREATE POLICY "business_appointments_insert" ON public.business_appointments
  FOR INSERT WITH CHECK (public.user_has_business_access(business_id));

DROP POLICY IF EXISTS "business_appointments_update" ON public.business_appointments;
CREATE POLICY "business_appointments_update" ON public.business_appointments
  FOR UPDATE USING (public.user_has_business_access(business_id));

-- Documents RLS
DROP POLICY IF EXISTS "business_documents_select" ON public.business_documents;
CREATE POLICY "business_documents_select" ON public.business_documents
  FOR SELECT USING (public.user_has_business_access(business_id));

DROP POLICY IF EXISTS "business_documents_insert" ON public.business_documents;
CREATE POLICY "business_documents_insert" ON public.business_documents
  FOR INSERT WITH CHECK (public.user_has_business_access(business_id));

-- ============================================================
-- 18. UPDATED_AT TRIGGERS
-- ============================================================

CREATE OR REPLACE FUNCTION public.update_business_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

DO $$ BEGIN
  CREATE TRIGGER trg_business_profiles_updated_at
    BEFORE UPDATE ON public.business_profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_business_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TRIGGER trg_business_products_updated_at
    BEFORE UPDATE ON public.business_products
    FOR EACH ROW EXECUTE FUNCTION public.update_business_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TRIGGER trg_business_clients_updated_at
    BEFORE UPDATE ON public.business_clients
    FOR EACH ROW EXECUTE FUNCTION public.update_business_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TRIGGER trg_business_sales_updated_at
    BEFORE UPDATE ON public.business_sales
    FOR EACH ROW EXECUTE FUNCTION public.update_business_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TRIGGER trg_business_invoices_updated_at
    BEFORE UPDATE ON public.business_invoices
    FOR EACH ROW EXECUTE FUNCTION public.update_business_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================
-- 19. SEED BUSINESS CATEGORIES
-- ============================================================

INSERT INTO public.business_categories (name, slug, description, icon, sort_order) VALUES
  ('Commerce', 'commerce', 'Vente de produits et marchandises', 'ShoppingBag', 1),
  ('Restauration', 'restauration', 'Restaurants, cafés et alimentation', 'UtensilsCrossed', 2),
  ('Services professionnels', 'services-pro', 'Conseil, expertise et services B2B', 'Briefcase', 3),
  ('Immobilier', 'immobilier', 'Agences et promoteurs immobiliers', 'Building2', 4),
  ('Transport', 'transport', 'Logistique et transport', 'Truck', 5),
  ('Santé', 'sante', 'Cliniques, pharmacies et santé', 'Heart', 6),
  ('Formation', 'formation', 'Écoles et centres de formation', 'GraduationCap', 7),
  ('Informatique', 'informatique', 'IT, développement et tech', 'Monitor', 8),
  ('Agriculture', 'agriculture', 'Production agricole et agro-alimentaire', 'Sprout', 9),
  ('Énergie', 'energie', 'Énergie solaire et services énergétiques', 'Zap', 10),
  ('Beauté', 'beaute', 'Salons, cosmétiques et bien-être', 'Sparkles', 11),
  ('Artisanat', 'artisanat', 'Artisans et créateurs', 'Hammer', 12),
  ('Autre', 'autre', 'Autres secteurs d''activité', 'Grid3X3', 99)
ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- 20. UPDATE MODULE STATUS FOR JDV BUSINESS
-- ============================================================

UPDATE public.modules
SET module_status = 'active'
WHERE code = 'jdv_business';
