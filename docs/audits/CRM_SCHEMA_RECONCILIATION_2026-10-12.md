# Rapport de rapprochement CRM — 12 octobre 2026

## Résultat
La base Supabase contient déjà des tables `crm_*`, mais leur modèle est différent de celui proposé par la migration `20261012000000_jdv_crm_native.sql` de la copie Phase 3. Il ne faut pas appliquer cette migration directement en production.

## Écarts vérifiés
- La table existante `crm_prospects` est organisée autour de `business_id`, `assigned_prospecteur_id`, `temperature` et `prospect_status`.
- Le code Phase 3 attend `organization_id`, `assigned_to`, `qualification` et `status`.
- La migration Phase 3 utilise aussi `crm_clients`, `crm_payments`, `crm_payment_schedules`, `crm_commission_rules`, `crm_commissions` et `crm_stock_movements` avec des colonnes/relations différentes des tables existantes.
- La page CRM Phase 3 interroge les organisations et membres, puis lit/écrit les colonnes attendues par ce nouveau modèle. Elle n'est donc pas compatible telle quelle avec le schéma courant.

## Décision
Adapter le code Phase 3 au modèle CRM courant, ou rédiger une migration de transition soigneusement testée. Ne pas utiliser `CREATE TABLE IF NOT EXISTS` comme preuve de compatibilité. Avant déploiement, vérifier les policies RLS, les rôles et les opérations de conversion prospect-client.

## Contrôles sécurité
L'advisor Supabase a détecté quatre tables RLS sans policy (`billing_invoice_counters`, `billing_reminders_sent`, `rate_limits`, `subscription_limits`), quatre fonctions SECURITY DEFINER accessibles à `anon`, 90 à `authenticated`, et la protection contre les mots de passe compromis désactivée. Les corrections doivent être ciblées et validées pour ne pas casser les flux existants.

Aucune écriture de données, modification de schéma de production, modification de privilèges ou mise en production n'a été effectuée.