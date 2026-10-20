# JDV Global Center — audit de synchronisation GitHub / Supabase

Date : 20 octobre 2026  
Projet Supabase : \`JDV GLOGBAL CENTER FINAL\` (\`lncgghdbnkehdcyhqdfo\`)  
Dépôt : \`globaletoile66-wq/JDV-GLOBAL-CENTER-\`  
Branche de référence : \`supabase-sync-2026-09-24\`

## Résumé exécutif

La base Supabase est active et contient un schéma large, mais la synchronisation historique GitHub/Supabase n'est pas complète. La vérification ci-dessous distingue ce qui est confirmé de ce qui reste à réconcilier. Aucun lot de migrations historiques n'a été rejoué en masse.

## État mesuré de la base

Requêtes en lecture seule exécutées le 20 octobre 2026 :

- 366 tables dans \`public\`
- 3 vues dans \`public\`
- 4 059 colonnes sur les tables publiques
- 974 clés étrangères
- RLS activé sur les 364 tables publiques (aucune table publique sans RLS)
- 905 politiques RLS
- 246 fonctions dans le schéma \`public\`
- 239 migrations enregistrées après activation du workflow JDV Services

La base est donc loin d'être vide et les relations de clés étrangères sont nombreuses. Cela ne garantit toutefois pas que chaque écran applicatif utilise les bons noms de tables, les bonnes colonnes ou les bonnes autorisations.

## Changement appliqué et vérifié

Migration \`jdv_immo_construction_editor_v1\`, version Supabase \`20261020084707\` :

- crée \`public.immo_construction_briefs\` si elle n'existe pas ;
- référence \`auth.users\` pour le propriétaire et le professionnel assigné ;
- active RLS ;
- autorise uniquement les opérations nécessaires au rôle \`authenticated\` ;
- permet la lecture par le propriétaire ou le professionnel assigné ;
- limite la création et la modification directe du client à ses propres brouillons ;
- n'altère aucune table du CRM historique.

La migration est versionnée dans \`supabase/migrations/20261020084707_jdv_immo_construction_editor.sql\`. Après application, une vérification a confirmé la présence de la table, RLS actif, trois politiques, deux clés étrangères et aucune permission de lecture pour \`anon\`.



Migration globale `20261020090809_jdv_global_user_and_organization_foreign_keys.sql` appliquée après vérification qu'aucune ligne existante n'était orpheline. Elle relie `article_categories.organization_id` à `organizations.id`, `login_security_events.user_id` à `auth.users.id`, `notification_preferences.user_id` et `user_settings.user_id` à `auth.users.id`, et `super_admin_modules.user_id` à `super_admins.user_id`. Cinq index de support ont également été créés.

Exception conservée volontairement : `super_admin_modules.module_code = 'crm'` ne correspond à aucun code de `public.modules`. Il est laissé inchangé pour ne pas modifier le code CRM historique. Aucune clé étrangère n'a été ajoutée sur `module_code` tant que cette référence n'a pas été clarifiée.

## Écarts de schéma confirmés

### JDV Immo

\`public.immo_construction_briefs\` est maintenant présent.

Les tables suivantes, attendues par le brouillon de migration des workflows Immo, restent absentes :

- \`immo_agent_applications\`
- \`immo_mandates\`
- \`immo_commission_rules\`
- \`immo_tenant_followups\`
- \`immo_disputes\`

Le fichier \`20261020070000_jdv_immo_persistent_workflows.sql\` contient aussi des fonctions, des politiques et des changements Storage au-delà de la seule création des tables. Il n'a donc pas été appliqué intégralement sans test de prévisualisation et revue de sécurité. Les besoins des écrans d'administration Immo doivent être rapprochés de ces tables avant de déclarer tous les workflows actifs.

### JDV Services

Les tables jdv_service_offerings et jdv_service_requests sont présentes dans le schéma public, avec RLS activé, 7 politiques combinées et des clés étrangères vers les utilisateurs, les prestataires et les demandes. Les tests PostgreSQL/RLS en base jetable ont réussi.

Les migrations sont alignées sur l'historique Supabase : 20261020091544_jdv_services_marketplace_v1.sql et 20261020092130_jdv_services_workflow_hardening_v1.sql. La seconde migration a été appliquée et vérifiée sur la base active : elle encadre les transitions client/prestataire au moyen d'un trigger SECURITY INVOKER et d'une politique d'UPDATE. Le dernier lancement CI après réconciliation des noms de migration est en cours.

### JDV Social

Les tables réelles observées utilisent les noms \`social_*\` : notamment \`social_profiles\`, \`social_posts\`, \`social_groups\`, \`social_group_memberships\`, \`social_events\`, \`social_event_registrations\`, \`social_app_preferences\`, \`social_conversations\` et \`social_messages\`.

Des noms d'essai tels que \`jdv_social_groups\`, \`social_group_members\` et \`social_user_preferences\` ne correspondent pas aux noms présents. Avant de créer de nouvelles tables, il faut vérifier les requêtes applicatives : certains écarts sont des différences de nom, pas nécessairement des tables manquantes.

## Tables sans clé étrangère

Une vérification des relations a trouvé 8 tables sans clé étrangère entrante ni sortante : `ai_model_catalog`, `billing_invoice_counters`, `billing_settings`, `contact_messages`, `rate_limits`, `system_settings`, `travel_availability` et `webhook_events`. Cette liste est un point de revue, pas une liste de défauts : plusieurs sont des tables de configuration, de journalisation ou de système qui peuvent légitimement ne pas avoir de clé étrangère. Il faut rapprocher chaque table de ses consommateurs avant de conclure qu'elle est orpheline.

## Colonnes candidates à une relation

Le scan initial avait identifié 39 colonnes de type UUID/entier se terminant par _id sans contrainte FK. Une migration supplémentaire a maintenant relié 17 références directes après vérification de zéro ligne orpheline, avec 14 index de support. Il reste 22 colonnes candidates à revoir : références polymorphes (entity_id, target_id, resource_id, related_id, reference_id), champs du CRM historique hors périmètre et relations dont la table source doit être confirmée. Aucune contrainte n'est ajoutée sur la seule base du nom du champ.

## Résultats des conseillers Supabase

Les contrôles de sécurité et de performance ont également signalé des éléments à traiter, sans modification automatique :

- 7 tables avec RLS actif mais sans politique explicite (elles peuvent être volontairement réservées au serveur ; vérifier les grants et l'usage avant tout changement) ;
- 12 fonctions \`SECURITY DEFINER\` exécutables par \`anon\` ;
- 124 fonctions \`SECURITY DEFINER\` exécutables par \`authenticated\` ;
- protection des mots de passe compromis désactivée ;
- 533 clés étrangères sans index couvrant détecté ;
- 284 politiques RLS susceptibles de réévaluer inutilement les fonctions \`auth\` par ligne ;
- 60 cas de politiques permissives multiples ;
- 12 groupes d'index en double et 408 index signalés inutilisés.

Ces résultats ne justifient pas une suppression ou une révocation massive. Chaque fonction financière, d'administration, de certification et de workflow doit être classée selon son contrat d'accès avant modification.

## Tests de migration et de RLS

Un workflow CI dédié, `.github/workflows/jdv-immo-construction-sql-smoke.yml`, applique les deux migrations à une base PostgreSQL jetable, vérifie les contraintes/grants/politiques et teste l'isolation entre deux utilisateurs. Le résultat de ce workflow doit être vert avant fusion.

## Snapshot de types générés

Le snapshot TypeScript de `supabase/snapshot/database.types.ts` a été régénéré depuis le schéma Supabase actif après l'activation de JDV Services et des relations intermodules. Il inclut les tables `immo_construction_briefs`, `jdv_service_offerings`, `jdv_service_requests` ainsi que les relations disponibles dans les types générés. Il reste à vérifier que chaque client Supabase de l'application importe ce contrat plutôt que de conserver des types locaux divergents.

## Synchronisation GitHub / Supabase : ce qui reste à faire

1. Comparer la liste complète des migrations enregistrées à celle du dépôt et marquer les migrations historiques manquantes sans les rejouer en production.
2. Produire un snapshot contrôlé du schéma réel (tables, colonnes, clés étrangères, index, enums, fonctions, triggers, vues et politiques) et le versionner sans données personnelles ni secrets.
3. Générer une matrice par branche : route UI → requêtes Supabase → tables/vues/RPC → clés étrangères → politiques RLS → tests.
4. Valider les migrations JDV Services et les autres workflows Immo dans une base de prévisualisation avant de les appliquer.
5. Régénérer les types TypeScript Supabase si le dépôt utilise un contrat de types générés, puis exécuter TypeScript, build Next.js, tests RLS et tests de parcours.
6. Vérifier les logs des Deploy Previews Netlify. Une fusion GitHub n'est pas une preuve de réussite de déploiement.
7. Ne pas toucher au CRM historique et ne pas appliquer de changement destructif sur la base active sans migration isolée, revue et validation.

## État de livraison

- Migration ciblée du studio JDV Immo : appliquée et vérifiée.
- Synchronisation historique complète : en cours, non déclarée terminée.
- Migrations JDV Services : appliquées et vérifiées; l'historique est aligné dans la PR #171.
- Autres tables du workflow Immo : non appliquées.
- Vérification finale du build/Netlify pour le dernier commit : en cours; quatre previews étaient vertes sur le commit précédent et le site jdv-global-center signalait une erreur sans message exploitable dans les métadonnées disponibles.
- Aucun déploiement Netlify de production effectué.
