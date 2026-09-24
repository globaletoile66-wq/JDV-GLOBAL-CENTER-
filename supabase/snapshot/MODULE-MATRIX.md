# JDV GLOBAL CENTER — Matrice MODULE → BASE → FRONTEND → STATUT

Date: 2026-09-24
Source DB: lncgghdbnkehdcyhqdfo
Branche: supabase-sync-2026-09-24

## Inventaire global Supabase
- Tables public: 256
- Fonctions/RPC public: 133
- ENUM public: 100
- Triggers utilisateur: 138
- Policies RLS: 531

## Matrice

| Module | Tables repérées | Frontend GitHub | Statut DB |
|---|---:|---|---|
| CORE | 30 | socle global / dashboard / auth | active |
| PAY | 10 | /pay | active |
| CRM | 14 | /crm | active |
| BUSINESS | 14 | /business | active |
| MARKETPLACE | 20 | /marketplace | active |
| IMMO | 17 | /immo | development |
| TRAVEL | 20 | /travel | development |
| TRANSPORT | 22 | /transport | development |
| TRANSIT | 20 | /transit | development |
| HEALTH | 18 | /health | development |
| INSURANCE | 10 | /insurance | development |
| AGRICULTURE | 8 | /agriculture | development |
| ENERGY | 5 | /energy | development |
| ACADEMY | 6 | /academy | development |
| TONTINE | 10 | /tontine | development |
| PUB | 6 | /pub | development |
| MEDIA | 10 | /media | development |
| SOCIAL | 5 | /social | development |
| AI | 7 tables nommées ai_* | /ai | development |

## Constat majeur

Les 19 modules ont déjà une présence frontend dans le dépôt GitHub sous `src/app/`.

La situation n'est donc pas « backend sans frontend ». Le problème principal est la divergence entre:
1. l'état réel et beaucoup plus complet de Supabase;
2. l'historique de migrations versionné dans GitHub;
3. le niveau de finition déclaré par `public.modules.module_status`.

## Frontend détecté
Routes principales:
- /pay
- /business
- /marketplace
- /crm
- /immo
- /travel
- /transport
- /transit
- /health
- /insurance
- /agriculture
- /energy
- /academy
- /tontine
- /pub
- /media
- /social
- /ai

## Migration GitHub actuellement versionnée

Présentes:
- CORE
- PAY
- BUSINESS
- MARKETPLACE
- CRM
- IMMO
- TRAVEL
- TRANSPORT
- HEALTH (partial)

Absentes de `supabase/migrations/` GitHub sous forme d'historique complet:
- TRANSIT
- INSURANCE
- AGRICULTURE
- ENERGY
- ACADEMY
- TONTINE
- PUB
- MEDIA
- SOCIAL
- AI
- nombreuses migrations de durcissement et d'intégrité cross-module
- plusieurs phases complémentaires HEALTH
- plusieurs phases complémentaires PAY/CRM/BUSINESS/MARKETPLACE/IMMO/TRAVEL/TRANSPORT

## Statut fonctionnel à ne pas confondre

`module_status=development` signifie que le statut déclaré dans la base n'est pas `active`. La présence d'une route frontend et de tables ne prouve pas à elle seule que le module est prêt pour production.

Avant activation d'un module, il faudra vérifier:
- pages réellement fonctionnelles;
- appels Supabase/RPC;
- RLS et autorisations;
- paiements et intégrité financière lorsqu'applicable;
- absence de données de démonstration;
- gestion des erreurs;
- tests des flux principaux;
- cohérence avec les types `database.types.ts`.

## Règle de synchronisation

Cette matrice est documentaire uniquement. Aucun changement n'a été effectué dans Supabase et aucune modification n'a été faite dans `main`.

La prochaine opération technique doit être la récupération/versionnement des migrations historiques absentes, dans cette branche de synchronisation uniquement, puis leur contrôle par rapport au snapshot de schéma déjà enregistré.
