-- ============================================================
-- JDV PAY MODULE — MIGRATION
-- Version: 1.0.0
-- Depends on: 20260918000000_jdv_core_foundation.sql
-- ============================================================
-- IMPORTANT: This migration NEVER recreates JDV CORE tables.
-- It only adds JDV PAY-specific tables that reference CORE tables.
-- ============================================================

-- ============================================================
-- 1. ENUM TYPES FOR JDV PAY
-- ============================================================

DO $$ BEGIN
  CREATE TYPE public.wallet_status AS ENUM ('active', 'suspended', 'locked', 'closed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.transaction_type AS ENUM (
    'deposit', 'withdrawal', 'payment', 'transfer_out', 'transfer_in',
    'refund', 'exchange', 'fee', 'adjustment', 'cashback'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.transaction_status AS ENUM (
    'pending', 'processing', 'completed', 'failed', 'cancelled', 'reversed', 'refunded'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.transfer_type AS ENUM ('national', 'regional', 'international');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.kyc_level AS ENUM ('unverified', 'basic', 'verified', 'enhanced');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.kyc_status AS ENUM ('pending', 'under_review', 'approved', 'rejected', 'expired');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.beneficiary_type AS ENUM ('individual', 'business', 'mobile_money', 'bank_account');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.payment_request_status AS ENUM ('pending', 'paid', 'expired', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.subscription_status AS ENUM ('active', 'paused', 'cancelled', 'expired');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.subscription_frequency AS ENUM ('daily', 'weekly', 'monthly', 'quarterly', 'yearly');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.webhook_event_status AS ENUM ('received', 'processing', 'processed', 'failed', 'ignored');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================
-- 2. WALLETS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  currency_id UUID NOT NULL REFERENCES public.currencies(id) ON DELETE RESTRICT,
  balance NUMERIC(20, 8) NOT NULL DEFAULT 0 CHECK (balance >= 0),
  available_balance NUMERIC(20, 8) NOT NULL DEFAULT 0 CHECK (available_balance >= 0),
  pending_balance NUMERIC(20, 8) NOT NULL DEFAULT 0 CHECK (pending_balance >= 0),
  wallet_status public.wallet_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, currency_id, organization_id)
);

-- ============================================================
-- 3. WALLET TRANSACTIONS (IMMUTABLE LEDGER)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.wallet_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id UUID NOT NULL REFERENCES public.wallets(id) ON DELETE RESTRICT,
  transaction_type public.transaction_type NOT NULL,
  amount NUMERIC(20, 8) NOT NULL,
  currency_id UUID NOT NULL REFERENCES public.currencies(id) ON DELETE RESTRICT,
  balance_before NUMERIC(20, 8) NOT NULL,
  balance_after NUMERIC(20, 8) NOT NULL,
  fee_amount NUMERIC(20, 8) NOT NULL DEFAULT 0,
  fee_currency_id UUID REFERENCES public.currencies(id) ON DELETE RESTRICT,
  reference TEXT UNIQUE,
  external_reference TEXT,
  provider TEXT,
  provider_transaction_id TEXT,
  transaction_status public.transaction_status NOT NULL DEFAULT 'pending',
  description TEXT,
  metadata JSONB,
  related_transaction_id UUID REFERENCES public.wallet_transactions(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- Ledger is immutable: no updated_at
  CONSTRAINT positive_amount CHECK (amount > 0)
);

-- ============================================================
-- 4. PAYMENT PROVIDERS (ABSTRACTED)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.payment_providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  provider_type TEXT NOT NULL, -- 'mobile_money', 'bank', 'card', 'crypto', 'other'
  is_active BOOLEAN NOT NULL DEFAULT false,
  supported_countries JSONB DEFAULT '[]',
  supported_currencies JSONB DEFAULT '[]',
  config JSONB DEFAULT '{}', -- encrypted config stored server-side only
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 5. PAYMENT PROVIDER ROUTES
-- ============================================================

CREATE TABLE IF NOT EXISTS public.payment_provider_routes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES public.payment_providers(id) ON DELETE CASCADE,
  source_country_id UUID REFERENCES public.countries(id) ON DELETE SET NULL,
  destination_country_id UUID REFERENCES public.countries(id) ON DELETE SET NULL,
  source_currency_id UUID REFERENCES public.currencies(id) ON DELETE SET NULL,
  destination_currency_id UUID REFERENCES public.currencies(id) ON DELETE SET NULL,
  transfer_type public.transfer_type NOT NULL DEFAULT 'national',
  is_active BOOLEAN NOT NULL DEFAULT false,
  estimated_delay_minutes INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 6. PAYMENT METHODS (USER-LINKED)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider_id UUID REFERENCES public.payment_providers(id) ON DELETE SET NULL,
  method_type TEXT NOT NULL, -- 'card', 'bank', 'mobile_money', 'wallet'
  display_name TEXT NOT NULL,
  masked_identifier TEXT, -- last 4 digits, masked phone, etc.
  is_default BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 7. BENEFICIARIES
-- ============================================================

CREATE TABLE IF NOT EXISTS public.pay_beneficiaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  country_id UUID REFERENCES public.countries(id) ON DELETE SET NULL,
  account_reference TEXT,
  beneficiary_type public.beneficiary_type NOT NULL DEFAULT 'individual',
  provider_id UUID REFERENCES public.payment_providers(id) ON DELETE SET NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 8. TRANSFERS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.transfers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  sender_wallet_id UUID NOT NULL REFERENCES public.wallets(id) ON DELETE RESTRICT,
  recipient_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  recipient_wallet_id UUID REFERENCES public.wallets(id) ON DELETE SET NULL,
  beneficiary_id UUID REFERENCES public.pay_beneficiaries(id) ON DELETE SET NULL,
  provider_id UUID REFERENCES public.payment_providers(id) ON DELETE SET NULL,
  route_id UUID REFERENCES public.payment_provider_routes(id) ON DELETE SET NULL,
  transfer_type public.transfer_type NOT NULL DEFAULT 'national',
  send_amount NUMERIC(20, 8) NOT NULL,
  send_currency_id UUID NOT NULL REFERENCES public.currencies(id) ON DELETE RESTRICT,
  receive_amount NUMERIC(20, 8),
  receive_currency_id UUID REFERENCES public.currencies(id) ON DELETE RESTRICT,
  exchange_rate NUMERIC(20, 8),
  fee_amount NUMERIC(20, 8) NOT NULL DEFAULT 0,
  fee_currency_id UUID REFERENCES public.currencies(id) ON DELETE RESTRICT,
  reference TEXT UNIQUE DEFAULT concat('TRF-', upper(substr(gen_random_uuid()::text, 1, 8))),
  transfer_status public.transaction_status NOT NULL DEFAULT 'pending',
  description TEXT,
  metadata JSONB DEFAULT '{}',
  idempotency_key TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 9. TRANSFER EVENTS (AUDIT TRAIL FOR TRANSFERS)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.transfer_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transfer_id UUID NOT NULL REFERENCES public.transfers(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  old_status public.transaction_status,
  new_status public.transaction_status,
  actor_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 10. EXCHANGE TRANSACTIONS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.exchange_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  source_wallet_id UUID NOT NULL REFERENCES public.wallets(id) ON DELETE RESTRICT,
  destination_wallet_id UUID NOT NULL REFERENCES public.wallets(id) ON DELETE RESTRICT,
  source_amount NUMERIC(20, 8) NOT NULL,
  source_currency_id UUID NOT NULL REFERENCES public.currencies(id) ON DELETE RESTRICT,
  destination_amount NUMERIC(20, 8) NOT NULL,
  destination_currency_id UUID NOT NULL REFERENCES public.currencies(id) ON DELETE RESTRICT,
  exchange_rate NUMERIC(20, 8) NOT NULL,
  rate_source TEXT,
  fee_amount NUMERIC(20, 8) NOT NULL DEFAULT 0,
  exchange_status public.transaction_status NOT NULL DEFAULT 'pending',
  reference TEXT UNIQUE DEFAULT concat('EXC-', upper(substr(gen_random_uuid()::text, 1, 8))),
  idempotency_key TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 11. FEE RULES (CONFIGURABLE, NEVER HARDCODED)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.fee_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operation_type TEXT NOT NULL,
  fixed_amount NUMERIC(20, 8) NOT NULL DEFAULT 0,
  percentage NUMERIC(8, 4) NOT NULL DEFAULT 0,
  currency_id UUID REFERENCES public.currencies(id) ON DELETE SET NULL,
  source_country_id UUID REFERENCES public.countries(id) ON DELETE SET NULL,
  destination_country_id UUID REFERENCES public.countries(id) ON DELETE SET NULL,
  provider_id UUID REFERENCES public.payment_providers(id) ON DELETE SET NULL,
  minimum_amount NUMERIC(20, 8),
  maximum_amount NUMERIC(20, 8),
  is_active BOOLEAN NOT NULL DEFAULT true,
  priority INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 12. TRANSACTION FEES (APPLIED FEES PER TRANSACTION)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.transaction_fees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID REFERENCES public.wallet_transactions(id) ON DELETE SET NULL,
  transfer_id UUID REFERENCES public.transfers(id) ON DELETE SET NULL,
  fee_rule_id UUID REFERENCES public.fee_rules(id) ON DELETE SET NULL,
  fee_amount NUMERIC(20, 8) NOT NULL,
  currency_id UUID NOT NULL REFERENCES public.currencies(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 13. TRANSACTION LIMITS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.transaction_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operation_type TEXT NOT NULL,
  kyc_level public.kyc_level NOT NULL DEFAULT 'unverified',
  minimum_amount NUMERIC(20, 8),
  maximum_amount NUMERIC(20, 8),
  daily_limit NUMERIC(20, 8),
  monthly_limit NUMERIC(20, 8),
  currency_id UUID REFERENCES public.currencies(id) ON DELETE SET NULL,
  country_id UUID REFERENCES public.countries(id) ON DELETE SET NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 14. KYC PROFILES
-- ============================================================

CREATE TABLE IF NOT EXISTS public.kyc_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  kyc_level public.kyc_level NOT NULL DEFAULT 'unverified',
  kyc_status public.kyc_status NOT NULL DEFAULT 'pending',
  verification_date TIMESTAMPTZ,
  expiration_date TIMESTAMPTZ,
  verification_provider TEXT,
  notes TEXT,
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 15. KYC DOCUMENTS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.kyc_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kyc_profile_id UUID NOT NULL REFERENCES public.kyc_profiles(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL, -- 'national_id', 'passport', 'driving_license', 'proof_of_address'
  file_url TEXT NOT NULL,
  document_status public.kyc_status NOT NULL DEFAULT 'pending',
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 16. PAYMENT REQUESTS (QR / LINK)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.payment_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  requester_wallet_id UUID REFERENCES public.wallets(id) ON DELETE SET NULL,
  amount NUMERIC(20, 8),
  currency_id UUID REFERENCES public.currencies(id) ON DELETE SET NULL,
  description TEXT,
  reference TEXT UNIQUE DEFAULT concat('REQ-', upper(substr(gen_random_uuid()::text, 1, 8))),
  request_status public.payment_request_status NOT NULL DEFAULT 'pending',
  paid_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  paid_transaction_id UUID REFERENCES public.wallet_transactions(id) ON DELETE SET NULL,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 17. BILLERS (BILL PAYMENT PROVIDERS)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.billers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  category TEXT NOT NULL, -- 'electricity', 'water', 'telecom', 'internet', 'tv', 'other'
  country_id UUID REFERENCES public.countries(id) ON DELETE SET NULL,
  logo_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT false,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 18. BILL PAYMENTS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.bill_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  wallet_id UUID NOT NULL REFERENCES public.wallets(id) ON DELETE RESTRICT,
  biller_id UUID NOT NULL REFERENCES public.billers(id) ON DELETE RESTRICT,
  account_number TEXT NOT NULL,
  amount NUMERIC(20, 8) NOT NULL,
  currency_id UUID NOT NULL REFERENCES public.currencies(id) ON DELETE RESTRICT,
  fee_amount NUMERIC(20, 8) NOT NULL DEFAULT 0,
  reference TEXT UNIQUE DEFAULT concat('BILL-', upper(substr(gen_random_uuid()::text, 1, 8))),
  payment_status public.transaction_status NOT NULL DEFAULT 'pending',
  transaction_id UUID REFERENCES public.wallet_transactions(id) ON DELETE SET NULL,
  idempotency_key TEXT UNIQUE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 19. PAYMENT SUBSCRIPTIONS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.payment_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  wallet_id UUID NOT NULL REFERENCES public.wallets(id) ON DELETE RESTRICT,
  name TEXT NOT NULL,
  description TEXT,
  amount NUMERIC(20, 8) NOT NULL,
  currency_id UUID NOT NULL REFERENCES public.currencies(id) ON DELETE RESTRICT,
  frequency public.subscription_frequency NOT NULL DEFAULT 'monthly',
  next_billing_date DATE NOT NULL,
  subscription_status public.subscription_status NOT NULL DEFAULT 'active',
  payment_method_id UUID REFERENCES public.payment_methods(id) ON DELETE SET NULL,
  biller_id UUID REFERENCES public.billers(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 20. CASHBACK ACCOUNTS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.cashback_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  balance NUMERIC(20, 8) NOT NULL DEFAULT 0,
  total_earned NUMERIC(20, 8) NOT NULL DEFAULT 0,
  total_redeemed NUMERIC(20, 8) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 21. CASHBACK TRANSACTIONS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.cashback_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cashback_account_id UUID NOT NULL REFERENCES public.cashback_accounts(id) ON DELETE CASCADE,
  transaction_id UUID REFERENCES public.wallet_transactions(id) ON DELETE SET NULL,
  cashback_type TEXT NOT NULL DEFAULT 'earned', -- 'earned', 'redeemed', 'expired'
  amount NUMERIC(20, 8) NOT NULL,
  percentage NUMERIC(8, 4),
  source TEXT,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 22. WEBHOOK EVENTS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}',
  signature TEXT,
  webhook_status public.webhook_event_status NOT NULL DEFAULT 'received',
  idempotency_key TEXT UNIQUE,
  processed_at TIMESTAMPTZ,
  error_message TEXT,
  retry_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 23. UPDATED_AT TRIGGERS FOR JDV PAY TABLES
-- ============================================================

-- Reuse the update_updated_at_column function from CORE migration
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'wallets', 'payment_providers', 'payment_provider_routes', 'payment_methods',
    'pay_beneficiaries', 'transfers', 'exchange_transactions', 'fee_rules',
    'transaction_limits', 'kyc_profiles', 'payment_requests', 'billers',
    'bill_payments', 'payment_subscriptions', 'cashback_accounts', 'webhook_events'
  ]
  LOOP
    EXECUTE format(
      'DROP TRIGGER IF EXISTS trg_%s_updated_at ON public.%I;
       CREATE TRIGGER trg_%s_updated_at
       BEFORE UPDATE ON public.%I
       FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();',
      t, t, t, t
    );
  END LOOP;
END;
$$;

-- ============================================================
-- 24. INDEXES
-- ============================================================

-- Wallets
CREATE INDEX IF NOT EXISTS idx_wallets_user_id ON public.wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_wallets_organization_id ON public.wallets(organization_id);
CREATE INDEX IF NOT EXISTS idx_wallets_currency_id ON public.wallets(currency_id);
CREATE INDEX IF NOT EXISTS idx_wallets_status ON public.wallets(wallet_status);

-- Wallet transactions
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_wallet_id ON public.wallet_transactions(wallet_id);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_status ON public.wallet_transactions(transaction_status);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_type ON public.wallet_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_created_at ON public.wallet_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_reference ON public.wallet_transactions(reference);

-- Transfers
CREATE INDEX IF NOT EXISTS idx_transfers_sender_user_id ON public.transfers(sender_user_id);
CREATE INDEX IF NOT EXISTS idx_transfers_recipient_user_id ON public.transfers(recipient_user_id);
CREATE INDEX IF NOT EXISTS idx_transfers_status ON public.transfers(transfer_status);
CREATE INDEX IF NOT EXISTS idx_transfers_created_at ON public.transfers(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transfers_reference ON public.transfers(reference);

-- Beneficiaries
CREATE INDEX IF NOT EXISTS idx_pay_beneficiaries_owner ON public.pay_beneficiaries(owner_user_id);

-- Payment requests
CREATE INDEX IF NOT EXISTS idx_payment_requests_requester ON public.payment_requests(requester_user_id);
CREATE INDEX IF NOT EXISTS idx_payment_requests_status ON public.payment_requests(request_status);

-- Bill payments
CREATE INDEX IF NOT EXISTS idx_bill_payments_user_id ON public.bill_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_bill_payments_status ON public.bill_payments(payment_status);

-- KYC
CREATE INDEX IF NOT EXISTS idx_kyc_profiles_user_id ON public.kyc_profiles(user_id);

-- Webhook events
CREATE INDEX IF NOT EXISTS idx_webhook_events_status ON public.webhook_events(webhook_status);
CREATE INDEX IF NOT EXISTS idx_webhook_events_provider ON public.webhook_events(provider);

-- ============================================================
-- 25. ROW LEVEL SECURITY
-- ============================================================

-- Enable RLS on all JDV PAY tables
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_provider_routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pay_beneficiaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transfer_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exchange_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fee_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transaction_fees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transaction_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kyc_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kyc_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bill_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cashback_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cashback_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;

-- ---- WALLETS ----
DROP POLICY IF EXISTS "wallets_owner_select" ON public.wallets;
CREATE POLICY "wallets_owner_select" ON public.wallets
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "wallets_owner_insert" ON public.wallets;
CREATE POLICY "wallets_owner_insert" ON public.wallets
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "wallets_owner_update" ON public.wallets;
CREATE POLICY "wallets_owner_update" ON public.wallets
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ---- WALLET TRANSACTIONS (read-only for owner, immutable) ----
DROP POLICY IF EXISTS "wallet_transactions_owner_select" ON public.wallet_transactions;
CREATE POLICY "wallet_transactions_owner_select" ON public.wallet_transactions
  FOR SELECT USING (
    wallet_id IN (
      SELECT id FROM public.wallets WHERE user_id = auth.uid()
    )
  );

-- ---- PAYMENT PROVIDERS (public read for active providers) ----
DROP POLICY IF EXISTS "payment_providers_public_read" ON public.payment_providers;
CREATE POLICY "payment_providers_public_read" ON public.payment_providers
  FOR SELECT USING (is_active = true);

-- ---- PAYMENT PROVIDER ROUTES (public read for active routes) ----
DROP POLICY IF EXISTS "payment_provider_routes_public_read" ON public.payment_provider_routes;
CREATE POLICY "payment_provider_routes_public_read" ON public.payment_provider_routes
  FOR SELECT USING (is_active = true);

-- ---- PAYMENT METHODS ----
DROP POLICY IF EXISTS "payment_methods_owner_select" ON public.payment_methods;
CREATE POLICY "payment_methods_owner_select" ON public.payment_methods
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "payment_methods_owner_insert" ON public.payment_methods;
CREATE POLICY "payment_methods_owner_insert" ON public.payment_methods
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "payment_methods_owner_update" ON public.payment_methods;
CREATE POLICY "payment_methods_owner_update" ON public.payment_methods
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "payment_methods_owner_delete" ON public.payment_methods;
CREATE POLICY "payment_methods_owner_delete" ON public.payment_methods
  FOR DELETE USING (auth.uid() = user_id);

-- ---- BENEFICIARIES ----
DROP POLICY IF EXISTS "beneficiaries_owner_select" ON public.pay_beneficiaries;
CREATE POLICY "beneficiaries_owner_select" ON public.pay_beneficiaries
  FOR SELECT USING (auth.uid() = owner_user_id);

DROP POLICY IF EXISTS "beneficiaries_owner_insert" ON public.pay_beneficiaries;
CREATE POLICY "beneficiaries_owner_insert" ON public.pay_beneficiaries
  FOR INSERT WITH CHECK (auth.uid() = owner_user_id);

DROP POLICY IF EXISTS "beneficiaries_owner_update" ON public.pay_beneficiaries;
CREATE POLICY "beneficiaries_owner_update" ON public.pay_beneficiaries
  FOR UPDATE USING (auth.uid() = owner_user_id);

DROP POLICY IF EXISTS "beneficiaries_owner_delete" ON public.pay_beneficiaries;
CREATE POLICY "beneficiaries_owner_delete" ON public.pay_beneficiaries
  FOR DELETE USING (auth.uid() = owner_user_id);

-- ---- TRANSFERS ----
DROP POLICY IF EXISTS "transfers_sender_select" ON public.transfers;
CREATE POLICY "transfers_sender_select" ON public.transfers
  FOR SELECT USING (
    auth.uid() = sender_user_id OR auth.uid() = recipient_user_id
  );

DROP POLICY IF EXISTS "transfers_sender_insert" ON public.transfers;
CREATE POLICY "transfers_sender_insert" ON public.transfers
  FOR INSERT WITH CHECK (auth.uid() = sender_user_id);

-- ---- TRANSFER EVENTS ----
DROP POLICY IF EXISTS "transfer_events_participant_select" ON public.transfer_events;
CREATE POLICY "transfer_events_participant_select" ON public.transfer_events
  FOR SELECT USING (
    transfer_id IN (
      SELECT id FROM public.transfers
      WHERE sender_user_id = auth.uid() OR recipient_user_id = auth.uid()
    )
  );

-- ---- EXCHANGE TRANSACTIONS ----
DROP POLICY IF EXISTS "exchange_transactions_owner_select" ON public.exchange_transactions;
CREATE POLICY "exchange_transactions_owner_select" ON public.exchange_transactions
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "exchange_transactions_owner_insert" ON public.exchange_transactions;
CREATE POLICY "exchange_transactions_owner_insert" ON public.exchange_transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ---- FEE RULES (public read for authenticated users) ----
DROP POLICY IF EXISTS "fee_rules_authenticated_read" ON public.fee_rules;
CREATE POLICY "fee_rules_authenticated_read" ON public.fee_rules
  FOR SELECT USING (auth.uid() IS NOT NULL AND is_active = true);

-- ---- TRANSACTION FEES ----
DROP POLICY IF EXISTS "transaction_fees_owner_select" ON public.transaction_fees;
CREATE POLICY "transaction_fees_owner_select" ON public.transaction_fees
  FOR SELECT USING (
    transaction_id IN (
      SELECT id FROM public.wallet_transactions
      WHERE wallet_id IN (SELECT id FROM public.wallets WHERE user_id = auth.uid())
    )
    OR
    transfer_id IN (
      SELECT id FROM public.transfers
      WHERE sender_user_id = auth.uid() OR recipient_user_id = auth.uid()
    )
  );

-- ---- TRANSACTION LIMITS (public read for authenticated) ----
DROP POLICY IF EXISTS "transaction_limits_authenticated_read" ON public.transaction_limits;
CREATE POLICY "transaction_limits_authenticated_read" ON public.transaction_limits
  FOR SELECT USING (auth.uid() IS NOT NULL AND is_active = true);

-- ---- KYC PROFILES ----
DROP POLICY IF EXISTS "kyc_profiles_owner_select" ON public.kyc_profiles;
CREATE POLICY "kyc_profiles_owner_select" ON public.kyc_profiles
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "kyc_profiles_owner_insert" ON public.kyc_profiles;
CREATE POLICY "kyc_profiles_owner_insert" ON public.kyc_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "kyc_profiles_owner_update" ON public.kyc_profiles;
CREATE POLICY "kyc_profiles_owner_update" ON public.kyc_profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- ---- KYC DOCUMENTS ----
DROP POLICY IF EXISTS "kyc_documents_owner_select" ON public.kyc_documents;
CREATE POLICY "kyc_documents_owner_select" ON public.kyc_documents
  FOR SELECT USING (
    kyc_profile_id IN (
      SELECT id FROM public.kyc_profiles WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "kyc_documents_owner_insert" ON public.kyc_documents;
CREATE POLICY "kyc_documents_owner_insert" ON public.kyc_documents
  FOR INSERT WITH CHECK (
    kyc_profile_id IN (
      SELECT id FROM public.kyc_profiles WHERE user_id = auth.uid()
    )
  );

-- ---- PAYMENT REQUESTS ----
DROP POLICY IF EXISTS "payment_requests_owner_select" ON public.payment_requests;
CREATE POLICY "payment_requests_owner_select" ON public.payment_requests
  FOR SELECT USING (
    auth.uid() = requester_user_id OR auth.uid() = paid_by_user_id
  );

DROP POLICY IF EXISTS "payment_requests_owner_insert" ON public.payment_requests;
CREATE POLICY "payment_requests_owner_insert" ON public.payment_requests
  FOR INSERT WITH CHECK (auth.uid() = requester_user_id);

DROP POLICY IF EXISTS "payment_requests_owner_update" ON public.payment_requests;
CREATE POLICY "payment_requests_owner_update" ON public.payment_requests
  FOR UPDATE USING (auth.uid() = requester_user_id);

-- ---- BILLERS (public read for active billers) ----
DROP POLICY IF EXISTS "billers_public_read" ON public.billers;
CREATE POLICY "billers_public_read" ON public.billers
  FOR SELECT USING (is_active = true);

-- ---- BILL PAYMENTS ----
DROP POLICY IF EXISTS "bill_payments_owner_select" ON public.bill_payments;
CREATE POLICY "bill_payments_owner_select" ON public.bill_payments
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "bill_payments_owner_insert" ON public.bill_payments;
CREATE POLICY "bill_payments_owner_insert" ON public.bill_payments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ---- PAYMENT SUBSCRIPTIONS ----
DROP POLICY IF EXISTS "payment_subscriptions_owner_select" ON public.payment_subscriptions;
CREATE POLICY "payment_subscriptions_owner_select" ON public.payment_subscriptions
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "payment_subscriptions_owner_insert" ON public.payment_subscriptions;
CREATE POLICY "payment_subscriptions_owner_insert" ON public.payment_subscriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "payment_subscriptions_owner_update" ON public.payment_subscriptions;
CREATE POLICY "payment_subscriptions_owner_update" ON public.payment_subscriptions
  FOR UPDATE USING (auth.uid() = user_id);

-- ---- CASHBACK ACCOUNTS ----
DROP POLICY IF EXISTS "cashback_accounts_owner_select" ON public.cashback_accounts;
CREATE POLICY "cashback_accounts_owner_select" ON public.cashback_accounts
  FOR SELECT USING (auth.uid() = user_id);

-- ---- CASHBACK TRANSACTIONS ----
DROP POLICY IF EXISTS "cashback_transactions_owner_select" ON public.cashback_transactions;
CREATE POLICY "cashback_transactions_owner_select" ON public.cashback_transactions
  FOR SELECT USING (
    cashback_account_id IN (
      SELECT id FROM public.cashback_accounts WHERE user_id = auth.uid()
    )
  );

-- ---- WEBHOOK EVENTS (no user access — server-side only) ----
-- No user-facing RLS policies for webhook_events (server-side only)

-- ============================================================
-- 26. UPDATE jdv_pay MODULE STATUS TO 'active'
-- ============================================================

UPDATE public.modules
SET module_status = 'active', updated_at = now()
WHERE code = 'jdv_pay';

-- ============================================================
-- 27. SEED: INITIAL PAYMENT PROVIDERS (SANDBOX/INACTIVE)
-- ============================================================

INSERT INTO public.payment_providers (code, name, description, provider_type, is_active, supported_countries, supported_currencies)
VALUES
  ('sandbox', 'JDV Sandbox', 'Environnement de test JDV PAY', 'other', false, '["BJ","SN","CI","TG","ML"]', '["XOF","USD","EUR"]'),
  ('mobile_money_generic', 'Mobile Money', 'Paiement via mobile money', 'mobile_money', false, '["BJ","SN","CI","TG","ML","GH","NG"]', '["XOF","GHS","NGN"]'),
  ('bank_transfer_generic', 'Virement Bancaire', 'Virement bancaire SEPA/SWIFT', 'bank', false, '["FR","BE","DE","IT","ES"]', '["EUR","USD","GBP"]')
ON CONFLICT (code) DO NOTHING;

-- ============================================================
-- END OF JDV PAY MIGRATION
-- ============================================================
