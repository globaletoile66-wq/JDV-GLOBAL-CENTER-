-- ============================================================
-- JDV INSURANCE — reconstitué depuis le schéma Supabase live
-- ============================================================

CREATE TABLE IF NOT EXISTS public.insurance_providers (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  organization_id uuid REFERENCES organizations(id) ON DELETE SET NULL,
  legal_name text NOT NULL,
  trade_name text,
  registration_number text,
  country_id uuid REFERENCES countries(id),
  phone text,
  email text,
  website text,
  verification_status text DEFAULT 'pending' NOT NULL CHECK (verification_status = ANY (ARRAY['pending','verified','suspended','rejected'])),
  is_active boolean DEFAULT true NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.insurance_products (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  provider_id uuid NOT NULL REFERENCES insurance_providers(id) ON DELETE RESTRICT,
  code text NOT NULL,
  name text NOT NULL,
  description text,
  insurance_type text NOT NULL,
  currency_id uuid REFERENCES currencies(id),
  premium_frequency text DEFAULT 'monthly' NOT NULL CHECK (premium_frequency = ANY (ARRAY['one_time','daily','weekly','monthly','quarterly','semiannual','annual'])),
  base_premium numeric(20,4) DEFAULT 0 NOT NULL CHECK (base_premium >= 0),
  is_active boolean DEFAULT true NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE (provider_id, code)
);

CREATE TABLE IF NOT EXISTS public.insurance_customers (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  organization_id uuid REFERENCES organizations(id) ON DELETE SET NULL,
  full_name text NOT NULL,
  phone text,
  email text,
  country_id uuid REFERENCES countries(id),
  identity_reference text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.insurance_policies (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  policy_number text NOT NULL UNIQUE,
  customer_id uuid NOT NULL REFERENCES insurance_customers(id) ON DELETE RESTRICT,
  product_id uuid NOT NULL REFERENCES insurance_products(id) ON DELETE RESTRICT,
  organization_id uuid REFERENCES organizations(id) ON DELETE SET NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  status text DEFAULT 'draft' NOT NULL CHECK (status = ANY (ARRAY['draft','pending','active','suspended','expired','cancelled'])),
  currency_id uuid REFERENCES currencies(id),
  premium_amount numeric(20,4) NOT NULL CHECK (premium_amount >= 0),
  total_coverage_amount numeric(20,4) DEFAULT 0 NOT NULL CHECK (total_coverage_amount >= 0),
  payment_reference text,
  idempotency_key text UNIQUE,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  CHECK (end_date >= start_date)
);

CREATE TABLE IF NOT EXISTS public.insurance_coverages (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  policy_id uuid NOT NULL REFERENCES insurance_policies(id) ON DELETE CASCADE,
  coverage_code text NOT NULL,
  name text NOT NULL,
  description text,
  coverage_limit numeric(20,4) DEFAULT 0 NOT NULL CHECK (coverage_limit >= 0),
  deductible_amount numeric(20,4) DEFAULT 0 NOT NULL CHECK (deductible_amount >= 0),
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE (policy_id, coverage_code)
);

CREATE TABLE IF NOT EXISTS public.insurance_premium_schedules (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  policy_id uuid NOT NULL REFERENCES insurance_policies(id) ON DELETE CASCADE,
  due_date date NOT NULL,
  amount numeric(20,4) NOT NULL CHECK (amount > 0),
  currency_id uuid REFERENCES currencies(id),
  status text DEFAULT 'due' NOT NULL CHECK (status = ANY (ARRAY['due','paid','late','cancelled'])),
  wallet_transaction_id uuid REFERENCES wallet_transactions(id),
  paid_at timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.insurance_payments (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  policy_id uuid NOT NULL REFERENCES insurance_policies(id) ON DELETE RESTRICT,
  schedule_id uuid REFERENCES insurance_premium_schedules(id) ON DELETE SET NULL,
  customer_id uuid NOT NULL REFERENCES insurance_customers(id) ON DELETE RESTRICT,
  amount numeric(20,4) NOT NULL CHECK (amount > 0),
  currency_id uuid REFERENCES currencies(id),
  wallet_transaction_id uuid,
  provider_transaction_id text,
  payment_reference text NOT NULL UNIQUE,
  status text DEFAULT 'pending' NOT NULL CHECK (status = ANY (ARRAY['pending','completed','failed','reversed'])),
  paid_at timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.insurance_claims (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  claim_number text NOT NULL UNIQUE,
  policy_id uuid NOT NULL REFERENCES insurance_policies(id) ON DELETE RESTRICT,
  customer_id uuid NOT NULL REFERENCES insurance_customers(id) ON DELETE RESTRICT,
  claim_type text NOT NULL,
  incident_date date NOT NULL,
  reported_at timestamptz DEFAULT now() NOT NULL,
  description text NOT NULL,
  claimed_amount numeric(20,4) DEFAULT 0 NOT NULL CHECK (claimed_amount >= 0),
  approved_amount numeric(20,4) DEFAULT 0 NOT NULL CHECK (approved_amount >= 0),
  paid_amount numeric(20,4) DEFAULT 0 NOT NULL CHECK (paid_amount >= 0),
  currency_id uuid REFERENCES currencies(id),
  status text DEFAULT 'submitted' NOT NULL CHECK (status = ANY (ARRAY['submitted','under_review','approved','partially_approved','rejected','paid','closed'])),
  assigned_to uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.insurance_claim_documents (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  claim_id uuid NOT NULL REFERENCES insurance_claims(id) ON DELETE CASCADE,
  storage_path text NOT NULL,
  document_type text NOT NULL,
  uploaded_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.insurance_commissions (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  policy_id uuid NOT NULL REFERENCES insurance_policies(id) ON DELETE RESTRICT,
  beneficiary_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  organization_id uuid REFERENCES organizations(id) ON DELETE SET NULL,
  amount numeric(20,4) NOT NULL CHECK (amount >= 0),
  currency_id uuid REFERENCES currencies(id),
  status text DEFAULT 'pending' NOT NULL CHECK (status = ANY (ARRAY['pending','approved','paid','cancelled'])),
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_insurance_claims_customer ON insurance_claims(customer_id);
CREATE INDEX IF NOT EXISTS idx_insurance_claims_policy ON insurance_claims(policy_id);
CREATE INDEX IF NOT EXISTS idx_insurance_customers_user ON insurance_customers(user_id);
CREATE INDEX IF NOT EXISTS idx_insurance_payments_policy ON insurance_payments(policy_id);
CREATE INDEX IF NOT EXISTS idx_insurance_policies_customer ON insurance_policies(customer_id);
CREATE INDEX IF NOT EXISTS idx_insurance_policies_org ON insurance_policies(organization_id);
CREATE INDEX IF NOT EXISTS idx_insurance_products_provider ON insurance_products(provider_id);
CREATE INDEX IF NOT EXISTS idx_insurance_schedules_policy_due ON insurance_premium_schedules(policy_id,due_date);

-- ============================================================
-- FONCTIONS
-- ============================================================

CREATE OR REPLACE FUNCTION public.insurance_create_customer(
  p_full_name text, p_phone text DEFAULT NULL, p_email text DEFAULT NULL, p_country_id uuid DEFAULT NULL, p_identity_reference text DEFAULT NULL
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public','pg_temp' AS $function$
DECLARE v_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'authentication required'; END IF;
  INSERT INTO public.insurance_customers(user_id, full_name, phone, email, country_id, identity_reference)
  VALUES (auth.uid(), trim(p_full_name), p_phone, p_email, p_country_id, p_identity_reference)
  RETURNING id INTO v_id;
  RETURN v_id;
END $function$;

CREATE OR REPLACE FUNCTION public.insurance_submit_claim(
  p_policy_id uuid, p_claim_type text, p_incident_date date, p_description text, p_claimed_amount numeric, p_currency_id uuid DEFAULT NULL
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public','pg_temp' AS $function$
DECLARE
  v_id uuid; v_customer uuid; v_policy_currency uuid; v_num text;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'authentication required'; END IF;
  IF coalesce(trim(p_claim_type),'') = '' THEN RAISE EXCEPTION 'claim type required'; END IF;
  IF coalesce(trim(p_description),'') = '' THEN RAISE EXCEPTION 'claim description required'; END IF;
  IF p_incident_date IS NULL OR p_incident_date > current_date THEN RAISE EXCEPTION 'invalid incident date'; END IF;
  IF p_claimed_amount IS NULL OR p_claimed_amount <= 0 THEN RAISE EXCEPTION 'claimed amount must be greater than zero'; END IF;

  SELECT p.customer_id, p.currency_id INTO v_customer, v_policy_currency
  FROM public.insurance_policies p JOIN public.insurance_customers c ON c.id = p.customer_id
  WHERE p.id = p_policy_id AND c.user_id = auth.uid() AND p.status = 'active';

  IF v_customer IS NULL THEN RAISE EXCEPTION 'policy access denied'; END IF;
  IF p_currency_id IS NOT NULL AND p_currency_id <> v_policy_currency THEN RAISE EXCEPTION 'claim currency does not match policy currency'; END IF;

  v_num := 'CLM-' || to_char(clock_timestamp(),'YYYYMMDDHH24MISSMS') || '-' || substr(gen_random_uuid()::text,1,8);

  INSERT INTO public.insurance_claims(claim_number, policy_id, customer_id, claim_type, incident_date, description, claimed_amount, currency_id)
  VALUES(v_num, p_policy_id, v_customer, trim(p_claim_type), p_incident_date, trim(p_description), p_claimed_amount, v_policy_currency)
  RETURNING id INTO v_id;

  INSERT INTO public.audit_logs(user_id, module_code, action, entity_type, entity_id, new_data)
  VALUES(auth.uid(), 'insurance', 'claim.submitted', 'insurance_claims', v_id::text,
    jsonb_build_object('policy_id',p_policy_id,'claimed_amount',p_claimed_amount,'currency_id',v_policy_currency));

  RETURN v_id;
END;
$function$;

CREATE TRIGGER trg_jdv_guard_wallet_reuse BEFORE INSERT OR UPDATE ON public.insurance_payments FOR EACH ROW EXECUTE FUNCTION public.jdv_guard_wallet_transaction_reuse();
CREATE TRIGGER trg_jdv_guard_wallet_reuse BEFORE INSERT OR UPDATE ON public.insurance_premium_schedules FOR EACH ROW EXECUTE FUNCTION public.jdv_guard_wallet_transaction_reuse();

-- ============================================================
-- RLS
-- ============================================================
ALTER TABLE public.insurance_claim_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.insurance_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.insurance_commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.insurance_coverages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.insurance_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.insurance_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.insurance_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.insurance_premium_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.insurance_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.insurance_providers ENABLE ROW LEVEL SECURITY;

CREATE POLICY insurance_claim_documents_access ON insurance_claim_documents FOR SELECT USING (
  EXISTS (SELECT 1 FROM insurance_claims c WHERE c.id = insurance_claim_documents.claim_id AND (
    c.assigned_to = auth.uid() OR EXISTS (SELECT 1 FROM insurance_customers cu WHERE cu.id = c.customer_id AND cu.user_id = auth.uid()) OR is_super_admin()
  ))
);

CREATE POLICY insurance_claim_access ON insurance_claims FOR SELECT USING (
  assigned_to = auth.uid()
  OR EXISTS (SELECT 1 FROM insurance_customers c WHERE c.id = insurance_claims.customer_id AND c.user_id = auth.uid())
  OR EXISTS (SELECT 1 FROM insurance_policies p WHERE p.id = insurance_claims.policy_id AND (p.created_by = auth.uid() OR is_org_admin(p.organization_id)))
  OR is_super_admin()
);

CREATE POLICY insurance_commission_access ON insurance_commissions FOR SELECT USING (
  beneficiary_user_id = auth.uid() OR is_org_admin(organization_id) OR is_super_admin()
);

CREATE POLICY insurance_coverages_customer_access ON insurance_coverages FOR SELECT USING (
  EXISTS (SELECT 1 FROM insurance_policies p JOIN insurance_customers c ON c.id = p.customer_id
    WHERE p.id = insurance_coverages.policy_id AND (c.user_id = auth.uid() OR p.created_by = auth.uid() OR is_org_admin(p.organization_id)))
  OR is_super_admin()
);

CREATE POLICY insurance_customers_self ON insurance_customers FOR ALL
USING (user_id = auth.uid() OR is_super_admin() OR is_org_admin(organization_id))
WITH CHECK (user_id = auth.uid() OR is_super_admin() OR is_org_admin(organization_id));

CREATE POLICY insurance_payment_access ON insurance_payments FOR SELECT USING (
  EXISTS (SELECT 1 FROM insurance_customers c WHERE c.id = insurance_payments.customer_id AND c.user_id = auth.uid())
  OR EXISTS (SELECT 1 FROM insurance_policies p WHERE p.id = insurance_payments.policy_id AND (p.created_by = auth.uid() OR is_org_admin(p.organization_id)))
  OR is_super_admin()
);

CREATE POLICY insurance_policies_customer_access ON insurance_policies FOR SELECT USING (
  created_by = auth.uid()
  OR EXISTS (SELECT 1 FROM insurance_customers c WHERE c.id = insurance_policies.customer_id AND c.user_id = auth.uid())
  OR is_super_admin() OR is_org_admin(organization_id)
);

CREATE POLICY insurance_schedule_access ON insurance_premium_schedules FOR SELECT USING (
  EXISTS (SELECT 1 FROM insurance_policies p JOIN insurance_customers c ON c.id = p.customer_id
    WHERE p.id = insurance_premium_schedules.policy_id AND (c.user_id = auth.uid() OR p.created_by = auth.uid() OR is_org_admin(p.organization_id)))
  OR is_super_admin()
);

CREATE POLICY insurance_products_public_catalog ON insurance_products FOR SELECT USING (is_active = true);
CREATE POLICY insurance_providers_public_catalog ON insurance_providers FOR SELECT USING (is_active = true AND verification_status = 'verified');
