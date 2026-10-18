# JDV TONTINE — audit initial en lecture seule

Date : 2026-10-18  
Dépôt : `globaletoile66-wq/JDV-GLOBAL-CENTER-`  
Projet Supabase examiné : `lncgghdbnkehdcyhqdfo`  
Portée : inventaire et lecture seule. Aucune migration ni donnée métier modifiée.

## 1. Résumé

Le projet dispose déjà d'une fondation Tontine : tontines, adhésions, liens d'invitation, cycles, échéances, contributions, rotations, paiements, écritures de caisse et file de dispatch des versements. Cette fondation ne démontre pas à elle seule que le processus complet est sûr ou opérationnel.

Les règles approuvées le 18 octobre 2026 doivent être ajoutées après revue du modèle actuel, sans dupliquer les mécanismes financiers existants.

## 2. Éléments confirmés dans le schéma Supabase

Tables Tontine observées :
- `tontines` : paramètres du groupe, montant/fréquence, règles, président, statut et mode de versement.
- `tontine_members` : adhésion, rôle, statut, acceptation/version des règles et champs de confirmation d'identité.
- `tontine_join_links` : hash du jeton, téléphone invité, expiration, nombre d'utilisations et version des règles.
- `tontine_cycles`, `tontine_rotations` : cycles et ordre des bénéficiaires.
- `tontine_contribution_schedules` : échéances, montant attendu, statut, frais de retard, horodatage de retard et état de pénalité.
- `tontine_contributions` : mouvements de contribution et références de paiement.
- `tontine_pool_entries` : entrées/sorties de caisse liées aux contributions/paiements.
- `tontine_payouts`, `tontine_payout_dispatches` : paiements, clé d'idempotence, tentatives, références du prestataire et champs de rapprochement.
- `tontine_financial_reconciliations`, `tontine_reminders_sent`.

Fonctions : l'inventaire compte 33 fonctions publiques dont le nom contient « tontine ». Les fonctions financières et administratives doivent être auditées individuellement (corps SQL, droits EXECUTE, vérification du rôle, invariants et appels imbriqués) avant tout changement.

## 3. Écarts par rapport aux règles approuvées

À confirmer dans l'ensemble du schéma avant d'ajouter des tables : dans les tables publiques dont le nom contient « tontine », l'audit initial n'a pas identifié de modèle dédié explicite pour :
- les dossiers de défaut après décaissement et leur statut de recouvrement ;
- le compteur d'impayés confirmés et le workflow de contestation ;
- l'historique versionné des reports de rang et les motifs/décisions ;
- les témoins, les signatures du contrat et les preuves d'acceptation par version ;
- les réserves de pénalités comptabilisées séparément ;
- le dossier d'export judiciaire et le journal d'accès/téléchargement.

Ces éléments peuvent être partiellement couverts par des tables génériques ou des métadonnées existantes : vérifier les dépendances avant de créer une structure nouvelle.

## 4. Sécurité observée — points à examiner, pas des vulnérabilités toutes confirmées

- Supabase Security Advisors a signalé 7 tables RLS-enabled sans politique, dont `public.tontine_reminders_sent`. Cela peut être intentionnel pour une table exclusivement serveur ; vérifier les privilèges SQL et les chemins d'accès avant d'ajouter une politique. Ne pas ouvrir l'accès aux utilisateurs par défaut.
- Le contrôle global des fonctions publiques a compté 110 fonctions SECURITY DEFINER exécutables par `authenticated` et 5 par `anon`. Ce comptage porte sur le schéma public complet, pas uniquement sur Tontine, et ne prouve pas à lui seul une vulnérabilité. Chaque fonction exposée doit être évaluée selon son objectif et ses contrôles d'autorisation.
- Les politiques RLS observées pour les tables Tontine utilisent des rôles administratifs, des membres et des fonctions auxiliaires. Il faut vérifier leurs expressions complètes et tester chaque rôle (membre, président, administrateur d'organisation, concepteur, utilisateur non membre).
- Le worker `jdv-tontine-payout-worker` vérifie le bearer service-role avant de lire la file ou d'appeler le prestataire. Ne jamais tester cette fonction avec une demande susceptible de déclencher un paiement réel.
- L'inventaire de migrations contient un placeholder historique pour `20260920005905_jdv_tontine_phase4e_security_policy`, indiquant que le corps SQL source n'est pas récupérable à cet emplacement. Le snapshot et le schéma réel doivent servir de référence ; ne pas rejouer cette migration.

## 5. Interface actuelle observée

`src/app/tontine/page.tsx` charge les tontines, les adhésions de l'utilisateur et ses échéances. Le texte de l'écran indique explicitement qu'aucun paiement n'est déclenché depuis cette page. C'est une vue consultative, pas une preuve d'un parcours de paiement de bout en bout.

La PR #68 (`feat(tontine): demandes d'adhesion`) est séparée et ouverte à la date de cet audit. Elle modifie seulement `src/app/tontine/page.tsx`; elle n'est pas fusionnée par cet audit. Son parcours d'adhésion doit être testé séparément.

## 6. Plan d'implémentation recommandé

1. Revue des fonctions SECURITY DEFINER Tontine : `tontine_set_status`, `tontine_apply_late_penalties`, `tontine_pay_contribution`, `tontine_record_contribution`, `tontine_generate_payout`, `tontine_queue_due_payouts`, `tontine_claim_due_dispatch`, `tontine_reconcile_dispatch`, `tontine_request_membership` et fonctions liées.
2. Établir le modèle d'incident/contestation et les événements d'audit, en réutilisant les structures génériques existantes si adaptées.
3. Définir la règle de report de trois rangs : ordre initial vs ordre courant, effets sur le calendrier, notification, contestation et décision autorisée.
4. Définir l'assiette de commission, les frais du prestataire, la réserve de pénalités et le rapprochement des fonds.
5. Concevoir les contrats versionnés, les témoins et le stockage des documents avec accès privé et rétention documentée.
6. Construire les tests automatisés et de rôle avant toute migration.
7. Proposer une migration et une PR séparées ; ne pas appliquer de migration à la production sans validation explicite.

## 7. Tests requis avant livraison

- Un utilisateur non membre ne peut pas lire les détails privés ou rejoindre sans invitation/règles valides.
- Un membre ne peut lire que ses informations et les informations du groupe autorisées.
- Le président ne peut pas effectuer de retrait direct ou contourner les règles de paiement.
- Un impayé en attente chez le prestataire n'est pas compté comme défaut confirmé.
- Au troisième impayé confirmé, un dossier est ouvert une seule fois ; la contestation et la décision sont auditables.
- Le report de trois rangs ne s'applique pas à un membre déjà payé et ne crée pas de rang invalide.
- Une caisse insuffisante bloque le décaissement.
- Une clé d'idempotence et des webhooks répétés n'entraînent jamais un double paiement.
- Les exports de recouvrement sont limités aux rôles autorisés et chaque export est journalisé.
- Les pénalités et la commission sont calculées à partir de la version de contrat acceptée.
- Une erreur ou un échec du prestataire ne conduit pas à une écriture financière présentée à tort comme réussie.

## 8. Limites de cet audit

- Aucun test avec un compte utilisateur réel n'a été exécuté.
- Aucun paiement réel n'a été déclenché.
- Aucune migration, écriture métier ou modification de production n'a été effectuée.
- Les constats de schéma doivent être complétés par la lecture intégrale des définitions de fonctions et politiques avant de proposer une migration.
