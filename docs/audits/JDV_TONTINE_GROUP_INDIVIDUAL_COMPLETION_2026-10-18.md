# JDV Tontine — clôture de chantier groupe + individuel (préproduction uniquement)

Date: 2026-10-18
Branche: `fix/jdv-tontine-admission-pending-2026-10-18`
PR: #70
Base examinée: branche `supabase-sync-2026-09-24`, projet Supabase `lncgghdbnkehdcyhqdfo`

## Résumé

La base Supabase existante contient déjà les tables d'adhésion, d'échéances, de contributions, de rotations, de décaissements et de rapprochement. Ce changement les réutilise; il ne crée pas de seconde comptabilité.

Le travail porte sur les demandes d'adhésion, les contrôles d'activation, la séparation groupe/individuel et les écrans nécessaires pour suivre le dossier. Aucun SQL n'a été appliqué à la base distante.

## Constat initial vérifié

- `tontine_join_by_link(text, boolean)` passait directement le membre à `active` et marquait `verified_phone_auth`.
- `tontine_request_membership` et `tontine_approve_member` étaient neutralisées par des erreurs explicites.
- La policy RLS `tontine_members_update` autorisait l'utilisateur à mettre à jour sa propre ligne; la policy d'insertion autorisait aussi une insertion personnelle dans une organisation. Cela permettait de contourner la validation par RPC.
- Le schéma n'avait pas de colonne de type tontine; la limite minimale de membres était 2, ce qui excluait un plan individuel.
- Le frontend proposait une fréquence trimestrielle, alors que la contrainte DB l'excluait.
- Le worker wallet existant verse vers le portefeuille personnel JDV PAY et vérifie que la caisse couvre le versement et que les échéances sont réglées. Le worker mobile money est séparé et n'est pas utilisé par les plans individuels, configurés en mode wallet.

## Changements proposés dans la PR

### Admission et contrôle d'accès
- L'invitation de groupe enregistre une demande `pending`, l'acceptation des règles et celle du contrat dans des champs distincts et versionnés.
- Le téléphone confirmé est contrôlé, y compris la correspondance au numéro invité si celui-ci est renseigné, mais n'est plus traité comme une preuve d'identité civile.
- Les adhésions actives restent inchangées lorsqu'un lien est réutilisé; les adhésions suspendues, refusées ou parties ne sont pas réactivées.
- Les insertions, mises à jour et suppressions directes de `tontine_members` sont fermées aux rôles authentifiés. Les RPC contrôlées gèrent ces transitions.
- L'activation positive exige une acceptation versionnée des règles/contrat, un profil KYC approuvé et un document d'identité approuvé. L'auto-approbation est interdite.
- L'ouverture d'une tontine est bloquée si le responsable n'est pas actif, KYC-vérifié et contractuellement validé.

### Mode groupe
- Le créateur est lui aussi en attente de validation, sans identité déclarée vérifiée automatiquement.
- Les invitations restent des demandes en attente pendant le brouillon; les demandes ne deviennent pas actives automatiquement.
- Le groupe ne peut démarrer qu'après validation des membres, création du cycle et contrôle de la caisse par les mécanismes existants.

### Mode individuel
- Ajout de `tontine_type = 'group' | 'individual'`.
- Un plan individuel est créé en brouillon, avec un titulaire unique en attente, sans lien de groupe.
- Le cycle individuel utilise les tables existantes d'échéances, de contributions, de caisse et de rapprochement. Une rotation unique de maturité représente le versement final au titulaire; il n'y a pas de rotation partagée entre membres.
- Le worker wallet JDV PAY existant est réutilisé; le worker de décaissement mobile money n'est pas utilisé pour les plans individuels.
- Aucun nouveau cycle individuel n'est ouvert automatiquement après la maturité. Le plan doit être terminé explicitement après règlement.

### Interface
- Le concepteur permet de choisir groupe ou individuel et enregistre les deux parcours par RPC.
- La page d'invitation présente les règles et demande séparément l'acceptation des règles et du contrat.
- Le tableau de bord distingue les plans individuels des groupes et affiche les adhésions en attente.
- Une page de détail permet de créer le cycle, démarrer/mettre en pause le plan, examiner les demandes et payer les échéances via la RPC JDV PAY existante.

## Vérifications à effectuer avant fusion

1. Appliquer les migrations dans une base de préproduction, jamais directement en production.
2. Vérifier la compatibilité des politiques RLS et des grants avec toutes les routes et tous les workers.
3. Exécuter les cas de `docs/tests/JDV_TONTINE_ADMISSION_REGRESSION_TESTS.md`.
4. Tester des scénarios négatifs : KYC absent, document refusé, contrat absent, auto-approbation, tentative d'insertion/mise à jour directe, lien expiré, limite atteinte.
5. Vérifier le cycle individuel de bout en bout : échéances, paiement JDV PAY, solde de caisse, maturité, portefeuille personnel, rapprochement et fermeture.
6. Vérifier que le moteur de cycles de groupe conserve son comportement de cycle suivant.
7. Exécuter type-check, lint, build Next.js et tests navigateur. Aucun résultat réussi n'est déclaré dans cette PR tant que ces commandes n'ont pas tourné.

## Garde-fous

- Aucune migration appliquée au projet Supabase distant.
- Aucun paiement, solde ou registre comptable modifié.
- Aucun déploiement ou fusion automatique.
- Ancien CRM exclu.
- PR laissée en brouillon jusqu'à recette technique et financière.
