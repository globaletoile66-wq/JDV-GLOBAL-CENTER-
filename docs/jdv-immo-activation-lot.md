# JDV Immo — activation progressive

## Inclus dans ce lot
- Recherche réelle depuis Supabase avec filtres type, transaction, pays, ville, prix, chambres, surface et meublé.
- Fiche détaillée de bien, demande de contact et demande de visite.
- Liaison serveur entre demande de contact, bien et organisation responsable.
- Espace de gestion avec signalements de maintenance, lignes budgétaires, états des lieux et événements de bail.
- Tables dédiées à la maintenance, aux devis, interventions, factures, états des lieux, événements de bail et coûts de projets.
- RLS sur les nouvelles tables et permissions d'écriture limitées pour les opérations de maintenance.
- Migrations synchronisées avec les versions enregistrées dans Supabase.

## Limites à traiter dans les phases suivantes
- La conversion en prospect JDV CRM doit être déclenchée par un agent autorisé ; la fonction existante exige un accès à l'organisation. Aucune table ou page de l'ancien CRM n'a été modifiée.
- Les paiements de projets restent en attente ; aucune confirmation de paiement n'est accessible depuis l'interface.
- GDV Pay n'est pas simulé : il reste à valider les interfaces et à raccorder les confirmations officielles.
- La signature électronique, les reçus automatiques, les rappels de loyer et les écrans complets d'affectation/visites/offres/réservations restent à compléter.
- Aucun déploiement Netlify n'est lancé par ce document.
