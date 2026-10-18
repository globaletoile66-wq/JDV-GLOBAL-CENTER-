# JDV Tontine — tests de régression de l'admission par lien

## Portée

Tests de revue pour la migration `20261018000100_tontine_join_link_creates_pending_request.sql`.
Ils doivent être exécutés dans un environnement de test isolé avec des utilisateurs et tontines jetables. Ne pas exécuter sur la production.

## Cas obligatoires

1. **Invitation valide + téléphone confirmé + règles acceptées**
   - crée un enregistrement `tontine_members` en `pending`;
   - `joined_at`, `identity_confirmed_at` et `identity_confirmation_method` restent NULL;
   - enregistre la date/version d'acceptation des règles;
   - écrit dans `audit_logs` `identity_verified=false`.

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

## Vérifications avant fusion

- vérifier la signature, le `search_path`, les grants EXECUTE et les politiques RLS effectives;
- exécuter les cas ci-dessus sur une base de test;
- vérifier qu'aucun endpoint ne permet de créer/activer un membre en contournant cette RPC;
- vérifier que les membres `pending` ne peuvent pas cotiser, recevoir un décaissement ni être inclus dans les rotations;
- vérifier les types générés si la fonction ou le schéma évolue.
