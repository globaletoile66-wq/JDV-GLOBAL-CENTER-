# JDV SERVICES — vision produit et feuille de route 2030

## Vision
JDV SERVICES est l'infrastructure de découverte, d'achat, de coordination et d'évaluation des prestations au sein de JDV Global Center. Le produit ne se limite pas aux annonces : il doit accompagner un besoin jusqu'à la réalisation, avec une traçabilité claire et des contrôles d'accès solides.

## Principes directeurs
1. Une plateforme commune, avec des espaces adaptés au rôle.
2. Un parcours de prestation fiable avant les fonctionnalités avancées.
3. L'utilisateur garde le contrôle des décisions et des engagements financiers.
4. Les recommandations d'IA sont explicables et ne remplacent pas la vérification des qualifications.
5. Les paiements réels passent par un fournisseur intégré et par JDV PAY lorsque le flux est pris en charge ; aucun paiement simulé.
6. Les données sont protégées par RLS, validation serveur, stockage privé et journalisation des actions sensibles.
7. Le périmètre JDV SERVICES reste séparé de l'ancien CRM.

## Horizon 1 — Socle opérationnel
- Catalogue public, catégories et profils prestataires.
- Publication, modification, pause et archivage des offres.
- Demandes, devis, acceptation, annulation éligible et réalisation.
- Espace client et espace prestataire.
- Transitions métier validées côté base et tests multi-utilisateurs.
- Gestion des erreurs, accessibilité de base et affichage adapté au mobile.

Critère de sortie : un client et un prestataire peuvent mener un parcours complet dans un environnement de test, sans accès croisé non autorisé.

## Horizon 2 — Confiance et coordination
- Notifications liées aux événements métier.
- Messagerie et pièces jointes privées rattachées à une demande.
- Réservations, calendrier et rappels.
- Avis après prestation éligible et procédures de signalement.
- Dossiers de litige avec accès limité au support.
- Vérification graduée des profils et justificatifs.

Critère de sortie : les échanges, décisions et changements sont traçables et accessibles aux seules parties autorisées.

## Horizon 3 — JDV PRO et JDV ENTREPRISES
- Équipes et collaborateurs avec permissions.
- Consultations, appels à devis, lots de travaux et comparateur.
- Contrats récurrents, jalons et livrables.
- Affectation des missions, suivi des fournisseurs et rapports d'activité.

Critère de sortie : une organisation peut gérer plusieurs fournisseurs et plusieurs prestations depuis un espace contrôlé.

## Horizon 4 — Intelligence et développement des compétences
- JDV Assistant pour structurer les demandes et préparer les cahiers des charges.
- Matching explicable basé sur les compétences, la zone, la disponibilité et les exigences obligatoires.
- Passeport de compétences séparant déclarations, documents contrôlés et réalisations confirmées.
- JDV Opportunités pour des alertes pertinentes.
- Intégration éventuelle avec JDV ACADEMY pour proposer des formations.

Critère de sortie : les recommandations sont justifiables, mesurables et contrôlables par les utilisateurs.

## Horizon 5 — Réseau panafricain
- Configuration par pays, langue, devise et règles applicables.
- Expérience mobile légère, brouillons et parcours vocaux facultatifs.
- Relais locaux et partenariats autorisés.
- API partenaires versionnée et sécurisée.
- Analyses agrégées des lacunes de couverture, avec seuils de confidentialité.

Critère de sortie : l'ouverture d'un nouveau marché repose sur une configuration et une validation documentées, et non sur une copie de l'application.

## Architecture cible à confirmer par audit
- Frontend Next.js et composants existants.
- Supabase Auth et PostgreSQL, politiques RLS et fonctions serveur.
- Storage privé pour les documents et médias confidentiels.
- Notifications via une file/outbox ou un mécanisme idempotent.
- Paiements intégrés uniquement via des fournisseurs réels et des événements vérifiés.
- API versionnée pour les intégrations externes.

Cette architecture est une cible. Chaque brique doit être confrontée au code et au schéma existants avant implémentation.

## Indicateurs de réussite
- Taux et délai de réponse aux demandes.
- Proportion de devis acceptés et prestations terminées.
- Annulations, réclamations et temps de résolution.
- Part des profils avec informations ou qualifications réellement vérifiées.
- Rétention des clients et prestataires actifs.
- Couverture des catégories et zones.
- Coût de service et revenus effectivement confirmés.

## Gouvernance de livraison
Chaque lot doit inclure : migration versionnée, vérification des permissions, tests des parcours principaux et négatifs, type-check/build, état du déploiement et critères d'acceptation. Aucun lot n'est considéré comme terminé sur la seule base d'une interface visuelle.
