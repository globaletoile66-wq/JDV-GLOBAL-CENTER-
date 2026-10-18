# Reconciliation des migrations JDV GLOBAL CENTER — 2026-10-18

## État mesuré

- Fichiers SQL présents dans les dossiers de migrations du dépôt : **168**
- Migrations enregistrées dans l'historique Supabase : **188**
- Entrées Supabase sans fichier source correspondant par nom/version : **36**
- Fichiers du dépôt sans entrée d'historique correspondant par nom/version : **16**

## Limites de la comparaison

La comparaison ci-dessous est un rapprochement mécanique par nom/version. Elle ne prouve pas qu'un changement SQL est absent du schéma vivant : une migration peut avoir été renommée, remplacée, appliquée manuellement ou regroupée dans un autre fichier. Inversement, la présence d'un fichier non enregistré ne prouve pas qu'il faut l'appliquer : le schéma peut déjà contenir les objets, ou une migration équivalente peut avoir été appliquée sous un autre nom.

**Règle de sécurité : ne pas rejouer automatiquement ces fichiers et ne pas marquer des migrations comme appliquées uniquement pour faire correspondre les compteurs.** Pour chaque entrée, comparer le SQL source, les objets vivants, les privilèges, les policies et les dépendances. Ne jamais réexécuter une migration destructive sans test et plan de restauration.

## Entrées Supabase sans source exacte identifiée

- `20260924112844 — harden_ddl_helpers_and_public_function_execution`
- `20260924112852 — harden_function_execute_inheritance`
- `20260924113315 — harden_security_definer_search_paths`
- `20260927123832 — activate_immo_module`
- `20260928215325 — activate_travel_module`
- `20261009101846 — drop_duplicate_agriculture_tables`
- `20261009102224 — remove_duplicate_organization_joie_de_vivre`
- `20261009171728 — jdv_global_crm_additive_schema_v1`
- `20261009171840 — jdv_global_crm_activate_core_v1`
- `20261009172020 — jdv_global_crm_concepteur_workspace_org_v1`
- `20261009172102 — jdv_global_crm_core_rpc_v1`
- `20261009172225 — jdv_global_crm_portfolio_rls_v1`
- `20261009172641 — jdv_global_crm_activation_v1`
- `20261009172703 — jdv_global_crm_prospecteur_write_policies_v1`
- `20261009172758 — jdv_global_crm_entity_codes_v1`
- `20261010045957 — jdv_pay_harden_client_writes_v1`
- `20261010050028 — jdv_pay_guard_no_superadmin_bypass_v1`
- `20261010050551 — jdv_tontine_close_direct_writes_v1`
- `20261010050647 — jdv_pay_close_unused_client_writes_v1`
- `20261010052435 — jdv_pay_engine_v1`
- `20261010162530 — jdv_crm_subwarehouses_core`
- `20261010162720 — jdv_crm_warehouse_assignment_and_return_trace`
- `20261010162751 — fix_return_traceability_view`
- `20261010162955 — scope_subwarehouse_stock_view`
- `20261011113545 — jdv_billing_authz_null_fix_v1`
- `20261013231641 — jdv_kyc_storage_quota_fix_v1`
- `20261014094305 — jdv_tontine_engine_v2_pool`
- `20261014194909 — jdv_tontine_fix_pgcrypto_search_path_v1`
- `20261015015817 — jdv_tontine_set_status_v1`
- `20261015070105 — jdv_fix_wallet_reuse_guard_v1`
- `20261018050708 — jdv_security_hardening_v2`
- `20261018061110 — crm_prospecteur_automation_alerts_20261018`
- `20261018061236 — crm_prospect_followup_alert_state_fix_20261018`
- `20261018061328 — crm_prospecteur_stock_alerts_20261018`
- `20261018062526 — crm_my_automation_alerts_rpc_20261018`
- `20261018063212 — crm_outbound_notification_delivery_20261018`

## Fichiers de migration sans entrée d'historique exacte identifiée

- `20260918400000_jdv_transit_logistics`
- `20260918500000_jdv_insurance`
- `20260918600000_jdv_agriculture`
- `20260918700000_jdv_energy`
- `20260918800000_jdv_academy`
- `20260918900000_jdv_pub`
- `20260919000000_jdv_media`
- `20261018060000_jdv_academy_published_catalog_rls`
- `20261018061000_jdv_academy_enrolled_content_rls`
- `20261018070000_crm_prospecteur_automation_alerts`
- `20261018072000_marketplace_authenticated_catalog_read`
- `20261018073000_crm_prospect_followup_alert_state_fix`
- `20261018080000_crm_prospecteur_stock_alerts`
- `20261018080000_tontine_concepteur_insert_policy`
- `20261018083000_crm_my_automation_alerts_rpc`
- `20261018090000_crm_outbound_notification_delivery`

## Ordre de réconciliation recommandé

1. **Retrouver les sources historiques exactes** des migrations déjà appliquées mais absentes du dépôt actif, en consultant les branches/commits antérieurs et les exports historiques disponibles.
2. **Comparer les fichiers non enregistrés au schéma vivant** avant de décider s'ils sont obsolètes, déjà couverts par une migration équivalente, ou réellement à appliquer.
3. Produire une table de correspondance explicite `version appliquée ↔ fichier source ↔ objets SQL vérifiés`.
4. Pour les migrations impossibles à récupérer, créer un snapshot/baseline documenté du schéma courant plutôt que d'inventer le SQL historique.
5. Rejouer ensuite le build de base, puis les migrations sur un environnement de test avant tout déploiement de production.

## Périmètre

Cette note est un inventaire de traçabilité. Elle ne modifie ni le schéma ni les données Supabase. Les migrations portant des noms liés au CRM doivent être classées et comparées sans intégrer ni modifier l'ancien CRM.
