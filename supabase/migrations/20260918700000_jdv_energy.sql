-- ============================================================
-- JDV ENERGY — reconstitué depuis le schéma Supabase live
-- ============================================================

CREATE TABLE IF NOT EXISTS public.energy_providers (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  organization_id uuid REFERENCES organizations(id) ON DELETE SET NULL,
  name text NOT NULL,
  provider_type text NOT NULL,
  country_id uuid REFERENCES countries(id) ON DELETE SET NULL,
  contact_phone text,
  contact_email text,
  status text DEFAULT 'active' NOT NULL CHECK (status = ANY (ARRAY['draft','active','suspended','inactive'])),
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.energy_sites (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  organization_id uuid REFERENCES organizations(id) ON DELETE SET NULL,
  owner_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  provider_id uuid REFERENCES energy_providers(id) ON DELETE SET NULL,
  name text NOT NULL,
  site_type text NOT NULL,
  address text,
  city text,
  latitude numeric,
  longitude numeric,
  capacity_kw numeric CHECK (capacity_kw IS NULL OR capacity_kw >= 0),
  status text DEFAULT 'active' NOT NULL CHECK (status = ANY (ARRAY['draft','active','maintenance','inactive'])),
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.energy_assets (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  site_id uuid NOT NULL REFERENCES energy_sites(id) ON DELETE CASCADE,
  asset_type text NOT NULL,
  serial_number text,
  capacity_kw numeric CHECK (capacity_kw IS NULL OR capacity_kw >= 0),
  installed_on date,
  status text DEFAULT 'active' NOT NULL CHECK (status = ANY (ARRAY['planned','active','maintenance','retired'])),
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.energy_meter_readings (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  site_id uuid NOT NULL REFERENCES energy_sites(id) ON DELETE CASCADE,
  reading_at timestamptz DEFAULT now() NOT NULL,
  reading_value numeric NOT NULL CHECK (reading_value >= 0),
  unit text DEFAULT 'kwh' NOT NULL,
  recorded_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.energy_billing_records (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  site_id uuid NOT NULL REFERENCES energy_sites(id) ON DELETE CASCADE,
  period_start date NOT NULL,
  period_end date NOT NULL,
  consumption_kwh numeric DEFAULT 0 NOT NULL CHECK (consumption_kwh >= 0),
  amount numeric DEFAULT 0 NOT NULL CHECK (amount >= 0),
  currency_id uuid REFERENCES currencies(id) ON DELETE SET NULL,
  status text DEFAULT 'pending' NOT NULL CHECK (status = ANY (ARRAY['pending','issued','paid','cancelled'])),
  created_at timestamptz DEFAULT now() NOT NULL,
  CHECK (period_end >= period_start)
);

CREATE INDEX IF NOT EXISTS idx_energy_assets_site ON energy_assets (site_id);
CREATE INDEX IF NOT EXISTS idx_energy_billing_site_period ON energy_billing_records (site_id, period_start);
CREATE INDEX IF NOT EXISTS idx_energy_readings_site_date ON energy_meter_readings (site_id, reading_at);
CREATE INDEX IF NOT EXISTS idx_energy_sites_org ON energy_sites (organization_id);

-- ============================================================
-- RLS
-- ============================================================
ALTER TABLE public.energy_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.energy_billing_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.energy_meter_readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.energy_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.energy_sites ENABLE ROW LEVEL SECURITY;

CREATE POLICY energy_assets_access ON energy_assets FOR ALL
USING (is_super_admin() OR EXISTS (SELECT 1 FROM energy_sites s WHERE s.id = energy_assets.site_id AND (s.owner_user_id = auth.uid() OR is_org_member(s.organization_id))))
WITH CHECK (is_super_admin() OR EXISTS (SELECT 1 FROM energy_sites s WHERE s.id = energy_assets.site_id AND (s.owner_user_id = auth.uid() OR is_org_admin(s.organization_id))));

CREATE POLICY energy_billing_access ON energy_billing_records FOR ALL
USING (is_super_admin() OR EXISTS (SELECT 1 FROM energy_sites s WHERE s.id = energy_billing_records.site_id AND (s.owner_user_id = auth.uid() OR is_org_member(s.organization_id))))
WITH CHECK (is_super_admin() OR EXISTS (SELECT 1 FROM energy_sites s WHERE s.id = energy_billing_records.site_id AND (s.owner_user_id = auth.uid() OR is_org_admin(s.organization_id))));

CREATE POLICY energy_readings_access ON energy_meter_readings FOR ALL
USING (is_super_admin() OR recorded_by = auth.uid() OR EXISTS (SELECT 1 FROM energy_sites s WHERE s.id = energy_meter_readings.site_id AND (s.owner_user_id = auth.uid() OR is_org_member(s.organization_id))))
WITH CHECK (is_super_admin() OR recorded_by = auth.uid() OR EXISTS (SELECT 1 FROM energy_sites s WHERE s.id = energy_meter_readings.site_id AND (s.owner_user_id = auth.uid() OR is_org_admin(s.organization_id))));

CREATE POLICY energy_providers_access ON energy_providers FOR ALL
USING (is_super_admin() OR is_org_member(organization_id))
WITH CHECK (is_super_admin() OR is_org_admin(organization_id));

CREATE POLICY energy_sites_access ON energy_sites FOR ALL
USING (is_super_admin() OR owner_user_id = auth.uid() OR is_org_member(organization_id))
WITH CHECK (is_super_admin() OR owner_user_id = auth.uid() OR is_org_admin(organization_id));