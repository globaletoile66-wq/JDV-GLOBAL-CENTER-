# JDV Global Center — rapport de blocage déploiement et schéma
Date : 20 octobre 2026
Branche de référence examinée : `supabase-sync-2026-09-24`

## Portée et précautions
Cette vérification est en lecture seule. Elle ne lance aucune migration, ne modifie aucune politique RLS, ne touche pas au CRM historique et ne modifie pas JDV Academy ni JDV Santé. Elle ne vaut pas validation fonctionnelle complète.

## 1. Résultat des déploiements après la PR #153
La PR #153 a été fusionnée (commit de fusion `81c449e517976d6f2d8721c43d5d4587f024b5e7`), mais les Deploy Previews Netlify pour son commit `335066e59e9b2eae4f66ad7683290c9ce1a9f59a` ont signalé `error` sur plusieurs sites, notamment :
- `shiny-khapse-609dec`
- `cozy-pudding-149671`
- `jdv-global-center`
- `euphonious-bavarois-fb02e2`
- `comfy-bienenstitch-ab9522`

Les statuts GitHub associés sont en échec. Les métadonnées de déploiement accessibles ne contiennent pas le détail de l'erreur de compilation. Il est donc impossible de désigner honnêtement une ligne fautive sans consulter le journal de build Netlify. La fusion ne doit pas être assimilée à une livraison validée.

## 2. Vérification ciblée de la route d'administration
Contrôles positifs observés :
- `src/app/admin/page.tsx` existe.
- `src/app/auth/login/page.tsx` existe.
- `src/app/access-required/page.tsx` existe et connaît le motif `super_admin_required`.
- Le helper `src/lib/supabase/server.ts` exporte une fonction asynchrone `createClient()`.
- La table distante `public.super_admins` possède les colonnes `id`, `user_id` et `admin_status` utilisées par la page.

Limite : ces contrôles de présence et de structure ne remplacent pas un test d'accès avec comptes autorisé/non autorisé. Le déploiement échoué empêche également de conclure que la route s'exécute en environnement hébergé.

## 3. Écart du catalogue JDV Services
Les fichiers suivants existent dans le dépôt :
- `supabase/migrations/20261019191000_jdv_services_marketplace.sql`
- `supabase/migrations/20261020100000_jdv_services_workflow_hardening.sql`

La première migration crée notamment `public.jdv_service_offerings` et `public.jdv_service_requests`. Une requête de lecture seule sur `information_schema.tables` dans le projet Supabase connecté n'a retourné aucune de ces deux tables. Les tables `marketplace_listings`, `modules`, `user_favorites` et `super_admins` sont, elles, présentes.

Conclusion limitée : le schéma distant consulté ne contient actuellement pas ces tables sous ces noms. Cela ne suffit pas à affirmer que le code entier de JDV Services est inutilisable, mais l'écran ne doit pas être considéré prêt pour production tant que le contrat de données et les politiques de sécurité n'ont pas été validés.

### Action sûre suivante
1. Comparer la liste des migrations enregistrées à la liste du dépôt, en distinguant les migrations appliquées, les fichiers locaux et l'historique récupéré.
2. Examiner entièrement les deux migrations JDV Services, y compris les politiques RLS, les fonctions et les transitions de statut.
3. Tester ces migrations dans une base de prévisualisation isolée et exécuter des tests de comportement RLS.
4. Obtenir une autorisation explicite avant toute application sur la base distante de production.

## 4. Ne pas confondre les trois catalogues
Les routes et tables observées indiquent des responsabilités distinctes :
- `/marketplace` : catalogue de produits/listings, associé à `marketplace_listings`.
- `/service-marketplace` : offres de services et demandes de devis, dont le schéma attendu comprend `jdv_service_offerings` et `jdv_service_requests`.
- `/services` : catalogue de modules de la plateforme, utilisant notamment `modules` et `user_favorites`.

Ces parcours ne doivent pas être fusionnés simplement parce qu'ils utilisent tous la notion de « catalogue ». Ils peuvent partager des composants visuels, mais les données, statuts, autorisations et workflows restent distincts.

## 5. Ordre de remédiation
- **P0 — Build :** obtenir le journal complet du déploiement Netlify échoué et corriger la première erreur reproductible.
- **P1 — Contrat de schéma :** rapprocher les migrations locales et l'historique distant ; confirmer le schéma de JDV Services.
- **P2 — Sécurité :** tests d'accès de `/admin` et tests RLS de JDV Services en environnement isolé.
- **P3 — Navigation :** vérifier les liens et destinations des routes recensées, sans supprimer de page sur la seule base de son nom.
- **P4 — Harmonisation :** unifier progressivement les composants communs uniquement après validation des contrats métier.

## Résultats de cette passe
- Lecture seule effectuée sur le dépôt et le schéma distant.
- Échec des Deploy Previews confirmé via les statuts GitHub et les états Netlify.
- Aucune migration distante exécutée.
- Aucune donnée modifiée.
- Build local, tests de bout en bout et comportement en production non vérifiés dans cette passe.
