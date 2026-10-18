-- Enforce idempotency at the database layer so concurrent retries cannot double-post.
-- Pre-deployment audit on 2026-10-18 found no duplicate non-null references or provider transaction IDs.
CREATE UNIQUE INDEX IF NOT EXISTS wallet_transactions_reference_key
  ON public.wallet_transactions (reference)
  WHERE reference IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS wallet_transactions_provider_transaction_key
  ON public.wallet_transactions (provider, provider_transaction_id)
  WHERE provider IS NOT NULL AND provider_transaction_id IS NOT NULL;
