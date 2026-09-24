# JDV GLOBAL CENTER — Rapport de réconciliation Supabase / GitHub

Date: 2026-09-24
Supabase source: `lncgghdbnkehdcyhqdfo`
GitHub: `globaletoile66-wq/JDV-GLOBAL-CENTER-`
Branche de travail: `supabase-sync-2026-09-24`

## Objectif
Documenter l'écart entre l'historique réel des migrations Supabase et les migrations versionnées dans GitHub, sans modifier Supabase ni `main`.

## État constaté

Supabase contient un historique de migrations nettement plus complet que les fichiers actuellement présents dans `supabase/migrations/` de GitHub.

GitHub contient actuellement 9 migrations de base correspondant principalement à CORE, PAY, BUSINESS, MARKETPLACE, CRM, IMMO, TRAVEL, TRANSPORT et une première version HEALTH.

Supabase contient également les évolutions et durcissements ultérieurs de ces modules ainsi que TRANSIT, les phases complètes HEALTH, AI, TONTINE, INSURANCE, AGRICULTURE, ENERGY, ACADEMY, PUB, MEDIA et SOCIAL.

## Point important
Les migrations Supabase sont la source de vérité de l'état historique du schéma actuellement déployé. Le snapshot déjà présent dans `supabase/snapshot/` capture la structure actuelle (tables, contraintes, index, enums, fonctions, triggers, RLS et vues), sans données de production ni secrets.

## Migration history Supabase
L'historique réel comporte notamment:
- CRM: crm_01 à crm_06 + durcissements
- IMMO: immo_01 à immo_05
- TRAVEL: travel_01 à travel_05 + sécurité
- TRANSPORT: transport_01 à transport_05 + extensions
- TRANSIT: transit_01 à transit_06 + intégrité financière
- HEALTH: health_01 à health_05 + sécurité
- PAY: wallet core + verrouillages/intégrité financière
- AI: foundations, functions, context, controlled query, audit, guardrails, quotas/models, admin/provider management
- TONTINE: foundation, engine, PAY integration, payout dispatch, due operations, dashboard, finalization, penalties, financial control/security/reversal
- AGRICULTURE, ENERGY, ACADEMY, PUB, MEDIA, SOCIAL: foundations
- nombreuses migrations de sécurité globale/RLS et d'intégrité cross-module
- activation récente de CRM

## Prochaine étape recommandée
1. Conserver cette branche comme branche de synchronisation, sans merge vers `main`.
2. Ajouter à cette branche les migrations historiques Supabase absentes de GitHub, dans un dossier clairement identifié comme export/snapshot historique, plutôt que de réécrire arbitrairement les anciennes migrations déjà présentes.
3. Comparer ensuite le code applicatif de GitHub aux tables/RPC réellement disponibles.
4. Produire une matrice MODULE → TABLES → RPC → FRONTEND → STATUT avant toute fusion.
5. Ne modifier Supabase qu'après validation explicite d'une éventuelle correction.

## Sécurité
- Supabase production non modifié.
- Branche `main` non modifiée.
- Aucun mot de passe, clé service-role, token ou donnée de production exporté.
