# Audit initial — JDV PUB
Date: 19 octobre 2026
Branche auditée: `work/branches-consolidation-2026-10-19`

## Conclusion
JDV PUB fait bien partie du cahier des charges recensé et ne doit pas être laissé de côté. Le module n'est pas à créer de zéro : la route `/pub` et plusieurs sous-modules existent déjà, et le schéma Supabase contient les tables métier dédiées. Il faut terminer l'audit fonctionnel et la validation avant de le déclarer validé.

## Fonctionnalités présentes dans le tableau de bord `src/app/pub/page.tsx`
- Profil annonceur lié à l'utilisateur connecté, avec statut de vérification.
- Liste des campagnes propres à l'annonceur, budgets et états.
- Emplacements publicitaires actifs, devis/règles de tarification et devises actives.
- Accès à huit espaces : Studio, Network, Audience, Business, Analytics, Partners, Control Center et Pricing.
- Recherche dans les campagnes et actualisation des données.

## Tables publicitaires déjà présentes sur Supabase
- `pub_advertisers`
- `pub_campaigns`
- `pub_campaign_placements`
- `pub_creatives`
- `pub_impressions`
- `pub_partners`
- `pub_placements`
- `pub_pricing_rules`

Les tables `currencies` sont également utilisées par l'interface. Il faut réutiliser ces objets existants : ne pas créer de schéma publicitaire concurrent.

## Contrôles obligatoires avant validation
1. Inspecter les huit sous-routes et vérifier que leurs liens aboutissent à de vrais écrans fonctionnels.
2. Vérifier les policies RLS des annonceurs, campagnes, créations, partenaires, impressions et tarification; tester en utilisateur anonyme, annonceur non vérifié, annonceur actif et administrateur.
3. Confirmer qu'un annonceur ne peut lire ni modifier les campagnes ou créations d'un autre annonceur.
4. Vérifier la validation des URL de destination, des formats et des fichiers médias; ne jamais exposer de secrets ou de données personnelles dans les statistiques.
5. Vérifier que les statistiques sont calculées à partir des événements enregistrés, et distinguer clairement les impressions/clics réels des données de démonstration.
6. Vérifier la modération avant diffusion et interdire toute diffusion automatique d'une campagne non approuvée.
7. Vérifier les règles de facturation sans créer un portefeuille ou un registre financier parallèle à JDV PAY.
8. Exécuter type-check, build et tests, puis mettre à jour le statut dans le registre des branches.

## Statut
**Présent, à auditer et valider.** La lecture du tableau de bord et la présence des tables ont été confirmées; les tests complets des sous-routes, des permissions, des campagnes et de la compilation ne sont pas encore confirmés.
