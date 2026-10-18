# JDV Tontine — tests de régression de l'admission par lien

## Portée

Tests de revue pour la migration `20261018000100_tontine_join_link_creates_pending_request.sql`.
Ils doivent être exécutés dans un environnement de test isolé avec des utilisateurs et tontines jetables. Ne pas exécuter sur la production.

## Cas obligatoires

1. **Invitation valide + téléphone confirmé + règles acceptées**
   - crée un enregistrement `tontine_members` en `pending`;
   - `joined_at`, `identity_confirmed_at` et `identity_confirmation_method` restent NULL;
   - enregistre la date/version d'acceptation des règles;
   - écrit dans `audit_logs` `identity_verified_by_join_link=false`.

2. **Règles non acceptées**
   - la fonction échoue avec `RULES_ACCEPTANCE_REQUIRED`;
   - aucun membre ni consommation de lien n'est écrit.

3. **Téléphone absent, non confirmé ou différent du téléphone invité**
   - la fonction échoue;
   - aucun membre ni consommation de lien n'est écrit.

4. **Lien expiré, désactivé ou invalide**
   - la fonction échoue;
   - aucune adhésion n'est créée.

5. **Membre déjà actif**
   - un second appel ne le rétrograde pas;
   - les informations d'approbation et de vérification déjà présentes ne sont pas écrasées.

6. **Membre suspendu, rejeté ou parti**
   - réutiliser un lien ne réactive pas le compte et ne supprime pas le statut restrictif.

7. **Limite atteinte**
   - une nouvelle demande échoue avec `MEMBER_LIMIT_REACHED`;
   - les demandes existantes restent intactes.

8. **Lien à usages limités et appels concurrents**
   - le compteur n'augmente qu'une fois par nouvel adhérent;
   - les verrous empêchent de dépasser `max_uses` ou `member_limit`.

## Limite connue — activation

Le schéma inspecté expose des champs de validation sur `tontine_members`, mais aucune table spécifique d'éléments KYC/contrats rattachés à une adhésion tontine n'a été identifiée dans l'inventaire. Cette modification empêche l'activation automatique par lien; elle ne doit pas être considérée comme une implémentation complète de l'approbation contractuelle. Avant de livrer l'activation, il faut relier les exigences des règles (`tontines.rules`) aux preuves réellement stockées et à leur état de revue, puis ajouter une RPC d'approbation autorisée et des tests d'accès/paiement.

## Cas complémentaires — groupe et individuel

9. **Création d'un groupe**
   - le groupe démarre en `draft`;
   - le créateur est `pending`, sans `identity_confirmed_at`, `approved_by` ni `approved_at`;
   - l'acceptation des règles et du contrat est enregistrée séparément;
   - le lien d'invitation ne peut créer qu'une demande, jamais activer le membre.

10. **Création d'une tontine individuelle**
    - `tontine_type='individual'`, `member_limit=1`, statut `draft`;
    - un seul titulaire `owner` est créé en `pending`;
    - aucun lien de groupe n'est créé et aucune rotation partagée n'est générée;
    - l'ouverture du cycle génère les échéances individuelles et une rotation de maturité unique dont le montant correspond au total des cotisations prévues;
    - le versement de maturité doit passer par le worker de paiement portefeuille existant, attendre la collecte complète et utiliser le portefeuille personnel JDV PAY;
    - aucun cycle individuel supplémentaire n'est ouvert automatiquement après maturité.

11. **Validation KYC et activation**
    - l'approbation positive échoue si le profil KYC n'est pas approuvé;
    - elle échoue si aucun document d'identité approuvé n'existe;
    - elle échoue si l'acceptation contractuelle est absente ou si sa version diffère de celle des règles;
    - l'auto-approbation est interdite;
    - une fois validé par un responsable autorisé, le membre devient actif et la méthode d'identité indique une vérification KYC revue.

12. **Écritures directes**
    - un utilisateur ne peut pas insérer, modifier le statut ou supprimer directement une ligne `tontine_members`;
    - les transitions d'activation d'une tontine échouent si le responsable n'est pas actif, KYC-vérifié et contractuellement validé;
    - les liens d'invitation ne peuvent pas être créés pour une tontine individuelle.

13. **Fréquence trimestrielle**
    - la fréquence trimestrielle est acceptée par le schéma;
    - les échéances utilisent un intervalle de 90 jours, et non l'intervalle mensuel par défaut.

## Vérifications avant fusion

- vérifier la signature, le `search_path`, les grants EXECUTE et les politiques RLS effectives;
- exécuter les cas ci-dessus sur une base de test;
- vérifier qu'aucun endpoint ne permet de créer/activer un membre en contournant cette RPC;
- vérifier que les membres `pending` ne peuvent pas cotiser, recevoir un décaissement ni être inclus dans les rotations;
- vérifier les types générés si la fonction ou le schéma évolue.
