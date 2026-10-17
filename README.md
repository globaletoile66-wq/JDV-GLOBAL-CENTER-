# JDV Global Center

Application web Next.js 15 / React 19 / Tailwind, base Supabase.

```bash
cp .env.example .env.local   # renseigner les clés
npm install
npm run dev                  # http://localhost:4028
npm run type-check && npm run build
```

- `src/app/` : une page par route (auth, pay, business, marketplace, abonnements, super-admin, branches JDV).
- `src/components`, `src/contexts`, `src/lib`, `src/hooks` : code partagé.
- `database/` : voir `database/README.md`.
- `backend/edge-functions/` : brouillons de fonctions Edge (non déployées tant que non testées).
- `docs/` : notes d'intégration par module.

Variables à définir aussi dans Netlify (Site settings > Environment variables) : les trois du `.env.example`.
