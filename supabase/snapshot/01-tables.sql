-- LIVE SUPABASE TABLE DEFINITIONS (schema only)

CREATE TABLE IF NOT EXISTS public.academy_assessments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL,
  title text NOT NULL,
  max_score numeric NOT NULL DEFAULT 100,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.academy_courses (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  program_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  instructor_user_id uuid,
  starts_at timestamp with time zone,
  ends_at timestamp with time zone,
  capacity integer,
  status text NOT NULL DEFAULT 'planned'::text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.academy_enrollments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL,
  student_user_id uuid NOT NULL,
  enrollment_status text NOT NULL DEFAULT 'pending'::text,
  enrolled_at timestamp with time zone NOT NULL DEFAULT now(),
  completed_at timestamp with time zone
);

CREATE TABLE IF NOT EXISTS public.academy_lessons (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL,
  title text NOT NULL,
  lesson_order integer NOT NULL,
  content text,
  duration_minutes integer,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.academy_programs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  organization_id uuid,
  name text NOT NULL,
  description text,
  program_type text NOT NULL DEFAULT 'course'::text,
  duration_hours numeric,
  price numeric,
  currency_id uuid,
  status text NOT NULL DEFAULT 'draft'::text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.academy_results (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  assessment_id uuid NOT NULL,
  student_user_id uuid NOT NULL,
  score numeric NOT NULL,
  graded_by uuid,
  graded_at timestamp with time zone
);

CREATE TABLE IF NOT EXISTS public.agri_crops (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  farm_id uuid NOT NULL,
  name text NOT NULL,
  variety text,
  season text,
  planted_area_hectares numeric,
  planting_date date,
  expected_harvest_date date,
  actual_harvest_date date,
  expected_yield numeric,
  actual_yield numeric,
  unit text,
  status text NOT NULL DEFAULT 'planned'::text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.agri_farms (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  organization_id uuid,
  owner_user_id uuid,
  name text NOT NULL,
  farm_type text NOT NULL DEFAULT 'mixed'::text,
  country_id uuid,
  city text,
  address text,
  latitude numeric,
  longitude numeric,
  area_hectares numeric,
  status text NOT NULL DEFAULT 'active'::text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.agri_order_items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL,
  product_id uuid NOT NULL,
  quantity numeric NOT NULL,
  unit_price numeric NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.agri_orders (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  buyer_user_id uuid,
  organization_id uuid,
  status text NOT NULL DEFAULT 'pending'::text,
  total_amount numeric NOT NULL DEFAULT 0,
  currency_id uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.agri_production_records (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  crop_id uuid NOT NULL,
  record_date date NOT NULL DEFAULT CURRENT_DATE,
  activity_type text NOT NULL,
  quantity numeric,
  unit text,
  cost_amount numeric,
  currency_id uuid,
  notes text,
  recorded_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.agri_products (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  farm_id uuid,
  name text NOT NULL,
  product_type text NOT NULL,
  quantity numeric NOT NULL DEFAULT 0,
  unit text NOT NULL,
  unit_price numeric,
  currency_id uuid,
  availability_status text NOT NULL DEFAULT 'available'::text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.agriculture_farms (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  owner_user_id uuid NOT NULL,
  name text NOT NULL,
  crop_type text,
  area_hectares numeric,
  location text,
  status text NOT NULL DEFAULT 'active'::text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.agriculture_products (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  farm_id uuid,
  owner_user_id uuid NOT NULL,
  name text NOT NULL,
  product_type text,
  quantity numeric NOT NULL DEFAULT 0,
  unit text,
  price numeric,
  currency_id uuid,
  status text NOT NULL DEFAULT 'available'::text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ai_access_log (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  organization_id uuid,
  conversation_id uuid,
  action_type text NOT NULL,
  scope text,
  result_count integer,
  success boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ai_conversations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  organization_id uuid,
  title text,
  context jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'active'::text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ai_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL,
  user_id uuid NOT NULL,
  role text NOT NULL,
  content text NOT NULL,
  provider text,
  model text,
  token_input integer,
  token_output integer,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ai_model_catalog (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  provider text NOT NULL,
  model text NOT NULL,
  display_name text,
  input_cost_per_1m_tokens numeric NOT NULL DEFAULT 0,
  output_cost_per_1m_tokens numeric NOT NULL DEFAULT 0,
  is_enabled boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ai_org_policies (
  organization_id uuid NOT NULL,
  monthly_token_limit bigint NOT NULL DEFAULT 1000000,
  monthly_cost_limit numeric NOT NULL DEFAULT 100,
  default_model text NOT NULL DEFAULT 'gpt-4o-mini'::text,
  allowed_models text[] NOT NULL DEFAULT ARRAY['gpt-4o-mini'::text],
  is_enabled boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ai_provider_configs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  organization_id uuid,
  provider text NOT NULL,
  model text,
  api_key_secret_ref text,
  is_active boolean NOT NULL DEFAULT false,
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ai_usage (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  organization_id uuid,
  conversation_id uuid,
  provider text NOT NULL,
  model text,
  tokens_input bigint NOT NULL DEFAULT 0,
  tokens_output bigint NOT NULL DEFAULT 0,
  estimated_cost numeric(18,8) NOT NULL DEFAULT 0,
  currency_id uuid,
  request_reference text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  organization_id uuid,
  module_code text,
  action text NOT NULL,
  entity_type text,
  entity_id text,
  old_data jsonb,
  new_data jsonb,
  metadata jsonb,
  ip_address text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.bill_payments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  wallet_id uuid NOT NULL,
  biller_id uuid NOT NULL,
  account_number text NOT NULL,
  amount numeric(20,8) NOT NULL,
  currency_id uuid NOT NULL,
  fee_amount numeric(20,8) NOT NULL DEFAULT 0,
  reference text DEFAULT concat('BILL-', upper(substr((gen_random_uuid())::text, 1, 8))),
  payment_status transaction_status NOT NULL DEFAULT 'pending'::transaction_status,
  transaction_id uuid,
  idempotency_key text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.billers (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  code text NOT NULL,
  name text NOT NULL,
  category text NOT NULL,
  country_id uuid,
  logo_url text,
  is_active boolean NOT NULL DEFAULT false,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.business_appointments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL,
  client_id uuid,
  assigned_to uuid,
  created_by uuid NOT NULL,
  title character varying(200) NOT NULL,
  description text,
  appointment_status appointment_status NOT NULL DEFAULT 'scheduled'::appointment_status,
  start_at timestamp with time zone NOT NULL,
  end_at timestamp with time zone,
  location text,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.business_categories (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name character varying(100) NOT NULL,
  slug character varying(100) NOT NULL,
  description text,
  icon character varying(50),
  parent_id uuid,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.business_clients (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL,
  user_id uuid,
  first_name character varying(100),
  last_name character varying(100),
  company_name character varying(200),
  email character varying(255),
  phone character varying(50),
  address text,
  city character varying(100),
  country_id uuid,
  notes text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.business_documents (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL,
  uploaded_by uuid NOT NULL,
  name character varying(200) NOT NULL,
  document_type character varying(100),
  file_url text NOT NULL,
  file_size integer,
  mime_type character varying(100),
  is_public boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.business_expenses (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL,
  supplier_id uuid,
  created_by uuid NOT NULL,
  category character varying(100),
  description text NOT NULL,
  amount numeric(20,4) NOT NULL DEFAULT 0,
  currency_id uuid,
  expense_status expense_status NOT NULL DEFAULT 'pending'::expense_status,
  receipt_url text,
  expense_date date NOT NULL DEFAULT CURRENT_DATE,
  pay_transaction_id uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.business_invoices (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL,
  sale_id uuid,
  client_id uuid,
  created_by uuid NOT NULL,
  invoice_number character varying(50) NOT NULL,
  invoice_status invoice_status NOT NULL DEFAULT 'draft'::invoice_status,
  subtotal numeric(20,4) NOT NULL DEFAULT 0,
  discount_amount numeric(20,4) NOT NULL DEFAULT 0,
  tax_amount numeric(20,4) NOT NULL DEFAULT 0,
  total_amount numeric(20,4) NOT NULL DEFAULT 0,
  amount_paid numeric(20,4) NOT NULL DEFAULT 0,
  currency_id uuid,
  due_date date,
  issue_date date NOT NULL DEFAULT CURRENT_DATE,
  pay_transaction_id uuid,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.business_members (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL,
  user_id uuid NOT NULL,
  role business_member_role NOT NULL DEFAULT 'EMPLOYEE'::business_member_role,
  is_active boolean NOT NULL DEFAULT true,
  joined_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.business_orders (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL,
  client_id uuid,
  created_by uuid NOT NULL,
  order_number character varying(50) NOT NULL,
  order_status order_status NOT NULL DEFAULT 'pending'::order_status,
  total_amount numeric(20,4) NOT NULL DEFAULT 0,
  currency_id uuid,
  delivery_address text,
  notes text,
  ordered_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.business_product_categories (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL,
  name character varying(100) NOT NULL,
  description text,
  parent_id uuid,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.business_products (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL,
  category_id uuid,
  code character varying(100),
  name character varying(200) NOT NULL,
  description text,
  unit character varying(50),
  price numeric(20,4) NOT NULL DEFAULT 0,
  cost_price numeric(20,4),
  tax_rate numeric(5,2) NOT NULL DEFAULT 0,
  stock_quantity numeric(20,4) NOT NULL DEFAULT 0,
  min_stock_alert numeric(20,4),
  image_url text,
  is_active boolean NOT NULL DEFAULT true,
  is_service boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.business_profiles (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  owner_user_id uuid NOT NULL,
  category_id uuid,
  country_id uuid,
  currency_id uuid,
  name character varying(200) NOT NULL,
  trade_name character varying(200),
  description text,
  tagline character varying(300),
  logo_url text,
  cover_url text,
  phone character varying(50),
  email character varying(255),
  website character varying(500),
  address text,
  city character varying(100),
  region character varying(100),
  postal_code character varying(20),
  latitude numeric(10,7),
  longitude numeric(10,7),
  business_status business_status NOT NULL DEFAULT 'draft'::business_status,
  is_public boolean NOT NULL DEFAULT false,
  accepts_online_payment boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.business_sale_items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  sale_id uuid NOT NULL,
  product_id uuid,
  product_name character varying(200) NOT NULL,
  product_code character varying(100),
  quantity numeric(20,4) NOT NULL DEFAULT 1,
  unit_price numeric(20,4) NOT NULL DEFAULT 0,
  discount_percent numeric(5,2) NOT NULL DEFAULT 0,
  tax_rate numeric(5,2) NOT NULL DEFAULT 0,
  line_total numeric(20,4) NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.business_sales (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL,
  client_id uuid,
  created_by uuid NOT NULL,
  sale_number character varying(50) NOT NULL,
  sale_status sale_status NOT NULL DEFAULT 'pending'::sale_status,
  subtotal numeric(20,4) NOT NULL DEFAULT 0,
  discount_amount numeric(20,4) NOT NULL DEFAULT 0,
  tax_amount numeric(20,4) NOT NULL DEFAULT 0,
  total_amount numeric(20,4) NOT NULL DEFAULT 0,
  amount_paid numeric(20,4) NOT NULL DEFAULT 0,
  currency_id uuid,
  payment_method character varying(50),
  pay_transaction_id uuid,
  notes text,
  sale_date timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.business_suppliers (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL,
  name character varying(200) NOT NULL,
  contact_name character varying(200),
  email character varying(255),
  phone character varying(50),
  address text,
  city character varying(100),
  country_id uuid,
  notes text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.cashback_accounts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  balance numeric(20,8) NOT NULL DEFAULT 0,
  total_earned numeric(20,8) NOT NULL DEFAULT 0,
  total_redeemed numeric(20,8) NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.cashback_transactions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  cashback_account_id uuid NOT NULL,
  transaction_id uuid,
  cashback_type text NOT NULL DEFAULT 'earned'::text,
  amount numeric(20,8) NOT NULL,
  percentage numeric(8,4),
  source text,
  expires_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.countries (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  iso_code text NOT NULL,
  iso3_code text,
  name text NOT NULL,
  flag_emoji text,
  phone_code text,
  default_currency_id uuid,
  default_language_id uuid,
  timezone text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.crm_appointments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL,
  prospect_id uuid,
  client_id uuid,
  prospecteur_id uuid,
  title text,
  scheduled_at timestamp with time zone NOT NULL,
  location text,
  appointment_status crm_appointment_status NOT NULL DEFAULT 'scheduled'::crm_appointment_status,
  notes text,
  created_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.crm_collection_activities (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL,
  schedule_id uuid NOT NULL,
  actor_user_id uuid NOT NULL,
  activity_type crm_collection_activity_type NOT NULL,
  promised_amount numeric,
  promised_date date,
  promise_status crm_promise_status,
  comment text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.crm_commission_rules (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL,
  name text NOT NULL,
  commission_basis crm_commission_basis NOT NULL DEFAULT 'sale_amount'::crm_commission_basis,
  percentage numeric DEFAULT 0,
  fixed_amount numeric DEFAULT 0,
  category_id uuid,
  product_id uuid,
  prospecteur_id uuid,
  is_active boolean NOT NULL DEFAULT true,
  priority integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.crm_commissions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL,
  prospecteur_id uuid NOT NULL,
  sale_id uuid,
  payment_id uuid,
  rule_id uuid,
  amount numeric NOT NULL,
  currency_id uuid,
  commission_status crm_commission_status NOT NULL DEFAULT 'pending'::crm_commission_status,
  idempotency_key text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.crm_credit_terms (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  sale_id uuid NOT NULL,
  business_id uuid NOT NULL,
  client_id uuid NOT NULL,
  prospecteur_id uuid,
  down_payment numeric NOT NULL DEFAULT 0,
  financed_amount numeric NOT NULL,
  installments_count integer NOT NULL,
  frequency text NOT NULL DEFAULT 'monthly'::text,
  first_due_date date NOT NULL,
  last_due_date date,
  currency_id uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.crm_documents (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL,
  client_id uuid,
  prospect_id uuid,
  document_type text,
  name text NOT NULL,
  file_url text NOT NULL,
  is_public boolean NOT NULL DEFAULT false,
  uploaded_by uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.crm_payment_schedules (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  credit_term_id uuid NOT NULL,
  sale_id uuid NOT NULL,
  client_id uuid NOT NULL,
  installment_number integer NOT NULL,
  due_date date NOT NULL,
  amount_due numeric NOT NULL,
  amount_paid numeric NOT NULL DEFAULT 0,
  remaining_amount numeric DEFAULT GREATEST((amount_due - amount_paid), (0)::numeric),
  schedule_status crm_schedule_status NOT NULL DEFAULT 'pending'::crm_schedule_status,
  paid_at timestamp with time zone,
  currency_id uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  business_id uuid NOT NULL
);

CREATE TABLE IF NOT EXISTS public.crm_payments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL,
  schedule_id uuid,
  sale_id uuid,
  client_id uuid NOT NULL,
  amount numeric NOT NULL,
  currency_id uuid,
  payment_method text,
  jdv_pay_transaction_id uuid,
  idempotency_key text,
  recorded_by uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.crm_prospect_activities (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL,
  prospect_id uuid,
  client_id uuid,
  actor_user_id uuid NOT NULL,
  activity_type crm_activity_type NOT NULL,
  result text,
  comment text,
  next_action_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.crm_prospecteur_stocks (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL,
  prospecteur_id uuid NOT NULL,
  product_id uuid NOT NULL,
  quantity numeric NOT NULL DEFAULT 0,
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.crm_prospecteurs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL,
  user_id uuid NOT NULL,
  code text,
  prospecteur_status crm_prospecteur_status NOT NULL DEFAULT 'active'::crm_prospecteur_status,
  territory text,
  monthly_target numeric,
  commission_rate numeric,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.crm_prospects (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL,
  assigned_prospecteur_id uuid,
  first_name text NOT NULL,
  last_name text,
  phone text,
  email text,
  address text,
  country_id uuid,
  city text,
  latitude numeric,
  longitude numeric,
  meeting_place text,
  desired_product text,
  desired_product_code text,
  requested_amount numeric,
  appointment_at timestamp with time zone,
  temperature crm_prospect_temperature NOT NULL DEFAULT 'warm'::crm_prospect_temperature,
  prospect_status crm_prospect_status NOT NULL DEFAULT 'new'::crm_prospect_status,
  converted_client_id uuid,
  converted_at timestamp with time zone,
  last_contact_at timestamp with time zone,
  next_follow_up_at timestamp with time zone,
  contact_count integer NOT NULL DEFAULT 0,
  created_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  archived_at timestamp with time zone
);

CREATE TABLE IF NOT EXISTS public.crm_stock_movements (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL,
  product_id uuid NOT NULL,
  movement_type crm_stock_movement_type NOT NULL,
  quantity numeric NOT NULL,
  from_prospecteur_id uuid,
  to_prospecteur_id uuid,
  sale_id uuid,
  reference text,
  actor_user_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.crm_targets (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL,
  prospecteur_id uuid,
  period_type crm_target_period NOT NULL DEFAULT 'monthly'::crm_target_period,
  period_start date NOT NULL,
  period_end date NOT NULL,
  target_type text NOT NULL,
  target_value numeric NOT NULL,
  achieved_value numeric NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.currencies (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  code text NOT NULL,
  name text NOT NULL,
  symbol text NOT NULL,
  decimal_places integer NOT NULL DEFAULT 2,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.energy_assets (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  site_id uuid NOT NULL,
  asset_type text NOT NULL,
  serial_number text,
  capacity_kw numeric,
  installed_on date,
  status text NOT NULL DEFAULT 'active'::text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.energy_billing_records (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  site_id uuid NOT NULL,
  period_start date NOT NULL,
  period_end date NOT NULL,
  consumption_kwh numeric NOT NULL DEFAULT 0,
  amount numeric NOT NULL DEFAULT 0,
  currency_id uuid,
  status text NOT NULL DEFAULT 'pending'::text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.energy_meter_readings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  site_id uuid NOT NULL,
  reading_at timestamp with time zone NOT NULL DEFAULT now(),
  reading_value numeric NOT NULL,
  unit text NOT NULL DEFAULT 'kwh'::text,
  recorded_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.energy_providers (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  organization_id uuid,
  name text NOT NULL,
  provider_type text NOT NULL,
  country_id uuid,
  contact_phone text,
  contact_email text,
  status text NOT NULL DEFAULT 'active'::text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.energy_sites (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  organization_id uuid,
  owner_user_id uuid,
  provider_id uuid,
  name text NOT NULL,
  site_type text NOT NULL,
  address text,
  city text,
  latitude numeric,
  longitude numeric,
  capacity_kw numeric,
  status text NOT NULL DEFAULT 'active'::text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.exchange_rates (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  base_currency_id uuid NOT NULL,
  target_currency_id uuid NOT NULL,
  rate numeric(20,8) NOT NULL,
  source text,
  effective_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.exchange_transactions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  source_wallet_id uuid NOT NULL,
  destination_wallet_id uuid NOT NULL,
  source_amount numeric(20,8) NOT NULL,
  source_currency_id uuid NOT NULL,
  destination_amount numeric(20,8) NOT NULL,
  destination_currency_id uuid NOT NULL,
  exchange_rate numeric(20,8) NOT NULL,
  rate_source text,
  fee_amount numeric(20,8) NOT NULL DEFAULT 0,
  exchange_status transaction_status NOT NULL DEFAULT 'pending'::transaction_status,
  reference text DEFAULT concat('EXC-', upper(substr((gen_random_uuid())::text, 1, 8))),
  idempotency_key text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.fee_rules (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  operation_type text NOT NULL,
  fixed_amount numeric(20,8) NOT NULL DEFAULT 0,
  percentage numeric(8,4) NOT NULL DEFAULT 0,
  currency_id uuid,
  source_country_id uuid,
  destination_country_id uuid,
  provider_id uuid,
  minimum_amount numeric(20,8),
  maximum_amount numeric(20,8),
  is_active boolean NOT NULL DEFAULT true,
  priority integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.health_appointments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  patient_user_id uuid NOT NULL,
  professional_id uuid NOT NULL,
  business_id uuid,
  service_id uuid,
  scheduled_at timestamp with time zone NOT NULL,
  duration_minutes integer NOT NULL DEFAULT 30,
  appointment_status health_appointment_status NOT NULL DEFAULT 'requested'::health_appointment_status,
  price numeric,
  currency_id uuid,
  wallet_transaction_id uuid,
  idempotency_key text,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.health_availabilities (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  professional_id uuid NOT NULL,
  day_of_week integer,
  specific_date date,
  start_time time without time zone NOT NULL,
  end_time time without time zone NOT NULL,
  slot_duration_minutes integer NOT NULL DEFAULT 30,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.health_documents (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  owner_user_id uuid NOT NULL,
  business_id uuid,
  category health_document_category NOT NULL DEFAULT 'other'::health_document_category,
  name text NOT NULL,
  file_url text NOT NULL,
  confidentiality_level text NOT NULL DEFAULT 'private'::text,
  uploaded_by uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.health_emergency_contacts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  country_id uuid NOT NULL,
  service_type text NOT NULL,
  phone_number text NOT NULL,
  description text,
  is_active boolean NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS public.health_home_care_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  patient_user_id uuid NOT NULL,
  business_id uuid,
  professional_id uuid,
  service_type text NOT NULL,
  address text,
  latitude numeric,
  longitude numeric,
  scheduled_at timestamp with time zone,
  request_status health_home_care_status NOT NULL DEFAULT 'requested'::health_home_care_status,
  wallet_transaction_id uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.health_invoices (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  patient_user_id uuid NOT NULL,
  business_id uuid,
  appointment_id uuid,
  amount numeric NOT NULL,
  currency_id uuid,
  invoice_status health_invoice_status NOT NULL DEFAULT 'pending'::health_invoice_status,
  wallet_transaction_id uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.health_laboratory_orders (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  patient_user_id uuid NOT NULL,
  business_id uuid,
  ordering_professional_id uuid,
  test_type text NOT NULL,
  order_status health_lab_status NOT NULL DEFAULT 'requested'::health_lab_status,
  wallet_transaction_id uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.health_laboratory_results (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL,
  document_id uuid,
  summary text,
  released_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.health_medical_record_access_log (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  record_id uuid NOT NULL,
  accessor_user_id uuid NOT NULL,
  access_reason text,
  accessed_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.health_medical_records (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  patient_user_id uuid NOT NULL,
  author_professional_id uuid NOT NULL,
  business_id uuid,
  appointment_id uuid,
  record_type text NOT NULL DEFAULT 'consultation_note'::text,
  title text NOT NULL,
  content text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.health_patient_consents (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  patient_user_id uuid NOT NULL,
  grantee_professional_id uuid,
  grantee_business_id uuid,
  scope health_consent_scope NOT NULL DEFAULT 'medical_records'::health_consent_scope,
  consent_status health_consent_status NOT NULL DEFAULT 'active'::health_consent_status,
  granted_at timestamp with time zone NOT NULL DEFAULT now(),
  expires_at timestamp with time zone,
  revoked_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.health_prescription_items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  prescription_id uuid NOT NULL,
  medication_name text NOT NULL,
  dosage text,
  instructions text,
  duration text
);

CREATE TABLE IF NOT EXISTS public.health_prescriptions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  prescriber_professional_id uuid NOT NULL,
  patient_user_id uuid NOT NULL,
  appointment_id uuid,
  prescription_status health_prescription_status NOT NULL DEFAULT 'active'::health_prescription_status,
  document_id uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.health_professionals (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  business_id uuid,
  specialty_id uuid,
  sub_specialty text,
  country_id uuid,
  languages text[] DEFAULT '{}'::text[],
  experience_years integer,
  bio text,
  verification_status health_verification_status NOT NULL DEFAULT 'pending'::health_verification_status,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.health_provider_profiles (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL,
  provider_type health_provider_type NOT NULL,
  description text,
  address text,
  country_id uuid,
  city text,
  latitude numeric,
  longitude numeric,
  languages text[] DEFAULT '{}'::text[],
  verification_status health_verification_status NOT NULL DEFAULT 'pending'::health_verification_status,
  is_public boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.health_reviews (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  appointment_id uuid NOT NULL,
  reviewer_user_id uuid NOT NULL,
  target_type text NOT NULL,
  target_id uuid NOT NULL,
  rating integer NOT NULL,
  comment text,
  review_status text NOT NULL DEFAULT 'pending'::text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.health_services (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  business_id uuid,
  professional_id uuid,
  specialty_id uuid,
  service_type text NOT NULL DEFAULT 'consultation'::text,
  name text NOT NULL,
  description text,
  price numeric,
  currency_id uuid,
  duration_minutes integer,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.health_specialties (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  code text NOT NULL,
  name text NOT NULL,
  parent_id uuid,
  is_active boolean NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS public.health_verification_records (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  target_type text NOT NULL,
  target_id uuid NOT NULL,
  status health_verification_status NOT NULL DEFAULT 'pending'::health_verification_status,
  documents jsonb NOT NULL DEFAULT '[]'::jsonb,
  reviewed_by uuid,
  reviewed_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.immo_agencies (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL,
  license_number text,
  verification_status immo_verification_status NOT NULL DEFAULT 'unverified'::immo_verification_status,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.immo_agents (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL,
  user_id uuid NOT NULL,
  specialties text[],
  zones text[],
  verification_status immo_verification_status NOT NULL DEFAULT 'unverified'::immo_verification_status,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.immo_appointments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL,
  requester_user_id uuid NOT NULL,
  agent_id uuid,
  scheduled_at timestamp with time zone NOT NULL,
  location text,
  appointment_status immo_appointment_status NOT NULL DEFAULT 'requested'::immo_appointment_status,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.immo_commissions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL,
  agent_id uuid,
  property_id uuid,
  reservation_id uuid,
  lease_id uuid,
  amount numeric NOT NULL,
  currency_id uuid,
  commission_status immo_commission_status NOT NULL DEFAULT 'pending'::immo_commission_status,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.immo_developers (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL,
  verification_status immo_verification_status NOT NULL DEFAULT 'unverified'::immo_verification_status,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.immo_documents (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  property_id uuid,
  lease_id uuid,
  document_type text,
  name text NOT NULL,
  file_url text NOT NULL,
  is_public boolean NOT NULL DEFAULT false,
  uploaded_by uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.immo_favorites (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  property_id uuid,
  project_id uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.immo_leases (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL,
  tenant_user_id uuid NOT NULL,
  landlord_user_id uuid,
  landlord_business_id uuid,
  start_date date NOT NULL,
  end_date date,
  rent_amount numeric NOT NULL,
  currency_id uuid,
  frequency text NOT NULL DEFAULT 'monthly'::text,
  deposit_amount numeric DEFAULT 0,
  lease_status immo_lease_status NOT NULL DEFAULT 'draft'::immo_lease_status,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.immo_offers (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL,
  buyer_user_id uuid NOT NULL,
  agent_id uuid,
  amount numeric NOT NULL,
  currency_id uuid,
  conditions text,
  offer_status immo_offer_status NOT NULL DEFAULT 'submitted'::immo_offer_status,
  expires_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.immo_project_media (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL,
  url text NOT NULL,
  media_type text NOT NULL DEFAULT 'image'::text,
  sort_order integer NOT NULL DEFAULT 0,
  is_primary boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.immo_projects (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL,
  name text NOT NULL,
  description text,
  country_id uuid,
  city text,
  address text,
  latitude numeric,
  longitude numeric,
  project_status immo_project_status NOT NULL DEFAULT 'planned'::immo_project_status,
  launch_date date,
  estimated_delivery_date date,
  price_from numeric,
  currency_id uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.immo_properties (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  owner_user_id uuid,
  business_id uuid,
  listed_by_agent_id uuid,
  property_type_id uuid NOT NULL,
  title text NOT NULL,
  slug text NOT NULL,
  description text,
  country_id uuid,
  city text,
  district text,
  address text,
  hide_exact_address boolean NOT NULL DEFAULT true,
  latitude numeric,
  longitude numeric,
  surface numeric,
  land_surface numeric,
  bedrooms integer,
  bathrooms integer,
  parking_spaces integer,
  furnished boolean NOT NULL DEFAULT false,
  price numeric NOT NULL,
  currency_id uuid,
  transaction_type immo_transaction_type NOT NULL,
  property_status immo_property_status NOT NULL DEFAULT 'draft'::immo_property_status,
  verification_status immo_verification_status NOT NULL DEFAULT 'unverified'::immo_verification_status,
  published_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.immo_property_media (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL,
  url text NOT NULL,
  media_type text NOT NULL DEFAULT 'image'::text,
  sort_order integer NOT NULL DEFAULT 0,
  is_primary boolean NOT NULL DEFAULT false,
  is_public boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.immo_property_types (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  code text NOT NULL,
  name text NOT NULL,
  icon text,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.immo_rent_schedules (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  lease_id uuid NOT NULL,
  due_date date NOT NULL,
  amount_due numeric NOT NULL,
  amount_paid numeric NOT NULL DEFAULT 0,
  remaining_amount numeric DEFAULT GREATEST((amount_due - amount_paid), (0)::numeric),
  rent_status immo_rent_schedule_status NOT NULL DEFAULT 'pending'::immo_rent_schedule_status,
  wallet_transaction_id uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.immo_reports (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  reporter_user_id uuid NOT NULL,
  property_id uuid,
  agency_business_id uuid,
  reason text NOT NULL,
  description text,
  report_status immo_report_status NOT NULL DEFAULT 'pending'::immo_report_status,
  resolved_by uuid,
  resolved_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.immo_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  requester_user_id uuid NOT NULL,
  property_type_id uuid,
  transaction_type immo_transaction_type,
  country_id uuid,
  city text,
  budget_max numeric,
  currency_id uuid,
  bedrooms integer,
  surface_min numeric,
  criteria jsonb NOT NULL DEFAULT '{}'::jsonb,
  request_status immo_request_status NOT NULL DEFAULT 'open'::immo_request_status,
  crm_prospect_id uuid,
  assigned_business_id uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.immo_reservations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL,
  client_user_id uuid NOT NULL,
  amount numeric NOT NULL,
  currency_id uuid,
  reservation_status immo_reservation_status NOT NULL DEFAULT 'pending'::immo_reservation_status,
  wallet_transaction_id uuid,
  idempotency_key text,
  expires_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.immo_units (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL,
  property_id uuid,
  unit_type_id uuid,
  reference text,
  surface numeric,
  bedrooms integer,
  bathrooms integer,
  price numeric,
  currency_id uuid,
  unit_status immo_unit_status NOT NULL DEFAULT 'available'::immo_unit_status,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.insurance_claim_documents (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  claim_id uuid NOT NULL,
  storage_path text NOT NULL,
  document_type text NOT NULL,
  uploaded_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.insurance_claims (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  claim_number text NOT NULL,
  policy_id uuid NOT NULL,
  customer_id uuid NOT NULL,
  claim_type text NOT NULL,
  incident_date date NOT NULL,
  reported_at timestamp with time zone NOT NULL DEFAULT now(),
  description text NOT NULL,
  claimed_amount numeric(20,4) NOT NULL DEFAULT 0,
  approved_amount numeric(20,4) NOT NULL DEFAULT 0,
  paid_amount numeric(20,4) NOT NULL DEFAULT 0,
  currency_id uuid,
  status text NOT NULL DEFAULT 'submitted'::text,
  assigned_to uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.insurance_commissions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  policy_id uuid NOT NULL,
  beneficiary_user_id uuid,
  organization_id uuid,
  amount numeric(20,4) NOT NULL,
  currency_id uuid,
  status text NOT NULL DEFAULT 'pending'::text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.insurance_coverages (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  policy_id uuid NOT NULL,
  coverage_code text NOT NULL,
  name text NOT NULL,
  description text,
  coverage_limit numeric(20,4) NOT NULL DEFAULT 0,
  deductible_amount numeric(20,4) NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.insurance_customers (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  organization_id uuid,
  full_name text NOT NULL,
  phone text,
  email text,
  country_id uuid,
  identity_reference text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.insurance_payments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  policy_id uuid NOT NULL,
  schedule_id uuid,
  customer_id uuid NOT NULL,
  amount numeric(20,4) NOT NULL,
  currency_id uuid,
  wallet_transaction_id uuid,
  provider_transaction_id text,
  payment_reference text NOT NULL,
  status text NOT NULL DEFAULT 'pending'::text,
  paid_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.insurance_policies (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  policy_number text NOT NULL,
  customer_id uuid NOT NULL,
  product_id uuid NOT NULL,
  organization_id uuid,
  start_date date NOT NULL,
  end_date date NOT NULL,
  status text NOT NULL DEFAULT 'draft'::text,
  currency_id uuid,
  premium_amount numeric(20,4) NOT NULL,
  total_coverage_amount numeric(20,4) NOT NULL DEFAULT 0,
  payment_reference text,
  idempotency_key text,
  created_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.insurance_premium_schedules (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  policy_id uuid NOT NULL,
  due_date date NOT NULL,
  amount numeric(20,4) NOT NULL,
  currency_id uuid,
  status text NOT NULL DEFAULT 'due'::text,
  wallet_transaction_id uuid,
  paid_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.insurance_products (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  provider_id uuid NOT NULL,
  code text NOT NULL,
  name text NOT NULL,
  description text,
  insurance_type text NOT NULL,
  currency_id uuid,
  premium_frequency text NOT NULL DEFAULT 'monthly'::text,
  base_premium numeric(20,4) NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.insurance_providers (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  organization_id uuid,
  legal_name text NOT NULL,
  trade_name text,
  registration_number text,
  country_id uuid,
  phone text,
  email text,
  website text,
  verification_status text NOT NULL DEFAULT 'pending'::text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.kyc_documents (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  kyc_profile_id uuid NOT NULL,
  document_type text NOT NULL,
  file_url text NOT NULL,
  document_status kyc_status NOT NULL DEFAULT 'pending'::kyc_status,
  submitted_at timestamp with time zone NOT NULL DEFAULT now(),
  reviewed_at timestamp with time zone,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.kyc_profiles (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  kyc_level kyc_level NOT NULL DEFAULT 'unverified'::kyc_level,
  kyc_status kyc_status NOT NULL DEFAULT 'pending'::kyc_status,
  verification_date timestamp with time zone,
  expiration_date timestamp with time zone,
  verification_provider text,
  notes text,
  reviewed_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.languages (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  code text NOT NULL,
  name text NOT NULL,
  native_name text NOT NULL,
  direction lang_direction NOT NULL DEFAULT 'ltr'::lang_direction,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.marketplace_addresses (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  label text DEFAULT 'Domicile'::text,
  full_name text NOT NULL,
  phone text,
  address_line1 text NOT NULL,
  address_line2 text,
  city text NOT NULL,
  state text,
  postal_code text,
  country_id uuid,
  is_default boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.marketplace_cart_items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  cart_id uuid NOT NULL,
  listing_id uuid NOT NULL,
  quantity integer NOT NULL DEFAULT 1,
  unit_price numeric(18,2) NOT NULL,
  currency_id uuid,
  added_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.marketplace_carts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  session_id text,
  expires_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.marketplace_categories (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  parent_id uuid,
  name text NOT NULL,
  slug text NOT NULL,
  description text,
  icon_name text,
  image_url text,
  sort_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.marketplace_conversations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  buyer_id uuid NOT NULL,
  seller_id uuid NOT NULL,
  listing_id uuid,
  order_id uuid,
  last_message_at timestamp with time zone DEFAULT now(),
  buyer_unread_count integer DEFAULT 0,
  seller_unread_count integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.marketplace_coupons (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  seller_id uuid,
  code text NOT NULL,
  discount_type text NOT NULL DEFAULT 'percentage'::text,
  discount_value numeric(10,2) NOT NULL,
  minimum_order numeric(18,2),
  max_uses integer,
  used_count integer DEFAULT 0,
  starts_at timestamp with time zone,
  ends_at timestamp with time zone,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.marketplace_favorites (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  listing_id uuid,
  seller_id uuid,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.marketplace_listing_media (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL,
  url text NOT NULL,
  media_type text DEFAULT 'image'::text,
  alt_text text,
  sort_order integer DEFAULT 0,
  is_primary boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.marketplace_listings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  seller_id uuid NOT NULL,
  business_product_id uuid,
  category_id uuid,
  title text NOT NULL,
  slug text NOT NULL,
  description text,
  short_description text,
  sku text,
  price numeric(18,2) NOT NULL,
  compare_at_price numeric(18,2),
  currency_id uuid,
  stock_quantity integer DEFAULT 0,
  stock_reserved integer DEFAULT 0,
  track_inventory boolean DEFAULT true,
  allow_backorder boolean DEFAULT false,
  weight numeric(10,3),
  weight_unit text DEFAULT 'kg'::text,
  listing_status marketplace_listing_status DEFAULT 'draft'::marketplace_listing_status,
  is_featured boolean DEFAULT false,
  is_digital boolean DEFAULT false,
  tags text[],
  attributes jsonb DEFAULT '{}'::jsonb,
  metadata jsonb DEFAULT '{}'::jsonb,
  view_count integer DEFAULT 0,
  sale_count integer DEFAULT 0,
  rating_average numeric(3,2) DEFAULT 0,
  rating_count integer DEFAULT 0,
  published_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.marketplace_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL,
  sender_id uuid NOT NULL,
  content text NOT NULL,
  attachment_url text,
  message_status marketplace_message_status DEFAULT 'sent'::marketplace_message_status,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.marketplace_order_items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL,
  listing_id uuid NOT NULL,
  quantity integer NOT NULL,
  unit_price numeric(18,2) NOT NULL,
  total_price numeric(18,2) NOT NULL,
  currency_id uuid,
  listing_snapshot jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.marketplace_orders (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  order_number text NOT NULL,
  buyer_id uuid NOT NULL,
  seller_id uuid NOT NULL,
  delivery_address_id uuid,
  order_status marketplace_order_status DEFAULT 'pending'::marketplace_order_status,
  subtotal numeric(18,2) NOT NULL,
  shipping_cost numeric(18,2) DEFAULT 0,
  discount_amount numeric(18,2) DEFAULT 0,
  commission_amount numeric(18,2) DEFAULT 0,
  total_amount numeric(18,2) NOT NULL,
  currency_id uuid,
  payment_reference text,
  wallet_transaction_id uuid,
  notes text,
  tracking_number text,
  estimated_delivery timestamp with time zone,
  delivered_at timestamp with time zone,
  cancelled_at timestamp with time zone,
  cancellation_reason text,
  idempotency_key text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.marketplace_price_history (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL,
  old_price numeric(18,2) NOT NULL,
  new_price numeric(18,2) NOT NULL,
  changed_by uuid,
  changed_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.marketplace_promotions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  seller_id uuid NOT NULL,
  name text NOT NULL,
  discount_type text NOT NULL DEFAULT 'percentage'::text,
  discount_value numeric(10,2) NOT NULL,
  minimum_order numeric(18,2),
  max_uses integer,
  used_count integer DEFAULT 0,
  starts_at timestamp with time zone,
  ends_at timestamp with time zone,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.marketplace_refunds (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL,
  return_id uuid,
  buyer_id uuid NOT NULL,
  amount numeric(18,2) NOT NULL,
  currency_id uuid,
  refund_status marketplace_refund_status DEFAULT 'pending'::marketplace_refund_status,
  wallet_transaction_id uuid,
  reason text,
  processed_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.marketplace_reports (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  reporter_id uuid NOT NULL,
  listing_id uuid,
  seller_id uuid,
  review_id uuid,
  reason text NOT NULL,
  description text,
  report_status text DEFAULT 'pending'::text,
  resolved_by uuid,
  resolved_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.marketplace_returns (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL,
  buyer_id uuid NOT NULL,
  seller_id uuid NOT NULL,
  reason text NOT NULL,
  description text,
  evidence_urls text[],
  return_status marketplace_return_status DEFAULT 'requested'::marketplace_return_status,
  admin_notes text,
  resolved_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.marketplace_reviews (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL,
  listing_id uuid NOT NULL,
  reviewer_id uuid NOT NULL,
  seller_id uuid NOT NULL,
  rating integer NOT NULL,
  title text,
  comment text,
  seller_reply text,
  seller_replied_at timestamp with time zone,
  review_status marketplace_review_status DEFAULT 'pending'::marketplace_review_status,
  is_verified_purchase boolean DEFAULT true,
  helpful_count integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.marketplace_sellers (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  organization_id uuid,
  business_profile_id uuid,
  shop_name text NOT NULL,
  shop_slug text NOT NULL,
  description text,
  logo_url text,
  cover_url text,
  phone text,
  email text,
  website text,
  country_id uuid,
  city text,
  address text,
  seller_status marketplace_seller_status DEFAULT 'pending'::marketplace_seller_status,
  rating_average numeric(3,2) DEFAULT 0,
  rating_count integer DEFAULT 0,
  total_sales integer DEFAULT 0,
  commission_rate numeric(5,2) DEFAULT 5.00,
  is_verified boolean DEFAULT false,
  is_featured boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.marketplace_settlements (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  seller_id uuid NOT NULL,
  period_start timestamp with time zone NOT NULL,
  period_end timestamp with time zone NOT NULL,
  gross_amount numeric(18,2) NOT NULL,
  commission_amount numeric(18,2) NOT NULL,
  refund_amount numeric(18,2) DEFAULT 0,
  net_amount numeric(18,2) NOT NULL,
  currency_id uuid,
  settlement_status marketplace_settlement_status DEFAULT 'pending'::marketplace_settlement_status,
  wallet_transaction_id uuid,
  notes text,
  processed_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.marketplace_shipments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL,
  carrier text,
  tracking_number text,
  tracking_url text,
  shipment_status text DEFAULT 'preparing'::text,
  shipped_at timestamp with time zone,
  estimated_delivery timestamp with time zone,
  delivered_at timestamp with time zone,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.media_categories (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.media_channels (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  organization_id uuid,
  name text NOT NULL,
  channel_type text NOT NULL,
  handle text,
  website_url text,
  status text NOT NULL DEFAULT 'active'::text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.media_content_categories (
  content_id uuid NOT NULL,
  category_id uuid NOT NULL
);

CREATE TABLE IF NOT EXISTS public.media_content_metrics (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  content_id uuid NOT NULL,
  measured_at timestamp with time zone NOT NULL DEFAULT now(),
  views bigint NOT NULL DEFAULT 0,
  likes bigint NOT NULL DEFAULT 0,
  shares bigint NOT NULL DEFAULT 0,
  comments bigint NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.media_contents (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  channel_id uuid NOT NULL,
  author_user_id uuid,
  title text NOT NULL,
  slug text NOT NULL,
  content_type text NOT NULL,
  body text,
  media_url text,
  published_at timestamp with time zone,
  status text NOT NULL DEFAULT 'draft'::text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.modules (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  code text NOT NULL,
  name text NOT NULL,
  description text,
  icon text,
  category text,
  module_status module_status NOT NULL DEFAULT 'planned'::module_status,
  version text DEFAULT '0.0.1'::text,
  is_public boolean NOT NULL DEFAULT true,
  requires_subscription boolean NOT NULL DEFAULT false,
  sort_order integer DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  organization_id uuid,
  notification_type notification_type NOT NULL DEFAULT 'info'::notification_type,
  title text NOT NULL,
  message text,
  action_url text,
  is_read boolean NOT NULL DEFAULT false,
  read_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.organization_invitations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  email text NOT NULL,
  role_id uuid,
  token text NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'::text),
  invitation_status invitation_status NOT NULL DEFAULT 'pending'::invitation_status,
  invited_by uuid,
  expires_at timestamp with time zone NOT NULL DEFAULT (now() + '7 days'::interval),
  accepted_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.organization_members (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  user_id uuid NOT NULL,
  role_id uuid,
  member_status org_member_status NOT NULL DEFAULT 'active'::org_member_status,
  joined_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.organizations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  legal_name text,
  slug text,
  logo_url text,
  country_id uuid,
  default_language_id uuid,
  default_currency_id uuid,
  org_type text DEFAULT 'company'::text,
  org_status account_status NOT NULL DEFAULT 'active'::account_status,
  owner_id uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.pay_beneficiaries (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  owner_user_id uuid NOT NULL,
  name text NOT NULL,
  phone text,
  email text,
  country_id uuid,
  account_reference text,
  beneficiary_type beneficiary_type NOT NULL DEFAULT 'individual'::beneficiary_type,
  provider_id uuid,
  is_active boolean NOT NULL DEFAULT true,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.payment_methods (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  provider_id uuid,
  method_type text NOT NULL,
  display_name text NOT NULL,
  masked_identifier text,
  is_default boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.payment_provider_routes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  provider_id uuid NOT NULL,
  source_country_id uuid,
  destination_country_id uuid,
  source_currency_id uuid,
  destination_currency_id uuid,
  transfer_type transfer_type NOT NULL DEFAULT 'national'::transfer_type,
  is_active boolean NOT NULL DEFAULT false,
  estimated_delay_minutes integer,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.payment_providers (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  code text NOT NULL,
  name text NOT NULL,
  description text,
  provider_type text NOT NULL,
  is_active boolean NOT NULL DEFAULT false,
  supported_countries jsonb DEFAULT '[]'::jsonb,
  supported_currencies jsonb DEFAULT '[]'::jsonb,
  config jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.payment_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  requester_user_id uuid NOT NULL,
  requester_wallet_id uuid,
  amount numeric(20,8),
  currency_id uuid,
  description text,
  reference text DEFAULT concat('REQ-', upper(substr((gen_random_uuid())::text, 1, 8))),
  request_status payment_request_status NOT NULL DEFAULT 'pending'::payment_request_status,
  paid_by_user_id uuid,
  paid_transaction_id uuid,
  expires_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.payment_subscriptions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  wallet_id uuid NOT NULL,
  name text NOT NULL,
  description text,
  amount numeric(20,8) NOT NULL,
  currency_id uuid NOT NULL,
  frequency subscription_frequency NOT NULL DEFAULT 'monthly'::subscription_frequency,
  next_billing_date date NOT NULL,
  subscription_status subscription_status NOT NULL DEFAULT 'active'::subscription_status,
  payment_method_id uuid,
  biller_id uuid,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.permissions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  code text NOT NULL,
  name text NOT NULL,
  description text,
  module_code text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid NOT NULL,
  email text NOT NULL,
  first_name text,
  last_name text,
  full_name text,
  phone text,
  avatar_url text,
  country_id uuid,
  preferred_language_id uuid,
  preferred_currency_id uuid,
  timezone text DEFAULT 'UTC'::text,
  usage_type text,
  onboarding_completed boolean NOT NULL DEFAULT false,
  account_status account_status NOT NULL DEFAULT 'active'::account_status,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.pub_advertisers (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  organization_id uuid,
  user_id uuid,
  legal_name text NOT NULL,
  contact_email text,
  contact_phone text,
  status text NOT NULL DEFAULT 'active'::text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.pub_campaign_placements (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL,
  placement_id uuid NOT NULL,
  starts_at timestamp with time zone NOT NULL,
  ends_at timestamp with time zone NOT NULL,
  status text NOT NULL DEFAULT 'scheduled'::text
);

CREATE TABLE IF NOT EXISTS public.pub_campaigns (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  advertiser_id uuid NOT NULL,
  name text NOT NULL,
  objective text,
  starts_at timestamp with time zone,
  ends_at timestamp with time zone,
  budget_amount numeric NOT NULL DEFAULT 0,
  currency_id uuid,
  status text NOT NULL DEFAULT 'draft'::text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.pub_creatives (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL,
  media_url text NOT NULL,
  media_type text NOT NULL,
  duration_seconds integer,
  click_url text,
  approval_status text NOT NULL DEFAULT 'pending'::text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.pub_impressions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL,
  creative_id uuid,
  placement_id uuid,
  occurred_at timestamp with time zone NOT NULL DEFAULT now(),
  viewer_hash text,
  click_count integer NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.pub_placements (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  placement_type text NOT NULL,
  location_code text,
  price_per_day numeric,
  currency_id uuid,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.role_permissions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  role_id uuid NOT NULL,
  permission_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.roles (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  code text NOT NULL,
  name text NOT NULL,
  description text,
  is_system boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.social_comments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL,
  user_id uuid NOT NULL,
  body text NOT NULL,
  status text NOT NULL DEFAULT 'published'::text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.social_follows (
  follower_user_id uuid NOT NULL,
  following_user_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'active'::text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.social_posts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  author_user_id uuid NOT NULL,
  body text,
  media_url text,
  visibility text NOT NULL DEFAULT 'public'::text,
  status text NOT NULL DEFAULT 'published'::text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.social_profiles (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  username text NOT NULL,
  display_name text,
  bio text,
  avatar_url text,
  profile_status text NOT NULL DEFAULT 'active'::text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.social_reactions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL,
  user_id uuid NOT NULL,
  reaction_type text NOT NULL DEFAULT 'like'::text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.super_admins (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  admin_status super_admin_status NOT NULL DEFAULT 'active'::super_admin_status,
  granted_by uuid,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.system_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  key text NOT NULL,
  value text,
  value_type text NOT NULL DEFAULT 'string'::text,
  description text,
  is_public boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.tontine_contribution_schedules (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  cycle_id uuid NOT NULL,
  member_id uuid NOT NULL,
  period_number integer NOT NULL,
  due_on date NOT NULL,
  expected_amount numeric(20,2) NOT NULL,
  status text NOT NULL DEFAULT 'due'::text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  late_fee_amount numeric NOT NULL DEFAULT 0,
  late_marked_at timestamp with time zone,
  penalty_paid_amount numeric(20,2) NOT NULL DEFAULT 0,
  penalty_status text NOT NULL DEFAULT 'not_due'::text
);

CREATE TABLE IF NOT EXISTS public.tontine_contributions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  schedule_id uuid NOT NULL,
  member_id uuid NOT NULL,
  amount numeric(20,2) NOT NULL,
  currency_id uuid NOT NULL,
  paid_at timestamp with time zone NOT NULL DEFAULT now(),
  payment_method text NOT NULL DEFAULT 'jdv_pay'::text,
  wallet_transaction_id uuid,
  payment_request_id uuid,
  external_reference text,
  status text NOT NULL DEFAULT 'confirmed'::text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.tontine_cycles (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tontine_id uuid NOT NULL,
  cycle_number integer NOT NULL,
  starts_on date NOT NULL,
  ends_on date NOT NULL,
  status text NOT NULL DEFAULT 'planned'::text,
  total_expected numeric(20,2) NOT NULL DEFAULT 0,
  total_collected numeric(20,2) NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.tontine_financial_reconciliations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tontine_id uuid NOT NULL,
  cycle_id uuid,
  payout_id uuid,
  dispatch_id uuid,
  contribution_id uuid,
  reconciliation_type text NOT NULL,
  direction text NOT NULL,
  expected_amount numeric(20,2) NOT NULL,
  actual_amount numeric(20,2),
  difference numeric(20,2) DEFAULT (COALESCE(actual_amount, (0)::numeric) - expected_amount),
  currency_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending'::text,
  provider_code text,
  provider_reference text,
  source_reference text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  reconciled_at timestamp with time zone,
  reconciled_by uuid
);

CREATE TABLE IF NOT EXISTS public.tontine_join_links (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tontine_id uuid NOT NULL,
  token_hash text NOT NULL,
  invited_phone text,
  status text NOT NULL DEFAULT 'active'::text,
  expires_at timestamp with time zone,
  accepted_by uuid,
  accepted_at timestamp with time zone,
  rules_version text NOT NULL DEFAULT '1.0'::text,
  created_by uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  max_uses integer,
  uses_count integer NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.tontine_members (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tontine_id uuid NOT NULL,
  user_id uuid NOT NULL,
  role text NOT NULL DEFAULT 'member'::text,
  membership_status text NOT NULL DEFAULT 'pending'::text,
  joined_at timestamp with time zone,
  approved_by uuid,
  approved_at timestamp with time zone,
  contribution_count integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  rules_accepted_at timestamp with time zone,
  rules_version text,
  identity_confirmed_at timestamp with time zone,
  identity_confirmation_method text
);

CREATE TABLE IF NOT EXISTS public.tontine_payout_dispatches (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  payout_id uuid NOT NULL,
  rotation_id uuid NOT NULL,
  tontine_id uuid NOT NULL,
  beneficiary_member_id uuid NOT NULL,
  beneficiary_user_id uuid NOT NULL,
  beneficiary_phone text NOT NULL,
  amount numeric(20,2) NOT NULL,
  currency_id uuid NOT NULL,
  provider_code text,
  idempotency_key text NOT NULL,
  status text NOT NULL DEFAULT 'queued'::text,
  attempts integer NOT NULL DEFAULT 0,
  provider_request_id text,
  provider_reference text,
  last_error text,
  next_attempt_at timestamp with time zone,
  queued_at timestamp with time zone NOT NULL DEFAULT now(),
  processing_at timestamp with time zone,
  sent_at timestamp with time zone,
  confirmed_at timestamp with time zone,
  failed_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  provider_amount numeric(20,2),
  provider_currency_code text,
  provider_status text,
  provider_payload_hash text,
  reconciled_at timestamp with time zone,
  reconciliation_status text NOT NULL DEFAULT 'pending'::text,
  reversed_at timestamp with time zone
);

CREATE TABLE IF NOT EXISTS public.tontine_payouts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  rotation_id uuid NOT NULL,
  beneficiary_member_id uuid NOT NULL,
  amount numeric(20,2) NOT NULL,
  currency_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending'::text,
  approved_by uuid,
  approved_at timestamp with time zone,
  paid_at timestamp with time zone,
  wallet_transaction_id uuid,
  payment_request_id uuid,
  provider_reference text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  beneficiary_phone text
);

CREATE TABLE IF NOT EXISTS public.tontine_rotations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  cycle_id uuid NOT NULL,
  member_id uuid NOT NULL,
  rotation_order integer NOT NULL,
  planned_payout_on date,
  effective_payout_on date,
  expected_amount numeric(20,2) NOT NULL,
  status text NOT NULL DEFAULT 'planned'::text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  beneficiary_phone text
);

CREATE TABLE IF NOT EXISTS public.tontines (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  country_id uuid,
  currency_id uuid NOT NULL,
  name text NOT NULL,
  description text,
  contribution_amount numeric(20,2) NOT NULL,
  frequency text NOT NULL,
  cycle_periods integer NOT NULL,
  member_limit integer NOT NULL,
  late_fee_amount numeric(20,2) NOT NULL DEFAULT 0,
  rules jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'draft'::text,
  starts_on date,
  ends_on date,
  created_by uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  president_member_id uuid
);

CREATE TABLE IF NOT EXISTS public.transaction_fees (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  transaction_id uuid,
  transfer_id uuid,
  fee_rule_id uuid,
  fee_amount numeric(20,8) NOT NULL,
  currency_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.transaction_limits (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  operation_type text NOT NULL,
  kyc_level kyc_level NOT NULL DEFAULT 'unverified'::kyc_level,
  minimum_amount numeric(20,8),
  maximum_amount numeric(20,8),
  daily_limit numeric(20,8),
  monthly_limit numeric(20,8),
  currency_id uuid,
  country_id uuid,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.transfer_events (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  transfer_id uuid NOT NULL,
  event_type text NOT NULL,
  old_status transaction_status,
  new_status transaction_status,
  actor_user_id uuid,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.transfers (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  sender_user_id uuid NOT NULL,
  sender_wallet_id uuid NOT NULL,
  recipient_user_id uuid,
  recipient_wallet_id uuid,
  beneficiary_id uuid,
  provider_id uuid,
  route_id uuid,
  transfer_type transfer_type NOT NULL DEFAULT 'national'::transfer_type,
  send_amount numeric(20,8) NOT NULL,
  send_currency_id uuid NOT NULL,
  receive_amount numeric(20,8),
  receive_currency_id uuid,
  exchange_rate numeric(20,8),
  fee_amount numeric(20,8) NOT NULL DEFAULT 0,
  fee_currency_id uuid,
  reference text DEFAULT concat('TRF-', upper(substr((gen_random_uuid())::text, 1, 8))),
  transfer_status transaction_status NOT NULL DEFAULT 'pending'::transaction_status,
  description text,
  metadata jsonb DEFAULT '{}'::jsonb,
  idempotency_key text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.transit_containers (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  shipment_id uuid,
  container_number text,
  container_type transit_container_type NOT NULL DEFAULT 'dry'::transit_container_type,
  capacity_m3 numeric,
  weight_kg numeric,
  container_status text NOT NULL DEFAULT 'empty'::text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.transit_customs_cases (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  operation_id uuid NOT NULL,
  country_id uuid,
  customs_status transit_customs_status NOT NULL DEFAULT 'pending'::transit_customs_status,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.transit_customs_declarations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  customs_case_id uuid NOT NULL,
  reference text,
  country_id uuid,
  declaration_type text,
  declaration_status transit_customs_status NOT NULL DEFAULT 'pending'::transit_customs_status,
  declared_amount numeric,
  currency_id uuid,
  declared_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.transit_document_requirements (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  country_id uuid,
  operation_type transit_operation_type,
  mode transit_mode,
  document_type text NOT NULL,
  is_mandatory boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.transit_documents (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  operation_id uuid,
  shipment_id uuid,
  document_type text,
  name text NOT NULL,
  file_url text NOT NULL,
  is_public boolean NOT NULL DEFAULT false,
  uploaded_by uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.transit_goods (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  operation_id uuid NOT NULL,
  description text NOT NULL,
  quantity numeric,
  weight_kg numeric,
  volume_m3 numeric,
  unit text,
  declared_value numeric,
  currency_id uuid,
  category text,
  hs_code text,
  reference text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.transit_invoices (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL,
  client_user_id uuid NOT NULL,
  operation_id uuid,
  invoice_number text DEFAULT ('JDTI-'::text || upper(substr((gen_random_uuid())::text, 1, 8))),
  amount numeric NOT NULL,
  currency_id uuid,
  due_date date,
  invoice_status transit_invoice_status NOT NULL DEFAULT 'draft'::transit_invoice_status,
  wallet_transaction_id uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.transit_locations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  location_type transit_location_type NOT NULL,
  name text NOT NULL,
  code text,
  country_id uuid,
  city text,
  latitude numeric,
  longitude numeric,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.transit_logistic_units (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  shipment_id uuid NOT NULL,
  unit_type transit_logistic_unit_type NOT NULL,
  reference text,
  quantity numeric NOT NULL DEFAULT 1,
  weight_kg numeric,
  container_id uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.transit_operations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  reference text DEFAULT ((('JDT-'::text || to_char(now(), 'YYYY'::text)) || '-'::text) || upper(substr((gen_random_uuid())::text, 1, 8))),
  client_user_id uuid NOT NULL,
  business_id uuid,
  operation_type transit_operation_type NOT NULL,
  origin_country_id uuid,
  origin_city text,
  destination_country_id uuid,
  destination_city text,
  mode transit_mode NOT NULL DEFAULT 'road'::transit_mode,
  case_status transit_case_status NOT NULL DEFAULT 'draft'::transit_case_status,
  responsible_user_id uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.transit_packages (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  shipment_id uuid NOT NULL,
  package_number text,
  package_type text,
  weight_kg numeric,
  length_cm numeric,
  width_cm numeric,
  height_cm numeric,
  quantity integer NOT NULL DEFAULT 1,
  package_status text NOT NULL DEFAULT 'created'::text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.transit_partners (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  business_id uuid,
  partner_type transit_partner_type NOT NULL,
  name text NOT NULL,
  country_id uuid,
  contact_email text,
  contact_phone text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.transit_payment_schedules (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  invoice_id uuid NOT NULL,
  due_date date NOT NULL,
  amount_due numeric NOT NULL,
  amount_paid numeric NOT NULL DEFAULT 0,
  remaining_amount numeric DEFAULT GREATEST((amount_due - amount_paid), (0)::numeric),
  schedule_status transit_payment_schedule_status NOT NULL DEFAULT 'pending'::transit_payment_schedule_status,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.transit_quotes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL,
  client_user_id uuid NOT NULL,
  operation_id uuid,
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  total_amount numeric NOT NULL,
  currency_id uuid,
  quote_status transit_quote_status NOT NULL DEFAULT 'draft'::transit_quote_status,
  valid_until timestamp with time zone,
  created_by uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.transit_reports (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  reporter_user_id uuid NOT NULL,
  operation_id uuid,
  partner_id uuid,
  reason text NOT NULL,
  description text,
  report_status text NOT NULL DEFAULT 'pending'::text,
  resolved_by uuid,
  resolved_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.transit_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  requester_user_id uuid NOT NULL,
  operation_type transit_operation_type,
  origin_country_id uuid,
  destination_country_id uuid,
  description text,
  budget_max numeric,
  currency_id uuid,
  request_status transit_request_status NOT NULL DEFAULT 'open'::transit_request_status,
  crm_prospect_id uuid,
  assigned_business_id uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.transit_shipment_legs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  shipment_id uuid NOT NULL,
  leg_order integer NOT NULL DEFAULT 1,
  origin_location_id uuid,
  destination_location_id uuid,
  mode transit_mode NOT NULL,
  transport_delivery_id uuid,
  carrier_partner_id uuid,
  planned_departure timestamp with time zone,
  planned_arrival timestamp with time zone,
  actual_departure timestamp with time zone,
  actual_arrival timestamp with time zone,
  leg_status transit_case_status NOT NULL DEFAULT 'draft'::transit_case_status,
  external_reference text
);

CREATE TABLE IF NOT EXISTS public.transit_shipments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  reference text DEFAULT ('JDTL-'::text || upper(substr((gen_random_uuid())::text, 1, 8))),
  operation_id uuid NOT NULL,
  shipper_name text,
  shipper_user_id uuid,
  consignee_name text,
  consignee_phone text,
  origin_location_id uuid,
  destination_location_id uuid,
  mode transit_mode NOT NULL DEFAULT 'road'::transit_mode,
  weight_kg numeric,
  volume_m3 numeric,
  quantity integer,
  declared_value numeric,
  currency_id uuid,
  case_status transit_case_status NOT NULL DEFAULT 'draft'::transit_case_status,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.transit_storage_records (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  shipment_id uuid NOT NULL,
  warehouse_id uuid NOT NULL,
  entry_date timestamp with time zone NOT NULL DEFAULT now(),
  exit_date timestamp with time zone,
  quantity numeric,
  unit text,
  storage_rate numeric,
  currency_id uuid,
  record_status text NOT NULL DEFAULT 'stored'::text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.transit_tracking_events (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  shipment_id uuid NOT NULL,
  event_status transit_tracking_status NOT NULL,
  location text,
  comment text,
  actor_user_id uuid,
  source_reference text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.transit_warehouses (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL,
  name text NOT NULL,
  location_id uuid,
  capacity numeric,
  accepted_goods_types text[],
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.transport_bookings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  reference text DEFAULT ('JDVTR-'::text || upper(substr((gen_random_uuid())::text, 1, 8))),
  passenger_user_id uuid NOT NULL,
  business_id uuid,
  service_type_id uuid NOT NULL,
  vehicle_id uuid,
  driver_id uuid,
  pickup_address text,
  pickup_latitude numeric,
  pickup_longitude numeric,
  destination_address text,
  destination_latitude numeric,
  destination_longitude numeric,
  scheduled_at timestamp with time zone,
  passengers_count integer NOT NULL DEFAULT 1,
  distance_km numeric,
  duration_minutes numeric,
  estimated_price numeric,
  final_price numeric,
  currency_id uuid,
  booking_status transport_booking_status NOT NULL DEFAULT 'requested'::transport_booking_status,
  wallet_transaction_id uuid,
  idempotency_key text,
  cancelled_by uuid,
  cancellation_reason text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.transport_commissions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  business_id uuid,
  driver_id uuid,
  booking_id uuid,
  delivery_id uuid,
  amount numeric NOT NULL,
  currency_id uuid,
  commission_status text NOT NULL DEFAULT 'pending'::text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.transport_deliveries (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  reference text DEFAULT ('JDVT-'::text || upper(substr((gen_random_uuid())::text, 1, 8))),
  sender_user_id uuid NOT NULL,
  recipient_name text NOT NULL,
  recipient_phone text,
  business_id uuid,
  driver_id uuid,
  vehicle_id uuid,
  pickup_address text NOT NULL,
  pickup_latitude numeric,
  pickup_longitude numeric,
  destination_address text NOT NULL,
  destination_latitude numeric,
  destination_longitude numeric,
  source_module text,
  source_reference text,
  price numeric,
  currency_id uuid,
  delivery_status transport_delivery_status NOT NULL DEFAULT 'created'::transport_delivery_status,
  wallet_transaction_id uuid,
  idempotency_key text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.transport_delivery_events (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  delivery_id uuid NOT NULL,
  event_status transport_delivery_status NOT NULL,
  location text,
  comment text,
  actor_user_id uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.transport_delivery_proofs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  delivery_id uuid NOT NULL,
  proof_type text NOT NULL,
  proof_url text,
  otp_code text,
  confirmed_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.transport_driver_availability (
  driver_id uuid NOT NULL,
  availability_status transport_availability_status NOT NULL DEFAULT 'offline'::transport_availability_status,
  current_latitude numeric,
  current_longitude numeric,
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.transport_driver_documents (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  driver_id uuid NOT NULL,
  document_type text NOT NULL,
  file_url text NOT NULL,
  verification_status transport_verification_status NOT NULL DEFAULT 'submitted'::transport_verification_status,
  expires_at date,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.transport_drivers (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  business_id uuid,
  driver_status transport_driver_status NOT NULL DEFAULT 'pending'::transport_driver_status,
  verification_status transport_verification_status NOT NULL DEFAULT 'unverified'::transport_verification_status,
  languages text[] DEFAULT '{}'::text[],
  zones text[] DEFAULT '{}'::text[],
  service_type_ids uuid[] DEFAULT '{}'::uuid[],
  primary_vehicle_id uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.transport_parcels (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  delivery_id uuid NOT NULL,
  description text,
  weight_kg numeric,
  length_cm numeric,
  width_cm numeric,
  height_cm numeric,
  quantity integer NOT NULL DEFAULT 1,
  declared_value numeric,
  currency_id uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.transport_pricing_rules (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  business_id uuid,
  service_type_id uuid NOT NULL,
  vehicle_type_id uuid,
  country_id uuid,
  currency_id uuid,
  base_fare numeric NOT NULL DEFAULT 0,
  per_km_fare numeric NOT NULL DEFAULT 0,
  per_minute_fare numeric NOT NULL DEFAULT 0,
  minimum_fare numeric NOT NULL DEFAULT 0,
  waiting_fee_per_minute numeric NOT NULL DEFAULT 0,
  night_surcharge_percent numeric NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.transport_rentals (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  vehicle_id uuid NOT NULL,
  renter_user_id uuid NOT NULL,
  business_id uuid,
  driver_id uuid,
  start_at timestamp with time zone NOT NULL,
  end_at timestamp with time zone NOT NULL,
  price numeric NOT NULL,
  currency_id uuid,
  rental_status transport_rental_status NOT NULL DEFAULT 'pending'::transport_rental_status,
  wallet_transaction_id uuid,
  idempotency_key text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.transport_reports (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  reporter_user_id uuid NOT NULL,
  target_type text NOT NULL,
  target_id uuid,
  reason text NOT NULL,
  description text,
  report_status text NOT NULL DEFAULT 'pending'::text,
  resolved_by uuid,
  resolved_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.transport_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  requester_user_id uuid NOT NULL,
  request_type text NOT NULL,
  description text,
  country_id uuid,
  budget_max numeric,
  currency_id uuid,
  request_status transport_request_status NOT NULL DEFAULT 'open'::transport_request_status,
  crm_prospect_id uuid,
  assigned_business_id uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.transport_reviews (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  booking_id uuid,
  delivery_id uuid,
  reviewer_user_id uuid NOT NULL,
  target_type transport_review_target NOT NULL,
  target_id uuid NOT NULL,
  rating integer NOT NULL,
  comment text,
  review_status transport_review_status NOT NULL DEFAULT 'pending'::transport_review_status,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.transport_routes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL,
  name text NOT NULL,
  origin_city text NOT NULL,
  origin_country_id uuid,
  destination_city text NOT NULL,
  destination_country_id uuid,
  distance_km numeric,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.transport_schedules (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  route_id uuid NOT NULL,
  vehicle_id uuid,
  driver_id uuid,
  departure_at timestamp with time zone NOT NULL,
  arrival_at_estimated timestamp with time zone,
  capacity integer NOT NULL,
  price numeric NOT NULL,
  currency_id uuid,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.transport_seat_reservations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  schedule_id uuid NOT NULL,
  seat_id uuid NOT NULL,
  passenger_user_id uuid NOT NULL,
  price numeric NOT NULL,
  currency_id uuid,
  reservation_status text NOT NULL DEFAULT 'pending'::text,
  wallet_transaction_id uuid,
  idempotency_key text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.transport_seats (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  schedule_id uuid NOT NULL,
  seat_number text NOT NULL,
  seat_status transport_seat_status NOT NULL DEFAULT 'available'::transport_seat_status
);

CREATE TABLE IF NOT EXISTS public.transport_service_types (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  code text NOT NULL,
  name text NOT NULL,
  country_id uuid,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.transport_stops (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  route_id uuid NOT NULL,
  stop_order integer NOT NULL,
  city text NOT NULL,
  address text,
  latitude numeric,
  longitude numeric
);

CREATE TABLE IF NOT EXISTS public.transport_vehicle_documents (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  vehicle_id uuid NOT NULL,
  document_type text NOT NULL,
  file_url text NOT NULL,
  verification_status transport_verification_status NOT NULL DEFAULT 'submitted'::transport_verification_status,
  expires_at date,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.transport_vehicle_types (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  code text NOT NULL,
  name text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.transport_vehicles (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  owner_user_id uuid,
  business_id uuid,
  vehicle_type_id uuid NOT NULL,
  brand text,
  model text,
  year integer,
  plate_number text NOT NULL,
  capacity integer,
  color text,
  vehicle_status transport_vehicle_status NOT NULL DEFAULT 'active'::transport_vehicle_status,
  verification_status transport_verification_status NOT NULL DEFAULT 'unverified'::transport_verification_status,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.travel_accommodation_media (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  accommodation_id uuid NOT NULL,
  url text NOT NULL,
  is_primary boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.travel_accommodations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL,
  destination_id uuid,
  accommodation_type text NOT NULL DEFAULT 'hotel'::text,
  name text NOT NULL,
  slug text,
  description text,
  address text,
  latitude numeric,
  longitude numeric,
  capacity integer,
  amenities jsonb NOT NULL DEFAULT '[]'::jsonb,
  publish_status travel_publish_status NOT NULL DEFAULT 'draft'::travel_publish_status,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.travel_activities (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL,
  destination_id uuid,
  name text NOT NULL,
  description text,
  duration_minutes integer,
  capacity integer,
  price numeric NOT NULL,
  currency_id uuid,
  publish_status travel_publish_status NOT NULL DEFAULT 'draft'::travel_publish_status,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.travel_activity_media (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  activity_id uuid NOT NULL,
  url text NOT NULL,
  is_primary boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.travel_agencies (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL,
  license_number text,
  verification_status travel_verification_status NOT NULL DEFAULT 'unverified'::travel_verification_status,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.travel_agents (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL,
  user_id uuid NOT NULL,
  specialties text[] DEFAULT '{}'::text[],
  zones text[] DEFAULT '{}'::text[],
  verification_status travel_verification_status NOT NULL DEFAULT 'unverified'::travel_verification_status,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.travel_availability (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  resource_type travel_resource_type NOT NULL,
  resource_id uuid NOT NULL,
  available_date date NOT NULL,
  total_units integer NOT NULL DEFAULT 1,
  reserved_units integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.travel_bookings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  reference text DEFAULT ('JDVT-'::text || upper(substr((gen_random_uuid())::text, 1, 8))),
  buyer_user_id uuid NOT NULL,
  business_id uuid,
  resource_type travel_resource_type NOT NULL,
  resource_id uuid NOT NULL,
  quote_id uuid,
  start_date date,
  end_date date,
  travelers_count integer NOT NULL DEFAULT 1,
  amount numeric NOT NULL,
  currency_id uuid,
  booking_status travel_booking_status NOT NULL DEFAULT 'pending'::travel_booking_status,
  wallet_transaction_id uuid,
  idempotency_key text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.travel_commissions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL,
  agent_id uuid,
  guide_id uuid,
  booking_id uuid,
  amount numeric NOT NULL,
  currency_id uuid,
  commission_status text NOT NULL DEFAULT 'pending'::text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.travel_destinations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  country_id uuid,
  city text,
  name text NOT NULL,
  slug text,
  description text,
  short_description text,
  image_url text,
  latitude numeric,
  longitude numeric,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.travel_documents (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  owner_user_id uuid NOT NULL,
  booking_id uuid,
  document_type text,
  name text NOT NULL,
  file_url text NOT NULL,
  is_public boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.travel_favorites (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  target_type travel_target_type NOT NULL,
  target_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.travel_guides (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  business_id uuid,
  languages text[] DEFAULT '{}'::text[],
  destinations uuid[] DEFAULT '{}'::uuid[],
  specialties text[] DEFAULT '{}'::text[],
  verification_status travel_verification_status NOT NULL DEFAULT 'unverified'::travel_verification_status,
  is_available boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.travel_itineraries (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  owner_user_id uuid NOT NULL,
  title text NOT NULL,
  is_shared boolean NOT NULL DEFAULT false,
  share_token text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.travel_itinerary_items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  itinerary_id uuid NOT NULL,
  item_date date,
  item_time time without time zone,
  item_type text,
  title text NOT NULL,
  description text,
  destination_id uuid,
  booking_id uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.travel_quotes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL,
  request_id uuid,
  client_user_id uuid NOT NULL,
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  total_amount numeric NOT NULL,
  currency_id uuid,
  quote_status travel_quote_status NOT NULL DEFAULT 'draft'::travel_quote_status,
  valid_until timestamp with time zone,
  created_by uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.travel_reports (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  reporter_user_id uuid NOT NULL,
  target_type travel_target_type NOT NULL,
  target_id uuid NOT NULL,
  reason text NOT NULL,
  description text,
  report_status text NOT NULL DEFAULT 'pending'::text,
  resolved_by uuid,
  resolved_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.travel_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  requester_user_id uuid NOT NULL,
  destination_id uuid,
  travel_type text,
  start_date date,
  end_date date,
  travelers_count integer NOT NULL DEFAULT 1,
  budget_max numeric,
  currency_id uuid,
  notes text,
  request_status travel_request_status NOT NULL DEFAULT 'open'::travel_request_status,
  crm_prospect_id uuid,
  assigned_business_id uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.travel_reviews (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL,
  reviewer_user_id uuid NOT NULL,
  target_type travel_target_type NOT NULL,
  target_id uuid NOT NULL,
  rating integer NOT NULL,
  comment text,
  review_status travel_review_status NOT NULL DEFAULT 'pending'::travel_review_status,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.travel_rooms (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  accommodation_id uuid NOT NULL,
  name text NOT NULL,
  room_type text,
  capacity integer NOT NULL DEFAULT 1,
  bed_count integer,
  price_per_night numeric NOT NULL,
  currency_id uuid,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.travel_tour_stops (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tour_id uuid NOT NULL,
  destination_id uuid,
  stop_order integer NOT NULL DEFAULT 1,
  day_offset integer NOT NULL DEFAULT 0,
  description text,
  duration_hours numeric
);

CREATE TABLE IF NOT EXISTS public.travel_tours (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  duration_days integer NOT NULL,
  capacity integer,
  price numeric NOT NULL,
  currency_id uuid,
  guide_id uuid,
  publish_status travel_publish_status NOT NULL DEFAULT 'draft'::travel_publish_status,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.travelers (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  owner_user_id uuid NOT NULL,
  first_name text NOT NULL,
  last_name text,
  date_of_birth date,
  nationality_country_id uuid,
  relationship text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_favorites (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  module_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_module_access (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  module_id uuid NOT NULL,
  organization_id uuid,
  is_active boolean NOT NULL DEFAULT true,
  granted_at timestamp with time zone NOT NULL DEFAULT now(),
  expires_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_recent_services (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  module_id uuid NOT NULL,
  accessed_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.wallet_transactions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  wallet_id uuid NOT NULL,
  transaction_type transaction_type NOT NULL,
  amount numeric(20,8) NOT NULL,
  currency_id uuid NOT NULL,
  balance_before numeric(20,8) NOT NULL,
  balance_after numeric(20,8) NOT NULL,
  fee_amount numeric(20,8) NOT NULL DEFAULT 0,
  fee_currency_id uuid,
  reference text,
  external_reference text,
  provider text,
  provider_transaction_id text,
  transaction_status transaction_status NOT NULL DEFAULT 'pending'::transaction_status,
  description text,
  metadata jsonb,
  related_transaction_id uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.wallets (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  organization_id uuid,
  currency_id uuid NOT NULL,
  balance numeric(20,8) NOT NULL DEFAULT 0,
  available_balance numeric(20,8) NOT NULL DEFAULT 0,
  pending_balance numeric(20,8) NOT NULL DEFAULT 0,
  wallet_status wallet_status NOT NULL DEFAULT 'active'::wallet_status,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.webhook_events (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  provider text NOT NULL,
  event_type text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  signature text,
  webhook_status webhook_event_status NOT NULL DEFAULT 'received'::webhook_event_status,
  idempotency_key text,
  processed_at timestamp with time zone,
  error_message text,
  retry_count integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);
