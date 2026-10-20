#!/usr/bin/env bash
set -euo pipefail
PROVIDER="00000000-0000-4000-8000-000000000001"
REQUESTER="00000000-0000-4000-8000-000000000002"
OUTSIDER="00000000-0000-4000-8000-000000000003"
OFFERING="90000000-0000-4000-8000-000000000001"
REQUEST="a0000000-0000-4000-8000-000000000001"

psql -v ON_ERROR_STOP=1 <<SQL
set role authenticated;
set request.jwt.claim.sub = '${PROVIDER}';
insert into public.jdv_service_offerings (id, provider_id, title, category, description, pricing_mode, currency, status)
values ('${OFFERING}', '${PROVIDER}', 'Réparation plomberie', 'Plomberie', 'Intervention plomberie et réparation à domicile.', 'quote', 'XOF', 'published');
set request.jwt.claim.sub = '${REQUESTER}';
insert into public.jdv_service_requests (id, offering_id, requester_id, message)
values ('${REQUEST}', '${OFFERING}', '${REQUESTER}', 'Merci de me proposer un devis pour cette intervention.');
SQL

PUBLIC_COUNT=$(psql -q -v ON_ERROR_STOP=1 -tA <<SQL
set role anon;
select count(*) from public.jdv_service_offerings where id = '${OFFERING}' and status = 'published';
SQL
)
if [[ "$PUBLIC_COUNT" != "1" ]]; then echo "Published offerings should be visible publicly"; exit 1; fi

OUTSIDER_COUNT=$(psql -q -v ON_ERROR_STOP=1 -tA <<SQL
set role authenticated;
set request.jwt.claim.sub = '${OUTSIDER}';
select count(*) from public.jdv_service_requests where id = '${REQUEST}';
SQL
)
if [[ "$OUTSIDER_COUNT" != "0" ]]; then echo "RLS leak: unrelated user can see a service request"; exit 1; fi

psql -v ON_ERROR_STOP=1 <<SQL
set role authenticated;
set request.jwt.claim.sub = '${PROVIDER}';
update public.jdv_service_requests set status = 'quoted', proposed_price = 12500, provider_response = 'Devis initial' where id = '${REQUEST}';
set request.jwt.claim.sub = '${REQUESTER}';
update public.jdv_service_requests set status = 'accepted' where id = '${REQUEST}';
set request.jwt.claim.sub = '${PROVIDER}';
update public.jdv_service_requests set status = 'completed' where id = '${REQUEST}';
SQL

if psql -v ON_ERROR_STOP=1 <<SQL
set role authenticated;
set request.jwt.claim.sub = '${REQUESTER}';
update public.jdv_service_requests set provider_response = 'Modification interdite' where id = '${REQUEST}';
SQL
then echo "Workflow guard failure: customer modified provider response"; exit 1; fi

echo "JDV Services RLS and workflow smoke test passed."
