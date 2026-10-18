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

### 4.1 Fonctions Tontine à priorité de revue élevée

Le contrôle des privilèges indique que les fonctions suivantes sont déclarées SECURITY DEFINER et que le rôle `authenticated` peut les exécuter au niveau PostgreSQL :
- `tontine_set_status(p_tontine_id, p_status)`
- `tontine_apply_late_penalties(p_cycle_id)`
- `tontine_pay_contribution(p_schedule_id, p_wallet_id, p_amount)`
- `tontine_record_contribution(...)`
- `tontine_create_join_link(...)`
- `tontine_join_by_link(...)`
- `tontine_request_membership(...)`

Ce constat n'établit pas que les fonctions sont exploitables : il faut lire le corps de chacune et confirmer les contrôles d'identité, d'appartenance, de rôle, de statut et de montant. Néanmoins, les fonctions qui changent le statut, appliquent les pénalités ou écrivent des mouvements financiers sont prioritaires. Ne pas leur ajouter de nouveaux pouvoirs avant cette revue.

Les fonctions sensibles de dispatch/rapprochement, notamment `tontine_queue_due_payouts`, `tontine_claim_due_dispatch` et `tontine_reconcile_dispatch`, ne sont pas exécutables directement par `authenticated` selon le contrôle des privilèges effectué. Le worker doit continuer à les appeler exclusivement côté serveur.


## 4.2 Résultats de lecture des fonctions — constats précis

### F-01 — Adhésion activée avant la vérification complète (priorité critique)

La fonction `public.tontine_join_by_link(text, boolean)` :
- exige un utilisateur connecté, un lien valide et l'acceptation des règles ;
- exige un numéro de téléphone confirmé dans Supabase Auth ;
- crée ou met à jour l'adhésion avec `membership_status='active'` ;
- renseigne `identity_confirmed_at` et `identity_confirmation_method='verified_phone_auth'`.

Elle ne vérifie pas de pièce d'identité officielle, de validation documentaire, de contrat signé/versionné ou de témoins avant de rendre le membre actif. La confirmation du téléphone ne doit pas être présentée comme une vérification d'identité documentaire. Cette fonction contredit donc le parcours d'admission souhaité.

**Mesure recommandée :** introduire un état d'admission en attente et un workflow explicite de validation (identité, contrat, témoins si retenus) avant activation. Avant de modifier la fonction, inventorier tous ses appelants et vérifier si le parcours d'invitation est déjà utilisé en production. Ne pas faire de changement silencieux qui bloque ou réactive des adhésions existantes.

### F-02 — Activation de la tontine avec des prérequis insuffisants (priorité élevée)

La fonction `public.tontine_set_status(uuid, text)` permet au président ou au super-administrateur de passer une tontine de `draft` à `open` si elle a au moins deux membres `active` et un cycle planifié/ouvert/actif. Elle n'exige pas explicitement, dans cette fonction, que les pièces d'identité soient validées, que les signatures/témoins soient présents, ou que le taux de commission et la version du contrat aient été acceptés.

**Mesure recommandée :** centraliser les critères d'éligibilité à l'activation côté serveur, à partir de données versionnées et vérifiables. Une activation doit échouer en expliquant les prérequis manquants.

### F-03 — La fonction de pénalité ne représente pas la règle des trois impayés (priorité élevée)

La fonction `public.tontine_apply_late_penalties(uuid)` marque `late` les échéances passées encore `due` ou `partially_paid`, renseigne `late_fee_amount` et `late_marked_at`, puis retourne le nombre d'échéances marquées. Elle autorise le président ou le super-administrateur à la déclencher. Elle ne compte pas trois impayés confirmés par membre, ne gère pas une contestation et ne crée pas de dossier de défaut.

**Mesure recommandée :** séparer le marquage d'une échéance en retard de la confirmation d'un défaut, compter les échéances distinctes réellement impayées, intégrer le délai de grâce et les contestations, puis déclencher le dossier au troisième défaut confirmé. Toute pénalité doit rester conforme au contrat et être comptabilisée séparément.

### F-04 — Risque de nouvelle contribution après une réponse réseau ambiguë (à tester)

`public.tontine_pay_contribution(uuid, uuid, numeric)` verrouille l'échéance et le portefeuille, vérifie le solde, crée un débit JDV PAY, puis enregistre la contribution. Elle ne reçoit pas de clé d'idempotence fournie par le client. Les verrous et contrôles de solde réduisent certains risques, mais ne remplacent pas une clé stable permettant de reconnaître une répétition exacte de la même demande après une coupure réseau.

**Mesure recommandée :** concevoir une clé d'idempotence persistée par demande de paiement, avec contrainte d'unicité et résultat réutilisable en cas de répétition. Tester deux demandes simultanées, la répétition après timeout et le paiement partiel. Ne pas lancer de tests avec de vrais portefeuilles ou fonds.

### F-05 — Fonctions privilégiées exposées au rôle authentifié : revue ciblée requise

Les ACL PostgreSQL indiquent que plusieurs fonctions `SECURITY DEFINER` sont exécutables par `authenticated`, dont `tontine_set_status`, `tontine_apply_late_penalties`, `tontine_pay_contribution`, `tontine_record_contribution`, `tontine_create_join_link`, `tontine_join_by_link` et `tontine_program_collection`. Certaines vérifient l'identité/le rôle à l'intérieur ; l'exposition ne prouve donc pas à elle seule une vulnérabilité.

**Mesure recommandée :** pour chaque fonction, documenter l'acteur attendu, l'autorisation, les invariants, les objets verrouillés et les tests négatifs. Révoquer l'exécution aux rôles non nécessaires et accorder le moindre privilège uniquement après vérification des appelants applicatifs.

### F-06 — Le mécanisme de paiement externe est séparé du crédit du portefeuille interne

`tontine_generate_payout` est réservé au rôle système et crédite le portefeuille JDV du bénéficiaire après contrôle du montant et des fonds collectés du cycle. Le worker de dispatch externe utilise un autre parcours avec clé d'idempotence et rapprochement prestataire. Il faut vérifier la règle de sélection du parcours de paiement et s'assurer qu'une même rotation ne peut pas être payée à la fois dans le portefeuille interne et via le prestataire externe.

**Mesure recommandée :** définir un mode de décaissement unique par rotation, imposer une contrainte/transition d'état commune et tester l'exclusion mutuelle entre les deux parcours.


### F-07 — L'ordre des bénéficiaires peut être reprogrammé avant le premier paiement (priorité élevée)

`public.tontine_program_collection(uuid, jsonb)` vérifie le rôle président/super-administrateur, le statut du cycle et l'absence de paiement déjà créé, puis met à jour l'ordre et les dates des rotations. L'action est journalisée dans `audit_logs`, mais la fonction ne matérialise pas à elle seule un tirage final immuable avec horodatage de publication visible aux membres. Tant qu'aucun paiement n'existe, le plan peut être réécrit.

**Mesure recommandée :** séparer « brouillon du plan » et « tirage final publié ». À la publication, enregistrer l'acteur, l'heure serveur, la méthode/seed ou la procédure de tirage, le résultat complet et l'empreinte du résultat ; verrouiller ensuite les modifications. Toute correction exceptionnelle doit produire une nouvelle version explicite, un motif, une notification à tous les membres et une approbation indépendante lorsque le contrat l'exige.

### F-08 — Le parcours de cycle repose sur le statut actif, sans vérification explicite de l'ensemble des prérequis d'admission (priorité élevée)

`public.tontine_open_cycle(uuid, date, date)` crée des échéances et des rotations pour les membres dont `membership_status='active'`. Puisque la fonction d'invitation peut actuellement mettre un membre directement à l'état actif après la seule confirmation du téléphone et l'acceptation des règles, les prérequis contractuels/documentaires ne sont pas garantis en amont.

**Mesure recommandée :** faire dépendre l'éligibilité à l'activation et à la création du cycle d'un état d'admission vérifié, pas du seul libellé `active`. Le modèle doit empêcher qu'une adhésion incomplète entre dans les échéances et les rotations.

## 4.3 Tests ciblés avant toute modification

- Appeler `tontine_join_by_link` dans un environnement de test avec téléphone confirmé mais sans preuve documentaire/contrat : le nouveau comportement attendu doit être « en attente », pas `active`.
- Vérifier qu'un membre en attente ne peut pas contribuer, accéder à un cycle de paiement ou devenir bénéficiaire.
- Tenter d'ouvrir une tontine sans acceptation versionnée du contrat et sans validation d'identité : activation refusée.
- Marquer une seule échéance en retard : aucun dossier « trois impayés » ne doit être créé.
- Confirmer trois échéances impayées distinctes après délai de grâce : un seul dossier de défaut doit être créé.
- Soumettre la même demande de contribution deux fois avec la même clé : même résultat, un seul débit.
- Lancer simultanément deux paiements de la même échéance : au plus un débit par demande et aucun dépassement du solde dû.
- Vérifier qu'une rotation ne peut pas aboutir à deux paiements, l'un interne et l'autre externe.

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
