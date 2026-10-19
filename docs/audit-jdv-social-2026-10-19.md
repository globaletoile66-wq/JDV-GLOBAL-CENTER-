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


### Suite du travail — Web + Mobile
- Le mobile charge désormais aussi les profils des auteurs de commentaires afin d'afficher leur identité lorsque les droits RLS le permettent.
- Le mobile permet de quitter un groupe ou d'annuler une demande en attente en conservant l'enregistrement d'adhésion avec le statut `left`.
- Une checklist manuelle Web/Mobile est disponible dans `docs/jdv-social-validation-checklist-2026-10-19.md`.
- Ces changements sont committés sur la branche de travail; compilation, tests d'appareil, application de migration et déploiement restent non confirmés.


## Vérification complémentaire — 19 octobre 2026
- Lecture seule du schéma Supabase distant : les tables `social_profiles`, `social_posts`, `social_reactions` et `social_comments` existent et ont la RLS activée. Les politiques actuellement en place portent encore les noms `social_*_access` ; la migration de lecture publique reste donc candidate et n'a pas été appliquée.
- Les colonnes utilisées par la migration candidate (`profile_status`, `author_user_id`, `visibility`, `status`, `post_id`, `user_id`) ont été retrouvées dans le schéma distant.
- Durcissement du workflow GitHub Actions : permission réduite à `contents: read` et suppression de l'étape qui tentait de pousser automatiquement un `package-lock.json` modifié. Le workflow ne doit pas écrire dans la branche pour exécuter les validations.
- Toujours en attente : résultat effectif du build Web, du contrôle TypeScript Mobile et validation fonctionnelle avec plusieurs comptes. Aucun déploiement, aucune installation et aucune migration distante ne sont déclarés comme effectués.


## Suite sans branche payante — 19 octobre 2026
- La création de branche Supabase payante a été volontairement écartée. Les vérifications complémentaires ont été limitées à des lectures du schéma et des politiques.
- Les politiques distantes actuelles confirment un point fonctionnel à traiter : les profils sont principalement lisibles par leur propriétaire ou le super-administrateur, et les réactions/commentaires sont également restreints. La migration candidate vise à autoriser les lectures nécessaires au fil public, tout en gardant les écritures contrôlées. Elle n'est toujours pas appliquée.
- Le workflow de validation est maintenant déclenchable manuellement depuis GitHub Actions (`workflow_dispatch`), en plus des déclencheurs push/PR. La consultation effectuée n'a pas retourné de statut de contrôle ni de run exploitable ; aucune réussite de build n'est donc revendiquée.
- La suite sans frais : déclencher les validations depuis GitHub Actions, corriger les erreurs de compilation éventuelles, puis continuer les tests fonctionnels. Ne pas appliquer la migration distante ni déployer sans validation distincte.

- Vérification des contraintes d'unicité distantes : les inscriptions aux événements ont bien une clé unique `(event_id, user_id)`, les adhésions aux groupes `(group_id, user_id)`, et les réactions `(post_id, user_id, reaction_type)`. Les opérations d'inscription/adhésion prévues dans Mobile correspondent aux clés vérifiées.

## Vérification complémentaire — navigation et messagerie (19 octobre 2026)

### Constat confirmé sur Supabase (lecture seule)
- Les tables sociales principales sont présentes : profils, publications, réactions, commentaires, groupes, adhésions, événements, inscriptions, abonnements et préférences des applications sociales.
- La table `notifications` existe et sa politique de lecture/écriture limite les lignes à `user_id = auth.uid()`.
- Les politiques des groupes et événements contrôlent les adhésions et les accès aux événements de groupe. Les inscriptions d'événement disposent d'une clé primaire composite `(event_id, user_id)`.
- Les tables `marketplace_messages` et `ai_messages` existent, mais aucune table de conversation/message direct générique n'a été confirmée dans le schéma inspecté.
- La page Web `/social/messages` est donc explicitement un écran d'attente et ne prétend pas envoyer des messages.

### Décision de sécurité
- Ne pas réutiliser `marketplace_messages` pour les messages privés sociaux.
- Ne pas créer de messagerie active sans modèle de conversations, membres, messages et politiques RLS dédiées, puis validation des scénarios d'accès.
- La migration candidate `20261019190000_jdv_social_public_reads.sql` reste non appliquée à la base distante.
- Aucune donnée de production n'a été insérée, modifiée ou supprimée pendant ces contrôles.

### Prochaines validations
1. Exécuter le workflow GitHub Actions sur la branche de travail et examiner les logs Web et Mobile.
2. Corriger chaque erreur TypeScript ou build à partir des logs réels, sans annoncer de réussite avant résultat vérifiable.
3. Valider les politiques de lecture des profils, réactions et commentaires dans un environnement isolé avant toute application distante.
4. Concevoir la messagerie sociale dans une migration séparée et une interface dédiée, avec accès strictement limité aux membres des conversations.
5. Maintenir l'ancienne CRM hors périmètre.

### Vérification complémentaire du workflow CI (après inspection)
- Le dépôt contient bien un `package-lock.json` racine suivi par Git ; le fichier est récupérable depuis la branche malgré la règle d'ignorance présente dans `.gitignore`. Le cache npm du job Web est donc conservé.
- Aucun `mobile/package-lock.json` n'a été confirmé ; le job Mobile utilise `npm install --no-audit --no-fund` sans cache npm configuré.
- Aucun résultat TypeScript ou build n'est déduit de ces ajustements. Les résultats CI restent à vérifier dans GitHub Actions.

### Alignement du workflow Mobile
- Un second workflow `jdv-social-mobile.yml` contenait encore le nom d'une ancienne branche (`feat/jdv-social-cross-platform-2026-10-19`) pour les déclenchements `push`.
- Son déclencheur a été aligné sur la branche active `feat/jdv-social-foundation-2026-10-19`. Il ajoute aux vérifications Mobile le contrôle de compatibilité Expo et l'export Web Expo.
- Les workflows sont configurés, mais leurs étapes ne sont pas déclarées réussies tant qu'un résultat GitHub Actions vérifiable n'est pas disponible.

### Cohérence des dépendances (contrôle statique)
- Le `package-lock.json` racine utilise le format lockfile v3 et les entrées `dependencies` / `devDependencies` correspondent exactement aux versions déclarées dans `package.json` au moment de l'inspection.
- Le dossier Mobile déclare 9 dépendances et ne contient pas de `mobile/package-lock.json`; son installation CI n'est donc pas verrouillée au même niveau que l'application Web.
- Contrôle statique uniquement : aucune installation de paquets, compilation ou export Expo n'a été exécuté dans cette vérification.

### Comparaison de branche
- La branche de travail a été comparée à la branche par défaut `supabase-sync-2026-09-24` : GitHub indique une divergence (65 commits en avance et 1 commit en retard au moment du contrôle).
- Les chemins de fichiers remontés dans cette comparaison concernent JDV Social, Mobile, les workflows, les migrations sociales, la documentation, le lockfile racine et la configuration TypeScript. Aucun chemin de l'ancien CRM n'apparaît dans cette liste.
- Aucune fusion ou rebase automatique n'a été effectué : la divergence doit être revue avant intégration.

### Revue de sécurité RLS — adhésions aux groupes privés
- Le contrôle en lecture seule des politiques réellement actives dans Supabase a confirmé que la règle actuelle `social_group_memberships_update` autorise un utilisateur à passer lui-même son statut à `active`, même pour un groupe privé. Une demande `pending` pourrait donc être approuvée sans intervention d'un administrateur du groupe.
- Une migration corrective distincte a été ajoutée : `20261019200000_jdv_social_private_group_membership_guard.sql`. Elle conserve la migration initiale immuable et limite l'auto-activation aux groupes publics ou aux adhésions privées déjà actives ; l'approbation d'une demande privée doit venir d'un administrateur du groupe.
- **Risque toujours présent en production tant que la migration corrective n'est pas appliquée.** Elle n'a pas été appliquée au Supabase distant, conformément à la consigne de ne pas modifier la production sans validation isolée.
- Test à effectuer dans un environnement isolé : un utilisateur non membre ne peut pas s'auto-ajouter à un groupe privé en statut `active`; une demande `pending` ne peut pas s'auto-activer; un administrateur du groupe peut approuver; les adhésions publiques continuent de fonctionner.

### Résultats réels de CI observés le 19 octobre 2026
- Exécution `JDV Social Web and Mobile validation` au commit `5e3b1230...` : vérification TypeScript Web réussie; build Web échoué au pré-rendu parce que `NEXT_PUBLIC_SUPABASE_URL` et `NEXT_PUBLIC_SUPABASE_ANON_KEY` étaient absents.
- Exécution Mobile au commit `2438f9ed...` : vérification TypeScript Mobile réussie, mais contrôle de compatibilité Expo échoué car `expo-status-bar`, `@types/react` et TypeScript ne correspondaient pas aux versions attendues par Expo SDK 58.
- Après alignement des versions, le contrôle `expo install --check` a réussi. Le TypeScript Mobile a ensuite révélé l'absence des types Node pour `process.env`; `@types/node` a été ajouté. Les résultats du commit qui contient cette correction restent à confirmer.
- Le workflow Web/Mobile a été ajusté pour utiliser des variables Supabase de repli non secrètes pendant le build lorsque les secrets ne sont pas configurés. Le résultat de compilation de cette version reste à confirmer.
- Le workflow existant `Verifier le build` sur la branche par défaut a terminé avec succès au commit `5e640964...`; ce résultat est distinct des contrôles JDV Social et ne prouve pas que tous les tests sociaux sont réussis.

### État de fusion GitHub — suivi
- GitHub indique que la PR `#130` a été fusionnée le 19 octobre 2026 à 13:03:31 UTC. Aucune commande de fusion n'a été lancée dans cette session; la fusion a été constatée après coup lors de la vérification.
- La branche par défaut pointe maintenant sur `5e640964...`. Les deux correctifs postérieurs à la tête fusionnée sont suivis dans la PR brouillon `#131` : alignement des versions Expo/TypeScript et configuration d'environnement de build.
- La PR `#131` reste ouverte en brouillon et ne doit pas être fusionnée avant résultats CI concluants et revue. Aucune action de déploiement n'a été lancée.

### Dépendances — signal de sécurité CI
- L'installation Web au commit `5e3b1230...` a signalé 30 vulnérabilités dans l'arbre de dépendances (dont 1 critique et 22 élevées).
- L'installation Mobile a signalé 22 vulnérabilités (dont 15 élevées).
- Ces chiffres sont ceux affichés par `npm install` dans les journaux CI; ils ne constituent pas encore un audit de l'exploitabilité ni une liste des paquets concernés.
- Aucune commande `npm audit fix` automatique n'a été lancée : les mises à jour correctives doivent être examinées package par package afin d'éviter une mise à niveau majeure non maîtrisée. Une analyse dédiée des advisories est requise avant publication.

### Revue de sécurité RLS — inscriptions aux événements
- La règle actuelle `social_event_registrations_update` vérifiée sur Supabase autorise le propriétaire de l'inscription à mettre à jour toute la ligne, sans revalider la visibilité et l'état de l'événement. En combinaison avec le droit UPDATE de table, cela permettrait de changer `event_id` et de contourner les contrôles appliqués à l'insertion.
- Une migration corrective séparée a été ajoutée : `20261019210000_jdv_social_registration_update_guard.sql`. Elle limite le droit UPDATE des utilisateurs authentifiés à la seule colonne `status` et empêche de réactiver une inscription si l'événement n'est plus publié ou accessible.
- Cette migration, comme la correction d'adhésion aux groupes privés, reste candidate et **n'a pas été appliquée à la production**.
- Tests isolés requis : un utilisateur ne peut pas changer `event_id` ou `user_id`; peut annuler sa propre inscription; ne peut pas réactiver une inscription à un événement annulé/non publié ou inaccessible; peut s'inscrire à un événement public publié ou à un événement de membres s'il est membre actif du groupe.

### Revue de la migration RLS candidate — correctif supplémentaire
- Le contrôle du schéma distant confirme que `social_profiles.profile_status`, les colonnes des publications, réactions et commentaires correspondent aux noms utilisés dans la migration candidate.
- La revue du contrôle d'accès des commentaires a identifié un risque : la politique UPDATE initiale autorisait un commentaire à être déplacé vers une publication que son auteur ne pouvait pas consulter.
- La migration candidate `20261019190000_jdv_social_public_reads.sql` a été corrigée pour exiger, après UPDATE, que le commentaire reste lié à une publication publique publiée, à une publication de l'auteur connecté, ou à une action de super-administrateur.
- Ce correctif reste du SQL candidat dans GitHub : il n'a pas été appliqué à Supabase. Les tests RLS par deux comptes dans un environnement isolé restent requis.

### Risques RLS constatés sur la base distante (lecture seule)
Les politiques actuellement présentes sur Supabase confirment trois points qui doivent être corrigés avant d'activer les fonctionnalités concernées :
1. `social_group_memberships_update` autorise actuellement un membre à remettre son propre statut à `active` sans vérifier que le groupe est public ou que la demande a été approuvée par un administrateur. La migration candidate `20261019200000_jdv_social_private_group_membership_guard.sql` vise à fermer ce contournement.
2. `social_event_registrations_update` limite actuellement l'identité du propriétaire et les valeurs de statut, mais ne restreint pas la colonne `event_id` par privilèges SQL. La migration candidate `20261019210000_jdv_social_registration_update_guard.sql` révoque UPDATE global et n'accorde que UPDATE sur `status`.
3. `social_comments_access` autorise actuellement les commentaires liés aux publications de l'auteur, mais sa règle UPDATE ne vérifie pas la visibilité de la nouvelle publication associée. Le correctif de la migration candidate `20261019190000_jdv_social_public_reads.sql` ajoute cette vérification.
Ces constats proviennent de la lecture de `pg_policies` et des privilèges de schéma; aucun test d'écriture ni changement de données n'a été réalisé. Les trois migrations restent non appliquées à la production et doivent être testées sur une base isolée avec deux comptes distincts avant toute mise en service.

### Renforcement de la checklist de tests
- La checklist Web + Mobile inclut désormais des scénarios négatifs explicites pour l'auto-approbation d'une adhésion privée, la modification de `event_id`/`user_id`, la réactivation d'inscription sans accès valide, le déplacement de commentaires vers des publications privées et les accès anonymes.
- Ces tests sont définis mais non exécutés sur la base distante. Ils doivent être joués sur un environnement isolé avec deux comptes de test avant d'approuver les migrations RLS.

### Protection complémentaire des membres bloqués
- La revue de l'interface groupes a révélé qu'un membre `blocked` pouvait tenter de réactiver sa propre ligne ou de la supprimer puis de se réinscrire, si les politiques le permettaient.
- La migration candidate `20261019200000_jdv_social_private_group_membership_guard.sql` a été renforcée : les mises à jour et suppressions de sa propre ligne sont interdites lorsque le statut courant est `blocked`; un administrateur du groupe conserve la capacité de gérer cette ligne.
- Un scénario négatif correspondant a été ajouté à la checklist. Correctif non appliqué à la base distante; validation isolée toujours nécessaire.

- La migration de lecture sociale limite désormais les privilèges SQL UPDATE de `social_comments` à la colonne `body` pour le rôle `authenticated`. L'association `post_id` et l'auteur `user_id` ne peuvent ainsi pas être modifiés par les clients via une mise à jour ordinaire.
- La checklist demande de vérifier explicitement le refus de changement de `post_id` et `user_id`. Ce correctif est candidat, non appliqué à la production.

### Cohérence UI pour les adhésions bloquées
- Les pages Web de liste et de détail des groupes indiquent désormais clairement le statut `blocked` et n'affichent plus de bouton permettant à l'utilisateur bloqué de tenter une nouvelle adhésion depuis la page de détail.
- Le contrôle côté interface complète la protection RLS candidate; la base reste l'autorité de sécurité et les migrations ne sont toujours pas appliquées à distance.

### Risque critique confirmé sur les publications — migration candidate ajoutée
- La lecture de `pg_policies` a montré que la politique distante `social_posts_access` est de type `ALL` et autorise dans `USING` les lignes dont `visibility = 'public'`. Comme les politiques `DELETE` évaluent `USING` sans `WITH CHECK`, un utilisateur authentifié pourrait potentiellement supprimer une publication publique appartenant à quelqu'un d'autre. La condition de lecture ne filtre pas non plus le statut `published`.
- Une migration candidate séparée, `20261019220000_jdv_social_posts_policy_guard.sql`, remplace cette politique globale par des règles distinctes : lecture de publications publiques uniquement si publiées (ou propres/admin), et INSERT/UPDATE/DELETE limités à l'auteur ou au super-administrateur.
- La checklist demande maintenant de tester la suppression/modification interdite d'une publication d'autrui et la lecture directe d'un brouillon public.
- **Important :** cette faille potentielle est observée dans les politiques actuellement présentes sur Supabase. La migration corrective n'est pas appliquée à la production; elle doit être testée sur un environnement isolé avant activation. Aucune écriture destructive n'a été tentée.
