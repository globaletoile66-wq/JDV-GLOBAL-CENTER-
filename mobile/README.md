# JDV Social — application multiplateforme

Ce dossier est une application distincte de la version Web Next.js située à la racine du dépôt.

## Cibles
- Android : application native Expo.
- iOS : application native Expo.
- Web : interface React Native Web, en complément de la section JDV Social déjà présente dans Next.js.

## Démarrage
Le projet utilise Expo SDK 58. Pour préparer l'environnement local, installer Node.js compatible avec Expo, puis exécuter depuis ce dossier :

```bash
npm install
npx expo start
```

Pour les builds de distribution Android/iOS, utiliser EAS Build après configuration du compte Expo, des identifiants d'application, des variables Supabase et des certificats nécessaires. Une build iOS de production nécessite la configuration Apple correspondante.

## Configuration Supabase
Copier `.env.example` vers `.env`, puis renseigner :
- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`

N'utiliser jamais une clé `service_role` ou une clé secrète dans l'application cliente. La sécurité des données doit être appliquée par les politiques RLS de Supabase.

## Limite actuelle
Cette première base est un squelette d'interface multiplateforme. La connexion Supabase, les écrans métier, les notifications natives, les tests et la publication sur les stores doivent être implémentés et validés avant de parler de version prête à distribuer.
