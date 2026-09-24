-- ============================================================
-- JDV HEALTH — TRAVAIL EN COURS (partiel)
-- Fait : établissements, spécialités, professionnels, services,
-- disponibilités, rendez-vous (+ paiement JDV PAY), consentement,
-- dossiers médicaux (+ contrôle d'accès).
-- MANQUANT : documents/prescriptions, laboratoire/diagnostic,
-- soins à domicile, urgences (référentiel), factures, avis,
-- vérification, et le RLS complet sur toutes ces tables.
-- Ne pas activer ce module dans le Hub (voir modules.module_status)
-- tant que ce travail n'est pas terminé.
-- ============================================================

-- ============================================================
-- ÉTAPE 1 : établissements, spécialités, professionnels, services
-- ============================================================

DO $$ BEGIN
  CREATE TYPE health_verification_status AS ENUM ('pending','under_review','verified','rejected','suspended');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE health_provider_type AS ENUM ('clinic','hospital','pharmacy','laboratory','diagnostic_center','home_care_provider','other');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE OR REPLACE FUNCTION public.health_set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TABLE IF NOT EXISTS public.health_provider_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL UNIQUE REFERENCES public.business_profiles(id) ON DELETE CASCADE,
  provider_type health_provider_type NOT NULL,
  description text,
  address text,
  country_id uuid REFERENCES public.countries(id),
  city text,
  latitude numeric,
  longitude numeric,
  languages text[] DEFAULT '{}',
  verification_status health_verification_status NOT NULL DEFAULT 'pending',
  is_public boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_health_provider_profiles_updated_at
  BEFORE UPDATE ON public.health_provider_profiles
  FOR EACH ROW EXECUTE FUNCTION public.health_set_updated_at();

CREATE TABLE IF NOT EXISTS public.health_specialties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  parent_id uuid REFERENCES public.health_specialties(id),
  is_active boolean NOT NULL DEFAULT true
);

INSERT INTO public.health_specialties (code, name) VALUES
  ('general_medicine','Médecine générale'),
  ('pediatrics','Pédiatrie'),
  ('cardiology','Cardiologie'),
  ('dermatology','Dermatologie'),
  ('ophthalmology','Ophtalmologie'),
  ('dentistry','Dentisterie'),
  ('gynecology','Gynécologie / Maternité'),
  ('surgery','Chirurgie'),
  ('mental_health','Santé mentale'),
  ('nursing','Soins infirmiers'),
  ('laboratory','Analyses de laboratoire'),
  ('imaging','Imagerie / Diagnostic'),
  ('pharmacy','Pharmacie'),
  ('rehabilitation','Rééducation'),
  ('other','Autre spécialité')
ON CONFLICT (code) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.health_professionals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  business_id uuid REFERENCES public.business_profiles(id) ON DELETE SET NULL,
  specialty_id uuid REFERENCES public.health_specialties(id),
  sub_specialty text,
  country_id uuid REFERENCES public.countries(id),
  languages text[] DEFAULT '{}',
  experience_years integer,
  bio text,
  verification_status health_verification_status NOT NULL DEFAULT 'pending',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_health_professionals_updated_at
  BEFORE UPDATE ON public.health_professionals
  FOR EACH ROW EXECUTE FUNCTION public.health_set_updated_at();

CREATE TABLE IF NOT EXISTS public.health_services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid REFERENCES public.business_profiles(id) ON DELETE CASCADE,
  professional_id uuid REFERENCES public.health_professionals(id) ON DELETE CASCADE,
  specialty_id uuid REFERENCES public.health_specialties(id),
  service_type text NOT NULL DEFAULT 'consultation',
  name text NOT NULL,
  description text,
  price numeric,
  currency_id uuid REFERENCES public.currencies(id),
  duration_minutes integer,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (business_id IS NOT NULL OR professional_id IS NOT NULL)
);

CREATE TRIGGER trg_health_services_updated_at
  BEFORE UPDATE ON public.health_services
  FOR EACH ROW EXECUTE FUNCTION public.health_set_updated_at();

CREATE INDEX IF NOT EXISTS idx_health_provider_profiles_business ON public.health_provider_profiles (business_id);
CREATE INDEX IF NOT EXISTS idx_health_provider_profiles_country ON public.health_provider_profiles (country_id);
CREATE INDEX IF NOT EXISTS idx_health_professionals_business ON public.health_professionals (business_id);
CREATE INDEX IF NOT EXISTS idx_health_professionals_specialty ON public.health_professionals (specialty_id);
CREATE INDEX IF NOT EXISTS idx_health_services_business ON public.health_services (business_id);
CREATE INDEX IF NOT EXISTS idx_health_services_professional ON public.health_services (professional_id);

-- ============================================================
-- ÉTAPE 2 : disponibilités + rendez-vous
-- ============================================================

DO $$ BEGIN
  CREATE TYPE health_appointment_status AS ENUM ('requested','pending','confirmed','cancelled','completed','no_show','rescheduled','rejected');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.health_availabilities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id uuid NOT NULL REFERENCES public.health_professionals(id) ON DELETE CASCADE,
  day_of_week integer CHECK (day_of_week BETWEEN 0 AND 6),
  specific_date date,
  start_time time NOT NULL,
  end_time time NOT NULL,
  slot_duration_minutes integer NOT NULL DEFAULT 30,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (end_time > start_time),
  CHECK (day_of_week IS NOT NULL OR specific_date IS NOT NULL)
);

CREATE TABLE IF NOT EXISTS public.health_appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  professional_id uuid NOT NULL REFERENCES public.health_professionals(id) ON DELETE CASCADE,
  business_id uuid REFERENCES public.business_profiles(id),
  service_id uuid REFERENCES public.health_services(id),
  scheduled_at timestamptz NOT NULL,
  duration_minutes integer NOT NULL DEFAULT 30,
  appointment_status health_appointment_status NOT NULL DEFAULT 'requested',
  price numeric,
  currency_id uuid REFERENCES public.currencies(id),
  wallet_transaction_id uuid REFERENCES public.wallet_transactions(id),
  idempotency_key text UNIQUE,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_health_appointments_updated_at
  BEFORE UPDATE ON public.health_appointments
  FOR EACH ROW EXECUTE FUNCTION public.health_set_updated_at();

CREATE UNIQUE INDEX IF NOT EXISTS uq_health_appointment_slot
  ON public.health_appointments (professional_id, scheduled_at)
  WHERE appointment_status IN ('requested','pending','confirmed');

CREATE OR REPLACE FUNCTION public.health_book_appointment(
  p_professional_id uuid,
  p_business_id uuid,
  p_service_id uuid,
  p_scheduled_at timestamptz,
  p_duration_minutes integer,
  p_price numeric,
  p_currency_id uuid,
  p_idempotency_key text DEFAULT NULL
) RETURNS public.health_appointments
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  v_appointment public.health_appointments;
BEGIN
  IF p_idempotency_key IS NOT NULL THEN
    SELECT * INTO v_appointment FROM public.health_appointments WHERE idempotency_key = p_idempotency_key;
    IF FOUND THEN RETURN v_appointment; END IF;
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.health_appointments
    WHERE professional_id = p_professional_id
      AND scheduled_at = p_scheduled_at
      AND appointment_status IN ('requested','pending','confirmed')
  ) THEN
    RAISE EXCEPTION 'Ce créneau n''est plus disponible';
  END IF;

  INSERT INTO public.health_appointments (
    patient_user_id, professional_id, business_id, service_id,
    scheduled_at, duration_minutes, price, currency_id, idempotency_key
  ) VALUES (
    auth.uid(), p_professional_id, p_business_id, p_service_id,
    p_scheduled_at, COALESCE(p_duration_minutes,30), p_price, p_currency_id, p_idempotency_key
  ) RETURNING * INTO v_appointment;

  RETURN v_appointment;
END;
$$;

CREATE OR REPLACE FUNCTION public.health_confirm_appointment_payment(
  p_appointment_id uuid,
  p_wallet_transaction_id uuid
) RETURNS public.health_appointments
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  v_appt public.health_appointments;
  v_tx public.wallet_transactions;
BEGIN
  SELECT * INTO v_appt FROM public.health_appointments WHERE id = p_appointment_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Rendez-vous introuvable'; END IF;

  IF v_appt.wallet_transaction_id = p_wallet_transaction_id THEN
    RETURN v_appt;
  END IF;

  SELECT * INTO v_tx FROM public.wallet_transactions WHERE id = p_wallet_transaction_id;
  IF NOT FOUND OR v_tx.transaction_status <> 'completed' THEN
    RAISE EXCEPTION 'Paiement JDV PAY non confirmé';
  END IF;

  UPDATE public.health_appointments
  SET wallet_transaction_id = p_wallet_transaction_id, appointment_status = 'confirmed'
  WHERE id = p_appointment_id
  RETURNING * INTO v_appt;

  RETURN v_appt;
END;
$$;

CREATE INDEX IF NOT EXISTS idx_health_availabilities_professional ON public.health_availabilities (professional_id);
CREATE INDEX IF NOT EXISTS idx_health_appointments_patient ON public.health_appointments (patient_user_id);
CREATE INDEX IF NOT EXISTS idx_health_appointments_professional ON public.health_appointments (professional_id);
CREATE INDEX IF NOT EXISTS idx_health_appointments_scheduled_at ON public.health_appointments (scheduled_at);

-- ============================================================
-- ÉTAPE 3 : consentement + dossiers médicaux
-- Séparation stricte administratif / clinique. Le Super Admin n'a
-- PAS accès au contenu clinique par défaut.
-- ============================================================

DO $$ BEGIN
  CREATE TYPE health_consent_scope AS ENUM ('medical_records','lab_results','prescriptions','full');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE health_consent_status AS ENUM ('active','revoked','expired');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.health_patient_consents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  grantee_professional_id uuid REFERENCES public.health_professionals(id) ON DELETE CASCADE,
  grantee_business_id uuid REFERENCES public.business_profiles(id) ON DELETE CASCADE,
  scope health_consent_scope NOT NULL DEFAULT 'medical_records',
  consent_status health_consent_status NOT NULL DEFAULT 'active',
  granted_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (grantee_professional_id IS NOT NULL OR grantee_business_id IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_health_consents_patient ON public.health_patient_consents (patient_user_id);
CREATE INDEX IF NOT EXISTS idx_health_consents_professional ON public.health_patient_consents (grantee_professional_id);
CREATE INDEX IF NOT EXISTS idx_health_consents_business ON public.health_patient_consents (grantee_business_id);

CREATE OR REPLACE FUNCTION public.health_grant_consent(
  p_grantee_professional_id uuid,
  p_grantee_business_id uuid,
  p_scope text,
  p_expires_at timestamptz DEFAULT NULL
) RETURNS public.health_patient_consents
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  v_consent public.health_patient_consents;
BEGIN
  SELECT * INTO v_consent FROM public.health_patient_consents
  WHERE patient_user_id = auth.uid()
    AND grantee_professional_id IS NOT DISTINCT FROM p_grantee_professional_id
    AND grantee_business_id IS NOT DISTINCT FROM p_grantee_business_id
    AND scope = p_scope::health_consent_scope
    AND consent_status = 'active';
  IF FOUND THEN RETURN v_consent; END IF;

  INSERT INTO public.health_patient_consents (
    patient_user_id, grantee_professional_id, grantee_business_id, scope, expires_at
  ) VALUES (
    auth.uid(), p_grantee_professional_id, p_grantee_business_id, p_scope::health_consent_scope, p_expires_at
  ) RETURNING * INTO v_consent;

  INSERT INTO public.audit_logs (user_id, module_code, action, entity_type, entity_id, new_data)
  VALUES (auth.uid(), 'health', 'consent.granted', 'health_patient_consents', v_consent.id::text,
    jsonb_build_object('scope', p_scope));

  RETURN v_consent;
END;
$$;

CREATE OR REPLACE FUNCTION public.health_revoke_consent(p_consent_id uuid)
RETURNS public.health_patient_consents
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  v_consent public.health_patient_consents;
BEGIN
  SELECT * INTO v_consent FROM public.health_patient_consents WHERE id = p_consent_id AND patient_user_id = auth.uid() FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Consentement introuvable'; END IF;

  UPDATE public.health_patient_consents
  SET consent_status = 'revoked', revoked_at = now()
  WHERE id = p_consent_id
  RETURNING * INTO v_consent;

  INSERT INTO public.audit_logs (user_id, module_code, action, entity_type, entity_id, new_data)
  VALUES (auth.uid(), 'health', 'consent.revoked', 'health_patient_consents', p_consent_id::text, '{}'::jsonb);

  RETURN v_consent;
END;
$$;

CREATE TABLE IF NOT EXISTS public.health_medical_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  author_professional_id uuid NOT NULL REFERENCES public.health_professionals(id),
  business_id uuid REFERENCES public.business_profiles(id),
  appointment_id uuid REFERENCES public.health_appointments(id),
  record_type text NOT NULL DEFAULT 'consultation_note',
  title text NOT NULL,
  content text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.health_can_access_medical_record(p_record_id uuid)
RETURNS boolean LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  v_record public.health_medical_records;
BEGIN
  SELECT * INTO v_record FROM public.health_medical_records WHERE id = p_record_id;
  IF NOT FOUND THEN RETURN false; END IF;

  IF v_record.patient_user_id = auth.uid() THEN RETURN true; END IF;

  IF EXISTS (SELECT 1 FROM public.health_professionals p WHERE p.id = v_record.author_professional_id AND p.user_id = auth.uid()) THEN
    RETURN true;
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.health_patient_consents c
    WHERE c.patient_user_id = v_record.patient_user_id
      AND c.consent_status = 'active'
      AND (c.expires_at IS NULL OR c.expires_at > now())
      AND c.scope IN ('medical_records','full')
      AND (
        (c.grantee_professional_id IS NOT NULL AND EXISTS (
          SELECT 1 FROM public.health_professionals gp WHERE gp.id = c.grantee_professional_id AND gp.user_id = auth.uid()))
        OR (c.grantee_business_id IS NOT NULL AND public.user_has_business_access(c.grantee_business_id))
      )
  ) THEN
    RETURN true;
  END IF;

  RETURN false;
END;
$$;

CREATE TABLE IF NOT EXISTS public.health_medical_record_access_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  record_id uuid NOT NULL REFERENCES public.health_medical_records(id) ON DELETE CASCADE,
  accessor_user_id uuid NOT NULL REFERENCES auth.users(id),
  access_reason text,
  accessed_at timestamptz NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.health_log_record_access(p_record_id uuid, p_reason text DEFAULT NULL)
RETURNS public.health_medical_record_access_log
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  v_log public.health_medical_record_access_log;
BEGIN
  IF NOT public.health_can_access_medical_record(p_record_id) THEN
    RAISE EXCEPTION 'Accès refusé à ce dossier médical';
  END IF;

  INSERT INTO public.health_medical_record_access_log (record_id, accessor_user_id, access_reason)
  VALUES (p_record_id, auth.uid(), p_reason)
  RETURNING * INTO v_log;

  INSERT INTO public.audit_logs (user_id, module_code, action, entity_type, entity_id)
  VALUES (auth.uid(), 'health', 'medical_record.accessed', 'health_medical_records', p_record_id::text);

  RETURN v_log;
END;
$$;

CREATE INDEX IF NOT EXISTS idx_health_medical_records_patient ON public.health_medical_records (patient_user_id);
CREATE INDEX IF NOT EXISTS idx_health_medical_records_author ON public.health_medical_records (author_professional_id);
CREATE INDEX IF NOT EXISTS idx_health_record_access_log_record ON public.health_medical_record_access_log (record_id);

-- ============================================================
-- RLS minimal pour les tables déjà créées (le reste du module —
-- documents, prescriptions, laboratoire, RLS complet — est à finir)
-- ============================================================

ALTER TABLE public.health_provider_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_specialties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_professionals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_availabilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_patient_consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_medical_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_medical_record_access_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY health_specialties_select ON public.health_specialties FOR SELECT USING (true);

CREATE POLICY health_provider_profiles_select ON public.health_provider_profiles FOR SELECT
  USING (is_public = true OR public.user_has_business_access(business_id) OR public.is_super_admin());
CREATE POLICY health_provider_profiles_write ON public.health_provider_profiles FOR INSERT
  WITH CHECK (public.user_has_business_access(business_id));
CREATE POLICY health_provider_profiles_update ON public.health_provider_profiles FOR UPDATE
  USING (public.user_has_business_access(business_id));

CREATE POLICY health_professionals_select ON public.health_professionals FOR SELECT
  USING (true);
CREATE POLICY health_professionals_write ON public.health_professionals FOR INSERT
  WITH CHECK (user_id = auth.uid());
CREATE POLICY health_professionals_update ON public.health_professionals FOR UPDATE
  USING (user_id = auth.uid() OR (business_id IS NOT NULL AND public.user_has_business_access(business_id)) OR public.is_super_admin());

CREATE POLICY health_services_select ON public.health_services FOR SELECT
  USING (is_active = true OR (business_id IS NOT NULL AND public.user_has_business_access(business_id))
    OR EXISTS (SELECT 1 FROM public.health_professionals p WHERE p.id = professional_id AND p.user_id = auth.uid()));
CREATE POLICY health_services_write ON public.health_services FOR INSERT
  WITH CHECK ((business_id IS NOT NULL AND public.user_has_business_access(business_id))
    OR EXISTS (SELECT 1 FROM public.health_professionals p WHERE p.id = professional_id AND p.user_id = auth.uid()));

CREATE POLICY health_availabilities_select ON public.health_availabilities FOR SELECT USING (true);
CREATE POLICY health_availabilities_write ON public.health_availabilities FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.health_professionals p WHERE p.id = professional_id AND p.user_id = auth.uid()));

CREATE POLICY health_appointments_select ON public.health_appointments FOR SELECT
  USING (
    patient_user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.health_professionals p WHERE p.id = professional_id AND p.user_id = auth.uid())
    OR (business_id IS NOT NULL AND public.user_has_business_access(business_id))
  );
CREATE POLICY health_appointments_insert ON public.health_appointments FOR INSERT WITH CHECK (patient_user_id = auth.uid());
CREATE POLICY health_appointments_update ON public.health_appointments FOR UPDATE
  USING (
    patient_user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.health_professionals p WHERE p.id = professional_id AND p.user_id = auth.uid())
    OR (business_id IS NOT NULL AND public.user_has_business_access(business_id))
  );

CREATE POLICY health_consents_select ON public.health_patient_consents FOR SELECT
  USING (
    patient_user_id = auth.uid()
    OR (grantee_professional_id IS NOT NULL AND EXISTS (SELECT 1 FROM public.health_professionals p WHERE p.id = grantee_professional_id AND p.user_id = auth.uid()))
    OR (grantee_business_id IS NOT NULL AND public.user_has_business_access(grantee_business_id))
  );

-- Dossiers médicaux : AUCUNE policy INSERT/UPDATE ouverte — tout passe par
-- des fonctions SECURITY DEFINER dédiées (à écrire), jamais d'écriture directe.
CREATE POLICY health_medical_records_select ON public.health_medical_records FOR SELECT
  USING (public.health_can_access_medical_record(id));

CREATE POLICY health_record_access_log_select ON public.health_medical_record_access_log FOR SELECT
  USING (accessor_user_id = auth.uid());
