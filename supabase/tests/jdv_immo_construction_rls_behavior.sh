#!/usr/bin/env bash
set -euo pipefail
OWNER="00000000-0000-4000-8000-000000000001"
OTHER="00000000-0000-4000-8000-000000000002"
psql -v ON_ERROR_STOP=1 <<SQL
set role authenticated;
set request.jwt.claim.sub = '${OWNER}';
insert into public.immo_construction_briefs (user_id, title, parcel_area)
values ('${OWNER}', 'Brouillon propriétaire', 216);
SQL
VISIBLE=$(psql -q -v ON_ERROR_STOP=1 -tA <<SQL
set role authenticated;
set request.jwt.claim.sub = '${OTHER}';
select count(*) from public.immo_construction_briefs;
SQL
)
if [[ "$VISIBLE" != "0" ]]; then
  echo "RLS leak: another user can see the owner's construction brief"
  exit 1
fi
if psql -v ON_ERROR_STOP=1 <<SQL
set role authenticated;
set request.jwt.claim.sub = '${OWNER}';
insert into public.immo_construction_briefs (user_id, title, parcel_area)
values ('${OTHER}', 'Brouillon interdit', 100);
SQL
then
  echo "RLS failure: a user inserted a brief for another user"
  exit 1
fi
echo "JDV Immo construction brief RLS smoke test passed."
