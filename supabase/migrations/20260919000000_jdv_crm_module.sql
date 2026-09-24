-- ============================================================
-- JDV CRM — module complet (prospection, ventes à crédit, recouvrement,
-- commissions, stock terrain, documents)
-- Reconstruit à partir des migrations appliquées en direct sur le projet
-- Supabase (aucune migration n'avait été committée pour ce module).
-- Réutilise JDV CORE (auth.users, countries) et JDV BUSINESS
-- (business_profiles, business_members, business_clients, business_products).
-- ============================================================

-- ============================================================
-- ÉTAPE 1 : enums + prospection
-- ============================================================

DO $$ BEGIN
  CREATE TYPE crm_prospecteur_status AS ENUM ('active','inactive','suspended');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE crm_prospect_temperature AS ENUM ('hot','warm','cold');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE crm_prospect_status AS ENUM ('new','contacted','qualified','converted','lost','archived');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE crm_activity_type AS ENUM ('visit','call','whatsapp','email','appointment','follow_up','delivery','collection','other');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE crm_appointment_status AS ENUM ('scheduled','confirmed','completed','cancelled','missed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE OR REPLACE FUNCTION public.crm_set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TABLE IF NOT EXISTS public.crm_prospecteurs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.business_profiles(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code text,
  prospecteur_status crm_prospecteur_status NOT NULL DEFAULT 'active',
  territory text,
  monthly_target numeric,
  commission_rate numeric,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (business_id, user_id)
);

CREATE TRIGGER trg_crm_prospecteurs_updated_at
  BEFORE UPDATE ON public.crm_prospecteurs
  FOR EACH ROW EXECUTE FUNCTION public.crm_set_updated_at();

CREATE TABLE IF NOT EXISTS public.crm_prospects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.business_profiles(id) ON DELETE CASCADE,
  assigned_prospecteur_id uuid REFERENCES public.crm_prospecteurs(id) ON DELETE SET NULL,
  first_name text NOT NULL,
  last_name text,
  phone text,
  email text,
  address text,
  country_id uuid REFERENCES public.countries(id),
  city text,
  latitude numeric,
  longitude numeric,
  meeting_place text,
  desired_product text,
  desired_product_code text,
  requested_amount numeric,
  appointment_at timestamptz,
  temperature crm_prospect_temperature NOT NULL DEFAULT 'warm',
  prospect_status crm_prospect_status NOT NULL DEFAULT 'new',
  converted_client_id uuid REFERENCES public.business_clients(id) ON DELETE SET NULL,
  converted_at timestamptz,
  last_contact_at timestamptz,
  next_follow_up_at timestamptz,
  contact_count integer NOT NULL DEFAULT 0,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  archived_at timestamptz
);

CREATE TRIGGER trg_crm_prospects_updated_at
  BEFORE UPDATE ON public.crm_prospects
  FOR EACH ROW EXECUTE FUNCTION public.crm_set_updated_at();

-- Protection anti-vol de prospect : seul un admin/manager business
-- peut réattribuer un prospect déjà assigné à quelqu'un d'autre.
CREATE OR REPLACE FUNCTION public.protect_prospect_assignment()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  v_is_privileged boolean;
BEGIN
  IF TG_OP = 'UPDATE'
     AND OLD.assigned_prospecteur_id IS DISTINCT FROM NEW.assigned_prospecteur_id
     AND OLD.assigned_prospecteur_id IS NOT NULL THEN

    SELECT EXISTS (
      SELECT 1 FROM public.business_members bm
      WHERE bm.business_id = NEW.business_id
        AND bm.user_id = auth.uid()
        AND bm.is_active = true
        AND bm.role IN ('OWNER','ADMIN','MANAGER')
    ) OR public.is_super_admin() INTO v_is_privileged;

    IF NOT v_is_privileged THEN
      RAISE EXCEPTION 'Réattribution de prospect non autorisée';
    END IF;

    INSERT INTO public.audit_logs (user_id, organization_id, module_code, action, entity_type, entity_id, old_data, new_data)
    VALUES (
      auth.uid(), NULL, 'crm', 'prospect.reassigned', 'crm_prospects', NEW.id::text,
      jsonb_build_object('assigned_prospecteur_id', OLD.assigned_prospecteur_id),
      jsonb_build_object('assigned_prospecteur_id', NEW.assigned_prospecteur_id)
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_protect_prospect_assignment
  BEFORE UPDATE ON public.crm_prospects
  FOR EACH ROW EXECUTE FUNCTION public.protect_prospect_assignment();

CREATE TABLE IF NOT EXISTS public.crm_prospect_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.business_profiles(id) ON DELETE CASCADE,
  prospect_id uuid REFERENCES public.crm_prospects(id) ON DELETE CASCADE,
  client_id uuid REFERENCES public.business_clients(id) ON DELETE CASCADE,
  actor_user_id uuid NOT NULL REFERENCES auth.users(id),
  activity_type crm_activity_type NOT NULL,
  result text,
  comment text,
  next_action_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (prospect_id IS NOT NULL OR client_id IS NOT NULL)
);

CREATE TABLE IF NOT EXISTS public.crm_appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.business_profiles(id) ON DELETE CASCADE,
  prospect_id uuid REFERENCES public.crm_prospects(id) ON DELETE CASCADE,
  client_id uuid REFERENCES public.business_clients(id) ON DELETE CASCADE,
  prospecteur_id uuid REFERENCES public.crm_prospecteurs(id) ON DELETE SET NULL,
  title text,
  scheduled_at timestamptz NOT NULL,
  location text,
  appointment_status crm_appointment_status NOT NULL DEFAULT 'scheduled',
  notes text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_crm_appointments_updated_at
  BEFORE UPDATE ON public.crm_appointments
  FOR EACH ROW EXECUTE FUNCTION public.crm_set_updated_at();

-- ============================================================
-- ÉTAPE 2 : crédit, échéances, paiements, recouvrement
-- ============================================================

DO $$ BEGIN
  CREATE TYPE crm_schedule_status AS ENUM ('pending','partially_paid','paid','overdue','cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE crm_collection_activity_type AS ENUM ('call','whatsapp','visit','reminder','payment','promise','comment');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE crm_promise_status AS ENUM ('pending','kept','broken','cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.crm_credit_terms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id uuid NOT NULL UNIQUE REFERENCES public.business_sales(id) ON DELETE CASCADE,
  business_id uuid NOT NULL REFERENCES public.business_profiles(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES public.business_clients(id) ON DELETE CASCADE,
  prospecteur_id uuid REFERENCES public.crm_prospecteurs(id) ON DELETE SET NULL,
  down_payment numeric NOT NULL DEFAULT 0,
  financed_amount numeric NOT NULL CHECK (financed_amount >= 0),
  installments_count integer NOT NULL CHECK (installments_count > 0),
  frequency text NOT NULL DEFAULT 'monthly',
  first_due_date date NOT NULL,
  last_due_date date,
  currency_id uuid REFERENCES public.currencies(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_crm_credit_terms_updated_at
  BEFORE UPDATE ON public.crm_credit_terms
  FOR EACH ROW EXECUTE FUNCTION public.crm_set_updated_at();

CREATE TABLE IF NOT EXISTS public.crm_payment_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  credit_term_id uuid NOT NULL REFERENCES public.crm_credit_terms(id) ON DELETE CASCADE,
  sale_id uuid NOT NULL REFERENCES public.business_sales(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES public.business_clients(id) ON DELETE CASCADE,
  business_id uuid REFERENCES public.business_profiles(id) ON DELETE CASCADE,
  installment_number integer NOT NULL,
  due_date date NOT NULL,
  amount_due numeric NOT NULL CHECK (amount_due >= 0),
  amount_paid numeric NOT NULL DEFAULT 0 CHECK (amount_paid >= 0),
  remaining_amount numeric GENERATED ALWAYS AS (GREATEST(amount_due - amount_paid, 0)) STORED,
  schedule_status crm_schedule_status NOT NULL DEFAULT 'pending',
  paid_at timestamptz,
  currency_id uuid REFERENCES public.currencies(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (credit_term_id, installment_number)
);

CREATE TRIGGER trg_crm_payment_schedules_updated_at
  BEFORE UPDATE ON public.crm_payment_schedules
  FOR EACH ROW EXECUTE FUNCTION public.crm_set_updated_at();

CREATE OR REPLACE FUNCTION public.crm_fill_schedule_business_id()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.business_id IS NULL THEN
    SELECT business_id INTO NEW.business_id FROM public.crm_credit_terms WHERE id = NEW.credit_term_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_crm_fill_schedule_business_id
  BEFORE INSERT ON public.crm_payment_schedules
  FOR EACH ROW EXECUTE FUNCTION public.crm_fill_schedule_business_id();

CREATE TABLE IF NOT EXISTS public.crm_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.business_profiles(id) ON DELETE CASCADE,
  schedule_id uuid REFERENCES public.crm_payment_schedules(id) ON DELETE SET NULL,
  sale_id uuid REFERENCES public.business_sales(id) ON DELETE SET NULL,
  client_id uuid NOT NULL REFERENCES public.business_clients(id) ON DELETE CASCADE,
  amount numeric NOT NULL CHECK (amount > 0),
  currency_id uuid REFERENCES public.currencies(id),
  payment_method text,
  jdv_pay_transaction_id uuid REFERENCES public.wallet_transactions(id),
  idempotency_key text UNIQUE,
  recorded_by uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.crm_collection_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.business_profiles(id) ON DELETE CASCADE,
  schedule_id uuid NOT NULL REFERENCES public.crm_payment_schedules(id) ON DELETE CASCADE,
  actor_user_id uuid NOT NULL REFERENCES auth.users(id),
  activity_type crm_collection_activity_type NOT NULL,
  promised_amount numeric,
  promised_date date,
  promise_status crm_promise_status,
  comment text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.crm_record_payment(
  p_business_id uuid,
  p_client_id uuid,
  p_amount numeric,
  p_schedule_id uuid DEFAULT NULL,
  p_sale_id uuid DEFAULT NULL,
  p_currency_id uuid DEFAULT NULL,
  p_payment_method text DEFAULT NULL,
  p_jdv_pay_transaction_id uuid DEFAULT NULL,
  p_idempotency_key text DEFAULT NULL
) RETURNS public.crm_payments
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  v_payment public.crm_payments;
  v_schedule public.crm_payment_schedules;
  v_new_paid numeric;
BEGIN
  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'Montant de paiement invalide';
  END IF;

  IF NOT (public.user_has_business_access(p_business_id) OR public.is_super_admin()) THEN
    RAISE EXCEPTION 'Accès refusé';
  END IF;

  IF p_idempotency_key IS NOT NULL THEN
    SELECT * INTO v_payment FROM public.crm_payments WHERE idempotency_key = p_idempotency_key;
    IF FOUND THEN
      RETURN v_payment;
    END IF;
  END IF;

  INSERT INTO public.crm_payments (
    business_id, schedule_id, sale_id, client_id, amount, currency_id,
    payment_method, jdv_pay_transaction_id, idempotency_key, recorded_by
  ) VALUES (
    p_business_id, p_schedule_id, p_sale_id, p_client_id, p_amount, p_currency_id,
    p_payment_method, p_jdv_pay_transaction_id, p_idempotency_key, auth.uid()
  ) RETURNING * INTO v_payment;

  IF p_schedule_id IS NOT NULL THEN
    SELECT * INTO v_schedule FROM public.crm_payment_schedules WHERE id = p_schedule_id FOR UPDATE;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Échéance introuvable';
    END IF;

    v_new_paid := v_schedule.amount_paid + p_amount;

    UPDATE public.crm_payment_schedules
    SET amount_paid = v_new_paid,
        schedule_status = CASE
          WHEN v_new_paid >= amount_due THEN 'paid'
          WHEN v_new_paid > 0 THEN 'partially_paid'
          ELSE schedule_status
        END,
        paid_at = CASE WHEN v_new_paid >= amount_due THEN now() ELSE paid_at END
    WHERE id = p_schedule_id;
  END IF;

  INSERT INTO public.audit_logs (user_id, module_code, action, entity_type, entity_id, new_data)
  VALUES (auth.uid(), 'crm', 'payment.recorded', 'crm_payments', v_payment.id::text, to_jsonb(v_payment));

  RETURN v_payment;
END;
$$;

-- ============================================================
-- ÉTAPE 3 : commissions et objectifs commerciaux
-- ============================================================

DO $$ BEGIN
  CREATE TYPE crm_commission_basis AS ENUM ('sale_amount','collected_amount','fixed','per_unit');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE crm_commission_status AS ENUM ('pending','approved','paid','cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE crm_target_period AS ENUM ('daily','weekly','monthly','yearly');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.crm_commission_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.business_profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  commission_basis crm_commission_basis NOT NULL DEFAULT 'sale_amount',
  percentage numeric DEFAULT 0,
  fixed_amount numeric DEFAULT 0,
  category_id uuid REFERENCES public.business_product_categories(id),
  product_id uuid REFERENCES public.business_products(id),
  prospecteur_id uuid REFERENCES public.crm_prospecteurs(id) ON DELETE CASCADE,
  is_active boolean NOT NULL DEFAULT true,
  priority integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_crm_commission_rules_updated_at
  BEFORE UPDATE ON public.crm_commission_rules
  FOR EACH ROW EXECUTE FUNCTION public.crm_set_updated_at();

CREATE TABLE IF NOT EXISTS public.crm_commissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.business_profiles(id) ON DELETE CASCADE,
  prospecteur_id uuid NOT NULL REFERENCES public.crm_prospecteurs(id) ON DELETE CASCADE,
  sale_id uuid REFERENCES public.business_sales(id) ON DELETE SET NULL,
  payment_id uuid REFERENCES public.crm_payments(id) ON DELETE SET NULL,
  rule_id uuid REFERENCES public.crm_commission_rules(id) ON DELETE SET NULL,
  amount numeric NOT NULL CHECK (amount >= 0),
  currency_id uuid REFERENCES public.currencies(id),
  commission_status crm_commission_status NOT NULL DEFAULT 'pending',
  idempotency_key text UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_crm_commissions_updated_at
  BEFORE UPDATE ON public.crm_commissions
  FOR EACH ROW EXECUTE FUNCTION public.crm_set_updated_at();

CREATE UNIQUE INDEX IF NOT EXISTS uq_crm_commission_per_sale_prospecteur
  ON public.crm_commissions (sale_id, prospecteur_id)
  WHERE sale_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.crm_targets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.business_profiles(id) ON DELETE CASCADE,
  prospecteur_id uuid REFERENCES public.crm_prospecteurs(id) ON DELETE CASCADE,
  period_type crm_target_period NOT NULL DEFAULT 'monthly',
  period_start date NOT NULL,
  period_end date NOT NULL,
  target_type text NOT NULL,
  target_value numeric NOT NULL,
  achieved_value numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_crm_targets_updated_at
  BEFORE UPDATE ON public.crm_targets
  FOR EACH ROW EXECUTE FUNCTION public.crm_set_updated_at();

CREATE OR REPLACE FUNCTION public.crm_calculate_commission(
  p_sale_id uuid,
  p_prospecteur_id uuid
) RETURNS public.crm_commissions
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  v_sale public.business_sales;
  v_rule public.crm_commission_rules;
  v_amount numeric;
  v_commission public.crm_commissions;
BEGIN
  SELECT * INTO v_sale FROM public.business_sales WHERE id = p_sale_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Vente introuvable';
  END IF;

  SELECT * INTO v_commission FROM public.crm_commissions
  WHERE sale_id = p_sale_id AND prospecteur_id = p_prospecteur_id;
  IF FOUND THEN
    RETURN v_commission;
  END IF;

  SELECT * INTO v_rule FROM public.crm_commission_rules
  WHERE business_id = v_sale.business_id
    AND is_active = true
    AND (prospecteur_id IS NULL OR prospecteur_id = p_prospecteur_id)
  ORDER BY priority DESC, (prospecteur_id IS NOT NULL) DESC
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  v_amount := CASE v_rule.commission_basis
    WHEN 'sale_amount' THEN COALESCE(v_sale.total_amount,0) * COALESCE(v_rule.percentage,0) / 100
    WHEN 'fixed' THEN COALESCE(v_rule.fixed_amount,0)
    ELSE 0
  END;

  INSERT INTO public.crm_commissions (business_id, prospecteur_id, sale_id, rule_id, amount, currency_id)
  VALUES (v_sale.business_id, p_prospecteur_id, p_sale_id, v_rule.id, v_amount, v_sale.currency_id)
  RETURNING * INTO v_commission;

  RETURN v_commission;
END;
$$;

-- ============================================================
-- ÉTAPE 4 : stock commercial terrain
-- ============================================================

DO $$ BEGIN
  CREATE TYPE crm_stock_movement_type AS ENUM ('transfer','reception','sale','return','adjustment');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.crm_prospecteur_stocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.business_profiles(id) ON DELETE CASCADE,
  prospecteur_id uuid NOT NULL REFERENCES public.crm_prospecteurs(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.business_products(id) ON DELETE CASCADE,
  quantity numeric NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (prospecteur_id, product_id)
);

CREATE TRIGGER trg_crm_prospecteur_stocks_updated_at
  BEFORE UPDATE ON public.crm_prospecteur_stocks
  FOR EACH ROW EXECUTE FUNCTION public.crm_set_updated_at();

CREATE TABLE IF NOT EXISTS public.crm_stock_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.business_profiles(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.business_products(id) ON DELETE CASCADE,
  movement_type crm_stock_movement_type NOT NULL,
  quantity numeric NOT NULL CHECK (quantity > 0),
  from_prospecteur_id uuid REFERENCES public.crm_prospecteurs(id),
  to_prospecteur_id uuid REFERENCES public.crm_prospecteurs(id),
  sale_id uuid REFERENCES public.business_sales(id),
  reference text,
  actor_user_id uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.crm_transfer_stock(
  p_business_id uuid,
  p_product_id uuid,
  p_quantity numeric,
  p_to_prospecteur_id uuid,
  p_from_prospecteur_id uuid DEFAULT NULL,
  p_reference text DEFAULT NULL
) RETURNS public.crm_stock_movements
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  v_movement public.crm_stock_movements;
  v_from_qty numeric;
BEGIN
  IF p_quantity IS NULL OR p_quantity <= 0 THEN
    RAISE EXCEPTION 'Quantité invalide';
  END IF;

  IF NOT (public.user_has_business_access(p_business_id) OR public.is_super_admin()) THEN
    RAISE EXCEPTION 'Accès refusé';
  END IF;

  IF p_from_prospecteur_id IS NOT NULL THEN
    SELECT quantity INTO v_from_qty FROM public.crm_prospecteur_stocks
    WHERE prospecteur_id = p_from_prospecteur_id AND product_id = p_product_id
    FOR UPDATE;

    IF v_from_qty IS NULL OR v_from_qty < p_quantity THEN
      RAISE EXCEPTION 'Stock insuffisant pour ce transfert';
    END IF;

    UPDATE public.crm_prospecteur_stocks
    SET quantity = quantity - p_quantity
    WHERE prospecteur_id = p_from_prospecteur_id AND product_id = p_product_id;
  END IF;

  INSERT INTO public.crm_prospecteur_stocks (business_id, prospecteur_id, product_id, quantity)
  VALUES (p_business_id, p_to_prospecteur_id, p_product_id, p_quantity)
  ON CONFLICT (prospecteur_id, product_id)
  DO UPDATE SET quantity = public.crm_prospecteur_stocks.quantity + EXCLUDED.quantity;

  INSERT INTO public.crm_stock_movements (
    business_id, product_id, movement_type, quantity,
    from_prospecteur_id, to_prospecteur_id, reference, actor_user_id
  ) VALUES (
    p_business_id, p_product_id,
    CASE WHEN p_from_prospecteur_id IS NULL THEN 'reception' ELSE 'transfer' END,
    p_quantity, p_from_prospecteur_id, p_to_prospecteur_id, p_reference, auth.uid()
  ) RETURNING * INTO v_movement;

  RETURN v_movement;
END;
$$;

-- ============================================================
-- ÉTAPE 5 : documents, conversion prospect -> client, index
-- ============================================================

CREATE TABLE IF NOT EXISTS public.crm_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.business_profiles(id) ON DELETE CASCADE,
  client_id uuid REFERENCES public.business_clients(id) ON DELETE CASCADE,
  prospect_id uuid REFERENCES public.crm_prospects(id) ON DELETE CASCADE,
  document_type text,
  name text NOT NULL,
  file_url text NOT NULL,
  is_public boolean NOT NULL DEFAULT false,
  uploaded_by uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.crm_convert_prospect_to_client(p_prospect_id uuid)
RETURNS public.business_clients
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  v_prospect public.crm_prospects;
  v_client public.business_clients;
BEGIN
  SELECT * INTO v_prospect FROM public.crm_prospects WHERE id = p_prospect_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Prospect introuvable';
  END IF;

  IF NOT (public.user_has_business_access(v_prospect.business_id) OR public.is_super_admin()) THEN
    RAISE EXCEPTION 'Accès refusé';
  END IF;

  IF v_prospect.converted_client_id IS NOT NULL THEN
    SELECT * INTO v_client FROM public.business_clients WHERE id = v_prospect.converted_client_id;
    RETURN v_client;
  END IF;

  SELECT * INTO v_client FROM public.business_clients
  WHERE business_id = v_prospect.business_id
    AND (
      (v_prospect.phone IS NOT NULL AND phone = v_prospect.phone)
      OR (v_prospect.email IS NOT NULL AND email = v_prospect.email)
    )
  LIMIT 1;

  IF NOT FOUND THEN
    INSERT INTO public.business_clients (
      business_id, first_name, last_name, email, phone, address, city, country_id, notes
    ) VALUES (
      v_prospect.business_id, v_prospect.first_name, v_prospect.last_name,
      v_prospect.email, v_prospect.phone, v_prospect.address, v_prospect.city,
      v_prospect.country_id, 'Converti depuis JDV CRM (prospect)'
    ) RETURNING * INTO v_client;
  END IF;

  UPDATE public.crm_prospects
  SET prospect_status = 'converted',
      converted_client_id = v_client.id,
      converted_at = now()
  WHERE id = p_prospect_id;

  INSERT INTO public.audit_logs (user_id, module_code, action, entity_type, entity_id, new_data)
  VALUES (auth.uid(), 'crm', 'prospect.converted', 'crm_prospects', p_prospect_id::text,
          jsonb_build_object('client_id', v_client.id));

  RETURN v_client;
END;
$$;

CREATE INDEX IF NOT EXISTS idx_crm_prospects_business ON public.crm_prospects (business_id);
CREATE INDEX IF NOT EXISTS idx_crm_prospects_prospecteur ON public.crm_prospects (assigned_prospecteur_id);
CREATE INDEX IF NOT EXISTS idx_crm_prospects_status ON public.crm_prospects (prospect_status);
CREATE INDEX IF NOT EXISTS idx_crm_prospects_next_follow_up ON public.crm_prospects (next_follow_up_at);
CREATE INDEX IF NOT EXISTS idx_crm_prospects_phone ON public.crm_prospects (phone);
CREATE INDEX IF NOT EXISTS idx_crm_prospects_email ON public.crm_prospects (email);
CREATE INDEX IF NOT EXISTS idx_crm_prospect_activities_prospect ON public.crm_prospect_activities (prospect_id);
CREATE INDEX IF NOT EXISTS idx_crm_prospect_activities_client ON public.crm_prospect_activities (client_id);
CREATE INDEX IF NOT EXISTS idx_crm_prospect_activities_created_at ON public.crm_prospect_activities (created_at);
CREATE INDEX IF NOT EXISTS idx_crm_appointments_business ON public.crm_appointments (business_id);
CREATE INDEX IF NOT EXISTS idx_crm_appointments_scheduled_at ON public.crm_appointments (scheduled_at);
CREATE INDEX IF NOT EXISTS idx_crm_credit_terms_business ON public.crm_credit_terms (business_id);
CREATE INDEX IF NOT EXISTS idx_crm_credit_terms_client ON public.crm_credit_terms (client_id);
CREATE INDEX IF NOT EXISTS idx_crm_payment_schedules_business ON public.crm_payment_schedules (business_id);
CREATE INDEX IF NOT EXISTS idx_crm_payment_schedules_sale ON public.crm_payment_schedules (sale_id);
CREATE INDEX IF NOT EXISTS idx_crm_payment_schedules_client ON public.crm_payment_schedules (client_id);
CREATE INDEX IF NOT EXISTS idx_crm_payment_schedules_due_date ON public.crm_payment_schedules (due_date);
CREATE INDEX IF NOT EXISTS idx_crm_payment_schedules_status ON public.crm_payment_schedules (schedule_status);
CREATE INDEX IF NOT EXISTS idx_crm_payments_business ON public.crm_payments (business_id);
CREATE INDEX IF NOT EXISTS idx_crm_payments_client ON public.crm_payments (client_id);
CREATE INDEX IF NOT EXISTS idx_crm_payments_schedule ON public.crm_payments (schedule_id);
CREATE INDEX IF NOT EXISTS idx_crm_collection_activities_schedule ON public.crm_collection_activities (schedule_id);
CREATE INDEX IF NOT EXISTS idx_crm_commissions_business ON public.crm_commissions (business_id);
CREATE INDEX IF NOT EXISTS idx_crm_commissions_prospecteur ON public.crm_commissions (prospecteur_id);
CREATE INDEX IF NOT EXISTS idx_crm_commissions_status ON public.crm_commissions (commission_status);
CREATE INDEX IF NOT EXISTS idx_crm_targets_business ON public.crm_targets (business_id);
CREATE INDEX IF NOT EXISTS idx_crm_targets_prospecteur ON public.crm_targets (prospecteur_id);
CREATE INDEX IF NOT EXISTS idx_crm_prospecteur_stocks_business ON public.crm_prospecteur_stocks (business_id);
CREATE INDEX IF NOT EXISTS idx_crm_stock_movements_business ON public.crm_stock_movements (business_id);
CREATE INDEX IF NOT EXISTS idx_crm_stock_movements_product ON public.crm_stock_movements (product_id);
CREATE INDEX IF NOT EXISTS idx_crm_stock_movements_created_at ON public.crm_stock_movements (created_at);
CREATE INDEX IF NOT EXISTS idx_crm_documents_business ON public.crm_documents (business_id);
CREATE INDEX IF NOT EXISTS idx_crm_documents_client ON public.crm_documents (client_id);
CREATE INDEX IF NOT EXISTS idx_crm_prospecteurs_business ON public.crm_prospecteurs (business_id);
CREATE INDEX IF NOT EXISTS idx_crm_prospecteurs_user ON public.crm_prospecteurs (user_id);

-- ============================================================
-- ÉTAPE 6 : RLS complet
-- ============================================================

CREATE OR REPLACE FUNCTION public.crm_is_business_privileged(p_business_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.business_members bm
    WHERE bm.business_id = p_business_id
      AND bm.user_id = auth.uid()
      AND bm.is_active = true
      AND bm.role IN ('OWNER','ADMIN','MANAGER','ACCOUNTANT')
  ) OR public.is_super_admin();
$$;

CREATE OR REPLACE FUNCTION public.crm_prospect_is_mine(p_prospecteur_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.crm_prospecteurs p
    WHERE p.id = p_prospecteur_id AND p.user_id = auth.uid()
  );
$$;

ALTER TABLE public.crm_prospecteurs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_prospects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_prospect_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_credit_terms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_payment_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_collection_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_commission_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_prospecteur_stocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_documents ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
CREATE POLICY crm_prospecteurs_select ON public.crm_prospecteurs FOR SELECT
  USING (public.user_has_business_access(business_id));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
CREATE POLICY crm_prospecteurs_write ON public.crm_prospecteurs FOR INSERT
  WITH CHECK (public.crm_is_business_privileged(business_id));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
CREATE POLICY crm_prospecteurs_update ON public.crm_prospecteurs FOR UPDATE
  USING (public.crm_is_business_privileged(business_id));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
CREATE POLICY crm_prospecteurs_delete ON public.crm_prospecteurs FOR DELETE
  USING (public.crm_is_business_privileged(business_id));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
CREATE POLICY crm_prospects_select ON public.crm_prospects FOR SELECT
  USING (
    public.crm_is_business_privileged(business_id)
    OR public.crm_prospect_is_mine(assigned_prospecteur_id)
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
CREATE POLICY crm_prospects_insert ON public.crm_prospects FOR INSERT
  WITH CHECK (public.user_has_business_access(business_id));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
CREATE POLICY crm_prospects_update ON public.crm_prospects FOR UPDATE
  USING (
    public.crm_is_business_privileged(business_id)
    OR public.crm_prospect_is_mine(assigned_prospecteur_id)
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
CREATE POLICY crm_prospects_delete ON public.crm_prospects FOR DELETE
  USING (public.crm_is_business_privileged(business_id));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
CREATE POLICY crm_activities_select ON public.crm_prospect_activities FOR SELECT
  USING (public.user_has_business_access(business_id));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
CREATE POLICY crm_activities_insert ON public.crm_prospect_activities FOR INSERT
  WITH CHECK (public.user_has_business_access(business_id) AND actor_user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
CREATE POLICY crm_activities_update ON public.crm_prospect_activities FOR UPDATE
  USING (public.crm_is_business_privileged(business_id) OR actor_user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
CREATE POLICY crm_appointments_select ON public.crm_appointments FOR SELECT
  USING (public.user_has_business_access(business_id));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
CREATE POLICY crm_appointments_insert ON public.crm_appointments FOR INSERT
  WITH CHECK (public.user_has_business_access(business_id));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
CREATE POLICY crm_appointments_update ON public.crm_appointments FOR UPDATE
  USING (public.user_has_business_access(business_id));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
CREATE POLICY crm_appointments_delete ON public.crm_appointments FOR DELETE
  USING (public.crm_is_business_privileged(business_id));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
CREATE POLICY crm_credit_terms_select ON public.crm_credit_terms FOR SELECT
  USING (public.user_has_business_access(business_id));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
CREATE POLICY crm_credit_terms_write ON public.crm_credit_terms FOR INSERT
  WITH CHECK (public.crm_is_business_privileged(business_id));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
CREATE POLICY crm_credit_terms_update ON public.crm_credit_terms FOR UPDATE
  USING (public.crm_is_business_privileged(business_id));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
CREATE POLICY crm_schedules_select ON public.crm_payment_schedules FOR SELECT
  USING (public.user_has_business_access(business_id));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
CREATE POLICY crm_schedules_privileged_write ON public.crm_payment_schedules FOR INSERT
  WITH CHECK (public.crm_is_business_privileged(business_id));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
CREATE POLICY crm_payments_select ON public.crm_payments FOR SELECT
  USING (public.user_has_business_access(business_id));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
CREATE POLICY crm_payments_privileged_insert ON public.crm_payments FOR INSERT
  WITH CHECK (public.crm_is_business_privileged(business_id));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
CREATE POLICY crm_collection_select ON public.crm_collection_activities FOR SELECT
  USING (public.user_has_business_access(business_id));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
CREATE POLICY crm_collection_insert ON public.crm_collection_activities FOR INSERT
  WITH CHECK (public.user_has_business_access(business_id) AND actor_user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
CREATE POLICY crm_commission_rules_select ON public.crm_commission_rules FOR SELECT
  USING (public.user_has_business_access(business_id));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
CREATE POLICY crm_commission_rules_write ON public.crm_commission_rules FOR INSERT
  WITH CHECK (public.crm_is_business_privileged(business_id));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
CREATE POLICY crm_commission_rules_update ON public.crm_commission_rules FOR UPDATE
  USING (public.crm_is_business_privileged(business_id));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
CREATE POLICY crm_commissions_select ON public.crm_commissions FOR SELECT
  USING (
    public.crm_is_business_privileged(business_id)
    OR public.crm_prospect_is_mine(prospecteur_id)
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
CREATE POLICY crm_commissions_privileged_write ON public.crm_commissions FOR INSERT
  WITH CHECK (public.crm_is_business_privileged(business_id));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
CREATE POLICY crm_commissions_privileged_update ON public.crm_commissions FOR UPDATE
  USING (public.crm_is_business_privileged(business_id));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
CREATE POLICY crm_targets_select ON public.crm_targets FOR SELECT
  USING (
    public.crm_is_business_privileged(business_id)
    OR public.crm_prospect_is_mine(prospecteur_id)
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
CREATE POLICY crm_targets_write ON public.crm_targets FOR INSERT
  WITH CHECK (public.crm_is_business_privileged(business_id));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
CREATE POLICY crm_targets_update ON public.crm_targets FOR UPDATE
  USING (public.crm_is_business_privileged(business_id));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
CREATE POLICY crm_prospecteur_stocks_select ON public.crm_prospecteur_stocks FOR SELECT
  USING (public.user_has_business_access(business_id));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
CREATE POLICY crm_prospecteur_stocks_privileged_write ON public.crm_prospecteur_stocks FOR INSERT
  WITH CHECK (public.crm_is_business_privileged(business_id));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
CREATE POLICY crm_prospecteur_stocks_privileged_update ON public.crm_prospecteur_stocks FOR UPDATE
  USING (public.crm_is_business_privileged(business_id));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
CREATE POLICY crm_stock_movements_select ON public.crm_stock_movements FOR SELECT
  USING (public.user_has_business_access(business_id));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
CREATE POLICY crm_stock_movements_privileged_insert ON public.crm_stock_movements FOR INSERT
  WITH CHECK (public.crm_is_business_privileged(business_id));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
CREATE POLICY crm_documents_select ON public.crm_documents FOR SELECT
  USING (public.user_has_business_access(business_id));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
CREATE POLICY crm_documents_insert ON public.crm_documents FOR INSERT
  WITH CHECK (public.user_has_business_access(business_id) AND uploaded_by = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
CREATE POLICY crm_documents_delete ON public.crm_documents FOR DELETE
  USING (public.crm_is_business_privileged(business_id) OR uploaded_by = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
