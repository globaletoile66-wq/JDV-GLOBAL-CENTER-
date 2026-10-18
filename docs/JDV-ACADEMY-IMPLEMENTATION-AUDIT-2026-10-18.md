# Audit technique JDV Academy — 18 octobre 2026

## Périmètre et méthode

Audit en lecture seule du dépôt GitHub `globaletoile66-wq/JDV-GLOBAL-CENTER-` et du schéma Supabase du projet JDV Global Center. La branche de travail de ce changement est créée depuis la branche par défaut `supabase-sync-2026-09-24` afin de ne pas repartir d'une ancienne branche Academy située 196 commits derrière la base actuelle.

Aucune donnée n'a été supprimée. Après revue du SQL, de son périmètre et du retour arrière, une migration additive dédiée aux politiques RLS Academy a été appliquée le 18 octobre 2026.

## État vérifié

- Pages trouvées : `/academy` et `/academy/courses/[id]`.
- Tables Academy trouvées dans Supabase : `academy_programs`, `academy_courses`, `academy_lessons`, `academy_enrollments`, `academy_assessments`, `academy_results`.
- Les six tables ont RLS activé. Au moment de l'audit, elles contenaient chacune zéro ligne.
- Les programmes disposent déjà de champs de prix/devise, mais cela ne constitue pas un flux commercial ou de paiement complet.
- Les leçons sont principalement du texte et une durée ; le modèle actuel ne gère pas encore un catalogue complet de médias.
- Les évaluations contiennent un titre et un barème ; il n'existe pas encore de modèle de questions/réponses ou de soumission d'examen dans les tables examinées.
- L'interface signale explicitement que la saisie et la validation des notes nécessitent encore un développement séparé.

## Défaut corrigé dans cette branche

La page Academy vidait ses listes et quittait le chargement dès qu'aucun utilisateur n'était connecté. Cela empêchait le catalogue public d'interroger les programmes publiés et les cours ouverts, alors que le dépôt contient des migrations prévues pour cette lecture publique.

Le changement permet maintenant à la page de charger le catalogue via Supabase même pour un visiteur. Les vues « Mes apprentissages » et « Gestion » nécessitent une connexion, et un visiteur reçoit un lien de connexion pour demander une inscription. Les politiques RLS restent l'autorité finale pour toute lecture/écriture.

## Point bloquant à résoudre avant d'affirmer que le catalogue public fonctionne en production

Le dépôt contient les migrations :

- `20261018060000_jdv_academy_published_catalog_rls.sql`
- `20261018061000_jdv_academy_enrolled_content_rls.sql`

La lecture initiale des politiques actives ne montrait pas les quatre politiques attendues. Après revue du SQL, la migration `20261018160533_jdv_academy_public_catalog_and_enrolled_content_rls.sql` a été appliquée via la voie contrôlée Supabase. La vérification post-application confirme que les quatre politiques apparaissent dans `pg_policies` et que la version `20261018160533` figure dans l'historique des migrations.

## Écarts fonctionnels à construire

1. **Learn** : progression par leçon, reprise de lecture, supports vidéo/documents, devoirs et soumissions.
2. **Studio** : création de contenu, versionnage, validation pédagogique et publication.
3. **Business** : espaces organisationnels, cohortes, formateurs et gestion des apprenants.
4. **Live** : sessions planifiées, lien de réunion sécurisé, présence et enregistrement éventuel.
5. **Certification** : règles d'éligibilité, délivrance, identifiant de vérification et page publique de vérification.
6. **AI** : tuteur fondé sur les contenus autorisés, quotas, garde-fous et séparation des données par organisation.
7. **Revenue** : tarification, commandes, paiements confirmés par un fournisseur et suivi des remboursements ; aucun paiement ne doit être simulé.
8. **Intelligence** : indicateurs calculés à partir d'inscriptions, progressions, résultats et revenus réels.

## Sécurité et performance

- Les politiques Academy existantes donnent aux membres d'organisation une lecture de contenus liés à leur organisation. Les rôles pédagogiques plus fins (formateur, modérateur, gestionnaire, etc.) ne sont pas encore représentés dans le modèle Academy inspecté.
- Les règles publiques doivent rester limitées aux programmes publiés et cours ouverts ; le contenu des leçons et les résultats ne doivent pas devenir publics.
- L'analyse Supabase globale a signalé 523 clés étrangères sans index couvrant dans le projet, dont plusieurs liées à Academy. Cela doit être traité progressivement, après validation des index existants et de leur coût.
- Les conseillers Supabase ont aussi signalé des politiques permissives qui se chevauchent sur différentes tables. Il ne faut pas les supprimer en masse : les politiques permissives se combinent par OR et leur retrait peut casser des flux existants.
- Aucun objet Academy n'a été identifié comme sûrement obsolète pendant cet audit. Aucune suppression de table, de politique ou de donnée n'est recommandée sans analyse de dépendances et plan de retour arrière.

## Critères d'acceptation avant production

- Vérifier que le journal Supabase correspond aux fichiers de migration versionnés ; la migration RLS Academy est maintenant alignée sur la version `20261018160533`.
- Vérifier les parcours visiteur, apprenant, formateur et administrateur d'organisation avec comptes de test distincts.
- Tester les accès directs aux leçons, évaluations, résultats et certificats avec des rôles non autorisés.
- Vérifier compilation TypeScript, build Next.js, preview Netlify et tests de parcours.
- Confirmer que la page d'accueil et les autres branches JDV Global Center ne sont pas modifiées.
- Garder un plan de retour arrière pour toute modification du schéma.

## Modifications de cette livraison

- Modification limitée à `src/app/academy/page.tsx` pour débloquer l'expérience catalogue visiteur et améliorer le lien de connexion.
- Ajout de ce rapport d'audit.
- Aucune suppression de données ou de tables.
- Migration RLS additive appliquée après revue ; aucun objet ou aucune ligne supprimés.
- Vérification post-application des quatre politiques RLS et de l'entrée dans l'historique Supabase.
