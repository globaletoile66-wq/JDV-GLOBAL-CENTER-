-- ============================================================
-- JDV TRANSIT & LOGISTICS — reconstitué depuis le schéma Supabase live
-- ============================================================

DO $do$ BEGIN CREATE TYPE public.transit_case_status AS ENUM ('draft','submitted','processing','awaiting_documents','awaiting_customs','in_transit','arrived','cleared','ready_for_delivery','delivered','cancelled','closed'); EXCEPTION WHEN duplicate_object THEN NULL; END $do$;
DO $do$ BEGIN CREATE TYPE public.transit_container_type AS ENUM ('dry','reefer','open_top','flat_rack','other'); EXCEPTION WHEN duplicate_object THEN NULL; END $do$;
DO $do$ BEGIN CREATE TYPE public.transit_customs_status AS ENUM ('pending','submitted','under_review','information_requested','cleared','rejected','on_hold'); EXCEPTION WHEN duplicate_object THEN NULL; END $do$;
DO $do$ BEGIN CREATE TYPE public.transit_invoice_status AS ENUM ('draft','issued','partially_paid','paid','overdue','cancelled'); EXCEPTION WHEN duplicate_object THEN NULL; END $do$;
DO $do$ BEGIN CREATE TYPE public.transit_location_type AS ENUM ('port','airport','warehouse','border','terminal','hub'); EXCEPTION WHEN duplicate_object THEN NULL; END $do$;
DO $do$ BEGIN CREATE TYPE public.transit_logistic_unit_type AS ENUM ('pallet','crate','carton','bag','container','package'); EXCEPTION WHEN duplicate_object THEN NULL; END $do$;
DO $do$ BEGIN CREATE TYPE public.transit_mode AS ENUM ('road','sea','air','rail','multimodal'); EXCEPTION WHEN duplicate_object THEN NULL; END $do$;
DO $do$ BEGIN CREATE TYPE public.transit_operation_type AS ENUM ('import','export','transit','national','international'); EXCEPTION WHEN duplicate_object THEN NULL; END $do$;
DO $do$ BEGIN CREATE TYPE public.transit_partner_type AS ENUM ('carrier','forwarder','warehouse_operator','handler','agent','supplier','service_provider'); EXCEPTION WHEN duplicate_object THEN NULL; END $do$;
DO $do$ BEGIN CREATE TYPE public.transit_payment_schedule_status AS ENUM ('pending','partially_paid','paid','overdue','cancelled'); EXCEPTION WHEN duplicate_object THEN NULL; END $do$;
DO $do$ BEGIN CREATE TYPE public.transit_quote_status AS ENUM ('draft','sent','viewed','accepted','rejected','expired','cancelled'); EXCEPTION WHEN duplicate_object THEN NULL; END $do$;
DO $do$ BEGIN CREATE TYPE public.transit_request_status AS ENUM ('open','quoted','converted','closed','cancelled'); EXCEPTION WHEN duplicate_object THEN NULL; END $do$;
DO $do$ BEGIN CREATE TYPE public.transit_tracking_status AS ENUM ('created','picked_up','loaded','departed','in_transit','arrived_port','customs_processing','cleared','warehouse','out_for_delivery','delivered'); EXCEPTION WHEN duplicate_object THEN NULL; END $do$;

CREATE TABLE IF NOT EXISTS public.transit_containers (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  shipment_id uuid,
  container_number text,
  container_type transit_container_type DEFAULT 'dry' NOT NULL,
  capacity_m3 numeric,
  weight_kg numeric,
  container_status text DEFAULT 'empty' NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.transit_operations (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  reference text UNIQUE DEFAULT ((('JDT-' || to_char(now(), 'YYYY')) || '-') || upper(substr((gen_random_uuid())::text, 1, 8))),
  client_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_id uuid REFERENCES business_profiles(id),
  operation_type transit_operation_type NOT NULL,
  origin_country_id uuid REFERENCES countries(id),
  origin_city text,
  destination_country_id uuid REFERENCES countries(id),
  destination_city text,
  mode transit_mode DEFAULT 'road' NOT NULL,
  case_status transit_case_status DEFAULT 'draft' NOT NULL,
  responsible_user_id uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.transit_containers ADD CONSTRAINT transit_containers_shipment_id_fkey FOREIGN KEY (shipment_id) REFERENCES transit_shipments(id) ON DELETE CASCADE;

CREATE TABLE IF NOT EXISTS public.transit_customs_cases (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  operation_id uuid NOT NULL REFERENCES transit_operations(id) ON DELETE CASCADE,
  country_id uuid REFERENCES countries(id),
  customs_status transit_customs_status DEFAULT 'pending' NOT NULL,
  notes text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.transit_customs_declarations (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  customs_case_id uuid NOT NULL REFERENCES transit_customs_cases(id) ON DELETE CASCADE,
  reference text,
  country_id uuid REFERENCES countries(id),
  declaration_type text,
  declaration_status transit_customs_status DEFAULT 'pending' NOT NULL,
  declared_amount numeric,
  currency_id uuid REFERENCES currencies(id),
  declared_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.transit_document_requirements (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  country_id uuid REFERENCES countries(id),
  operation_type transit_operation_type,
  mode transit_mode,
  document_type text NOT NULL,
  is_mandatory boolean DEFAULT true NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.transit_documents (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  operation_id uuid REFERENCES transit_operations(id) ON DELETE CASCADE,
  shipment_id uuid REFERENCES transit_shipments(id) ON DELETE CASCADE,
  document_type text,
  name text NOT NULL,
  file_url text NOT NULL,
  is_public boolean DEFAULT false NOT NULL,
  uploaded_by uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now() NOT NULL,
  CHECK ((operation_id IS NOT NULL) OR (shipment_id IS NOT NULL))
);

CREATE TABLE IF NOT EXISTS public.transit_goods (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  operation_id uuid NOT NULL REFERENCES transit_operations(id) ON DELETE CASCADE,
  description text NOT NULL,
  quantity numeric,
  weight_kg numeric,
  volume_m3 numeric,
  unit text,
  declared_value numeric,
  currency_id uuid REFERENCES currencies(id),
  category text,
  hs_code text,
  reference text,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.transit_invoices (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  business_id uuid NOT NULL REFERENCES business_profiles(id) ON DELETE CASCADE,
  client_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  operation_id uuid REFERENCES transit_operations(id) ON DELETE SET NULL,
  invoice_number text UNIQUE DEFAULT ('JDTI-' || upper(substr((gen_random_uuid())::text, 1, 8))),
  amount numeric NOT NULL CHECK (amount >= 0),
  currency_id uuid REFERENCES currencies(id),
  due_date date,
  invoice_status transit_invoice_status DEFAULT 'draft' NOT NULL,
  wallet_transaction_id uuid REFERENCES wallet_transactions(id),
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.transit_locations (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  location_type transit_location_type NOT NULL,
  name text NOT NULL,
  code text,
  country_id uuid REFERENCES countries(id),
  city text,
  latitude numeric,
  longitude numeric,
  is_active boolean DEFAULT true NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.transit_partners (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  business_id uuid REFERENCES business_profiles(id),
  partner_type transit_partner_type NOT NULL,
  name text NOT NULL,
  country_id uuid REFERENCES countries(id),
  contact_email text,
  contact_phone text,
  is_active boolean DEFAULT true NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.transit_shipments (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  reference text UNIQUE DEFAULT ('JDTL-' || upper(substr((gen_random_uuid())::text, 1, 8))),
  operation_id uuid NOT NULL REFERENCES transit_operations(id) ON DELETE CASCADE,
  shipper_name text,
  shipper_user_id uuid REFERENCES auth.users(id),
  consignee_name text,
  consignee_phone text,
  origin_location_id uuid REFERENCES transit_locations(id),
  destination_location_id uuid REFERENCES transit_locations(id),
  mode transit_mode DEFAULT 'road' NOT NULL,
  weight_kg numeric,
  volume_m3 numeric,
  quantity integer,
  declared_value numeric,
  currency_id uuid REFERENCES currencies(id),
  case_status transit_case_status DEFAULT 'draft' NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.transit_logistic_units (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  shipment_id uuid NOT NULL REFERENCES transit_shipments(id) ON DELETE CASCADE,
  unit_type transit_logistic_unit_type NOT NULL,
  reference text,
  quantity numeric DEFAULT 1 NOT NULL,
  weight_kg numeric,
  container_id uuid REFERENCES transit_containers(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.transit_packages (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  shipment_id uuid NOT NULL REFERENCES transit_shipments(id) ON DELETE CASCADE,
  package_number text,
  package_type text,
  weight_kg numeric,
  length_cm numeric,
  width_cm numeric,
  height_cm numeric,
  quantity integer DEFAULT 1 NOT NULL,
  package_status text DEFAULT 'created' NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.transit_payment_schedules (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  invoice_id uuid NOT NULL REFERENCES transit_invoices(id) ON DELETE CASCADE,
  due_date date NOT NULL,
  amount_due numeric NOT NULL CHECK (amount_due >= 0),
  amount_paid numeric DEFAULT 0 NOT NULL CHECK (amount_paid >= 0),
  remaining_amount numeric DEFAULT GREATEST((amount_due - amount_paid), 0::numeric),
  schedule_status transit_payment_schedule_status DEFAULT 'pending' NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.transit_quotes (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  business_id uuid NOT NULL REFERENCES business_profiles(id) ON DELETE CASCADE,
  client_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  operation_id uuid REFERENCES transit_operations(id) ON DELETE SET NULL,
  items jsonb DEFAULT '[]'::jsonb NOT NULL,
  total_amount numeric NOT NULL CHECK (total_amount >= 0),
  currency_id uuid REFERENCES currencies(id),
  quote_status transit_quote_status DEFAULT 'draft' NOT NULL,
  valid_until timestamptz,
  created_by uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.transit_reports (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  reporter_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  operation_id uuid REFERENCES transit_operations(id),
  partner_id uuid REFERENCES transit_partners(id),
  reason text NOT NULL,
  description text,
  report_status text DEFAULT 'pending' NOT NULL,
  resolved_by uuid REFERENCES auth.users(id),
  resolved_at timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.transit_requests (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  requester_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  operation_type transit_operation_type,
  origin_country_id uuid REFERENCES countries(id),
  destination_country_id uuid REFERENCES countries(id),
  description text,
  budget_max numeric,
  currency_id uuid REFERENCES currencies(id),
  request_status transit_request_status DEFAULT 'open' NOT NULL,
  crm_prospect_id uuid REFERENCES crm_prospects(id) ON DELETE SET NULL,
  assigned_business_id uuid REFERENCES business_profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.transit_shipment_legs (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  shipment_id uuid NOT NULL REFERENCES transit_shipments(id) ON DELETE CASCADE,
  leg_order integer DEFAULT 1 NOT NULL,
  origin_location_id uuid REFERENCES transit_locations(id),
  destination_location_id uuid REFERENCES transit_locations(id),
  mode transit_mode NOT NULL,
  transport_delivery_id uuid REFERENCES transport_deliveries(id) ON DELETE SET NULL,
  carrier_partner_id uuid REFERENCES transit_partners(id) ON DELETE SET NULL,
  planned_departure timestamptz,
  planned_arrival timestamptz,
  actual_departure timestamptz,
  actual_arrival timestamptz,
  leg_status transit_case_status DEFAULT 'draft' NOT NULL,
  external_reference text,
  UNIQUE (shipment_id, leg_order)
);

CREATE TABLE IF NOT EXISTS public.transit_storage_records (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  shipment_id uuid NOT NULL REFERENCES transit_shipments(id) ON DELETE CASCADE,
  warehouse_id uuid NOT NULL,
  entry_date timestamptz DEFAULT now() NOT NULL,
  exit_date timestamptz,
  quantity numeric,
  unit text,
  storage_rate numeric,
  currency_id uuid REFERENCES currencies(id),
  record_status text DEFAULT 'stored' NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.transit_warehouses (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  business_id uuid NOT NULL REFERENCES business_profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  location_id uuid REFERENCES transit_locations(id),
  capacity numeric,
  accepted_goods_types text[],
  is_active boolean DEFAULT true NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.transit_storage_records ADD CONSTRAINT transit_storage_records_warehouse_id_fkey FOREIGN KEY (warehouse_id) REFERENCES transit_warehouses(id) ON DELETE CASCADE;

CREATE TABLE IF NOT EXISTS public.transit_tracking_events (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  shipment_id uuid NOT NULL REFERENCES transit_shipments(id) ON DELETE CASCADE,
  event_status transit_tracking_status NOT NULL,
  location text,
  comment text,
  actor_user_id uuid REFERENCES auth.users(id),
  source_reference text,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_transit_containers_shipment ON transit_containers (shipment_id);
CREATE INDEX IF NOT EXISTS idx_transit_customs_cases_operation ON transit_customs_cases (operation_id);
CREATE INDEX IF NOT EXISTS idx_transit_documents_operation ON transit_documents (operation_id);
CREATE INDEX IF NOT EXISTS idx_transit_documents_shipment ON transit_documents (shipment_id);
CREATE INDEX IF NOT EXISTS idx_transit_goods_operation ON transit_goods (operation_id);
CREATE INDEX IF NOT EXISTS idx_transit_invoices_business ON transit_invoices (business_id);
CREATE INDEX IF NOT EXISTS idx_transit_invoices_business_status ON transit_invoices (business_id, invoice_status);
CREATE INDEX IF NOT EXISTS idx_transit_invoices_client ON transit_invoices (client_user_id);
CREATE INDEX IF NOT EXISTS idx_transit_logistic_units_shipment ON transit_logistic_units (shipment_id);
CREATE INDEX IF NOT EXISTS idx_transit_operations_business ON transit_operations (business_id);
CREATE INDEX IF NOT EXISTS idx_transit_operations_client ON transit_operations (client_user_id);
CREATE INDEX IF NOT EXISTS idx_transit_operations_status ON transit_operations (case_status);
CREATE INDEX IF NOT EXISTS idx_transit_packages_shipment ON transit_packages (shipment_id);
CREATE INDEX IF NOT EXISTS idx_transit_partners_business ON transit_partners (business_id);
CREATE INDEX IF NOT EXISTS idx_transit_payment_schedules_invoice ON transit_payment_schedules (invoice_id);
CREATE INDEX IF NOT EXISTS idx_transit_quotes_business ON transit_quotes (business_id);
CREATE INDEX IF NOT EXISTS idx_transit_quotes_business_status ON transit_quotes (business_id, quote_status);
CREATE INDEX IF NOT EXISTS idx_transit_quotes_client ON transit_quotes (client_user_id);
CREATE INDEX IF NOT EXISTS idx_transit_reports_operation ON transit_reports (operation_id);
CREATE INDEX IF NOT EXISTS idx_transit_requests_assigned_status ON transit_requests (assigned_business_id, request_status);
CREATE INDEX IF NOT EXISTS idx_transit_requests_requester ON transit_requests (requester_user_id);
CREATE INDEX IF NOT EXISTS idx_transit_shipment_legs_shipment ON transit_shipment_legs (shipment_id);
CREATE INDEX IF NOT EXISTS idx_transit_shipments_operation ON transit_shipments (operation_id);
CREATE INDEX IF NOT EXISTS idx_transit_shipments_operation_status ON transit_shipments (operation_id, case_status);
CREATE INDEX IF NOT EXISTS idx_transit_storage_records_shipment ON transit_storage_records (shipment_id);
CREATE INDEX IF NOT EXISTS idx_transit_tracking_events_created_at ON transit_tracking_events (created_at);
CREATE INDEX IF NOT EXISTS idx_transit_tracking_events_shipment ON transit_tracking_events (shipment_id);
CREATE INDEX IF NOT EXISTS idx_transit_tracking_events_shipment_created ON transit_tracking_events (shipment_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transit_warehouses_business ON transit_warehouses (business_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_transit_tracking_event_dedup ON transit_tracking_events (shipment_id, event_status, source_reference) WHERE (source_reference IS NOT NULL);

-- ============================================================
-- FONCTIONS
-- ============================================================

CREATE OR REPLACE FUNCTION public.transit_set_updated_at() RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public', 'pg_temp' AS $function$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$function$;

CREATE OR REPLACE FUNCTION public.transit_has_operation_access(p_operation_id uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $function$
  SELECT EXISTS (SELECT 1 FROM public.transit_operations o WHERE o.id = p_operation_id AND (o.client_user_id = auth.uid() OR o.responsible_user_id = auth.uid() OR (o.business_id IS NOT NULL AND public.user_has_business_access(o.business_id))))
  OR public.is_super_admin();
$function$;

CREATE OR REPLACE FUNCTION public.transit_has_shipment_access(p_shipment_id uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $function$
  SELECT public.transit_has_operation_access(operation_id) FROM public.transit_shipments WHERE id = p_shipment_id;
$function$;

CREATE OR REPLACE FUNCTION public.transit_audit_operation_status() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $function$
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.case_status IS DISTINCT FROM NEW.case_status THEN
    INSERT INTO public.audit_logs (user_id, module_code, action, entity_type, entity_id, old_data, new_data)
    VALUES (auth.uid(), 'transit', 'operation.status_changed', 'transit_operations', NEW.id::text, jsonb_build_object('status', OLD.case_status), jsonb_build_object('status', NEW.case_status));
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.transit_accept_quote(p_quote_id uuid) RETURNS transit_operations LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public', 'pg_temp' AS $function$
declare
  v_quote public.transit_quotes;
  v_operation public.transit_operations;
begin
  if auth.uid() is null then raise exception 'Authentification requise'; end if;
  select * into v_quote from public.transit_quotes where id = p_quote_id for update;
  if not found then raise exception 'Devis introuvable'; end if;
  if v_quote.client_user_id <> auth.uid() and not public.user_has_business_access(v_quote.business_id) and not public.is_super_admin() then
    raise exception 'Accès refusé';
  end if;
  if v_quote.operation_id is not null then
    select * into v_operation from public.transit_operations where id = v_quote.operation_id;
    if found then return v_operation; end if;
  end if;
  if v_quote.quote_status not in ('sent','viewed') then raise exception 'Le devis ne peut pas être accepté dans son état actuel'; end if;
  if v_quote.valid_until is not null and v_quote.valid_until < now() then raise exception 'Le devis est expiré'; end if;
  insert into public.transit_operations (client_user_id,business_id,operation_type,case_status)
  values (v_quote.client_user_id,v_quote.business_id,'international','submitted') returning * into v_operation;
  update public.transit_quotes set quote_status = 'accepted', operation_id = v_operation.id, updated_at = now() where id = p_quote_id;
  insert into public.audit_logs (user_id,module_code,action,entity_type,entity_id,new_data)
  values (auth.uid(),'transit','quote.accepted','transit_quotes',p_quote_id::text, jsonb_build_object('operation_id',v_operation.id));
  return v_operation;
end;
$function$;

CREATE OR REPLACE FUNCTION public.transit_add_tracking_event(p_shipment_id uuid, p_status text, p_location text DEFAULT NULL, p_comment text DEFAULT NULL, p_source_reference text DEFAULT NULL)
RETURNS transit_tracking_events LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public', 'pg_temp' AS $function$
declare
  v_shipment public.transit_shipments;
  v_event public.transit_tracking_events;
  v_new_status public.transit_tracking_status;
  v_latest_status public.transit_tracking_status;
begin
  if auth.uid() is null then raise exception 'Authentification requise'; end if;
  if p_status is null or trim(p_status) = '' then raise exception 'Statut de suivi requis'; end if;
  begin v_new_status := p_status::public.transit_tracking_status;
  exception when invalid_text_representation then raise exception 'Statut de suivi invalide'; end;
  select * into v_shipment from public.transit_shipments where id = p_shipment_id for update;
  if not found then raise exception 'Expédition introuvable'; end if;
  if not public.transit_has_shipment_access(p_shipment_id) and not public.is_super_admin() then raise exception 'Accès refusé'; end if;
  if p_source_reference is not null then
    select * into v_event from public.transit_tracking_events where shipment_id = p_shipment_id and event_status = v_new_status and source_reference = p_source_reference limit 1;
    if found then return v_event; end if;
  end if;
  select event_status into v_latest_status from public.transit_tracking_events where shipment_id = p_shipment_id order by created_at desc limit 1;
  if v_latest_status is not null and enum_range(null::public.transit_tracking_status) @> array[v_new_status]
     and (array_position(enum_range(null::public.transit_tracking_status), v_new_status) < array_position(enum_range(null::public.transit_tracking_status), v_latest_status)) then
    raise exception 'Le suivi ne peut pas revenir à un statut antérieur';
  end if;
  insert into public.transit_tracking_events (shipment_id, event_status, location, comment, actor_user_id, source_reference)
  values (p_shipment_id, v_new_status, p_location, p_comment, auth.uid(), p_source_reference) returning * into v_event;
  insert into public.audit_logs (user_id,module_code,action,entity_type,entity_id,new_data)
  values (auth.uid(),'transit','tracking.event_added','transit_tracking_events',v_event.id::text, jsonb_build_object('shipment_id',p_shipment_id,'status',v_new_status,'source_reference',p_source_reference));
  return v_event;
end;
$function$;

CREATE OR REPLACE FUNCTION public.transit_record_invoice_payment(p_invoice_id uuid, p_wallet_transaction_id uuid) RETURNS transit_invoices LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public', 'pg_temp' AS $function$
declare
  v_invoice public.transit_invoices;
  v_tx public.wallet_transactions;
  v_wallet public.wallets;
begin
  if auth.uid() is null then raise exception 'Authentification requise'; end if;
  select * into v_invoice from public.transit_invoices where id = p_invoice_id for update;
  if not found then raise exception 'Facture introuvable'; end if;
  if v_invoice.wallet_transaction_id = p_wallet_transaction_id then return v_invoice; end if;
  if v_invoice.wallet_transaction_id is not null then raise exception 'Cette facture possède déjà un paiement différent'; end if;
  if v_invoice.client_user_id <> auth.uid() and not public.user_has_business_access(v_invoice.business_id) and not public.is_super_admin() then raise exception 'Accès refusé'; end if;
  select wt.* into v_tx from public.wallet_transactions wt join public.wallets w on w.id = wt.wallet_id where wt.id = p_wallet_transaction_id for update;
  if not found then raise exception 'Paiement JDV PAY introuvable'; end if;
  select * into v_wallet from public.wallets where id = v_tx.wallet_id;
  if not found or v_wallet.user_id <> v_invoice.client_user_id then raise exception 'Le portefeuille de paiement ne correspond pas au client'; end if;
  if v_tx.transaction_status <> 'completed' then raise exception 'Paiement JDV PAY non confirmé'; end if;
  if v_tx.transaction_type not in ('withdrawal','payment','transfer_out') then raise exception 'La transaction JDV PAY ne correspond pas à un débit'; end if;
  if v_tx.currency_id <> v_invoice.currency_id then raise exception 'Devise du paiement incompatible avec la facture'; end if;
  if v_tx.amount <= 0 or v_tx.amount > v_invoice.amount then raise exception 'Montant du paiement invalide pour cette facture'; end if;
  if exists (select 1 from public.transit_invoices where wallet_transaction_id = p_wallet_transaction_id and id <> p_invoice_id) then
    raise exception 'Ce paiement est déjà utilisé par une autre facture';
  end if;
  update public.transit_invoices set wallet_transaction_id = p_wallet_transaction_id,
    invoice_status = case when v_tx.amount = v_invoice.amount then 'paid'::public.transit_invoice_status else 'partially_paid'::public.transit_invoice_status end,
    updated_at = now() where id = p_invoice_id returning * into v_invoice;
  insert into public.audit_logs (user_id,module_code,action,entity_type,entity_id,new_data)
  values (auth.uid(),'transit','invoice.payment_recorded','transit_invoices',p_invoice_id::text,
    jsonb_build_object('wallet_transaction_id',p_wallet_transaction_id,'amount',v_tx.amount,'currency_id',v_tx.currency_id,'invoice_status',v_invoice.invoice_status));
  return v_invoice;
end;
$function$;

CREATE OR REPLACE FUNCTION public.transit_request_to_crm_prospect(p_request_id uuid, p_business_id uuid) RETURNS crm_prospects LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public', 'pg_temp' AS $function$
declare
  v_request public.transit_requests;
  v_prospect public.crm_prospects;
  v_profile public.profiles;
begin
  if auth.uid() is null then raise exception 'Authentification requise'; end if;
  select * into v_request from public.transit_requests where id = p_request_id for update;
  if not found then raise exception 'Demande introuvable'; end if;
  if not (public.user_has_business_access(p_business_id) or public.is_super_admin()) then raise exception 'Accès refusé'; end if;
  if v_request.assigned_business_id is not null and v_request.assigned_business_id <> p_business_id then raise exception 'Demande déjà affectée à une autre entreprise'; end if;
  if v_request.crm_prospect_id is not null then
    select * into v_prospect from public.crm_prospects where id = v_request.crm_prospect_id;
    if not found then raise exception 'Prospect CRM référencé introuvable'; end if;
    if v_prospect.business_id <> p_business_id then raise exception 'Prospect CRM rattaché à une autre entreprise'; end if;
    return v_prospect;
  end if;
  select * into v_profile from public.profiles where id = v_request.requester_user_id;
  if not found then raise exception 'Profil du demandeur introuvable'; end if;
  insert into public.crm_prospects (business_id, first_name, last_name, phone, email, desired_product, requested_amount, prospect_status, created_by)
  values (p_business_id, coalesce(v_profile.first_name,'Prospect'), v_profile.last_name, v_profile.phone, v_profile.email,
    'Transit/Logistique (' || coalesce(v_request.operation_type::text,'n/a') || ')', v_request.budget_max, 'new', auth.uid())
  returning * into v_prospect;
  update public.transit_requests set crm_prospect_id = v_prospect.id, assigned_business_id = p_business_id, updated_at = now() where id = p_request_id;
  insert into public.audit_logs (user_id,module_code,action,entity_type,entity_id,new_data)
  values (auth.uid(),'transit','request.crm_prospect_created','transit_requests',p_request_id::text, jsonb_build_object('crm_prospect_id',v_prospect.id,'business_id',p_business_id));
  return v_prospect;
end;
$function$;

CREATE TRIGGER trg_transit_operations_updated_at BEFORE UPDATE ON public.transit_operations FOR EACH ROW EXECUTE FUNCTION transit_set_updated_at();
CREATE TRIGGER trg_transit_operations_status_audit AFTER UPDATE ON public.transit_operations FOR EACH ROW EXECUTE FUNCTION transit_audit_operation_status();
CREATE TRIGGER trg_transit_customs_cases_updated_at BEFORE UPDATE ON public.transit_customs_cases FOR EACH ROW EXECUTE FUNCTION transit_set_updated_at();
CREATE TRIGGER trg_transit_invoices_updated_at BEFORE UPDATE ON public.transit_invoices FOR EACH ROW EXECUTE FUNCTION transit_set_updated_at();
CREATE TRIGGER trg_transit_quotes_updated_at BEFORE UPDATE ON public.transit_quotes FOR EACH ROW EXECUTE FUNCTION transit_set_updated_at();
CREATE TRIGGER trg_transit_requests_updated_at BEFORE UPDATE ON public.transit_requests FOR EACH ROW EXECUTE FUNCTION transit_set_updated_at();
CREATE TRIGGER trg_transit_shipments_updated_at BEFORE UPDATE ON public.transit_shipments FOR EACH ROW EXECUTE FUNCTION transit_set_updated_at();

-- ============================================================
-- RLS
-- ============================================================
ALTER TABLE public.transit_containers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transit_customs_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transit_customs_declarations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transit_document_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transit_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transit_goods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transit_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transit_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transit_logistic_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transit_operations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transit_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transit_partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transit_payment_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transit_quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transit_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transit_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transit_shipment_legs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transit_shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transit_storage_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transit_tracking_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transit_warehouses ENABLE ROW LEVEL SECURITY;

CREATE POLICY transit_containers_select ON transit_containers FOR SELECT USING ((shipment_id IS NULL) OR transit_has_shipment_access(shipment_id));
CREATE POLICY transit_containers_write ON transit_containers FOR INSERT WITH CHECK ((shipment_id IS NULL) OR transit_has_shipment_access(shipment_id));
CREATE POLICY transit_customs_cases_select ON transit_customs_cases FOR SELECT USING (transit_has_operation_access(operation_id));
CREATE POLICY transit_customs_cases_update ON transit_customs_cases FOR UPDATE USING (transit_has_operation_access(operation_id)) WITH CHECK (transit_has_operation_access(operation_id));
CREATE POLICY transit_customs_cases_write ON transit_customs_cases FOR INSERT WITH CHECK (transit_has_operation_access(operation_id));
CREATE POLICY transit_customs_declarations_select ON transit_customs_declarations FOR SELECT USING (EXISTS (SELECT 1 FROM transit_customs_cases c WHERE c.id = transit_customs_declarations.customs_case_id AND transit_has_operation_access(c.operation_id)));
CREATE POLICY transit_customs_declarations_write ON transit_customs_declarations FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM transit_customs_cases c WHERE c.id = transit_customs_declarations.customs_case_id AND transit_has_operation_access(c.operation_id)));
CREATE POLICY transit_document_requirements_select ON transit_document_requirements FOR SELECT USING (true);
CREATE POLICY transit_document_requirements_write ON transit_document_requirements FOR INSERT WITH CHECK (is_super_admin());
CREATE POLICY transit_documents_insert ON transit_documents FOR INSERT WITH CHECK (uploaded_by = auth.uid());
CREATE POLICY transit_documents_select ON transit_documents FOR SELECT USING (is_public = true OR uploaded_by = auth.uid() OR (operation_id IS NOT NULL AND transit_has_operation_access(operation_id)) OR (shipment_id IS NOT NULL AND transit_has_shipment_access(shipment_id)));
CREATE POLICY transit_goods_select ON transit_goods FOR SELECT USING (transit_has_operation_access(operation_id));
CREATE POLICY transit_goods_write ON transit_goods FOR INSERT WITH CHECK (transit_has_operation_access(operation_id));
CREATE POLICY transit_invoices_select ON transit_invoices FOR SELECT USING (client_user_id = auth.uid() OR user_has_business_access(business_id));
CREATE POLICY transit_invoices_write ON transit_invoices FOR INSERT WITH CHECK (user_has_business_access(business_id));
CREATE POLICY transit_locations_select ON transit_locations FOR SELECT USING (true);
CREATE POLICY transit_locations_write ON transit_locations FOR INSERT WITH CHECK (is_super_admin());
CREATE POLICY transit_logistic_units_select ON transit_logistic_units FOR SELECT USING (transit_has_shipment_access(shipment_id));
CREATE POLICY transit_logistic_units_write ON transit_logistic_units FOR INSERT WITH CHECK (transit_has_shipment_access(shipment_id));
CREATE POLICY transit_operations_insert ON transit_operations FOR INSERT WITH CHECK (client_user_id = auth.uid());
CREATE POLICY transit_operations_select ON transit_operations FOR SELECT USING (client_user_id = auth.uid() OR responsible_user_id = auth.uid() OR (business_id IS NOT NULL AND user_has_business_access(business_id)) OR is_super_admin());
CREATE POLICY transit_operations_update ON transit_operations FOR UPDATE USING (responsible_user_id = auth.uid() OR (business_id IS NOT NULL AND user_has_business_access(business_id)) OR is_super_admin()) WITH CHECK (responsible_user_id = auth.uid() OR (business_id IS NOT NULL AND user_has_business_access(business_id)) OR is_super_admin());
CREATE POLICY transit_packages_select ON transit_packages FOR SELECT USING (transit_has_shipment_access(shipment_id));
CREATE POLICY transit_packages_write ON transit_packages FOR INSERT WITH CHECK (transit_has_shipment_access(shipment_id));
CREATE POLICY transit_partners_select ON transit_partners FOR SELECT USING ((business_id IS NOT NULL AND user_has_business_access(business_id)) OR is_super_admin());
CREATE POLICY transit_partners_update ON transit_partners FOR UPDATE USING ((business_id IS NOT NULL AND user_has_business_access(business_id)) OR is_super_admin()) WITH CHECK ((business_id IS NOT NULL AND user_has_business_access(business_id)) OR is_super_admin());
CREATE POLICY transit_partners_write ON transit_partners FOR INSERT WITH CHECK (business_id IS NULL OR user_has_business_access(business_id));
CREATE POLICY transit_payment_schedules_select ON transit_payment_schedules FOR SELECT USING (EXISTS (SELECT 1 FROM transit_invoices i WHERE i.id = transit_payment_schedules.invoice_id AND (i.client_user_id = auth.uid() OR user_has_business_access(i.business_id))));
CREATE POLICY transit_payment_schedules_write ON transit_payment_schedules FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM transit_invoices i WHERE i.id = transit_payment_schedules.invoice_id AND user_has_business_access(i.business_id)));
CREATE POLICY transit_quotes_select ON transit_quotes FOR SELECT USING (client_user_id = auth.uid() OR user_has_business_access(business_id));
CREATE POLICY transit_quotes_update ON transit_quotes FOR UPDATE USING (client_user_id = auth.uid() OR user_has_business_access(business_id)) WITH CHECK (client_user_id = auth.uid() OR user_has_business_access(business_id));
CREATE POLICY transit_quotes_write ON transit_quotes FOR INSERT WITH CHECK (user_has_business_access(business_id));
CREATE POLICY transit_reports_insert ON transit_reports FOR INSERT WITH CHECK (reporter_user_id = auth.uid());
CREATE POLICY transit_reports_select ON transit_reports FOR SELECT USING (reporter_user_id = auth.uid() OR is_super_admin());
CREATE POLICY transit_requests_insert ON transit_requests FOR INSERT WITH CHECK (requester_user_id = auth.uid());
CREATE POLICY transit_requests_select ON transit_requests FOR SELECT USING (requester_user_id = auth.uid() OR (assigned_business_id IS NOT NULL AND user_has_business_access(assigned_business_id)) OR is_super_admin());
CREATE POLICY transit_requests_update ON transit_requests FOR UPDATE USING (requester_user_id = auth.uid() OR (assigned_business_id IS NOT NULL AND user_has_business_access(assigned_business_id))) WITH CHECK (requester_user_id = auth.uid() OR (assigned_business_id IS NOT NULL AND user_has_business_access(assigned_business_id)));
CREATE POLICY transit_shipment_legs_select ON transit_shipment_legs FOR SELECT USING (transit_has_shipment_access(shipment_id));
CREATE POLICY transit_shipment_legs_update ON transit_shipment_legs FOR UPDATE USING (transit_has_shipment_access(shipment_id)) WITH CHECK (transit_has_shipment_access(shipment_id));
CREATE POLICY transit_shipment_legs_write ON transit_shipment_legs FOR INSERT WITH CHECK (transit_has_shipment_access(shipment_id));
CREATE POLICY transit_shipments_select ON transit_shipments FOR SELECT USING (transit_has_operation_access(operation_id));
CREATE POLICY transit_shipments_update ON transit_shipments FOR UPDATE USING (transit_has_operation_access(operation_id)) WITH CHECK (transit_has_operation_access(operation_id));
CREATE POLICY transit_shipments_write ON transit_shipments FOR INSERT WITH CHECK (transit_has_operation_access(operation_id));
CREATE POLICY transit_storage_records_select ON transit_storage_records FOR SELECT USING (transit_has_shipment_access(shipment_id));
CREATE POLICY transit_storage_records_write ON transit_storage_records FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM transit_warehouses w WHERE w.id = transit_storage_records.warehouse_id AND user_has_business_access(w.business_id)));
CREATE POLICY transit_tracking_events_select ON transit_tracking_events FOR SELECT USING (transit_has_shipment_access(shipment_id));
CREATE POLICY transit_tracking_events_write ON transit_tracking_events FOR INSERT WITH CHECK (transit_has_shipment_access(shipment_id));
CREATE POLICY transit_warehouses_select ON transit_warehouses FOR SELECT USING (user_has_business_access(business_id) OR is_super_admin());
CREATE POLICY transit_warehouses_update ON transit_warehouses FOR UPDATE USING (user_has_business_access(business_id)) WITH CHECK (user_has_business_access(business_id));
CREATE POLICY transit_warehouses_write ON transit_warehouses FOR INSERT WITH CHECK (user_has_business_access(business_id));
