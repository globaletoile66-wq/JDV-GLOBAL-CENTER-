# JDV Immo — lot d’activation

Ce lot ajoute :
- Recherche immobilière filtrée côté Supabase (type, transaction, pays, ville, prix, chambres, surface, meublé).
- Fiche détaillée d’un bien et demande de contact reliée au bien.
- Rattachement de la demande à l’organisation du bien calculé côté serveur.
- Espace de gestion initial : maintenance, budgets projets, états des lieux et événements de bail.
- Tables métier et politiques RLS dédiées à la maintenance, aux inspections, à l’historique locatif et aux coûts de projets.

Limites explicites :
- Le contact crée une demande dans JDV Immo ; la conversion en prospect JDV CRM doit être exécutée par un agent autorisé via la fonction existante, car celle-ci exige l’accès à l’organisation.
- Les paiements de projets restent en attente et ne peuvent pas être déclarés confirmés depuis l’interface.
- Aucun paiement GDV Pay n’est simulé.
- Ce lot ne modifie pas le schéma ni les écrans de l’ancien CRM.
- Aucun déploiement Netlify n’est déclenché par ce document.
