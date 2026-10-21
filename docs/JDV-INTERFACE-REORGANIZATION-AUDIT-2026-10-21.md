# Audit des routes et composants — réorganisation de l’interface JDV Global Center

Date : 21 octobre 2026  
Branche de travail : `feat/hybrid-interface-reorganization-2026-10-21`  
Base auditée : `supabase-sync-2026-09-24`, commit `a082ca690fbb6c9fde6a4ad3ccb1948ebf599042`.

## Périmètre

Réorganisation de la navigation publique et des points d’entrée communs, de la présentation officielle et du catalogue des branches. Aucun changement métier, aucune migration Supabase et aucune modification du CRM historique.

## Constat avant modification

- L’accueil présentait principalement les applications regroupées par pôles, sans mettre en avant le catalogue des neuf branches.
- L’accueil, la présentation officielle, le catalogue des branches et le Centre d’aide utilisaient des en-têtes différents.
- `src/lib/jdv/branch-catalog.ts` déclare neuf destinations : `/insurance`, `/legal`, `/admin`, `/crm`, `/tontine`, `/entertainment`, `/travel`, `/immo` et `/pay`.
- Contrôle de l’arborescence GitHub au commit de base : les neuf fichiers `src/app/**/page.tsx` correspondant à ces routes sont présents. Une note d’audit antérieure signalait `/admin` et `/entertainment` comme absents ; ce constat est obsolète pour le commit actuel. Leur présence dans l’arborescence ne remplace pas les tests d’accès ni les tests navigateur.
- Les applications et leurs routes métier restent dans `src/lib/jdv/application-registry.ts` ; la navigation commune ne fusionne pas leurs données ni leurs autorisations.

## Modifications préparées

1. Ajout de `src/components/navigation/GlobalHeader.tsx` : navigation responsive partagée, liens publics vers Présentation, Nos neuf branches, Marketplace et Centre d’aide, accès à l’espace de travail et liens Administration/Studio affichés uniquement pour le super-administrateur.
2. `src/app/page.tsx` : conserve la présentation principale, ajoute une section visuelle des neuf branches avant le catalogue détaillé des applications.
3. `src/app/branches/page.tsx` : aligne la navigation et les cartes sur les styles communs avec une densité équilibrée.
4. `src/app/about/page.tsx` : utilise l’en-tête partagé.
5. `src/app/help/page.tsx` : utilise l’en-tête partagé et conserve la section des coordonnées officielles.
6. Les coordonnées officielles ne sont pas ajoutées aux pages publiques hors Centre d’aide. Elles restent centralisées dans `src/lib/jdv/contact.ts`, consommé par la page d’aide.

## Contrôles et limites

- Vérification statique du registre : 29 destinations de modules et 29 fichiers de page correspondants présents dans l’arborescence au commit de base ; les neuf destinations du catalogue de branches sont également présentes.
- Recherche GitHub des valeurs officielles : elles sont centralisées dans `src/lib/jdv/contact.ts` et ne sont pas ajoutées aux nouveaux composants de navigation ni à la page de présentation.
- Les liens privés restent conditionnés au rôle `isSuperAdmin` dans le composant partagé. Les autorisations côté serveur existantes doivent toujours assurer la protection réelle des pages.
- La compilation Next.js, les tests automatisés et l’affichage mobile en navigateur restent à vérifier via les contrôles du PR.
- Aucun déploiement de production, aucune fusion supplémentaire et aucune migration distante Supabase n’ont été effectués dans cette branche.
