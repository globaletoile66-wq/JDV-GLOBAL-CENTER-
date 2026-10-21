# Audit des routes et composants — réorganisation de l’interface JDV Global Center

Date : 21 octobre 2026  
Branche de travail : `feat/hybrid-interface-reorganization-2026-10-21`  
Base : `supabase-sync-2026-09-24` (commit `a082ca690fbb6c9fde6a4ad3ccb1948ebf599042`)

## Périmètre

Réorganisation de la navigation publique et des points d’entrée communs, de la présentation officielle et du catalogue des branches. Aucun changement métier, aucune migration Supabase et aucune modification du CRM historique.

## Constat avant modification

- L’accueil présentait principalement les applications regroupées par pôles, sans mettre en avant le catalogue des neuf branches.
- L’accueil, la présentation officielle, le catalogue des branches et le Centre d’aide utilisaient des en-têtes différents.
- Le catalogue `src/lib/jdv/branch-catalog.ts` contient neuf branches.
- L’audit statique existant signale deux destinations sans page détectée : `/admin` et `/entertainment`. Les sept autres destinations sont présentes dans l’inventaire précédent. Ces deux destinations ne sont ni redirigées ni présentées comme fonctionnelles : l’interface les signale comme nécessitant une validation.
- Les applications et leurs routes métier restent dans `src/lib/jdv/application-registry.ts` ; la navigation commune ne fusionne pas leurs données ni leurs autorisations.

## Modifications préparées

1. Ajout de `src/components/navigation/GlobalHeader.tsx` : navigation responsive partagée, liens publics vers Présentation, Nos neuf branches, Marketplace et Centre d’aide, accès à l’espace de travail et liens Administration/Studio affichés uniquement pour le super-administrateur.
2. `src/app/page.tsx` : conserve la présentation principale, ajoute une section visuelle des neuf branches avant le catalogue détaillé des applications et marque les deux routes non confirmées.
3. `src/app/branches/page.tsx` : aligne la navigation et les cartes sur les styles communs, sans ouvrir les destinations non vérifiées.
4. `src/app/about/page.tsx` : utilise l’en-tête partagé.
5. `src/app/help/page.tsx` : utilise l’en-tête partagé et conserve la section des coordonnées officielles.
6. Aucun téléphone, e-mail ou adresse officielle n’est ajouté aux pages publiques hors Centre d’aide. Les coordonnées demeurent centralisées dans `src/lib/jdv/contact.ts`, consommé par la page d’aide.

## Contrôles et limites

- Vérification statique du registre : neuf entrées de branches déclarées.
- Vérification par recherche GitHub des coordonnées : les valeurs officielles sont centralisées dans `src/lib/jdv/contact.ts` ; elles ne sont pas ajoutées aux nouveaux composants de navigation ni à la page de présentation.
- Les liens privés restent conditionnés au rôle `isSuperAdmin` dans le composant partagé. Les autorisations côté serveur existantes doivent toujours assurer la protection réelle des pages.
- La compilation Next.js, les tests automatisés, l’affichage mobile en navigateur et le déploiement preview restent à vérifier via les contrôles du PR.
- Aucun déploiement de production, aucune fusion supplémentaire et aucune migration distante Supabase n’ont été effectués dans cette branche.
