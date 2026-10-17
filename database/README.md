# Base de données JDV Global Center

Projet Supabase : `lncgghdbnkehdcyhqdfo` (production).

- `migrations/` : trace versionnée du SQL **déjà appliqué en production** (via l'interface/MCP Supabase).
  Les noms de fichiers ne correspondent pas aux versions de `supabase_migrations.schema_migrations`.
  **Ne lancez pas `supabase db push` ni `db reset` avec ces fichiers.**
- `reference/` : SQL de fondation et schémas historiques (Rocket, secteurs). Lecture seule, à ne pas rejouer.
- Tout nouveau changement de schéma : une migration appliquée sur un environnement de préproduction d'abord,
  puis copiée ici avec la date et le motif.
