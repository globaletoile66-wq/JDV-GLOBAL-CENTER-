# JDV SERVICES — périmètre fonctionnel et état d’implémentation

## Parcours disponibles dans la branche

- Catalogue public des prestations publiées, recherche texte et affichage du prix ou du mode « sur devis ».
- Publication d’une prestation par un utilisateur connecté.
- Demande de devis par un client connecté, sans possibilité de solliciter sa propre prestation.
- Espace connecté /service-marketplace/espace : liste des prestations du prestataire, demandes reçues, réponse, montant du devis et état du dossier, ainsi que suivi des demandes envoyées par le client.
- Le catalogue et l’espace affichent un message explicite si les tables ne sont pas encore disponibles dans Supabase.

## Modèle de données attendu

La migration supabase/migrations/20261019191000_jdv_services_marketplace.sql définit jdv_service_offerings et jdv_service_requests. Les données sont protégées par RLS. Les paiements ne sont pas simulés ni stockés dans ce module : ils devront passer par JDV PAY.

## Limites à lever avant production

- La migration n’a pas été appliquée à Supabase distant.
- Vérifier la dépendance facultative public.business_profiles et la stratégie d’identité du prestataire.
- Tester RLS avec deux comptes distincts (client et prestataire), y compris les tentatives d’accès croisé.
- Le suivi et la réponse aux devis sont implémentés dans l’interface, mais restent à valider sur une base de prévisualisation.
- Les notifications, évaluations, pièces jointes, annulation côté client, géolocalisation et paiement JDV PAY ne sont pas déclarés terminés.
