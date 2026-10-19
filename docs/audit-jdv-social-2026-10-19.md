# JDV Social — audit initial de l'existant
Date : 19 octobre 2026
Dépôt : `globaletoile66-wq/JDV-GLOBAL-CENTER-`
Branche de départ : `supabase-sync-2026-09-24`
Branche de travail : `feat/jdv-social-foundation-2026-10-19`
Projet Supabase inspecté : `lncgghdbnkehdcyhqdfo` (JDV GLOBAL CENTER FINAL)

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


## Comparaison avec le cahier des charges A–Z
Le fichier `10_Education_Media_Social/02_SOCIAL_COMMUNITY_WEB.md` du ZIP `JDV_GLOBAL_CENTER_Specifications_A_Z_v2.zip` précise que Social doit réutiliser CORE (authentification, RBAC, organisations, notifications, recherche, Storage, audit, messagerie et PAY lorsque nécessaire), sans en créer de copies parallèles.

Routes cibles documentées : `/social/feed`, `/social/groups`, `/social/groups/[id]`, `/social/events`, `/social/messages`, `/social/notifications`, `/social/settings`, ainsi que des routes de modération restreintes.

Tables fonctionnelles cibles documentées : `community_profiles`, `community_groups`, `community_memberships`, `community_posts`, `community_comments`, `community_reactions`, `community_events`, `community_event_registrations`, `community_messages`, `community_reports`, `community_moderation_actions` et `community_verifications`.

Écart d'architecture : la base actuelle contient déjà cinq tables `social_*` qui couvrent une partie du profil/fil/interactions/abonnements. Pour respecter la règle de non-duplication, la prochaine conception doit documenter une correspondance entre ces tables existantes et les besoins `community_*`, puis réutiliser ou faire évoluer les tables existantes si elles couvrent le besoin. Ne pas créer un second système communautaire concurrent sans nécessité démontrée.

Autres écarts à traiter dans les prochaines tranches :
- groupes, membres, événements et inscriptions absents du schéma social actuel;
- messagerie sociale à relier au service CORE existant plutôt que dupliquer une messagerie;
- notifications, recherche, Storage, audit, modération et vérification à raccorder aux services transversaux;
- abonnements et contenus payants à raccorder à JDV PAY et aux droits Premium si activés;
- les liens externes ajoutés à la demande sont distincts des connexions OAuth/API, qui restent à construire et tester plateforme par plateforme.

## Accès aux sources de référence
Le ZIP des spécifications A–Z et l'archive maître du 18 octobre sont présents dans la bibliothèque et ont été inspectés. Le dossier Rocket original et son organigramme séparé n'ont pas été retrouvés dans l'inventaire disponible pendant cette passe; la validation de synchronisation Rocket ↔ GitHub reste donc à confirmer, et n'est pas déclarée terminée.


## Complément d'audit Supabase (lecture seule)
- RLS est activé sur les cinq tables sociales existantes.
- L'audit des index a relevé des index manquants sur les clés étrangères `social_profiles.user_id`, `social_comments.user_id` et `social_reactions.user_id`; la migration candidate ajoute ces index et impose l'unicité du profil par utilisateur. La requête de contrôle n'a détecté aucun utilisateur possédant plusieurs profils au moment de l'audit.
- Des index de parcours fil/commentaires/abonnements existaient déjà. La migration candidate a été ajustée pour éviter de recréer certains index équivalents et pour utiliser `(select auth.uid())` dans les prédicats RLS afin de limiter leur réévaluation par ligne.
- Les advisors globaux Supabase ont aussi signalé 12 fonctions SECURITY DEFINER accessibles au rôle anon, 120 accessibles au rôle authenticated, la protection des mots de passe compromis désactivée, 529 clés étrangères sans index couvrant au niveau global et 288 policies présentant un coût de réévaluation RLS. Ces alertes ne sont pas toutes propres à Social; elles doivent faire l'objet d'un chantier de sécurité transversal distinct. Aucun changement global n'a été appliqué dans le cadre de ce PR.
- Ces contrôles sont issus de l'état réel de la base distante en lecture seule; les nouvelles policies/index ne seront effectifs qu'après test et application approuvée de la migration.


## Tranche communautaire ajoutée
- `/social/groups` : création de groupes publics/privés, adhésion immédiate aux groupes publics et demande d'accès aux groupes privés.
- `/social/events` : publication d'événements publics, inscription et annulation d'inscription.
- `/social/settings` : modification du nom d'utilisateur, du nom affiché, de la biographie et de l'URL d'avatar.
- `/social/notifications` : réutilisation de la table centrale `notifications`, avec marquage individuel ou global comme lu.
- Le fil `/social` relie maintenant les espaces Profil, Notifications, Groupes, Événements et Réseaux connectés.
- Migration candidate `20261019170000_jdv_social_groups_events.sql` : tables groupes, adhésions, événements et inscriptions, fonctions auxiliaires à droits limités, règles RLS et index.
- Le suivi des abonnements a été corrigé pour se charger indépendamment du nombre de publications dans le fil.

## Matrice de tests avant mise en production
1. Build/type-check Next.js sur la tête de branche et contrôle des erreurs de lint.
2. Profils : création, mise à jour, nom d'utilisateur dupliqué, URL avatar invalide.
3. Fil : réaction, retrait de réaction, commentaire, suivi/désuivi; vérifier les erreurs réseau et l'absence de double envoi.
4. Confidentialité : un membre non abonné ne doit pas lire une publication `followers`; une publication `private` doit rester visible uniquement par son auteur et les administrateurs autorisés.
5. Groupes : création, adhésion publique, demande privée, annulation de demande, sortie du groupe; un membre ne doit pas obtenir les droits d'administration.
6. Événements : création, dates incohérentes rejetées, inscription et annulation; un utilisateur ne doit pas lire/modifier les inscriptions d'un autre utilisateur.
7. Notifications : seules les notifications du compte connecté sont lues ou mises à jour.
8. Réseaux externes : seules les URL HTTP(S), visibilité privée respectée, aucune donnée OAuth/secrète enregistrée.
9. Naviguer entre les routes depuis le fil, vérifier mobile/desktop, erreurs et état vide.
10. Appliquer les migrations uniquement dans une base Supabase isolée; comparer advisors et politiques avant toute promotion vers la base de production.

## Messagerie CORE — dépendance non résolue
L'introspection de la base a trouvé des tables de messagerie liées à la marketplace (`marketplace_conversations`, `marketplace_messages`) et des tables de conversation IA, mais aucune table de messagerie directe générique utilisable sans détourner un module. Pour respecter la spécification, la messagerie JDV Social ne doit pas réutiliser les conversations de marketplace comme si elles étaient des conversations sociales, ni créer un second système concurrent avant d'avoir identifié le service CORE prévu. La route `/social/messages` reste donc à raccorder au service de messagerie central lorsqu'il sera identifié.

## État exact de validation
- Les modifications applicatives et migrations candidates sont enregistrées dans la branche du PR #128.
- Aucune migration n'a été exécutée sur Supabase distant.
- Aucun build final réussi ni test navigateur n'est encore attesté.
- Le déploiement de production actuel du site Netlify correspond toujours à la branche `supabase-sync-2026-09-24`; il ne contient pas automatiquement les commits de cette branche de fonctionnalité.
- Le CRM historique n'a pas été modifié.


## Routes ajoutées après la première revue
- `/social/groups/[id]` : détail d'une communauté, statut d'adhésion et actions rejoindre/quitter.
- `/social/messages` : point d'entrée de la messagerie sociale, avec indication explicite de la dépendance CORE non résolue. Cette route ne prétend pas envoyer de messages.
- Le fil principal relie maintenant les paramètres du profil, notifications, messagerie, groupes, événements et réseaux externes.
- La lecture des relations de suivi est indépendante du chargement du fil; les relations existantes non actives sont gérées sans tentative d'insertion en doublon.

## Tranche de développement Web + Mobile — 19 octobre 2026

### Web
- Le fil applique désormais un filtre explicite sur les publications publiées et sur les publications publiques ou appartenant au membre connecté.
- La création de groupes inclut un nettoyage compensatoire si l'enregistrement du rôle propriétaire échoue.
- Le formulaire de création d'événement vérifie le titre avant l'envoi, en cohérence avec la contrainte de longueur du schéma.

### Mobile
- L'application Expo utilise le même projet Supabase et les mêmes tables sociales que le Web.
- Le parcours couvre maintenant l'authentification, la création et la modification du profil, le fil communautaire, les publications texte, les réactions, les commentaires, les groupes, les adhésions, les événements, les inscriptions, les notifications et les préférences du catalogue d'applications.
- Le catalogue mobile synchronise les préférences d'affichage et d'alertes dans `social_app_preferences`.
- La documentation mobile a été actualisée pour refléter ces fonctionnalités.

### Accès et validation
- Une migration candidate `20261019190000_jdv_social_public_reads.sql` sépare les règles de lecture et d'écriture des profils, réactions et commentaires, pour permettre la lecture des profils actifs et des interactions sur les publications visibles.
- Cette migration est versionnée dans la branche de développement, mais **n'a pas été appliquée à Supabase distant**. Elle doit être revue et testée sur un environnement isolé avant application.
- Un workflow GitHub Actions `.github/workflows/jdv-social-validation.yml` a été ajouté pour lancer les contrôles TypeScript Web et Mobile.
- À la clôture de cette tranche, aucun résultat de compilation complet ni test navigateur/appareil n'est déclaré. Les dépendances Mobile n'ont pas été installées localement et l'installation/déploiement restent différés.
- Aucun changement n'a été apporté au CRM historique.
