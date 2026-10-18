-- Enforce provider transaction idempotency at the database layer so concurrent webhook retries cannot double-credit.
-- The live schema already has a UNIQUE index on wallet_transactions.reference.
-- Pre-deployment audit on 2026-10-18 found no duplicate non-null provider transaction IDs.
CREATE UNIQUE INDEX IF NOT EXISTS wallet_transactions_provider_transaction_key
  ON public.wallet_transactions (provider, provider_transaction_id)
  WHERE provider IS NOT NULL AND provider_transaction_id IS NOT NULL;
