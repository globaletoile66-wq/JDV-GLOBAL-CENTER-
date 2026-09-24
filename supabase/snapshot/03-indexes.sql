-- LIVE SUPABASE INDEX DEFINITIONS

CREATE INDEX idx_academy_courses_program ON public.academy_courses USING btree (program_id);

CREATE UNIQUE INDEX academy_enrollments_course_id_student_user_id_key ON public.academy_enrollments USING btree (course_id, student_user_id);

CREATE INDEX idx_academy_enrollments_student ON public.academy_enrollments USING btree (student_user_id);

CREATE UNIQUE INDEX academy_lessons_course_id_lesson_order_key ON public.academy_lessons USING btree (course_id, lesson_order);

CREATE INDEX idx_academy_lessons_course ON public.academy_lessons USING btree (course_id, lesson_order);

CREATE UNIQUE INDEX academy_results_assessment_id_student_user_id_key ON public.academy_results USING btree (assessment_id, student_user_id);

CREATE INDEX idx_agri_crops_farm ON public.agri_crops USING btree (farm_id);

CREATE INDEX idx_agri_orders_buyer ON public.agri_orders USING btree (buyer_user_id);

CREATE INDEX idx_agri_production_crop_date ON public.agri_production_records USING btree (crop_id, record_date);

CREATE INDEX idx_agri_products_farm ON public.agri_products USING btree (farm_id);

CREATE INDEX idx_ai_access_log_user_created ON public.ai_access_log USING btree (user_id, created_at DESC);

CREATE INDEX idx_ai_access_log_org_created ON public.ai_access_log USING btree (organization_id, created_at DESC);

CREATE INDEX idx_ai_access_log_user_action_created ON public.ai_access_log USING btree (user_id, action_type, created_at DESC);

CREATE INDEX idx_ai_access_log_org_action_created ON public.ai_access_log USING btree (organization_id, action_type, created_at DESC);

CREATE INDEX idx_ai_conversations_user_updated ON public.ai_conversations USING btree (user_id, updated_at DESC);

CREATE INDEX idx_ai_messages_conversation_created ON public.ai_messages USING btree (conversation_id, created_at);

CREATE UNIQUE INDEX ai_model_catalog_provider_model_key ON public.ai_model_catalog USING btree (provider, model);

CREATE INDEX idx_ai_org_policies_enabled ON public.ai_org_policies USING btree (is_enabled);

CREATE UNIQUE INDEX ai_provider_configs_organization_id_provider_key ON public.ai_provider_configs USING btree (organization_id, provider);

CREATE INDEX idx_ai_usage_user_created ON public.ai_usage USING btree (user_id, created_at DESC);

CREATE INDEX idx_ai_usage_org_created ON public.ai_usage USING btree (organization_id, created_at DESC);

CREATE INDEX idx_ai_usage_org_model_created ON public.ai_usage USING btree (organization_id, model, created_at DESC);

CREATE INDEX idx_audit_logs_user ON public.audit_logs USING btree (user_id);

CREATE INDEX idx_audit_logs_org ON public.audit_logs USING btree (organization_id);

CREATE INDEX idx_audit_logs_created ON public.audit_logs USING btree (created_at DESC);

CREATE UNIQUE INDEX bill_payments_reference_key ON public.bill_payments USING btree (reference);

CREATE UNIQUE INDEX bill_payments_idempotency_key_key ON public.bill_payments USING btree (idempotency_key);

CREATE INDEX idx_bill_payments_user_id ON public.bill_payments USING btree (user_id);

CREATE INDEX idx_bill_payments_status ON public.bill_payments USING btree (payment_status);

CREATE UNIQUE INDEX billers_code_key ON public.billers USING btree (code);

CREATE INDEX idx_business_appointments_business ON public.business_appointments USING btree (business_id);

CREATE UNIQUE INDEX business_categories_slug_key ON public.business_categories USING btree (slug);

CREATE INDEX idx_business_clients_business ON public.business_clients USING btree (business_id);

CREATE INDEX idx_business_expenses_business ON public.business_expenses USING btree (business_id);

CREATE UNIQUE INDEX business_invoices_business_id_invoice_number_key ON public.business_invoices USING btree (business_id, invoice_number);

CREATE INDEX idx_business_invoices_business ON public.business_invoices USING btree (business_id);

CREATE INDEX idx_business_invoices_status ON public.business_invoices USING btree (invoice_status);

CREATE UNIQUE INDEX business_members_business_id_user_id_key ON public.business_members USING btree (business_id, user_id);

CREATE INDEX idx_business_members_business ON public.business_members USING btree (business_id);

CREATE INDEX idx_business_members_user ON public.business_members USING btree (user_id);

CREATE UNIQUE INDEX business_orders_business_id_order_number_key ON public.business_orders USING btree (business_id, order_number);

CREATE INDEX idx_business_orders_business ON public.business_orders USING btree (business_id);

CREATE UNIQUE INDEX business_products_business_id_code_key ON public.business_products USING btree (business_id, code);

CREATE INDEX idx_business_products_business ON public.business_products USING btree (business_id);

CREATE UNIQUE INDEX business_profiles_organization_id_key ON public.business_profiles USING btree (organization_id);

CREATE INDEX idx_business_profiles_organization ON public.business_profiles USING btree (organization_id);

CREATE INDEX idx_business_profiles_owner ON public.business_profiles USING btree (owner_user_id);

CREATE INDEX idx_business_profiles_status ON public.business_profiles USING btree (business_status);

CREATE UNIQUE INDEX business_sales_business_id_sale_number_key ON public.business_sales USING btree (business_id, sale_number);

CREATE INDEX idx_business_sales_business ON public.business_sales USING btree (business_id);

CREATE INDEX idx_business_sales_client ON public.business_sales USING btree (client_id);

CREATE INDEX idx_business_sales_status ON public.business_sales USING btree (sale_status);

CREATE INDEX idx_business_suppliers_business ON public.business_suppliers USING btree (business_id);

CREATE UNIQUE INDEX cashback_accounts_user_id_key ON public.cashback_accounts USING btree (user_id);

CREATE UNIQUE INDEX countries_iso_code_key ON public.countries USING btree (iso_code);

CREATE INDEX idx_countries_iso ON public.countries USING btree (iso_code);

CREATE INDEX idx_crm_appointments_business ON public.crm_appointments USING btree (business_id);

CREATE INDEX idx_crm_appointments_scheduled_at ON public.crm_appointments USING btree (scheduled_at);

CREATE INDEX idx_crm_collection_activities_schedule ON public.crm_collection_activities USING btree (schedule_id);

CREATE INDEX idx_crm_commission_rules_business_prospecteur ON public.crm_commission_rules USING btree (business_id, prospecteur_id, is_active, priority DESC);

CREATE UNIQUE INDEX crm_commissions_idempotency_key_key ON public.crm_commissions USING btree (idempotency_key);

CREATE UNIQUE INDEX uq_crm_commission_per_sale_prospecteur ON public.crm_commissions USING btree (sale_id, prospecteur_id) WHERE (sale_id IS NOT NULL);

CREATE INDEX idx_crm_commissions_business ON public.crm_commissions USING btree (business_id);

CREATE INDEX idx_crm_commissions_prospecteur ON public.crm_commissions USING btree (prospecteur_id);

CREATE INDEX idx_crm_commissions_status ON public.crm_commissions USING btree (commission_status);

CREATE UNIQUE INDEX crm_credit_terms_sale_id_key ON public.crm_credit_terms USING btree (sale_id);

CREATE INDEX idx_crm_credit_terms_business ON public.crm_credit_terms USING btree (business_id);

CREATE INDEX idx_crm_credit_terms_client ON public.crm_credit_terms USING btree (client_id);

CREATE INDEX idx_crm_documents_business ON public.crm_documents USING btree (business_id);

CREATE INDEX idx_crm_documents_client ON public.crm_documents USING btree (client_id);

CREATE UNIQUE INDEX crm_payment_schedules_credit_term_id_installment_number_key ON public.crm_payment_schedules USING btree (credit_term_id, installment_number);

CREATE INDEX idx_crm_payment_schedules_sale ON public.crm_payment_schedules USING btree (sale_id);

CREATE INDEX idx_crm_payment_schedules_client ON public.crm_payment_schedules USING btree (client_id);

CREATE INDEX idx_crm_payment_schedules_due_date ON public.crm_payment_schedules USING btree (due_date);

CREATE INDEX idx_crm_payment_schedules_status ON public.crm_payment_schedules USING btree (schedule_status);

CREATE INDEX idx_crm_payment_schedules_business ON public.crm_payment_schedules USING btree (business_id);

CREATE UNIQUE INDEX crm_payments_idempotency_key_key ON public.crm_payments USING btree (idempotency_key);

CREATE INDEX idx_crm_payments_business ON public.crm_payments USING btree (business_id);

CREATE INDEX idx_crm_payments_client ON public.crm_payments USING btree (client_id);

CREATE INDEX idx_crm_payments_schedule ON public.crm_payments USING btree (schedule_id);

CREATE INDEX idx_crm_prospect_activities_prospect ON public.crm_prospect_activities USING btree (prospect_id);

CREATE INDEX idx_crm_prospect_activities_client ON public.crm_prospect_activities USING btree (client_id);

CREATE INDEX idx_crm_prospect_activities_created_at ON public.crm_prospect_activities USING btree (created_at);

CREATE INDEX idx_crm_prospecteur_stocks_business ON public.crm_prospecteur_stocks USING btree (business_id);

CREATE UNIQUE INDEX crm_prospecteur_stocks_business_prospecteur_product_key ON public.crm_prospecteur_stocks USING btree (business_id, prospecteur_id, product_id);

CREATE UNIQUE INDEX crm_prospecteurs_business_id_user_id_key ON public.crm_prospecteurs USING btree (business_id, user_id);

CREATE INDEX idx_crm_prospecteurs_business ON public.crm_prospecteurs USING btree (business_id);

CREATE INDEX idx_crm_prospecteurs_user ON public.crm_prospecteurs USING btree (user_id);

CREATE INDEX idx_crm_prospects_business ON public.crm_prospects USING btree (business_id);

CREATE INDEX idx_crm_prospects_prospecteur ON public.crm_prospects USING btree (assigned_prospecteur_id);

CREATE INDEX idx_crm_prospects_status ON public.crm_prospects USING btree (prospect_status);

CREATE INDEX idx_crm_prospects_next_follow_up ON public.crm_prospects USING btree (next_follow_up_at);

CREATE INDEX idx_crm_prospects_phone ON public.crm_prospects USING btree (phone);

CREATE INDEX idx_crm_prospects_email ON public.crm_prospects USING btree (email);

CREATE INDEX idx_crm_stock_movements_business ON public.crm_stock_movements USING btree (business_id);

CREATE INDEX idx_crm_stock_movements_product ON public.crm_stock_movements USING btree (product_id);

CREATE INDEX idx_crm_stock_movements_created_at ON public.crm_stock_movements USING btree (created_at);

CREATE INDEX idx_crm_stock_movements_to_prospecteur ON public.crm_stock_movements USING btree (to_prospecteur_id);

CREATE INDEX idx_crm_stock_movements_from_prospecteur ON public.crm_stock_movements USING btree (from_prospecteur_id);

CREATE INDEX idx_crm_targets_business ON public.crm_targets USING btree (business_id);

CREATE INDEX idx_crm_targets_prospecteur ON public.crm_targets USING btree (prospecteur_id);

CREATE UNIQUE INDEX currencies_code_key ON public.currencies USING btree (code);

CREATE INDEX idx_currencies_code ON public.currencies USING btree (code);

CREATE INDEX idx_energy_assets_site ON public.energy_assets USING btree (site_id);

CREATE INDEX idx_energy_billing_site_period ON public.energy_billing_records USING btree (site_id, period_start);

CREATE INDEX idx_energy_readings_site_date ON public.energy_meter_readings USING btree (site_id, reading_at);

CREATE INDEX idx_energy_sites_org ON public.energy_sites USING btree (organization_id);

CREATE UNIQUE INDEX exchange_transactions_reference_key ON public.exchange_transactions USING btree (reference);

CREATE UNIQUE INDEX exchange_transactions_idempotency_key_key ON public.exchange_transactions USING btree (idempotency_key);

CREATE UNIQUE INDEX health_appointments_idempotency_key_key ON public.health_appointments USING btree (idempotency_key);

CREATE UNIQUE INDEX uq_health_appointment_slot ON public.health_appointments USING btree (professional_id, scheduled_at) WHERE (appointment_status = ANY (ARRAY['requested'::health_appointment_status, 'pending'::health_appointment_status, 'confirmed'::health_appointment_status]));

CREATE INDEX idx_health_appointments_patient ON public.health_appointments USING btree (patient_user_id);

CREATE INDEX idx_health_appointments_professional ON public.health_appointments USING btree (professional_id);

CREATE INDEX idx_health_appointments_scheduled_at ON public.health_appointments USING btree (scheduled_at);

CREATE INDEX idx_health_appointments_professional_scheduled_status ON public.health_appointments USING btree (professional_id, scheduled_at, appointment_status);

CREATE INDEX idx_health_appointments_patient_status ON public.health_appointments USING btree (patient_user_id, appointment_status);

CREATE INDEX idx_health_appointments_business_status ON public.health_appointments USING btree (business_id, appointment_status);

CREATE INDEX idx_health_availabilities_professional ON public.health_availabilities USING btree (professional_id);

CREATE INDEX idx_health_documents_owner ON public.health_documents USING btree (owner_user_id);

CREATE INDEX idx_health_emergency_contacts_country ON public.health_emergency_contacts USING btree (country_id);

CREATE INDEX idx_health_home_care_patient ON public.health_home_care_requests USING btree (patient_user_id);

CREATE INDEX idx_health_invoices_patient ON public.health_invoices USING btree (patient_user_id);

CREATE INDEX idx_health_lab_orders_patient ON public.health_laboratory_orders USING btree (patient_user_id);

CREATE INDEX idx_health_lab_orders_business ON public.health_laboratory_orders USING btree (business_id);

CREATE UNIQUE INDEX health_laboratory_results_order_id_key ON public.health_laboratory_results USING btree (order_id);

CREATE INDEX idx_health_record_access_log_record ON public.health_medical_record_access_log USING btree (record_id);

CREATE INDEX idx_health_access_log_record_accessed ON public.health_medical_record_access_log USING btree (record_id, accessed_at DESC);

CREATE INDEX idx_health_medical_records_patient ON public.health_medical_records USING btree (patient_user_id);

CREATE INDEX idx_health_medical_records_author ON public.health_medical_records USING btree (author_professional_id);

CREATE INDEX idx_health_medical_records_patient_created ON public.health_medical_records USING btree (patient_user_id, created_at DESC);

CREATE INDEX idx_health_medical_records_business_created ON public.health_medical_records USING btree (business_id, created_at DESC);

CREATE INDEX idx_health_consents_patient ON public.health_patient_consents USING btree (patient_user_id);

CREATE INDEX idx_health_consents_professional ON public.health_patient_consents USING btree (grantee_professional_id);

CREATE INDEX idx_health_consents_business ON public.health_patient_consents USING btree (grantee_business_id);

CREATE INDEX idx_health_consents_patient_status_expires ON public.health_patient_consents USING btree (patient_user_id, consent_status, expires_at);

CREATE INDEX idx_health_prescriptions_patient ON public.health_prescriptions USING btree (patient_user_id);

CREATE INDEX idx_health_prescriptions_prescriber ON public.health_prescriptions USING btree (prescriber_professional_id);

CREATE UNIQUE INDEX health_professionals_user_id_key ON public.health_professionals USING btree (user_id);

CREATE INDEX idx_health_professionals_business ON public.health_professionals USING btree (business_id);

CREATE INDEX idx_health_professionals_specialty ON public.health_professionals USING btree (specialty_id);

CREATE UNIQUE INDEX health_provider_profiles_business_id_key ON public.health_provider_profiles USING btree (business_id);

CREATE INDEX idx_health_provider_profiles_business ON public.health_provider_profiles USING btree (business_id);

CREATE INDEX idx_health_provider_profiles_country ON public.health_provider_profiles USING btree (country_id);

CREATE UNIQUE INDEX health_reviews_appointment_id_reviewer_user_id_target_type__key ON public.health_reviews USING btree (appointment_id, reviewer_user_id, target_type, target_id);

CREATE INDEX idx_health_reviews_target ON public.health_reviews USING btree (target_type, target_id);

CREATE INDEX idx_health_services_business ON public.health_services USING btree (business_id);

CREATE INDEX idx_health_services_professional ON public.health_services USING btree (professional_id);

CREATE UNIQUE INDEX health_specialties_code_key ON public.health_specialties USING btree (code);

CREATE INDEX idx_health_verification_target ON public.health_verification_records USING btree (target_type, target_id);

CREATE UNIQUE INDEX immo_agencies_business_id_key ON public.immo_agencies USING btree (business_id);

CREATE UNIQUE INDEX immo_agents_business_id_user_id_key ON public.immo_agents USING btree (business_id, user_id);

CREATE INDEX idx_immo_appointments_property ON public.immo_appointments USING btree (property_id);

CREATE INDEX idx_immo_commissions_business ON public.immo_commissions USING btree (business_id);

CREATE UNIQUE INDEX immo_developers_business_id_key ON public.immo_developers USING btree (business_id);

CREATE INDEX idx_immo_documents_property ON public.immo_documents USING btree (property_id);

CREATE UNIQUE INDEX immo_favorites_user_id_property_id_key ON public.immo_favorites USING btree (user_id, property_id);

CREATE UNIQUE INDEX immo_favorites_user_id_project_id_key ON public.immo_favorites USING btree (user_id, project_id);

CREATE INDEX idx_immo_favorites_user ON public.immo_favorites USING btree (user_id);

CREATE INDEX idx_immo_leases_property ON public.immo_leases USING btree (property_id);

CREATE INDEX idx_immo_leases_tenant ON public.immo_leases USING btree (tenant_user_id);

CREATE INDEX idx_immo_leases_landlord_business_status ON public.immo_leases USING btree (landlord_business_id, lease_status);

CREATE INDEX idx_immo_offers_property ON public.immo_offers USING btree (property_id);

CREATE INDEX idx_immo_projects_business ON public.immo_projects USING btree (business_id);

CREATE UNIQUE INDEX uq_immo_properties_slug ON public.immo_properties USING btree (slug);

CREATE INDEX idx_immo_properties_business_status ON public.immo_properties USING btree (business_id, property_status);

CREATE UNIQUE INDEX immo_property_types_code_key ON public.immo_property_types USING btree (code);

CREATE INDEX idx_immo_rent_schedules_lease ON public.immo_rent_schedules USING btree (lease_id);

CREATE INDEX idx_immo_rent_schedules_due_date ON public.immo_rent_schedules USING btree (due_date);

CREATE INDEX idx_immo_rent_schedules_lease_due_status ON public.immo_rent_schedules USING btree (lease_id, due_date, rent_status);

CREATE INDEX idx_immo_reports_property ON public.immo_reports USING btree (property_id);

CREATE INDEX idx_immo_requests_requester ON public.immo_requests USING btree (requester_user_id);

CREATE INDEX idx_immo_requests_status ON public.immo_requests USING btree (request_status);

CREATE INDEX idx_immo_requests_assigned_business ON public.immo_requests USING btree (assigned_business_id);

CREATE UNIQUE INDEX immo_reservations_idempotency_key_key ON public.immo_reservations USING btree (idempotency_key);

CREATE UNIQUE INDEX uq_immo_property_active_reservation ON public.immo_reservations USING btree (property_id) WHERE (reservation_status = ANY (ARRAY['pending'::immo_reservation_status, 'confirmed'::immo_reservation_status]));

CREATE INDEX idx_immo_reservations_property ON public.immo_reservations USING btree (property_id);

CREATE INDEX idx_immo_reservations_client ON public.immo_reservations USING btree (client_user_id);

CREATE INDEX idx_immo_reservations_status_expires ON public.immo_reservations USING btree (reservation_status, expires_at);

CREATE INDEX idx_immo_units_project ON public.immo_units USING btree (project_id);

CREATE INDEX idx_immo_units_status ON public.immo_units USING btree (unit_status);

CREATE UNIQUE INDEX insurance_claims_claim_number_key ON public.insurance_claims USING btree (claim_number);

CREATE INDEX idx_insurance_claims_policy ON public.insurance_claims USING btree (policy_id);

CREATE INDEX idx_insurance_claims_customer ON public.insurance_claims USING btree (customer_id);

CREATE UNIQUE INDEX insurance_coverages_policy_id_coverage_code_key ON public.insurance_coverages USING btree (policy_id, coverage_code);

CREATE INDEX idx_insurance_customers_user ON public.insurance_customers USING btree (user_id);

CREATE UNIQUE INDEX insurance_payments_payment_reference_key ON public.insurance_payments USING btree (payment_reference);

CREATE INDEX idx_insurance_payments_policy ON public.insurance_payments USING btree (policy_id);

CREATE UNIQUE INDEX insurance_policies_policy_number_key ON public.insurance_policies USING btree (policy_number);

CREATE UNIQUE INDEX insurance_policies_idempotency_key_key ON public.insurance_policies USING btree (idempotency_key);

CREATE INDEX idx_insurance_policies_customer ON public.insurance_policies USING btree (customer_id);

CREATE INDEX idx_insurance_policies_org ON public.insurance_policies USING btree (organization_id);

CREATE INDEX idx_insurance_schedules_policy_due ON public.insurance_premium_schedules USING btree (policy_id, due_date);

CREATE UNIQUE INDEX insurance_products_provider_id_code_key ON public.insurance_products USING btree (provider_id, code);

CREATE INDEX idx_insurance_products_provider ON public.insurance_products USING btree (provider_id);

CREATE UNIQUE INDEX kyc_profiles_user_id_key ON public.kyc_profiles USING btree (user_id);

CREATE INDEX idx_kyc_profiles_user_id ON public.kyc_profiles USING btree (user_id);

CREATE UNIQUE INDEX languages_code_key ON public.languages USING btree (code);

CREATE INDEX idx_languages_code ON public.languages USING btree (code);

CREATE INDEX idx_marketplace_cart_items_cart_id ON public.marketplace_cart_items USING btree (cart_id);

CREATE UNIQUE INDEX idx_marketplace_carts_user ON public.marketplace_carts USING btree (user_id);

CREATE UNIQUE INDEX marketplace_categories_slug_key ON public.marketplace_categories USING btree (slug);

CREATE UNIQUE INDEX marketplace_coupons_code_key ON public.marketplace_coupons USING btree (code);

CREATE UNIQUE INDEX idx_marketplace_favorites_listing ON public.marketplace_favorites USING btree (user_id, listing_id) WHERE (listing_id IS NOT NULL);

CREATE UNIQUE INDEX idx_marketplace_favorites_seller ON public.marketplace_favorites USING btree (user_id, seller_id) WHERE (seller_id IS NOT NULL);

CREATE INDEX idx_marketplace_listing_media_listing_id ON public.marketplace_listing_media USING btree (listing_id);

CREATE UNIQUE INDEX idx_marketplace_listings_slug_seller ON public.marketplace_listings USING btree (seller_id, slug);

CREATE INDEX idx_marketplace_listings_seller_id ON public.marketplace_listings USING btree (seller_id);

CREATE INDEX idx_marketplace_listings_category_id ON public.marketplace_listings USING btree (category_id);

CREATE INDEX idx_marketplace_listings_status ON public.marketplace_listings USING btree (listing_status);

CREATE INDEX idx_marketplace_listings_created_at ON public.marketplace_listings USING btree (created_at DESC);

CREATE INDEX idx_marketplace_messages_conversation_id ON public.marketplace_messages USING btree (conversation_id);

CREATE INDEX idx_marketplace_order_items_order_id ON public.marketplace_order_items USING btree (order_id);

CREATE UNIQUE INDEX marketplace_orders_order_number_key ON public.marketplace_orders USING btree (order_number);

CREATE UNIQUE INDEX marketplace_orders_idempotency_key_key ON public.marketplace_orders USING btree (idempotency_key);

CREATE INDEX idx_marketplace_orders_buyer_id ON public.marketplace_orders USING btree (buyer_id);

CREATE INDEX idx_marketplace_orders_seller_id ON public.marketplace_orders USING btree (seller_id);

CREATE INDEX idx_marketplace_orders_status ON public.marketplace_orders USING btree (order_status);

CREATE INDEX idx_marketplace_orders_created_at ON public.marketplace_orders USING btree (created_at DESC);

CREATE INDEX idx_marketplace_price_history_listing_id_changed_at ON public.marketplace_price_history USING btree (listing_id, changed_at DESC);

CREATE UNIQUE INDEX idx_marketplace_reviews_order_listing ON public.marketplace_reviews USING btree (order_id, listing_id);

CREATE INDEX idx_marketplace_reviews_listing_id ON public.marketplace_reviews USING btree (listing_id);

CREATE INDEX idx_marketplace_reviews_seller_id ON public.marketplace_reviews USING btree (seller_id);

CREATE UNIQUE INDEX marketplace_sellers_shop_slug_key ON public.marketplace_sellers USING btree (shop_slug);

CREATE INDEX idx_marketplace_sellers_user_id ON public.marketplace_sellers USING btree (user_id);

CREATE INDEX idx_marketplace_sellers_status ON public.marketplace_sellers USING btree (seller_status);

CREATE INDEX idx_marketplace_shipments_order_id ON public.marketplace_shipments USING btree (order_id);

CREATE UNIQUE INDEX media_categories_name_key ON public.media_categories USING btree (name);

CREATE UNIQUE INDEX media_categories_slug_key ON public.media_categories USING btree (slug);

CREATE INDEX idx_media_metrics_content_date ON public.media_content_metrics USING btree (content_id, measured_at);

CREATE UNIQUE INDEX media_contents_channel_id_slug_key ON public.media_contents USING btree (channel_id, slug);

CREATE INDEX idx_media_contents_channel_status ON public.media_contents USING btree (channel_id, status);

CREATE UNIQUE INDEX modules_code_key ON public.modules USING btree (code);

CREATE INDEX idx_modules_code ON public.modules USING btree (code);

CREATE INDEX idx_modules_status ON public.modules USING btree (module_status);

CREATE INDEX idx_notifications_user ON public.notifications USING btree (user_id);

CREATE INDEX idx_notifications_read ON public.notifications USING btree (user_id, is_read);

CREATE UNIQUE INDEX organization_invitations_token_key ON public.organization_invitations USING btree (token);

CREATE UNIQUE INDEX organization_members_organization_id_user_id_key ON public.organization_members USING btree (organization_id, user_id);

CREATE INDEX idx_org_members_user ON public.organization_members USING btree (user_id);

CREATE INDEX idx_org_members_org ON public.organization_members USING btree (organization_id);

CREATE INDEX idx_organization_members_user_status ON public.organization_members USING btree (user_id, member_status);

CREATE UNIQUE INDEX organizations_slug_key ON public.organizations USING btree (slug);

CREATE INDEX idx_organizations_owner ON public.organizations USING btree (owner_id);

CREATE INDEX idx_organizations_slug ON public.organizations USING btree (slug);

CREATE INDEX idx_pay_beneficiaries_owner ON public.pay_beneficiaries USING btree (owner_user_id);

CREATE UNIQUE INDEX payment_providers_code_key ON public.payment_providers USING btree (code);

CREATE UNIQUE INDEX payment_requests_reference_key ON public.payment_requests USING btree (reference);

CREATE INDEX idx_payment_requests_requester ON public.payment_requests USING btree (requester_user_id);

CREATE INDEX idx_payment_requests_status ON public.payment_requests USING btree (request_status);

CREATE UNIQUE INDEX permissions_code_key ON public.permissions USING btree (code);

CREATE INDEX idx_profiles_id ON public.profiles USING btree (id);

CREATE INDEX idx_profiles_email ON public.profiles USING btree (email);

CREATE INDEX idx_profiles_country ON public.profiles USING btree (country_id);

CREATE UNIQUE INDEX pub_campaign_placements_campaign_id_placement_id_starts_at_key ON public.pub_campaign_placements USING btree (campaign_id, placement_id, starts_at);

CREATE INDEX idx_pub_campaigns_advertiser ON public.pub_campaigns USING btree (advertiser_id);

CREATE INDEX idx_pub_creatives_campaign ON public.pub_creatives USING btree (campaign_id);

CREATE INDEX idx_pub_impressions_campaign_date ON public.pub_impressions USING btree (campaign_id, occurred_at);

CREATE UNIQUE INDEX role_permissions_role_id_permission_id_key ON public.role_permissions USING btree (role_id, permission_id);

CREATE UNIQUE INDEX roles_code_key ON public.roles USING btree (code);

CREATE INDEX idx_social_comments_post_date ON public.social_comments USING btree (post_id, created_at);

CREATE INDEX idx_social_follows_following ON public.social_follows USING btree (following_user_id, status);

CREATE INDEX idx_social_posts_author_date ON public.social_posts USING btree (author_user_id, created_at DESC);

CREATE UNIQUE INDEX social_profiles_username_key ON public.social_profiles USING btree (username);

CREATE UNIQUE INDEX social_reactions_post_id_user_id_reaction_type_key ON public.social_reactions USING btree (post_id, user_id, reaction_type);

CREATE UNIQUE INDEX super_admins_user_id_key ON public.super_admins USING btree (user_id);

CREATE INDEX idx_super_admins_user_id ON public.super_admins USING btree (user_id);

CREATE INDEX idx_super_admins_user_status ON public.super_admins USING btree (user_id, admin_status);

CREATE UNIQUE INDEX system_settings_key_key ON public.system_settings USING btree (key);

CREATE UNIQUE INDEX tontine_contribution_schedule_cycle_id_member_id_period_num_key ON public.tontine_contribution_schedules USING btree (cycle_id, member_id, period_number);

CREATE INDEX idx_tontine_schedules_member_due ON public.tontine_contribution_schedules USING btree (member_id, due_on, status);

CREATE INDEX idx_tontine_schedules_cycle_due ON public.tontine_contribution_schedules USING btree (cycle_id, due_on);

CREATE INDEX idx_tontine_schedules_due_status ON public.tontine_contribution_schedules USING btree (due_on, status, cycle_id);

CREATE INDEX idx_tontine_schedule_penalty_status ON public.tontine_contribution_schedules USING btree (penalty_status) WHERE (penalty_status = ANY (ARRAY['due'::text, 'partially_paid'::text]));

CREATE UNIQUE INDEX tontine_contributions_wallet_transaction_id_key ON public.tontine_contributions USING btree (wallet_transaction_id);

CREATE INDEX idx_tontine_contributions_member_paid ON public.tontine_contributions USING btree (member_id, paid_at DESC);

CREATE INDEX idx_tontine_contributions_schedule ON public.tontine_contributions USING btree (schedule_id);

CREATE INDEX idx_tontine_contributions_member_status ON public.tontine_contributions USING btree (member_id, status);

CREATE INDEX idx_tontine_contributions_schedule_status ON public.tontine_contributions USING btree (schedule_id, status);

CREATE UNIQUE INDEX tontine_cycles_tontine_id_cycle_number_key ON public.tontine_cycles USING btree (tontine_id, cycle_number);

CREATE INDEX idx_tontine_cycles_tontine_status ON public.tontine_cycles USING btree (tontine_id, status);

CREATE INDEX idx_tontine_cycles_status_dates ON public.tontine_cycles USING btree (tontine_id, status, starts_on, ends_on);

CREATE INDEX idx_tontine_recon_tontine_cycle ON public.tontine_financial_reconciliations USING btree (tontine_id, cycle_id, status);

CREATE INDEX idx_tontine_recon_dispatch ON public.tontine_financial_reconciliations USING btree (dispatch_id, status);

CREATE UNIQUE INDEX uq_tontine_recon_dispatch ON public.tontine_financial_reconciliations USING btree (dispatch_id, reconciliation_type) WHERE (dispatch_id IS NOT NULL);

CREATE UNIQUE INDEX uq_tontine_fin_recon_contribution_type ON public.tontine_financial_reconciliations USING btree (contribution_id, reconciliation_type) WHERE (contribution_id IS NOT NULL);

CREATE UNIQUE INDEX tontine_join_links_token_hash_key ON public.tontine_join_links USING btree (token_hash);

CREATE INDEX idx_tontine_join_links_tontine ON public.tontine_join_links USING btree (tontine_id);

CREATE INDEX idx_tontine_join_links_status ON public.tontine_join_links USING btree (status);

CREATE UNIQUE INDEX tontine_members_tontine_id_user_id_key ON public.tontine_members USING btree (tontine_id, user_id);

CREATE INDEX idx_tontine_members_user_status ON public.tontine_members USING btree (user_id, membership_status);

CREATE INDEX idx_tontine_members_tontine_status ON public.tontine_members USING btree (tontine_id, membership_status);

CREATE INDEX idx_tontine_members_identity ON public.tontine_members USING btree (identity_confirmed_at);

CREATE UNIQUE INDEX tontine_payout_dispatches_idempotency_key_key ON public.tontine_payout_dispatches USING btree (idempotency_key);

CREATE INDEX idx_tontine_dispatch_status_attempt ON public.tontine_payout_dispatches USING btree (status, next_attempt_at, queued_at);

CREATE INDEX idx_tontine_dispatch_tontine ON public.tontine_payout_dispatches USING btree (tontine_id);

CREATE UNIQUE INDEX uq_tontine_dispatch_payout ON public.tontine_payout_dispatches USING btree (payout_id);

CREATE INDEX idx_tontine_dispatch_provider_request ON public.tontine_payout_dispatches USING btree (provider_request_id) WHERE (provider_request_id IS NOT NULL);

CREATE INDEX idx_tontine_dispatch_provider_reference ON public.tontine_payout_dispatches USING btree (provider_reference) WHERE (provider_reference IS NOT NULL);

CREATE UNIQUE INDEX uq_tontine_dispatch_provider_request ON public.tontine_payout_dispatches USING btree (provider_request_id) WHERE (provider_request_id IS NOT NULL);

CREATE UNIQUE INDEX uq_tontine_dispatch_provider_reference ON public.tontine_payout_dispatches USING btree (provider_reference) WHERE (provider_reference IS NOT NULL);

CREATE INDEX idx_tontine_dispatch_processing ON public.tontine_payout_dispatches USING btree (status, processing_at) WHERE (status = 'processing'::text);

CREATE UNIQUE INDEX tontine_payouts_rotation_id_key ON public.tontine_payouts USING btree (rotation_id);

CREATE UNIQUE INDEX tontine_payouts_wallet_transaction_id_key ON public.tontine_payouts USING btree (wallet_transaction_id);

CREATE INDEX idx_tontine_payouts_beneficiary_status ON public.tontine_payouts USING btree (beneficiary_member_id, status);

CREATE INDEX idx_tontine_payouts_status ON public.tontine_payouts USING btree (status);

CREATE INDEX idx_tontine_payouts_rotation_status ON public.tontine_payouts USING btree (rotation_id, status);

CREATE UNIQUE INDEX tontine_rotations_cycle_id_rotation_order_key ON public.tontine_rotations USING btree (cycle_id, rotation_order);

CREATE UNIQUE INDEX tontine_rotations_cycle_id_member_id_key ON public.tontine_rotations USING btree (cycle_id, member_id);

CREATE INDEX idx_tontine_rotations_cycle_order ON public.tontine_rotations USING btree (cycle_id, rotation_order);

CREATE INDEX idx_tontine_rotations_due_status ON public.tontine_rotations USING btree (planned_payout_on, status, cycle_id);

CREATE INDEX idx_tontines_org_status ON public.tontines USING btree (organization_id, status);

CREATE UNIQUE INDEX transfers_reference_key ON public.transfers USING btree (reference);

CREATE UNIQUE INDEX transfers_idempotency_key_key ON public.transfers USING btree (idempotency_key);

CREATE INDEX idx_transfers_sender_user_id ON public.transfers USING btree (sender_user_id);

CREATE INDEX idx_transfers_recipient_user_id ON public.transfers USING btree (recipient_user_id);

CREATE INDEX idx_transfers_status ON public.transfers USING btree (transfer_status);

CREATE INDEX idx_transfers_created_at ON public.transfers USING btree (created_at DESC);

CREATE INDEX idx_transfers_reference ON public.transfers USING btree (reference);

CREATE INDEX idx_transit_containers_shipment ON public.transit_containers USING btree (shipment_id);

CREATE INDEX idx_transit_customs_cases_operation ON public.transit_customs_cases USING btree (operation_id);

CREATE INDEX idx_transit_documents_operation ON public.transit_documents USING btree (operation_id);

CREATE INDEX idx_transit_documents_shipment ON public.transit_documents USING btree (shipment_id);

CREATE INDEX idx_transit_goods_operation ON public.transit_goods USING btree (operation_id);

CREATE UNIQUE INDEX transit_invoices_invoice_number_key ON public.transit_invoices USING btree (invoice_number);

CREATE INDEX idx_transit_invoices_business ON public.transit_invoices USING btree (business_id);

CREATE INDEX idx_transit_invoices_client ON public.transit_invoices USING btree (client_user_id);

CREATE INDEX idx_transit_invoices_business_status ON public.transit_invoices USING btree (business_id, invoice_status);

CREATE INDEX idx_transit_logistic_units_shipment ON public.transit_logistic_units USING btree (shipment_id);

CREATE UNIQUE INDEX transit_operations_reference_key ON public.transit_operations USING btree (reference);

CREATE INDEX idx_transit_operations_client ON public.transit_operations USING btree (client_user_id);

CREATE INDEX idx_transit_operations_business ON public.transit_operations USING btree (business_id);

CREATE INDEX idx_transit_operations_status ON public.transit_operations USING btree (case_status);

CREATE INDEX idx_transit_packages_shipment ON public.transit_packages USING btree (shipment_id);

CREATE INDEX idx_transit_partners_business ON public.transit_partners USING btree (business_id);

CREATE INDEX idx_transit_payment_schedules_invoice ON public.transit_payment_schedules USING btree (invoice_id);

CREATE INDEX idx_transit_quotes_business ON public.transit_quotes USING btree (business_id);

CREATE INDEX idx_transit_quotes_client ON public.transit_quotes USING btree (client_user_id);

CREATE INDEX idx_transit_quotes_business_status ON public.transit_quotes USING btree (business_id, quote_status);

CREATE INDEX idx_transit_reports_operation ON public.transit_reports USING btree (operation_id);

CREATE INDEX idx_transit_requests_requester ON public.transit_requests USING btree (requester_user_id);

CREATE INDEX idx_transit_requests_assigned_status ON public.transit_requests USING btree (assigned_business_id, request_status);

CREATE UNIQUE INDEX transit_shipment_legs_shipment_id_leg_order_key ON public.transit_shipment_legs USING btree (shipment_id, leg_order);

CREATE INDEX idx_transit_shipment_legs_shipment ON public.transit_shipment_legs USING btree (shipment_id);

CREATE UNIQUE INDEX transit_shipments_reference_key ON public.transit_shipments USING btree (reference);

CREATE INDEX idx_transit_shipments_operation ON public.transit_shipments USING btree (operation_id);

CREATE INDEX idx_transit_shipments_operation_status ON public.transit_shipments USING btree (operation_id, case_status);

CREATE INDEX idx_transit_storage_records_shipment ON public.transit_storage_records USING btree (shipment_id);

CREATE UNIQUE INDEX uq_transit_tracking_event_dedup ON public.transit_tracking_events USING btree (shipment_id, event_status, source_reference) WHERE (source_reference IS NOT NULL);

CREATE INDEX idx_transit_tracking_events_shipment ON public.transit_tracking_events USING btree (shipment_id);

CREATE INDEX idx_transit_tracking_events_created_at ON public.transit_tracking_events USING btree (created_at);

CREATE INDEX idx_transit_tracking_events_shipment_created ON public.transit_tracking_events USING btree (shipment_id, created_at DESC);

CREATE INDEX idx_transit_warehouses_business ON public.transit_warehouses USING btree (business_id);

CREATE UNIQUE INDEX transport_bookings_reference_key ON public.transport_bookings USING btree (reference);

CREATE UNIQUE INDEX transport_bookings_idempotency_key_key ON public.transport_bookings USING btree (idempotency_key);

CREATE INDEX idx_transport_bookings_passenger ON public.transport_bookings USING btree (passenger_user_id);

CREATE INDEX idx_transport_bookings_driver ON public.transport_bookings USING btree (driver_id);

CREATE INDEX idx_transport_bookings_business ON public.transport_bookings USING btree (business_id);

CREATE INDEX idx_transport_bookings_status ON public.transport_bookings USING btree (booking_status);

CREATE INDEX idx_transport_bookings_passenger_status ON public.transport_bookings USING btree (passenger_user_id, booking_status);

CREATE INDEX idx_transport_bookings_business_status ON public.transport_bookings USING btree (business_id, booking_status);

CREATE INDEX idx_transport_bookings_driver_status ON public.transport_bookings USING btree (driver_id, booking_status);

CREATE UNIQUE INDEX uq_transport_commission_booking_driver ON public.transport_commissions USING btree (booking_id, driver_id) WHERE ((booking_id IS NOT NULL) AND (driver_id IS NOT NULL));

CREATE INDEX idx_transport_commissions_business ON public.transport_commissions USING btree (business_id);

CREATE INDEX idx_transport_commissions_business_status ON public.transport_commissions USING btree (business_id, commission_status);

CREATE UNIQUE INDEX transport_deliveries_reference_key ON public.transport_deliveries USING btree (reference);

CREATE UNIQUE INDEX transport_deliveries_idempotency_key_key ON public.transport_deliveries USING btree (idempotency_key);

CREATE INDEX idx_transport_deliveries_sender ON public.transport_deliveries USING btree (sender_user_id);

CREATE INDEX idx_transport_deliveries_business ON public.transport_deliveries USING btree (business_id);

CREATE INDEX idx_transport_deliveries_driver ON public.transport_deliveries USING btree (driver_id);

CREATE INDEX idx_transport_deliveries_status ON public.transport_deliveries USING btree (delivery_status);

CREATE INDEX idx_transport_deliveries_source ON public.transport_deliveries USING btree (source_module, source_reference);

CREATE INDEX idx_transport_deliveries_business_status ON public.transport_deliveries USING btree (business_id, delivery_status);

CREATE INDEX idx_transport_deliveries_driver_status ON public.transport_deliveries USING btree (driver_id, delivery_status);

CREATE INDEX idx_transport_delivery_events_delivery ON public.transport_delivery_events USING btree (delivery_id);

CREATE INDEX idx_transport_delivery_events_delivery_created ON public.transport_delivery_events USING btree (delivery_id, created_at);

CREATE UNIQUE INDEX transport_delivery_proofs_delivery_id_key ON public.transport_delivery_proofs USING btree (delivery_id);

CREATE INDEX idx_transport_availability_status ON public.transport_driver_availability USING btree (availability_status);

CREATE UNIQUE INDEX transport_drivers_user_id_key ON public.transport_drivers USING btree (user_id);

CREATE INDEX idx_transport_drivers_business ON public.transport_drivers USING btree (business_id);

CREATE INDEX idx_transport_drivers_status ON public.transport_drivers USING btree (driver_status);

CREATE INDEX idx_transport_parcels_delivery ON public.transport_parcels USING btree (delivery_id);

CREATE INDEX idx_transport_pricing_rules_service ON public.transport_pricing_rules USING btree (service_type_id);

CREATE UNIQUE INDEX transport_rentals_idempotency_key_key ON public.transport_rentals USING btree (idempotency_key);

CREATE INDEX idx_transport_rentals_vehicle ON public.transport_rentals USING btree (vehicle_id);

CREATE INDEX idx_transport_rentals_renter ON public.transport_rentals USING btree (renter_user_id);

CREATE INDEX idx_transport_rentals_business_status ON public.transport_rentals USING btree (business_id, rental_status);

CREATE INDEX idx_transport_reports_target ON public.transport_reports USING btree (target_type, target_id);

CREATE INDEX idx_transport_requests_requester ON public.transport_requests USING btree (requester_user_id);

CREATE INDEX idx_transport_requests_business_status ON public.transport_requests USING btree (assigned_business_id, request_status);

CREATE INDEX idx_transport_reviews_target ON public.transport_reviews USING btree (target_type, target_id);

CREATE INDEX idx_transport_routes_business ON public.transport_routes USING btree (business_id);

CREATE INDEX idx_transport_schedules_route ON public.transport_schedules USING btree (route_id);

CREATE INDEX idx_transport_schedules_departure ON public.transport_schedules USING btree (departure_at);

CREATE UNIQUE INDEX transport_seat_reservations_idempotency_key_key ON public.transport_seat_reservations USING btree (idempotency_key);

CREATE UNIQUE INDEX transport_seat_reservations_seat_id_key ON public.transport_seat_reservations USING btree (seat_id);

CREATE INDEX idx_transport_seat_reservations_schedule_status ON public.transport_seat_reservations USING btree (schedule_id, reservation_status);

CREATE UNIQUE INDEX transport_seats_schedule_id_seat_number_key ON public.transport_seats USING btree (schedule_id, seat_number);

CREATE INDEX idx_transport_seats_schedule ON public.transport_seats USING btree (schedule_id);

CREATE UNIQUE INDEX transport_service_types_code_country_id_key ON public.transport_service_types USING btree (code, country_id);

CREATE UNIQUE INDEX transport_stops_route_id_stop_order_key ON public.transport_stops USING btree (route_id, stop_order);

CREATE INDEX idx_transport_stops_route ON public.transport_stops USING btree (route_id);

CREATE UNIQUE INDEX transport_vehicle_types_code_key ON public.transport_vehicle_types USING btree (code);

CREATE UNIQUE INDEX uq_transport_vehicle_plate ON public.transport_vehicles USING btree (plate_number);

CREATE INDEX idx_transport_vehicles_owner ON public.transport_vehicles USING btree (owner_user_id);

CREATE INDEX idx_transport_vehicles_business ON public.transport_vehicles USING btree (business_id);

CREATE INDEX idx_travel_accommodations_business ON public.travel_accommodations USING btree (business_id);

CREATE INDEX idx_travel_accommodations_destination ON public.travel_accommodations USING btree (destination_id);

CREATE INDEX idx_travel_activities_business ON public.travel_activities USING btree (business_id);

CREATE INDEX idx_travel_activities_destination ON public.travel_activities USING btree (destination_id);

CREATE UNIQUE INDEX travel_agencies_business_id_key ON public.travel_agencies USING btree (business_id);

CREATE UNIQUE INDEX travel_agents_business_id_user_id_key ON public.travel_agents USING btree (business_id, user_id);

CREATE INDEX idx_travel_agents_business ON public.travel_agents USING btree (business_id);

CREATE UNIQUE INDEX travel_availability_resource_type_resource_id_available_dat_key ON public.travel_availability USING btree (resource_type, resource_id, available_date);

CREATE INDEX idx_travel_availability_resource ON public.travel_availability USING btree (resource_type, resource_id, available_date);

CREATE UNIQUE INDEX travel_bookings_reference_key ON public.travel_bookings USING btree (reference);

CREATE UNIQUE INDEX travel_bookings_idempotency_key_key ON public.travel_bookings USING btree (idempotency_key);

CREATE INDEX idx_travel_bookings_buyer ON public.travel_bookings USING btree (buyer_user_id);

CREATE INDEX idx_travel_bookings_business ON public.travel_bookings USING btree (business_id);

CREATE INDEX idx_travel_bookings_resource ON public.travel_bookings USING btree (resource_type, resource_id);

CREATE INDEX idx_travel_bookings_buyer_status ON public.travel_bookings USING btree (buyer_user_id, booking_status);

CREATE INDEX idx_travel_bookings_business_status ON public.travel_bookings USING btree (business_id, booking_status);

CREATE UNIQUE INDEX uq_travel_commission_per_booking_agent ON public.travel_commissions USING btree (booking_id, agent_id) WHERE ((booking_id IS NOT NULL) AND (agent_id IS NOT NULL));

CREATE INDEX idx_travel_commissions_business ON public.travel_commissions USING btree (business_id);

CREATE INDEX idx_travel_commissions_business_status ON public.travel_commissions USING btree (business_id, commission_status);

CREATE UNIQUE INDEX travel_destinations_slug_key ON public.travel_destinations USING btree (slug);

CREATE INDEX idx_travel_destinations_country ON public.travel_destinations USING btree (country_id);

CREATE INDEX idx_travel_documents_owner ON public.travel_documents USING btree (owner_user_id);

CREATE INDEX idx_travel_documents_booking ON public.travel_documents USING btree (booking_id);

CREATE UNIQUE INDEX travel_favorites_user_id_target_type_target_id_key ON public.travel_favorites USING btree (user_id, target_type, target_id);

CREATE INDEX idx_travel_favorites_user ON public.travel_favorites USING btree (user_id);

CREATE UNIQUE INDEX travel_guides_user_id_key ON public.travel_guides USING btree (user_id);

CREATE UNIQUE INDEX travel_itineraries_share_token_key ON public.travel_itineraries USING btree (share_token);

CREATE INDEX idx_travel_itineraries_owner ON public.travel_itineraries USING btree (owner_user_id);

CREATE INDEX idx_travel_itinerary_items_itinerary ON public.travel_itinerary_items USING btree (itinerary_id);

CREATE INDEX idx_travel_quotes_business ON public.travel_quotes USING btree (business_id);

CREATE INDEX idx_travel_quotes_client ON public.travel_quotes USING btree (client_user_id);

CREATE INDEX idx_travel_quotes_business_status ON public.travel_quotes USING btree (business_id, quote_status);

CREATE INDEX idx_travel_reports_target ON public.travel_reports USING btree (target_type, target_id);

CREATE INDEX idx_travel_requests_requester ON public.travel_requests USING btree (requester_user_id);

CREATE INDEX idx_travel_requests_business_status ON public.travel_requests USING btree (assigned_business_id, request_status);

CREATE UNIQUE INDEX travel_reviews_booking_id_reviewer_user_id_target_type_targ_key ON public.travel_reviews USING btree (booking_id, reviewer_user_id, target_type, target_id);

CREATE INDEX idx_travel_reviews_target ON public.travel_reviews USING btree (target_type, target_id);

CREATE INDEX idx_travel_rooms_accommodation ON public.travel_rooms USING btree (accommodation_id);

CREATE UNIQUE INDEX travel_tour_stops_tour_id_stop_order_key ON public.travel_tour_stops USING btree (tour_id, stop_order);

CREATE INDEX idx_travel_tour_stops_tour ON public.travel_tour_stops USING btree (tour_id);

CREATE INDEX idx_travel_tours_business ON public.travel_tours USING btree (business_id);

CREATE INDEX idx_travelers_owner ON public.travelers USING btree (owner_user_id);

CREATE UNIQUE INDEX user_favorites_user_id_module_id_key ON public.user_favorites USING btree (user_id, module_id);

CREATE INDEX idx_user_favorites_user ON public.user_favorites USING btree (user_id);

CREATE UNIQUE INDEX user_module_access_user_id_module_id_organization_id_key ON public.user_module_access USING btree (user_id, module_id, organization_id);

CREATE INDEX idx_user_recent_user ON public.user_recent_services USING btree (user_id);

CREATE UNIQUE INDEX wallet_transactions_reference_key ON public.wallet_transactions USING btree (reference);

CREATE INDEX idx_wallet_transactions_wallet_id ON public.wallet_transactions USING btree (wallet_id);

CREATE INDEX idx_wallet_transactions_status ON public.wallet_transactions USING btree (transaction_status);

CREATE INDEX idx_wallet_transactions_type ON public.wallet_transactions USING btree (transaction_type);

CREATE INDEX idx_wallet_transactions_created_at ON public.wallet_transactions USING btree (created_at DESC);

CREATE INDEX idx_wallet_transactions_reference ON public.wallet_transactions USING btree (reference);

CREATE UNIQUE INDEX wallets_user_id_currency_id_organization_id_key ON public.wallets USING btree (user_id, currency_id, organization_id);

CREATE INDEX idx_wallets_user_id ON public.wallets USING btree (user_id);

CREATE INDEX idx_wallets_organization_id ON public.wallets USING btree (organization_id);

CREATE INDEX idx_wallets_currency_id ON public.wallets USING btree (currency_id);

CREATE INDEX idx_wallets_status ON public.wallets USING btree (wallet_status);

CREATE UNIQUE INDEX webhook_events_idempotency_key_key ON public.webhook_events USING btree (idempotency_key);

CREATE INDEX idx_webhook_events_status ON public.webhook_events USING btree (webhook_status);

CREATE INDEX idx_webhook_events_provider ON public.webhook_events USING btree (provider);
