# Consolidation des branches JDV GLOBAL CENTER — 19 octobre 2026

## Principes de sécurité
- Le présent travail reste sur `work/branches-consolidation-2026-10-19`.
- Aucun changement n'est fusionné dans la branche principale et aucun déploiement de production n'est déclenché.
- La migration JDV JOBS est préparée dans le dépôt mais n'est pas appliquée au projet Supabase distant.
- Les modules doivent utiliser l'identité, les rôles et les contrôles d'accès existants; aucune branche ne reçoit de privilèges globaux par défaut.
- Les paiements et le ledger restent la responsabilité de JDV PAY.

## État des modifications de ce lot

| Module | État dans ce lot | Notes |
|---|---|---|
| JDV SOCIAL | Existant à auditer | Les routes et tables sociales existantes sont réutilisées; tests de non-régression requis. |
| JDV IA | À auditer | Vérifier les intégrations et secrets avant activation. |
| JDV COMMUNITY | Première route créée | `/community` lit les groupes publics de `social_groups`; création et adhésion restent dans le workflow partagé `/social/groups`. |
| JDV SERVICES | Marketplace initiale + garde-fous SQL | `/service-marketplace` permet la publication et les demandes de devis. La migration préparée verrouille désormais l’identité du prestataire et l’historique de création; migration non appliquée à Supabase distant. L’inbox prestataire et les réponses de devis restent à compléter. `/services` reste le catalogue général. |
| JDV EVENTS | Route de module créée | `/events` réutilise le workflow d'événements existant sous `/social/events`; la billetterie complète doit être auditée séparément. |
| JDV JOBS | Marketplace initiale + fourchette salariale | `/jobs` propose consultation, publication, recherche et candidature; le formulaire prend maintenant en charge le salaire minimum/maximum en XOF. La migration préparée empêche la réaffectation du propriétaire d’une offre et verrouille l’identité d’une candidature. Migration non appliquée à Supabase distant. La compilation reste à exécuter. |
| JDV LEGAL | Écran d’entrée ajouté | `/legal` présente le périmètre et les accès existants sans déposer ni exposer de documents privés. Le stockage privé, les rôles et les dossiers restent à construire/tester. |
| JDV ACCOUNTING | Écran d’entrée ajouté | `/accounting` relie factures, rapports et JDV PAY; aucun solde ou journal fictif n’est calculé. Les rapprochements et clôtures restent à développer. |
| JDV HR | Écran d’entrée ajouté | `/hr` distingue le parcours public JDV JOBS des données RH privées. Les dossiers collaborateurs et les permissions RH restent à construire/tester. |
| JDV PROCUREMENT | Écran d’entrée ajouté | `/procurement` relie Marketplace, catalogue de services et stock en lecture seule. Les demandes d’achat, fournisseurs et validations ne sont pas encore persistés. |
| JDV INVENTORY | Vue de stock créée | `/inventory` lit les tables de stock existantes en lecture seule et calcule les alertes de seuil. Les mouvements et transferts restent à raccorder après audit des flux existants. |
| JDV MEDIA | Existant à auditer | Réutiliser les tables media existantes et vérifier les flux de publication. |

## Logos fournis le 19 octobre 2026
Le fichier RAR contient 18 logos PNG originaux de 1024 × 1024 px. Ils ont été extraits localement et identifiés visuellement. La liste des identités présentes est :
- JDV Global Divertissement
- JDV Immo
- JDV Business
- JDV Admin
- JDV Tontine
- JDV Global Assurance
- JDV Gestion Clientèle
- JDV Légal
- JDV Pay
- JDV Education
- JDV Voyage
- JDV Marketplace
- JDV Pub
- JDV Santé
- JDV Global IA
- JDV Logistique
- JDV Agriculture
- JDV Tourisme

La correspondance visuelle est connue. Un paquet prêt à copier a été préparé avec les 18 PNG originaux renommés selon les noms canoniques. L'intégration binaire dans `public/assets/branches/` et la vérification de rendu restent à terminer. Ne pas modifier les noms d'identifiants de logo déjà utilisés par l'application sans vérifier toutes leurs références.

## Contrôles à effectuer avant fusion
1. Installer les dépendances et exécuter `npm run type-check` puis `npm run build`.
2. Vérifier le rendu des routes `/community`, `/events` et `/jobs` en desktop et mobile.
3. Appliquer les migrations uniquement dans un environnement de préproduction, puis tester les politiques RLS en utilisateur anonyme, candidat et recruteur.
4. Vérifier les alertes Supabase et corriger chaque finding après inspection de ses dépendances.
5. Vérifier les 18 logos dans le navigateur, les chemins d'assets, les dimensions et les textes alternatifs.
6. Contrôler les routes `/legal`, `/accounting`, `/hr` et `/procurement` ainsi que les destinations internes des liens.
7. Ouvrir une pull request; fusion et déploiement nécessitent une décision explicite.

## Mise à jour après le lot d’écrans opérationnels
- Le composant partagé `src/components/jdv/OperationalModuleLanding.tsx` fournit une présentation commune sans fausses données métier.
- Les quatre routes opérationnelles sont maintenant réelles et la page d’accueil y pointe directement.
- Les migrations JOBS et SERVICES ont été durcies par des triggers qui rendent immuables les identifiants de candidature/demande et le message initial; elles restent à tester avec des rôles réels.
- Aucun test de compilation n’est déclaré réussi : aucun workflow de build n’a été observé sur la branche de travail après ces commits. Le contrôle Supabase Preview de la PR est ignoré car la branche Supabase correspondante n’existe pas.
- La copie des 18 PNG d’origine n’est toujours pas confirmée dans le dépôt; les chemins configurés ne doivent pas être considérés comme fonctionnels tant que les fichiers binaires ne sont pas présents.



## Suivi de construction — mise à jour du 19 octobre 2026

- PR de consolidation initiale : https://github.com/globaletoile66-wq/JDV-GLOBAL-CENTER-/pull/135 (fusionnée dans la branche de référence).
- PR de durcissement JOBS/SERVICES : https://github.com/globaletoile66-wq/JDV-GLOBAL-CENTER-/pull/136 (brouillon, non fusionnée).
- Changements du lot suivant : champs de salaire sur JDV JOBS; déclencheurs SQL pour empêcher la réaffectation du propriétaire d’une offre et d’une prestation; privilèges directs révoqués sur les fonctions auxiliaires de déclencheurs.
- Le projet Supabase distant est actif. Les migrations JOBS/SERVICES ne figurent pas dans l’historique distant et n’ont pas été appliquées.
- Le statut CI du dernier commit n’a pas renvoyé de contrôles ni d’exécution de workflow vérifiable; la réussite de `npm run type-check` et `npm run build` n’est donc pas confirmée.
- L’audit Supabase du 19 octobre a signalé 7 tables avec RLS activée sans politique et de nombreux avertissements sur des fonctions SECURITY DEFINER accessibles aux rôles API. Ces alertes doivent être examinées individuellement et sans changements aveugles, notamment pour préserver les modules existants et l’ancien CRM.
- Étape obligatoire avant activation des migrations : environnement de préproduction jetable, tests d’accès anonymes/candidat/recruteur/client/prestataire, tests de non-régression, puis décision explicite avant toute application distante.
