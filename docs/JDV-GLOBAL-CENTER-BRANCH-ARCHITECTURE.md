# JDV Global Center — analyse transversale et architecture cible

Version : 1.0 — 20 octobre 2026  
Statut : proposition d'architecture à valider par confrontation au cahier des charges Rocket et aux écrans existants.

## 1. Règle directrice

JDV Global Center est la plateforme d'entrée et de gouvernance. Une branche ne doit devenir une application indépendante que si elle possède un métier, des parcours, des données et des règles qui lui sont propres. Une fonction partagée devient un service transversal ou un module intégré à un pôle, pas une application supplémentaire.

Cette analyse est fonctionnelle. Elle ne prétend pas que les routes, API, bases de données ou intégrations existent déjà. Les décisions doivent être confirmées par l'audit du code, du cahier des charges et de l'organigramme Rocket.

## 2. Architecture hiérarchique proposée

### Niveau 0 — JDV Global Center
Portail unique : connexion, profil, recherche globale, notifications, aide, préférences, catalogue de services et navigation entre pôles.

### Niveau 1 — Fondations partagées (services transversaux, pas des applications métier concurrentes)
- JDV Core : configuration centrale, catalogue des modules, conventions d'interface, observabilité.
- Identité & sécurité : authentification, rôles, consentements, sessions, contrôle d'accès.
- JDV IA : recherche et assistance transversales, recommandations et automatisation sous permissions explicites.
- JDV Pay : capacité commune de paiement, reçus, remboursements et journalisation lorsqu'un service financier est activé; son interface peut être visible, mais le paiement ne doit pas être réimplémenté dans chaque branche.
- Abonnements/Premium : droits et formules d'accès communs.
- Notifications, documents, recherche, audit et support : capacités partagées à appeler depuis les pôles.
- JDV Admin : console de gouvernance et d'administration, pas un métier client en concurrence avec les autres branches.

### Niveau 2 — Pôles métier

#### A. Commerce, prestations et relation
- Marketplace : catalogue, découverte et mise en relation.
- JDV Services : offres de services, demandes, devis, exécution et évaluation.
- Relation clientèle : profils relationnels, conversations, suivi, tâches et historique. Cette capacité peut servir aux autres pôles.
- Cashback/promotions : fidélité et campagnes liées à des transactions ou à des partenaires; à intégrer au commerce plutôt que créer une boutique distincte.
- Services Web : prestations numériques et catalogue de solutions digitales; à placer sous JDV Services si les mêmes parcours offre → demande → devis → livraison sont utilisés. Ne garder une sous-branche autonome que si elle a un métier et des règles distincts.

#### B. Mobilité, voyage et logistique
- JDV Voyage : destination, itinéraire, réservation et dossier voyageur.
- JDV Transport : trajets, véhicules, conducteurs, expéditions ou mobilité selon le cahier des charges.
- JDV Transit : opérations douanières, documents de transit, suivi d'expédition et formalités.
Ces trois services peuvent partager recherche, carte, réservation, suivi, paiement et documents. Ils ne doivent pas être fusionnés complètement si les acteurs, obligations et processus métier sont différents. Transit peut être un module logistique professionnel du pôle Mobilité & Logistique.

#### C. Habitat et patrimoine
- JDV Immo : annonces, biens, recherche, visites, demandes et gestion locative.
- Services partagés : carte, géolocalisation, documents, prise de rendez-vous, paiement et relation clientèle.
L'immobilier conserve son domaine métier; les outils communs ne justifient pas une deuxième application de carte ou de réservation.

#### D. Finance communautaire et protection
- JDV Tontine : groupes d'épargne, cycles, contributions, échéances, règles de rotation et transparence.
- JDV Assurance : produits, contrats, garanties, sinistres et renouvellements.
- JDV Pay reste le service de paiement partagé, non un doublon de comptabilité de tontine ou de gestion d'assurance.
La tontine et l'assurance ont toutes deux des montants, échéances et membres/clients, mais les règles de risque, de conformité et les processus sont suffisamment différents pour conserver deux domaines distincts.

#### E. Santé et éducation
- JDV Santé : patients, praticiens, pharmacies, centres de santé, rendez-vous et géolocalisation. Données et accès hautement sensibles.
- JDV Academy : cours, parcours d'apprentissage, formateurs, évaluations et certificats.
Ces branches partagent identité, notifications, rendez-vous ou progression selon le cas, mais pas leurs dossiers métier. Les données de santé ne doivent pas être exposées à l'IA ou à d'autres pôles sans autorisation explicite et base légitime.

#### F. Communauté, médias et divertissement
- JDV Social / Social Hub : profils publics, communauté, groupes, publications et interactions.
- JDV Media : production, publication et distribution éditoriale.
- JDV Divertissement : contenus culturels, créateurs, événements et expériences.
- JDV Pub : campagnes, ciblage autorisé, inventaire publicitaire et mesure.
Ces éléments peuvent partager un graphe de contenus, profils de créateurs, médias et modération. Social est la couche communautaire; Media est la publication; Divertissement est l'expérience de découverte; Pub est la monétisation. Ne créer des applications distinctes que si leurs parcours et leurs permissions sont réellement distincts.

#### G. Ressources et production
- JDV Agriculture : producteurs, exploitation, intrants, récoltes, marchés et chaîne de valeur.
- JDV Énergie : accès à l'énergie, fournisseurs, installations, consommation ou projets selon le périmètre validé.
Ces métiers ne se ressemblent pas assez pour fusionner. Ils peuvent néanmoins utiliser un annuaire professionnel, une place de marché, des paiements et une géolocalisation partagés.

#### H. Légal & conformité
- JDV Légal : consultations, professionnels, dossiers, documents et échéances juridiques.
- La conformité, le consentement, la traçabilité et la gestion des autorisations sont aussi des capacités transversales.
Le domaine juridique conserve ses parcours et sa confidentialité. Les contrôles communs ne doivent pas dupliquer les dossiers juridiques dans Admin.

## 3. Matrice de similarité fonctionnelle

| Groupes comparés | Similarité estimée | Décision cible |
|---|---:|---|
| Marketplace ↔ JDV Services ↔ Services Web | Élevée | Un pôle Commerce & Services; Services Web devient une catégorie/module si le cycle commercial est le même |
| Voyage ↔ Transport ↔ Transit | Élevée sur les outils, moyenne sur le métier | Un pôle Mobilité & Logistique, avec modules métier séparés |
| Social ↔ Media ↔ Divertissement ↔ Pub | Élevée sur les contenus, moyenne sur les objectifs | Un pôle Contenus & Communauté, quatre capacités spécialisées |
| Pay ↔ Tontine ↔ Assurance | Moyenne sur les opérations financières, faible sur les règles métier | Paiement partagé; Tontine et Assurance restent des domaines séparés |
| Immo ↔ Marketplace | Moyenne sur annonces et mise en relation | Immo reste un domaine; réutilise catalogue, recherche, carte et contact |
| Academy ↔ Santé | Faible sur le métier | Deux pôles distincts; réutilisation de l'identité et des notifications seulement |
| Agriculture ↔ Énergie | Faible à moyenne | Deux domaines séparés; services communs d'annuaire, marché et géolocalisation |
| Légal ↔ Admin | Faible sur les parcours métier | Légal est un domaine; Admin gouverne les accès et opérations sans absorber ses dossiers |
| CRM/Relation client ↔ tous les pôles | Élevée comme capacité transverse | Modèle de relation partagé à construire proprement; ne pas intégrer ni modifier l'ancien CRM |

Les niveaux sont des estimations qualitatives de conception, pas des résultats d'une mesure automatisée ni une preuve que les implémentations actuelles se chevauchent.

## 4. Règles anti-duplication

1. Une seule source de vérité par concept partagé : identité, profil, documents, notifications, paiements, catalogue, préférences et journal d'audit.
2. Une seule implémentation commune pour les capacités génériques; chaque pôle les consomme via des interfaces contractuelles.
3. Une branche ne reste autonome que si elle possède au moins un parcours métier spécifique, des règles métier propres et un propriétaire fonctionnel identifiable.
4. Un même écran ne doit pas être recopié dans plusieurs branches : il devient un composant ou service partagé, configurable par contexte.
5. Les données sensibles (santé, juridique, finance) ont des autorisations, journaux et règles de conservation propres.
6. Une route doit avoir un propriétaire, une entrée de navigation et une raison d'exister. Toute route sans source est marquée orpheline et corrigée.
7. Les données et les workflows de l'ancien CRM restent hors de portée de ce chantier. La capacité relation clientèle future sera conçue comme un nouveau module JDV, sans migration ni modification du CRM historique.
8. Aucun changement de schéma Supabase distant ou de production sans validation explicite et plan de migration.

## 5. Mode analytique à appliquer à chaque branche

Noter chaque paire de branches de 0 à 5 sur :
- mission métier (25 %),
- utilisateurs et rôles (15 %),
- objets/données (20 %),
- workflow et états (20 %),
- écrans et actions (10 %),
- dépendances et règles de conformité (10 %).

Interprétation indicative :
- 4,0–5,0 : fusionner ou placer une branche comme module/sous-branche.
- 3,0–3,9 : conserver des modules distincts sous le même pôle et mutualiser les capacités communes.
- 0–2,9 : conserver les domaines séparés, partager uniquement les fondations.

Un score élevé ne suffit jamais à fusionner deux domaines réglementés ou à risques différents. Une revue humaine du cahier des charges reste obligatoire.

## 6. Ordre d'exécution recommandé

1. Inventorier toutes les routes, pages, tables, API et composants et attribuer un propriétaire.
2. Comparer l'inventaire au cahier des charges et à l'organigramme Rocket.
3. Produire une matrice de recouvrement réelle (pas seulement conceptuelle) et identifier pages orphelines/doublons.
4. Valider les pôles et les noms avec le responsable fonctionnel.
5. Refactoriser les fondations partagées avant de déplacer les routes métier.
6. Ajouter des redirections et tests de navigation, puis valider les permissions.
7. Vérifier build, tests, aperçu de déploiement et migrations avant toute fusion.

## 7. Décisions non prises automatiquement

- La fusion physique de dépôts ou de tables.
- La suppression de routes ou de données.
- La migration ou la modification de l'ancien CRM.
- L'application de migrations Supabase à distance.
- Les paiements réels, l'accès aux données sensibles et les permissions d'administration.

Ces décisions exigent l'audit technique et la validation fonctionnelle.
