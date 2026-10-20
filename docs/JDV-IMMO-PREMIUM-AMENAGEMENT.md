# JDV Immo Premium — conception et aménagement du terrain

## Changements dans cette étape
- Le studio de conception existant permet de saisir largeur/profondeur de parcelle, ajouter et positionner des pièces, définir dimensions et ouvertures, choisir le nombre de niveaux, visualiser un schéma de façade et une maquette 3D exploratoire, sauvegarder un brief dans `immo_construction_briefs` et exporter le brief JSON.
- Nouvelle route `/immo/conception/amenagement` : largeur/profondeur librement modifiables, surface calculée, emprise de la maison, styles Moderne, Traditionnelle, Contemporaine, Tropicale et Minimaliste.
- Options d’aménagement : gazon, jardin, piscine, parking avec nombre de places et pictogrammes de voitures, terrasse, cuisine extérieure, clôture et allée.
- Scène de parcelle schématique mise à jour selon les options et export d’un cahier d’aménagement JSON.
- Un lien du studio Premium conduit vers la nouvelle page d’aménagement.

## Estimations et limites
Les prix d’aménagement intégrés sont des valeurs de démonstration et sont signalés comme telles; ils ne sont pas des données de marché vérifiées. Il faut les remplacer par un référentiel sourcé par pays/ville, date, matériaux, main-d’œuvre, taxes et fournisseur avant de commercialiser un devis.
Les vues de parcelle, de façade et de 3D sont des concepts visuels. Les reculs, servitudes, contraintes de sol, règles d’urbanisme et normes structurelles ne sont pas vérifiés automatiquement. Une validation par architecte/ingénieur habilité reste requise.

## Abonnement Premium et sécurité
- La route `/immo/conception` vérifie côté serveur l’utilisateur authentifié, les super-administrateurs actifs et l’abonnement via `billing_my_subscriptions` pour le module `jdv_immo`.
- Aucun privilège premium n’a été ajouté à des utilisateurs et aucune table/politique Supabase n’a été modifiée dans cette étape.
- Avant commercialisation, vérifier le catalogue d’abonnement, les prix, les périodes d’essai, la gestion de renouvellement/annulation et les contrôles RLS de `immo_construction_briefs`.

## Tests restant à exécuter
- `npm run type-check`
- `npm run build`
- Parcours connecté avec compte Premium actif, sans abonnement, et super-admin
- Export du brief et contrôle des calculs de surface/coût
- Vérification des policies RLS et du circuit de soumission au concepteur
- Revue responsive, clavier/accessibilité, et contrôles d’intersection entre pièces
- Ne pas déployer en production avant le passage de ces contrôles.
