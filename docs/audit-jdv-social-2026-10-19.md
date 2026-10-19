# JDB Social — audit initial de l'existant
Date : 19 octobre 2026
Dépôt : `globaletoile66-wq/JDV-GLOBAL-CENTER-`
Branche de départ : `supabase-sync-2026-09-24`
Branche de travail : `feat/jdv-social-foundation-2026-10-19`
Projet Supabase inspecté : `lncgghdbnkehdcyhqdfo` (JDV GLOGBAL CENTER FINAL)

## Périmètre et règles
- Auditer le frontend Social, les tables et politiques Supabase associées, les migrations versionnées et les points d'entrée de navigation.
- Préserver les fonctions existantes et travailler sur une branche dédiée.
- Ne pas modifier le CRM historique ni ses tables, fonctions, routes ou migrations.
- Ne pas appliquer de migration à la base distante pendant cet audit.

## Constats vérifiés

### Frontend
- La route `src/app/social/page.tsx` existe.
- Elle permet de charger le profil de l'utilisateur connecté, de créer un profil, de rédiger une publication texte et/ou lien média, d'afficher un fil et de filtrer les publications par texte.
- Le fil affiche un pictogramme de réaction et le statut du post, mais le composant actuel ne réalise pas encore les opérations de réaction ou de commentaire.
- Le profil affiché est essentiellement le profil de l'utilisateur connecté; les profils publics, l'édition du profil, les abonnements et la découverte de personnes ne sont pas intégrés à cet écran.
- Le chargement demande les publications triées par date, avec une limite de 100; les contrôles de visibilité plus fins et une pagination restent à cadrer.

### Base Supabase
Les cinq tables sociales présentes dans `public` :
- `social_profiles`
- `social_posts`
- `social_comments`
- `social_reactions`
- `social_follows`

Leurs contraintes comprennent des clés étrangères vers `auth.users`, les états de profil/publication/abonnement, une unicité du nom d'utilisateur, et l'unicité de la réaction par publication/utilisateur/type. RLS est activé sur les cinq tables.

### Points de vigilance RLS constatés
- `social_profiles` autorise actuellement la lecture par son propriétaire ou un super-administrateur; cela ne fournit pas le modèle de profils publics attendu par un réseau social.
- `social_reactions` limite la lecture aux réactions de l'utilisateur concerné ou du super-administrateur; les compteurs et réactions agrégées ne sont donc pas directement disponibles à tous les membres.
- `social_comments` limite la lecture aux commentaires du membre ou aux commentaires des publications dont il est l'auteur; ce comportement doit être vérifié par rapport aux règles de visibilité avant d'activer les commentaires.
- `social_posts` autorise la lecture aux auteurs, super-administrateurs et publications publiques. Il faut vérifier la séparation entre public, abonnés et privé; le contrôle actuel ne démontre pas à lui seul une protection complète des publications réservées aux abonnés.
- Les règles d'écriture actuelles sont générales par table et devront être testées avec des comptes distincts avant toute évolution.

Aucune politique RLS n'a été modifiée lors de cet audit.

### Historique des migrations
- Supabase contient la migration `20260920015602_jdv_social_foundation`.
- Le fichier de migration versionné dans GitHub est un placeholder indiquant que le SQL historique original n'a pas été récupéré.
- Le dépôt possède un snapshot de schéma et des documents de réconciliation, mais l'historique versionné des migrations n'est pas une représentation complète des évolutions de la base distante.

### Navigation et intégrations
- La page d'accueil référence la route `/social`.
- Le registre des branches inclut `jdv_social`.
- Aucun mécanisme complet de connexion OAuth aux réseaux sociaux externes n'a été confirmé par les fichiers examinés.

## Écarts fonctionnels prioritaires

1. Socle social : édition du profil, lecture des profils publics, contrôles de visibilité explicites, pagination et états d'erreur robustes.
2. Interactions : implémenter réellement réactions et commentaires, puis abonnements, avec RLS compatible et tests multi-utilisateurs.
3. Communautés : modèle de groupes, membres, rôles, événements et modération à concevoir; non confirmé dans les cinq tables sociales actuelles.
4. Créateurs et médias : stockage média contrôlé, métadonnées, chaînes, statistiques et diffusion à concevoir; l'écran actuel ne gère qu'un lien média.
5. Réseaux externes : catalogue de plateformes, liens de profils, consentements et connexions officielles par API selon disponibilité.
6. Monétisation : offres, paiements, commissions, revenus et contrôles anti-fraude à spécifier; aucun parcours Social complet n'a été confirmé.
7. Qualité : exécuter type-check/build, tests de routes, tests RLS positifs/négatifs et tests navigateur dans un environnement disposant des dépendances.

## Plan d'exécution sécurisé
- Étape A : compléter l'inventaire du frontend et des règles d'accès.
- Étape B : préparer des migrations additives et des tests RLS dans la branche dédiée; ne pas les appliquer à la base distante sans revue.
- Étape C : implémenter les interactions sociales par petits incréments.
- Étape D : ajouter les modules communautaires et créateurs.
- Étape E : ajouter le catalogue des réseaux externes, puis les intégrations API éligibles.
- Étape F : traiter monétisation et optimisation après validation du socle.

## Limites de cet audit
- Audit initial statique et introspection en lecture seule de Supabase; aucun test avec des sessions utilisateur réelles n'a été exécuté.
- La correspondance complète avec l'organigramme Rocket et le cahier des charges doit être confirmée à partir des fichiers de référence accessibles.
- Aucun changement de code applicatif ni de schéma distant n'a été appliqué par ce rapport.


## Première tranche de mise en œuvre (PR #128)
- Branche dédiée créée : `feat/jdv-social-foundation-2026-10-19`.
- Ajout d'une migration candidate pour séparer les règles RLS des profils, publications, commentaires, réactions et abonnements, avec visibilité des publications prise en compte.
- Ajout de l'interface des réactions « J'aime » et commentaires dans `src/app/social/page.tsx`.
- Ajout d'un espace `/social/networks` pour enregistrer/supprimer les liens externes des 11 plateformes retenues; aucun mot de passe ni jeton OAuth n'est stocké.
- Ajout d'une migration candidate `20261019160000_jdv_social_external_links.sql` pour les liens externes et leurs règles RLS.
- Ces modifications sont dans le PR brouillon [#128](https://github.com/globaletoile66-wq/JDV-GLOBAL-CENTER-/pull/128), non fusionné.

## Validation de cette tranche
- Les aperçus Netlify du PR ont été déclenchés, mais l'état observé reste « building »; aucun succès de build n'est revendiqué.
- Le contrôle Supabase Preview est « skipped » car la création automatique de branches de prévisualisation par PR est désactivée dans les intégrations du projet.
- Aucune migration n'a été appliquée à la base Supabase distante.
- Étape bloquante avant fusion : obtenir un environnement de prévisualisation Supabase, valider les migrations et exécuter les tests RLS positifs/négatifs, puis confirmer le build Next.js et les parcours navigateur.
