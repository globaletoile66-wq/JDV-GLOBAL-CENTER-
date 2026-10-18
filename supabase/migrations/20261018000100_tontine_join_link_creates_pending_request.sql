-- JDV Tontine: a join link is a request, not proof of identity or approval.
-- Review-only migration: do not apply to production without explicit approval.

CREATE OR REPLACE FUNCTION public.tontine_join_by_link(
  p_join_token text,
  p_accept_rules boolean
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_user uuid := auth.uid();
  v_link public.tontine_join_links;
  v_tontine public.tontines;
  v_member uuid;
  v_phone text;
  v_phone_confirmed timestamptz;
  v_existing boolean;
  v_member_count integer;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'AUTH_REQUIRED'; END IF;
  IF coalesce(trim(p_join_token), '') = '' THEN RAISE EXCEPTION 'INVALID_JOIN_LINK'; END IF;
  IF NOT p_accept_rules THEN RAISE EXCEPTION 'RULES_ACCEPTANCE_REQUIRED'; END IF;

  SELECT * INTO v_link
  FROM public.tontine_join_links
  WHERE token_hash = encode(digest(trim(p_join_token), 'sha256'), 'hex')
    AND status = 'active'
    AND (expires_at IS NULL OR expires_at > now())
  FOR UPDATE;

  IF NOT FOUND THEN RAISE EXCEPTION 'INVALID_OR_EXPIRED_JOIN_LINK'; END IF;

  SELECT * INTO v_tontine
  FROM public.tontines
  WHERE id = v_link.tontine_id
  FOR UPDATE;

  IF NOT FOUND THEN RAISE EXCEPTION 'TONTINE_NOT_FOUND'; END IF;
  IF v_tontine.status IN ('cancelled', 'completed') THEN
    RAISE EXCEPTION 'TONTINE_CLOSED';
  END IF;

  -- A confirmed phone proves control of a phone number, not civil identity.
  SELECT phone, phone_confirmed_at
  INTO v_phone, v_phone_confirmed
  FROM auth.users
  WHERE id = v_user;

  IF coalesce(v_phone, '') = '' THEN RAISE EXCEPTION 'PHONE_REQUIRED_FOR_TONTINE_IDENTITY'; END IF;
  IF v_phone_confirmed IS NULL THEN RAISE EXCEPTION 'PHONE_IDENTITY_NOT_CONFIRMED'; END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.tontine_members
    WHERE tontine_id = v_tontine.id AND user_id = v_user
  ) INTO v_existing;

  SELECT count(*) INTO v_member_count
  FROM public.tontine_members
  WHERE tontine_id = v_tontine.id
    AND membership_status IN ('active', 'pending');

  IF NOT v_existing AND v_member_count >= v_tontine.member_limit THEN
    RAISE EXCEPTION 'MEMBER_LIMIT_REACHED';
  END IF;

  INSERT INTO public.tontine_members (
    tontine_id, user_id, role, membership_status, joined_at,
    rules_accepted_at, rules_version,
    identity_confirmed_at, identity_confirmation_method
  )
  VALUES (
    v_tontine.id, v_user, 'member', 'pending', NULL,
    now(), v_link.rules_version,
    NULL, NULL
  )
  ON CONFLICT (tontine_id, user_id) DO UPDATE
  SET membership_status = CASE
        -- Never downgrade a fully active member or bypass a restriction by reusing a link.
        WHEN tontine_members.membership_status IN ('active', 'suspended', 'rejected', 'left')
          THEN tontine_members.membership_status
        ELSE 'pending'
      END,
      joined_at = CASE
        WHEN tontine_members.membership_status = 'active'
          THEN tontine_members.joined_at
        ELSE NULL
      END,
      rules_accepted_at = now(),
      rules_version = EXCLUDED.rules_version,
      identity_confirmed_at = CASE
        WHEN tontine_members.membership_status = 'active'
          THEN tontine_members.identity_confirmed_at
        ELSE NULL
      END,
      identity_confirmation_method = CASE
        WHEN tontine_members.membership_status = 'active'
          THEN tontine_members.identity_confirmation_method
        ELSE NULL
      END,
      updated_at = now()
  RETURNING id INTO v_member;

  UPDATE public.tontine_join_links
  SET uses_count = uses_count + CASE WHEN NOT v_existing THEN 1 ELSE 0 END,
      accepted_by = v_user,
      accepted_at = now(),
      status = CASE
        WHEN max_uses IS NOT NULL
          AND uses_count + CASE WHEN NOT v_existing THEN 1 ELSE 0 END >= max_uses
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
      'membership_request_created', true,
      'membership_status_after_request', (
        SELECT membership_status FROM public.tontine_members WHERE id = v_member
      ),
      'phone_confirmed', true,
      'identity_verified', false,
      'rules_accepted', true,
      'rules_version', v_link.rules_version,
      'shared_group_link', true
    )
  );

  RETURN v_member;
END;
$function$;
