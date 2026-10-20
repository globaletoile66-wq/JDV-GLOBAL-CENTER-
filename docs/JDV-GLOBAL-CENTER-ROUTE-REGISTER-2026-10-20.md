# Registre initial des routes JDV Global Center

**Branche d'audit :** `audit/jdv-architecture-inventory-2026-10-20`  
**Base examinée :** `supabase-sync-2026-09-24`  
**Nature :** inventaire généré à partir des chemins Git, sans exécution de l'application.

## Comment lire ce registre

- **Route** est déduite du chemin Next.js ; les segments dynamiques `[id]` sont notés `:id`.
- **Domaine pressenti** est une classification initiale à confirmer avec le cahier des charges Rocket.
- **Entrée de navigation** et **statut fonctionnel** restent « À vérifier » tant qu'on n'a pas suivi les liens dans le code et testé la route.
- Les routes sont des fichiers de pages, pas nécessairement des écrans uniques ou publiquement accessibles.
- `/crm` et ses sous-routes sont consignés uniquement pour repérage structurel. **Aucun changement au CRM historique n'est autorisé dans ce chantier.**
- JDV Academy et JDV Santé sont inventoriées sans modification de leur implémentation.

## Synthèse

- Fichiers de pages listés : **167** (incluant la route racine).
- Gestionnaires API détectés sous `src/app/api` : **2**.
- Les liens entrants/sortants, les contrôles d'accès, les dépendances Supabase et les tests doivent encore être analysés.

### Nombre de pages par segment de premier niveau

| Segment | Pages |
|---|---:|
| `business` | 20 |
| `media` | 12 |
| `pay` | 11 |
| `academy` | 10 |
| `marketplace` | 10 |
| `social` | 9 |
| `tontine` | 9 |
| `auth` | 7 |
| `crm` | 7 |
| `health` | 7 |
| `insurance` | 5 |
| `hidden-concepteur-gate` | 4 |
| `abonnements` | 3 |
| `pub` | 3 |
| `super-admin` | 3 |
| `transit` | 3 |
| `travel` | 3 |
| `immo` | 2 |
| `prospecteur` | 2 |
| `service-marketplace` | 2 |
| `settings` | 2 |
| `transport` | 2 |
| `page.tsx` | 1 |
| `about` | 1 |
| `access-required` | 1 |
| `accounting` | 1 |
| `accueil-v2` | 1 |
| `agriculture` | 1 |
| `ai` | 1 |
| `architecture` | 1 |
| `branches` | 1 |
| `coming-soon` | 1 |
| `community` | 1 |
| `dashboard` | 1 |
| `energy` | 1 |
| `espace` | 1 |
| `events` | 1 |
| `help` | 1 |
| `hr` | 1 |
| `inventory` | 1 |
| `jobs` | 1 |
| `landing-home-page` | 1 |
| `legal` | 1 |
| `maintenance` | 1 |
| `notifications` | 1 |
| `onboarding` | 1 |
| `organizations` | 1 |
| `parametres` | 1 |
| `procurement` | 1 |
| `profile` | 1 |
| `services` | 1 |
| `sign-up-login-screen` | 1 |
| `user-dashboard` | 1 |

## Registre exhaustif des routes détectées

| Route déduite | Fichier source | Domaine pressenti | Entrée de navigation | Statut fonctionnel |
|---|---|---|---|---|
| `/page.tsx` | `src/app/page.tsx` | À classifier | À vérifier | À vérifier |
| `/abonnements/factures/:id` | `src/app/abonnements/factures/[id]/page.tsx` | Abonnements & facturation | À vérifier | À vérifier |
| `/abonnements/factures` | `src/app/abonnements/factures/page.tsx` | Abonnements & facturation | À vérifier | À vérifier |
| `/abonnements` | `src/app/abonnements/page.tsx` | Abonnements & facturation | À vérifier | À vérifier |
| `/about` | `src/app/about/page.tsx` | Site public | À vérifier | À vérifier |
| `/academy/ai` | `src/app/academy/ai/page.tsx` | Formation — périmètre protégé | À vérifier | À vérifier |
| `/academy/business` | `src/app/academy/business/page.tsx` | Formation — périmètre protégé | À vérifier | À vérifier |
| `/academy/certificates/:code` | `src/app/academy/certificates/[code]/page.tsx` | Formation — périmètre protégé | À vérifier | À vérifier |
| `/academy/courses/:id` | `src/app/academy/courses/[id]/page.tsx` | Formation — périmètre protégé | À vérifier | À vérifier |
| `/academy/demo` | `src/app/academy/demo/page.tsx` | Formation — périmètre protégé | À vérifier | À vérifier |
| `/academy/intelligence` | `src/app/academy/intelligence/page.tsx` | Formation — périmètre protégé | À vérifier | À vérifier |
| `/academy/live` | `src/app/academy/live/page.tsx` | Formation — périmètre protégé | À vérifier | À vérifier |
| `/academy` | `src/app/academy/page.tsx` | Formation — périmètre protégé | À vérifier | À vérifier |
| `/academy/revenue` | `src/app/academy/revenue/page.tsx` | Formation — périmètre protégé | À vérifier | À vérifier |
| `/academy/studio` | `src/app/academy/studio/page.tsx` | Formation — périmètre protégé | À vérifier | À vérifier |
| `/access-required` | `src/app/access-required/page.tsx` | Accès & permissions | À vérifier | À vérifier |
| `/accounting` | `src/app/accounting/page.tsx` | Gestion opérationnelle | À vérifier | À vérifier |
| `/accueil-v2` | `src/app/accueil-v2/page.tsx` | Accueil — vérifier coexistence avec la route racine | À vérifier | À vérifier |
| `/agriculture` | `src/app/agriculture/page.tsx` | Ressources & production | À vérifier | À vérifier |
| `/ai` | `src/app/ai/page.tsx` | IA transversale | À vérifier | À vérifier |
| `/architecture/branches` | `src/app/architecture/branches/page.tsx` | Architecture & gouvernance | À vérifier | À vérifier |
| `/auth/callback` | `src/app/auth/callback/page.tsx` | Identité & sécurité | À vérifier | À vérifier |
| `/auth/forgot-password` | `src/app/auth/forgot-password/page.tsx` | Identité & sécurité | À vérifier | À vérifier |
| `/auth/login` | `src/app/auth/login/page.tsx` | Identité & sécurité | À vérifier | À vérifier |
| `/auth/mfa` | `src/app/auth/mfa/page.tsx` | Identité & sécurité | À vérifier | À vérifier |
| `/auth/register` | `src/app/auth/register/page.tsx` | Identité & sécurité | À vérifier | À vérifier |
| `/auth/reset-password` | `src/app/auth/reset-password/page.tsx` | Identité & sécurité | À vérifier | À vérifier |
| `/auth/verify-email` | `src/app/auth/verify-email/page.tsx` | Identité & sécurité | À vérifier | À vérifier |
| `/branches` | `src/app/branches/page.tsx` | Catalogue des branches | À vérifier | À vérifier |
| `/business/appointments/new` | `src/app/business/appointments/new/page.tsx` | Outils de gestion professionnelle — à comparer | À vérifier | À vérifier |
| `/business/appointments` | `src/app/business/appointments/page.tsx` | Outils de gestion professionnelle — à comparer | À vérifier | À vérifier |
| `/business/clients/new` | `src/app/business/clients/new/page.tsx` | Outils de gestion professionnelle — à comparer | À vérifier | À vérifier |
| `/business/clients` | `src/app/business/clients/page.tsx` | Outils de gestion professionnelle — à comparer | À vérifier | À vérifier |
| `/business/create` | `src/app/business/create/page.tsx` | Outils de gestion professionnelle — à comparer | À vérifier | À vérifier |
| `/business/expenses/new` | `src/app/business/expenses/new/page.tsx` | Outils de gestion professionnelle — à comparer | À vérifier | À vérifier |
| `/business/expenses` | `src/app/business/expenses/page.tsx` | Outils de gestion professionnelle — à comparer | À vérifier | À vérifier |
| `/business/invoices/new` | `src/app/business/invoices/new/page.tsx` | Outils de gestion professionnelle — à comparer | À vérifier | À vérifier |
| `/business/invoices` | `src/app/business/invoices/page.tsx` | Outils de gestion professionnelle — à comparer | À vérifier | À vérifier |
| `/business/orders` | `src/app/business/orders/page.tsx` | Outils de gestion professionnelle — à comparer | À vérifier | À vérifier |
| `/business` | `src/app/business/page.tsx` | Outils de gestion professionnelle — à comparer | À vérifier | À vérifier |
| `/business/products/new` | `src/app/business/products/new/page.tsx` | Outils de gestion professionnelle — à comparer | À vérifier | À vérifier |
| `/business/products` | `src/app/business/products/page.tsx` | Outils de gestion professionnelle — à comparer | À vérifier | À vérifier |
| `/business/reports` | `src/app/business/reports/page.tsx` | Outils de gestion professionnelle — à comparer | À vérifier | À vérifier |
| `/business/sales/new` | `src/app/business/sales/new/page.tsx` | Outils de gestion professionnelle — à comparer | À vérifier | À vérifier |
| `/business/sales` | `src/app/business/sales/page.tsx` | Outils de gestion professionnelle — à comparer | À vérifier | À vérifier |
| `/business/settings` | `src/app/business/settings/page.tsx` | Outils de gestion professionnelle — à comparer | À vérifier | À vérifier |
| `/business/suppliers/new` | `src/app/business/suppliers/new/page.tsx` | Outils de gestion professionnelle — à comparer | À vérifier | À vérifier |
| `/business/suppliers` | `src/app/business/suppliers/page.tsx` | Outils de gestion professionnelle — à comparer | À vérifier | À vérifier |
| `/business/team` | `src/app/business/team/page.tsx` | Outils de gestion professionnelle — à comparer | À vérifier | À vérifier |
| `/coming-soon` | `src/app/coming-soon/page.tsx` | Système / placeholder | À vérifier | À vérifier |
| `/community` | `src/app/community/page.tsx` | Communauté & réseau | À vérifier | À vérifier |
| `/crm/alerts` | `src/app/crm/alerts/page.tsx` | CRM historique — hors périmètre de modification | À vérifier | À vérifier |
| `/crm/collections` | `src/app/crm/collections/page.tsx` | CRM historique — hors périmètre de modification | À vérifier | À vérifier |
| `/crm` | `src/app/crm/page.tsx` | CRM historique — hors périmètre de modification | À vérifier | À vérifier |
| `/crm/prospects/:id` | `src/app/crm/prospects/[id]/page.tsx` | CRM historique — hors périmètre de modification | À vérifier | À vérifier |
| `/crm/prospects` | `src/app/crm/prospects/page.tsx` | CRM historique — hors périmètre de modification | À vérifier | À vérifier |
| `/crm/settings/notifications` | `src/app/crm/settings/notifications/page.tsx` | CRM historique — hors périmètre de modification | À vérifier | À vérifier |
| `/crm/stock` | `src/app/crm/stock/page.tsx` | CRM historique — hors périmètre de modification | À vérifier | À vérifier |
| `/dashboard` | `src/app/dashboard/page.tsx` | Pilotage | À vérifier | À vérifier |
| `/energy` | `src/app/energy/page.tsx` | Ressources & production | À vérifier | À vérifier |
| `/espace` | `src/app/espace/page.tsx` | Espace utilisateur | À vérifier | À vérifier |
| `/events` | `src/app/events/page.tsx` | Événements | À vérifier | À vérifier |
| `/health/admin/demandes` | `src/app/health/admin/demandes/page.tsx` | Santé — périmètre protégé | À vérifier | À vérifier |
| `/health/espace-professionnel` | `src/app/health/espace-professionnel/page.tsx` | Santé — périmètre protégé | À vérifier | À vérifier |
| `/health/gardes` | `src/app/health/gardes/page.tsx` | Santé — périmètre protégé | À vérifier | À vérifier |
| `/health/inscription-professionnel` | `src/app/health/inscription-professionnel/page.tsx` | Santé — périmètre protégé | À vérifier | À vérifier |
| `/health` | `src/app/health/page.tsx` | Santé — périmètre protégé | À vérifier | À vérifier |
| `/health/reseau` | `src/app/health/reseau/page.tsx` | Santé — périmètre protégé | À vérifier | À vérifier |
| `/health/teleconsultation` | `src/app/health/teleconsultation/page.tsx` | Santé — périmètre protégé | À vérifier | À vérifier |
| `/help` | `src/app/help/page.tsx` | Aide & support | À vérifier | À vérifier |
| `/hidden-concepteur-gate/dashboard/controle-plateforme` | `src/app/hidden-concepteur-gate/dashboard/controle-plateforme/page.tsx` | Accès concepteur — vérifier exposition et contrôle d'accès | À vérifier | À vérifier |
| `/hidden-concepteur-gate/dashboard` | `src/app/hidden-concepteur-gate/dashboard/page.tsx` | Accès concepteur — vérifier exposition et contrôle d'accès | À vérifier | À vérifier |
| `/hidden-concepteur-gate/dashboard/portefeuille-clients` | `src/app/hidden-concepteur-gate/dashboard/portefeuille-clients/page.tsx` | Accès concepteur — vérifier exposition et contrôle d'accès | À vérifier | À vérifier |
| `/hidden-concepteur-gate/login` | `src/app/hidden-concepteur-gate/login/page.tsx` | Accès concepteur — vérifier exposition et contrôle d'accès | À vérifier | À vérifier |
| `/hr` | `src/app/hr/page.tsx` | Gestion opérationnelle | À vérifier | À vérifier |
| `/immo/gestion` | `src/app/immo/gestion/page.tsx` | Habitat & patrimoine | À vérifier | À vérifier |
| `/immo` | `src/app/immo/page.tsx` | Habitat & patrimoine | À vérifier | À vérifier |
| `/insurance/echeances` | `src/app/insurance/echeances/page.tsx` | Assurance | À vérifier | À vérifier |
| `/insurance/gestion` | `src/app/insurance/gestion/page.tsx` | Assurance | À vérifier | À vérifier |
| `/insurance/mes-contrats` | `src/app/insurance/mes-contrats/page.tsx` | Assurance | À vérifier | À vérifier |
| `/insurance` | `src/app/insurance/page.tsx` | Assurance | À vérifier | À vérifier |
| `/insurance/sinistres` | `src/app/insurance/sinistres/page.tsx` | Assurance | À vérifier | À vérifier |
| `/inventory` | `src/app/inventory/page.tsx` | Gestion opérationnelle | À vérifier | À vérifier |
| `/jobs` | `src/app/jobs/page.tsx` | Emploi | À vérifier | À vérifier |
| `/landing-home-page` | `src/app/landing-home-page/page.tsx` | Site public / entrée | À vérifier | À vérifier |
| `/legal` | `src/app/legal/page.tsx` | Juridique & conformité | À vérifier | À vérifier |
| `/maintenance` | `src/app/maintenance/page.tsx` | Système / maintenance | À vérifier | À vérifier |
| `/marketplace/checkout` | `src/app/marketplace/checkout/page.tsx` | Commerce — Marketplace | À vérifier | À vérifier |
| `/marketplace/orders` | `src/app/marketplace/orders/page.tsx` | Commerce — Marketplace | À vérifier | À vérifier |
| `/marketplace` | `src/app/marketplace/page.tsx` | Commerce — Marketplace | À vérifier | À vérifier |
| `/marketplace/product/:id` | `src/app/marketplace/product/[id]/page.tsx` | Commerce — Marketplace | À vérifier | À vérifier |
| `/marketplace/seller/create` | `src/app/marketplace/seller/create/page.tsx` | Commerce — Marketplace | À vérifier | À vérifier |
| `/marketplace/seller/listings/:id/variants` | `src/app/marketplace/seller/listings/[id]/variants/page.tsx` | Commerce — Marketplace | À vérifier | À vérifier |
| `/marketplace/seller/listings/new` | `src/app/marketplace/seller/listings/new/page.tsx` | Commerce — Marketplace | À vérifier | À vérifier |
| `/marketplace/seller` | `src/app/marketplace/seller/page.tsx` | Commerce — Marketplace | À vérifier | À vérifier |
| `/marketplace/seller/settings` | `src/app/marketplace/seller/settings/page.tsx` | Commerce — Marketplace | À vérifier | À vérifier |
| `/marketplace/store/:slug` | `src/app/marketplace/store/[slug]/page.tsx` | Commerce — Marketplace | À vérifier | À vérifier |
| `/media/analytics` | `src/app/media/analytics/page.tsx` | Média & production | À vérifier | À vérifier |
| `/media/assets` | `src/app/media/assets/page.tsx` | Média & production | À vérifier | À vérifier |
| `/media/creators` | `src/app/media/creators/page.tsx` | Média & production | À vérifier | À vérifier |
| `/media/editorial` | `src/app/media/editorial/page.tsx` | Média & production | À vérifier | À vérifier |
| `/media/monetization` | `src/app/media/monetization/page.tsx` | Média & production | À vérifier | À vérifier |
| `/media/news` | `src/app/media/news/page.tsx` | Média & production | À vérifier | À vérifier |
| `/media` | `src/app/media/page.tsx` | Média & production | À vérifier | À vérifier |
| `/media/production` | `src/app/media/production/page.tsx` | Média & production | À vérifier | À vérifier |
| `/media/production/requests` | `src/app/media/production/requests/page.tsx` | Média & production | À vérifier | À vérifier |
| `/media/publish` | `src/app/media/publish/page.tsx` | Média & production | À vérifier | À vérifier |
| `/media/rights-review` | `src/app/media/rights-review/page.tsx` | Média & production | À vérifier | À vérifier |
| `/media/studio` | `src/app/media/studio/page.tsx` | Média & production | À vérifier | À vérifier |
| `/notifications` | `src/app/notifications/page.tsx` | Services transversaux | À vérifier | À vérifier |
| `/onboarding` | `src/app/onboarding/page.tsx` | Parcours d'activation | À vérifier | À vérifier |
| `/organizations` | `src/app/organizations/page.tsx` | Organisations | À vérifier | À vérifier |
| `/parametres/branches` | `src/app/parametres/branches/page.tsx` | Paramètres plateforme | À vérifier | À vérifier |
| `/pay/beneficiaries` | `src/app/pay/beneficiaries/page.tsx` | Paiements JDV Pay | À vérifier | À vérifier |
| `/pay/bills` | `src/app/pay/bills/page.tsx` | Paiements JDV Pay | À vérifier | À vérifier |
| `/pay/history` | `src/app/pay/history/page.tsx` | Paiements JDV Pay | À vérifier | À vérifier |
| `/pay/kyc` | `src/app/pay/kyc/page.tsx` | Paiements JDV Pay | À vérifier | À vérifier |
| `/pay/p/:id` | `src/app/pay/p/[id]/page.tsx` | Paiements JDV Pay | À vérifier | À vérifier |
| `/pay` | `src/app/pay/page.tsx` | Paiements JDV Pay | À vérifier | À vérifier |
| `/pay/qr` | `src/app/pay/qr/page.tsx` | Paiements JDV Pay | À vérifier | À vérifier |
| `/pay/receive` | `src/app/pay/receive/page.tsx` | Paiements JDV Pay | À vérifier | À vérifier |
| `/pay/send` | `src/app/pay/send/page.tsx` | Paiements JDV Pay | À vérifier | À vérifier |
| `/pay/settings` | `src/app/pay/settings/page.tsx` | Paiements JDV Pay | À vérifier | À vérifier |
| `/pay/transfer` | `src/app/pay/transfer/page.tsx` | Paiements JDV Pay | À vérifier | À vérifier |
| `/procurement` | `src/app/procurement/page.tsx` | Gestion opérationnelle | À vérifier | À vérifier |
| `/profile` | `src/app/profile/page.tsx` | Profil utilisateur | À vérifier | À vérifier |
| `/prospecteur` | `src/app/prospecteur/page.tsx` | Prospection — analyse séparée; ne pas modifier le CRM historique | À vérifier | À vérifier |
| `/prospecteur/portefeuille-clients` | `src/app/prospecteur/portefeuille-clients/page.tsx` | Prospection — analyse séparée; ne pas modifier le CRM historique | À vérifier | À vérifier |
| `/pub/:section` | `src/app/pub/[section]/page.tsx` | Publicité | À vérifier | À vérifier |
| `/pub` | `src/app/pub/page.tsx` | Publicité | À vérifier | À vérifier |
| `/pub/studio` | `src/app/pub/studio/page.tsx` | Publicité | À vérifier | À vérifier |
| `/service-marketplace/espace` | `src/app/service-marketplace/espace/page.tsx` | Commerce — services | À vérifier | À vérifier |
| `/service-marketplace` | `src/app/service-marketplace/page.tsx` | Commerce — services | À vérifier | À vérifier |
| `/services` | `src/app/services/page.tsx` | Services transversaux | À vérifier | À vérifier |
| `/settings` | `src/app/settings/page.tsx` | Paramètres plateforme | À vérifier | À vérifier |
| `/settings/security` | `src/app/settings/security/page.tsx` | Paramètres plateforme | À vérifier | À vérifier |
| `/sign-up-login-screen` | `src/app/sign-up-login-screen/page.tsx` | Authentification — vérifier doublon de parcours | À vérifier | À vérifier |
| `/social/events` | `src/app/social/events/page.tsx` | Communauté & réseau | À vérifier | À vérifier |
| `/social/feed` | `src/app/social/feed/page.tsx` | Communauté & réseau | À vérifier | À vérifier |
| `/social/groups/:id` | `src/app/social/groups/[id]/page.tsx` | Communauté & réseau | À vérifier | À vérifier |
| `/social/groups` | `src/app/social/groups/page.tsx` | Communauté & réseau | À vérifier | À vérifier |
| `/social/messages` | `src/app/social/messages/page.tsx` | Communauté & réseau | À vérifier | À vérifier |
| `/social/networks` | `src/app/social/networks/page.tsx` | Communauté & réseau | À vérifier | À vérifier |
| `/social/notifications` | `src/app/social/notifications/page.tsx` | Communauté & réseau | À vérifier | À vérifier |
| `/social` | `src/app/social/page.tsx` | Communauté & réseau | À vérifier | À vérifier |
| `/social/settings` | `src/app/social/settings/page.tsx` | Communauté & réseau | À vérifier | À vérifier |
| `/super-admin/facturation` | `src/app/super-admin/facturation/page.tsx` | Administration plateforme | À vérifier | À vérifier |
| `/super-admin/kyc` | `src/app/super-admin/kyc/page.tsx` | Administration plateforme | À vérifier | À vérifier |
| `/super-admin` | `src/app/super-admin/page.tsx` | Administration plateforme | À vérifier | À vérifier |
| `/tontine/:id` | `src/app/tontine/[id]/page.tsx` | Finance communautaire — Tontine | À vérifier | À vérifier |
| `/tontine/categories/:code/contrat` | `src/app/tontine/categories/[code]/contrat/page.tsx` | Finance communautaire — Tontine | À vérifier | À vérifier |
| `/tontine/categories/:code` | `src/app/tontine/categories/[code]/page.tsx` | Finance communautaire — Tontine | À vérifier | À vérifier |
| `/tontine/categories` | `src/app/tontine/categories/page.tsx` | Finance communautaire — Tontine | À vérifier | À vérifier |
| `/tontine/concepteur` | `src/app/tontine/concepteur/page.tsx` | Finance communautaire — Tontine | À vérifier | À vérifier |
| `/tontine/contrat` | `src/app/tontine/contrat/page.tsx` | Finance communautaire — Tontine | À vérifier | À vérifier |
| `/tontine/documents` | `src/app/tontine/documents/page.tsx` | Finance communautaire — Tontine | À vérifier | À vérifier |
| `/tontine/join/:token` | `src/app/tontine/join/[token]/page.tsx` | Finance communautaire — Tontine | À vérifier | À vérifier |
| `/tontine` | `src/app/tontine/page.tsx` | Finance communautaire — Tontine | À vérifier | À vérifier |
| `/transit/documents` | `src/app/transit/documents/page.tsx` | Logistique — Transit | À vérifier | À vérifier |
| `/transit/operations` | `src/app/transit/operations/page.tsx` | Logistique — Transit | À vérifier | À vérifier |
| `/transit` | `src/app/transit/page.tsx` | Logistique — Transit | À vérifier | À vérifier |
| `/transport` | `src/app/transport/page.tsx` | Mobilité — Transport | À vérifier | À vérifier |
| `/transport/partenaires` | `src/app/transport/partenaires/page.tsx` | Mobilité — Transport | À vérifier | À vérifier |
| `/travel/mon-espace/itineraire/:id` | `src/app/travel/mon-espace/itineraire/[id]/page.tsx` | Mobilité — Voyage | À vérifier | À vérifier |
| `/travel/mon-espace` | `src/app/travel/mon-espace/page.tsx` | Mobilité — Voyage | À vérifier | À vérifier |
| `/travel` | `src/app/travel/page.tsx` | Mobilité — Voyage | À vérifier | À vérifier |
| `/user-dashboard` | `src/app/user-dashboard/page.tsx` | Pilotage utilisateur | À vérifier | À vérifier |

## Gestionnaires API détectés

| Fichier | Domaine pressenti | Authentification, appels et usages |
|---|---|---|
| `src/app/api/academy/tutor/route.ts` | JDV Academy — inventaire seulement | À vérifier |
| `src/app/api/ai/chat/route.ts` | IA transversale | À vérifier |

## Suite d'audit

1. Rechercher chaque route dans les liens `next/link`, appels `router.push` et menus.
2. Vérifier si les routes de même domaine ont des layouts et contrôles d'accès communs.
3. Relever les composants partagés, appels Supabase et entités métier sans modifier les données.
4. Comparer les routes avec les exigences Rocket et marquer chaque entrée : validée, doublon probable, orpheline probable, non accessible, placeholder ou à examiner.
5. Faire relire les résultats avant toute suppression, redirection ou migration.

**Important :** « À vérifier » ne signifie pas qu'une page est cassée. Cela signifie qu'aucune preuve n'a encore été consignée dans ce registre.
