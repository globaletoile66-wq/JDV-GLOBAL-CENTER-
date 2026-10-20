# JDV SERVICES — périmètre fonctionnel et état d’implémentation

## Parcours développés dans la branche

- Catalogue public des prestations publiées, recherche texte et affichage du prix ou du mode « sur devis ».
- Publication d’une prestation par un utilisateur connecté.
- Modification du titre, de la catégorie et de la description d’une offre par son propriétaire.
- Mise en pause, republication et archivage d’une offre par son propriétaire.
- Demande de devis par un client connecté, sans possibilité de solliciter sa propre prestation.
- Espace connecté `/service-marketplace/espace` : liste des prestations du prestataire, demandes reçues, réponse, montant du devis et suivi des demandes envoyées par le client.
- Décision du client : acceptation d’un devis ou annulation d’une demande éligible.
- Migration complémentaire avec transitions de statut contrôlées côté base et protection de l’identité et du message d’origine.
- Le catalogue et l’espace affichent un message explicite si les tables ne sont pas encore disponibles dans Supabase.

## Modèle de données attendu

La migration `supabase/migrations/20261019191000_jdv_services_marketplace.sql` définit `jdv_service_offerings` et `jdv_service_requests`. La migration complémentaire `supabase/migrations/20261020100000_jdv_services_workflow_hardening.sql` encadre les transitions des demandes. Les données sont protégées par RLS. Les paiements ne sont pas simulés ni stockés dans ce module : ils devront passer par JDV PAY.

## Limites à lever avant fusion et production

- Les migrations JDV SERVICES ne sont pas appliquées à Supabase distant.
- Vérifier la dépendance à `public.business_profiles` et la stratégie d’identité du prestataire.
- Exécuter le type-check et le build sur le commit le plus récent.
- Tester RLS avec au moins deux comptes distincts (client et prestataire), y compris les tentatives d’accès croisé et les transitions interdites.
- Valider le comportement des offres archivées/pausées et des demandes qui leur sont déjà rattachées.
- Vérifier les statuts de tous les déploiements Netlify associés à la PR : un projet Netlify lié a signalé un échec, même si plusieurs autres prévisualisations ont réussi.
- Les notifications, évaluations, pièces jointes, géolocalisation et intégration réelle JDV PAY restent hors du périmètre terminé.
- Aucun déploiement de production ni aucune fusion automatique n’a été effectué. L’ancien CRM n’a pas été modifié.
