# Abonnements par branche

## Le principe
Chaque branche (module) a ses propres formules et ses propres durées. Un abonné (une organisation, ou un utilisateur seul) peut avoir un abonnement par branche, indépendants les uns des autres. Exemple d'organisation : JDV CRM en mensuel et JDV PUB à l'année.
Votre exemple JDV PUB est enregistré en **brouillon inactif** (rien n'est visible tant que vous ne l'activez pas) : 10 $/jour, 120 $/mois, 600 $/6 mois, 1 000 $/an. À l'affichage, l'économie est calculée sur le prix par jour réel : mois −60 %, 6 mois −67 %, an −73 %.

## Ajouter ou modifier les tarifs d'une branche (SQL, super admin)
```sql
-- Publier les tarifs JDV PUB
update public.subscription_plans set active = true where module_code = 'jdv_pub';

-- Créer les formules d'une autre branche (exemple)
insert into public.subscription_plans(code, module_code, name, description, price, currency, duration_days, billing_amount_xof, trial_days, active, sort_order, highlights)
values ('immo_month', 'jdv_immo', 'Mensuel', null, 15, 'USD', 30, 9000, 7, true, 1, '["Annonces illimitées","Statistiques de vues"]');

-- Limites propres à une formule (optionnel)
insert into public.subscription_limits(plan_id, resource_code, limit_value, unlimited)
select id, 'campaigns', 5, false from public.subscription_plans where code = 'pub_month';

-- Rendre l'abonnement OBLIGATOIRE pour utiliser une branche
update public.modules set requires_subscription = true where code = 'jdv_pub';
```
`billing_amount_xof` = montant réellement débité en XOF par FedaPay. **Sans lui, la formule s'affiche mais n'est pas payable en ligne.**

## Utiliser dans l'application
- Dans la page de chaque branche : `<BranchSubscriptionSection moduleCode="jdv_pub" />` (ajouter `organizationId` si l'abonnement se prend au nom d'une organisation).
- Page centrale : `/abonnements` (une section par branche qui a des tarifs publiés).
- Vérifier l'accès d'un utilisateur à une branche : `supabase.rpc('jdv_can_use_module', { p_module_code: 'jdv_pub' })`. Ne bloque que les branches dont `requires_subscription` vaut `true` ; les super admins passent toujours. À faire respecter aussi côté données de la branche (policies / fonctions), pas seulement dans l'écran.

## Ce qui est déjà en place (base de données, testé)
Essai gratuit (une fois par abonné et par branche), activation après paiement (idempotente : un même paiement rejoué ne crédite pas deux fois), renouvellement (la nouvelle période s'ajoute à la fin de l'ancienne), changement de formule, résiliation (l'accès reste jusqu'à la fin de la période payée ; un essai se résilie immédiatement), expiration automatique toutes les 30 minutes, historique des paiements et des événements.
Le CRM continue de fonctionner exactement comme avant.

## Rappels de renouvellement (en place, testé)
Chaque heure, la base vérifie les abonnements et envoie des **notifications internes** : 7 jours, 3 jours et 1 jour avant la fin (selon la durée de la formule), fin d'essai, et un message après l'expiration. Pas de rappel pour un forfait d'un jour, quand l'utilisateur a désactivé les rappels ou demandé la résiliation. Pour une organisation, les propriétaires et administrateurs sont prévenus. Chaque rappel n'est envoyé qu'une fois par échéance et se réarme après un renouvellement. Le bouton de la notification mène à `/abonnements#<branche>`.
Limite : ce sont des notifications dans l'application. L'envoi par email ou WhatsApp demande un fournisseur d'envoi (non configuré) : à décider.

## Factures (en place, testé)
- Une facture est émise automatiquement à chaque paiement d'abonnement réussi, numérotée `JDV-AAAA-NNNNNN` (séquentielle, sans trou), **immuable** (ni modification ni suppression).
- Pages : `/abonnements/factures` (liste), `/abonnements/factures/<id>` (facture imprimable : bouton « Imprimer / enregistrer en PDF »), `/super-admin/facturation` (identité du vendeur, taux de taxe).
- **À faire avant le premier paiement** : renseigner l'identité du vendeur dans `/super-admin/facturation`. Une facture émise avant cette saisie n'a pas de vendeur ; le bouton « Compléter les factures déjà émises » le renseigne après coup (seule modification autorisée sur une facture).
- Taxe : les prix sont considérés TTC ; taux par défaut 0. Je ne peux pas vous dire quelles mentions et quel régime de taxe s'appliquent dans votre pays : faites valider le modèle de facture par un comptable.
- Pas encore : avoirs (notes de crédit) en cas de remboursement, et PDF généré côté serveur (le navigateur produit le PDF).

## Ce qui reste à faire avant les paiements en ligne
1. Renseigner `billing_amount_xof` pour chaque formule payable (ou décider d'un taux de change USD vers XOF).
2. Secrets FedaPay, vérification de l'en-tête de signature dans leur documentation, test en sandbox, puis déploiement de `jdv-billing-checkout` et de `jdv-billing-fedapay-webhook --no-verify-jwt` (brouillons non déployés).
3. Bascule de la page d'accueil sur la lecture des tarifs par branche (fichier `PricingSection.tsx` mis à jour dans `jdv-interface-v2`).
