# JDV Global Center — analyse transversale des branches
Version 1.0 — 20 octobre 2026. Statut : architecture cible à confirmer avec le cahier des charges Rocket et l'inventaire du dépôt.

## Principe
JDV Global Center est le portail unique. Une branche reste une application métier autonome uniquement si ses parcours, ses données et ses règles sont réellement spécifiques. Les capacités génériques sont fournies une seule fois comme services transversaux. Cette analyse est conceptuelle : elle ne prétend pas que les routes, tables ou intégrations sont déjà implémentées.

## Niveau 0 — Entrée unique
JDV Global Center : navigation, recherche globale, notifications, aide, profil et préférences.

## Fondations transversales — ne pas dupliquer en applications métier
- JDV Core : catalogue des modules, configuration et conventions communes.
- Identité & sécurité : authentification, rôles, consentements et contrôle d'accès.
- JDV IA : assistance et recherche transversales sous permissions.
- JDV Pay : service de paiement partagé, reçus et journalisation; ne pas réimplémenter dans chaque pôle.
- Premium/abonnements : droits d'accès communs.
- JDV Admin : gouvernance, audit et supervision; pas une application métier qui absorbe les autres.
- Notifications, documents, recherche, carte, support et relation clientèle : capacités communes à consommer.

## Pôles métier proposés

### 1. Commerce & services
- Marketplace : catalogue et découverte.
- JDV Services : offres, demandes, devis, exécution et évaluation.
- Services Web : sous-module de JDV Services si le parcours commercial est le même.
- Relation clientèle : suivi, conversations, tâches et historique réutilisables par les pôles.
- Cashback/promotions : fidélité et campagnes liées au commerce.
Décision : regrouper les parcours de mise en relation; ne garder une sous-branche autonome que si elle a ses propres règles et son propre workflow.

### 2. Mobilité & logistique
- JDV Voyage : destinations, itinéraires, réservations et dossiers voyageurs.
- JDV Transport : trajets, véhicules, conducteurs et mobilité.
- JDV Transit : formalités, documents douaniers et suivi d'expédition.
Décision : un pôle commun pour carte, recherche, réservation, paiement et documents; workflows spécialisés conservés.

### 3. Habitat & patrimoine
- JDV Immo : biens, annonces, recherches, visites et demandes.
Décision : garder le domaine immobilier, mutualiser recherche, carte, rendez-vous, documents et contact avec les autres pôles.

### 4. Finance communautaire & protection
- JDV Tontine : groupes, cycles, contributions, échéances et règles de rotation.
- JDV Assurance : produits, contrats, garanties, sinistres et renouvellements.
- JDV Pay : service transversal appelé par ces parcours.
Décision : Tontine et Assurance restent distinctes, car leurs règles de risque, conformité et processus diffèrent malgré les montants et échéances communs.

### 5. Santé & apprentissage
- JDV Santé : patients, médecins, pharmacies, centres, rendez-vous et géolocalisation.
- JDV Academy : cours, formateurs, évaluations et certificats.
Décision : deux domaines distincts; partager uniquement les fondations. Cloisonner strictement les données de santé.

### 6. Contenus & communauté
- JDV Social/Social Hub : profils publics, groupes, publications et interactions.
- JDV Media : production et distribution éditoriale.
- JDV Divertissement : découverte culturelle, créateurs et événements.
- JDV Pub : campagnes publicitaires, inventaire et mesure.
Décision : partager profils de créateurs, médias, modération et gestion de contenu; préserver les missions distinctes.

### 7. Ressources & production
- JDV Agriculture : producteurs, intrants, récoltes et chaîne de valeur.
- JDV Énergie : fournisseurs, installations, consommation et projets.
Décision : domaines séparés, avec annuaire professionnel, marché, paiements et géolocalisation communs.

### 8. Légal & conformité
- JDV Légal : consultations, professionnels, dossiers, documents et échéances.
- La traçabilité, le consentement et le contrôle d'accès sont aussi des capacités transversales.
Décision : préserver la confidentialité juridique; Admin supervise les accès sans absorber les dossiers.

## Matrice initiale de similarité (estimation qualitative, pas une mesure du code)

| Comparaison | Score / 5 | Décision |
|---|---:|---|
| Marketplace ↔ JDV Services ↔ Services Web | 4,5 | Pôle commun; Services Web devient module si workflow identique |
| Voyage ↔ Transport ↔ Transit | 4,2 | Pôle commun, modules métier spécialisés |
| Social ↔ Media ↔ Divertissement ↔ Pub | 4,0 | Pôle contenu/communauté, missions séparées |
| Immo ↔ Marketplace | 3,4 | Immo distinct, mutualiser catalogue, carte et contact |
| Pay ↔ Tontine ↔ Assurance | 3,2 | Paiement partagé, règles métier distinctes |
| Academy ↔ Santé | 1,8 | Domaines séparés |
| Légal ↔ Admin | 1,6 | Dossiers juridiques distincts de la gouvernance |

Ces scores sont des hypothèses de conception. La prochaine étape est de les recalculer à partir des routes, tables, API, composants et processus réellement présents.

## Méthode de notation
Noter chaque paire de 0 à 5 : mission (25 %), utilisateurs/rôles (15 %), objets/données (20 %), workflows/états (20 %), écrans/actions (10 %), dépendances/conformité (10 %).
- 4,0–5,0 : fusion fonctionnelle ou sous-branche.
- 3,0–3,9 : même pôle, modules séparés et services mutualisés.
- 0–2,9 : domaines distincts, fondations seulement partagées.
Un score élevé ne suffit jamais à fusionner des domaines réglementés ou sensibles.

## Règles anti-duplication
1. Une source de vérité pour identité, documents, notifications, paiements, recherche, préférences et audit.
2. Un composant ou service partagé plutôt que copier le même écran dans plusieurs branches.
3. Chaque route a un propriétaire, un point d'entrée et une raison d'exister; les routes orphelines sont corrigées.
4. Les données santé, juridiques et financières gardent leurs contrôles d'accès et journaux spécifiques.
5. L'ancien CRM reste intact. La capacité relation clientèle future sera conçue comme un nouveau module JDV, sans migration ni modification du CRM historique.
6. Aucun changement Supabase distant, suppression de route ou fusion en production sur la seule base d'une similarité conceptuelle.

## Ordre d'exécution
1. Inventorier routes, pages, tables, API, composants et dépendances.
2. Comparer cet inventaire au cahier des charges et à l'organigramme Rocket.
3. Identifier les doublons réels, pages orphelines et responsabilités de chaque module.
4. Valider les pôles, puis refactoriser les fondations partagées.
5. Ajouter redirections/tests de navigation et vérifier permissions.
6. Contrôler build, tests, aperçu Netlify et migrations avant toute fusion.
