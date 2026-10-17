-- ============================================================
-- JDV GLOBAL CENTER — CORE FOUNDATION MIGRATION
-- Version: 1.0.0
-- ============================================================

-- ============================================================
-- 1. ENUM TYPES
-- ============================================================

DROP TYPE IF EXISTS public.account_status CASCADE;
CREATE TYPE public.account_status AS ENUM ('active', 'pending', 'suspended', 'restricted', 'deleted');

DROP TYPE IF EXISTS public.module_status CASCADE;
CREATE TYPE public.module_status AS ENUM ('planned', 'development', 'active', 'maintenance', 'disabled');

DROP TYPE IF EXISTS public.org_member_status CASCADE;
CREATE TYPE public.org_member_status AS ENUM ('active', 'suspended', 'invited', 'removed');

DROP TYPE IF EXISTS public.super_admin_status CASCADE;
CREATE TYPE public.super_admin_status AS ENUM ('active', 'suspended', 'revoked');

DROP TYPE IF EXISTS public.notification_type CASCADE;
CREATE TYPE public.notification_type AS ENUM ('info', 'success', 'warning', 'error', 'security', 'transaction', 'marketing', 'system');

DROP TYPE IF EXISTS public.lang_direction CASCADE;
CREATE TYPE public.lang_direction AS ENUM ('ltr', 'rtl');

DROP TYPE IF EXISTS public.invitation_status CASCADE;
CREATE TYPE public.invitation_status AS ENUM ('pending', 'accepted', 'expired', 'cancelled');

-- ============================================================
-- 2. REFERENCE TABLES (no foreign keys to user tables)
-- ============================================================

-- Languages
CREATE TABLE IF NOT EXISTS public.languages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  native_name TEXT NOT NULL,
  direction public.lang_direction NOT NULL DEFAULT 'ltr',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Currencies
CREATE TABLE IF NOT EXISTS public.currencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  symbol TEXT NOT NULL,
  decimal_places INTEGER NOT NULL DEFAULT 2,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Countries
CREATE TABLE IF NOT EXISTS public.countries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  iso_code TEXT NOT NULL UNIQUE,
  iso3_code TEXT,
  name TEXT NOT NULL,
  flag_emoji TEXT,
  phone_code TEXT,
  default_currency_id UUID REFERENCES public.currencies(id) ON DELETE SET NULL,
  default_language_id UUID REFERENCES public.languages(id) ON DELETE SET NULL,
  timezone TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Modules
CREATE TABLE IF NOT EXISTS public.modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  category TEXT,
  module_status public.module_status NOT NULL DEFAULT 'planned',
  version TEXT DEFAULT '0.0.1',
  is_public BOOLEAN NOT NULL DEFAULT true,
  requires_subscription BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Roles
CREATE TABLE IF NOT EXISTS public.roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  is_system BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Permissions
CREATE TABLE IF NOT EXISTS public.permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  module_code TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Role Permissions junction
CREATE TABLE IF NOT EXISTS public.role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(role_id, permission_id)
);

-- System Settings
CREATE TABLE IF NOT EXISTS public.system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  value TEXT,
  value_type TEXT NOT NULL DEFAULT 'string',
  description TEXT,
  is_public BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Exchange Rates
CREATE TABLE IF NOT EXISTS public.exchange_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  base_currency_id UUID NOT NULL REFERENCES public.currencies(id) ON DELETE CASCADE,
  target_currency_id UUID NOT NULL REFERENCES public.currencies(id) ON DELETE CASCADE,
  rate NUMERIC(20, 8) NOT NULL,
  source TEXT,
  effective_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 3. USER TABLES
-- ============================================================

-- Profiles (linked to auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  country_id UUID REFERENCES public.countries(id) ON DELETE SET NULL,
  preferred_language_id UUID REFERENCES public.languages(id) ON DELETE SET NULL,
  preferred_currency_id UUID REFERENCES public.currencies(id) ON DELETE SET NULL,
  timezone TEXT DEFAULT 'UTC',
  usage_type TEXT,
  onboarding_completed BOOLEAN NOT NULL DEFAULT false,
  account_status public.account_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Super Admins
CREATE TABLE IF NOT EXISTS public.super_admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  admin_status public.super_admin_status NOT NULL DEFAULT 'active',
  granted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Organizations
CREATE TABLE IF NOT EXISTS public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  legal_name TEXT,
  slug TEXT UNIQUE,
  logo_url TEXT,
  country_id UUID REFERENCES public.countries(id) ON DELETE SET NULL,
  default_language_id UUID REFERENCES public.languages(id) ON DELETE SET NULL,
  default_currency_id UUID REFERENCES public.currencies(id) ON DELETE SET NULL,
  org_type TEXT DEFAULT 'company',
  org_status public.account_status NOT NULL DEFAULT 'active',
  owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Organization Members
CREATE TABLE IF NOT EXISTS public.organization_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role_id UUID REFERENCES public.roles(id) ON DELETE SET NULL,
  member_status public.org_member_status NOT NULL DEFAULT 'active',
  joined_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(organization_id, user_id)
);

-- Organization Invitations
CREATE TABLE IF NOT EXISTS public.organization_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role_id UUID REFERENCES public.roles(id) ON DELETE SET NULL,
  token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  invitation_status public.invitation_status NOT NULL DEFAULT 'pending',
  invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '7 days'),
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- User Module Access
CREATE TABLE IF NOT EXISTS public.user_module_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  module_id UUID NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  granted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, module_id, organization_id)
);

-- User Favorites (modules)
CREATE TABLE IF NOT EXISTS public.user_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  module_id UUID NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, module_id)
);

-- User Recent Services
CREATE TABLE IF NOT EXISTS public.user_recent_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  module_id UUID NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
  accessed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  notification_type public.notification_type NOT NULL DEFAULT 'info',
  title TEXT NOT NULL,
  message TEXT,
  action_url TEXT,
  is_read BOOLEAN NOT NULL DEFAULT false,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Audit Logs
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  module_code TEXT,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id TEXT,
  old_data JSONB,
  new_data JSONB,
  metadata JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 4. INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_profiles_id ON public.profiles(id);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_country ON public.profiles(country_id);
CREATE INDEX IF NOT EXISTS idx_super_admins_user_id ON public.super_admins(user_id);
CREATE INDEX IF NOT EXISTS idx_organizations_owner ON public.organizations(owner_id);
CREATE INDEX IF NOT EXISTS idx_organizations_slug ON public.organizations(slug);
CREATE INDEX IF NOT EXISTS idx_org_members_user ON public.organization_members(user_id);
CREATE INDEX IF NOT EXISTS idx_org_members_org ON public.organization_members(organization_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_org ON public.audit_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON public.audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_modules_code ON public.modules(code);
CREATE INDEX IF NOT EXISTS idx_modules_status ON public.modules(module_status);
CREATE INDEX IF NOT EXISTS idx_countries_iso ON public.countries(iso_code);
CREATE INDEX IF NOT EXISTS idx_languages_code ON public.languages(code);
CREATE INDEX IF NOT EXISTS idx_currencies_code ON public.currencies(code);
CREATE INDEX IF NOT EXISTS idx_user_favorites_user ON public.user_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_user_recent_user ON public.user_recent_services(user_id);

-- ============================================================
-- 5. FUNCTIONS (must be before RLS policies)
-- ============================================================

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    email,
    first_name,
    last_name,
    full_name,
    avatar_url,
    account_status
  ) VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', ''),
    'active'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'handle_new_user error: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- Check if current user is super admin
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.super_admins sa
    WHERE sa.user_id = auth.uid()
    AND sa.admin_status = 'active'
  );
$$;

-- Check if user is org member
CREATE OR REPLACE FUNCTION public.is_org_member(org_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.organization_members om
    WHERE om.organization_id = org_id
    AND om.user_id = auth.uid()
    AND om.member_status = 'active'
  );
$$;

-- Check if user is org admin/owner
CREATE OR REPLACE FUNCTION public.is_org_admin(org_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.organization_members om
    JOIN public.roles r ON om.role_id = r.id
    WHERE om.organization_id = org_id
    AND om.user_id = auth.uid()
    AND om.member_status = 'active'
    AND r.code IN ('owner', 'admin')
  );
$$;

-- ============================================================
-- 6. ENABLE RLS
-- ============================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.super_admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_module_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_recent_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.languages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.currencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.countries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exchange_rates ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 7. RLS POLICIES
-- ============================================================

-- Profiles: users manage their own
DROP POLICY IF EXISTS "profiles_own_access" ON public.profiles;
CREATE POLICY "profiles_own_access" ON public.profiles
FOR ALL TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "profiles_super_admin_read" ON public.profiles;
CREATE POLICY "profiles_super_admin_read" ON public.profiles
FOR SELECT TO authenticated
USING (public.is_super_admin());

-- Super Admins: only super admins can read
DROP POLICY IF EXISTS "super_admins_read" ON public.super_admins;
CREATE POLICY "super_admins_read" ON public.super_admins
FOR SELECT TO authenticated
USING (user_id = auth.uid() OR public.is_super_admin());

-- Organizations: members can read, admins can update
DROP POLICY IF EXISTS "orgs_member_read" ON public.organizations;
CREATE POLICY "orgs_member_read" ON public.organizations
FOR SELECT TO authenticated
USING (
  owner_id = auth.uid()
  OR public.is_org_member(id)
  OR public.is_super_admin()
);

DROP POLICY IF EXISTS "orgs_owner_insert" ON public.organizations;
CREATE POLICY "orgs_owner_insert" ON public.organizations
FOR INSERT TO authenticated
WITH CHECK (owner_id = auth.uid());

DROP POLICY IF EXISTS "orgs_admin_update" ON public.organizations;
CREATE POLICY "orgs_admin_update" ON public.organizations
FOR UPDATE TO authenticated
USING (owner_id = auth.uid() OR public.is_org_admin(id) OR public.is_super_admin())
WITH CHECK (owner_id = auth.uid() OR public.is_org_admin(id) OR public.is_super_admin());

-- Organization Members
DROP POLICY IF EXISTS "org_members_read" ON public.organization_members;
CREATE POLICY "org_members_read" ON public.organization_members
FOR SELECT TO authenticated
USING (
  user_id = auth.uid()
  OR public.is_org_member(organization_id)
  OR public.is_super_admin()
);

DROP POLICY IF EXISTS "org_members_insert" ON public.organization_members;
CREATE POLICY "org_members_insert" ON public.organization_members
FOR INSERT TO authenticated
WITH CHECK (
  user_id = auth.uid()
  OR public.is_org_admin(organization_id)
  OR public.is_super_admin()
);

DROP POLICY IF EXISTS "org_members_update" ON public.organization_members;
CREATE POLICY "org_members_update" ON public.organization_members
FOR UPDATE TO authenticated
USING (public.is_org_admin(organization_id) OR public.is_super_admin())
WITH CHECK (public.is_org_admin(organization_id) OR public.is_super_admin());

-- Notifications: own only
DROP POLICY IF EXISTS "notifications_own" ON public.notifications;
CREATE POLICY "notifications_own" ON public.notifications
FOR ALL TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Audit logs: own read + super admin
DROP POLICY IF EXISTS "audit_logs_own_read" ON public.audit_logs;
CREATE POLICY "audit_logs_own_read" ON public.audit_logs
FOR SELECT TO authenticated
USING (user_id = auth.uid() OR public.is_super_admin());

DROP POLICY IF EXISTS "audit_logs_insert" ON public.audit_logs;
CREATE POLICY "audit_logs_insert" ON public.audit_logs
FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

-- User module access
DROP POLICY IF EXISTS "user_module_access_own" ON public.user_module_access;
CREATE POLICY "user_module_access_own" ON public.user_module_access
FOR ALL TO authenticated
USING (user_id = auth.uid() OR public.is_super_admin())
WITH CHECK (user_id = auth.uid() OR public.is_super_admin());

-- User favorites
DROP POLICY IF EXISTS "user_favorites_own" ON public.user_favorites;
CREATE POLICY "user_favorites_own" ON public.user_favorites
FOR ALL TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- User recent services
DROP POLICY IF EXISTS "user_recent_own" ON public.user_recent_services;
CREATE POLICY "user_recent_own" ON public.user_recent_services
FOR ALL TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Reference tables: public read
DROP POLICY IF EXISTS "languages_public_read" ON public.languages;
CREATE POLICY "languages_public_read" ON public.languages
FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "currencies_public_read" ON public.currencies;
CREATE POLICY "currencies_public_read" ON public.currencies
FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "countries_public_read" ON public.countries;
CREATE POLICY "countries_public_read" ON public.countries
FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "modules_public_read" ON public.modules;
CREATE POLICY "modules_public_read" ON public.modules
FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "modules_super_admin_write" ON public.modules;
CREATE POLICY "modules_super_admin_write" ON public.modules
FOR ALL TO authenticated
USING (public.is_super_admin())
WITH CHECK (public.is_super_admin());

DROP POLICY IF EXISTS "roles_public_read" ON public.roles;
CREATE POLICY "roles_public_read" ON public.roles
FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "permissions_public_read" ON public.permissions;
CREATE POLICY "permissions_public_read" ON public.permissions
FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "role_permissions_public_read" ON public.role_permissions;
CREATE POLICY "role_permissions_public_read" ON public.role_permissions
FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "system_settings_public_read" ON public.system_settings;
CREATE POLICY "system_settings_public_read" ON public.system_settings
FOR SELECT TO public USING (is_public = true);

DROP POLICY IF EXISTS "system_settings_admin_all" ON public.system_settings;
CREATE POLICY "system_settings_admin_all" ON public.system_settings
FOR ALL TO authenticated
USING (public.is_super_admin())
WITH CHECK (public.is_super_admin());

DROP POLICY IF EXISTS "exchange_rates_public_read" ON public.exchange_rates;
CREATE POLICY "exchange_rates_public_read" ON public.exchange_rates
FOR SELECT TO public USING (true);

-- Organization invitations
DROP POLICY IF EXISTS "org_invitations_read" ON public.organization_invitations;
CREATE POLICY "org_invitations_read" ON public.organization_invitations
FOR SELECT TO authenticated
USING (
  public.is_org_admin(organization_id)
  OR email = (SELECT email FROM public.profiles WHERE id = auth.uid() LIMIT 1)
  OR public.is_super_admin()
);

DROP POLICY IF EXISTS "org_invitations_insert" ON public.organization_invitations;
CREATE POLICY "org_invitations_insert" ON public.organization_invitations
FOR INSERT TO authenticated
WITH CHECK (public.is_org_admin(organization_id) OR public.is_super_admin());

-- ============================================================
-- 8. TRIGGERS
-- ============================================================

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

DROP TRIGGER IF EXISTS profiles_updated_at ON public.profiles;
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS organizations_updated_at ON public.organizations;
CREATE TRIGGER organizations_updated_at
  BEFORE UPDATE ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS org_members_updated_at ON public.organization_members;
CREATE TRIGGER org_members_updated_at
  BEFORE UPDATE ON public.organization_members
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================
-- 9. SEED DATA
-- ============================================================

-- Languages
INSERT INTO public.languages (code, name, native_name, direction) VALUES
  ('fr', 'French', 'Français', 'ltr'),
  ('en', 'English', 'English', 'ltr'),
  ('pt', 'Portuguese', 'Português', 'ltr'),
  ('ar', 'Arabic', 'العربية', 'rtl'),
  ('es', 'Spanish', 'Español', 'ltr')
ON CONFLICT (code) DO NOTHING;

-- Currencies
INSERT INTO public.currencies (code, name, symbol, decimal_places) VALUES
  ('XOF', 'West African CFA Franc', 'F CFA', 0),
  ('USD', 'US Dollar', '$', 2),
  ('EUR', 'Euro', '€', 2),
  ('GBP', 'British Pound', '£', 2),
  ('NGN', 'Nigerian Naira', '₦', 2),
  ('GHS', 'Ghanaian Cedi', '₵', 2),
  ('CNY', 'Chinese Yuan', '¥', 2),
  ('XAF', 'Central African CFA Franc', 'FCFA', 0),
  ('MAD', 'Moroccan Dirham', 'MAD', 2),
  ('EGP', 'Egyptian Pound', 'E£', 2)
ON CONFLICT (code) DO NOTHING;

-- Countries
DO $$
DECLARE
  xof_id UUID;
  usd_id UUID;
  eur_id UUID;
  gbp_id UUID;
  ngn_id UUID;
  ghs_id UUID;
  xaf_id UUID;
  fr_lang_id UUID;
  en_lang_id UUID;
  pt_lang_id UUID;
  ar_lang_id UUID;
BEGIN
  SELECT id INTO xof_id FROM public.currencies WHERE code = 'XOF' LIMIT 1;
  SELECT id INTO usd_id FROM public.currencies WHERE code = 'USD' LIMIT 1;
  SELECT id INTO eur_id FROM public.currencies WHERE code = 'EUR' LIMIT 1;
  SELECT id INTO gbp_id FROM public.currencies WHERE code = 'GBP' LIMIT 1;
  SELECT id INTO ngn_id FROM public.currencies WHERE code = 'NGN' LIMIT 1;
  SELECT id INTO ghs_id FROM public.currencies WHERE code = 'GHS' LIMIT 1;
  SELECT id INTO xaf_id FROM public.currencies WHERE code = 'XAF' LIMIT 1;
  SELECT id INTO fr_lang_id FROM public.languages WHERE code = 'fr' LIMIT 1;
  SELECT id INTO en_lang_id FROM public.languages WHERE code = 'en' LIMIT 1;
  SELECT id INTO pt_lang_id FROM public.languages WHERE code = 'pt' LIMIT 1;
  SELECT id INTO ar_lang_id FROM public.languages WHERE code = 'ar' LIMIT 1;

  INSERT INTO public.countries (iso_code, iso3_code, name, flag_emoji, phone_code, default_currency_id, default_language_id, timezone) VALUES
    ('BJ', 'BEN', 'Bénin', '🇧🇯', '+229', xof_id, fr_lang_id, 'Africa/Porto-Novo'),
    ('SN', 'SEN', 'Sénégal', '🇸🇳', '+221', xof_id, fr_lang_id, 'Africa/Dakar'),
    ('CI', 'CIV', 'Côte d''Ivoire', '🇨🇮', '+225', xof_id, fr_lang_id, 'Africa/Abidjan'),
    ('NG', 'NGA', 'Nigeria', '🇳🇬', '+234', ngn_id, en_lang_id, 'Africa/Lagos'),
    ('GH', 'GHA', 'Ghana', '🇬🇭', '+233', ghs_id, en_lang_id, 'Africa/Accra'),
    ('CM', 'CMR', 'Cameroun', '🇨🇲', '+237', xaf_id, fr_lang_id, 'Africa/Douala'),
    ('FR', 'FRA', 'France', '🇫🇷', '+33', eur_id, fr_lang_id, 'Europe/Paris'),
    ('US', 'USA', 'États-Unis', '🇺🇸', '+1', usd_id, en_lang_id, 'America/New_York'),
    ('GB', 'GBR', 'Royaume-Uni', '🇬🇧', '+44', gbp_id, en_lang_id, 'Europe/London'),
    ('BR', 'BRA', 'Brésil', '🇧🇷', '+55', usd_id, pt_lang_id, 'America/Sao_Paulo'),
    ('MA', 'MAR', 'Maroc', '🇲🇦', '+212', usd_id, ar_lang_id, 'Africa/Casablanca'),
    ('TG', 'TGO', 'Togo', '🇹🇬', '+228', xof_id, fr_lang_id, 'Africa/Lome'),
    ('ML', 'MLI', 'Mali', '🇲🇱', '+223', xof_id, fr_lang_id, 'Africa/Bamako'),
    ('BF', 'BFA', 'Burkina Faso', '🇧🇫', '+226', xof_id, fr_lang_id, 'Africa/Ouagadougou'),
    ('GN', 'GIN', 'Guinée', '🇬🇳', '+224', usd_id, fr_lang_id, 'Africa/Conakry')
  ON CONFLICT (iso_code) DO NOTHING;
END $$;

-- Roles
INSERT INTO public.roles (code, name, description, is_system) VALUES
  ('owner', 'Propriétaire', 'Propriétaire de l''organisation', true),
  ('admin', 'Administrateur', 'Administrateur de l''organisation', true),
  ('manager', 'Manager', 'Manager de l''organisation', true),
  ('staff', 'Personnel', 'Membre du personnel', true),
  ('accountant', 'Comptable', 'Comptable de l''organisation', true),
  ('agent', 'Agent', 'Agent commercial', true),
  ('member', 'Membre', 'Membre standard', true),
  ('viewer', 'Observateur', 'Accès en lecture seule', true)
ON CONFLICT (code) DO NOTHING;

-- Permissions
INSERT INTO public.permissions (code, name, module_code) VALUES
  ('users.read', 'Voir les utilisateurs', 'core'),
  ('users.create', 'Créer des utilisateurs', 'core'),
  ('users.update', 'Modifier les utilisateurs', 'core'),
  ('users.delete', 'Supprimer des utilisateurs', 'core'),
  ('organizations.read', 'Voir les organisations', 'core'),
  ('organizations.update', 'Modifier les organisations', 'core'),
  ('organizations.delete', 'Supprimer les organisations', 'core'),
  ('members.read', 'Voir les membres', 'core'),
  ('members.invite', 'Inviter des membres', 'core'),
  ('members.update', 'Modifier les membres', 'core'),
  ('members.remove', 'Retirer des membres', 'core'),
  ('modules.read', 'Voir les modules', 'core'),
  ('modules.manage', 'Gérer les modules', 'core'),
  ('settings.read', 'Voir les paramètres', 'core'),
  ('settings.manage', 'Gérer les paramètres', 'core'),
  ('reports.read', 'Voir les rapports', 'core'),
  ('audit.read', 'Voir les logs d''audit', 'core')
ON CONFLICT (code) DO NOTHING;

-- Modules
INSERT INTO public.modules (code, name, description, icon, category, module_status, sort_order, requires_subscription) VALUES
  ('jdv_core', 'JDV CORE', 'Plateforme centrale JDV', '🏛️', 'core', 'active', 0, false),
  ('jdv_pay', 'JDV PAY', 'Paiements et services financiers', '💳', 'finance', 'development', 1, false),
  ('jdv_crm', 'JDV CRM', 'Gestion commerciale et relation client', '📊', 'business', 'development', 2, false),
  ('jdv_business', 'JDV BUSINESS', 'Gestion d''entreprise complète', '🏢', 'business', 'planned', 3, false),
  ('jdv_marketplace', 'JDV MARKETPLACE', 'Place de marché en ligne', '🛒', 'business', 'planned', 4, false),
  ('jdv_immo', 'JDV IMMO', 'Immobilier et location', '🏠', 'real_estate', 'planned', 5, false),
  ('jdv_travel', 'JDV TRAVEL', 'Voyages et tourisme', '✈️', 'mobility', 'planned', 6, false),
  ('jdv_transport', 'JDV TRANSPORT', 'Transport et logistique', '🚛', 'mobility', 'planned', 7, false),
  ('jdv_transit', 'JDV TRANSIT', 'Transit et douane', '🚢', 'mobility', 'planned', 8, false),
  ('jdv_health', 'JDV HEALTH', 'Santé et bien-être', '❤️', 'services', 'planned', 9, false),
  ('jdv_insurance', 'JDV INSURANCE', 'Assurances et protection', '🛡️', 'services', 'planned', 10, false),
  ('jdv_agriculture', 'JDV AGRICULTURE', 'Agriculture et agro-industrie', '🌾', 'services', 'planned', 11, false),
  ('jdv_energy', 'JDV ENERGY', 'Énergie et environnement', '⚡', 'services', 'planned', 12, false),
  ('jdv_academy', 'JDV ACADEMY', 'Formation et éducation', '🎓', 'education', 'planned', 13, false),
  ('jdv_tontine', 'JDV TONTINE', 'Épargne collective et tontine', '🐷', 'finance', 'planned', 14, false),
  ('jdv_pub', 'JDV PUB', 'Publicité et marketing', '📢', 'media', 'planned', 15, false),
  ('jdv_media', 'JDV MEDIA', 'Médias et contenus', '📺', 'media', 'planned', 16, false),
  ('jdv_social', 'JDV SOCIAL', 'Réseau social professionnel', '👥', 'community', 'planned', 17, false),
  ('jdv_ai', 'JDV IA', 'Intelligence artificielle et automatisation', '🤖', 'ai', 'development', 18, false)
ON CONFLICT (code) DO NOTHING;

-- System Settings
INSERT INTO public.system_settings (key, value, value_type, description, is_public) VALUES
  ('default_language', 'fr', 'string', 'Langue par défaut de la plateforme', true),
  ('default_country', 'BJ', 'string', 'Pays par défaut', true),
  ('default_currency', 'XOF', 'string', 'Devise par défaut', true),
  ('maintenance_mode', 'false', 'boolean', 'Mode maintenance global', true),
  ('registration_enabled', 'true', 'boolean', 'Inscription activée', true),
  ('email_confirmation_required', 'false', 'boolean', 'Confirmation email requise', false),
  ('platform_name', 'JDV GLOBAL CENTER', 'string', 'Nom de la plateforme', true),
  ('platform_version', '1.0.0', 'string', 'Version de la plateforme', true)
ON CONFLICT (key) DO NOTHING;

-- ============================================================
-- 10. STORAGE BUCKETS (via SQL)
-- ============================================================
-- Note: Storage buckets are created via Supabase dashboard or API
-- Buckets needed: avatars, organization-assets, documents

