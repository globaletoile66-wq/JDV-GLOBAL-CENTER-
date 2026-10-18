# JDV GLOBAL CENTER — Proposition de niveaux d’abonnement

## Statut
Structure fonctionnelle validée par le propriétaire du projet le 18 octobre 2026. Ce document définit les niveaux et leurs règles attendues. **Aucun prix n’est fixé ici** et aucune règle de facturation ou de blocage en production ne doit être activée sur la seule base de ce document.

## Principes obligatoires
- Chaque branche commercialisée peut avoir son abonnement indépendant et son tarif propre.
- Un abonnement à une branche donne accès à cette branche uniquement, selon les fonctionnalités incluses dans le plan.
- Les offres supérieures ajoutent progressivement des fonctionnalités et/ou des branches.
- **Premium Global** donne accès à toutes les branches JDV GLOBAL CENTER incluses dans l’offre, sans devoir acheter chaque abonnement de branche séparément.
- Le rôle technique de super-administrateur/concepteur donne accès à l’administration de la plateforme et ne doit pas dépendre d’un abonnement client.
- L’accès doit être contrôlé côté serveur et base de données/RLS lorsque pertinent; masquer simplement un lien dans l’interface ne constitue pas une protection.
- Ne pas modifier ni réintégrer un ancien CRM séparé. Les règles concernent les modules natifs de JDV GLOBAL CENTER.
- Ne pas activer les plans brouillons existants ni modifier les tarifs existants sans validation spécifique.

## Les cinq niveaux

| Niveau | Positionnement | Accès fonctionnel attendu |
|---|---|---|
| 1. Découverte | Entrée gratuite ou accès de base, à confirmer commercialement | Création et gestion du compte, accueil central, profil et paramètres de base, présentation du catalogue des branches et des offres, accès aux fonctionnalités explicitement désignées comme gratuites. Pas d’accès implicite aux fonctions premium. |
| 2. Branche individuelle | Une branche au choix | Toutes les fonctionnalités incluses dans le plan acheté pour une seule branche (par exemple CRM, BUSINESS, IMMO, ACADEMY ou une autre branche commercialisée). Chaque branche conserve son propre catalogue de plans, prix, durée et renouvellement. |
| 3. Professionnel | Activité multi-branche | Accès aux branches et fonctionnalités prévues dans un forfait professionnel défini; gestion de l’activité et outils de suivi plus avancés. Le périmètre exact des branches doit être une liste explicite, pas une supposition fondée sur le nom du plan. |
| 4. Entreprise | Organisation et équipes | Accès à un ensemble plus large de branches, plus les fonctionnalités d’équipe/organisation qui seront réellement disponibles : rôles et permissions, gestion de plusieurs utilisateurs, suivi consolidé et rapports, selon les capacités validées. |
| 5. Premium Global | Accès global | Accès à toutes les branches de la plateforme couvertes par l’offre et à leurs fonctionnalités Premium, y compris les branches activées ultérieurement selon la politique commerciale retenue. Les exclusions éventuelles doivent être affichées explicitement avant l’achat. |

## Modèle d’autorisation à implémenter

1. **Rôle administratif** : vérifier le rôle super-administrateur/concepteur indépendamment des abonnements clients.
2. **Abonnement individuel de branche** : associer un abonnement actif à un code de module, une période de validité et un état de paiement.
3. **Forfaits multi-branches** : représenter les branches incluses par une liste explicite de codes de modules ou d’entitlements.
4. **Premium Global** : entitlement global défini explicitement; ne pas le déduire d’un simple nom de plan.
5. **Accès effectif** : autoriser si l’utilisateur est un super-administrateur habilité, ou si un entitlement actif couvre le module demandé, ou si le module est explicitement gratuit.
6. **Expiration, suspension et remboursement** : appliquer une règle documentée et cohérente dans les contrôles serveur et les politiques de base de données.
7. **Interface** : afficher l’état de l’accès, le nom du plan, la date de fin et l’action appropriée (ouvrir, choisir une offre, renouveler), sans présenter un accès refusé comme une panne.
8. **Traçabilité** : enregistrer les changements d’abonnement et les actions administratives sensibles.

## Éléments à confirmer avant la mise en production

- Prix, devise, durée, essai éventuel, renouvellement et politique de remboursement pour chaque plan.
- Liste exacte des branches et fonctionnalités incluses dans Professionnel et Entreprise.
- Traitement des modules en développement et des nouvelles branches ajoutées après souscription.
- Règles de prorata, changement de plan, cumul de plusieurs abonnements de branche, expiration et suspension.
- Moyens de paiement et confirmation fiable du paiement avant activation d’un entitlement.
- Écrans de comparaison des offres, paiement, gestion/renouvellement et historique.

## État technique observé avant implémentation
L’audit précédent a relevé que les lignes de `public.modules` avaient `requires_subscription=false` et que les plans actifs visibles concernaient notamment JDV CRM; certains plans JDV PUB étaient en brouillon/inactifs. Cet état doit être revérifié avant toute migration. Ne pas basculer globalement `requires_subscription` et ne pas activer de plans brouillons sans une matrice d’accès complète et des tests.

## Séquence de livraison
1. Finaliser et tester le parcours de connexion vers le portail concepteur.
2. Valider la liste des routes et des modules réellement accessibles.
3. Confirmer la matrice commerciale et les prix.
4. Concevoir la migration de données et les fonctions d’autorisation, avec tests de non-régression et politiques RLS.
5. Tester les scénarios sans abonnement, branche individuelle, forfait multi-branche, Premium Global, abonnement expiré, utilisateur non authentifié et super-administrateur.
6. Déployer uniquement après vérification des builds et des parcours réels.
