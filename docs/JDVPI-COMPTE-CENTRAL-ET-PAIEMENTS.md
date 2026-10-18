# JDVPI — compte central et règle de transaction

## Décision d’architecture

La branche GitHub de référence pour ce lot est `JDVPI`. Tout changement du lot JDVPI doit être développé sur cette branche et passer les contrôles avant intégration.

Le compte JDVPI n’est pas un compte de paiement parallèle. Il s’appuie sur l’identité centrale Supabase Auth et son profil `public.profiles` (`profiles.id = auth.users.id`). Il n’y a donc pas de seconde table d’utilisateurs ni de compte distinct par module.

## Règles obligatoires

1. Une personne doit être authentifiée avec son compte JDVPI pour initier une transaction.
2. Le profil JDVPI doit exister et avoir `account_status = 'active'`.
3. Le portefeuille utilisé doit appartenir au compte connecté; le client ne peut pas choisir l’identité d’un autre payeur.
4. Les transferts vérifient l’identité active de l’expéditeur et, lorsqu’il s’agit d’un compte utilisateur, du destinataire.
5. Le serveur reste seul responsable de la confirmation financière : montant, devise, propriétaire du portefeuille, idempotence, statut du prestataire et recalcul des soldes. Une interface cliente ne peut jamais déclarer un paiement réussi.
6. Les modules (Immo, Marketplace, Tontine, etc.) réutilisent JDV PAY et l’identité centrale; ils ne créent pas de portefeuille ni de système de paiement parallèle.
7. Les webhooks de prestataires peuvent finaliser une opération en cours côté serveur, mais ils ne doivent jamais créer un paiement confirmé sans preuve vérifiée du prestataire.

## Portée de ce lot

La migration `20261018150000_jdvpi_active_account_payment_guard.sql` ajoute une garde côté base de données pour refuser la création de mouvements financiers lorsque le propriétaire du portefeuille n’a pas de profil JDVPI actif. Elle ajoute également une garde avant insertion des transferts. Les comptes et transactions existants ne sont pas modifiés rétroactivement.

## Vérifications restantes avant activation globale

- Tester chaque chemin de paiement et chaque webhook de prestataire en environnement contrôlé.
- Vérifier les droits d’exécution des RPC financières et la séparation entre rôle utilisateur et rôle serveur.
- Vérifier les flux d’inscription, de validation d’adresse e-mail, de suspension/réactivation de compte et de récupération de compte.
- Confirmer les exigences KYC/limites et les prestataires réellement configurés avant d’activer les paiements externes.
- Exécuter build, tests automatisés et audit Supabase; déployer seulement après validation.

## Sécurité

Aucun paiement réel ou de test n’est créé par cette migration. Aucune table CRM historique n’est modifiée.
