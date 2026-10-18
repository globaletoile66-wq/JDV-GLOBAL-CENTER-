-- pay_post_wallet_transaction is an internal balance mutation helper.
-- The application uses the transfer/request flows; no client call sites exist in src/.
-- Keep the function available only to trusted server-side roles.
REVOKE ALL PRIVILEGES ON FUNCTION public.pay_post_wallet_transaction(
  uuid,
  public.transaction_type,
  numeric,
  text,
  text,
  text,
  text,
  text,
  public.transaction_status,
  numeric,
  jsonb
) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.pay_post_wallet_transaction(
  uuid,
  public.transaction_type,
  numeric,
  text,
  text,
  text,
  text,
  text,
  public.transaction_status,
  numeric,
  jsonb
) TO service_role;
