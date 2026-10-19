# JDV Social — application multiplateforme

Ce dossier est une application distincte de la version Web Next.js située à la racine du dépôt.

## Cibles
- Android : application native Expo.
- iOS : application native Expo.
- Web : interface React Native Web en complément de la section JDV Social déjà présente dans Next.js.

## Démarrage
Depuis ce dossier :

```bash
cp .env.example .env
npm install
npx expo start
```

Puis, pour vérifier le typage :

```bash
npm run type-check
```

Pour les builds de distribution Android/iOS, configurez EAS Build, les identifiants d'application et les certificats requis. Une build iOS de production nécessite la configuration Apple correspondante.

## Configuration Supabase
Renseignez dans `.env` :
- `EXPO_PUBLIC_SUPABASE_URL` : URL du projet Supabase JDV.
- `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` : clé publishable du projet. La clé historique `anon` peut être utilisée avec la variable de secours documentée dans `.env.example`.
- `EXPO_PUBLIC_JDV_WEB_URL` : URL réelle de la page Web JDV Social.

Ne mettez jamais une clé `service_role` ou une clé secrète dans l'application cliente. Les accès aux préférences sont limités par les politiques RLS de Supabase.

## Fonctionnalités présentes dans la branche de développement
- Inscription par e-mail/mot de passe, connexion/déconnexion Supabase Auth et session persistante via AsyncStorage.
- Création et modification du profil communautaire JDV Social.
- Lecture du fil des publications publiées visibles par l'utilisateur et création de publications texte.
- Réactions « J'aime » et commentaires sur les publications.
- Consultation des groupes actifs, adhésion aux groupes publics et demande d'accès aux groupes privés.
- Consultation des événements publiés, inscription et annulation d'inscription.
- Lecture des notifications du compte et marquage individuel comme lu.
- Catalogue de 11 applications sociales et ouverture de leurs sites officiels.
- Synchronisation des préférences d'affichage et d'alertes par application avec `public.social_app_preferences`.

La synchronisation nécessite que le compte mobile soit le même utilisateur Supabase que celui utilisé sur le Web. Les opérations restent soumises aux politiques RLS actives dans Supabase; les lectures publiques des profils, réactions et commentaires nécessitent notamment la validation puis l'application de la migration candidate correspondante.

## Limites à vérifier
- Définir l'URL Web réelle et les variables Supabase dans l'environnement de build.
- Confirmer que les paramètres d'inscription et de confirmation e-mail du projet correspondent au parcours souhaité.
- Exécuter l'installation, le contrôle TypeScript, puis les tests sur navigateurs, Android et iOS.
- Les notifications natives, les builds signés et la publication sur les stores ne sont pas inclus à ce stade.


Fonctions ajoutées dans la tranche du 19 octobre 2026 : les profils des commentateurs sont chargés pour attribuer les commentaires, et un membre peut quitter un groupe ou annuler une demande d’adhésion en conservant l’historique d’adhésion (`status = left`). Ces fonctions doivent encore passer la compilation et les tests d’intégration.
