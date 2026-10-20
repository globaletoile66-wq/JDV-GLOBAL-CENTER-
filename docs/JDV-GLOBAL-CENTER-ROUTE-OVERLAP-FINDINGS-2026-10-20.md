# Premiers constats — routes et recouvrements JDV

Date : 20 octobre 2026. Branche : audit/jdv-architecture-inventory-2026-10-20.
Analyse statique de fichiers sources ; aucune exécution navigateur et aucun changement applicatif.

## 1. Deux destinations du catalogue ne correspondent pas à une page détectée

Dans `src/lib/jdv/branch-catalog.ts`, neuf liens sont déclarés. Le contrôle de l'arborescence `src/app` ne trouve pas de page pour :
- `/admin` — ne pas rediriger automatiquement vers `/super-admin`, car les droits peuvent différer.
- `/entertainment` — ne pas assimiler arbitrairement cette branche à `/events`.

Les sept autres destinations du catalogue correspondent à une page détectée : `/insurance`, `/legal`, `/crm`, `/tontine`, `/travel`, `/immo` et `/pay`.

Ce contrôle statique ne vérifie ni redirections, ni autorisations, ni routes dynamiques.

## 2. Trois pages de commerce et services ont des fonctions distinctes

| Page | Source de données observée | Fonction apparente |
|---|---|---|
| `/marketplace` | `marketplace_listings` | Catalogue de produits/annonces |
| `/service-marketplace` | `jdv_service_offerings` | Offres de prestataires et demandes de service |
| `/services` | `modules`, `user_favorites` | Catalogue de modules de la plateforme |

Ne pas fusionner ces écrans sur la seule similarité de leurs noms. Les composants de recherche, filtres, cartes ou profils pourraient être mutualisés après vérification.

La page `/service-marketplace` prévoit un message d'erreur pour les codes `42P01` et `PGRST205`, indiquant que le schéma n'est pas appliqué dans l'environnement visé. Cela ne prouve pas que la table manque actuellement dans la base distante ; vérifier les migrations en lecture seule.

## 3. Gestion des clients dans Business

La page `/business/clients` lit `business_clients` et filtre les résultats par `business_id`. C'est un parcours de gestion interne d'entreprise. Il faut le comparer aux fonctions de prospection avant de définir un éventuel service transversal. Le CRM historique reste strictement hors périmètre de modification.

## 4. Social, Media et Pub

Les fichiers examinés indiquent des objets différents : Social utilise profils, publications, réactions, commentaires et abonnements ; Media utilise chaînes et contenus éditoriaux. Hypothèse : garder les métiers distincts et évaluer seulement les composants communs (médias, profils, notifications, statistiques).

## 5. Catalogue de l'accueil et catalogue des branches

La page d'accueil expose au moins 27 destinations de modules. Le catalogue `JDV_BRANCHES` expose neuf branches. Ce peut être deux niveaux différents, mais la distinction n'est pas explicite dans le modèle observé.

Recommandation : définir un référentiel commun avec des types distincts — pôle métier, branche, module, capacité transverse, outil interne — puis dériver de ce référentiel l'accueil, le catalogue et les réglages.

## 6. Priorités

1. Clarifier les destinations `/admin` et `/entertainment`.
2. Construire le graphe de navigation à partir des liens, menus et redirections.
3. Cartographier routes, rôles, sources de données et tests.
4. Comparer les migrations liées aux domaines ciblés en lecture seule.
5. Proposer les corrections de navigation après confirmation des destinations.

Aucun code applicatif, aucune donnée Supabase et aucune migration n'ont été modifiés. Les implémentations JDV Academy et JDV Santé restent inchangées.
