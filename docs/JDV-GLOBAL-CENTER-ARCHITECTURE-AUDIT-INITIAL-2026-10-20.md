# JDV Global Center — audit initial de l'architecture du dépôt

**Date :** 20 octobre 2026  
**Base analysée :** `supabase-sync-2026-09-24` — commit `ed3a8fc80ca9a936d736586b2a079d03419868d6`  
**Statut :** inventaire statique initial ; les conclusions ci-dessous sont des constats de structure, pas une validation fonctionnelle ou de sécurité.

## 1. Résumé exécutif

L'arborescence contient déjà un nombre important de routes et plusieurs domaines qui se chevauchent potentiellement. Avant de créer davantage d'écrans ou de déplacer des données, il faut établir une cartographie contrôlée : propriétaire fonctionnel, public cible, parcours, données, permissions, liens entrants/sortants et statut d'implémentation.

### Indicateurs observés dans l'arborescence

- **889 entrées** dans l'arbre GitHub récursif analysé.
- **166 fichiers de pages** détectés dans les sous-répertoires de `src/app` (la page racine `src/app/page.tsx`, si présente, est en supplément).
- **2 gestionnaires de route Next.js** détectés sous `src/app/api`.
- **228 fichiers SQL de migration** dans les dossiers `supabase/migrations` et `database/migrations` réunis.
- **44 entrées** dans le dossier `_a-revoir`, à examiner pour savoir s'il s'agit d'archives, de références ou de code encore utile. Ne pas supprimer sur la seule base du nom.

Ces chiffres décrivent le dépôt, pas le nombre d'applications effectivement actives ni le nombre de tables en production.

## 2. Cartographie initiale par domaine de routes

Comptage des fichiers `page.*` par premier segment de `src/app` :

| Domaine de route | Pages observées |
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
| Autres routes de premier niveau | 1 chacune |

La liste complète et les segments sont visibles dans `src/app`. Les pages dynamiques (par exemple `[id]`) sont comptées comme des routes distinctes dans l'inventaire des fichiers.

## 3. Zones prioritaires à comparer — sans présumer qu'il s'agit de doublons

### A. Commerce, offres et relation professionnelle
À examiner ensemble : `marketplace`, `service-marketplace`, `services`, `business`, `prospecteur` et les pages de clients présentes dans ces espaces.

Questions d'audit :
- Un même vendeur, prestataire ou établissement est-il représenté par plusieurs modèles ?
- Les annonces, offres, demandes, commandes, factures et rendez-vous suivent-ils des parcours distincts ou redondants ?
- Quel module est propriétaire du profil professionnel et des relations avec les clients ?
- Les écrans de `business` sont-ils des outils de gestion interne réutilisables, ou font-ils doublon avec un autre parcours ?

**Décision provisoire :** ne fusionner aucune route avant d'avoir comparé les utilisateurs, les actions, les modèles de données et les autorisations.

### B. Contenus, audience et communauté
À comparer : `social`, `media`, `pub`, `community` et `events`.

Objectif : mutualiser, si le code le permet, les capacités génériques (médias, profils de créateurs, modération, statistiques et notifications) tout en maintenant les workflows éditoriaux, communautaires et publicitaires distincts.

### C. Mobilité et opérations
À comparer : `travel`, `transport` et `transit`.

Objectif : déterminer les composants communs (recherche, localisation, documents, suivi, paiement) sans effacer les règles spécifiques aux réservations de voyage, au transport et aux formalités logistiques/douanières.

### D. Paiements, abonnements et métiers financiers
À comparer : `pay`, `abonnements`, `tontine` et `insurance`.

Le paiement et la facturation peuvent fournir des services transversaux, mais les cycles de tontine, contrats d'assurance, échéances, sinistres et règles de conformité doivent conserver leur propriété métier propre.

### E. Accès, administration et espaces de pilotage
À comparer : `auth`, `settings`, `dashboard`, `user-dashboard`, `super-admin`, `hidden-concepteur-gate` et les pages de configuration.

Objectif : identifier une seule source de vérité pour la session, les rôles, les préférences et la navigation, et distinguer les interfaces d'administration des fonctionnalités métier.

## 4. Garde-fous obligatoires

1. **CRM historique :** aucun changement de code, de schéma, de données ou de flux du CRM existant dans cet audit. Toute nouvelle capacité relation-client devra être conçue séparément.
2. **Données :** aucune migration distante, suppression de table ou modification de données Supabase à partir de cet inventaire.
3. **Routes :** aucune suppression ou redirection avant recherche des liens entrants, appels, tests et équivalents.
4. **Domaines sensibles :** les données santé, juridiques, financières et d'assurance exigent une vérification spécifique des autorisations et de l'isolation.
5. **Archives :** ne pas nettoyer `_a-revoir` avant d'avoir confirmé son rôle et recherché ses références.
6. **Validation :** un inventaire statique ne prouve ni qu'une page fonctionne, ni qu'elle est liée à la navigation, ni que ses données sont sécurisées.
7. **Périmètre :** ne pas refactoriser JDV Academy ou JDV Santé pendant cette phase d'inventaire ; leur statut et leurs dépendances doivent être documentés sans altérer leur implémentation.

## 5. Méthode de scoring professionnelle

Chaque paire de modules sera notée sur 100, à partir de preuves observables :

| Critère | Pondération | Preuve recherchée |
|---|---:|---|
| Mission et résultat utilisateur | 25 % | Besoin réellement résolu |
| Utilisateurs et rôles | 15 % | Profils, droits et responsabilités |
| Objets métier et données | 20 % | Modèles, identifiants, relations |
| Parcours et états | 20 % | Étapes, transitions, exceptions |
| Écrans et actions | 10 % | Actions réellement identiques |
| Dépendances et conformité | 10 % | Services communs, contraintes et risques |

Interprétation :
- **80–100 :** fusionner ou faire d'un module un sous-module, si les exigences métier et de sécurité le permettent.
- **60–79 :** même pôle, modules distincts avec composants/services mutualisés.
- **0–59 :** domaines distincts ; ne partager que les fondations justifiées.

Un score élevé n'autorise jamais à fusionner des données sensibles ou des règles réglementées sans analyse de risques.

## 6. Livrables de la phase suivante

1. Registre des routes avec propriétaire, entrée de navigation, statut, public, dépendances et tests.
2. Matrice de navigation : pages accessibles, liens cassés et pages sans entrée.
3. Carte des composants partagés et de leurs duplications candidates.
4. Inventaire des appels API et services externes.
5. Inventaire des migrations SQL, regroupé par domaine et objet métier, en lecture seule.
6. Matrice de similarité justifiée par des preuves, et décisions : mutualiser / sous-module / garder séparé / à investiguer.
7. Plan de corrections priorisé par risque, sans exécuter de suppression ni de migration distante.

## 7. Critère de sortie de l'audit

Aucun regroupement ne sera qualifié de « validé » tant que sa décision n'est pas étayée par le code, la navigation, les données et les exigences Rocket. La priorité est de rendre la plateforme lisible et cohérente tout en évitant les régressions et la perte de données.
