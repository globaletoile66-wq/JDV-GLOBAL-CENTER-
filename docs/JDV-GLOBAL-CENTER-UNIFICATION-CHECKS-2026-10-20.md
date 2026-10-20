# JDV Global Center — contrôles de fusion des applications

Date : 2026-10-20  
Branche : `feat/jdv-unified-application-registry-2026-10-20`

## 1. Registre et associations

- Le registre commun `src/lib/jdv/application-registry.ts` contient 29 modules avec identifiant, route, icône, description et indicateur de protection.
- L'accueil, le hub des branches et la page de préférences utilisent maintenant ce registre.
- Les neuf profils de branche restent dans `src/lib/jdv/branch-catalog.ts`; leurs identifiants constituent les clés de liaison.
- Les associations non définies sont laissées explicitement sans attribution. Elles doivent être validées plutôt que déduites du nom.
- Les routes ne sont pas renommées pendant ce lot.

## 2. Navigation et compilation

- Le contrôle précédent du dépôt a confirmé l'existence des fichiers de page pour les principales destinations du catalogue.
- L'existence d'une route ne prouve pas que son parcours, ses autorisations ou ses opérations métier fonctionnent.
- Les contrôles Netlify de la PR #156 doivent être relus; aucune réussite de build n'est affirmée dans ce document.
- Avant fusion : vérifier les identifiants et routes en double, les références de branche inconnues, puis exécuter `npm run type-check` et `npm run build` dans l'environnement CI.

## 3. Fondations communes constatées

### Identité

`src/contexts/AuthContext.tsx` centralise la session Supabase, le chargement du profil et un contrôle super-admin. Les clients Supabase navigateur et serveur sont séparés dans `src/lib/supabase/client.ts` et `src/lib/supabase/server.ts`.

### Autorisations

La page `/admin` vérifie l'utilisateur côté serveur et interroge `super_admins`. Le contexte client appelle également la fonction RPC `is_super_admin`. Comparer ces mécanismes, vérifier les permissions RLS et tester un compte ordinaire, un administrateur et un utilisateur non connecté. Le code seul ne prouve pas le bon fonctionnement de ces contrôles.

### Notifications

Les préférences de `/parametres/branches` sont conservées dans le `localStorage` du navigateur. Elles ne constituent pas un service partagé entre appareils et ne déclenchent pas à elles seules de notifications serveur.

### Documents

Aucun contrat unique de documents partagé entre les modules n'est validé dans ce lot. Inventorier les buckets, politiques Storage, métadonnées et générateurs avant de créer un service commun.

### Paiements

Le schéma Supabase contient plusieurs domaines de transactions et de montants. Ne pas fusionner les soldes ou tables métier par commodité. Tout contrat transversal devra définir idempotence, états, devise, fournisseur, rapprochement, reçus et journal d'audit.

## 4. Sécurité et périmètre

- Pas de migration distante ni de modification du schéma de production dans ce lot.
- Ne pas modifier le CRM historique, JDV Santé ou JDV Academy.
- Les modules métier gardent leurs tables, règles et workflows tant qu'une analyse de compatibilité et des tests n'ont pas prouvé qu'un partage est sûr.
- Les secrets des fournisseurs ne doivent jamais être exposés au navigateur.

## 5. Critères de sortie

1. Tous les modules ont des identifiants uniques et des routes distinctes, sauf exceptions documentées.
2. Les modules liés pointent vers des identifiants présents; les non-liés sont listés pour arbitrage.
3. L'accueil, le hub de branches et les paramètres utilisent le même registre.
4. Type-check et build réussis dans les contrôles CI.
5. Tests de session et d'autorisations réalisés avant fusion.
6. Aucun changement de schéma de production sans validation distincte.
