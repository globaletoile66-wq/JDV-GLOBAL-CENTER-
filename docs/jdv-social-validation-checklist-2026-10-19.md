# JDV Social — checklist de validation Web + Mobile

Date de préparation : 19 octobre 2026  
Branche : `feat/jdv-social-foundation-2026-10-19`

Cette liste est un plan de test, pas un compte rendu de tests réussis. Aucun résultat de compilation ou de test sur appareil n'est présumé.

## 1. Préparation

- [ ] Vérifier que les variables Supabase de l'environnement Web sont configurées.
- [ ] Vérifier que `mobile/.env` est configuré localement avec `EXPO_PUBLIC_SUPABASE_URL` et une clé publishable. Ne jamais committer de clé secrète.
- [ ] Utiliser deux comptes de test distincts (A et B), sans données personnelles réelles.
- [ ] Confirmer que la branche de test utilise le bon projet Supabase.
- [ ] Ne pas appliquer la migration candidate `20261019190000_jdv_social_public_reads.sql` au projet distant avant revue et validation dans un environnement isolé.

## 2. Authentification — Web et Mobile

- [ ] Connexion avec un compte existant.
- [ ] Refus d'une connexion avec un mot de passe incorrect.
- [ ] Inscription avec un mot de passe trop court : message explicite.
- [ ] Inscription nécessitant une confirmation e-mail : état présenté clairement.
- [ ] Déconnexion, puis reconnexion.
- [ ] Configuration Supabase absente ou réseau indisponible : message compréhensible, interface non bloquée.

## 3. Profil social

- [ ] Le compte A crée un profil avec un nom d'utilisateur valide.
- [ ] Un nom d'utilisateur invalide ou déjà pris est refusé avec un message explicite.
- [ ] Le compte A modifie son nom affiché et sa bio.
- [ ] Le compte B ne peut pas modifier le profil du compte A.
- [ ] Le profil et les publications restent cohérents entre Web et Mobile après actualisation.

## 4. Fil, publications, réactions et commentaires

- [ ] Le compte A publie un texte non vide.
- [ ] Une publication vide est refusée.
- [ ] Le compte B voit uniquement les publications autorisées par les règles de visibilité.
- [ ] Le compte B ajoute puis retire une réaction.
- [ ] Le compte B ajoute un commentaire; le commentaire apparaît sans rechargement.
- [ ] Le nom du commentateur s'affiche lorsqu'un profil social lisible existe.
- [ ] Une publication privée/non publiée ne fuit pas dans le fil public.
- [ ] Un compte B ne peut ni modifier ni supprimer la publication publique du compte A; les écritures restent limitées à l'auteur ou au super-administrateur.
- [ ] Une publication `public` en brouillon n'est pas lisible par le compte B via l'API directe.
- [ ] Les erreurs RLS sont visibles sans casser le fil.

## 5. Groupes et événements

- [ ] Les groupes actifs sont listés.
- [ ] Le compte A rejoint un groupe public.
- [ ] Pour un groupe privé, la demande reste en attente et n'est pas présentée comme une adhésion confirmée.
- [ ] L'adhésion n'est pas dupliquée après plusieurs clics.
- [ ] Le membre peut quitter un groupe actif.
- [ ] Le membre peut annuler une demande en attente; l'historique passe à `left` sans suppression de ligne.
- [ ] Les événements publiés apparaissent dans l'ordre chronologique.
- [ ] Le compte A s'inscrit puis annule son inscription à un événement.
- [ ] Les statuts et droits d'accès sont vérifiés avec les règles RLS réelles.

## 6. Notifications et préférences de réseaux externes

- [ ] Les notifications du compte connecté sont chargées.
- [ ] Marquer une notification comme lue met à jour son état.
- [ ] Un compte ne peut pas marquer comme lue la notification d'un autre compte.
- [ ] Ajouter/masquer un réseau externe et activer/désactiver ses notifications persiste après rechargement.
- [ ] Les liens externes ouvrent la bonne destination.

## 7. Compilation et intégration continue

- [ ] À la racine : `npm ci`
- [ ] À la racine : `npm run type-check`
- [ ] À la racine : `npm run build`
- [ ] Dans `mobile/` : installer les dépendances puis `npm run type-check`
- [ ] Vérifier le résultat réel du workflow GitHub Actions `JDV Social Web + Mobile validation`.
- [ ] Tester au moins un appareil/simulateur Android ou iOS et la version Web.
- [ ] Consigner les erreurs et les corriger avant fusion ou déploiement.

## 8. Tests négatifs RLS obligatoires avant activation

- [ ] Compte B demande à rejoindre un groupe privé : le statut reste `pending`.
- [ ] Compte B tente de modifier directement sa propre adhésion de `pending` à `active` : l'opération doit être refusée.
- [ ] Un administrateur du groupe approuve la demande; le compte B devient actif uniquement après cette approbation.
- [ ] Un membre marqué `blocked` ne peut ni réactiver son adhésion, ni supprimer sa ligne pour se réinscrire lui-même; seul un administrateur peut lever le blocage.
- [ ] Compte A s'inscrit à un événement : modifier directement `event_id` ou `user_id` sur la ligne d'inscription doit être refusé.
- [ ] Compte A peut annuler sa propre inscription en ne modifiant que `status`.
- [ ] Compte A ne peut pas réactiver une inscription si l'événement n'est plus publié ou s'il n'a plus accès à l'événement réservé aux membres.
- [ ] Compte B ne peut pas déplacer son commentaire vers une publication privée/non publiée qu'il ne peut pas consulter.
- [ ] Compte B ne peut pas modifier directement `post_id` ou `user_id` sur un commentaire; seul le corps du commentaire est modifiable par son propriétaire.
- [ ] Compte B ne peut pas modifier ni supprimer les commentaires d'un autre utilisateur; les droits éventuels de modération sont testés séparément.
- [ ] Un compte non connecté ne peut pas lire les données réservées au rôle `authenticated`.
- [ ] Les rôles `anon` et `authenticated` n'ont aucun privilège `TRUNCATE` sur les tables sociales; le rôle `anon` n'a pas de privilèges directs sur ces tables.
- [ ] Vérifier chaque scénario avec deux comptes de test distincts et conserver les erreurs RLS attendues comme preuves.

## 9. Sécurité et limites à vérifier

- La migration de lecture publique des profils/réactions/commentaires est une migration candidate; elle n'a pas été appliquée au Supabase distant.
- Les conversations directes ne sont pas considérées comme implémentées dans cette tranche.
- L'ancien CRM doit rester inchangé.
- Ne pas installer ni déployer la version finale tant que les tests requis ne sont pas passés.
