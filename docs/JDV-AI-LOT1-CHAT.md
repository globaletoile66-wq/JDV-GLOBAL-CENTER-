# JDV AI — lot 1 : chat opérationnel

## Objectif
Relier l'interface `/ai` à un véritable fournisseur de modèles via une route serveur authentifiée, sans exposer de clé au navigateur ni simuler une réponse.

## Inclus
- Route `POST /api/ai/chat` et route `GET /api/ai/chat` pour vérifier l'état de configuration sans exposer les secrets.
- Vérification de session avec le client Supabase serveur.
- Vérification que la conversation appartient à l'utilisateur connecté.
- Limite de 4 000 caractères et quota de 10 requêtes par minute via `ai_check_rate_limit`.
- Historique borné aux 12 derniers messages, persistance par `ai_add_message` et journalisation via `ai_log_access`.
- Affichage du champ de saisie, envoi, retour d'erreur et rafraîchissement de l'historique dans `/ai`.
- Limite de temps fournisseur de 30 secondes et gestion des erreurs.

## Configuration de déploiement requise
- `OPENAI_API_KEY` : secret serveur requis.
- `JDV_AI_MODEL` : facultatif, modèle compatible avec l'API Chat Completions; valeur par défaut `gpt-5-mini`.
- `OPENAI_BASE_URL` : facultatif si un endpoint compatible OpenAI est utilisé.

Ne jamais définir la clé dans une variable `NEXT_PUBLIC_*`. La disponibilité réelle du modèle doit être vérifiée dans les secrets du déploiement et par un test authentifié.

## Hors périmètre de ce lot
- Aucune migration Supabase distante ni modification de données de production.
- Aucun déploiement de production et aucune fusion automatique.
- Aucun accès aux données des branches JDV, aucune action autonome et aucun paiement.
- Pas encore de streaming, de pièces jointes, de RAG documentaire ou de sélection dynamique des fournisseurs.

## Validation avant fusion
1. Type-check et build web dans GitHub Actions.
2. Tester non connecté (401), JSON invalide (400), conversation d'un autre utilisateur (404), quota dépassé (429) et fournisseur non configuré (503).
3. Tester un aller-retour authentifié avec clé serveur de test et vérifier la persistance de la question/réponse.
4. Confirmer que la clé n'apparaît ni dans les bundles client ni dans les journaux.
5. Vérifier que les fonctions RPC `ai_check_rate_limit`, `ai_add_message` et `ai_log_access` existent et ont les permissions attendues sur le projet cible.
