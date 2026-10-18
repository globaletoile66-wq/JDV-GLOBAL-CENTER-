-- JDV Tontine: explicit group vs individual mode.
-- Review-only migration. Do not apply to production without review and explicit approval.

ALTER TABLE public.tontines
  ADD COLUMN IF NOT EXISTS tontine_type text NOT NULL DEFAULT 'group';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.tontines'::regclass
      AND conname = 'tontines_tontine_type_check'
  ) THEN
    ALTER TABLE public.tontines
      ADD CONSTRAINT tontines_tontine_type_check
      CHECK (tontine_type IN ('group', 'individual'));
  END IF;
END $$;

-- The existing constraint only allowed 2+ members. Individual plans are intentionally capped at 1.
ALTER TABLE public.tontines DROP CONSTRAINT IF EXISTS tontines_member_limit_check;
ALTER TABLE public.tontines
  ADD CONSTRAINT tontines_member_limit_check CHECK (
    (tontine_type = 'individual' AND member_limit = 1)
    OR (tontine_type = 'group' AND member_limit >= 2 AND member_limit <= 10000)
  );

-- The current frontend offered quarterly, while the database constraint rejected it.
ALTER TABLE public.tontines DROP CONSTRAINT IF EXISTS tontines_frequency_check;
ALTER TABLE public.tontines
  ADD CONSTRAINT tontines_frequency_check
  CHECK (frequency IN ('daily', 'weekly', 'biweekly', 'monthly', 'quarterly'));

CREATE OR REPLACE FUNCTION public.tontine_create_individual_draft(
  p_organization_id uuid,
  p_currency_id uuid,
  p_name text,
  p_description text,
  p_contribution_amount numeric,
  p_frequency text,
  p_cycle_periods integer,
  p_late_fee_amount numeric DEFAULT 0,
  p_accept_rules boolean DEFAULT false
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog'
AS $function$
DECLARE
  v_user uuid := auth.uid();
  v_tontine uuid;
  v_member uuid;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'AUTH_REQUIRED'; END IF;
  IF NOT coalesce(public.is_org_member(p_organization_id), false)
     AND NOT coalesce(public.is_super_admin(), false) THEN
    RAISE EXCEPTION 'ORGANIZATION_MEMBERSHIP_REQUIRED';
  END IF;
  IF NOT p_accept_rules THEN RAISE EXCEPTION 'RULES_ACCEPTANCE_REQUIRED'; END IF;
  IF coalesce(length(trim(p_name)), 0) < 2 THEN RAISE EXCEPTION 'INVALID_TONTINE_NAME'; END IF;
  IF p_contribution_amount IS NULL OR p_contribution_amount <= 0 THEN RAISE EXCEPTION 'INVALID_CONTRIBUTION_AMOUNT'; END IF;
  IF p_cycle_periods IS NULL OR p_cycle_periods < 1 OR p_cycle_periods > 366 THEN RAISE EXCEPTION 'INVALID_CYCLE_PERIODS'; END IF;
  IF p_frequency NOT IN ('daily', 'weekly', 'biweekly', 'monthly', 'quarterly') THEN RAISE EXCEPTION 'INVALID_FREQUENCY'; END IF;
  IF p_late_fee_amount IS NULL OR p_late_fee_amount < 0 THEN RAISE EXCEPTION 'INVALID_LATE_FEE'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.currencies WHERE id = p_currency_id AND is_active = true) THEN
    RAISE EXCEPTION 'CURRENCY_NOT_ACTIVE';
  END IF;

  INSERT INTO public.tontines (
    organization_id, currency_id, name, description, contribution_amount,
    frequency, cycle_periods, member_limit, late_fee_amount, rules,
    status, created_by, payout_mode, tontine_type
  )
  VALUES (
    p_organization_id, p_currency_id, trim(p_name), nullif(trim(coalesce(p_description, '')), ''),
    p_contribution_amount, p_frequency, p_cycle_periods, 1, p_late_fee_amount,
    jsonb_build_object(
      'mode', 'individual',
      'version', '1.0',
      'review_required_before_activation', true,
      'contract_validation_required', true,
      'identity_verification_required', true,
      'created_from', 'tontine_create_individual_draft'
    ),
    'draft', v_user, 'wallet', 'individual'
  )
  RETURNING id INTO v_tontine;

  -- Personal plans are created as requests; no active financial entitlement is granted.
  INSERT INTO public.tontine_members (
    tontine_id, user_id, role, membership_status, joined_at,
    rules_accepted_at, rules_version, identity_confirmed_at,
    identity_confirmation_method
  )
  VALUES (v_tontine, v_user, 'owner', 'pending', NULL, now(), '1.0', NULL, NULL)
  RETURNING id INTO v_member;

  INSERT INTO public.audit_logs (
    user_id, organization_id, module_code, action, entity_type, entity_id, new_data
  )
  VALUES (
    v_user, p_organization_id, 'jdv_tontine', 'create_individual_draft',
    'tontine', v_tontine::text,
    jsonb_build_object(
      'tontine_type', 'individual',
      'status', 'draft',
      'membership_status', 'pending',
      'rules_accepted', true,
      'identity_verified', false,
      'contract_validated', false,
      'member_id', v_member
    )
  );

  RETURN jsonb_build_object(
    'id', v_tontine,
    'name', trim(p_name),
    'tontine_type', 'individual',
    'status', 'draft',
    'membership_status', 'pending'
  );
END;
$function$;

REVOKE ALL ON FUNCTION public.tontine_create_individual_draft(uuid, uuid, text, text, numeric, text, integer, numeric, boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.tontine_create_individual_draft(uuid, uuid, text, text, numeric, text, integer, numeric, boolean) TO authenticated;

COMMENT ON COLUMN public.tontines.tontine_type IS
  'group: shared rotation tontine; individual: single-owner savings plan without group invitation or beneficiary rotation.';
