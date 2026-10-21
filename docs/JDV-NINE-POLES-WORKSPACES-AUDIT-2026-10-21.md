# Audit du regroupement en neuf pôles — 21 octobre 2026

## Objectif
La page d’accueil présente neuf portes d’entrée. Chaque porte ouvre un espace de travail listant ses applications, au lieu d’afficher tout le catalogue à plat.

## Règles conservées
- Les routes existantes des applications ne sont pas renommées.
- Les neuf branches historiques et leurs logos restent disponibles sur `/branches`.
- JDV Admin et les modules protégés gardent leurs contrôles d’accès existants ; le regroupement visuel ne remplace pas l’autorisation côté application.
- Aucune modification du CRM historique, aucune migration Supabase et aucun déploiement de production.

## Répartition
1. Finance & Protection — pay, tontine, insurance, accounting
2. Immobilier & Patrimoine — immo
3. Entreprises & Services — business, marketplace, crm, services, legal, admin, procurement, inventory, ai, hr
4. Mobilité & Logistique — travel, transport, transit
5. Santé & Bien-être — health
6. Social & Communauté — social, community, events
7. Médias & Divertissement — media, pub, entertainment
8. Formation & Carrière — academy, jobs
9. Agriculture & Énergie — agriculture, energy

Le registre contient actuellement 29 modules distincts ; les neuf groupes couvrent ces 29 identifiants une seule fois, sans doublon ni module oublié. Le chiffre affiché est calculé depuis le registre pour éviter d’annoncer un total qui ne correspond pas au code.
