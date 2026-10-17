# Étape 2 : inscription et authentification

Base : la fondation Rocket (`src/app`, alias `@/`). Elle gère déjà la création de compte, la connexion, le mot de passe oublié et sa réinitialisation, et la déconnexion. Ce paquet ajoute ce qui manquait : vérification d'email, double authentification, gestion des sessions, et deux corrections de sécurité.

## 1. Ce que contient ce paquet
| Fichier | Rôle |
|---|---|
| `src/app/auth/verify-email/page.tsx` | Écran « Vérifiez votre email » avec renvoi (pause de 60 s). |
| `src/app/auth/mfa/page.tsx` | Saisie du code 2FA à la connexion. |
| `src/app/settings/security/page.tsx` + `src/components/security/*` | Sécurité du compte : mot de passe, 2FA (QR code), appareils connectés. |
| `src/lib/auth/mfa.ts` | `needsMfaChallenge` et `safeRedirect`. |
| `src/lib/auth/middlewareGuards.ts` | Garde 2FA pour le middleware. |
| `src/app/auth/callback/route.ts` | Remplace l'existant : redirection sécurisée. |
| `database/migrations/20261011_jdv_account_sessions_v1.sql` | APPLIQUÉ en production, testé. |

## 2. Modifications à faire dans les fichiers existants

**a) `src/app/auth/register/page.tsx`** : remplacer l'appel d'inscription et la redirection.
Aujourd'hui, après l'inscription la page redirige toujours vers `/onboarding`, qui exige d'être connecté : si la confirmation d'email est active, l'utilisateur arrive sur la connexion sans explication.
```ts
const res = await signUp(data.email, data.password, { first_name: data.first_name, last_name: data.last_name, full_name: `${data.first_name} ${data.last_name}` });
setSuccess(true);
if (!res?.session) {
  router.push(`/auth/verify-email?email=${encodeURIComponent(data.email)}`);
} else {
  toast.success(`Compte créé ! Bienvenue ${data.first_name} sur JDV GLOBAL CENTER`);
  setTimeout(() => router.push('/onboarding'), 1500);
}
```

**b) `src/contexts/AuthContext.tsx`**, dans `signUp` : `emailRedirectTo: \`${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback?next=/onboarding\``.

**c) `src/app/auth/login/LoginPageContent.tsx`** : après `await signIn(...)`, remplacer `router.push(redirectTo)` par :
```ts
import { createClient } from '@/lib/supabase/client';
import { needsMfaChallenge, safeRedirect } from '@/lib/auth/mfa';
// ...
if (await needsMfaChallenge(createClient())) { router.push(`/auth/mfa?redirect=${encodeURIComponent(redirectTo)}`); return; }
router.push(safeRedirect(redirectTo));
```
Sécurité : `redirectTo` vient de l'adresse (`?redirect=`) et était utilisé tel quel. Avec une adresse comme `?redirect=https://site-pirate.com`, un lien de connexion piégé renverrait l'utilisateur vers un faux site après sa connexion. `safeRedirect` n'accepte que les chemins internes.

**d) `src/app/auth/forgot-password/page.tsx`** : `redirectTo: \`${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback?next=/auth/reset-password\`` (la session de récupération est ainsi établie côté serveur avant d'afficher le formulaire).

**e) `src/middleware.ts`** : après le bloc `if (!user && isProtected) { ... }`, ajouter :
```ts
import { mfaRedirect } from '@/lib/auth/middlewareGuards';
// ...
if (user && isProtected) {
  const r = await mfaRedirect(supabase, request);
  if (r) return r;
}
```
Facultatif et recommandé : exiger la 2FA pour le chemin `/super-admin` (compte à privilèges élevés). Activez d'abord votre propre 2FA depuis `/settings/security`, sinon vous vous bloquez vous-même.

## 3. Réglages à faire dans Supabase (tableau de bord, je ne peux pas les modifier)
Vérifiez que chacun est en place ; la disponibilité de certains dépend de votre offre Supabase.
1. **URL** : Site URL = l'adresse publique du site ; Redirect URLs : `<site>/auth/callback` (et l'adresse de test si vous en avez une).
2. **Confirmation d'email** activée (« Confirm email »). Sans elle, n'importe qui peut ouvrir un compte avec l'adresse d'un tiers.
3. **Mot de passe** : longueur minimale 10 ; protection contre les mots de passe compromis (signalée **désactivée** par l'analyse de sécurité).
4. **Double authentification (TOTP)** activée dans les paramètres d'authentification.
5. **Serveur d'envoi d'emails** : le serveur par défaut de Supabase est limité (quelques emails par heure) et prévu pour les tests. Configurez votre propre SMTP avant le lancement, sinon les inscriptions échoueront dès que plusieurs personnes s'inscrivent.
6. **Modèles d'emails** : traduire en français et y mettre le nom JDV GLOBAL.
7. **Sessions** : durée maximale et délai d'inactivité (selon l'offre). Aujourd'hui un compte cumule 29 sessions ouvertes.
8. **Limites de débit** et, idéalement, **CAPTCHA** sur l'inscription et le mot de passe oublié.

## 4. Ce qui est testé et ce qui ne l'est pas
Testé : les fonctions de sessions en base (isolation entre utilisateurs, session courante protégée, visiteur refusé) ; syntaxe de tout le code. Non testé : le rendu à l'écran et les flux complets avec de vrais emails et un vrai code 2FA. Essayez-les dès l'intégration : inscription, email reçu, connexion, activation 2FA, nouvelle connexion avec code, fermeture d'un appareil, mot de passe oublié.
