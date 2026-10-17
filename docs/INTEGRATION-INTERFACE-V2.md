# Interface v2 : page d'accueil complète (étape 1), thème personnalisable, 17 pôles, avis, assistant IA

## Ce que contient ce dossier
| Fichier | Rôle |
|---|---|
| `lib/theme/palettes.ts` | Thèmes prêts à l'emploi + couleurs libres. Contrastes calculés (texte toujours lisible, ratio ≥ 4,5 testé). |
| `components/theme/ThemeProvider.tsx`, `ThemePalette.tsx` | Palette de couleurs (bouton « Couleurs »). Choix conservé sur l'appareil. |
| `app/jdv-theme.css` | Valeurs par défaut (fond blanc) et classe `.jdv-home`. |
| `lib/jdv/poles.ts` | Les 17 pôles : branches, ce que fait chacun, pour qui, pourquoi, état réel. À modifier ici pour changer les textes partout. |
| `components/home/WhyJdv.tsx` | « Pourquoi choisir JDV GLOBAL ? » |
| `components/home/PolesShowcase.tsx` | Les 17 pôles, cartes dépliables. |
| `components/home/ReviewsSection.tsx` | Avis : note de 1 à 5 étoiles + commentaire, avec modération. |
| `components/home/AssistantWidget.tsx` | Assistant IA flottant. |
| `app/loading.tsx` | Page de chargement qui présente les 17 pôles. |
| `app/page.tsx` | Nouvel accueil (sauvegardez l'ancien avant de le remplacer). |
| `components/home/BrandSection.tsx` | Identité de la marque (textes tirés du README du projet). |
| `components/home/FeaturesSection.tsx` + `lib/jdv/features.ts` | Fonctionnalités, avec l'état réel de chacune. |
| `components/home/PricingSection.tsx` + `lib/jdv/branches.ts`, `pricingFormat.ts` | Tarifs PAR BRANCHE lus en direct dans la base (une branche apparaît dès que ses formules sont publiées). |
| `components/home/ContactSection.tsx` + `lib/jdv/contact.ts` | Contact : vos coordonnées + formulaire (3 messages par email et par heure). |
| `database/migrations/20261010_jdv_platform_reviews_v1.sql` | APPLIQUÉ en production. |
| `database/migrations/20261010_jdv_public_site_v1.sql` | APPLIQUÉ : messages de contact (la fonction de tarifs `public_subscription_plans` a été remplacée par `public_branch_plans`, voir le paquet abonnements). |
| `database/migrations/20261010_jdv_billing_close_direct_writes_v1.sql` | APPLIQUÉ : abonnements en lecture seule côté navigateur + fonction `billing_start_trial`. |
| `backend/edge-functions/jdv-assistant/` | BROUILLON non déployé (voir plus bas). |

## Installation (Next.js 15, dossier `app/` à la racine du dépôt)
1. Copier `lib/`, `components/` et `app/` dans le dépôt. Sauvegarder l'ancien `app/page.tsx` et `app/loading.tsx`.
2. Dans `app/layout.tsx` : ajouter `import './jdv-theme.css';`. Pour que le thème choisi s'applique aussi pendant le chargement et sur les autres pages, envelopper `{children}` avec `<ThemeProvider>` (import depuis `../components/theme/ThemeProvider`).
3. `lib/jdv/supabase.ts` : remplacer par le client navigateur déjà utilisé par l'application. L'avis et l'assistant exigent que l'utilisateur soit connecté avec le même client que le reste de l'application.
4. Le lien « Se connecter » pointe vers `/crm` par défaut (propriété `loginHref`) : indiquer la vraie page de connexion.
5. Le fond blanc ne s'applique qu'aux pages qui portent la classe `jdv-home` (accueil et chargement). Les portails (CRM, entrepôt, terrain) gardent leur style tant que vous ne l'y ajoutez pas : dites-moi si vous voulez les passer aussi en blanc.

## Avis : modération
Un avis est publié seulement après approbation. Un utilisateur ne peut jamais s'auto-approuver ; modifier son avis le remet en attente.
Approuver (super admin) : `select public.platform_review_moderate('<id de l'avis>', 'approved');` — ou `'rejected'`.
Une page de modération dans l'espace super admin reste à construire.

## Assistant IA : à activer
`jdv-assistant` répond uniquement à partir d'une base de connaissances intégrée (état réel des branches), sans accès aux comptes ni aux soldes.
1. Définir les secrets `OPENAI_API_KEY` et `JDV_ASSISTANT_MODEL` (nom du modèle à utiliser).
2. Déployer avec la vérification JWT activée : `supabase functions deploy jdv-assistant`.
3. Limite : 10 questions par minute et par utilisateur ; réponses de 500 jetons maximum. Fixer un budget côté fournisseur.
Tant que la fonction n'est pas déployée, le widget affiche « Je ne peux pas répondre pour le moment ».

## Contenu à valider par vous
Les textes de `poles.ts` décrivent l'intention de chaque branche. Les étiquettes « Disponible / En construction / Bientôt » reflètent l'état réel aujourd'hui : mettez-les à jour au fur et à mesure.
Les chiffres affichés (15 pays, 10 devises, 5 langues) viennent de la base ; aucune statistique ni aucun témoignage n'est inventé.

## Étape 1 : ce qu'il faut renseigner avant de publier
1. `lib/jdv/contact.ts` : votre email, téléphone, WhatsApp, adresse, horaires, réseaux sociaux. Un canal laissé à `null` n'est pas affiché. Le formulaire fonctionne déjà ; les messages arrivent dans la table `contact_messages` (lecture réservée aux super admins).
2. Tarifs : ils se gèrent dans la base, branche par branche (voir `docs/INTEGRATION-ABONNEMENTS.md` du paquet abonnements). Aucun fichier à modifier.
3. `PricingSection signupHref` : page vers laquelle mène « Voir la formule » (par défaut `/abonnements`, fournie par le paquet abonnements).

## Important : démarrage de l'essai gratuit
Les écritures directes sur `organization_subscriptions`, `subscription_payments` et `subscription_events` sont interdites depuis le navigateur. Si l'application démarre l'essai gratuit en écrivant dans ces tables, remplacer cet appel par :
`supabase.rpc('billing_start_trial', { p_plan_code: 'mensuel', p_organization_id: '<id>' })` (un seul essai par abonné et par branche, réservé à un administrateur de l'organisation).
