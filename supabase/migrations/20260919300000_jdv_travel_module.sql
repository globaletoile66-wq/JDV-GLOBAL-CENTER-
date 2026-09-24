-- ============================================================
-- JDV TRAVEL — destinations, agences/agents/guides, hébergements,
-- activités, circuits, disponibilité, demandes/devis (-> CRM),
-- itinéraires, réservations (JDV PAY), documents, commissions,
-- favoris, avis, signalements. Pattern business_id -> business_profiles.
-- ============================================================

DO $$ BEGIN
  CREATE TYPE travel_verification_status AS ENUM ('unverified','submitted','under_review','verified','rejected','suspended');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE travel_publish_status AS ENUM ('draft','published','unavailable','archived');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE OR REPLACE FUNCTION public.travel_set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TABLE IF NOT EXISTS public.travel_destinations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  country_id uuid REFERENCES public.countries(id),
  city text,
  name text NOT NULL,
  slug text UNIQUE,
  description text,
  short_description text,
  image_url text,
  latitude numeric,
  longitude numeric,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_travel_destinations_updated_at
  BEFORE UPDATE ON public.travel_destinations
  FOR EACH ROW EXECUTE FUNCTION public.travel_set_updated_at();

CREATE OR REPLACE FUNCTION public.travel_generate_slug()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE v_base text;
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    v_base := lower(regexp_replace(coalesce(NEW.name,'destination'), '[^a-zA-Z0-9]+', '-', 'g'));
    NEW.slug := trim(both '-' from v_base) || '-' || substr(NEW.id::text,1,8);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_travel_destinations_slug
  BEFORE INSERT ON public.travel_destinations
  FOR EACH ROW EXECUTE FUNCTION public.travel_generate_slug();

CREATE TABLE IF NOT EXISTS public.travel_agencies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL UNIQUE REFERENCES public.business_profiles(id) ON DELETE CASCADE,
  license_number text,
  verification_status travel_verification_status NOT NULL DEFAULT 'unverified',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_travel_agencies_updated_at
  BEFORE UPDATE ON public.travel_agencies
  FOR EACH ROW EXECUTE FUNCTION public.travel_set_updated_at();

CREATE TABLE IF NOT EXISTS public.travel_agents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.business_profiles(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  specialties text[] DEFAULT '{}',
  zones text[] DEFAULT '{}',
  verification_status travel_verification_status NOT NULL DEFAULT 'unverified',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (business_id, user_id)
);

CREATE TRIGGER trg_travel_agents_updated_at
  BEFORE UPDATE ON public.travel_agents
  FOR EACH ROW EXECUTE FUNCTION public.travel_set_updated_at();

CREATE TABLE IF NOT EXISTS public.travel_guides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_id uuid REFERENCES public.business_profiles(id) ON DELETE SET NULL,
  languages text[] DEFAULT '{}',
  destinations uuid[] DEFAULT '{}',
  specialties text[] DEFAULT '{}',
  verification_status travel_verification_status NOT NULL DEFAULT 'unverified',
  is_available boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id)
);

CREATE TRIGGER trg_travel_guides_updated_at
  BEFORE UPDATE ON public.travel_guides
  FOR EACH ROW EXECUTE FUNCTION public.travel_set_updated_at();

CREATE TABLE IF NOT EXISTS public.travel_accommodations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.business_profiles(id) ON DELETE CASCADE,
  destination_id uuid REFERENCES public.travel_destinations(id),
  accommodation_type text NOT NULL DEFAULT 'hotel',
  name text NOT NULL,
  slug text,
  description text,
  address text,
  latitude numeric,
  longitude numeric,
  capacity integer,
  amenities jsonb NOT NULL DEFAULT '[]'::jsonb,
  publish_status travel_publish_status NOT NULL DEFAULT 'draft',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_travel_accommodations_updated_at
  BEFORE UPDATE ON public.travel_accommodations
  FOR EACH ROW EXECUTE FUNCTION public.travel_set_updated_at();

CREATE TABLE IF NOT EXISTS public.travel_accommodation_media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  accommodation_id uuid NOT NULL REFERENCES public.travel_accommodations(id) ON DELETE CASCADE,
  url text NOT NULL,
  is_primary boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.travel_rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  accommodation_id uuid NOT NULL REFERENCES public.travel_accommodations(id) ON DELETE CASCADE,
  name text NOT NULL,
  room_type text,
  capacity integer NOT NULL DEFAULT 1,
  bed_count integer,
  price_per_night numeric NOT NULL,
  currency_id uuid REFERENCES public.currencies(id),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_travel_rooms_updated_at
  BEFORE UPDATE ON public.travel_rooms
  FOR EACH ROW EXECUTE FUNCTION public.travel_set_updated_at();

CREATE INDEX IF NOT EXISTS idx_travel_destinations_country ON public.travel_destinations (country_id);
CREATE INDEX IF NOT EXISTS idx_travel_agents_business ON public.travel_agents (business_id);
CREATE INDEX IF NOT EXISTS idx_travel_accommodations_business ON public.travel_accommodations (business_id);
CREATE INDEX IF NOT EXISTS idx_travel_accommodations_destination ON public.travel_accommodations (destination_id);
CREATE INDEX IF NOT EXISTS idx_travel_rooms_accommodation ON public.travel_rooms (accommodation_id);

-- ============================================================
-- Activités, circuits, disponibilité
-- ============================================================

CREATE TABLE IF NOT EXISTS public.travel_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.business_profiles(id) ON DELETE CASCADE,
  destination_id uuid REFERENCES public.travel_destinations(id),
  name text NOT NULL,
  description text,
  duration_minutes integer,
  capacity integer,
  price numeric NOT NULL,
  currency_id uuid REFERENCES public.currencies(id),
  publish_status travel_publish_status NOT NULL DEFAULT 'draft',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_travel_activities_updated_at
  BEFORE UPDATE ON public.travel_activities
  FOR EACH ROW EXECUTE FUNCTION public.travel_set_updated_at();

CREATE TABLE IF NOT EXISTS public.travel_activity_media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id uuid NOT NULL REFERENCES public.travel_activities(id) ON DELETE CASCADE,
  url text NOT NULL,
  is_primary boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.travel_tours (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.business_profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  duration_days integer NOT NULL,
  capacity integer,
  price numeric NOT NULL,
  currency_id uuid REFERENCES public.currencies(id),
  guide_id uuid REFERENCES public.travel_guides(id) ON DELETE SET NULL,
  publish_status travel_publish_status NOT NULL DEFAULT 'draft',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_travel_tours_updated_at
  BEFORE UPDATE ON public.travel_tours
  FOR EACH ROW EXECUTE FUNCTION public.travel_set_updated_at();

CREATE TABLE IF NOT EXISTS public.travel_tour_stops (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tour_id uuid NOT NULL REFERENCES public.travel_tours(id) ON DELETE CASCADE,
  destination_id uuid REFERENCES public.travel_destinations(id),
  stop_order integer NOT NULL DEFAULT 1,
  day_offset integer NOT NULL DEFAULT 0,
  description text,
  duration_hours numeric,
  UNIQUE (tour_id, stop_order)
);

DO $$ BEGIN
  CREATE TYPE travel_resource_type AS ENUM ('room','activity','tour');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.travel_availability (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_type travel_resource_type NOT NULL,
  resource_id uuid NOT NULL,
  available_date date NOT NULL,
  total_units integer NOT NULL DEFAULT 1 CHECK (total_units >= 0),
  reserved_units integer NOT NULL DEFAULT 0 CHECK (reserved_units >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (resource_type, resource_id, available_date),
  CHECK (reserved_units <= total_units)
);

CREATE TRIGGER trg_travel_availability_updated_at
  BEFORE UPDATE ON public.travel_availability
  FOR EACH ROW EXECUTE FUNCTION public.travel_set_updated_at();

CREATE INDEX IF NOT EXISTS idx_travel_activities_business ON public.travel_activities (business_id);
CREATE INDEX IF NOT EXISTS idx_travel_activities_destination ON public.travel_activities (destination_id);
CREATE INDEX IF NOT EXISTS idx_travel_tours_business ON public.travel_tours (business_id);
CREATE INDEX IF NOT EXISTS idx_travel_tour_stops_tour ON public.travel_tour_stops (tour_id);
CREATE INDEX IF NOT EXISTS idx_travel_availability_resource ON public.travel_availability (resource_type, resource_id, available_date);

-- ============================================================
-- Demandes, devis, itinéraires, voyageurs
-- ============================================================

DO $$ BEGIN
  CREATE TYPE travel_request_status AS ENUM ('open','quoted','converted','closed','cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE travel_quote_status AS ENUM ('draft','sent','viewed','accepted','rejected','expired');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.travel_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  destination_id uuid REFERENCES public.travel_destinations(id),
  travel_type text,
  start_date date,
  end_date date,
  travelers_count integer NOT NULL DEFAULT 1,
  budget_max numeric,
  currency_id uuid REFERENCES public.currencies(id),
  notes text,
  request_status travel_request_status NOT NULL DEFAULT 'open',
  crm_prospect_id uuid REFERENCES public.crm_prospects(id) ON DELETE SET NULL,
  assigned_business_id uuid REFERENCES public.business_profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_travel_requests_updated_at
  BEFORE UPDATE ON public.travel_requests
  FOR EACH ROW EXECUTE FUNCTION public.travel_set_updated_at();

CREATE OR REPLACE FUNCTION public.travel_request_to_crm_prospect(
  p_request_id uuid,
  p_business_id uuid
) RETURNS public.crm_prospects
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  v_request public.travel_requests;
  v_prospect public.crm_prospects;
  v_profile public.profiles;
BEGIN
  SELECT * INTO v_request FROM public.travel_requests WHERE id = p_request_id FOR UPDATE;
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
    'Voyage (' || COALESCE(v_request.travel_type,'n/a') || ')',
    v_request.budget_max, 'new', auth.uid()
  ) RETURNING * INTO v_prospect;

  UPDATE public.travel_requests
  SET crm_prospect_id = v_prospect.id, assigned_business_id = p_business_id
  WHERE id = p_request_id;

  RETURN v_prospect;
END;
$$;

CREATE TABLE IF NOT EXISTS public.travel_quotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.business_profiles(id) ON DELETE CASCADE,
  request_id uuid REFERENCES public.travel_requests(id) ON DELETE SET NULL,
  client_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  total_amount numeric NOT NULL CHECK (total_amount >= 0),
  currency_id uuid REFERENCES public.currencies(id),
  quote_status travel_quote_status NOT NULL DEFAULT 'draft',
  valid_until timestamptz,
  created_by uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_travel_quotes_updated_at
  BEFORE UPDATE ON public.travel_quotes
  FOR EACH ROW EXECUTE FUNCTION public.travel_set_updated_at();

CREATE TABLE IF NOT EXISTS public.travelers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name text NOT NULL,
  last_name text,
  date_of_birth date,
  nationality_country_id uuid REFERENCES public.countries(id),
  relationship text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.travel_itineraries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  is_shared boolean NOT NULL DEFAULT false,
  share_token text UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_travel_itineraries_updated_at
  BEFORE UPDATE ON public.travel_itineraries
  FOR EACH ROW EXECUTE FUNCTION public.travel_set_updated_at();

CREATE TABLE IF NOT EXISTS public.travel_itinerary_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  itinerary_id uuid NOT NULL REFERENCES public.travel_itineraries(id) ON DELETE CASCADE,
  item_date date,
  item_time time,
  item_type text,
  title text NOT NULL,
  description text,
  destination_id uuid REFERENCES public.travel_destinations(id),
  booking_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_travel_requests_requester ON public.travel_requests (requester_user_id);
CREATE INDEX IF NOT EXISTS idx_travel_quotes_business ON public.travel_quotes (business_id);
CREATE INDEX IF NOT EXISTS idx_travel_quotes_client ON public.travel_quotes (client_user_id);
CREATE INDEX IF NOT EXISTS idx_travelers_owner ON public.travelers (owner_user_id);
CREATE INDEX IF NOT EXISTS idx_travel_itineraries_owner ON public.travel_itineraries (owner_user_id);
CREATE INDEX IF NOT EXISTS idx_travel_itinerary_items_itinerary ON public.travel_itinerary_items (itinerary_id);

-- ============================================================
-- Réservations (JDV PAY), documents, commissions
-- ============================================================

DO $$ BEGIN
  CREATE TYPE travel_booking_status AS ENUM ('pending','awaiting_payment','confirmed','cancelled','completed','expired','refunded','partially_refunded');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.travel_bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reference text UNIQUE DEFAULT ('JDVT-' || upper(substr(gen_random_uuid()::text,1,8))),
  buyer_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_id uuid REFERENCES public.business_profiles(id),
  resource_type travel_resource_type NOT NULL,
  resource_id uuid NOT NULL,
  quote_id uuid REFERENCES public.travel_quotes(id) ON DELETE SET NULL,
  start_date date,
  end_date date,
  travelers_count integer NOT NULL DEFAULT 1,
  amount numeric NOT NULL CHECK (amount > 0),
  currency_id uuid REFERENCES public.currencies(id),
  booking_status travel_booking_status NOT NULL DEFAULT 'pending',
  wallet_transaction_id uuid REFERENCES public.wallet_transactions(id),
  idempotency_key text UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_travel_bookings_updated_at
  BEFORE UPDATE ON public.travel_bookings
  FOR EACH ROW EXECUTE FUNCTION public.travel_set_updated_at();

ALTER TABLE public.travel_itinerary_items
  ADD CONSTRAINT fk_travel_itinerary_items_booking
  FOREIGN KEY (booking_id) REFERENCES public.travel_bookings(id) ON DELETE SET NULL;

CREATE OR REPLACE FUNCTION public.travel_confirm_booking(
  p_booking_id uuid,
  p_wallet_transaction_id uuid
) RETURNS public.travel_bookings
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  v_booking public.travel_bookings;
  v_tx public.wallet_transactions;
  v_avail public.travel_availability;
BEGIN
  SELECT * INTO v_booking FROM public.travel_bookings WHERE id = p_booking_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Réservation introuvable'; END IF;

  IF v_booking.booking_status = 'confirmed' THEN
    RETURN v_booking;
  END IF;

  SELECT * INTO v_tx FROM public.wallet_transactions WHERE id = p_wallet_transaction_id;
  IF NOT FOUND OR v_tx.transaction_status <> 'completed' THEN
    RAISE EXCEPTION 'Paiement JDV PAY non confirmé';
  END IF;

  IF v_booking.start_date IS NOT NULL THEN
    SELECT * INTO v_avail FROM public.travel_availability
    WHERE resource_type = v_booking.resource_type
      AND resource_id = v_booking.resource_id
      AND available_date = v_booking.start_date
    FOR UPDATE;

    IF FOUND THEN
      IF v_avail.reserved_units + v_booking.travelers_count > v_avail.total_units THEN
        RAISE EXCEPTION 'Capacité insuffisante pour cette date';
      END IF;
      UPDATE public.travel_availability
      SET reserved_units = reserved_units + v_booking.travelers_count
      WHERE id = v_avail.id;
    END IF;
  END IF;

  UPDATE public.travel_bookings
  SET booking_status = 'confirmed', wallet_transaction_id = p_wallet_transaction_id
  WHERE id = p_booking_id
  RETURNING * INTO v_booking;

  INSERT INTO public.audit_logs (user_id, module_code, action, entity_type, entity_id, new_data)
  VALUES (auth.uid(), 'travel', 'booking.confirmed', 'travel_bookings', p_booking_id::text, to_jsonb(v_booking));

  RETURN v_booking;
END;
$$;

CREATE TABLE IF NOT EXISTS public.travel_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  booking_id uuid REFERENCES public.travel_bookings(id) ON DELETE CASCADE,
  document_type text,
  name text NOT NULL,
  file_url text NOT NULL,
  is_public boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.travel_commissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.business_profiles(id) ON DELETE CASCADE,
  agent_id uuid REFERENCES public.travel_agents(id) ON DELETE SET NULL,
  guide_id uuid REFERENCES public.travel_guides(id) ON DELETE SET NULL,
  booking_id uuid REFERENCES public.travel_bookings(id) ON DELETE SET NULL,
  amount numeric NOT NULL CHECK (amount >= 0),
  currency_id uuid REFERENCES public.currencies(id),
  commission_status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_travel_commission_per_booking_agent
  ON public.travel_commissions (booking_id, agent_id) WHERE booking_id IS NOT NULL AND agent_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_travel_bookings_buyer ON public.travel_bookings (buyer_user_id);
CREATE INDEX IF NOT EXISTS idx_travel_bookings_business ON public.travel_bookings (business_id);
CREATE INDEX IF NOT EXISTS idx_travel_bookings_resource ON public.travel_bookings (resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_travel_documents_owner ON public.travel_documents (owner_user_id);
CREATE INDEX IF NOT EXISTS idx_travel_documents_booking ON public.travel_documents (booking_id);
CREATE INDEX IF NOT EXISTS idx_travel_commissions_business ON public.travel_commissions (business_id);

-- ============================================================
-- Favoris, avis, signalements + RLS complet
-- ============================================================

DO $$ BEGIN
  CREATE TYPE travel_target_type AS ENUM ('destination','accommodation','activity','tour','agency','guide');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE travel_review_status AS ENUM ('pending','published','rejected','hidden');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.travel_favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_type travel_target_type NOT NULL,
  target_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, target_type, target_id)
);

CREATE TABLE IF NOT EXISTS public.travel_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES public.travel_bookings(id) ON DELETE CASCADE,
  reviewer_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_type travel_target_type NOT NULL,
  target_id uuid NOT NULL,
  rating integer NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment text,
  review_status travel_review_status NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (booking_id, reviewer_user_id, target_type, target_id)
);

CREATE TABLE IF NOT EXISTS public.travel_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_type travel_target_type NOT NULL,
  target_id uuid NOT NULL,
  reason text NOT NULL,
  description text,
  report_status text NOT NULL DEFAULT 'pending',
  resolved_by uuid REFERENCES auth.users(id),
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_travel_favorites_user ON public.travel_favorites (user_id);
CREATE INDEX IF NOT EXISTS idx_travel_reviews_target ON public.travel_reviews (target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_travel_reports_target ON public.travel_reports (target_type, target_id);

ALTER TABLE public.travel_destinations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.travel_agencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.travel_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.travel_guides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.travel_accommodations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.travel_accommodation_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.travel_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.travel_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.travel_activity_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.travel_tours ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.travel_tour_stops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.travel_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.travel_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.travel_quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.travelers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.travel_itineraries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.travel_itinerary_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.travel_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.travel_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.travel_commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.travel_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.travel_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.travel_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY travel_destinations_select ON public.travel_destinations FOR SELECT USING (true);
CREATE POLICY travel_destinations_write ON public.travel_destinations FOR INSERT WITH CHECK (public.is_super_admin());
CREATE POLICY travel_destinations_update ON public.travel_destinations FOR UPDATE USING (public.is_super_admin());

CREATE POLICY travel_agencies_select ON public.travel_agencies FOR SELECT USING (true);
CREATE POLICY travel_agencies_write ON public.travel_agencies FOR INSERT WITH CHECK (public.user_has_business_access(business_id));
CREATE POLICY travel_agencies_update ON public.travel_agencies FOR UPDATE USING (public.user_has_business_access(business_id));

CREATE POLICY travel_agents_select ON public.travel_agents FOR SELECT USING (true);
CREATE POLICY travel_agents_write ON public.travel_agents FOR INSERT WITH CHECK (public.user_has_business_access(business_id));
CREATE POLICY travel_agents_update ON public.travel_agents FOR UPDATE USING (public.user_has_business_access(business_id));

CREATE POLICY travel_guides_select ON public.travel_guides FOR SELECT USING (true);
CREATE POLICY travel_guides_write ON public.travel_guides FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY travel_guides_update ON public.travel_guides FOR UPDATE
  USING (user_id = auth.uid() OR (business_id IS NOT NULL AND public.user_has_business_access(business_id)));

CREATE POLICY travel_accommodations_select ON public.travel_accommodations FOR SELECT
  USING (publish_status = 'published' OR public.user_has_business_access(business_id) OR public.is_super_admin());
CREATE POLICY travel_accommodations_write ON public.travel_accommodations FOR INSERT WITH CHECK (public.user_has_business_access(business_id));
CREATE POLICY travel_accommodations_update ON public.travel_accommodations FOR UPDATE USING (public.user_has_business_access(business_id));

CREATE POLICY travel_accommodation_media_select ON public.travel_accommodation_media FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.travel_accommodations a WHERE a.id = accommodation_id
    AND (a.publish_status='published' OR public.user_has_business_access(a.business_id))));
CREATE POLICY travel_accommodation_media_write ON public.travel_accommodation_media FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.travel_accommodations a WHERE a.id = accommodation_id AND public.user_has_business_access(a.business_id)));

CREATE POLICY travel_rooms_select ON public.travel_rooms FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.travel_accommodations a WHERE a.id = accommodation_id
    AND (a.publish_status='published' OR public.user_has_business_access(a.business_id))));
CREATE POLICY travel_rooms_write ON public.travel_rooms FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.travel_accommodations a WHERE a.id = accommodation_id AND public.user_has_business_access(a.business_id)));
CREATE POLICY travel_rooms_update ON public.travel_rooms FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.travel_accommodations a WHERE a.id = accommodation_id AND public.user_has_business_access(a.business_id)));

CREATE POLICY travel_activities_select ON public.travel_activities FOR SELECT
  USING (publish_status = 'published' OR public.user_has_business_access(business_id) OR public.is_super_admin());
CREATE POLICY travel_activities_write ON public.travel_activities FOR INSERT WITH CHECK (public.user_has_business_access(business_id));
CREATE POLICY travel_activities_update ON public.travel_activities FOR UPDATE USING (public.user_has_business_access(business_id));

CREATE POLICY travel_activity_media_select ON public.travel_activity_media FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.travel_activities a WHERE a.id = activity_id
    AND (a.publish_status='published' OR public.user_has_business_access(a.business_id))));
CREATE POLICY travel_activity_media_write ON public.travel_activity_media FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.travel_activities a WHERE a.id = activity_id AND public.user_has_business_access(a.business_id)));

CREATE POLICY travel_tours_select ON public.travel_tours FOR SELECT
  USING (publish_status = 'published' OR public.user_has_business_access(business_id) OR public.is_super_admin());
CREATE POLICY travel_tours_write ON public.travel_tours FOR INSERT WITH CHECK (public.user_has_business_access(business_id));
CREATE POLICY travel_tours_update ON public.travel_tours FOR UPDATE USING (public.user_has_business_access(business_id));

CREATE POLICY travel_tour_stops_select ON public.travel_tour_stops FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.travel_tours t WHERE t.id = tour_id
    AND (t.publish_status='published' OR public.user_has_business_access(t.business_id))));
CREATE POLICY travel_tour_stops_write ON public.travel_tour_stops FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.travel_tours t WHERE t.id = tour_id AND public.user_has_business_access(t.business_id)));

CREATE POLICY travel_availability_select ON public.travel_availability FOR SELECT USING (true);
CREATE POLICY travel_availability_write ON public.travel_availability FOR INSERT WITH CHECK (
  (resource_type = 'room' AND EXISTS (SELECT 1 FROM public.travel_rooms r JOIN public.travel_accommodations a ON a.id=r.accommodation_id WHERE r.id = resource_id AND public.user_has_business_access(a.business_id)))
  OR (resource_type = 'activity' AND EXISTS (SELECT 1 FROM public.travel_activities ac WHERE ac.id = resource_id AND public.user_has_business_access(ac.business_id)))
  OR (resource_type = 'tour' AND EXISTS (SELECT 1 FROM public.travel_tours t WHERE t.id = resource_id AND public.user_has_business_access(t.business_id)))
);
CREATE POLICY travel_availability_update ON public.travel_availability FOR UPDATE USING (
  (resource_type = 'room' AND EXISTS (SELECT 1 FROM public.travel_rooms r JOIN public.travel_accommodations a ON a.id=r.accommodation_id WHERE r.id = resource_id AND public.user_has_business_access(a.business_id)))
  OR (resource_type = 'activity' AND EXISTS (SELECT 1 FROM public.travel_activities ac WHERE ac.id = resource_id AND public.user_has_business_access(ac.business_id)))
  OR (resource_type = 'tour' AND EXISTS (SELECT 1 FROM public.travel_tours t WHERE t.id = resource_id AND public.user_has_business_access(t.business_id)))
);

CREATE POLICY travel_requests_select ON public.travel_requests FOR SELECT
  USING (requester_user_id = auth.uid() OR (assigned_business_id IS NOT NULL AND public.user_has_business_access(assigned_business_id)) OR public.is_super_admin());
CREATE POLICY travel_requests_insert ON public.travel_requests FOR INSERT WITH CHECK (requester_user_id = auth.uid());
CREATE POLICY travel_requests_update ON public.travel_requests FOR UPDATE
  USING (requester_user_id = auth.uid() OR (assigned_business_id IS NOT NULL AND public.user_has_business_access(assigned_business_id)));

CREATE POLICY travel_quotes_select ON public.travel_quotes FOR SELECT
  USING (client_user_id = auth.uid() OR public.user_has_business_access(business_id));
CREATE POLICY travel_quotes_write ON public.travel_quotes FOR INSERT WITH CHECK (public.user_has_business_access(business_id));
CREATE POLICY travel_quotes_update ON public.travel_quotes FOR UPDATE
  USING (client_user_id = auth.uid() OR public.user_has_business_access(business_id));

CREATE POLICY travelers_select ON public.travelers FOR SELECT USING (owner_user_id = auth.uid());
CREATE POLICY travelers_write ON public.travelers FOR INSERT WITH CHECK (owner_user_id = auth.uid());
CREATE POLICY travelers_update ON public.travelers FOR UPDATE USING (owner_user_id = auth.uid());
CREATE POLICY travelers_delete ON public.travelers FOR DELETE USING (owner_user_id = auth.uid());

CREATE POLICY travel_itineraries_select ON public.travel_itineraries FOR SELECT
  USING (owner_user_id = auth.uid() OR is_shared = true);
CREATE POLICY travel_itineraries_write ON public.travel_itineraries FOR INSERT WITH CHECK (owner_user_id = auth.uid());
CREATE POLICY travel_itineraries_update ON public.travel_itineraries FOR UPDATE USING (owner_user_id = auth.uid());
CREATE POLICY travel_itineraries_delete ON public.travel_itineraries FOR DELETE USING (owner_user_id = auth.uid());

CREATE POLICY travel_itinerary_items_select ON public.travel_itinerary_items FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.travel_itineraries i WHERE i.id = itinerary_id AND (i.owner_user_id = auth.uid() OR i.is_shared = true)));
CREATE POLICY travel_itinerary_items_write ON public.travel_itinerary_items FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.travel_itineraries i WHERE i.id = itinerary_id AND i.owner_user_id = auth.uid()));
CREATE POLICY travel_itinerary_items_delete ON public.travel_itinerary_items FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.travel_itineraries i WHERE i.id = itinerary_id AND i.owner_user_id = auth.uid()));

CREATE POLICY travel_bookings_select ON public.travel_bookings FOR SELECT
  USING (buyer_user_id = auth.uid() OR (business_id IS NOT NULL AND public.user_has_business_access(business_id)) OR public.is_super_admin());
CREATE POLICY travel_bookings_insert ON public.travel_bookings FOR INSERT WITH CHECK (buyer_user_id = auth.uid());
CREATE POLICY travel_bookings_update_business ON public.travel_bookings FOR UPDATE
  USING (business_id IS NOT NULL AND public.user_has_business_access(business_id));

CREATE POLICY travel_documents_select ON public.travel_documents FOR SELECT
  USING (is_public = true OR owner_user_id = auth.uid()
    OR (booking_id IS NOT NULL AND EXISTS (SELECT 1 FROM public.travel_bookings b WHERE b.id = booking_id AND b.business_id IS NOT NULL AND public.user_has_business_access(b.business_id))));
CREATE POLICY travel_documents_insert ON public.travel_documents FOR INSERT WITH CHECK (owner_user_id = auth.uid());

CREATE POLICY travel_commissions_select ON public.travel_commissions FOR SELECT
  USING (
    public.user_has_business_access(business_id)
    OR EXISTS (SELECT 1 FROM public.travel_agents a WHERE a.id = agent_id AND a.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.travel_guides g WHERE g.id = guide_id AND g.user_id = auth.uid())
  );
CREATE POLICY travel_commissions_write ON public.travel_commissions FOR INSERT WITH CHECK (public.user_has_business_access(business_id));

CREATE POLICY travel_favorites_select ON public.travel_favorites FOR SELECT USING (user_id = auth.uid());
CREATE POLICY travel_favorites_insert ON public.travel_favorites FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY travel_favorites_delete ON public.travel_favorites FOR DELETE USING (user_id = auth.uid());

CREATE POLICY travel_reviews_select ON public.travel_reviews FOR SELECT
  USING (review_status = 'published' OR reviewer_user_id = auth.uid() OR public.is_super_admin());
CREATE POLICY travel_reviews_insert ON public.travel_reviews FOR INSERT
  WITH CHECK (
    reviewer_user_id = auth.uid()
    AND EXISTS (SELECT 1 FROM public.travel_bookings b WHERE b.id = booking_id AND b.buyer_user_id = auth.uid())
  );

CREATE POLICY travel_reports_select ON public.travel_reports FOR SELECT
  USING (reporter_user_id = auth.uid() OR public.is_super_admin());
CREATE POLICY travel_reports_insert ON public.travel_reports FOR INSERT WITH CHECK (reporter_user_id = auth.uid());
