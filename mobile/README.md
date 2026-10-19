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

## Fonctionnalités implémentées
- Inscription par e-mail/mot de passe et connexion Supabase Auth.
- Persistance de session via AsyncStorage.
- Catalogue de 11 applications sociales et ouverture de leurs sites officiels.
- Lecture des préférences de visibilité depuis `public.social_app_preferences`.
- Enregistrement des préférences par utilisateur avec `upsert` sur `user_id,app_key`.

La synchronisation nécessite que le compte mobile soit le même utilisateur Supabase que celui utilisé sur le Web. Les changements ne seront visibles sur le Web que si sa page utilise la même table et les mêmes clés `app_key`.

## Limites à vérifier
- Définir l'URL Web réelle et les variables Supabase dans l'environnement de build.
- Confirmer que les paramètres d'inscription et de confirmation e-mail du projet correspondent au parcours souhaité.
- Exécuter l'installation, le contrôle TypeScript, puis les tests sur navigateurs, Android et iOS.
- Les notifications natives, les builds signés et la publication sur les stores ne sont pas inclus à ce stade.
