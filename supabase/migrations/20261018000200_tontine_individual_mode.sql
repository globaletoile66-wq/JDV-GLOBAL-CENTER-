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
  p_accept_rules boolean DEFAULT false,
  p_accept_contract boolean DEFAULT false
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
  IF NOT p_accept_contract THEN RAISE EXCEPTION 'CONTRACT_ACCEPTANCE_REQUIRED'; END IF;
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
    rules_accepted_at, rules_version, contract_accepted_at, contract_version,
    identity_confirmed_at, identity_confirmation_method
  )
  VALUES (v_tontine, v_user, 'owner', 'pending', NULL, now(), '1.0', now(), '1.0', NULL, NULL)
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
      'contract_accepted', true,
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

REVOKE ALL ON FUNCTION public.tontine_create_individual_draft(uuid, uuid, text, text, numeric, text, integer, numeric, boolean, boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.tontine_create_individual_draft(uuid, uuid, text, text, numeric, text, integer, numeric, boolean, boolean) TO authenticated;

COMMENT ON COLUMN public.tontines.tontine_type IS
  'group: shared rotation tontine; individual: single-owner savings plan without group invitation or beneficiary rotation.';


-- Contract acceptance is separate from rules acceptance and versioned independently.
ALTER TABLE public.tontine_members
  ADD COLUMN IF NOT EXISTS contract_accepted_at timestamptz,
  ADD COLUMN IF NOT EXISTS contract_version text;

-- Do not permit direct self-editing of membership status or deletion of membership history.
DROP POLICY IF EXISTS tontine_members_update ON public.tontine_members;
DROP POLICY IF EXISTS tontine_members_delete ON public.tontine_members;
CREATE POLICY tontine_members_update ON public.tontine_members
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.tontines t
      WHERE t.id = tontine_members.tontine_id
        AND (public.is_org_admin(t.organization_id) OR public.is_super_admin())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.tontines t
      WHERE t.id = tontine_members.tontine_id
        AND (public.is_org_admin(t.organization_id) OR public.is_super_admin())
    )
  );
-- Intentionally no authenticated DELETE policy: membership history is retained.

-- Group invitations cannot be created for a personal savings plan.
CREATE OR REPLACE FUNCTION public.tontine_guard_group_join_link()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog'
AS $function$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.tontines t
    WHERE t.id = NEW.tontine_id AND t.tontine_type = 'group'
  ) THEN
    RAISE EXCEPTION 'JOIN_LINKS_REQUIRE_GROUP_TONTINE';
  END IF;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS tontine_join_links_group_only ON public.tontine_join_links;
CREATE TRIGGER tontine_join_links_group_only
BEFORE INSERT OR UPDATE OF tontine_id ON public.tontine_join_links
FOR EACH ROW EXECUTE FUNCTION public.tontine_guard_group_join_link();

-- Replace the unsafe two-argument admission RPC. A link is group-only, and both rules and
-- contract acceptance are recorded separately. Phone confirmation remains distinct from KYC.
DROP FUNCTION IF EXISTS public.tontine_join_by_link(text, boolean);

CREATE OR REPLACE FUNCTION public.tontine_join_by_link(
  p_join_token text,
  p_accept_rules boolean,
  p_accept_contract boolean
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions', 'pg_catalog'
AS $function$
DECLARE
  v_user uuid := auth.uid();
  v_link public.tontine_join_links;
  v_tontine public.tontines;
  v_member uuid;
  v_phone text;
  v_phone_confirmed timestamptz;
  v_existing_status text;
  v_existing boolean;
  v_member_count integer;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'AUTH_REQUIRED'; END IF;
  IF coalesce(trim(p_join_token), '') = '' THEN RAISE EXCEPTION 'INVALID_JOIN_LINK'; END IF;
  IF NOT p_accept_rules THEN RAISE EXCEPTION 'RULES_ACCEPTANCE_REQUIRED'; END IF;
  IF NOT p_accept_contract THEN RAISE EXCEPTION 'CONTRACT_ACCEPTANCE_REQUIRED'; END IF;

  SELECT * INTO v_link
  FROM public.tontine_join_links
  WHERE token_hash = encode(digest(trim(p_join_token), 'sha256'), 'hex')
    AND status = 'active'
    AND (expires_at IS NULL OR expires_at > now())
  FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'INVALID_OR_EXPIRED_JOIN_LINK'; END IF;

  SELECT * INTO v_tontine FROM public.tontines WHERE id = v_link.tontine_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'TONTINE_NOT_FOUND'; END IF;
  IF v_tontine.tontine_type <> 'group' THEN RAISE EXCEPTION 'JOIN_LINKS_REQUIRE_GROUP_TONTINE'; END IF;
  IF v_tontine.status IN ('cancelled', 'completed') THEN RAISE EXCEPTION 'TONTINE_CLOSED'; END IF;

  SELECT phone, phone_confirmed_at INTO v_phone, v_phone_confirmed
  FROM auth.users WHERE id = v_user;
  IF coalesce(v_phone, '') = '' THEN RAISE EXCEPTION 'PHONE_REQUIRED_FOR_TONTINE_IDENTITY'; END IF;
  IF v_phone_confirmed IS NULL THEN RAISE EXCEPTION 'PHONE_IDENTITY_NOT_CONFIRMED'; END IF;
  IF v_link.invited_phone IS NOT NULL
     AND regexp_replace(v_link.invited_phone, '\D', '', 'g')
         IS DISTINCT FROM regexp_replace(v_phone, '\D', '', 'g') THEN
    RAISE EXCEPTION 'INVITED_PHONE_MISMATCH';
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.tontine_members
    WHERE tontine_id = v_tontine.id AND user_id = v_user
  ) INTO v_existing;

  IF v_existing THEN
    SELECT membership_status INTO v_existing_status
    FROM public.tontine_members
    WHERE tontine_id = v_tontine.id AND user_id = v_user FOR UPDATE;
    IF v_existing_status = 'active' THEN
      RETURN (SELECT id FROM public.tontine_members WHERE tontine_id = v_tontine.id AND user_id = v_user);
    END IF;
    IF v_existing_status IN ('suspended', 'rejected', 'left') THEN
      RAISE EXCEPTION 'MEMBERSHIP_NOT_ELIGIBLE';
    END IF;
  END IF;

  SELECT count(*) INTO v_member_count
  FROM public.tontine_members
  WHERE tontine_id = v_tontine.id AND membership_status IN ('active', 'pending');
  IF NOT v_existing AND v_member_count >= v_tontine.member_limit THEN RAISE EXCEPTION 'MEMBER_LIMIT_REACHED'; END IF;

  INSERT INTO public.tontine_members (
    tontine_id, user_id, role, membership_status, joined_at,
    rules_accepted_at, rules_version, contract_accepted_at, contract_version,
    identity_confirmed_at, identity_confirmation_method
  )
  VALUES (
    v_tontine.id, v_user, 'member', 'pending', NULL,
    now(), v_link.rules_version, now(), v_link.rules_version, NULL, NULL
  )
  ON CONFLICT (tontine_id, user_id) DO UPDATE
  SET membership_status = 'pending',
      joined_at = NULL,
      rules_accepted_at = now(),
      rules_version = EXCLUDED.rules_version,
      contract_accepted_at = now(),
      contract_version = EXCLUDED.contract_version,
      identity_confirmed_at = NULL,
      identity_confirmation_method = NULL,
      updated_at = now()
  RETURNING id INTO v_member;

  UPDATE public.tontine_join_links
  SET uses_count = uses_count + CASE WHEN NOT v_existing THEN 1 ELSE 0 END,
      accepted_by = v_user,
      accepted_at = now(),
      status = CASE
        WHEN max_uses IS NOT NULL AND uses_count + CASE WHEN NOT v_existing THEN 1 ELSE 0 END >= max_uses
          THEN 'used'
        ELSE 'active'
      END,
      updated_at = now()
  WHERE id = v_link.id;

  INSERT INTO public.audit_logs (
    user_id, organization_id, module_code, action, entity_type, entity_id, new_data
  )
  VALUES (
    v_user, v_tontine.organization_id, 'jdv_tontine', 'join_by_link',
    'tontine_member', v_member::text,
    jsonb_build_object(
      'tontine_id', v_tontine.id,
      'membership_request_created', NOT v_existing,
      'membership_status_after_request', 'pending',
      'phone_confirmed', true,
      'identity_verified', false,
      'rules_accepted', true,
      'contract_accepted', true,
      'rules_version', v_link.rules_version,
      'contract_version', v_link.rules_version,
      'shared_group_link', true
    )
  );

  RETURN v_member;
END;
$function$;

REVOKE ALL ON FUNCTION public.tontine_join_by_link(text, boolean, boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.tontine_join_by_link(text, boolean, boolean) TO authenticated;

-- Activation is deliberately explicit: it requires independently reviewed KYC evidence and
-- a version-matched contract acceptance, and it cannot be self-approved.
CREATE OR REPLACE FUNCTION public.tontine_approve_member(
  p_member_id uuid,
  p_approve boolean
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog'
AS $function$
DECLARE
  m public.tontine_members;
  t public.tontines;
  v_president uuid;
  v_kyc_profile uuid;
  v_has_approved_identity boolean;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'AUTHENTICATION_REQUIRED'; END IF;

  SELECT * INTO m FROM public.tontine_members WHERE id = p_member_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'MEMBER_NOT_FOUND'; END IF;
  SELECT * INTO t FROM public.tontines WHERE id = m.tontine_id FOR UPDATE;
  SELECT user_id INTO v_president FROM public.tontine_members WHERE id = t.president_member_id;

  IF m.user_id = auth.uid() THEN RAISE EXCEPTION 'SELF_APPROVAL_NOT_ALLOWED'; END IF;
  IF NOT (
    coalesce(public.is_super_admin(), false)
    OR coalesce(public.is_org_admin(t.organization_id), false)
    OR coalesce(v_president = auth.uid(), false)
  ) THEN RAISE EXCEPTION 'MEMBER_APPROVAL_NOT_AUTHORIZED'; END IF;
  IF m.membership_status NOT IN ('pending', 'approved') THEN RAISE EXCEPTION 'MEMBER_NOT_PENDING'; END IF;

  IF NOT p_approve THEN
    UPDATE public.tontine_members
    SET membership_status = 'rejected', approved_by = auth.uid(), approved_at = now(),
        updated_at = now()
    WHERE id = m.id;
    INSERT INTO public.audit_logs(user_id, organization_id, module_code, action, entity_type, entity_id, new_data)
    VALUES(auth.uid(), t.organization_id, 'jdv_tontine', 'reject_member', 'tontine_member', m.id::text,
      jsonb_build_object('tontine_id', t.id, 'membership_status', 'rejected'));
    RETURN true;
  END IF;

  IF m.rules_accepted_at IS NULL OR coalesce(trim(m.rules_version), '') = '' THEN
    RAISE EXCEPTION 'RULES_ACCEPTANCE_REQUIRED';
  END IF;
  IF m.contract_accepted_at IS NULL OR m.contract_version IS DISTINCT FROM m.rules_version THEN
    RAISE EXCEPTION 'CONTRACT_ACCEPTANCE_REQUIRED';
  END IF;

  SELECT kp.id INTO v_kyc_profile
  FROM public.kyc_profiles kp
  WHERE kp.user_id = m.user_id AND kp.kyc_status = 'approved'
  ORDER BY kp.updated_at DESC LIMIT 1;
  IF v_kyc_profile IS NULL THEN RAISE EXCEPTION 'KYC_PROFILE_NOT_APPROVED'; END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.kyc_documents kd
    WHERE kd.kyc_profile_id = v_kyc_profile
      AND kd.document_status = 'approved'
      AND lower(kd.document_type) IN ('identity_document', 'national_id', 'passport', 'id_card', 'identity')
  ) INTO v_has_approved_identity;
  IF NOT v_has_approved_identity THEN RAISE EXCEPTION 'APPROVED_IDENTITY_DOCUMENT_REQUIRED'; END IF;

  UPDATE public.tontine_members
  SET membership_status = 'active',
      joined_at = coalesce(joined_at, now()),
      approved_by = auth.uid(),
      approved_at = now(),
      identity_confirmed_at = now(),
      identity_confirmation_method = 'reviewed_kyc_identity_document',
      updated_at = now()
  WHERE id = m.id;

  INSERT INTO public.audit_logs(user_id, organization_id, module_code, action, entity_type, entity_id, new_data)
  VALUES(auth.uid(), t.organization_id, 'jdv_tontine', 'approve_member', 'tontine_member', m.id::text,
    jsonb_build_object('tontine_id', t.id, 'membership_status', 'active',
      'identity_verified', true, 'identity_verification_method', 'reviewed_kyc_identity_document',
      'rules_version', m.rules_version, 'contract_version', m.contract_version));
  RETURN true;
END;
$function$;

REVOKE ALL ON FUNCTION public.tontine_approve_member(uuid, boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.tontine_approve_member(uuid, boolean) TO authenticated;
