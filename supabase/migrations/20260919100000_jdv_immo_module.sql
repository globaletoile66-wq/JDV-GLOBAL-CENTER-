-- ============================================================
-- JDV IMMO — reconstruction partielle des migrations appliquées en direct.
--
-- IMPORTANT : les tables `immo_properties`, `immo_property_types`,
-- `immo_agencies`, `immo_agents`, `immo_developers` existaient déjà dans
-- le projet Supabase AVANT ce travail (construites hors de cette session,
-- sans migration versionnée). Leur DDL exact n'est pas reconstitué ici
-- pour éviter d'introduire une définition divergente de la réalité.
-- => Faire un `supabase db pull` pour récupérer leur définition exacte
--    et la committer séparément.
--
-- Ce fichier couvre uniquement ce qui a été ajouté par-dessus :
-- projets/promoteurs, favoris, demandes (lien CRM), visites/offres/
-- réservations (JDV PAY), locations/échéances de loyer, commissions,
-- documents, signalements, et le RLS complet.
-- ============================================================

DO $$ BEGIN
  CREATE TYPE immo_transaction_type AS ENUM ('rent','sale','short_term_rental','reservation','lease_to_own');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE immo_property_status AS ENUM ('draft','pending_review','published','reserved','rented','sold','unavailable','suspended','archived');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE immo_verification_status AS ENUM ('unverified','submitted','under_review','verified','rejected','suspended');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE OR REPLACE FUNCTION public.immo_set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ============================================================
-- Projets promoteurs
-- ============================================================
DO $$ BEGIN
  CREATE TYPE immo_project_status AS ENUM ('planned','under_construction','completed','delivered','suspended');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE immo_unit_status AS ENUM ('available','reserved','sold','rented','unavailable');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE immo_request_status AS ENUM ('open','matched','converted','closed','cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.immo_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.business_profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  country_id uuid REFERENCES public.countries(id),
  city text,
  address text,
  latitude numeric,
  longitude numeric,
  project_status immo_project_status NOT NULL DEFAULT 'planned',
  launch_date date,
  estimated_delivery_date date,
  price_from numeric,
  currency_id uuid REFERENCES public.currencies(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_immo_projects_updated_at
  BEFORE UPDATE ON public.immo_projects
  FOR EACH ROW EXECUTE FUNCTION public.immo_set_updated_at();

CREATE TABLE IF NOT EXISTS public.immo_project_media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.immo_projects(id) ON DELETE CASCADE,
  url text NOT NULL,
  media_type text NOT NULL DEFAULT 'image',
  sort_order integer NOT NULL DEFAULT 0,
  is_primary boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.immo_units (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.immo_projects(id) ON DELETE CASCADE,
  property_id uuid REFERENCES public.immo_properties(id) ON DELETE SET NULL,
  unit_type_id uuid REFERENCES public.immo_property_types(id),
  reference text,
  surface numeric,
  bedrooms integer,
  bathrooms integer,
  price numeric,
  currency_id uuid REFERENCES public.currencies(id),
  unit_status immo_unit_status NOT NULL DEFAULT 'available',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_immo_units_updated_at
  BEFORE UPDATE ON public.immo_units
  FOR EACH ROW EXECUTE FUNCTION public.immo_set_updated_at();

CREATE TABLE IF NOT EXISTS public.immo_favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  property_id uuid REFERENCES public.immo_properties(id) ON DELETE CASCADE,
  project_id uuid REFERENCES public.immo_projects(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, property_id),
  UNIQUE (user_id, project_id),
  CHECK (property_id IS NOT NULL OR project_id IS NOT NULL)
);

CREATE TABLE IF NOT EXISTS public.immo_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  property_type_id uuid REFERENCES public.immo_property_types(id),
  transaction_type immo_transaction_type,
  country_id uuid REFERENCES public.countries(id),
  city text,
  budget_max numeric,
  currency_id uuid REFERENCES public.currencies(id),
  bedrooms integer,
  surface_min numeric,
  criteria jsonb NOT NULL DEFAULT '{}'::jsonb,
  request_status immo_request_status NOT NULL DEFAULT 'open',
  crm_prospect_id uuid REFERENCES public.crm_prospects(id) ON DELETE SET NULL,
  assigned_business_id uuid REFERENCES public.business_profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_immo_requests_updated_at
  BEFORE UPDATE ON public.immo_requests
  FOR EACH ROW EXECUTE FUNCTION public.immo_set_updated_at();

CREATE OR REPLACE FUNCTION public.immo_request_to_crm_prospect(
  p_request_id uuid,
  p_business_id uuid
) RETURNS public.crm_prospects
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  v_request public.immo_requests;
  v_prospect public.crm_prospects;
  v_profile public.profiles;
BEGIN
  SELECT * INTO v_request FROM public.immo_requests WHERE id = p_request_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Demande introuvable';
  END IF;

  IF NOT (public.user_has_business_access(p_business_id) OR public.is_super_admin()) THEN
    RAISE EXCEPTION 'Accès refusé';
  END IF;

  IF v_request.crm_prospect_id IS NOT NULL THEN
    SELECT * INTO v_prospect FROM public.crm_prospects WHERE id = v_request.crm_prospect_id;
    RETURN v_prospect;
  END IF;

  SELECT * INTO v_profile FROM public.profiles WHERE id = v_request.requester_user_id;

  INSERT INTO public.crm_prospects (
    business_id, first_name, last_name, phone, email, country_id,
    desired_product, requested_amount, prospect_status, created_by
  ) VALUES (
    p_business_id,
    COALESCE(v_profile.first_name, 'Prospect'), v_profile.last_name,
    v_profile.phone, v_profile.email, v_request.country_id,
    'Bien immobilier (' || COALESCE(v_request.transaction_type::text,'n/a') || ')',
    v_request.budget_max, 'new', auth.uid()
  ) RETURNING * INTO v_prospect;

  UPDATE public.immo_requests
  SET crm_prospect_id = v_prospect.id, assigned_business_id = p_business_id, request_status = 'matched'
  WHERE id = p_request_id;

  RETURN v_prospect;
END;
$$;

CREATE INDEX IF NOT EXISTS idx_immo_projects_business ON public.immo_projects (business_id);
CREATE INDEX IF NOT EXISTS idx_immo_units_project ON public.immo_units (project_id);
CREATE INDEX IF NOT EXISTS idx_immo_units_status ON public.immo_units (unit_status);
CREATE INDEX IF NOT EXISTS idx_immo_favorites_user ON public.immo_favorites (user_id);
CREATE INDEX IF NOT EXISTS idx_immo_requests_requester ON public.immo_requests (requester_user_id);
CREATE INDEX IF NOT EXISTS idx_immo_requests_status ON public.immo_requests (request_status);

-- ============================================================
-- Visites, offres, réservations (JDV PAY)
-- ============================================================
DO $$ BEGIN
  CREATE TYPE immo_appointment_status AS ENUM ('requested','confirmed','completed','cancelled','missed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE immo_offer_status AS ENUM ('submitted','under_review','accepted','rejected','withdrawn','expired');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE immo_reservation_status AS ENUM ('pending','confirmed','expired','cancelled','refunded');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.immo_appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES public.immo_properties(id) ON DELETE CASCADE,
  requester_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  agent_id uuid REFERENCES public.immo_agents(id) ON DELETE SET NULL,
  scheduled_at timestamptz NOT NULL,
  location text,
  appointment_status immo_appointment_status NOT NULL DEFAULT 'requested',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_immo_appointments_updated_at
  BEFORE UPDATE ON public.immo_appointments
  FOR EACH ROW EXECUTE FUNCTION public.immo_set_updated_at();

CREATE TABLE IF NOT EXISTS public.immo_offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES public.immo_properties(id) ON DELETE CASCADE,
  buyer_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  agent_id uuid REFERENCES public.immo_agents(id) ON DELETE SET NULL,
  amount numeric NOT NULL CHECK (amount > 0),
  currency_id uuid REFERENCES public.currencies(id),
  conditions text,
  offer_status immo_offer_status NOT NULL DEFAULT 'submitted',
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_immo_offers_updated_at
  BEFORE UPDATE ON public.immo_offers
  FOR EACH ROW EXECUTE FUNCTION public.immo_set_updated_at();

CREATE TABLE IF NOT EXISTS public.immo_reservations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES public.immo_properties(id) ON DELETE CASCADE,
  client_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount numeric NOT NULL CHECK (amount > 0),
  currency_id uuid REFERENCES public.currencies(id),
  reservation_status immo_reservation_status NOT NULL DEFAULT 'pending',
  wallet_transaction_id uuid REFERENCES public.wallet_transactions(id),
  idempotency_key text UNIQUE,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_immo_reservations_updated_at
  BEFORE UPDATE ON public.immo_reservations
  FOR EACH ROW EXECUTE FUNCTION public.immo_set_updated_at();

CREATE UNIQUE INDEX IF NOT EXISTS uq_immo_property_active_reservation
  ON public.immo_reservations (property_id)
  WHERE reservation_status IN ('pending','confirmed');

CREATE OR REPLACE FUNCTION public.immo_confirm_reservation(
  p_reservation_id uuid,
  p_wallet_transaction_id uuid
) RETURNS public.immo_reservations
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  v_reservation public.immo_reservations;
  v_tx public.wallet_transactions;
BEGIN
  SELECT * INTO v_reservation FROM public.immo_reservations WHERE id = p_reservation_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Réservation introuvable';
  END IF;

  IF v_reservation.reservation_status = 'confirmed' THEN
    RETURN v_reservation;
  END IF;

  SELECT * INTO v_tx FROM public.wallet_transactions WHERE id = p_wallet_transaction_id;
  IF NOT FOUND OR v_tx.transaction_status <> 'completed' THEN
    RAISE EXCEPTION 'Paiement JDV PAY non confirmé';
  END IF;

  UPDATE public.immo_reservations
  SET reservation_status = 'confirmed', wallet_transaction_id = p_wallet_transaction_id
  WHERE id = p_reservation_id
  RETURNING * INTO v_reservation;

  UPDATE public.immo_properties SET property_status = 'reserved' WHERE id = v_reservation.property_id;

  INSERT INTO public.audit_logs (user_id, module_code, action, entity_type, entity_id, new_data)
  VALUES (auth.uid(), 'immo', 'reservation.confirmed', 'immo_reservations', p_reservation_id::text, to_jsonb(v_reservation));

  RETURN v_reservation;
END;
$$;

CREATE INDEX IF NOT EXISTS idx_immo_appointments_property ON public.immo_appointments (property_id);
CREATE INDEX IF NOT EXISTS idx_immo_offers_property ON public.immo_offers (property_id);
CREATE INDEX IF NOT EXISTS idx_immo_reservations_property ON public.immo_reservations (property_id);
CREATE INDEX IF NOT EXISTS idx_immo_reservations_client ON public.immo_reservations (client_user_id);

-- ============================================================
-- Locations, échéances de loyer, commissions, documents, signalements
-- ============================================================
DO $$ BEGIN
  CREATE TYPE immo_lease_status AS ENUM ('draft','active','expired','terminated');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE immo_rent_schedule_status AS ENUM ('pending','partially_paid','paid','overdue');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE immo_commission_status AS ENUM ('pending','approved','paid','cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE immo_report_status AS ENUM ('pending','approved','rejected','suspended');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.immo_leases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES public.immo_properties(id) ON DELETE CASCADE,
  tenant_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  landlord_user_id uuid REFERENCES auth.users(id),
  landlord_business_id uuid REFERENCES public.business_profiles(id),
  start_date date NOT NULL,
  end_date date,
  rent_amount numeric NOT NULL CHECK (rent_amount > 0),
  currency_id uuid REFERENCES public.currencies(id),
  frequency text NOT NULL DEFAULT 'monthly',
  deposit_amount numeric DEFAULT 0,
  lease_status immo_lease_status NOT NULL DEFAULT 'draft',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (landlord_user_id IS NOT NULL OR landlord_business_id IS NOT NULL)
);

CREATE TRIGGER trg_immo_leases_updated_at
  BEFORE UPDATE ON public.immo_leases
  FOR EACH ROW EXECUTE FUNCTION public.immo_set_updated_at();

CREATE TABLE IF NOT EXISTS public.immo_rent_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lease_id uuid NOT NULL REFERENCES public.immo_leases(id) ON DELETE CASCADE,
  due_date date NOT NULL,
  amount_due numeric NOT NULL CHECK (amount_due >= 0),
  amount_paid numeric NOT NULL DEFAULT 0 CHECK (amount_paid >= 0),
  remaining_amount numeric GENERATED ALWAYS AS (GREATEST(amount_due - amount_paid,0)) STORED,
  rent_status immo_rent_schedule_status NOT NULL DEFAULT 'pending',
  wallet_transaction_id uuid REFERENCES public.wallet_transactions(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_immo_rent_schedules_updated_at
  BEFORE UPDATE ON public.immo_rent_schedules
  FOR EACH ROW EXECUTE FUNCTION public.immo_set_updated_at();

CREATE OR REPLACE FUNCTION public.immo_record_rent_payment(
  p_schedule_id uuid,
  p_wallet_transaction_id uuid
) RETURNS public.immo_rent_schedules
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  v_schedule public.immo_rent_schedules;
  v_tx public.wallet_transactions;
BEGIN
  SELECT * INTO v_schedule FROM public.immo_rent_schedules WHERE id = p_schedule_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Échéance introuvable'; END IF;

  IF v_schedule.wallet_transaction_id = p_wallet_transaction_id THEN
    RETURN v_schedule;
  END IF;

  SELECT * INTO v_tx FROM public.wallet_transactions WHERE id = p_wallet_transaction_id;
  IF NOT FOUND OR v_tx.transaction_status <> 'completed' THEN
    RAISE EXCEPTION 'Paiement JDV PAY non confirmé';
  END IF;

  UPDATE public.immo_rent_schedules
  SET amount_paid = amount_paid + v_tx.amount,
      wallet_transaction_id = p_wallet_transaction_id,
      rent_status = CASE WHEN amount_paid + v_tx.amount >= amount_due THEN 'paid' ELSE 'partially_paid' END
  WHERE id = p_schedule_id
  RETURNING * INTO v_schedule;

  RETURN v_schedule;
END;
$$;

CREATE TABLE IF NOT EXISTS public.immo_commissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.business_profiles(id) ON DELETE CASCADE,
  agent_id uuid REFERENCES public.immo_agents(id) ON DELETE SET NULL,
  property_id uuid REFERENCES public.immo_properties(id) ON DELETE SET NULL,
  reservation_id uuid REFERENCES public.immo_reservations(id) ON DELETE SET NULL,
  lease_id uuid REFERENCES public.immo_leases(id) ON DELETE SET NULL,
  amount numeric NOT NULL CHECK (amount >= 0),
  currency_id uuid REFERENCES public.currencies(id),
  commission_status immo_commission_status NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.immo_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid REFERENCES public.immo_properties(id) ON DELETE CASCADE,
  lease_id uuid REFERENCES public.immo_leases(id) ON DELETE CASCADE,
  document_type text,
  name text NOT NULL,
  file_url text NOT NULL,
  is_public boolean NOT NULL DEFAULT false,
  uploaded_by uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (property_id IS NOT NULL OR lease_id IS NOT NULL)
);

CREATE TABLE IF NOT EXISTS public.immo_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  property_id uuid REFERENCES public.immo_properties(id) ON DELETE CASCADE,
  agency_business_id uuid REFERENCES public.business_profiles(id),
  reason text NOT NULL,
  description text,
  report_status immo_report_status NOT NULL DEFAULT 'pending',
  resolved_by uuid REFERENCES auth.users(id),
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_immo_leases_property ON public.immo_leases (property_id);
CREATE INDEX IF NOT EXISTS idx_immo_leases_tenant ON public.immo_leases (tenant_user_id);
CREATE INDEX IF NOT EXISTS idx_immo_rent_schedules_lease ON public.immo_rent_schedules (lease_id);
CREATE INDEX IF NOT EXISTS idx_immo_rent_schedules_due_date ON public.immo_rent_schedules (due_date);
CREATE INDEX IF NOT EXISTS idx_immo_commissions_business ON public.immo_commissions (business_id);
CREATE INDEX IF NOT EXISTS idx_immo_documents_property ON public.immo_documents (property_id);
CREATE INDEX IF NOT EXISTS idx_immo_reports_property ON public.immo_reports (property_id);

-- ============================================================
-- RLS (sur l'ensemble du module, y compris les tables préexistantes)
-- ============================================================
ALTER TABLE public.immo_property_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.immo_agencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.immo_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.immo_developers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.immo_properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.immo_property_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.immo_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.immo_project_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.immo_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.immo_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.immo_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.immo_appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.immo_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.immo_reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.immo_leases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.immo_rent_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.immo_commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.immo_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.immo_reports ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
CREATE POLICY immo_property_types_select ON public.immo_property_types FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
CREATE POLICY immo_agencies_select ON public.immo_agencies FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
CREATE POLICY immo_agencies_write ON public.immo_agencies FOR INSERT WITH CHECK (public.user_has_business_access(business_id));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
CREATE POLICY immo_agencies_update ON public.immo_agencies FOR UPDATE USING (public.user_has_business_access(business_id));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
CREATE POLICY immo_agents_select ON public.immo_agents FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
CREATE POLICY immo_agents_write ON public.immo_agents FOR INSERT WITH CHECK (public.user_has_business_access(business_id));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
CREATE POLICY immo_agents_update ON public.immo_agents FOR UPDATE USING (public.user_has_business_access(business_id));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
CREATE POLICY immo_developers_select ON public.immo_developers FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
CREATE POLICY immo_developers_write ON public.immo_developers FOR INSERT WITH CHECK (public.user_has_business_access(business_id));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
CREATE POLICY immo_developers_update ON public.immo_developers FOR UPDATE USING (public.user_has_business_access(business_id));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
CREATE POLICY immo_properties_select_public ON public.immo_properties FOR SELECT
  USING (
    property_status = 'published'
    OR owner_user_id = auth.uid()
    OR (business_id IS NOT NULL AND public.user_has_business_access(business_id))
    OR public.is_super_admin()
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
CREATE POLICY immo_properties_insert ON public.immo_properties FOR INSERT
  WITH CHECK (
    owner_user_id = auth.uid()
    OR (business_id IS NOT NULL AND public.user_has_business_access(business_id))
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
CREATE POLICY immo_properties_update ON public.immo_properties FOR UPDATE
  USING (
    owner_user_id = auth.uid()
    OR (business_id IS NOT NULL AND public.user_has_business_access(business_id))
    OR public.is_super_admin()
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
CREATE POLICY immo_properties_delete ON public.immo_properties FOR DELETE
  USING (
    owner_user_id = auth.uid()
    OR (business_id IS NOT NULL AND public.user_has_business_access(business_id))
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
CREATE POLICY immo_property_media_select ON public.immo_property_media FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.immo_properties p WHERE p.id = property_id
        AND (p.property_status = 'published' OR p.owner_user_id = auth.uid()
             OR (p.business_id IS NOT NULL AND public.user_has_business_access(p.business_id))
             OR public.is_super_admin())
    )
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
CREATE POLICY immo_property_media_write ON public.immo_property_media FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.immo_properties p WHERE p.id = property_id
        AND (p.owner_user_id = auth.uid() OR (p.business_id IS NOT NULL AND public.user_has_business_access(p.business_id)))
    )
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
CREATE POLICY immo_property_media_delete ON public.immo_property_media FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.immo_properties p WHERE p.id = property_id
        AND (p.owner_user_id = auth.uid() OR (p.business_id IS NOT NULL AND public.user_has_business_access(p.business_id)))
    )
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
CREATE POLICY immo_projects_select ON public.immo_projects FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
CREATE POLICY immo_projects_write ON public.immo_projects FOR INSERT WITH CHECK (public.user_has_business_access(business_id));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
CREATE POLICY immo_projects_update ON public.immo_projects FOR UPDATE USING (public.user_has_business_access(business_id));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
CREATE POLICY immo_project_media_select ON public.immo_project_media FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
CREATE POLICY immo_project_media_write ON public.immo_project_media FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.immo_projects pr WHERE pr.id = project_id AND public.user_has_business_access(pr.business_id)));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
CREATE POLICY immo_units_select ON public.immo_units FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
CREATE POLICY immo_units_write ON public.immo_units FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.immo_projects pr WHERE pr.id = project_id AND public.user_has_business_access(pr.business_id)));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
CREATE POLICY immo_units_update ON public.immo_units FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.immo_projects pr WHERE pr.id = project_id AND public.user_has_business_access(pr.business_id)));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
CREATE POLICY immo_favorites_select ON public.immo_favorites FOR SELECT USING (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
CREATE POLICY immo_favorites_insert ON public.immo_favorites FOR INSERT WITH CHECK (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
CREATE POLICY immo_favorites_delete ON public.immo_favorites FOR DELETE USING (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
CREATE POLICY immo_requests_select ON public.immo_requests FOR SELECT
  USING (
    requester_user_id = auth.uid()
    OR (assigned_business_id IS NOT NULL AND public.user_has_business_access(assigned_business_id))
    OR public.is_super_admin()
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
CREATE POLICY immo_requests_insert ON public.immo_requests FOR INSERT WITH CHECK (requester_user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
CREATE POLICY immo_requests_update ON public.immo_requests FOR UPDATE
  USING (
    requester_user_id = auth.uid()
    OR (assigned_business_id IS NOT NULL AND public.user_has_business_access(assigned_business_id))
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
CREATE POLICY immo_appointments_select ON public.immo_appointments FOR SELECT
  USING (
    requester_user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.immo_properties p WHERE p.id = property_id AND
      (p.owner_user_id = auth.uid() OR (p.business_id IS NOT NULL AND public.user_has_business_access(p.business_id))))
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
CREATE POLICY immo_appointments_insert ON public.immo_appointments FOR INSERT WITH CHECK (requester_user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
CREATE POLICY immo_appointments_update ON public.immo_appointments FOR UPDATE
  USING (
    requester_user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.immo_properties p WHERE p.id = property_id AND
      (p.owner_user_id = auth.uid() OR (p.business_id IS NOT NULL AND public.user_has_business_access(p.business_id))))
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
CREATE POLICY immo_offers_select ON public.immo_offers FOR SELECT
  USING (
    buyer_user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.immo_properties p WHERE p.id = property_id AND
      (p.owner_user_id = auth.uid() OR (p.business_id IS NOT NULL AND public.user_has_business_access(p.business_id))))
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
CREATE POLICY immo_offers_insert ON public.immo_offers FOR INSERT WITH CHECK (buyer_user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
CREATE POLICY immo_offers_update ON public.immo_offers FOR UPDATE
  USING (
    buyer_user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.immo_properties p WHERE p.id = property_id AND
      (p.owner_user_id = auth.uid() OR (p.business_id IS NOT NULL AND public.user_has_business_access(p.business_id))))
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
CREATE POLICY immo_reservations_select ON public.immo_reservations FOR SELECT
  USING (
    client_user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.immo_properties p WHERE p.id = property_id AND
      (p.owner_user_id = auth.uid() OR (p.business_id IS NOT NULL AND public.user_has_business_access(p.business_id))))
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
CREATE POLICY immo_reservations_insert ON public.immo_reservations FOR INSERT WITH CHECK (client_user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
CREATE POLICY immo_leases_select ON public.immo_leases FOR SELECT
  USING (
    tenant_user_id = auth.uid()
    OR landlord_user_id = auth.uid()
    OR (landlord_business_id IS NOT NULL AND public.user_has_business_access(landlord_business_id))
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
CREATE POLICY immo_leases_write ON public.immo_leases FOR INSERT
  WITH CHECK (
    landlord_user_id = auth.uid()
    OR (landlord_business_id IS NOT NULL AND public.user_has_business_access(landlord_business_id))
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
CREATE POLICY immo_leases_update ON public.immo_leases FOR UPDATE
  USING (
    landlord_user_id = auth.uid()
    OR (landlord_business_id IS NOT NULL AND public.user_has_business_access(landlord_business_id))
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
CREATE POLICY immo_rent_schedules_select ON public.immo_rent_schedules FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.immo_leases l WHERE l.id = lease_id AND
      (l.tenant_user_id = auth.uid() OR l.landlord_user_id = auth.uid()
       OR (l.landlord_business_id IS NOT NULL AND public.user_has_business_access(l.landlord_business_id))))
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
CREATE POLICY immo_rent_schedules_write ON public.immo_rent_schedules FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.immo_leases l WHERE l.id = lease_id AND
      (l.landlord_user_id = auth.uid() OR (l.landlord_business_id IS NOT NULL AND public.user_has_business_access(l.landlord_business_id))))
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
CREATE POLICY immo_commissions_select ON public.immo_commissions FOR SELECT
  USING (
    public.user_has_business_access(business_id)
    OR EXISTS (SELECT 1 FROM public.immo_agents a WHERE a.id = agent_id AND a.user_id = auth.uid())
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
CREATE POLICY immo_commissions_write ON public.immo_commissions FOR INSERT
  WITH CHECK (public.user_has_business_access(business_id));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
CREATE POLICY immo_documents_select ON public.immo_documents FOR SELECT
  USING (
    is_public = true
    OR uploaded_by = auth.uid()
    OR (property_id IS NOT NULL AND EXISTS (SELECT 1 FROM public.immo_properties p WHERE p.id = property_id AND
        (p.owner_user_id = auth.uid() OR (p.business_id IS NOT NULL AND public.user_has_business_access(p.business_id)))))
    OR (lease_id IS NOT NULL AND EXISTS (SELECT 1 FROM public.immo_leases l WHERE l.id = lease_id AND
        (l.tenant_user_id = auth.uid() OR l.landlord_user_id = auth.uid()
         OR (l.landlord_business_id IS NOT NULL AND public.user_has_business_access(l.landlord_business_id)))))
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
CREATE POLICY immo_documents_insert ON public.immo_documents FOR INSERT WITH CHECK (uploaded_by = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
CREATE POLICY immo_reports_select ON public.immo_reports FOR SELECT
  USING (
    reporter_user_id = auth.uid()
    OR public.is_super_admin()
    OR (agency_business_id IS NOT NULL AND public.user_has_business_access(agency_business_id))
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
CREATE POLICY immo_reports_insert ON public.immo_reports FOR INSERT WITH CHECK (reporter_user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
