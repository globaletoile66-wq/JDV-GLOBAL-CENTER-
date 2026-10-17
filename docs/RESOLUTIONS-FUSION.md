# Résolutions de la fusion Rocket + modules v2

## Appliquées automatiquement
- middleware.ts : version du dépôt conservée + garde MFA + routes /abonnements et /espace protégées
- forgot-password : lien de réinitialisation via /auth/callback (page du dépôt conservée)
- register : redirection vers /auth/verify-email si confirmation d'e-mail requise (page du dépôt conservée)
- AuthContext : version du dépôt conservée (anti-course d'authentification)
- pay/page.tsx : remplacée par l'accueil JDV PAY v2 (version du dépôt = listing brut de portefeuilles)
- dashboard : /dashboard (routeur du dépôt) conservé ; tableau de bord v2 publié sur /espace
- accueil : page du dépôt conservée sur / ; accueil v2 publié sur /accueil-v2 (à comparer)
- package.json, netlify.toml, .env.example : versions du dépôt conservées

## À faire à la main
- (aucune)

Les fichiers restants dans `_a-revoir/` (versions posées à plat à la racine, différentes de celles de `src/`) sont à examiner avant suppression.
