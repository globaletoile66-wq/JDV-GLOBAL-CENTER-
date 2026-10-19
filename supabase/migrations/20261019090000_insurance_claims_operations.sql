-- JDV Assurance: insurer claims operations with row-level authorization.
-- Only organization owners/admins for the policy's organization and active super-admins may review claims.
drop policy if exists insurance_claims_operations_update on public.insurance_claims;
create policy insurance_claims_operations_update
on public.insurance_claims
for update
to authenticated
using (
  public.is_super_admin()
  or exists (
    select 1 from public.insurance_policies p
    where p.id = insurance_claims.policy_id
      and public.is_org_admin(p.organization_id)
  )
)
with check (
  public.is_super_admin()
  or exists (
    select 1 from public.insurance_policies p
    where p.id = insurance_claims.policy_id
      and public.is_org_admin(p.organization_id)
  )
);

-- Remove legacy broad grants (including TRUNCATE) that bypass column-level restrictions.
-- Customer claim creation remains available through insurance_submit_claim(), which
-- validates ownership and inserts as its controlled function owner.
revoke all privileges on table public.insurance_claims from public, anon, authenticated;
grant select on table public.insurance_claims to authenticated;
grant update (status, approved_amount, updated_at)
on public.insurance_claims to authenticated;

create or replace function public.insurance_review_claim(
  p_claim_id uuid,
  p_status text,
  p_approved_amount numeric
)
returns void
language plpgsql
security invoker
set search_path = public, pg_catalog
as $function$
declare
  v_claim public.insurance_claims%rowtype;
begin
  if auth.uid() is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;

  if p_status not in ('under_review', 'approved', 'partially_approved', 'rejected', 'closed') then
    raise exception 'unsupported review status';
  end if;

  select c.* into v_claim
  from public.insurance_claims c
  where c.id = p_claim_id
  for update;

  if not found then
    raise exception 'claim not found or access denied' using errcode = '42501';
  end if;

  if not (
    public.is_super_admin()
    or exists (
      select 1 from public.insurance_policies p
      where p.id = v_claim.policy_id
        and public.is_org_admin(p.organization_id)
    )
  ) then
    raise exception 'insurance operations permission required' using errcode = '42501';
  end if;

  if v_claim.status in ('paid', 'closed') then
    raise exception 'paid or closed claims cannot be reviewed again';
  end if;

  if p_approved_amount is null or p_approved_amount < 0 or p_approved_amount > v_claim.claimed_amount then
    raise exception 'approved amount must be between zero and the declared amount';
  end if;
  if p_status = 'approved' and p_approved_amount <= 0 then
    raise exception 'an approved claim must have a positive approved amount';
  end if;
  if p_status = 'partially_approved'
     and (p_approved_amount <= 0 or p_approved_amount >= v_claim.claimed_amount) then
    raise exception 'partial approval must be positive and below the declared amount';
  end if;
  if p_status = 'rejected' and p_approved_amount <> 0 then
    raise exception 'a rejected claim must have zero approved amount';
  end if;

  update public.insurance_claims
  set status = p_status, approved_amount = p_approved_amount, updated_at = now()
  where id = p_claim_id;
end;
$function$;

revoke all on function public.insurance_review_claim(uuid, text, numeric) from public, anon;
grant execute on function public.insurance_review_claim(uuid, text, numeric) to authenticated;
