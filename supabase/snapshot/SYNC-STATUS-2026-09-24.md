# JDV GLOBAL CENTER — SYNC STATUS

Date: 2026-09-24
Supabase project: lncgghdbnkehdcyhqdfo
GitHub branch: supabase-sync-2026-09-24

## Verification

The current Supabase public schema was rechecked after snapshot creation:

- Tables: 256
- Functions/RPC: 133
- ENUM types: 100
- User triggers: 138
- RLS policies: 531
- Views: 1

The corresponding structural snapshot is present in this branch:

- 01-tables.sql
- 02-constraints.sql
- 03-indexes.sql
- 04-enums.sql
- 05-functions.sql
- 06-triggers.sql
- 07-rls-policies.sql
- 08-views.sql
- MANIFEST.md
- RECONCILIATION.md
- MODULE-MATRIX.md

## Safety

- Supabase production database was not modified.
- No production rows were copied.
- No authentication credentials, service-role keys, API tokens, or secrets were copied.
- GitHub main branch was not modified.
- This branch is the synchronization/archive branch.

## Important distinction

This synchronization captures the current application database schema and database logic represented by the public-schema snapshot. It does not claim to reconstruct the original historical migration text byte-for-byte where those migration files no longer exist in GitHub.

The snapshot is the current-state source of truth for the synchronized public schema at the verification date.
