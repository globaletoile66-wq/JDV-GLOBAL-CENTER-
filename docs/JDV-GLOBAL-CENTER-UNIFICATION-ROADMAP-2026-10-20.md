# Plan directeur d'unification — JDV Global Center

Date de départ : 20 octobre 2026  
Branche de travail : `feat/jdv-global-unification-roadmap-2026-10-20`  
Base : `supabase-sync-2026-09-24`

## Objectif

Unifier l'expérience de JDV Global Center autour d'un référentiel métier cohérent, de composants partagés et d'une navigation vérifiable, sans effacer les différences métier ni casser les données existantes. Ce document est un plan d'exécution vérifiable, pas une déclaration que tous les travaux sont déjà terminés.

## Garde-fous

- Ne pas modifier l'ancien CRM historique dans ce chantier.
- Ne pas fusionner les domaines uniquement parce que leurs noms se ressemblent.
- Ne pas lancer de migration distante, supprimer des tables, changer les droits RLS, ni fusionner une PR sans contrôle et autorisation adaptés.
- JDV Academy et JDV Santé sont inventoriées, mais leur implémentation ne doit pas être changée par inadvertance.
- Les logos doivent utiliser des fichiers réels validés, avec fallback visuel; ne pas inventer des fichiers d'images.
- Chaque route doit avoir un objectif, un accès, une entrée de navigation ou une justification d'accès direct, et un état de test.

## Première constatation concrète

La page d'accueil (`src/app/page.tsx`) affiche 27 modules, tandis que `src/lib/jdv/branch-catalog.ts` définit neuf branches. Les deux listes ne décrivent pas le même niveau de navigation et doivent devenir explicitement distinctes : pôles, branches, modules, fonctions transversales et outils internes.

Le catalogue actuel contient deux destinations sans page détectée lors de l'inventaire : `/admin` et `/entertainment`. Elles ne doivent pas être redirigées arbitrairement : l'espace d'administration et les expériences de divertissement nécessitent des décisions métier distinctes.

Le lien « JDV SERVICES » sur la page d'accueil vise `/service-marketplace`, alors que la route `/services` représente un catalogue de modules. Ces noms et fonctions doivent être clarifiés dans l'interface pour éviter les confusions.

## Modèle d'unification proposé

### A. Fondations communes — à mutualiser sans fusionner les métiers

- Identité et profil : compte, profil, organisation, membres, invitations.
- Accès : rôles, permissions, accès par module, contrôles côté serveur.
- Navigation : catalogue typé, menus, favoris, récents, liens entrants et sortants.
- Notifications : préférences, centre de notifications, événements métier.
- Documents et médias : stockage, métadonnées, prévisualisation et droits.
- Audit et observabilité : actions sensibles, erreurs, état des traitements.
- Interface : composants de formulaires, listes, filtres, cartes, pagination, états vides et erreurs.
- Paiement : services financiers transversaux via API contrôlées, sans accès direct non autorisé depuis les modules.

### B. Pôles et branches métier — garder les modèles spécifiques

| Pôle proposé | Branches et domaines concernés | Principe |
|---|---|---|
| Commerce & entreprise | Business, Marketplace, achats, stocks, comptabilité, RH | Réutiliser les composants opérationnels; conserver les flux et permissions propres à chaque domaine. |
| Finance & solidarité | JDV Pay, Tontine, Assurance | Mutualiser l'affichage des transactions, reçus et notifications; garder les règles financières et les tables métier séparées. |
| Mobilité & logistique | Travel, Transport, Transit | Partager carte, recherche, réservation et suivi si compatibles; garder les entités et cycles opérationnels distincts. |
| Patrimoine & droit | Immo, Legal | Partager documents, rendez-vous et échéances; conserver les règles propres aux biens et dossiers juridiques. |
| Santé | JDV Santé / Health | Périmètre protégé; données et accès sensibles, pas de fusion avec CRM ni avec les modules publics. |
| Formation | JDV Academy | Parcours de cours, inscriptions, évaluations et certificats; inventaire seulement dans ce lot. |
| Médias & communauté | Social, Media, Pub, Community, Events, Entertainment à clarifier | Partager profils publics, médias et notifications; séparer publication sociale, gestion éditoriale, campagnes et billetterie/événements. |
| Plateforme & assistance | AI, aide, paramètres, abonnements, administration | Fondations transversales avec autorisations strictes; clarifier les espaces admin manquants. |

Cette classification est une hypothèse d'architecture à confirmer avec le cahier des charges Rocket et l'organigramme officiel avant toute fusion de données.

## Règles de décision : mutualiser ou garder séparé

Mutualiser si le comportement, le cycle de vie, les rôles et les invariants métier sont les mêmes. Garder séparé si les droits, les données sensibles, les états de workflow, la comptabilité ou les responsabilités métier diffèrent. Partager d'abord des composants d'interface ou des services transversaux; ne fusionner les tables qu'après cartographie des clés, contraintes, RLS, historique et stratégie de migration.

## Lots de réalisation

### Lot 1 — Inventaire et navigation
- Vérifier toutes les routes actives et dynamiques.
- Extraire les liens depuis accueil, menus, cartes, boutons, redirections et contrôles d'accès.
- Identifier les routes sans entrée, les liens cassés, les doublons d'écran et les pages qui ne sont plus référencées.
- Corriger la classification de la route racine dans les rapports d'inventaire.
- Relever les destinations `/admin` et `/entertainment` et documenter la décision attendue.

**Critère de sortie :** registre des routes avec source, liens entrants, domaine, auth requise, source de données et test associé.

### Lot 2 — Catalogue métier canonique
- Remplacer les listes indépendantes par un modèle typé et versionné : pôle, branche, module, fonction transverse, outil interne.
- Générer depuis ce modèle le catalogue d'accueil, l'explorateur des branches et le paramétrage.
- Valider chaque URL et chaque logo avant publication.
- Ne pas exposer un lien si sa destination et son autorisation ne sont pas confirmées.

**Critère de sortie :** une source de vérité et aucun lien de catalogue vers une route inconnue non justifiée.

### Lot 3 — Fondations et composants partagés
- Comparer les composants communs existants avant d'en créer de nouveaux.
- Centraliser états de chargement, erreurs, états vides, validation des formulaires et affichage des notifications.
- Réutiliser les composants seulement lorsque le contrat de données est compatible.
- Garder les interfaces de domaine et les règles de sécurité dans leurs modules.

**Critère de sortie :** composants testés et adoption incrémentale sans changement de comportement métier involontaire.

### Lot 4 — Contrat Supabase et sécurité
- Établir pour chaque page la liste des tables, vues, RPC, buckets et fonctions utilisés.
- Comparer les migrations présentes dans le dépôt aux migrations enregistrées dans l'environnement distant.
- Contrôler RLS, privilèges, clés étrangères, contraintes, fonctions sensibles et séparation des organisations.
- Ne proposer aucune migration destructive; fournir un plan de retour arrière pour chaque changement de schéma.
- Ne pas toucher au schéma du CRM historique dans ce chantier.

**Critère de sortie :** matrice page → données → politiques → migration → test, avec écarts classés par gravité.

### Lot 5 — Corrections par domaine
Ordre de traitement proposé :
1. Navigation et liens cassés.
2. Identité, permissions et accès.
3. Commerce & entreprise.
4. Finance & solidarité.
5. Mobilité & logistique.
6. Patrimoine & droit.
7. Médias & communauté.
8. Plateforme & assistance.
9. Revalidation globale et documentation.

Les lots Santé et Academy restent protégés de modifications de code dans ce chantier tant qu'un périmètre spécifique n'a pas été convenu.

### Lot 6 — Validation et livraison
- Exécuter le contrôle TypeScript, lint, tests ciblés et build.
- Tester routes publiques, routes authentifiées, rôles différents, états vides, erreurs réseau et accès refusés.
- Vérifier les Deploy Previews de chaque PR et leurs logs avant d'annoncer un succès.
- Traiter chaque correction dans une PR courte et réversible; ne pas fusionner automatiquement.
- Produire un bilan des écarts restants et des preuves de validation.

## État initial connu

- Le registre précédent recense 167 fichiers de pages et deux gestionnaires API détectés sous `src/app/api` à la date de son inventaire. Ces chiffres doivent être recalculés sur la tête actuelle après tout changement.
- La base Supabase a des tables de fondation `modules`, `profiles`, `organizations`, `organization_members`, `user_module_access`, `user_favorites`, `notifications` et des domaines métier spécialisés. L'existence d'une table ne prouve pas que tous les écrans qui l'utilisent fonctionnent.
- La vérification des migrations distantes est une lecture d'état, pas une validation complète de la logique ou des politiques.
- Le statut de build et de déploiement doit être lu dans les checks/Deploy Previews; aucune réussite ne doit être présumée.

## Tableau de suivi

| Domaine de contrôle | État initial | Preuve requise |
|---|---|---|
| Cartographie des routes | Inventaire statique existant | Graphe des liens et tests de navigation |
| Référentiel de branches | Accueil 27 modules / catalogue 9 branches | Catalogue typé et cohérent |
| Destinations admin/divertissement | À clarifier | Décision métier + route et contrôle d'accès |
| Composants partagés | À analyser | Matrice de réutilisation et tests |
| Supabase | Tables et migrations recensées en lecture seule | Matrice page/table/RLS/RPC + comparaison des migrations |
| Tests applicatifs | À exécuter par lot | Résultats CI et Deploy Preview |
| Déploiement global | Non présumé | Statut Netlify explicite et commit exact |

## Définition de « terminé »

Le projet ne peut être déclaré terminé que lorsque chaque route est classée, chaque lien important est testé, les permissions sont vérifiées, les données utilisées ont un contrat clair, les fonctionnalités essentielles ont des tests, les builds et previews sont verts, et les risques résiduels sont documentés. Un document d'architecture ou une PR ouverte ne constitue pas à lui seul une livraison complète.
