# JDV Global Center — audit de synchronisation GitHub / Supabase

Date : 20 octobre 2026  
Projet Supabase : \`JDV GLOGBAL CENTER FINAL\` (\`lncgghdbnkehdcyhqdfo\`)  
Dépôt : \`globaletoile66-wq/JDV-GLOBAL-CENTER-\`  
Branche de référence : \`supabase-sync-2026-09-24\`

## Résumé exécutif

La base Supabase est active et contient un schéma large, mais la synchronisation historique GitHub/Supabase n'est pas complète. La vérification ci-dessous distingue ce qui est confirmé de ce qui reste à réconcilier. Aucun lot de migrations historiques n'a été rejoué en masse.

## État mesuré de la base

Requêtes en lecture seule exécutées le 20 octobre 2026 :

- 363 tables dans \`public\`
- 3 vues dans \`public\`
- 3 977 colonnes sur les tables publiques
- 946 clés étrangères
- RLS activé sur les 363 tables publiques (aucune table publique sans RLS)
- 895 politiques RLS
- 246 fonctions dans le schéma \`public\`
- 234 migrations enregistrées après l'ajout du schéma du studio de conception

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

Les tables suivantes ne sont pas présentes dans le schéma public connecté :

- \`jdv_service_offerings\`
- \`jdv_service_requests\`

Deux migrations sont versionnées dans le dépôt (\`20261019191000_jdv_services_marketplace.sql\` et \`20261020100000_jdv_services_workflow_hardening.sql\`). Elles restent à valider en environnement isolé, notamment les politiques RLS et les transitions d'état, avant application à la base active. Les écrans qui les utilisent ne doivent pas être considérés prêts pour la production.

### JDV Social

Les tables réelles observées utilisent les noms \`social_*\` : notamment \`social_profiles\`, \`social_posts\`, \`social_groups\`, \`social_group_memberships\`, \`social_events\`, \`social_event_registrations\`, \`social_app_preferences\`, \`social_conversations\` et \`social_messages\`.

Des noms d'essai tels que \`jdv_social_groups\`, \`social_group_members\` et \`social_user_preferences\` ne correspondent pas aux noms présents. Avant de créer de nouvelles tables, il faut vérifier les requêtes applicatives : certains écarts sont des différences de nom, pas nécessairement des tables manquantes.

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
- Migrations JDV Services : non appliquées.
- Autres tables du workflow Immo : non appliquées.
- Vérification finale du build/Netlify pour la branche de travail : en attente.
- Aucun déploiement Netlify de production effectué.
