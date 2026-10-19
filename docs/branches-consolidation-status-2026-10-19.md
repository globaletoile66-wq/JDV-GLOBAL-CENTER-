# Consolidation des branches JDV GLOBAL CENTER — 19 octobre 2026

## Principes de sécurité
- Le présent travail reste sur `work/branches-consolidation-2026-10-19`.
- Aucun changement n'est fusionné dans la branche principale et aucun déploiement de production n'est déclenché.
- La migration JDV JOBS est préparée dans le dépôt mais n'est pas appliquée au projet Supabase distant.
- Les modules doivent utiliser l'identité, les rôles et les contrôles d'accès existants; aucune branche ne reçoit de privilèges globaux par défaut.
- Les paiements et le ledger restent la responsabilité de JDV PAY.

## État des modifications de ce lot

| Module | État dans ce lot | Notes |
|---|---|---|
| JDV SOCIAL | Existant à auditer | Les routes et tables sociales existantes sont réutilisées; tests de non-régression requis. |
| JDV IA | À auditer | Vérifier les intégrations et secrets avant activation. |
| JDV COMMUNITY | Première route créée | `/community` lit les groupes publics de `social_groups`; création et adhésion restent dans le workflow partagé `/social/groups`. |
| JDV SERVICES | Première marketplace créée | `/service-marketplace` utilise une migration préparée pour les offres et demandes de devis; migration non appliquée à Supabase distant. La compilation n'a pas encore été exécutée. `/services` reste le catalogue général. |
| JDV EVENTS | Route de module créée | `/events` réutilise le workflow d'événements existant sous `/social/events`; la billetterie complète doit être auditée séparément. |
| JDV JOBS | UI et migration préparées | `/jobs` propose consultation, publication et candidature. La migration `20261019190000_jdv_jobs_marketplace.sql` doit être relue, testée en préproduction puis appliquée avec autorisation explicite. La compilation n'a pas encore été exécutée. |
| JDV LEGAL | À développer | Ne pas exposer de documents privés; vérifier les rôles et le stockage privé avant toute fonctionnalité de dossier. |
| JDV ACCOUNTING | À développer | Ne pas créer de ledger parallèle à JDV PAY. |
| JDV HR | À développer | Séparer strictement les données RH de la place de marché JDV JOBS. |
| JDV PROCUREMENT | À développer | Les approbations et les données fournisseurs doivent être cloisonnées par organisation. |
| JDV INVENTORY | Vue de stock créée | `/inventory` lit les tables de stock existantes en lecture seule et calcule les alertes de seuil. Les mouvements et transferts restent à raccorder après audit des flux existants. |
| JDV MEDIA | Existant à auditer | Réutiliser les tables media existantes et vérifier les flux de publication. |

## Logos fournis le 19 octobre 2026
Le fichier RAR contient 18 logos PNG originaux de 1024 × 1024 px. Ils ont été extraits localement et identifiés visuellement. La liste des identités présentes est :
- JDV Global Divertissement
- JDV Immo
- JDV Business
- JDV Admin
- JDV Tontine
- JDV Global Assurance
- JDV Gestion Clientèle
- JDV Légal
- JDV Pay
- JDV Education
- JDV Voyage
- JDV Marketplace
- JDV Pub
- JDV Santé
- JDV Global IA
- JDV Logistique
- JDV Agriculture
- JDV Tourisme

La correspondance visuelle est connue. Un paquet prêt à copier a été préparé avec les 18 PNG originaux renommés selon les noms canoniques. L'intégration binaire dans `public/assets/branches/` et la vérification de rendu restent à terminer. Ne pas modifier les noms d'identifiants de logo déjà utilisés par l'application sans vérifier toutes leurs références.

## Contrôles à effectuer avant fusion
1. Installer les dépendances et exécuter `npm run type-check` puis `npm run build`.
2. Vérifier le rendu des routes `/community`, `/events` et `/jobs` en desktop et mobile.
3. Appliquer les migrations uniquement dans un environnement de préproduction, puis tester les politiques RLS en utilisateur anonyme, candidat et recruteur.
4. Vérifier les alertes Supabase et corriger chaque finding après inspection de ses dépendances.
5. Vérifier les 18 logos dans le navigateur, les chemins d'assets, les dimensions et les textes alternatifs.
6. Ouvrir une pull request; fusion et déploiement nécessitent une décision explicite.

