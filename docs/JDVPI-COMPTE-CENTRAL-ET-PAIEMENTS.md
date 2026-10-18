# JDV PAY — compte central et règle de transaction

## Décision d’architecture

La branche de travail dédiée à ce lot est `JDV-PAY`. Les changements de ce lot doivent être développés sur cette branche et validés avant intégration.

JDV PAY est le système central de paiement de JDV Global Center. L’identité s’appuie sur Supabase Auth et le profil central `public.profiles` (`profiles.id = auth.users.id`). JDV PAY ne crée pas une seconde table d’utilisateurs ni un système de paiement distinct pour chaque module.

## Règles obligatoires

1. Toute personne qui initie une transaction doit être authentifiée avec son compte JDV et avoir un compte JDV PAY actif.
2. Le profil central doit exister et avoir `account_status = 'active'`.
3. Le portefeuille utilisé doit appartenir au compte connecté; le client ne peut pas choisir l’identité d’un autre payeur.
4. Les transferts vérifient l’identité active de l’expéditeur et, lorsqu’il s’agit d’un compte utilisateur, du destinataire.
5. Le serveur seul confirme une transaction : propriétaire du portefeuille, montant, devise, bénéficiaire, idempotence, statut du prestataire et recalcul des soldes. Une interface cliente ne peut jamais déclarer un paiement réussi.
6. JDV Immo, Marketplace, Tontine et les autres modules réutilisent JDV PAY; ils ne créent pas de portefeuille ni de système de paiement parallèle.
7. Les webhooks des prestataires peuvent finaliser une opération en cours côté serveur, mais ils ne doivent jamais créer un paiement confirmé sans preuve vérifiée du prestataire.
8. Les comptes existants ne sont pas automatiquement considérés comme actifs si leur état ne peut pas être vérifié. Les règles d’inscription, d’activation, de suspension et de réactivation doivent rester cohérentes avec l’identité centrale.

## Portée du lot

La migration `20261018150000_jdvpi_active_account_payment_guard.sql` a été appliquée au projet Supabase connecté. Elle ajoute une garde côté base de données avant l’insertion de mouvements financiers et de transferts. Les comptes et transactions existants n’ont pas été modifiés rétroactivement.

## Vérifications restantes avant activation globale

- Tester chaque chemin de paiement, remboursement et webhook en environnement contrôlé.
- Vérifier les droits d’exécution des RPC financières et la séparation entre rôle utilisateur et rôle serveur.
- Vérifier les flux d’inscription, validation d’adresse e-mail, suspension/réactivation et récupération de compte.
- Confirmer les exigences KYC/limites et les prestataires réellement configurés avant d’activer les paiements externes.
- Exécuter build, tests automatisés et audit Supabase; ne pas déclarer JDV PAY terminé avant validation de bout en bout.

## Sécurité

Aucun paiement réel ou de test n’a été créé par cette migration. Aucune table CRM historique n’a été modifiée.
