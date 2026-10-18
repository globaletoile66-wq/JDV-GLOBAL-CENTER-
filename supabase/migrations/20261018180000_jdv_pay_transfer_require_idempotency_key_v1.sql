-- Require idempotency keys for client-created transfers to prevent duplicate debits from retries.
CREATE OR REPLACE FUNCTION public.pay_guard_transfer()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog'
AS $function$
DECLARE
  w public.wallets;
BEGIN
  IF public.pay_is_privileged() THEN
    RETURN NEW;
  END IF;

  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentification requise';
  END IF;

  IF coalesce(btrim(NEW.idempotency_key), '') = '' THEN
    RAISE EXCEPTION 'IDEMPOTENCY_KEY_REQUIRED';
  END IF;

  NEW.sender_user_id := auth.uid();
  SELECT * INTO w
  FROM public.wallets
  WHERE id = NEW.sender_wallet_id AND user_id = auth.uid();

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Portefeuille introuvable ou non autorisé';
  END IF;
  IF w.wallet_status <> 'active' THEN
    RAISE EXCEPTION 'Portefeuille non actif';
  END IF;
  IF NEW.send_amount IS NULL OR NEW.send_amount <= 0 THEN
    RAISE EXCEPTION 'Le montant doit être supérieur à zéro';
  END IF;

  IF NEW.beneficiary_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.pay_beneficiaries b
    WHERE b.id = NEW.beneficiary_id AND b.owner_user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Bénéficiaire non autorisé';
  END IF;

  NEW.send_currency_id := w.currency_id;
  NEW.recipient_user_id := NULL;
  NEW.recipient_wallet_id := NULL;
  NEW.provider_id := NULL;
  NEW.route_id := NULL;
  NEW.receive_amount := NULL;
  NEW.exchange_rate := NULL;
  NEW.fee_currency_id := w.currency_id;
  NEW.fee_amount := public.pay_compute_fee('transfer', NEW.send_amount, w.currency_id);

  IF NEW.send_amount + NEW.fee_amount > w.available_balance THEN
    RAISE EXCEPTION 'Solde insuffisant';
  END IF;

  NEW.transfer_status := 'pending';
  RETURN NEW;
END
$function$;
