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

  UPDATE public.tontines SET president_member_id = v_member WHERE id = v_tontine;

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


-- The creator is a pending owner until identity and contract evidence are reviewed.
CREATE OR REPLACE FUNCTION public.tontine_create(
  p_organization_id uuid, p_country_id uuid, p_currency_id uuid, p_name text,
  p_description text, p_contribution_amount numeric, p_frequency text,
  p_cycle_periods integer, p_member_limit integer, p_starts_on date,
  p_late_fee_amount numeric DEFAULT 0, p_rules jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog'
AS $function$
DECLARE v_id uuid; v_member uuid; v_rules jsonb := coalesce(p_rules, '{}'::jsonb);
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'AUTH_REQUIRED'; END IF;
  IF NOT public.is_org_admin(p_organization_id) AND NOT public.is_super_admin() THEN RAISE EXCEPTION 'NOT_AUTHORIZED'; END IF;
  IF coalesce(length(trim(p_name)), 0) < 2 THEN RAISE EXCEPTION 'INVALID_TONTINE_NAME'; END IF;
  IF p_contribution_amount IS NULL OR p_contribution_amount <= 0 THEN RAISE EXCEPTION 'INVALID_CONTRIBUTION_AMOUNT'; END IF;
  IF p_member_limit < 2 THEN RAISE EXCEPTION 'INVALID_MEMBER_LIMIT'; END IF;

  INSERT INTO public.tontines(
    organization_id,country_id,currency_id,name,description,contribution_amount,
    frequency,cycle_periods,member_limit,starts_on,late_fee_amount,rules,created_by,tontine_type
  )
  VALUES(
    p_organization_id,p_country_id,p_currency_id,trim(p_name),p_description,p_contribution_amount,
    p_frequency,p_cycle_periods,p_member_limit,p_starts_on,coalesce(p_late_fee_amount,0),v_rules,auth.uid(),'group'
  ) RETURNING id INTO v_id;

  INSERT INTO public.tontine_members(
    tontine_id,user_id,role,membership_status,joined_at,approved_by,approved_at,
    rules_accepted_at,rules_version,contract_accepted_at,contract_version,
    identity_confirmed_at,identity_confirmation_method
  )
  VALUES(
    v_id,auth.uid(),'owner','pending',NULL,NULL,NULL,
    CASE WHEN coalesce((v_rules->>'rules_accepted')::boolean,false) THEN now() ELSE NULL END,
    coalesce(v_rules->>'version','1.0'),
    CASE WHEN coalesce((v_rules->>'contract_accepted')::boolean,false) THEN now() ELSE NULL END,
    coalesce(v_rules->>'version','1.0'),NULL,NULL
  ) RETURNING id INTO v_member;

  UPDATE public.tontines SET president_member_id=v_member WHERE id=v_id;
  INSERT INTO public.audit_logs(user_id,organization_id,module_code,action,entity_type,entity_id,new_data)
  VALUES(auth.uid(),p_organization_id,'jdv_tontine','create','tontine',v_id::text,
    jsonb_build_object('name',trim(p_name),'status','draft','membership_status','pending','identity_verified',false));
  RETURN v_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.tontine_create_group(
  p_organization_id uuid, p_country_id uuid, p_currency_id uuid, p_name text,
  p_description text, p_contribution_amount numeric, p_frequency text,
  p_cycle_periods integer, p_member_limit integer, p_starts_on date,
  p_late_fee_amount numeric DEFAULT 0, p_rules jsonb DEFAULT '{}'::jsonb,
  p_link_expires_at timestamptz DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions', 'pg_catalog'
AS $function$
DECLARE
  v_tontine uuid; v_owner_member uuid; v_token text;
  v_rules jsonb := coalesce(p_rules, '{}'::jsonb);
  v_version text := coalesce(p_rules->>'version','1.0');
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'AUTH_REQUIRED'; END IF;
  IF NOT coalesce(public.is_org_member(p_organization_id),false) AND NOT coalesce(public.is_super_admin(),false) THEN
    RAISE EXCEPTION 'ORGANIZATION_MEMBERSHIP_REQUIRED';
  END IF;
  IF NOT coalesce((v_rules->>'rules_accepted')::boolean,false) THEN RAISE EXCEPTION 'RULES_ACCEPTANCE_REQUIRED'; END IF;
  IF NOT coalesce((v_rules->>'contract_accepted')::boolean,false) THEN RAISE EXCEPTION 'CONTRACT_ACCEPTANCE_REQUIRED'; END IF;
  IF coalesce(length(trim(p_name)),0)<2 THEN RAISE EXCEPTION 'INVALID_TONTINE_NAME'; END IF;
  IF p_contribution_amount IS NULL OR p_contribution_amount<=0 THEN RAISE EXCEPTION 'INVALID_CONTRIBUTION_AMOUNT'; END IF;
  IF p_member_limit<2 THEN RAISE EXCEPTION 'INVALID_MEMBER_LIMIT'; END IF;
  IF p_late_fee_amount<0 THEN RAISE EXCEPTION 'INVALID_LATE_FEE'; END IF;
  IF p_link_expires_at IS NOT NULL AND p_link_expires_at<=now() THEN RAISE EXCEPTION 'INVALID_EXPIRY'; END IF;

  INSERT INTO public.tontines(
    organization_id,country_id,currency_id,name,description,contribution_amount,
    frequency,cycle_periods,member_limit,starts_on,late_fee_amount,rules,created_by,tontine_type,status
  )
  VALUES(
    p_organization_id,p_country_id,p_currency_id,trim(p_name),p_description,p_contribution_amount,
    p_frequency,p_cycle_periods,p_member_limit,p_starts_on,p_late_fee_amount,
    v_rules || jsonb_build_object('rules_version',v_version,'contract_version',v_version),
    auth.uid(),'group','draft'
  ) RETURNING id INTO v_tontine;

  INSERT INTO public.tontine_members(
    tontine_id,user_id,role,membership_status,joined_at,approved_by,approved_at,
    rules_accepted_at,rules_version,contract_accepted_at,contract_version,
    identity_confirmed_at,identity_confirmation_method
  )
  VALUES(
    v_tontine,auth.uid(),'owner','pending',NULL,NULL,NULL,now(),v_version,now(),v_version,NULL,NULL
  ) RETURNING id INTO v_owner_member;

  UPDATE public.tontines SET president_member_id=v_owner_member WHERE id=v_tontine;
  v_token := encode(gen_random_bytes(32),'hex');
  INSERT INTO public.tontine_join_links(tontine_id,token_hash,status,expires_at,created_by,rules_version)
  VALUES(v_tontine,encode(digest(v_token,'sha256'),'hex'),'active',p_link_expires_at,auth.uid(),v_version);

  INSERT INTO public.audit_logs(user_id,organization_id,module_code,action,entity_type,entity_id,new_data)
  VALUES(auth.uid(),p_organization_id,'jdv_tontine','create_group','tontine',v_tontine::text,
    jsonb_build_object('president_member_id',v_owner_member,'membership_status','pending',
      'identity_verified',false,'rules_version',v_version,'contract_version',v_version,
      'payout_control','system_only'));

  RETURN jsonb_build_object('tontine_id',v_tontine,'president_member_id',v_owner_member,
    'join_token',v_token,'join_path','/tontine/join/'||v_token,
    'rules_version',v_version,'expires_at',p_link_expires_at,'membership_status','pending');
END;
$function$;

-- No tontine can be opened by directly changing the row before the owner has been reviewed.
CREATE OR REPLACE FUNCTION public.tontine_guard_status_activation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog'
AS $function$
DECLARE m public.tontine_members;
BEGIN
  IF NEW.status IN ('open','active') AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM NEW.status) THEN
    IF NEW.president_member_id IS NULL THEN RAISE EXCEPTION 'PRESIDENT_MEMBERSHIP_REQUIRED'; END IF;
    SELECT * INTO m FROM public.tontine_members WHERE id=NEW.president_member_id AND tontine_id=NEW.id;
    IF NOT FOUND OR m.membership_status <> 'active' THEN RAISE EXCEPTION 'PRESIDENT_MEMBERSHIP_NOT_ACTIVE'; END IF;
    IF m.identity_confirmed_at IS NULL OR m.contract_accepted_at IS NULL
       OR m.contract_version IS DISTINCT FROM m.rules_version THEN
      RAISE EXCEPTION 'PRESIDENT_IDENTITY_AND_CONTRACT_VALIDATION_REQUIRED';
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS tontines_guard_status_activation ON public.tontines;
CREATE TRIGGER tontines_guard_status_activation
BEFORE INSERT OR UPDATE OF status ON public.tontines
FOR EACH ROW EXECUTE FUNCTION public.tontine_guard_status_activation();

-- Personal tontines use the existing schedules, contribution ledger, pool and wallet payout
-- worker. Their one maturity rotation represents the owner, not a shared group rotation.
CREATE OR REPLACE FUNCTION public.tontine_open_cycle(
  p_tontine_id uuid, p_starts_on date, p_ends_on date
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog'
AS $function$
DECLARE
  t public.tontines; v_cycle uuid; v_president uuid; v_num integer;
  v_members integer; v_amount numeric; v_periods integer; v_frequency text;
  v_owner public.tontine_members; v_phone text; v_expected numeric;
BEGIN
  SELECT * INTO t FROM public.tontines WHERE id=p_tontine_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'TONTINE_NOT_FOUND'; END IF;
  SELECT * INTO v_owner FROM public.tontine_members WHERE id=t.president_member_id AND tontine_id=t.id;
  IF NOT FOUND OR v_owner.membership_status <> 'active' THEN RAISE EXCEPTION 'PRESIDENT_MEMBERSHIP_NOT_ACTIVE'; END IF;
  IF NOT (coalesce(public.is_super_admin(),false) OR auth.uid()=v_owner.user_id) THEN RAISE EXCEPTION 'PRESIDENT_ONLY'; END IF;
  IF p_starts_on IS NULL OR p_ends_on IS NULL OR p_ends_on<p_starts_on THEN RAISE EXCEPTION 'INVALID_CYCLE_DATES'; END IF;
  IF t.status NOT IN ('draft','open','active','paused') THEN RAISE EXCEPTION 'TONTINE_NOT_CYCLABLE'; END IF;
  IF EXISTS (SELECT 1 FROM public.tontine_cycles WHERE tontine_id=t.id AND status IN ('planned','open','active')) THEN
    RAISE EXCEPTION 'OPEN_CYCLE_ALREADY_EXISTS';
  END IF;

  SELECT count(*) INTO v_members FROM public.tontine_members WHERE tontine_id=t.id AND membership_status='active';
  IF t.tontine_type='individual' THEN
    IF v_members <> 1 OR v_owner.role <> 'owner' THEN RAISE EXCEPTION 'INDIVIDUAL_REQUIRES_ONE_ACTIVE_OWNER'; END IF;
  ELSE
    IF v_members < 2 THEN RAISE EXCEPTION 'MINIMUM_MEMBERS_REQUIRED'; END IF;
  END IF;

  v_amount:=t.contribution_amount;
  v_periods:=t.cycle_periods;
  v_frequency:=t.frequency;
  v_expected:=v_amount*v_periods*v_members;
  SELECT coalesce(max(cycle_number),0)+1 INTO v_num FROM public.tontine_cycles WHERE tontine_id=t.id;

  INSERT INTO public.tontine_cycles(tontine_id,cycle_number,starts_on,ends_on,status,total_expected,total_collected)
  VALUES(t.id,v_num,p_starts_on,p_ends_on,'open',v_expected,0) RETURNING id INTO v_cycle;

  INSERT INTO public.tontine_contribution_schedules(cycle_id,member_id,period_number,due_on,expected_amount,late_fee_amount)
  SELECT v_cycle,tm.id,g,
    p_starts_on + CASE
      WHEN v_frequency='daily' THEN g-1
      WHEN v_frequency='weekly' THEN 7*(g-1)
      WHEN v_frequency='biweekly' THEN 14*(g-1)
      WHEN v_frequency='quarterly' THEN 90*(g-1)
      ELSE 30*(g-1)
    END,
    v_amount,t.late_fee_amount
  FROM public.tontine_members tm CROSS JOIN generate_series(1,v_periods) g
  WHERE tm.tontine_id=t.id AND tm.membership_status='active';

  IF t.tontine_type='individual' THEN
    SELECT p.phone INTO v_phone FROM public.profiles p WHERE p.id=v_owner.user_id;
    INSERT INTO public.tontine_rotations(
      cycle_id,member_id,rotation_order,planned_payout_on,expected_amount,beneficiary_phone,status
    ) VALUES(v_cycle,v_owner.id,1,p_ends_on,v_expected,v_phone,'planned');
  ELSE
    INSERT INTO public.tontine_rotations(cycle_id,member_id,rotation_order,planned_payout_on,expected_amount,beneficiary_phone,status)
    SELECT v_cycle,tm.id,
      row_number() OVER (ORDER BY tm.joined_at,tm.created_at,tm.id)::int,
      p_starts_on + CASE
        WHEN v_frequency='daily' THEN row_number() OVER (ORDER BY tm.joined_at,tm.created_at,tm.id)::int-1
        WHEN v_frequency='weekly' THEN 7*(row_number() OVER (ORDER BY tm.joined_at,tm.created_at,tm.id)::int-1)
        WHEN v_frequency='biweekly' THEN 14*(row_number() OVER (ORDER BY tm.joined_at,tm.created_at,tm.id)::int-1)
        WHEN v_frequency='quarterly' THEN 90*(row_number() OVER (ORDER BY tm.joined_at,tm.created_at,tm.id)::int-1)
        ELSE 30*(row_number() OVER (ORDER BY tm.joined_at,tm.created_at,tm.id)::int-1)
      END,
      v_amount*v_members,p.phone,'planned'
    FROM public.tontine_members tm JOIN public.profiles p ON p.id=tm.user_id
    WHERE tm.tontine_id=t.id AND tm.membership_status='active';
  END IF;

  INSERT INTO public.audit_logs(user_id,organization_id,module_code,action,entity_type,entity_id,new_data)
  VALUES(auth.uid(),t.organization_id,'jdv_tontine','open_cycle','tontine_cycle',v_cycle::text,
    jsonb_build_object('cycle_number',v_num,'tontine_type',t.tontine_type,'active_members',v_members,'total_expected',v_expected));
  RETURN v_cycle;
END;
$function$;

CREATE OR REPLACE FUNCTION public.tontine_set_status(p_tontine_id uuid, p_status text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog'
AS $function$
DECLARE t public.tontines; v_pres uuid; v_members integer; v_pool numeric; v_ok boolean; m record; v_msg text;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'AUTHENTICATION_REQUIRED'; END IF;
  IF p_status NOT IN ('open','paused','completed','cancelled') THEN RAISE EXCEPTION 'INVALID_STATUS'; END IF;
  SELECT * INTO t FROM public.tontines WHERE id=p_tontine_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'TONTINE_NOT_FOUND'; END IF;
  SELECT user_id INTO v_pres FROM public.tontine_members WHERE id=t.president_member_id;
  IF NOT (coalesce(v_pres=auth.uid(),false) OR coalesce(public.is_super_admin(),false)) THEN RAISE EXCEPTION 'PRESIDENT_ONLY'; END IF;

  v_ok := CASE
    WHEN t.status='draft' AND p_status IN ('open','cancelled') THEN true
    WHEN t.status='open' AND p_status IN ('paused','completed','cancelled') THEN true
    WHEN t.status='paused' AND p_status IN ('open','completed','cancelled') THEN true
    ELSE false END;
  IF NOT v_ok THEN RAISE EXCEPTION 'INVALID_TRANSITION'; END IF;

  IF p_status='open' AND t.status='draft' THEN
    SELECT count(*) INTO v_members FROM public.tontine_members WHERE tontine_id=t.id AND membership_status='active';
    IF t.tontine_type='individual' THEN
      IF v_members <> 1 THEN RAISE EXCEPTION 'INDIVIDUAL_REQUIRES_ONE_ACTIVE_OWNER'; END IF;
    ELSE
      IF v_members < 2 THEN RAISE EXCEPTION 'AT_LEAST_TWO_MEMBERS_REQUIRED'; END IF;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.tontine_cycles WHERE tontine_id=t.id AND status IN ('planned','open','active')) THEN
      RAISE EXCEPTION 'OPEN_A_CYCLE_FIRST';
    END IF;
  END IF;

  IF p_status IN ('completed','cancelled') THEN
    v_pool:=public.tontine_pool_balance(t.id);
    IF v_pool<>0 THEN RAISE EXCEPTION 'POOL_NOT_EMPTY'; END IF;
  END IF;

  UPDATE public.tontines SET status=p_status,updated_at=now() WHERE id=t.id;
  v_msg:=CASE p_status
    WHEN 'open' THEN 'La tontine « '||t.name||' » est démarrée : les cotisations peuvent être payées.'
    WHEN 'paused' THEN 'La tontine « '||t.name||' » est mise en pause.'
    WHEN 'completed' THEN 'La tontine « '||t.name||' » est terminée.'
    ELSE 'La tontine « '||t.name||' » est annulée.' END;

  FOR m IN SELECT user_id FROM public.tontine_members WHERE tontine_id=t.id AND membership_status='active' AND user_id<>auth.uid() LOOP
    INSERT INTO public.notifications(user_id,notification_type,title,message,action_url)
    VALUES(m.user_id,'info','Tontine : '||t.name,v_msg,'/tontine/'||t.id);
  END LOOP;

  INSERT INTO public.audit_logs(user_id,organization_id,module_code,action,entity_type,entity_id,new_data)
  VALUES(auth.uid(),t.organization_id,'jdv_tontine','set_status','tontine',t.id::text,jsonb_build_object('from',t.status,'to',p_status,'tontine_type',t.tontine_type));
  RETURN jsonb_build_object('status',p_status);
END;
$function$;

-- Individual savings plans do not auto-open another cycle after their maturity cycle.
CREATE OR REPLACE FUNCTION public.tontine_open_next_cycle_system(p_tontine_id uuid, p_previous_cycle_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog'
AS $function$
DECLARE
  v_prev public.tontine_cycles; v_t public.tontines; v_id uuid; v_num integer;
  v_members integer; v_start date; v_end date; v_duration integer;
BEGIN
  IF current_user <> 'service_role' THEN RAISE EXCEPTION 'SYSTEM_ONLY_TONTINE_ENGINE'; END IF;
  SELECT * INTO v_prev FROM public.tontine_cycles
  WHERE id=p_previous_cycle_id AND tontine_id=p_tontine_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'PREVIOUS_CYCLE_NOT_FOUND'; END IF;
  IF v_prev.status <> 'closed' THEN RAISE EXCEPTION 'PREVIOUS_CYCLE_NOT_CLOSED'; END IF;
  SELECT * INTO v_t FROM public.tontines WHERE id=p_tontine_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'TONTINE_NOT_FOUND'; END IF;
  IF v_t.status NOT IN ('open','active','paused') THEN RETURN NULL; END IF;
  -- An individual plan is one maturity cycle; it never creates an automatic second cycle.
  IF v_t.tontine_type='individual' THEN RETURN NULL; END IF;

  IF EXISTS (SELECT 1 FROM public.tontine_cycles WHERE tontine_id=p_tontine_id AND starts_on=v_prev.ends_on+1) THEN
    SELECT id INTO v_id FROM public.tontine_cycles
    WHERE tontine_id=p_tontine_id AND starts_on=v_prev.ends_on+1 ORDER BY cycle_number DESC LIMIT 1;
    RETURN v_id;
  END IF;

  SELECT count(*) INTO v_members FROM public.tontine_members
  WHERE tontine_id=p_tontine_id AND membership_status='active';
  IF v_members < 2 THEN RAISE EXCEPTION 'MINIMUM_MEMBERS_REQUIRED_FOR_NEXT_CYCLE'; END IF;
  v_start:=v_prev.ends_on+1;
  v_duration:=greatest(0,v_prev.ends_on-v_prev.starts_on);
  v_end:=v_start+v_duration;
  SELECT coalesce(max(cycle_number),0)+1 INTO v_num FROM public.tontine_cycles WHERE tontine_id=p_tontine_id;

  INSERT INTO public.tontine_cycles(tontine_id,cycle_number,starts_on,ends_on,status,total_expected,total_collected)
  VALUES(p_tontine_id,v_num,v_start,v_end,CASE WHEN v_start<=current_date THEN 'active' ELSE 'open' END,
    v_t.contribution_amount*v_members*v_t.cycle_periods,0) RETURNING id INTO v_id;

  INSERT INTO public.tontine_contribution_schedules(cycle_id,member_id,period_number,due_on,expected_amount,late_fee_amount)
  SELECT v_id,tm.id,g,
    v_start+CASE WHEN v_t.frequency='daily' THEN g-1 WHEN v_t.frequency='weekly' THEN 7*(g-1)
      WHEN v_t.frequency='biweekly' THEN 14*(g-1) WHEN v_t.frequency='quarterly' THEN 90*(g-1) ELSE 30*(g-1) END,
    v_t.contribution_amount,v_t.late_fee_amount
  FROM public.tontine_members tm CROSS JOIN generate_series(1,v_t.cycle_periods) g
  WHERE tm.tontine_id=p_tontine_id AND tm.membership_status='active';

  INSERT INTO public.tontine_rotations(cycle_id,member_id,rotation_order,planned_payout_on,expected_amount,beneficiary_phone)
  SELECT v_id,tm.id,
    row_number() OVER(ORDER BY tm.joined_at,tm.created_at,tm.id)::int,
    v_start+CASE WHEN v_t.frequency='daily' THEN row_number() OVER(ORDER BY tm.joined_at,tm.created_at,tm.id)::int-1
      WHEN v_t.frequency='weekly' THEN 7*(row_number() OVER(ORDER BY tm.joined_at,tm.created_at,tm.id)::int-1)
      WHEN v_t.frequency='biweekly' THEN 14*(row_number() OVER(ORDER BY tm.joined_at,tm.created_at,tm.id)::int-1)
      WHEN v_t.frequency='quarterly' THEN 90*(row_number() OVER(ORDER BY tm.joined_at,tm.created_at,tm.id)::int-1)
      ELSE 30*(row_number() OVER(ORDER BY tm.joined_at,tm.created_at,tm.id)::int-1) END,
    v_t.contribution_amount*v_members,p.phone
  FROM public.tontine_members tm JOIN public.profiles p ON p.id=tm.user_id
  WHERE tm.tontine_id=p_tontine_id AND tm.membership_status='active';

  INSERT INTO public.audit_logs(user_id,organization_id,module_code,action,entity_type,entity_id,new_data)
  VALUES(v_t.created_by,v_t.organization_id,'jdv_tontine','automatic_next_cycle','tontine_cycle',v_id::text,
    jsonb_build_object('previous_cycle_id',p_previous_cycle_id,'cycle_number',v_num,'starts_on',v_start,'ends_on',v_end,'automatic',true));
  RETURN v_id;
END;
$function$;

-- Invitation previews and admission are available only after a group is opened.
CREATE OR REPLACE FUNCTION public.tontine_invite_info(p_join_token text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions', 'auth', 'pg_catalog'
AS $function$
DECLARE l public.tontine_join_links; t public.tontines; v_pres uuid; v_code text; v_phone_ok boolean;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'AUTHENTICATION_REQUIRED'; END IF;
  SELECT * INTO l FROM public.tontine_join_links
  WHERE token_hash=encode(digest(btrim(coalesce(p_join_token,'')),'sha256'),'hex')
    AND status='active' AND (expires_at IS NULL OR expires_at>now());
  IF NOT FOUND THEN RAISE EXCEPTION 'INVALID_OR_EXPIRED_JOIN_LINK'; END IF;
  SELECT * INTO t FROM public.tontines WHERE id=l.tontine_id;
  IF NOT FOUND OR t.tontine_type<>'group' THEN RAISE EXCEPTION 'JOIN_LINKS_REQUIRE_GROUP_TONTINE'; END IF;
  IF t.status NOT IN ('open','active') THEN RAISE EXCEPTION 'TONTINE_NOT_OPEN_FOR_ADMISSION'; END IF;
  SELECT user_id INTO v_pres FROM public.tontine_members WHERE id=t.president_member_id;
  SELECT code INTO v_code FROM public.currencies WHERE id=t.currency_id;
  SELECT (phone IS NOT NULL AND btrim(phone)<>'' AND phone_confirmed_at IS NOT NULL)
  INTO v_phone_ok FROM auth.users WHERE id=auth.uid();
  RETURN jsonb_build_object(
    'name',t.name,'description',t.description,'contribution_amount',t.contribution_amount,'currency',v_code,
    'frequency',t.frequency,'cycle_periods',t.cycle_periods,'late_fee_amount',t.late_fee_amount,
    'starts_on',t.starts_on,'status',t.status,'member_limit',t.member_limit,
    'members',(SELECT count(*) FROM public.tontine_members WHERE tontine_id=t.id AND membership_status IN ('active','pending')),
    'president_name',public.tontine_member_label(v_pres),'rules',t.rules,'rules_version',l.rules_version,
    'already_member',EXISTS(SELECT 1 FROM public.tontine_members WHERE tontine_id=t.id AND user_id=auth.uid()),
    'phone_confirmed',coalesce(v_phone_ok,false),'expires_at',l.expires_at
  );
END;
$function$;
