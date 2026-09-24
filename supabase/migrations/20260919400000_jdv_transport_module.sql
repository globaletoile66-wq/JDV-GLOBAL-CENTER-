-- ============================================================
-- JDV TRANSPORT
-- NOTE : transport_service_types, transport_vehicle_types, transport_vehicles,
-- transport_vehicle_documents, transport_drivers, transport_driver_documents,
-- transport_driver_availability, transport_pricing_rules, transport_bookings,
-- transport_routes, transport_stops, transport_schedules, transport_seats
-- existaient déjà en base (pattern business_id -> business_profiles) avant
-- cette migration. Si vous partez d'une base vierge, il faut d'abord créer
-- ces tables (voir transport_deliveries ci-dessous pour la convention).
-- Cette migration ajoute : fonctions du cycle de course, livraisons/colis,
-- location de véhicules, demandes commerciales, commissions, avis,
-- signalements, et le RLS complet.
-- ============================================================

CREATE OR REPLACE FUNCTION public.transport_set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ============================================================
-- Fonctions serveur du cycle de course
-- ============================================================

CREATE OR REPLACE FUNCTION public.transport_calculate_price(
  p_service_type_id uuid,
  p_vehicle_type_id uuid,
  p_country_id uuid,
  p_distance_km numeric,
  p_duration_minutes numeric,
  p_business_id uuid DEFAULT NULL,
  p_is_night boolean DEFAULT false
) RETURNS numeric
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  v_rule public.transport_pricing_rules;
  v_total numeric;
BEGIN
  SELECT * INTO v_rule FROM public.transport_pricing_rules
  WHERE service_type_id = p_service_type_id
    AND (vehicle_type_id IS NULL OR vehicle_type_id = p_vehicle_type_id)
    AND (country_id IS NULL OR country_id = p_country_id)
    AND (business_id IS NULL OR business_id = p_business_id)
    AND is_active = true
  ORDER BY (vehicle_type_id IS NOT NULL) DESC, (country_id IS NOT NULL) DESC, (business_id IS NOT NULL) DESC
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  v_total := COALESCE(v_rule.base_fare,0)
    + COALESCE(v_rule.per_km_fare,0) * COALESCE(p_distance_km,0)
    + COALESCE(v_rule.per_minute_fare,0) * COALESCE(p_duration_minutes,0);

  IF p_is_night AND v_rule.night_surcharge_percent IS NOT NULL THEN
    v_total := v_total * (1 + v_rule.night_surcharge_percent/100);
  END IF;

  IF v_rule.minimum_fare IS NOT NULL AND v_total < v_rule.minimum_fare THEN
    v_total := v_rule.minimum_fare;
  END IF;

  RETURN round(v_total, 2);
END;
$$;

CREATE OR REPLACE FUNCTION public.transport_accept_booking(
  p_booking_id uuid,
  p_driver_id uuid
) RETURNS public.transport_bookings
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  v_booking public.transport_bookings;
  v_driver public.transport_drivers;
BEGIN
  SELECT * INTO v_booking FROM public.transport_bookings WHERE id = p_booking_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Course introuvable'; END IF;

  IF v_booking.driver_id = p_driver_id AND v_booking.booking_status IN ('accepted','driver_arriving','driver_arrived','in_progress') THEN
    RETURN v_booking;
  END IF;

  IF v_booking.booking_status NOT IN ('requested','searching') THEN
    RAISE EXCEPTION 'Cette course a déjà été attribuée ou n''est plus disponible';
  END IF;

  SELECT * INTO v_driver FROM public.transport_drivers WHERE id = p_driver_id AND user_id = auth.uid();
  IF NOT FOUND THEN RAISE EXCEPTION 'Chauffeur non autorisé'; END IF;
  IF v_driver.driver_status <> 'active' THEN RAISE EXCEPTION 'Chauffeur non actif'; END IF;

  UPDATE public.transport_bookings
  SET driver_id = p_driver_id,
      vehicle_id = COALESCE(v_booking.vehicle_id, v_driver.primary_vehicle_id),
      booking_status = 'accepted'
  WHERE id = p_booking_id
  RETURNING * INTO v_booking;

  INSERT INTO public.audit_logs (user_id, module_code, action, entity_type, entity_id, new_data)
  VALUES (auth.uid(), 'transport', 'booking.accepted', 'transport_bookings', p_booking_id::text, to_jsonb(v_booking));

  RETURN v_booking;
END;
$$;

CREATE OR REPLACE FUNCTION public.transport_update_booking_status(
  p_booking_id uuid,
  p_new_status text
) RETURNS public.transport_bookings
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  v_booking public.transport_bookings;
  v_allowed jsonb := '{
    "driver_arriving": ["accepted"],
    "driver_arrived": ["driver_arriving"],
    "in_progress": ["driver_arrived"],
    "completed": ["in_progress"]
  }'::jsonb;
BEGIN
  SELECT * INTO v_booking FROM public.transport_bookings WHERE id = p_booking_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Course introuvable'; END IF;

  IF v_booking.booking_status::text = p_new_status THEN
    RETURN v_booking;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.transport_drivers d
    WHERE d.id = v_booking.driver_id AND d.user_id = auth.uid()
  ) AND NOT public.is_super_admin() THEN
    RAISE EXCEPTION 'Accès refusé';
  END IF;

  IF NOT (v_allowed -> p_new_status) ? v_booking.booking_status::text THEN
    RAISE EXCEPTION 'Transition de statut invalide: % -> %', v_booking.booking_status, p_new_status;
  END IF;

  UPDATE public.transport_bookings
  SET booking_status = p_new_status::transport_booking_status
  WHERE id = p_booking_id
  RETURNING * INTO v_booking;

  INSERT INTO public.audit_logs (user_id, module_code, action, entity_type, entity_id, new_data)
  VALUES (auth.uid(), 'transport', 'booking.status_changed', 'transport_bookings', p_booking_id::text,
    jsonb_build_object('status', p_new_status));

  RETURN v_booking;
END;
$$;

CREATE OR REPLACE FUNCTION public.transport_confirm_payment(
  p_booking_id uuid,
  p_wallet_transaction_id uuid
) RETURNS public.transport_bookings
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  v_booking public.transport_bookings;
  v_tx public.wallet_transactions;
BEGIN
  SELECT * INTO v_booking FROM public.transport_bookings WHERE id = p_booking_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Course introuvable'; END IF;

  IF v_booking.wallet_transaction_id = p_wallet_transaction_id THEN
    RETURN v_booking;
  END IF;

  IF v_booking.booking_status <> 'completed' THEN
    RAISE EXCEPTION 'La course doit être terminée avant paiement';
  END IF;

  SELECT * INTO v_tx FROM public.wallet_transactions WHERE id = p_wallet_transaction_id;
  IF NOT FOUND OR v_tx.transaction_status <> 'completed' THEN
    RAISE EXCEPTION 'Paiement JDV PAY non confirmé';
  END IF;

  UPDATE public.transport_bookings
  SET wallet_transaction_id = p_wallet_transaction_id,
      final_price = COALESCE(v_booking.final_price, v_tx.amount)
  WHERE id = p_booking_id
  RETURNING * INTO v_booking;

  RETURN v_booking;
END;
$$;

CREATE OR REPLACE FUNCTION public.transport_reserve_seat(
  p_schedule_id uuid,
  p_seat_id uuid,
  p_price numeric,
  p_currency_id uuid,
  p_idempotency_key text DEFAULT NULL
) RETURNS public.transport_seat_reservations
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  v_seat public.transport_seats;
  v_reservation public.transport_seat_reservations;
BEGIN
  IF p_idempotency_key IS NOT NULL THEN
    SELECT * INTO v_reservation FROM public.transport_seat_reservations WHERE idempotency_key = p_idempotency_key;
    IF FOUND THEN RETURN v_reservation; END IF;
  END IF;

  SELECT * INTO v_seat FROM public.transport_seats WHERE id = p_seat_id AND schedule_id = p_schedule_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Siège introuvable'; END IF;
  IF v_seat.seat_status <> 'available' THEN
    RAISE EXCEPTION 'Ce siège n''est plus disponible';
  END IF;

  UPDATE public.transport_seats SET seat_status = 'reserved' WHERE id = p_seat_id;

  INSERT INTO public.transport_seat_reservations (
    schedule_id, seat_id, passenger_user_id, price, currency_id, reservation_status, idempotency_key
  ) VALUES (
    p_schedule_id, p_seat_id, auth.uid(), p_price, p_currency_id, 'pending', p_idempotency_key
  ) RETURNING * INTO v_reservation;

  RETURN v_reservation;
END;
$$;

CREATE INDEX IF NOT EXISTS idx_transport_bookings_passenger ON public.transport_bookings (passenger_user_id);
CREATE INDEX IF NOT EXISTS idx_transport_bookings_driver ON public.transport_bookings (driver_id);
CREATE INDEX IF NOT EXISTS idx_transport_bookings_business ON public.transport_bookings (business_id);
CREATE INDEX IF NOT EXISTS idx_transport_bookings_status ON public.transport_bookings (booking_status);
CREATE INDEX IF NOT EXISTS idx_transport_drivers_business ON public.transport_drivers (business_id);
CREATE INDEX IF NOT EXISTS idx_transport_drivers_status ON public.transport_drivers (driver_status);
CREATE INDEX IF NOT EXISTS idx_transport_vehicles_business ON public.transport_vehicles (business_id);
CREATE INDEX IF NOT EXISTS idx_transport_schedules_route ON public.transport_schedules (route_id);
CREATE INDEX IF NOT EXISTS idx_transport_seats_schedule ON public.transport_seats (schedule_id);

-- ============================================================
-- Livraisons et colis
-- ============================================================

DO $$ BEGIN
  CREATE TYPE transport_delivery_status AS ENUM ('created','awaiting_pickup','picked_up','in_transit','arrived','out_for_delivery','delivered','failed','cancelled','returned');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.transport_deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reference text UNIQUE DEFAULT ('JDVT-' || upper(substr(gen_random_uuid()::text,1,8))),
  sender_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_name text NOT NULL,
  recipient_phone text,
  business_id uuid REFERENCES public.business_profiles(id),
  driver_id uuid REFERENCES public.transport_drivers(id) ON DELETE SET NULL,
  vehicle_id uuid REFERENCES public.transport_vehicles(id) ON DELETE SET NULL,
  pickup_address text NOT NULL,
  pickup_latitude numeric,
  pickup_longitude numeric,
  destination_address text NOT NULL,
  destination_latitude numeric,
  destination_longitude numeric,
  source_module text,
  source_reference text,
  price numeric,
  currency_id uuid REFERENCES public.currencies(id),
  delivery_status transport_delivery_status NOT NULL DEFAULT 'created',
  wallet_transaction_id uuid REFERENCES public.wallet_transactions(id),
  idempotency_key text UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_transport_deliveries_updated_at
  BEFORE UPDATE ON public.transport_deliveries
  FOR EACH ROW EXECUTE FUNCTION public.transport_set_updated_at();

CREATE TABLE IF NOT EXISTS public.transport_parcels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  delivery_id uuid NOT NULL REFERENCES public.transport_deliveries(id) ON DELETE CASCADE,
  description text,
  weight_kg numeric,
  length_cm numeric,
  width_cm numeric,
  height_cm numeric,
  quantity integer NOT NULL DEFAULT 1,
  declared_value numeric,
  currency_id uuid REFERENCES public.currencies(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.transport_delivery_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  delivery_id uuid NOT NULL REFERENCES public.transport_deliveries(id) ON DELETE CASCADE,
  event_status transport_delivery_status NOT NULL,
  location text,
  comment text,
  actor_user_id uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.transport_delivery_proofs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  delivery_id uuid NOT NULL UNIQUE REFERENCES public.transport_deliveries(id) ON DELETE CASCADE,
  proof_type text NOT NULL,
  proof_url text,
  otp_code text,
  confirmed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.transport_add_delivery_event(
  p_delivery_id uuid,
  p_status text,
  p_location text DEFAULT NULL,
  p_comment text DEFAULT NULL
) RETURNS public.transport_delivery_events
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  v_delivery public.transport_deliveries;
  v_event public.transport_delivery_events;
BEGIN
  SELECT * INTO v_delivery FROM public.transport_deliveries WHERE id = p_delivery_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Livraison introuvable'; END IF;

  IF v_delivery.delivery_status::text = p_status THEN
    SELECT * INTO v_event FROM public.transport_delivery_events
    WHERE delivery_id = p_delivery_id ORDER BY created_at DESC LIMIT 1;
    RETURN v_event;
  END IF;

  INSERT INTO public.transport_delivery_events (delivery_id, event_status, location, comment, actor_user_id)
  VALUES (p_delivery_id, p_status::transport_delivery_status, p_location, p_comment, auth.uid())
  RETURNING * INTO v_event;

  UPDATE public.transport_deliveries SET delivery_status = p_status::transport_delivery_status WHERE id = p_delivery_id;

  RETURN v_event;
END;
$$;

CREATE INDEX IF NOT EXISTS idx_transport_deliveries_sender ON public.transport_deliveries (sender_user_id);
CREATE INDEX IF NOT EXISTS idx_transport_deliveries_business ON public.transport_deliveries (business_id);
CREATE INDEX IF NOT EXISTS idx_transport_deliveries_driver ON public.transport_deliveries (driver_id);
CREATE INDEX IF NOT EXISTS idx_transport_deliveries_status ON public.transport_deliveries (delivery_status);
CREATE INDEX IF NOT EXISTS idx_transport_deliveries_source ON public.transport_deliveries (source_module, source_reference);
CREATE INDEX IF NOT EXISTS idx_transport_parcels_delivery ON public.transport_parcels (delivery_id);
CREATE INDEX IF NOT EXISTS idx_transport_delivery_events_delivery ON public.transport_delivery_events (delivery_id);

-- ============================================================
-- Location de véhicules, demandes commerciales, commissions
-- ============================================================

DO $$ BEGIN
  CREATE TYPE transport_rental_status AS ENUM ('pending','confirmed','active','completed','cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE transport_request_status AS ENUM ('open','quoted','converted','closed','cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.transport_rentals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id uuid NOT NULL REFERENCES public.transport_vehicles(id) ON DELETE CASCADE,
  renter_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_id uuid REFERENCES public.business_profiles(id),
  driver_id uuid REFERENCES public.transport_drivers(id) ON DELETE SET NULL,
  start_at timestamptz NOT NULL,
  end_at timestamptz NOT NULL,
  price numeric NOT NULL CHECK (price > 0),
  currency_id uuid REFERENCES public.currencies(id),
  rental_status transport_rental_status NOT NULL DEFAULT 'pending',
  wallet_transaction_id uuid REFERENCES public.wallet_transactions(id),
  idempotency_key text UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (end_at > start_at)
);

CREATE TRIGGER trg_transport_rentals_updated_at
  BEFORE UPDATE ON public.transport_rentals
  FOR EACH ROW EXECUTE FUNCTION public.transport_set_updated_at();

CREATE OR REPLACE FUNCTION public.transport_check_rental_overlap()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.transport_rentals r
    WHERE r.vehicle_id = NEW.vehicle_id
      AND r.id <> NEW.id
      AND r.rental_status NOT IN ('cancelled')
      AND (NEW.start_at, NEW.end_at) OVERLAPS (r.start_at, r.end_at)
  ) THEN
    RAISE EXCEPTION 'Ce véhicule est déjà réservé sur cette période';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_transport_rentals_overlap
  BEFORE INSERT OR UPDATE ON public.transport_rentals
  FOR EACH ROW EXECUTE FUNCTION public.transport_check_rental_overlap();

CREATE TABLE IF NOT EXISTS public.transport_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  request_type text NOT NULL,
  description text,
  country_id uuid REFERENCES public.countries(id),
  budget_max numeric,
  currency_id uuid REFERENCES public.currencies(id),
  request_status transport_request_status NOT NULL DEFAULT 'open',
  crm_prospect_id uuid REFERENCES public.crm_prospects(id) ON DELETE SET NULL,
  assigned_business_id uuid REFERENCES public.business_profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_transport_requests_updated_at
  BEFORE UPDATE ON public.transport_requests
  FOR EACH ROW EXECUTE FUNCTION public.transport_set_updated_at();

CREATE OR REPLACE FUNCTION public.transport_request_to_crm_prospect(
  p_request_id uuid,
  p_business_id uuid
) RETURNS public.crm_prospects
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  v_request public.transport_requests;
  v_prospect public.crm_prospects;
  v_profile public.profiles;
BEGIN
  SELECT * INTO v_request FROM public.transport_requests WHERE id = p_request_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Demande introuvable'; END IF;

  IF NOT (public.user_has_business_access(p_business_id) OR public.is_super_admin()) THEN
    RAISE EXCEPTION 'Accès refusé';
  END IF;

  IF v_request.crm_prospect_id IS NOT NULL THEN
    SELECT * INTO v_prospect FROM public.crm_prospects WHERE id = v_request.crm_prospect_id;
    RETURN v_prospect;
  END IF;

  SELECT * INTO v_profile FROM public.profiles WHERE id = v_request.requester_user_id;

  INSERT INTO public.crm_prospects (
    business_id, first_name, last_name, phone, email,
    desired_product, requested_amount, prospect_status, created_by
  ) VALUES (
    p_business_id, COALESCE(v_profile.first_name,'Prospect'), v_profile.last_name,
    v_profile.phone, v_profile.email,
    'Transport (' || v_request.request_type || ')', v_request.budget_max, 'new', auth.uid()
  ) RETURNING * INTO v_prospect;

  UPDATE public.transport_requests
  SET crm_prospect_id = v_prospect.id, assigned_business_id = p_business_id
  WHERE id = p_request_id;

  RETURN v_prospect;
END;
$$;

CREATE TABLE IF NOT EXISTS public.transport_commissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid REFERENCES public.business_profiles(id) ON DELETE CASCADE,
  driver_id uuid REFERENCES public.transport_drivers(id) ON DELETE SET NULL,
  booking_id uuid REFERENCES public.transport_bookings(id) ON DELETE SET NULL,
  delivery_id uuid REFERENCES public.transport_deliveries(id) ON DELETE SET NULL,
  amount numeric NOT NULL CHECK (amount >= 0),
  currency_id uuid REFERENCES public.currencies(id),
  commission_status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_transport_commission_booking_driver
  ON public.transport_commissions (booking_id, driver_id) WHERE booking_id IS NOT NULL AND driver_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_transport_rentals_vehicle ON public.transport_rentals (vehicle_id);
CREATE INDEX IF NOT EXISTS idx_transport_rentals_renter ON public.transport_rentals (renter_user_id);
CREATE INDEX IF NOT EXISTS idx_transport_requests_requester ON public.transport_requests (requester_user_id);
CREATE INDEX IF NOT EXISTS idx_transport_commissions_business ON public.transport_commissions (business_id);

-- ============================================================
-- Avis et signalements
-- ============================================================

DO $$ BEGIN
  CREATE TYPE transport_review_target AS ENUM ('driver','vehicle','delivery','rental');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE transport_review_status AS ENUM ('pending','published','rejected','hidden');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.transport_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid REFERENCES public.transport_bookings(id) ON DELETE CASCADE,
  delivery_id uuid REFERENCES public.transport_deliveries(id) ON DELETE CASCADE,
  reviewer_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_type transport_review_target NOT NULL,
  target_id uuid NOT NULL,
  rating integer NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment text,
  review_status transport_review_status NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (booking_id IS NOT NULL OR delivery_id IS NOT NULL)
);

CREATE TABLE IF NOT EXISTS public.transport_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_type text NOT NULL,
  target_id uuid,
  reason text NOT NULL,
  description text,
  report_status text NOT NULL DEFAULT 'pending',
  resolved_by uuid REFERENCES auth.users(id),
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_transport_reviews_target ON public.transport_reviews (target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_transport_reports_target ON public.transport_reports (target_type, target_id);

-- ============================================================
-- RLS complet
-- ============================================================

ALTER TABLE public.transport_service_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transport_vehicle_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transport_vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transport_vehicle_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transport_drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transport_driver_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transport_driver_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transport_pricing_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transport_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transport_routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transport_stops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transport_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transport_seats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transport_seat_reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transport_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transport_parcels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transport_delivery_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transport_delivery_proofs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transport_rentals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transport_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transport_commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transport_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transport_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY transport_service_types_select ON public.transport_service_types FOR SELECT USING (true);
CREATE POLICY transport_vehicle_types_select ON public.transport_vehicle_types FOR SELECT USING (true);
CREATE POLICY transport_pricing_rules_select ON public.transport_pricing_rules FOR SELECT USING (is_active = true OR public.user_has_business_access(business_id) OR public.is_super_admin());
CREATE POLICY transport_pricing_rules_write ON public.transport_pricing_rules FOR INSERT
  WITH CHECK (business_id IS NULL AND public.is_super_admin() OR public.user_has_business_access(business_id));
CREATE POLICY transport_pricing_rules_update ON public.transport_pricing_rules FOR UPDATE
  USING (public.user_has_business_access(business_id) OR public.is_super_admin());

CREATE POLICY transport_vehicles_select ON public.transport_vehicles FOR SELECT
  USING (owner_user_id = auth.uid() OR (business_id IS NOT NULL AND public.user_has_business_access(business_id)) OR public.is_super_admin());
CREATE POLICY transport_vehicles_insert ON public.transport_vehicles FOR INSERT
  WITH CHECK (owner_user_id = auth.uid() OR (business_id IS NOT NULL AND public.user_has_business_access(business_id)));
CREATE POLICY transport_vehicles_update ON public.transport_vehicles FOR UPDATE
  USING (owner_user_id = auth.uid() OR (business_id IS NOT NULL AND public.user_has_business_access(business_id)) OR public.is_super_admin());

CREATE POLICY transport_vehicle_documents_select ON public.transport_vehicle_documents FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.transport_vehicles v WHERE v.id = vehicle_id AND
    (v.owner_user_id = auth.uid() OR (v.business_id IS NOT NULL AND public.user_has_business_access(v.business_id)) OR public.is_super_admin())));
CREATE POLICY transport_vehicle_documents_insert ON public.transport_vehicle_documents FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.transport_vehicles v WHERE v.id = vehicle_id AND
    (v.owner_user_id = auth.uid() OR (v.business_id IS NOT NULL AND public.user_has_business_access(v.business_id)))));

CREATE POLICY transport_drivers_select ON public.transport_drivers FOR SELECT
  USING (
    user_id = auth.uid()
    OR (business_id IS NOT NULL AND public.user_has_business_access(business_id))
    OR public.is_super_admin()
    OR EXISTS (SELECT 1 FROM public.transport_bookings b WHERE b.driver_id = transport_drivers.id AND b.passenger_user_id = auth.uid()
               AND b.booking_status IN ('accepted','driver_arriving','driver_arrived','in_progress','completed'))
  );
CREATE POLICY transport_drivers_insert ON public.transport_drivers FOR INSERT
  WITH CHECK (user_id = auth.uid() OR (business_id IS NOT NULL AND public.user_has_business_access(business_id)));
CREATE POLICY transport_drivers_update ON public.transport_drivers FOR UPDATE
  USING (user_id = auth.uid() OR (business_id IS NOT NULL AND public.user_has_business_access(business_id)) OR public.is_super_admin());

CREATE POLICY transport_driver_documents_select ON public.transport_driver_documents FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.transport_drivers d WHERE d.id = driver_id AND
    (d.user_id = auth.uid() OR (d.business_id IS NOT NULL AND public.user_has_business_access(d.business_id)) OR public.is_super_admin())));
CREATE POLICY transport_driver_documents_insert ON public.transport_driver_documents FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.transport_drivers d WHERE d.id = driver_id AND d.user_id = auth.uid()));

CREATE POLICY transport_driver_availability_select ON public.transport_driver_availability FOR SELECT
  USING (
    driver_id IN (SELECT id FROM public.transport_drivers WHERE user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.transport_drivers d WHERE d.id = driver_id AND d.business_id IS NOT NULL AND public.user_has_business_access(d.business_id))
    OR EXISTS (SELECT 1 FROM public.transport_bookings b WHERE b.driver_id = transport_driver_availability.driver_id AND b.passenger_user_id = auth.uid()
               AND b.booking_status IN ('accepted','driver_arriving','driver_arrived','in_progress'))
    OR public.is_super_admin()
  );
CREATE POLICY transport_driver_availability_write ON public.transport_driver_availability FOR INSERT
  WITH CHECK (driver_id IN (SELECT id FROM public.transport_drivers WHERE user_id = auth.uid()));
CREATE POLICY transport_driver_availability_update ON public.transport_driver_availability FOR UPDATE
  USING (driver_id IN (SELECT id FROM public.transport_drivers WHERE user_id = auth.uid()));

CREATE POLICY transport_bookings_select ON public.transport_bookings FOR SELECT
  USING (
    passenger_user_id = auth.uid()
    OR (driver_id IS NOT NULL AND driver_id IN (SELECT id FROM public.transport_drivers WHERE user_id = auth.uid()))
    OR (business_id IS NOT NULL AND public.user_has_business_access(business_id))
    OR public.is_super_admin()
  );
CREATE POLICY transport_bookings_insert ON public.transport_bookings FOR INSERT WITH CHECK (passenger_user_id = auth.uid());
CREATE POLICY transport_bookings_update ON public.transport_bookings FOR UPDATE
  USING (
    passenger_user_id = auth.uid()
    OR (driver_id IS NOT NULL AND driver_id IN (SELECT id FROM public.transport_drivers WHERE user_id = auth.uid()))
    OR (business_id IS NOT NULL AND public.user_has_business_access(business_id))
  );

CREATE POLICY transport_routes_select ON public.transport_routes FOR SELECT USING (true);
CREATE POLICY transport_routes_write ON public.transport_routes FOR INSERT WITH CHECK (public.user_has_business_access(business_id));
CREATE POLICY transport_routes_update ON public.transport_routes FOR UPDATE USING (public.user_has_business_access(business_id));

CREATE POLICY transport_stops_select ON public.transport_stops FOR SELECT USING (true);
CREATE POLICY transport_stops_write ON public.transport_stops FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.transport_routes r WHERE r.id = route_id AND public.user_has_business_access(r.business_id)));

CREATE POLICY transport_schedules_select ON public.transport_schedules FOR SELECT USING (true);
CREATE POLICY transport_schedules_write ON public.transport_schedules FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.transport_routes r WHERE r.id = route_id AND public.user_has_business_access(r.business_id)));
CREATE POLICY transport_schedules_update ON public.transport_schedules FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.transport_routes r WHERE r.id = route_id AND public.user_has_business_access(r.business_id)));

CREATE POLICY transport_seats_select ON public.transport_seats FOR SELECT USING (true);
CREATE POLICY transport_seats_write ON public.transport_seats FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.transport_schedules s JOIN public.transport_routes r ON r.id=s.route_id WHERE s.id = schedule_id AND public.user_has_business_access(r.business_id)));

CREATE POLICY transport_seat_reservations_select ON public.transport_seat_reservations FOR SELECT
  USING (
    passenger_user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.transport_schedules s JOIN public.transport_routes r ON r.id=s.route_id WHERE s.id = schedule_id AND public.user_has_business_access(r.business_id))
  );

CREATE POLICY transport_deliveries_select ON public.transport_deliveries FOR SELECT
  USING (
    sender_user_id = auth.uid()
    OR (driver_id IS NOT NULL AND driver_id IN (SELECT id FROM public.transport_drivers WHERE user_id = auth.uid()))
    OR (business_id IS NOT NULL AND public.user_has_business_access(business_id))
    OR public.is_super_admin()
  );
CREATE POLICY transport_deliveries_insert ON public.transport_deliveries FOR INSERT WITH CHECK (sender_user_id = auth.uid());
CREATE POLICY transport_deliveries_update ON public.transport_deliveries FOR UPDATE
  USING (
    sender_user_id = auth.uid()
    OR (driver_id IS NOT NULL AND driver_id IN (SELECT id FROM public.transport_drivers WHERE user_id = auth.uid()))
    OR (business_id IS NOT NULL AND public.user_has_business_access(business_id))
  );

CREATE POLICY transport_parcels_select ON public.transport_parcels FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.transport_deliveries d WHERE d.id = delivery_id AND
    (d.sender_user_id = auth.uid() OR (d.business_id IS NOT NULL AND public.user_has_business_access(d.business_id))
     OR (d.driver_id IS NOT NULL AND d.driver_id IN (SELECT id FROM public.transport_drivers WHERE user_id = auth.uid())))));
CREATE POLICY transport_parcels_write ON public.transport_parcels FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.transport_deliveries d WHERE d.id = delivery_id AND d.sender_user_id = auth.uid()));

CREATE POLICY transport_delivery_events_select ON public.transport_delivery_events FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.transport_deliveries d WHERE d.id = delivery_id AND
    (d.sender_user_id = auth.uid() OR (d.business_id IS NOT NULL AND public.user_has_business_access(d.business_id))
     OR (d.driver_id IS NOT NULL AND d.driver_id IN (SELECT id FROM public.transport_drivers WHERE user_id = auth.uid())))));

CREATE POLICY transport_delivery_proofs_select ON public.transport_delivery_proofs FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.transport_deliveries d WHERE d.id = delivery_id AND
    (d.sender_user_id = auth.uid() OR (d.business_id IS NOT NULL AND public.user_has_business_access(d.business_id))
     OR (d.driver_id IS NOT NULL AND d.driver_id IN (SELECT id FROM public.transport_drivers WHERE user_id = auth.uid())))));
CREATE POLICY transport_delivery_proofs_write ON public.transport_delivery_proofs FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.transport_deliveries d WHERE d.id = delivery_id AND
    (d.driver_id IS NOT NULL AND d.driver_id IN (SELECT id FROM public.transport_drivers WHERE user_id = auth.uid()))));

CREATE POLICY transport_rentals_select ON public.transport_rentals FOR SELECT
  USING (renter_user_id = auth.uid() OR (business_id IS NOT NULL AND public.user_has_business_access(business_id)) OR public.is_super_admin());
CREATE POLICY transport_rentals_insert ON public.transport_rentals FOR INSERT WITH CHECK (renter_user_id = auth.uid());
CREATE POLICY transport_rentals_update ON public.transport_rentals FOR UPDATE
  USING (renter_user_id = auth.uid() OR (business_id IS NOT NULL AND public.user_has_business_access(business_id)));

CREATE POLICY transport_requests_select ON public.transport_requests FOR SELECT
  USING (requester_user_id = auth.uid() OR (assigned_business_id IS NOT NULL AND public.user_has_business_access(assigned_business_id)) OR public.is_super_admin());
CREATE POLICY transport_requests_insert ON public.transport_requests FOR INSERT WITH CHECK (requester_user_id = auth.uid());
CREATE POLICY transport_requests_update ON public.transport_requests FOR UPDATE
  USING (requester_user_id = auth.uid() OR (assigned_business_id IS NOT NULL AND public.user_has_business_access(assigned_business_id)));

CREATE POLICY transport_commissions_select ON public.transport_commissions FOR SELECT
  USING (
    (business_id IS NOT NULL AND public.user_has_business_access(business_id))
    OR (driver_id IS NOT NULL AND driver_id IN (SELECT id FROM public.transport_drivers WHERE user_id = auth.uid()))
  );
CREATE POLICY transport_commissions_write ON public.transport_commissions FOR INSERT
  WITH CHECK (business_id IS NOT NULL AND public.user_has_business_access(business_id));

CREATE POLICY transport_reviews_select ON public.transport_reviews FOR SELECT
  USING (review_status = 'published' OR reviewer_user_id = auth.uid() OR public.is_super_admin());
CREATE POLICY transport_reviews_insert ON public.transport_reviews FOR INSERT
  WITH CHECK (
    reviewer_user_id = auth.uid()
    AND (
      (booking_id IS NOT NULL AND EXISTS (SELECT 1 FROM public.transport_bookings b WHERE b.id = booking_id AND b.passenger_user_id = auth.uid()))
      OR (delivery_id IS NOT NULL AND EXISTS (SELECT 1 FROM public.transport_deliveries d WHERE d.id = delivery_id AND d.sender_user_id = auth.uid()))
    )
  );

CREATE POLICY transport_reports_select ON public.transport_reports FOR SELECT
  USING (reporter_user_id = auth.uid() OR public.is_super_admin());
CREATE POLICY transport_reports_insert ON public.transport_reports FOR INSERT WITH CHECK (reporter_user_id = auth.uid());
