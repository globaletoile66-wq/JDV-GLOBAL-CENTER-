#!/usr/bin/env bash
set -euo pipefail
ADMIN="00000000-0000-4000-8000-000000000001"; OWNER="00000000-0000-4000-8000-000000000002"; AGENT="00000000-0000-4000-8000-000000000003"; OUTSIDER="00000000-0000-4000-8000-000000000004"
BUSINESS="b0000000-0000-4000-8000-000000000001"; PROPERTY="c0000000-0000-4000-8000-000000000001"; LEASE="d0000000-0000-4000-8000-000000000001"
APP="e0000000-0000-4000-8000-000000000001"; MANDATE="f0000000-0000-4000-8000-000000000001"; FOLLOWUP="a1000000-0000-4000-8000-000000000001"; DISPUTE="a2000000-0000-4000-8000-000000000001"; RULE="a3000000-0000-4000-8000-000000000001"; BRIEF="a4000000-0000-4000-8000-000000000001"; APP_NO_BUSINESS="a5000000-0000-4000-8000-000000000001"

psql -v ON_ERROR_STOP=1 <<SQL
set role authenticated;
set request.jwt.claim.sub = '${OWNER}';
insert into public.immo_agent_applications (id,user_id,business_id,full_name,application_status) values ('${APP}','${OWNER}','${BUSINESS}','Candidat JDV Immo','pending');
insert into public.immo_mandates (id,property_id,owner_user_id,agent_user_id,mandate_type,title,mandate_status) values ('${MANDATE}','${PROPERTY}','${OWNER}','${AGENT}','rental','Mandat de test','draft');
insert into public.immo_commission_rules (id,rule_name,transaction_type,created_by,rule_status) values ('${RULE}','Règle de test','rental','${OWNER}','draft');
insert into public.immo_tenant_followups (id,lease_id,author_user_id,subject,details) values ('${FOLLOWUP}','${LEASE}','${OWNER}','Suivi de bail','Test de visibilité entre participants');
insert into public.immo_disputes (id,opened_by,respondent_user_id,property_id,lease_id,subject,description) values ('${DISPUTE}','${OWNER}','${AGENT}','${PROPERTY}','${LEASE}','Litige de test','Dossier de test isolé');
insert into public.immo_construction_briefs (id,user_id,title,parcel_area,brief_status) values ('${BRIEF}','${OWNER}','Avant-projet soumis par fonction',180,'draft');
select public.submit_immo_construction_brief('${BRIEF}');
SQL

count_as() { psql -q -v ON_ERROR_STOP=1 -tA <<SQL
set role authenticated;
set request.jwt.claim.sub = '$1';
$2
SQL
}
[[ "$(count_as "$OUTSIDER" "select count(*) from public.immo_agent_applications where id='${APP}';")" == "0" ]] || { echo "RLS leak: agent application"; exit 1; }
[[ "$(count_as "$OUTSIDER" "select count(*) from public.immo_mandates where id='${MANDATE}';")" == "0" ]] || { echo "RLS leak: mandate"; exit 1; }
[[ "$(count_as "$OUTSIDER" "select count(*) from public.immo_tenant_followups where id='${FOLLOWUP}';")" == "0" ]] || { echo "RLS leak: tenant follow-up"; exit 1; }
[[ "$(count_as "$AGENT" "select count(*) from public.immo_tenant_followups where id='${FOLLOWUP}';")" == "1" ]] || { echo "Lease participant cannot read follow-up"; exit 1; }
[[ "$(count_as "$AGENT" "select count(*) from public.immo_disputes where id='${DISPUTE}';")" == "1" ]] || { echo "Dispute respondent cannot read case"; exit 1; }
[[ "$(count_as "$OUTSIDER" "select count(*) from public.immo_disputes where id='${DISPUTE}';")" == "0" ]] || { echo "RLS leak: dispute"; exit 1; }
[[ "$(count_as "$OWNER" "select count(*) from public.jdv_studio_settings;")" == "1" ]] || { echo "Public visual settings should be readable by regular users"; exit 1; }
[[ "$(count_as "$ADMIN" "select count(*) from public.jdv_studio_settings;")" == "1" ]] || { echo "Super Admin cannot read Studio settings"; exit 1; }

ANON_SETTINGS=$(psql -q -v ON_ERROR_STOP=1 -tA <<SQL
set role anon;
select count(*) from public.jdv_studio_settings;
SQL
)
[[ "$ANON_SETTINGS" == "1" ]] || { echo "Anonymous clients cannot read the safe visual settings"; exit 1; }

if psql -v ON_ERROR_STOP=1 <<'SQL'
select updated_by from public.jdv_studio_settings;
SQL
then
  echo "Anonymous clients can read the private updater identity"
  exit 1
fi

if psql -v ON_ERROR_STOP=1 <<'SQL'
update public.jdv_studio_settings
set config = '{"theme":{"primary":"#123456","accent":"#abcdef"},"design":{"imageData":"PRIVATE_BASE64"}}'::jsonb
where scope_key='global';
SQL
then
  echo "Public config allowlist failed to reject embedded private media data"
  exit 1
fi

psql -v ON_ERROR_STOP=1 <<SQL
set role authenticated;
set request.jwt.claim.sub = '${OWNER}';
select public.submit_immo_mandate('${MANDATE}');
select public.accept_immo_mandate('${MANDATE}');
set request.jwt.claim.sub = '${AGENT}';
select public.accept_immo_mandate('${MANDATE}');
SQL
MANDATE_STATUS=$(psql -q -v ON_ERROR_STOP=1 -tA -c "select mandate_status from public.immo_mandates where id='${MANDATE}'")
[[ "$MANDATE_STATUS" == "active" ]] || { echo "Mandate did not activate after both participants accepted"; exit 1; }

psql -v ON_ERROR_STOP=1 <<SQL
set role authenticated;
set request.jwt.claim.sub = '${ADMIN}';
select public.review_immo_agent_application('${APP}','qualified','Validé après test');
SQL
AGENT_COUNT=$(psql -q -v ON_ERROR_STOP=1 -tA -c "select count(*) from public.immo_agents where user_id='${OWNER}' and verification_status='verified'")
[[ "$AGENT_COUNT" == "1" ]] || { echo "Super Admin qualification did not create verified agent"; exit 1; }

psql -v ON_ERROR_STOP=1 <<SQL
set role authenticated;
set request.jwt.claim.sub = '${AGENT}';
insert into public.immo_agent_applications (id,user_id,business_id,full_name,application_status) values ('${APP_NO_BUSINESS}','${AGENT}',null,'Candidat sans entreprise','pending');
SQL
if psql -v ON_ERROR_STOP=1 <<SQL
set role authenticated;
set request.jwt.claim.sub = '${ADMIN}';
select public.review_immo_agent_application('${APP_NO_BUSINESS}','qualified','');
SQL
then echo "Qualification guard failure: application without a business profile was qualified"; exit 1; fi

echo "JDV Immo persistent workflow RLS smoke test passed."
