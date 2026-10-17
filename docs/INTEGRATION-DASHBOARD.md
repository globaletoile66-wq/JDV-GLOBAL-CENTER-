# Étape 3 : tableau de bord personnalisé

## Ce qui existait
- `/user-dashboard` : une maquette entièrement fictive (chiffres, notifications et événements inventés, par exemple un « virement reçu de 15 000 XOF » et une connexion « Cotonou »). À ne pas laisser visible à de vrais utilisateurs.
- `/dashboard` : un écran fonctionnel (menu latéral, barre du haut, déconnexion, organisation active, grille de services, notifications, organisations) mais sans statistiques, sans portefeuilles, sans activité, sans abonnements.

## Ce que ce paquet apporte
Un seul appel à la base (`dashboard_overview`, déjà appliqué et testé) alimente 9 blocs, tous propres à l'utilisateur connecté :
indicateurs clés · « Pour bien démarrer » (e-mail, profil, 2FA, identité, première recharge) · portefeuilles · mouvements des 30 derniers jours (graphique) · mes branches (favoris, récents, accès) · activité récente · notifications (avec « tout marquer comme lu ») · abonnements (jours restants) · organisations.
Un état vide clair est prévu pour chaque bloc : un nouvel utilisateur ne voit jamais de faux chiffres.

## Intégration (3 étapes)
1. Copier `src/` dans le projet (alias `@/` du projet Rocket).
2. Dans `src/app/dashboard/page.tsx`, garder le menu latéral, la barre du haut et le bloc « Organization context banner », puis remplacer tout ce qui suit dans `<main>` (grille de services, notifications, organisations, « Activité récente ») par :
```tsx
import DashboardBody from '@/components/dashboard/DashboardBody';
// ...
<DashboardBody activeOrganizationId={activeOrganizationId} onSelectOrganization={setActiveOrganization} />
```
   (`activeOrganizationId` et `setActiveOrganization` existent déjà dans cet écran, via le contexte JDV.)
3. Faire pointer la maquette vers le vrai écran : `src/app/user-dashboard/page.tsx` → `export { default } from '../dashboard/page';`

## Fond blanc de toute l'application (facultatif)
Importer `src/styles/jdv-light-bridge.css` dans `src/app/layout.tsx`, juste après `tailwind.css`. Il remplace le bleu nuit par du blanc en réutilisant les variables du thème personnalisable : la palette de couleurs de l'utilisateur colore alors aussi le tableau de bord. Les couleurs d'état (succès, alerte, erreur) sont choisies pour rester lisibles sur blanc. Les composants de la fondation qui forcent des couleurs claires (par exemple `text-white`) devront être revus : parcourez les pages après l'import.

## À savoir
- **Branches « actives » en base mais sans écran** : en base, JDV PAY, MARKETPLACE, IMMO et TRAVEL sont à l'état « active », alors que seules quelques pages existent. Le tableau de bord ne s'y fie pas : il utilise `src/lib/dashboard/routes.ts`, qui liste les pages réellement construites (`/crm`, `/pay`, `/business`, `/marketplace`). Les autres mènent à « Bientôt ». Mettez ce fichier à jour à chaque livraison.
- **Abonnement requis** : une branche dont l'abonnement est obligatoire et que l'utilisateur n'a pas mène vers `/abonnements#<branche>`.
- **Rafraîchissement** : au retour sur l'onglet et toutes les 2 minutes.
- **Activité** : les connexions viennent des sessions réelles ; le journal personnel est encore presque vide, car peu d'actions y écrivent aujourd'hui.

## Ce qui est testé et ce qui ne l'est pas
Testé : la base (données, calculs, isolation entre utilisateurs, visiteur refusé) et les fonctions utilitaires d'affichage ; syntaxe de tout le code. Non testé : le rendu à l'écran et l'intégration dans votre `dashboard/page.tsx` : parcourez-le avec un compte vide, puis avec un compte qui a des opérations.
