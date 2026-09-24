-- LIVE SUPABASE CONSTRAINT DEFINITIONS

FOREIGN KEY (course_id) REFERENCES academy_courses(id) ON DELETE CASCADE;

CHECK (max_score > 0::numeric);

PRIMARY KEY (id);

CHECK (capacity IS NULL OR capacity > 0);

FOREIGN KEY (instructor_user_id) REFERENCES auth.users(id) ON DELETE SET NULL;

PRIMARY KEY (id);

FOREIGN KEY (program_id) REFERENCES academy_programs(id) ON DELETE CASCADE;

CHECK (status = ANY (ARRAY['planned'::text, 'open'::text, 'running'::text, 'completed'::text, 'cancelled'::text]));

FOREIGN KEY (course_id) REFERENCES academy_courses(id) ON DELETE CASCADE;

UNIQUE (course_id, student_user_id);

CHECK (enrollment_status = ANY (ARRAY['pending'::text, 'confirmed'::text, 'completed'::text, 'cancelled'::text]));

PRIMARY KEY (id);

FOREIGN KEY (student_user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

FOREIGN KEY (course_id) REFERENCES academy_courses(id) ON DELETE CASCADE;

UNIQUE (course_id, lesson_order);

CHECK (duration_minutes IS NULL OR duration_minutes >= 0);

CHECK (lesson_order > 0);

PRIMARY KEY (id);

FOREIGN KEY (currency_id) REFERENCES currencies(id) ON DELETE SET NULL;

CHECK (duration_hours IS NULL OR duration_hours >= 0::numeric);

FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE SET NULL;

PRIMARY KEY (id);

CHECK (price IS NULL OR price >= 0::numeric);

CHECK (status = ANY (ARRAY['draft'::text, 'published'::text, 'archived'::text]));

FOREIGN KEY (assessment_id) REFERENCES academy_assessments(id) ON DELETE CASCADE;

UNIQUE (assessment_id, student_user_id);

FOREIGN KEY (graded_by) REFERENCES auth.users(id) ON DELETE SET NULL;

PRIMARY KEY (id);

CHECK (score >= 0::numeric);

FOREIGN KEY (student_user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

CHECK (actual_yield IS NULL OR actual_yield >= 0::numeric);

CHECK (expected_yield IS NULL OR expected_yield >= 0::numeric);

FOREIGN KEY (farm_id) REFERENCES agri_farms(id) ON DELETE CASCADE;

PRIMARY KEY (id);

CHECK (planted_area_hectares IS NULL OR planted_area_hectares >= 0::numeric);

CHECK (status = ANY (ARRAY['planned'::text, 'planted'::text, 'growing'::text, 'harvested'::text, 'cancelled'::text]));

CHECK (area_hectares IS NULL OR area_hectares >= 0::numeric);

FOREIGN KEY (country_id) REFERENCES countries(id) ON DELETE SET NULL;

FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE SET NULL;

FOREIGN KEY (owner_user_id) REFERENCES auth.users(id) ON DELETE SET NULL;

PRIMARY KEY (id);

CHECK (status = ANY (ARRAY['draft'::text, 'active'::text, 'inactive'::text, 'archived'::text]));

FOREIGN KEY (order_id) REFERENCES agri_orders(id) ON DELETE CASCADE;

PRIMARY KEY (id);

FOREIGN KEY (product_id) REFERENCES agri_products(id) ON DELETE RESTRICT;

CHECK (quantity > 0::numeric);

CHECK (unit_price >= 0::numeric);

FOREIGN KEY (buyer_user_id) REFERENCES auth.users(id) ON DELETE SET NULL;

FOREIGN KEY (currency_id) REFERENCES currencies(id) ON DELETE SET NULL;

FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE SET NULL;

PRIMARY KEY (id);

CHECK (status = ANY (ARRAY['pending'::text, 'confirmed'::text, 'fulfilled'::text, 'cancelled'::text]));

CHECK (total_amount >= 0::numeric);

CHECK (cost_amount IS NULL OR cost_amount >= 0::numeric);

FOREIGN KEY (crop_id) REFERENCES agri_crops(id) ON DELETE CASCADE;

FOREIGN KEY (currency_id) REFERENCES currencies(id) ON DELETE SET NULL;

PRIMARY KEY (id);

FOREIGN KEY (recorded_by) REFERENCES auth.users(id) ON DELETE SET NULL;

CHECK (availability_status = ANY (ARRAY['available'::text, 'reserved'::text, 'sold'::text, 'unavailable'::text]));

FOREIGN KEY (currency_id) REFERENCES currencies(id) ON DELETE SET NULL;

FOREIGN KEY (farm_id) REFERENCES agri_farms(id) ON DELETE SET NULL;

PRIMARY KEY (id);

CHECK (quantity >= 0::numeric);

CHECK (unit_price IS NULL OR unit_price >= 0::numeric);

CHECK (area_hectares IS NULL OR area_hectares >= 0::numeric);

FOREIGN KEY (owner_user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

PRIMARY KEY (id);

FOREIGN KEY (farm_id) REFERENCES agriculture_farms(id) ON DELETE SET NULL;

FOREIGN KEY (owner_user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

PRIMARY KEY (id);

CHECK (price IS NULL OR price >= 0::numeric);

CHECK (quantity >= 0::numeric);

CHECK (action_type = ANY (ARRAY['context'::text, 'query'::text, 'message'::text, 'usage'::text]));

FOREIGN KEY (conversation_id) REFERENCES ai_conversations(id) ON DELETE SET NULL;

FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE SET NULL;

PRIMARY KEY (id);

FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE SET NULL;

PRIMARY KEY (id);

CHECK (status = ANY (ARRAY['active'::text, 'archived'::text]));

FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

FOREIGN KEY (conversation_id) REFERENCES ai_conversations(id) ON DELETE CASCADE;

PRIMARY KEY (id);

CHECK (role = ANY (ARRAY['system'::text, 'user'::text, 'assistant'::text, 'tool'::text]));

CHECK (token_input IS NULL OR token_input >= 0);

CHECK (token_output IS NULL OR token_output >= 0);

FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

CHECK (input_cost_per_1m_tokens >= 0::numeric);

CHECK (output_cost_per_1m_tokens >= 0::numeric);

PRIMARY KEY (id);

UNIQUE (provider, model);

CHECK (monthly_cost_limit >= 0::numeric);

CHECK (monthly_token_limit > 0);

FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;

PRIMARY KEY (organization_id);

FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;

UNIQUE (organization_id, provider);

PRIMARY KEY (id);

FOREIGN KEY (conversation_id) REFERENCES ai_conversations(id) ON DELETE SET NULL;

FOREIGN KEY (currency_id) REFERENCES currencies(id) ON DELETE SET NULL;

CHECK (estimated_cost >= 0::numeric);

FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE SET NULL;

PRIMARY KEY (id);

CHECK (tokens_input >= 0);

CHECK (tokens_output >= 0);

FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE SET NULL;

PRIMARY KEY (id);

FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;

FOREIGN KEY (biller_id) REFERENCES billers(id) ON DELETE RESTRICT;

FOREIGN KEY (currency_id) REFERENCES currencies(id) ON DELETE RESTRICT;

UNIQUE (idempotency_key);

PRIMARY KEY (id);

UNIQUE (reference);

FOREIGN KEY (transaction_id) REFERENCES wallet_transactions(id) ON DELETE SET NULL;

FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE RESTRICT;

FOREIGN KEY (wallet_id) REFERENCES wallets(id) ON DELETE RESTRICT;

UNIQUE (code);

FOREIGN KEY (country_id) REFERENCES countries(id) ON DELETE SET NULL;

PRIMARY KEY (id);

FOREIGN KEY (assigned_to) REFERENCES auth.users(id) ON DELETE SET NULL;

FOREIGN KEY (business_id) REFERENCES business_profiles(id) ON DELETE CASCADE;

FOREIGN KEY (client_id) REFERENCES business_clients(id) ON DELETE SET NULL;

FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE RESTRICT;

PRIMARY KEY (id);

FOREIGN KEY (parent_id) REFERENCES business_categories(id) ON DELETE SET NULL;

PRIMARY KEY (id);

UNIQUE (slug);

FOREIGN KEY (business_id) REFERENCES business_profiles(id) ON DELETE CASCADE;

FOREIGN KEY (country_id) REFERENCES countries(id) ON DELETE SET NULL;

PRIMARY KEY (id);

FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;

FOREIGN KEY (business_id) REFERENCES business_profiles(id) ON DELETE CASCADE;

PRIMARY KEY (id);

FOREIGN KEY (uploaded_by) REFERENCES auth.users(id) ON DELETE RESTRICT;

FOREIGN KEY (business_id) REFERENCES business_profiles(id) ON DELETE CASCADE;

FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE RESTRICT;

FOREIGN KEY (currency_id) REFERENCES currencies(id) ON DELETE SET NULL;

PRIMARY KEY (id);

FOREIGN KEY (supplier_id) REFERENCES business_suppliers(id) ON DELETE SET NULL;

FOREIGN KEY (business_id) REFERENCES business_profiles(id) ON DELETE CASCADE;

UNIQUE (business_id, invoice_number);

FOREIGN KEY (client_id) REFERENCES business_clients(id) ON DELETE SET NULL;

FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE RESTRICT;

FOREIGN KEY (currency_id) REFERENCES currencies(id) ON DELETE SET NULL;

PRIMARY KEY (id);

FOREIGN KEY (sale_id) REFERENCES business_sales(id) ON DELETE SET NULL;

FOREIGN KEY (business_id) REFERENCES business_profiles(id) ON DELETE CASCADE;

UNIQUE (business_id, user_id);

PRIMARY KEY (id);

FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

FOREIGN KEY (business_id) REFERENCES business_profiles(id) ON DELETE CASCADE;

UNIQUE (business_id, order_number);

FOREIGN KEY (client_id) REFERENCES business_clients(id) ON DELETE SET NULL;

FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE RESTRICT;

FOREIGN KEY (currency_id) REFERENCES currencies(id) ON DELETE SET NULL;

PRIMARY KEY (id);

FOREIGN KEY (business_id) REFERENCES business_profiles(id) ON DELETE CASCADE;

FOREIGN KEY (parent_id) REFERENCES business_product_categories(id) ON DELETE SET NULL;

PRIMARY KEY (id);

UNIQUE (business_id, code);

FOREIGN KEY (business_id) REFERENCES business_profiles(id) ON DELETE CASCADE;

FOREIGN KEY (category_id) REFERENCES business_product_categories(id) ON DELETE SET NULL;

PRIMARY KEY (id);

FOREIGN KEY (category_id) REFERENCES business_categories(id) ON DELETE SET NULL;

FOREIGN KEY (country_id) REFERENCES countries(id) ON DELETE SET NULL;

FOREIGN KEY (currency_id) REFERENCES currencies(id) ON DELETE SET NULL;

FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;

UNIQUE (organization_id);

FOREIGN KEY (owner_user_id) REFERENCES auth.users(id) ON DELETE RESTRICT;

PRIMARY KEY (id);

PRIMARY KEY (id);

FOREIGN KEY (product_id) REFERENCES business_products(id) ON DELETE SET NULL;

FOREIGN KEY (sale_id) REFERENCES business_sales(id) ON DELETE CASCADE;

FOREIGN KEY (business_id) REFERENCES business_profiles(id) ON DELETE CASCADE;

UNIQUE (business_id, sale_number);

FOREIGN KEY (client_id) REFERENCES business_clients(id) ON DELETE SET NULL;

FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE RESTRICT;

FOREIGN KEY (currency_id) REFERENCES currencies(id) ON DELETE SET NULL;

PRIMARY KEY (id);

FOREIGN KEY (business_id) REFERENCES business_profiles(id) ON DELETE CASCADE;

FOREIGN KEY (country_id) REFERENCES countries(id) ON DELETE SET NULL;

PRIMARY KEY (id);

PRIMARY KEY (id);

FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

UNIQUE (user_id);

FOREIGN KEY (cashback_account_id) REFERENCES cashback_accounts(id) ON DELETE CASCADE;

PRIMARY KEY (id);

FOREIGN KEY (transaction_id) REFERENCES wallet_transactions(id) ON DELETE SET NULL;

FOREIGN KEY (default_currency_id) REFERENCES currencies(id) ON DELETE SET NULL;

FOREIGN KEY (default_language_id) REFERENCES languages(id) ON DELETE SET NULL;

UNIQUE (iso_code);

PRIMARY KEY (id);

FOREIGN KEY (business_id) REFERENCES business_profiles(id) ON DELETE CASCADE;

FOREIGN KEY (client_id) REFERENCES business_clients(id) ON DELETE CASCADE;

FOREIGN KEY (created_by) REFERENCES auth.users(id);

PRIMARY KEY (id);

FOREIGN KEY (prospect_id) REFERENCES crm_prospects(id) ON DELETE CASCADE;

FOREIGN KEY (prospecteur_id) REFERENCES crm_prospecteurs(id) ON DELETE SET NULL;

FOREIGN KEY (actor_user_id) REFERENCES auth.users(id);

FOREIGN KEY (business_id) REFERENCES business_profiles(id) ON DELETE CASCADE;

PRIMARY KEY (id);

FOREIGN KEY (schedule_id) REFERENCES crm_payment_schedules(id) ON DELETE CASCADE;

FOREIGN KEY (business_id) REFERENCES business_profiles(id) ON DELETE CASCADE;

FOREIGN KEY (category_id) REFERENCES business_product_categories(id);

PRIMARY KEY (id);

FOREIGN KEY (product_id) REFERENCES business_products(id);

FOREIGN KEY (prospecteur_id) REFERENCES crm_prospecteurs(id) ON DELETE CASCADE;

CHECK (amount >= 0::numeric);

FOREIGN KEY (business_id) REFERENCES business_profiles(id) ON DELETE CASCADE;

FOREIGN KEY (currency_id) REFERENCES currencies(id);

UNIQUE (idempotency_key);

FOREIGN KEY (payment_id) REFERENCES crm_payments(id) ON DELETE SET NULL;

PRIMARY KEY (id);

FOREIGN KEY (prospecteur_id) REFERENCES crm_prospecteurs(id) ON DELETE CASCADE;

FOREIGN KEY (rule_id) REFERENCES crm_commission_rules(id) ON DELETE SET NULL;

FOREIGN KEY (sale_id) REFERENCES business_sales(id) ON DELETE SET NULL;

FOREIGN KEY (business_id) REFERENCES business_profiles(id) ON DELETE CASCADE;

FOREIGN KEY (client_id) REFERENCES business_clients(id) ON DELETE CASCADE;

FOREIGN KEY (currency_id) REFERENCES currencies(id);

CHECK (financed_amount >= 0::numeric);

CHECK (installments_count > 0);

PRIMARY KEY (id);

FOREIGN KEY (prospecteur_id) REFERENCES crm_prospecteurs(id) ON DELETE SET NULL;

FOREIGN KEY (sale_id) REFERENCES business_sales(id) ON DELETE CASCADE;

UNIQUE (sale_id);

FOREIGN KEY (business_id) REFERENCES business_profiles(id) ON DELETE CASCADE;

FOREIGN KEY (client_id) REFERENCES business_clients(id) ON DELETE CASCADE;

PRIMARY KEY (id);

FOREIGN KEY (prospect_id) REFERENCES crm_prospects(id) ON DELETE CASCADE;

FOREIGN KEY (uploaded_by) REFERENCES auth.users(id);

CHECK (amount_due >= 0::numeric);

CHECK (amount_paid >= 0::numeric);

FOREIGN KEY (business_id) REFERENCES business_profiles(id) ON DELETE CASCADE;

FOREIGN KEY (client_id) REFERENCES business_clients(id) ON DELETE CASCADE;

FOREIGN KEY (credit_term_id) REFERENCES crm_credit_terms(id) ON DELETE CASCADE;

UNIQUE (credit_term_id, installment_number);

FOREIGN KEY (currency_id) REFERENCES currencies(id);

PRIMARY KEY (id);

FOREIGN KEY (sale_id) REFERENCES business_sales(id) ON DELETE CASCADE;

CHECK (amount > 0::numeric);

FOREIGN KEY (business_id) REFERENCES business_profiles(id) ON DELETE CASCADE;

FOREIGN KEY (client_id) REFERENCES business_clients(id) ON DELETE CASCADE;

FOREIGN KEY (currency_id) REFERENCES currencies(id);

UNIQUE (idempotency_key);

FOREIGN KEY (jdv_pay_transaction_id) REFERENCES wallet_transactions(id);

PRIMARY KEY (id);

FOREIGN KEY (recorded_by) REFERENCES auth.users(id);

FOREIGN KEY (sale_id) REFERENCES business_sales(id) ON DELETE SET NULL;

FOREIGN KEY (schedule_id) REFERENCES crm_payment_schedules(id) ON DELETE SET NULL;

FOREIGN KEY (actor_user_id) REFERENCES auth.users(id);

FOREIGN KEY (business_id) REFERENCES business_profiles(id) ON DELETE CASCADE;

CHECK (prospect_id IS NOT NULL OR client_id IS NOT NULL);

FOREIGN KEY (client_id) REFERENCES business_clients(id) ON DELETE CASCADE;

PRIMARY KEY (id);

FOREIGN KEY (prospect_id) REFERENCES crm_prospects(id) ON DELETE CASCADE;

FOREIGN KEY (business_id) REFERENCES business_profiles(id) ON DELETE CASCADE;

PRIMARY KEY (id);

FOREIGN KEY (product_id) REFERENCES business_products(id) ON DELETE CASCADE;

FOREIGN KEY (prospecteur_id) REFERENCES crm_prospecteurs(id) ON DELETE CASCADE;

CHECK (quantity >= 0::numeric);

FOREIGN KEY (business_id) REFERENCES business_profiles(id) ON DELETE CASCADE;

UNIQUE (business_id, user_id);

PRIMARY KEY (id);

FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

FOREIGN KEY (assigned_prospecteur_id) REFERENCES crm_prospecteurs(id) ON DELETE SET NULL;

FOREIGN KEY (business_id) REFERENCES business_profiles(id) ON DELETE CASCADE;

FOREIGN KEY (converted_client_id) REFERENCES business_clients(id) ON DELETE SET NULL;

FOREIGN KEY (country_id) REFERENCES countries(id);

FOREIGN KEY (created_by) REFERENCES auth.users(id);

PRIMARY KEY (id);

FOREIGN KEY (actor_user_id) REFERENCES auth.users(id);

FOREIGN KEY (business_id) REFERENCES business_profiles(id) ON DELETE CASCADE;

FOREIGN KEY (from_prospecteur_id) REFERENCES crm_prospecteurs(id);

PRIMARY KEY (id);

FOREIGN KEY (product_id) REFERENCES business_products(id) ON DELETE CASCADE;

CHECK (quantity > 0::numeric);

FOREIGN KEY (sale_id) REFERENCES business_sales(id);

FOREIGN KEY (to_prospecteur_id) REFERENCES crm_prospecteurs(id);

FOREIGN KEY (business_id) REFERENCES business_profiles(id) ON DELETE CASCADE;

PRIMARY KEY (id);

FOREIGN KEY (prospecteur_id) REFERENCES crm_prospecteurs(id) ON DELETE CASCADE;

UNIQUE (code);

PRIMARY KEY (id);

CHECK (capacity_kw IS NULL OR capacity_kw >= 0::numeric);

PRIMARY KEY (id);

FOREIGN KEY (site_id) REFERENCES energy_sites(id) ON DELETE CASCADE;

CHECK (status = ANY (ARRAY['planned'::text, 'active'::text, 'maintenance'::text, 'retired'::text]));

CHECK (amount >= 0::numeric);

CHECK (period_end >= period_start);

CHECK (consumption_kwh >= 0::numeric);

FOREIGN KEY (currency_id) REFERENCES currencies(id) ON DELETE SET NULL;

PRIMARY KEY (id);

FOREIGN KEY (site_id) REFERENCES energy_sites(id) ON DELETE CASCADE;

CHECK (status = ANY (ARRAY['pending'::text, 'issued'::text, 'paid'::text, 'cancelled'::text]));

PRIMARY KEY (id);

CHECK (reading_value >= 0::numeric);

FOREIGN KEY (recorded_by) REFERENCES auth.users(id) ON DELETE SET NULL;

FOREIGN KEY (site_id) REFERENCES energy_sites(id) ON DELETE CASCADE;

FOREIGN KEY (country_id) REFERENCES countries(id) ON DELETE SET NULL;

FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE SET NULL;

PRIMARY KEY (id);

CHECK (status = ANY (ARRAY['draft'::text, 'active'::text, 'suspended'::text, 'inactive'::text]));

CHECK (capacity_kw IS NULL OR capacity_kw >= 0::numeric);

FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE SET NULL;

FOREIGN KEY (owner_user_id) REFERENCES auth.users(id) ON DELETE SET NULL;

PRIMARY KEY (id);

FOREIGN KEY (provider_id) REFERENCES energy_providers(id) ON DELETE SET NULL;

CHECK (status = ANY (ARRAY['draft'::text, 'active'::text, 'maintenance'::text, 'inactive'::text]));

FOREIGN KEY (base_currency_id) REFERENCES currencies(id) ON DELETE CASCADE;

PRIMARY KEY (id);

FOREIGN KEY (target_currency_id) REFERENCES currencies(id) ON DELETE CASCADE;

FOREIGN KEY (destination_currency_id) REFERENCES currencies(id) ON DELETE RESTRICT;

FOREIGN KEY (destination_wallet_id) REFERENCES wallets(id) ON DELETE RESTRICT;

UNIQUE (idempotency_key);

PRIMARY KEY (id);

UNIQUE (reference);

FOREIGN KEY (source_currency_id) REFERENCES currencies(id) ON DELETE RESTRICT;

FOREIGN KEY (source_wallet_id) REFERENCES wallets(id) ON DELETE RESTRICT;

FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE RESTRICT;

FOREIGN KEY (currency_id) REFERENCES currencies(id) ON DELETE SET NULL;

FOREIGN KEY (destination_country_id) REFERENCES countries(id) ON DELETE SET NULL;

PRIMARY KEY (id);

FOREIGN KEY (provider_id) REFERENCES payment_providers(id) ON DELETE SET NULL;

FOREIGN KEY (source_country_id) REFERENCES countries(id) ON DELETE SET NULL;

FOREIGN KEY (business_id) REFERENCES business_profiles(id);

FOREIGN KEY (currency_id) REFERENCES currencies(id);

UNIQUE (idempotency_key);

FOREIGN KEY (patient_user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

PRIMARY KEY (id);

FOREIGN KEY (professional_id) REFERENCES health_professionals(id) ON DELETE CASCADE;

FOREIGN KEY (service_id) REFERENCES health_services(id);

FOREIGN KEY (wallet_transaction_id) REFERENCES wallet_transactions(id);

CHECK (end_time > start_time);

CHECK (day_of_week IS NOT NULL OR specific_date IS NOT NULL);

CHECK (day_of_week >= 0 AND day_of_week <= 6);

PRIMARY KEY (id);

FOREIGN KEY (professional_id) REFERENCES health_professionals(id) ON DELETE CASCADE;

FOREIGN KEY (business_id) REFERENCES business_profiles(id);

FOREIGN KEY (owner_user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

PRIMARY KEY (id);

FOREIGN KEY (uploaded_by) REFERENCES auth.users(id);

FOREIGN KEY (country_id) REFERENCES countries(id);

PRIMARY KEY (id);

FOREIGN KEY (business_id) REFERENCES business_profiles(id);

FOREIGN KEY (patient_user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

PRIMARY KEY (id);

FOREIGN KEY (professional_id) REFERENCES health_professionals(id);

FOREIGN KEY (wallet_transaction_id) REFERENCES wallet_transactions(id);

CHECK (amount >= 0::numeric);

FOREIGN KEY (appointment_id) REFERENCES health_appointments(id);

FOREIGN KEY (business_id) REFERENCES business_profiles(id);

FOREIGN KEY (currency_id) REFERENCES currencies(id);

FOREIGN KEY (patient_user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

PRIMARY KEY (id);

FOREIGN KEY (wallet_transaction_id) REFERENCES wallet_transactions(id);

FOREIGN KEY (business_id) REFERENCES business_profiles(id);

FOREIGN KEY (ordering_professional_id) REFERENCES health_professionals(id);

FOREIGN KEY (patient_user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

PRIMARY KEY (id);

FOREIGN KEY (wallet_transaction_id) REFERENCES wallet_transactions(id);

FOREIGN KEY (document_id) REFERENCES health_documents(id);

FOREIGN KEY (order_id) REFERENCES health_laboratory_orders(id) ON DELETE CASCADE;

UNIQUE (order_id);

PRIMARY KEY (id);

FOREIGN KEY (accessor_user_id) REFERENCES auth.users(id);

PRIMARY KEY (id);

FOREIGN KEY (record_id) REFERENCES health_medical_records(id) ON DELETE CASCADE;

FOREIGN KEY (appointment_id) REFERENCES health_appointments(id);

FOREIGN KEY (author_professional_id) REFERENCES health_professionals(id);

FOREIGN KEY (business_id) REFERENCES business_profiles(id);

FOREIGN KEY (patient_user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

PRIMARY KEY (id);

CHECK (grantee_professional_id IS NOT NULL OR grantee_business_id IS NOT NULL);

FOREIGN KEY (grantee_business_id) REFERENCES business_profiles(id) ON DELETE CASCADE;

FOREIGN KEY (grantee_professional_id) REFERENCES health_professionals(id) ON DELETE CASCADE;

FOREIGN KEY (patient_user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

PRIMARY KEY (id);

PRIMARY KEY (id);

FOREIGN KEY (prescription_id) REFERENCES health_prescriptions(id) ON DELETE CASCADE;

FOREIGN KEY (appointment_id) REFERENCES health_appointments(id);

FOREIGN KEY (document_id) REFERENCES health_documents(id);

FOREIGN KEY (patient_user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

PRIMARY KEY (id);

FOREIGN KEY (prescriber_professional_id) REFERENCES health_professionals(id);

FOREIGN KEY (business_id) REFERENCES business_profiles(id) ON DELETE SET NULL;

FOREIGN KEY (country_id) REFERENCES countries(id);

PRIMARY KEY (id);

FOREIGN KEY (specialty_id) REFERENCES health_specialties(id);

FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

UNIQUE (user_id);

FOREIGN KEY (business_id) REFERENCES business_profiles(id) ON DELETE CASCADE;

UNIQUE (business_id);

FOREIGN KEY (country_id) REFERENCES countries(id);

PRIMARY KEY (id);

FOREIGN KEY (appointment_id) REFERENCES health_appointments(id) ON DELETE CASCADE;

UNIQUE (appointment_id, reviewer_user_id, target_type, target_id);

PRIMARY KEY (id);

CHECK (rating >= 1 AND rating <= 5);

FOREIGN KEY (reviewer_user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

FOREIGN KEY (business_id) REFERENCES business_profiles(id) ON DELETE CASCADE;

CHECK (business_id IS NOT NULL OR professional_id IS NOT NULL);

FOREIGN KEY (currency_id) REFERENCES currencies(id);

PRIMARY KEY (id);

FOREIGN KEY (professional_id) REFERENCES health_professionals(id) ON DELETE CASCADE;

FOREIGN KEY (specialty_id) REFERENCES health_specialties(id);

UNIQUE (code);

FOREIGN KEY (parent_id) REFERENCES health_specialties(id);

PRIMARY KEY (id);

PRIMARY KEY (id);

FOREIGN KEY (reviewed_by) REFERENCES auth.users(id);

FOREIGN KEY (business_id) REFERENCES business_profiles(id) ON DELETE CASCADE;

UNIQUE (business_id);

PRIMARY KEY (id);

FOREIGN KEY (business_id) REFERENCES business_profiles(id) ON DELETE CASCADE;

UNIQUE (business_id, user_id);

PRIMARY KEY (id);

FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

FOREIGN KEY (agent_id) REFERENCES immo_agents(id) ON DELETE SET NULL;

PRIMARY KEY (id);

FOREIGN KEY (property_id) REFERENCES immo_properties(id) ON DELETE CASCADE;

FOREIGN KEY (requester_user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

FOREIGN KEY (agent_id) REFERENCES immo_agents(id) ON DELETE SET NULL;

CHECK (amount >= 0::numeric);

FOREIGN KEY (business_id) REFERENCES business_profiles(id) ON DELETE CASCADE;

FOREIGN KEY (currency_id) REFERENCES currencies(id);

FOREIGN KEY (lease_id) REFERENCES immo_leases(id) ON DELETE SET NULL;

PRIMARY KEY (id);

FOREIGN KEY (property_id) REFERENCES immo_properties(id) ON DELETE SET NULL;

FOREIGN KEY (reservation_id) REFERENCES immo_reservations(id) ON DELETE SET NULL;

FOREIGN KEY (business_id) REFERENCES business_profiles(id) ON DELETE CASCADE;

UNIQUE (business_id);

PRIMARY KEY (id);

CHECK (property_id IS NOT NULL OR lease_id IS NOT NULL);

FOREIGN KEY (lease_id) REFERENCES immo_leases(id) ON DELETE CASCADE;

PRIMARY KEY (id);

FOREIGN KEY (property_id) REFERENCES immo_properties(id) ON DELETE CASCADE;

FOREIGN KEY (uploaded_by) REFERENCES auth.users(id);

CHECK (property_id IS NOT NULL OR project_id IS NOT NULL);

PRIMARY KEY (id);

FOREIGN KEY (project_id) REFERENCES immo_projects(id) ON DELETE CASCADE;

FOREIGN KEY (property_id) REFERENCES immo_properties(id) ON DELETE CASCADE;

FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

UNIQUE (user_id, project_id);

UNIQUE (user_id, property_id);

CHECK (landlord_user_id IS NOT NULL OR landlord_business_id IS NOT NULL);

FOREIGN KEY (currency_id) REFERENCES currencies(id);

FOREIGN KEY (landlord_business_id) REFERENCES business_profiles(id);

FOREIGN KEY (landlord_user_id) REFERENCES auth.users(id);

PRIMARY KEY (id);

FOREIGN KEY (property_id) REFERENCES immo_properties(id) ON DELETE CASCADE;

CHECK (rent_amount > 0::numeric);

FOREIGN KEY (tenant_user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

FOREIGN KEY (agent_id) REFERENCES immo_agents(id) ON DELETE SET NULL;

CHECK (amount > 0::numeric);

FOREIGN KEY (buyer_user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

FOREIGN KEY (currency_id) REFERENCES currencies(id);

PRIMARY KEY (id);

FOREIGN KEY (property_id) REFERENCES immo_properties(id) ON DELETE CASCADE;

PRIMARY KEY (id);

FOREIGN KEY (project_id) REFERENCES immo_projects(id) ON DELETE CASCADE;

FOREIGN KEY (business_id) REFERENCES business_profiles(id) ON DELETE CASCADE;

FOREIGN KEY (country_id) REFERENCES countries(id);

FOREIGN KEY (currency_id) REFERENCES currencies(id);

PRIMARY KEY (id);

FOREIGN KEY (business_id) REFERENCES business_profiles(id) ON DELETE CASCADE;

CHECK (owner_user_id IS NOT NULL OR business_id IS NOT NULL);

FOREIGN KEY (country_id) REFERENCES countries(id);

FOREIGN KEY (currency_id) REFERENCES currencies(id);

FOREIGN KEY (listed_by_agent_id) REFERENCES immo_agents(id) ON DELETE SET NULL;

FOREIGN KEY (owner_user_id) REFERENCES auth.users(id);

PRIMARY KEY (id);

FOREIGN KEY (property_type_id) REFERENCES immo_property_types(id);

PRIMARY KEY (id);

FOREIGN KEY (property_id) REFERENCES immo_properties(id) ON DELETE CASCADE;

UNIQUE (code);

PRIMARY KEY (id);

CHECK (amount_due >= 0::numeric);

CHECK (amount_paid >= 0::numeric);

FOREIGN KEY (lease_id) REFERENCES immo_leases(id) ON DELETE CASCADE;

PRIMARY KEY (id);

FOREIGN KEY (wallet_transaction_id) REFERENCES wallet_transactions(id);

FOREIGN KEY (agency_business_id) REFERENCES business_profiles(id);

PRIMARY KEY (id);

FOREIGN KEY (property_id) REFERENCES immo_properties(id) ON DELETE CASCADE;

FOREIGN KEY (reporter_user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

FOREIGN KEY (resolved_by) REFERENCES auth.users(id);

FOREIGN KEY (assigned_business_id) REFERENCES business_profiles(id) ON DELETE SET NULL;

FOREIGN KEY (country_id) REFERENCES countries(id);

FOREIGN KEY (crm_prospect_id) REFERENCES crm_prospects(id) ON DELETE SET NULL;

FOREIGN KEY (currency_id) REFERENCES currencies(id);

PRIMARY KEY (id);

FOREIGN KEY (property_type_id) REFERENCES immo_property_types(id);

FOREIGN KEY (requester_user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

CHECK (amount > 0::numeric);

FOREIGN KEY (client_user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

FOREIGN KEY (currency_id) REFERENCES currencies(id);

UNIQUE (idempotency_key);

PRIMARY KEY (id);

FOREIGN KEY (property_id) REFERENCES immo_properties(id) ON DELETE CASCADE;

FOREIGN KEY (wallet_transaction_id) REFERENCES wallet_transactions(id);

FOREIGN KEY (currency_id) REFERENCES currencies(id);

PRIMARY KEY (id);

FOREIGN KEY (project_id) REFERENCES immo_projects(id) ON DELETE CASCADE;

FOREIGN KEY (property_id) REFERENCES immo_properties(id) ON DELETE SET NULL;

FOREIGN KEY (unit_type_id) REFERENCES immo_property_types(id);

FOREIGN KEY (claim_id) REFERENCES insurance_claims(id) ON DELETE CASCADE;

PRIMARY KEY (id);

FOREIGN KEY (uploaded_by) REFERENCES auth.users(id) ON DELETE SET NULL;

CHECK (approved_amount >= 0::numeric);

FOREIGN KEY (assigned_to) REFERENCES auth.users(id) ON DELETE SET NULL;

UNIQUE (claim_number);

CHECK (claimed_amount >= 0::numeric);

FOREIGN KEY (currency_id) REFERENCES currencies(id);

FOREIGN KEY (customer_id) REFERENCES insurance_customers(id) ON DELETE RESTRICT;

CHECK (paid_amount >= 0::numeric);

PRIMARY KEY (id);

FOREIGN KEY (policy_id) REFERENCES insurance_policies(id) ON DELETE RESTRICT;

CHECK (status = ANY (ARRAY['submitted'::text, 'under_review'::text, 'approved'::text, 'partially_approved'::text, 'rejected'::text, 'paid'::text, 'closed'::text]));

CHECK (amount >= 0::numeric);

FOREIGN KEY (beneficiary_user_id) REFERENCES auth.users(id) ON DELETE SET NULL;

FOREIGN KEY (currency_id) REFERENCES currencies(id);

FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE SET NULL;

PRIMARY KEY (id);

FOREIGN KEY (policy_id) REFERENCES insurance_policies(id) ON DELETE RESTRICT;

CHECK (status = ANY (ARRAY['pending'::text, 'approved'::text, 'paid'::text, 'cancelled'::text]));

CHECK (coverage_limit >= 0::numeric);

CHECK (deductible_amount >= 0::numeric);

PRIMARY KEY (id);

UNIQUE (policy_id, coverage_code);

FOREIGN KEY (policy_id) REFERENCES insurance_policies(id) ON DELETE CASCADE;

FOREIGN KEY (country_id) REFERENCES countries(id);

FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE SET NULL;

PRIMARY KEY (id);

FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;

CHECK (amount > 0::numeric);

FOREIGN KEY (currency_id) REFERENCES currencies(id);

FOREIGN KEY (customer_id) REFERENCES insurance_customers(id) ON DELETE RESTRICT;

UNIQUE (payment_reference);

PRIMARY KEY (id);

FOREIGN KEY (policy_id) REFERENCES insurance_policies(id) ON DELETE RESTRICT;

FOREIGN KEY (schedule_id) REFERENCES insurance_premium_schedules(id) ON DELETE SET NULL;

CHECK (status = ANY (ARRAY['pending'::text, 'completed'::text, 'failed'::text, 'reversed'::text]));

CHECK (end_date >= start_date);

FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;

FOREIGN KEY (currency_id) REFERENCES currencies(id);

FOREIGN KEY (customer_id) REFERENCES insurance_customers(id) ON DELETE RESTRICT;

UNIQUE (idempotency_key);

FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE SET NULL;

PRIMARY KEY (id);

UNIQUE (policy_number);

CHECK (premium_amount >= 0::numeric);

FOREIGN KEY (product_id) REFERENCES insurance_products(id) ON DELETE RESTRICT;

CHECK (status = ANY (ARRAY['draft'::text, 'pending'::text, 'active'::text, 'suspended'::text, 'expired'::text, 'cancelled'::text]));

CHECK (total_coverage_amount >= 0::numeric);

CHECK (amount > 0::numeric);

FOREIGN KEY (currency_id) REFERENCES currencies(id);

PRIMARY KEY (id);

FOREIGN KEY (policy_id) REFERENCES insurance_policies(id) ON DELETE CASCADE;

CHECK (status = ANY (ARRAY['due'::text, 'paid'::text, 'late'::text, 'cancelled'::text]));

CHECK (base_premium >= 0::numeric);

FOREIGN KEY (currency_id) REFERENCES currencies(id);

PRIMARY KEY (id);

CHECK (premium_frequency = ANY (ARRAY['one_time'::text, 'daily'::text, 'weekly'::text, 'monthly'::text, 'quarterly'::text, 'semiannual'::text, 'annual'::text]));

UNIQUE (provider_id, code);

FOREIGN KEY (provider_id) REFERENCES insurance_providers(id) ON DELETE RESTRICT;

FOREIGN KEY (country_id) REFERENCES countries(id);

FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE SET NULL;

PRIMARY KEY (id);

CHECK (verification_status = ANY (ARRAY['pending'::text, 'verified'::text, 'suspended'::text, 'rejected'::text]));

FOREIGN KEY (kyc_profile_id) REFERENCES kyc_profiles(id) ON DELETE CASCADE;

PRIMARY KEY (id);

PRIMARY KEY (id);

FOREIGN KEY (reviewed_by) REFERENCES auth.users(id) ON DELETE SET NULL;

FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

UNIQUE (user_id);

UNIQUE (code);

PRIMARY KEY (id);

FOREIGN KEY (country_id) REFERENCES countries(id) ON DELETE SET NULL;

PRIMARY KEY (id);

FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

FOREIGN KEY (cart_id) REFERENCES marketplace_carts(id) ON DELETE CASCADE;

FOREIGN KEY (currency_id) REFERENCES currencies(id) ON DELETE SET NULL;

FOREIGN KEY (listing_id) REFERENCES marketplace_listings(id) ON DELETE CASCADE;

PRIMARY KEY (id);

PRIMARY KEY (id);

FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

FOREIGN KEY (parent_id) REFERENCES marketplace_categories(id) ON DELETE SET NULL;

PRIMARY KEY (id);

UNIQUE (slug);

FOREIGN KEY (buyer_id) REFERENCES profiles(id) ON DELETE CASCADE;

FOREIGN KEY (listing_id) REFERENCES marketplace_listings(id) ON DELETE SET NULL;

FOREIGN KEY (order_id) REFERENCES marketplace_orders(id) ON DELETE SET NULL;

PRIMARY KEY (id);

FOREIGN KEY (seller_id) REFERENCES marketplace_sellers(id) ON DELETE CASCADE;

UNIQUE (code);

PRIMARY KEY (id);

FOREIGN KEY (seller_id) REFERENCES marketplace_sellers(id) ON DELETE CASCADE;

FOREIGN KEY (listing_id) REFERENCES marketplace_listings(id) ON DELETE CASCADE;

PRIMARY KEY (id);

FOREIGN KEY (seller_id) REFERENCES marketplace_sellers(id) ON DELETE CASCADE;

FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

FOREIGN KEY (listing_id) REFERENCES marketplace_listings(id) ON DELETE CASCADE;

PRIMARY KEY (id);

FOREIGN KEY (business_product_id) REFERENCES business_products(id) ON DELETE SET NULL;

FOREIGN KEY (category_id) REFERENCES marketplace_categories(id) ON DELETE SET NULL;

FOREIGN KEY (currency_id) REFERENCES currencies(id) ON DELETE SET NULL;

PRIMARY KEY (id);

FOREIGN KEY (seller_id) REFERENCES marketplace_sellers(id) ON DELETE CASCADE;

FOREIGN KEY (conversation_id) REFERENCES marketplace_conversations(id) ON DELETE CASCADE;

PRIMARY KEY (id);

FOREIGN KEY (sender_id) REFERENCES profiles(id) ON DELETE CASCADE;

FOREIGN KEY (currency_id) REFERENCES currencies(id) ON DELETE SET NULL;

FOREIGN KEY (listing_id) REFERENCES marketplace_listings(id) ON DELETE RESTRICT;

FOREIGN KEY (order_id) REFERENCES marketplace_orders(id) ON DELETE CASCADE;

PRIMARY KEY (id);

FOREIGN KEY (buyer_id) REFERENCES profiles(id) ON DELETE RESTRICT;

FOREIGN KEY (currency_id) REFERENCES currencies(id) ON DELETE SET NULL;

FOREIGN KEY (delivery_address_id) REFERENCES marketplace_addresses(id) ON DELETE SET NULL;

UNIQUE (idempotency_key);

UNIQUE (order_number);

PRIMARY KEY (id);

FOREIGN KEY (seller_id) REFERENCES marketplace_sellers(id) ON DELETE RESTRICT;

FOREIGN KEY (wallet_transaction_id) REFERENCES wallet_transactions(id) ON DELETE SET NULL;

FOREIGN KEY (changed_by) REFERENCES profiles(id) ON DELETE SET NULL;

FOREIGN KEY (listing_id) REFERENCES marketplace_listings(id) ON DELETE CASCADE;

PRIMARY KEY (id);

PRIMARY KEY (id);

FOREIGN KEY (seller_id) REFERENCES marketplace_sellers(id) ON DELETE CASCADE;

FOREIGN KEY (buyer_id) REFERENCES profiles(id) ON DELETE RESTRICT;

FOREIGN KEY (currency_id) REFERENCES currencies(id) ON DELETE SET NULL;

FOREIGN KEY (order_id) REFERENCES marketplace_orders(id) ON DELETE RESTRICT;

PRIMARY KEY (id);

FOREIGN KEY (return_id) REFERENCES marketplace_returns(id) ON DELETE SET NULL;

FOREIGN KEY (wallet_transaction_id) REFERENCES wallet_transactions(id) ON DELETE SET NULL;

FOREIGN KEY (listing_id) REFERENCES marketplace_listings(id) ON DELETE CASCADE;

PRIMARY KEY (id);

FOREIGN KEY (reporter_id) REFERENCES profiles(id) ON DELETE CASCADE;

FOREIGN KEY (resolved_by) REFERENCES profiles(id) ON DELETE SET NULL;

FOREIGN KEY (review_id) REFERENCES marketplace_reviews(id) ON DELETE CASCADE;

FOREIGN KEY (seller_id) REFERENCES marketplace_sellers(id) ON DELETE CASCADE;

FOREIGN KEY (buyer_id) REFERENCES profiles(id) ON DELETE RESTRICT;

FOREIGN KEY (order_id) REFERENCES marketplace_orders(id) ON DELETE RESTRICT;

PRIMARY KEY (id);

FOREIGN KEY (seller_id) REFERENCES marketplace_sellers(id) ON DELETE RESTRICT;

FOREIGN KEY (listing_id) REFERENCES marketplace_listings(id) ON DELETE CASCADE;

FOREIGN KEY (order_id) REFERENCES marketplace_orders(id) ON DELETE CASCADE;

PRIMARY KEY (id);

CHECK (rating >= 1 AND rating <= 5);

FOREIGN KEY (reviewer_id) REFERENCES profiles(id) ON DELETE CASCADE;

FOREIGN KEY (seller_id) REFERENCES marketplace_sellers(id) ON DELETE CASCADE;

FOREIGN KEY (business_profile_id) REFERENCES business_profiles(id) ON DELETE SET NULL;

FOREIGN KEY (country_id) REFERENCES countries(id) ON DELETE SET NULL;

FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE SET NULL;

PRIMARY KEY (id);

UNIQUE (shop_slug);

FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

FOREIGN KEY (currency_id) REFERENCES currencies(id) ON DELETE SET NULL;

PRIMARY KEY (id);

FOREIGN KEY (seller_id) REFERENCES marketplace_sellers(id) ON DELETE RESTRICT;

FOREIGN KEY (wallet_transaction_id) REFERENCES wallet_transactions(id) ON DELETE SET NULL;

FOREIGN KEY (order_id) REFERENCES marketplace_orders(id) ON DELETE CASCADE;

PRIMARY KEY (id);

UNIQUE (name);

PRIMARY KEY (id);

UNIQUE (slug);

FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE SET NULL;

PRIMARY KEY (id);

CHECK (status = ANY (ARRAY['draft'::text, 'active'::text, 'inactive'::text]));

FOREIGN KEY (category_id) REFERENCES media_categories(id) ON DELETE CASCADE;

FOREIGN KEY (content_id) REFERENCES media_contents(id) ON DELETE CASCADE;

PRIMARY KEY (content_id, category_id);

CHECK (comments >= 0);

FOREIGN KEY (content_id) REFERENCES media_contents(id) ON DELETE CASCADE;

CHECK (likes >= 0);

PRIMARY KEY (id);

CHECK (shares >= 0);

CHECK (views >= 0);

FOREIGN KEY (author_user_id) REFERENCES auth.users(id) ON DELETE SET NULL;

FOREIGN KEY (channel_id) REFERENCES media_channels(id) ON DELETE CASCADE;

UNIQUE (channel_id, slug);

PRIMARY KEY (id);

CHECK (status = ANY (ARRAY['draft'::text, 'scheduled'::text, 'published'::text, 'archived'::text]));

UNIQUE (code);

PRIMARY KEY (id);

FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;

PRIMARY KEY (id);

FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

FOREIGN KEY (invited_by) REFERENCES auth.users(id) ON DELETE SET NULL;

FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;

PRIMARY KEY (id);

FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE SET NULL;

UNIQUE (token);

FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;

UNIQUE (organization_id, user_id);

PRIMARY KEY (id);

FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE SET NULL;

FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

FOREIGN KEY (country_id) REFERENCES countries(id) ON DELETE SET NULL;

FOREIGN KEY (default_currency_id) REFERENCES currencies(id) ON DELETE SET NULL;

FOREIGN KEY (default_language_id) REFERENCES languages(id) ON DELETE SET NULL;

FOREIGN KEY (owner_id) REFERENCES auth.users(id) ON DELETE SET NULL;

PRIMARY KEY (id);

UNIQUE (slug);

FOREIGN KEY (country_id) REFERENCES countries(id) ON DELETE SET NULL;

FOREIGN KEY (owner_user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

PRIMARY KEY (id);

FOREIGN KEY (provider_id) REFERENCES payment_providers(id) ON DELETE SET NULL;

PRIMARY KEY (id);

FOREIGN KEY (provider_id) REFERENCES payment_providers(id) ON DELETE SET NULL;

FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

FOREIGN KEY (destination_country_id) REFERENCES countries(id) ON DELETE SET NULL;

FOREIGN KEY (destination_currency_id) REFERENCES currencies(id) ON DELETE SET NULL;

PRIMARY KEY (id);

FOREIGN KEY (provider_id) REFERENCES payment_providers(id) ON DELETE CASCADE;

FOREIGN KEY (source_country_id) REFERENCES countries(id) ON DELETE SET NULL;

FOREIGN KEY (source_currency_id) REFERENCES currencies(id) ON DELETE SET NULL;

UNIQUE (code);

PRIMARY KEY (id);

FOREIGN KEY (currency_id) REFERENCES currencies(id) ON DELETE SET NULL;

FOREIGN KEY (paid_by_user_id) REFERENCES auth.users(id) ON DELETE SET NULL;

FOREIGN KEY (paid_transaction_id) REFERENCES wallet_transactions(id) ON DELETE SET NULL;

PRIMARY KEY (id);

UNIQUE (reference);

FOREIGN KEY (requester_user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

FOREIGN KEY (requester_wallet_id) REFERENCES wallets(id) ON DELETE SET NULL;

FOREIGN KEY (biller_id) REFERENCES billers(id) ON DELETE SET NULL;

FOREIGN KEY (currency_id) REFERENCES currencies(id) ON DELETE RESTRICT;

FOREIGN KEY (payment_method_id) REFERENCES payment_methods(id) ON DELETE SET NULL;

PRIMARY KEY (id);

FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

FOREIGN KEY (wallet_id) REFERENCES wallets(id) ON DELETE RESTRICT;

UNIQUE (code);

PRIMARY KEY (id);

FOREIGN KEY (country_id) REFERENCES countries(id) ON DELETE SET NULL;

FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

PRIMARY KEY (id);

FOREIGN KEY (preferred_currency_id) REFERENCES currencies(id) ON DELETE SET NULL;

FOREIGN KEY (preferred_language_id) REFERENCES languages(id) ON DELETE SET NULL;

FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE SET NULL;

PRIMARY KEY (id);

CHECK (status = ANY (ARRAY['pending'::text, 'active'::text, 'suspended'::text, 'closed'::text]));

FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;

FOREIGN KEY (campaign_id) REFERENCES pub_campaigns(id) ON DELETE CASCADE;

UNIQUE (campaign_id, placement_id, starts_at);

PRIMARY KEY (id);

FOREIGN KEY (placement_id) REFERENCES pub_placements(id) ON DELETE RESTRICT;

CHECK (status = ANY (ARRAY['scheduled'::text, 'active'::text, 'completed'::text, 'cancelled'::text]));

FOREIGN KEY (advertiser_id) REFERENCES pub_advertisers(id) ON DELETE CASCADE;

CHECK (budget_amount >= 0::numeric);

FOREIGN KEY (currency_id) REFERENCES currencies(id) ON DELETE SET NULL;

PRIMARY KEY (id);

CHECK (status = ANY (ARRAY['draft'::text, 'scheduled'::text, 'active'::text, 'paused'::text, 'completed'::text, 'cancelled'::text]));

CHECK (approval_status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text]));

FOREIGN KEY (campaign_id) REFERENCES pub_campaigns(id) ON DELETE CASCADE;

CHECK (duration_seconds IS NULL OR duration_seconds > 0);

PRIMARY KEY (id);

FOREIGN KEY (campaign_id) REFERENCES pub_campaigns(id) ON DELETE CASCADE;

CHECK (click_count >= 0);

FOREIGN KEY (creative_id) REFERENCES pub_creatives(id) ON DELETE SET NULL;

PRIMARY KEY (id);

FOREIGN KEY (placement_id) REFERENCES pub_placements(id) ON DELETE SET NULL;

FOREIGN KEY (currency_id) REFERENCES currencies(id) ON DELETE SET NULL;

PRIMARY KEY (id);

CHECK (price_per_day IS NULL OR price_per_day >= 0::numeric);

FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE;

PRIMARY KEY (id);

FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE;

UNIQUE (role_id, permission_id);

UNIQUE (code);

PRIMARY KEY (id);

PRIMARY KEY (id);

FOREIGN KEY (post_id) REFERENCES social_posts(id) ON DELETE CASCADE;

CHECK (status = ANY (ARRAY['published'::text, 'hidden'::text, 'deleted'::text]));

FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

CHECK (follower_user_id <> following_user_id);

FOREIGN KEY (follower_user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

FOREIGN KEY (following_user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

PRIMARY KEY (follower_user_id, following_user_id);

CHECK (status = ANY (ARRAY['pending'::text, 'active'::text, 'blocked'::text]));

FOREIGN KEY (author_user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

PRIMARY KEY (id);

CHECK (status = ANY (ARRAY['draft'::text, 'published'::text, 'archived'::text]));

CHECK (visibility = ANY (ARRAY['public'::text, 'followers'::text, 'private'::text]));

PRIMARY KEY (id);

CHECK (profile_status = ANY (ARRAY['active'::text, 'suspended'::text, 'closed'::text]));

FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

UNIQUE (username);

PRIMARY KEY (id);

FOREIGN KEY (post_id) REFERENCES social_posts(id) ON DELETE CASCADE;

UNIQUE (post_id, user_id, reaction_type);

FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

FOREIGN KEY (granted_by) REFERENCES auth.users(id) ON DELETE SET NULL;

PRIMARY KEY (id);

FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

UNIQUE (user_id);

UNIQUE (key);

PRIMARY KEY (id);

UNIQUE (cycle_id, member_id, period_number);

FOREIGN KEY (cycle_id) REFERENCES tontine_cycles(id) ON DELETE CASCADE;

CHECK (expected_amount > 0::numeric);

FOREIGN KEY (member_id) REFERENCES tontine_members(id) ON DELETE CASCADE;

CHECK (period_number > 0);

PRIMARY KEY (id);

CHECK (status = ANY (ARRAY['due'::text, 'partially_paid'::text, 'paid'::text, 'late'::text, 'waived'::text, 'cancelled'::text]));

CHECK (penalty_paid_amount >= 0::numeric);

CHECK (penalty_paid_amount <= COALESCE(late_fee_amount, 0::numeric));

CHECK (penalty_status = ANY (ARRAY['not_due'::text, 'due'::text, 'partially_paid'::text, 'paid'::text, 'waived'::text, 'cancelled'::text]));

CHECK (amount > 0::numeric);

FOREIGN KEY (created_by) REFERENCES auth.users(id);

FOREIGN KEY (currency_id) REFERENCES currencies(id);

FOREIGN KEY (member_id) REFERENCES tontine_members(id) ON DELETE RESTRICT;

CHECK (payment_method = ANY (ARRAY['jdv_pay'::text, 'external'::text]));

FOREIGN KEY (payment_request_id) REFERENCES payment_requests(id);

PRIMARY KEY (id);

FOREIGN KEY (schedule_id) REFERENCES tontine_contribution_schedules(id) ON DELETE RESTRICT;

CHECK (status = ANY (ARRAY['pending'::text, 'confirmed'::text, 'failed'::text, 'reversed'::text]));

FOREIGN KEY (wallet_transaction_id) REFERENCES wallet_transactions(id);

UNIQUE (wallet_transaction_id) DEFERRABLE;

CHECK (ends_on >= starts_on);

CHECK (cycle_number > 0);

PRIMARY KEY (id);

CHECK (status = ANY (ARRAY['planned'::text, 'open'::text, 'active'::text, 'closed'::text, 'cancelled'::text]));

UNIQUE (tontine_id, cycle_number);

FOREIGN KEY (tontine_id) REFERENCES tontines(id) ON DELETE CASCADE;

CHECK (total_collected >= 0::numeric);

CHECK (total_expected >= 0::numeric);

FOREIGN KEY (contribution_id) REFERENCES tontine_contributions(id) ON DELETE RESTRICT;

FOREIGN KEY (cycle_id) REFERENCES tontine_cycles(id) ON DELETE RESTRICT;

CHECK (direction = ANY (ARRAY['credit'::text, 'debit'::text]));

FOREIGN KEY (dispatch_id) REFERENCES tontine_payout_dispatches(id) ON DELETE RESTRICT;

CHECK (expected_amount >= 0::numeric);

FOREIGN KEY (payout_id) REFERENCES tontine_payouts(id) ON DELETE RESTRICT;

PRIMARY KEY (id);

FOREIGN KEY (reconciled_by) REFERENCES auth.users(id);

CHECK (reconciliation_type = ANY (ARRAY['contribution'::text, 'penalty'::text, 'payout'::text, 'reversal'::text, 'adjustment'::text]));

CHECK (status = ANY (ARRAY['pending'::text, 'matched'::text, 'mismatch'::text, 'reversed'::text]));

FOREIGN KEY (tontine_id) REFERENCES tontines(id) ON DELETE RESTRICT;

FOREIGN KEY (accepted_by) REFERENCES auth.users(id) ON DELETE SET NULL;

FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE RESTRICT;

PRIMARY KEY (id);

CHECK (status = ANY (ARRAY['active'::text, 'used'::text, 'revoked'::text, 'expired'::text]));

UNIQUE (token_hash);

FOREIGN KEY (tontine_id) REFERENCES tontines(id) ON DELETE CASCADE;

FOREIGN KEY (approved_by) REFERENCES auth.users(id);

CHECK (contribution_count >= 0);

CHECK (membership_status = ANY (ARRAY['pending'::text, 'approved'::text, 'active'::text, 'suspended'::text, 'left'::text, 'rejected'::text]));

PRIMARY KEY (id);

CHECK (role = ANY (ARRAY['owner'::text, 'manager'::text, 'member'::text]));

FOREIGN KEY (tontine_id) REFERENCES tontines(id) ON DELETE CASCADE;

UNIQUE (tontine_id, user_id);

FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

CHECK (reconciliation_status = ANY (ARRAY['pending'::text, 'matched'::text, 'mismatch'::text, 'reversed'::text]));

CHECK (amount > 0::numeric);

CHECK (attempts >= 0);

FOREIGN KEY (beneficiary_member_id) REFERENCES tontine_members(id);

FOREIGN KEY (beneficiary_user_id) REFERENCES auth.users(id);

FOREIGN KEY (currency_id) REFERENCES currencies(id);

UNIQUE (idempotency_key);

FOREIGN KEY (payout_id) REFERENCES tontine_payouts(id) ON DELETE CASCADE;

PRIMARY KEY (id);

FOREIGN KEY (rotation_id) REFERENCES tontine_rotations(id) ON DELETE CASCADE;

CHECK (status = ANY (ARRAY['queued'::text, 'processing'::text, 'sent'::text, 'confirmed'::text, 'failed'::text, 'cancelled'::text, 'reversed'::text]));

FOREIGN KEY (tontine_id) REFERENCES tontines(id) ON DELETE CASCADE;

CHECK (amount > 0::numeric);

FOREIGN KEY (approved_by) REFERENCES auth.users(id);

FOREIGN KEY (beneficiary_member_id) REFERENCES tontine_members(id) ON DELETE RESTRICT;

FOREIGN KEY (currency_id) REFERENCES currencies(id);

FOREIGN KEY (payment_request_id) REFERENCES payment_requests(id);

PRIMARY KEY (id);

FOREIGN KEY (rotation_id) REFERENCES tontine_rotations(id) ON DELETE RESTRICT;

UNIQUE (rotation_id);

CHECK (status = ANY (ARRAY['pending'::text, 'approved'::text, 'processing'::text, 'paid'::text, 'failed'::text, 'reversed'::text]));

FOREIGN KEY (wallet_transaction_id) REFERENCES wallet_transactions(id);

UNIQUE (wallet_transaction_id);

FOREIGN KEY (cycle_id) REFERENCES tontine_cycles(id) ON DELETE CASCADE;

UNIQUE (cycle_id, member_id);

UNIQUE (cycle_id, rotation_order);

CHECK (expected_amount >= 0::numeric);

FOREIGN KEY (member_id) REFERENCES tontine_members(id) ON DELETE RESTRICT;

PRIMARY KEY (id);

CHECK (rotation_order > 0);

CHECK (status = ANY (ARRAY['planned'::text, 'eligible'::text, 'approved'::text, 'paid'::text, 'skipped'::text, 'cancelled'::text]));

CHECK (ends_on IS NULL OR starts_on IS NULL OR ends_on >= starts_on);

CHECK (contribution_amount > 0::numeric);

FOREIGN KEY (country_id) REFERENCES countries(id);

FOREIGN KEY (created_by) REFERENCES auth.users(id);

FOREIGN KEY (currency_id) REFERENCES currencies(id);

CHECK (cycle_periods > 0 AND cycle_periods <= 366);

CHECK (frequency = ANY (ARRAY['daily'::text, 'weekly'::text, 'biweekly'::text, 'monthly'::text]));

CHECK (late_fee_amount >= 0::numeric);

CHECK (member_limit >= 2 AND member_limit <= 10000);

CHECK (length(TRIM(BOTH FROM name)) >= 2);

FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;

PRIMARY KEY (id);

FOREIGN KEY (president_member_id) REFERENCES tontine_members(id) ON DELETE SET NULL;

CHECK (status = ANY (ARRAY['draft'::text, 'open'::text, 'active'::text, 'paused'::text, 'completed'::text, 'cancelled'::text]));

FOREIGN KEY (currency_id) REFERENCES currencies(id) ON DELETE RESTRICT;

FOREIGN KEY (fee_rule_id) REFERENCES fee_rules(id) ON DELETE SET NULL;

PRIMARY KEY (id);

FOREIGN KEY (transaction_id) REFERENCES wallet_transactions(id) ON DELETE SET NULL;

FOREIGN KEY (transfer_id) REFERENCES transfers(id) ON DELETE SET NULL;

FOREIGN KEY (country_id) REFERENCES countries(id) ON DELETE SET NULL;

FOREIGN KEY (currency_id) REFERENCES currencies(id) ON DELETE SET NULL;

PRIMARY KEY (id);

FOREIGN KEY (actor_user_id) REFERENCES auth.users(id) ON DELETE SET NULL;

PRIMARY KEY (id);

FOREIGN KEY (transfer_id) REFERENCES transfers(id) ON DELETE CASCADE;

FOREIGN KEY (beneficiary_id) REFERENCES pay_beneficiaries(id) ON DELETE SET NULL;

FOREIGN KEY (fee_currency_id) REFERENCES currencies(id) ON DELETE RESTRICT;

UNIQUE (idempotency_key);

PRIMARY KEY (id);

FOREIGN KEY (provider_id) REFERENCES payment_providers(id) ON DELETE SET NULL;

FOREIGN KEY (receive_currency_id) REFERENCES currencies(id) ON DELETE RESTRICT;

FOREIGN KEY (recipient_user_id) REFERENCES auth.users(id) ON DELETE SET NULL;

FOREIGN KEY (recipient_wallet_id) REFERENCES wallets(id) ON DELETE SET NULL;

UNIQUE (reference);

FOREIGN KEY (route_id) REFERENCES payment_provider_routes(id) ON DELETE SET NULL;

FOREIGN KEY (send_currency_id) REFERENCES currencies(id) ON DELETE RESTRICT;

FOREIGN KEY (sender_user_id) REFERENCES auth.users(id) ON DELETE RESTRICT;

FOREIGN KEY (sender_wallet_id) REFERENCES wallets(id) ON DELETE RESTRICT;

PRIMARY KEY (id);

FOREIGN KEY (shipment_id) REFERENCES transit_shipments(id) ON DELETE CASCADE;

FOREIGN KEY (country_id) REFERENCES countries(id);

FOREIGN KEY (operation_id) REFERENCES transit_operations(id) ON DELETE CASCADE;

PRIMARY KEY (id);

FOREIGN KEY (country_id) REFERENCES countries(id);

FOREIGN KEY (currency_id) REFERENCES currencies(id);

FOREIGN KEY (customs_case_id) REFERENCES transit_customs_cases(id) ON DELETE CASCADE;

PRIMARY KEY (id);

FOREIGN KEY (country_id) REFERENCES countries(id);

PRIMARY KEY (id);

CHECK (operation_id IS NOT NULL OR shipment_id IS NOT NULL);

FOREIGN KEY (operation_id) REFERENCES transit_operations(id) ON DELETE CASCADE;

PRIMARY KEY (id);

FOREIGN KEY (shipment_id) REFERENCES transit_shipments(id) ON DELETE CASCADE;

FOREIGN KEY (uploaded_by) REFERENCES auth.users(id);

FOREIGN KEY (currency_id) REFERENCES currencies(id);

FOREIGN KEY (operation_id) REFERENCES transit_operations(id) ON DELETE CASCADE;

PRIMARY KEY (id);

CHECK (amount >= 0::numeric);

FOREIGN KEY (business_id) REFERENCES business_profiles(id) ON DELETE CASCADE;

FOREIGN KEY (client_user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

FOREIGN KEY (currency_id) REFERENCES currencies(id);

UNIQUE (invoice_number);

FOREIGN KEY (operation_id) REFERENCES transit_operations(id) ON DELETE SET NULL;

PRIMARY KEY (id);

FOREIGN KEY (wallet_transaction_id) REFERENCES wallet_transactions(id);

FOREIGN KEY (country_id) REFERENCES countries(id);

PRIMARY KEY (id);

FOREIGN KEY (container_id) REFERENCES transit_containers(id) ON DELETE SET NULL;

PRIMARY KEY (id);

FOREIGN KEY (shipment_id) REFERENCES transit_shipments(id) ON DELETE CASCADE;

FOREIGN KEY (business_id) REFERENCES business_profiles(id);

FOREIGN KEY (client_user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

FOREIGN KEY (destination_country_id) REFERENCES countries(id);

FOREIGN KEY (origin_country_id) REFERENCES countries(id);

PRIMARY KEY (id);

UNIQUE (reference);

FOREIGN KEY (responsible_user_id) REFERENCES auth.users(id);

PRIMARY KEY (id);

FOREIGN KEY (shipment_id) REFERENCES transit_shipments(id) ON DELETE CASCADE;

FOREIGN KEY (business_id) REFERENCES business_profiles(id);

FOREIGN KEY (country_id) REFERENCES countries(id);

PRIMARY KEY (id);

CHECK (amount_due >= 0::numeric);

CHECK (amount_paid >= 0::numeric);

FOREIGN KEY (invoice_id) REFERENCES transit_invoices(id) ON DELETE CASCADE;

PRIMARY KEY (id);

FOREIGN KEY (business_id) REFERENCES business_profiles(id) ON DELETE CASCADE;

FOREIGN KEY (client_user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

FOREIGN KEY (created_by) REFERENCES auth.users(id);

FOREIGN KEY (currency_id) REFERENCES currencies(id);

FOREIGN KEY (operation_id) REFERENCES transit_operations(id) ON DELETE SET NULL;

PRIMARY KEY (id);

CHECK (total_amount >= 0::numeric);

FOREIGN KEY (operation_id) REFERENCES transit_operations(id);

FOREIGN KEY (partner_id) REFERENCES transit_partners(id);

PRIMARY KEY (id);

FOREIGN KEY (reporter_user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

FOREIGN KEY (resolved_by) REFERENCES auth.users(id);

FOREIGN KEY (assigned_business_id) REFERENCES business_profiles(id) ON DELETE SET NULL;

FOREIGN KEY (crm_prospect_id) REFERENCES crm_prospects(id) ON DELETE SET NULL;

FOREIGN KEY (currency_id) REFERENCES currencies(id);

FOREIGN KEY (destination_country_id) REFERENCES countries(id);

FOREIGN KEY (origin_country_id) REFERENCES countries(id);

PRIMARY KEY (id);

FOREIGN KEY (requester_user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

FOREIGN KEY (carrier_partner_id) REFERENCES transit_partners(id) ON DELETE SET NULL;

FOREIGN KEY (destination_location_id) REFERENCES transit_locations(id);

FOREIGN KEY (origin_location_id) REFERENCES transit_locations(id);

PRIMARY KEY (id);

FOREIGN KEY (shipment_id) REFERENCES transit_shipments(id) ON DELETE CASCADE;

UNIQUE (shipment_id, leg_order);

FOREIGN KEY (transport_delivery_id) REFERENCES transport_deliveries(id) ON DELETE SET NULL;

FOREIGN KEY (currency_id) REFERENCES currencies(id);

FOREIGN KEY (destination_location_id) REFERENCES transit_locations(id);

FOREIGN KEY (operation_id) REFERENCES transit_operations(id) ON DELETE CASCADE;

FOREIGN KEY (origin_location_id) REFERENCES transit_locations(id);

PRIMARY KEY (id);

UNIQUE (reference);

FOREIGN KEY (shipper_user_id) REFERENCES auth.users(id);

FOREIGN KEY (currency_id) REFERENCES currencies(id);

PRIMARY KEY (id);

FOREIGN KEY (shipment_id) REFERENCES transit_shipments(id) ON DELETE CASCADE;

FOREIGN KEY (warehouse_id) REFERENCES transit_warehouses(id) ON DELETE CASCADE;

FOREIGN KEY (actor_user_id) REFERENCES auth.users(id);

PRIMARY KEY (id);

FOREIGN KEY (shipment_id) REFERENCES transit_shipments(id) ON DELETE CASCADE;

FOREIGN KEY (business_id) REFERENCES business_profiles(id) ON DELETE CASCADE;

FOREIGN KEY (location_id) REFERENCES transit_locations(id);

PRIMARY KEY (id);

FOREIGN KEY (business_id) REFERENCES business_profiles(id);

FOREIGN KEY (cancelled_by) REFERENCES auth.users(id);

FOREIGN KEY (currency_id) REFERENCES currencies(id);

FOREIGN KEY (driver_id) REFERENCES transport_drivers(id);

UNIQUE (idempotency_key);

FOREIGN KEY (passenger_user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

PRIMARY KEY (id);

UNIQUE (reference);

FOREIGN KEY (service_type_id) REFERENCES transport_service_types(id);

FOREIGN KEY (vehicle_id) REFERENCES transport_vehicles(id);

FOREIGN KEY (wallet_transaction_id) REFERENCES wallet_transactions(id);

CHECK (amount >= 0::numeric);

FOREIGN KEY (booking_id) REFERENCES transport_bookings(id) ON DELETE SET NULL;

FOREIGN KEY (business_id) REFERENCES business_profiles(id) ON DELETE CASCADE;

FOREIGN KEY (currency_id) REFERENCES currencies(id);

FOREIGN KEY (delivery_id) REFERENCES transport_deliveries(id) ON DELETE SET NULL;

FOREIGN KEY (driver_id) REFERENCES transport_drivers(id) ON DELETE SET NULL;

PRIMARY KEY (id);

FOREIGN KEY (business_id) REFERENCES business_profiles(id);

FOREIGN KEY (currency_id) REFERENCES currencies(id);

FOREIGN KEY (driver_id) REFERENCES transport_drivers(id) ON DELETE SET NULL;

UNIQUE (idempotency_key);

PRIMARY KEY (id);

UNIQUE (reference);

FOREIGN KEY (sender_user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

FOREIGN KEY (vehicle_id) REFERENCES transport_vehicles(id) ON DELETE SET NULL;

FOREIGN KEY (wallet_transaction_id) REFERENCES wallet_transactions(id);

FOREIGN KEY (actor_user_id) REFERENCES auth.users(id);

FOREIGN KEY (delivery_id) REFERENCES transport_deliveries(id) ON DELETE CASCADE;

PRIMARY KEY (id);

FOREIGN KEY (delivery_id) REFERENCES transport_deliveries(id) ON DELETE CASCADE;

UNIQUE (delivery_id);

PRIMARY KEY (id);

FOREIGN KEY (driver_id) REFERENCES transport_drivers(id) ON DELETE CASCADE;

PRIMARY KEY (driver_id);

FOREIGN KEY (driver_id) REFERENCES transport_drivers(id) ON DELETE CASCADE;

PRIMARY KEY (id);

FOREIGN KEY (business_id) REFERENCES business_profiles(id) ON DELETE SET NULL;

PRIMARY KEY (id);

FOREIGN KEY (primary_vehicle_id) REFERENCES transport_vehicles(id) ON DELETE SET NULL;

FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

UNIQUE (user_id);

FOREIGN KEY (currency_id) REFERENCES currencies(id);

FOREIGN KEY (delivery_id) REFERENCES transport_deliveries(id) ON DELETE CASCADE;

PRIMARY KEY (id);

FOREIGN KEY (business_id) REFERENCES business_profiles(id) ON DELETE CASCADE;

FOREIGN KEY (country_id) REFERENCES countries(id);

FOREIGN KEY (currency_id) REFERENCES currencies(id);

PRIMARY KEY (id);

FOREIGN KEY (service_type_id) REFERENCES transport_service_types(id);

FOREIGN KEY (vehicle_type_id) REFERENCES transport_vehicle_types(id);

FOREIGN KEY (business_id) REFERENCES business_profiles(id);

CHECK (end_at > start_at);

FOREIGN KEY (currency_id) REFERENCES currencies(id);

FOREIGN KEY (driver_id) REFERENCES transport_drivers(id) ON DELETE SET NULL;

UNIQUE (idempotency_key);

PRIMARY KEY (id);

CHECK (price > 0::numeric);

FOREIGN KEY (renter_user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

FOREIGN KEY (vehicle_id) REFERENCES transport_vehicles(id) ON DELETE CASCADE;

FOREIGN KEY (wallet_transaction_id) REFERENCES wallet_transactions(id);

PRIMARY KEY (id);

FOREIGN KEY (reporter_user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

FOREIGN KEY (resolved_by) REFERENCES auth.users(id);

FOREIGN KEY (assigned_business_id) REFERENCES business_profiles(id) ON DELETE SET NULL;

FOREIGN KEY (country_id) REFERENCES countries(id);

FOREIGN KEY (crm_prospect_id) REFERENCES crm_prospects(id) ON DELETE SET NULL;

FOREIGN KEY (currency_id) REFERENCES currencies(id);

PRIMARY KEY (id);

FOREIGN KEY (requester_user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

FOREIGN KEY (booking_id) REFERENCES transport_bookings(id) ON DELETE CASCADE;

CHECK (booking_id IS NOT NULL OR delivery_id IS NOT NULL);

FOREIGN KEY (delivery_id) REFERENCES transport_deliveries(id) ON DELETE CASCADE;

PRIMARY KEY (id);

CHECK (rating >= 1 AND rating <= 5);

FOREIGN KEY (reviewer_user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

FOREIGN KEY (business_id) REFERENCES business_profiles(id) ON DELETE CASCADE;

FOREIGN KEY (destination_country_id) REFERENCES countries(id);

FOREIGN KEY (origin_country_id) REFERENCES countries(id);

PRIMARY KEY (id);

CHECK (capacity > 0);

FOREIGN KEY (currency_id) REFERENCES currencies(id);

FOREIGN KEY (driver_id) REFERENCES transport_drivers(id);

PRIMARY KEY (id);

FOREIGN KEY (route_id) REFERENCES transport_routes(id) ON DELETE CASCADE;

FOREIGN KEY (vehicle_id) REFERENCES transport_vehicles(id);

FOREIGN KEY (currency_id) REFERENCES currencies(id);

UNIQUE (idempotency_key);

FOREIGN KEY (passenger_user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

PRIMARY KEY (id);

FOREIGN KEY (schedule_id) REFERENCES transport_schedules(id) ON DELETE CASCADE;

FOREIGN KEY (seat_id) REFERENCES transport_seats(id) ON DELETE CASCADE;

UNIQUE (seat_id);

FOREIGN KEY (wallet_transaction_id) REFERENCES wallet_transactions(id);

PRIMARY KEY (id);

FOREIGN KEY (schedule_id) REFERENCES transport_schedules(id) ON DELETE CASCADE;

UNIQUE (schedule_id, seat_number);

UNIQUE (code, country_id);

FOREIGN KEY (country_id) REFERENCES countries(id);

PRIMARY KEY (id);

PRIMARY KEY (id);

FOREIGN KEY (route_id) REFERENCES transport_routes(id) ON DELETE CASCADE;

UNIQUE (route_id, stop_order);

PRIMARY KEY (id);

FOREIGN KEY (vehicle_id) REFERENCES transport_vehicles(id) ON DELETE CASCADE;

UNIQUE (code);

PRIMARY KEY (id);

FOREIGN KEY (business_id) REFERENCES business_profiles(id) ON DELETE CASCADE;

CHECK (owner_user_id IS NOT NULL OR business_id IS NOT NULL);

FOREIGN KEY (owner_user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

PRIMARY KEY (id);

FOREIGN KEY (vehicle_type_id) REFERENCES transport_vehicle_types(id);

FOREIGN KEY (accommodation_id) REFERENCES travel_accommodations(id) ON DELETE CASCADE;

PRIMARY KEY (id);

FOREIGN KEY (business_id) REFERENCES business_profiles(id) ON DELETE CASCADE;

FOREIGN KEY (destination_id) REFERENCES travel_destinations(id);

PRIMARY KEY (id);

FOREIGN KEY (business_id) REFERENCES business_profiles(id) ON DELETE CASCADE;

FOREIGN KEY (currency_id) REFERENCES currencies(id);

FOREIGN KEY (destination_id) REFERENCES travel_destinations(id);

PRIMARY KEY (id);

FOREIGN KEY (activity_id) REFERENCES travel_activities(id) ON DELETE CASCADE;

PRIMARY KEY (id);

FOREIGN KEY (business_id) REFERENCES business_profiles(id) ON DELETE CASCADE;

UNIQUE (business_id);

PRIMARY KEY (id);

FOREIGN KEY (business_id) REFERENCES business_profiles(id) ON DELETE CASCADE;

UNIQUE (business_id, user_id);

PRIMARY KEY (id);

FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

CHECK (reserved_units <= total_units);

PRIMARY KEY (id);

CHECK (reserved_units >= 0);

UNIQUE (resource_type, resource_id, available_date);

CHECK (total_units >= 0);

CHECK (amount > 0::numeric);

FOREIGN KEY (business_id) REFERENCES business_profiles(id);

FOREIGN KEY (buyer_user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

FOREIGN KEY (currency_id) REFERENCES currencies(id);

UNIQUE (idempotency_key);

PRIMARY KEY (id);

FOREIGN KEY (quote_id) REFERENCES travel_quotes(id) ON DELETE SET NULL;

UNIQUE (reference);

FOREIGN KEY (wallet_transaction_id) REFERENCES wallet_transactions(id);

FOREIGN KEY (agent_id) REFERENCES travel_agents(id) ON DELETE SET NULL;

CHECK (amount >= 0::numeric);

FOREIGN KEY (booking_id) REFERENCES travel_bookings(id) ON DELETE SET NULL;

FOREIGN KEY (business_id) REFERENCES business_profiles(id) ON DELETE CASCADE;

FOREIGN KEY (currency_id) REFERENCES currencies(id);

FOREIGN KEY (guide_id) REFERENCES travel_guides(id) ON DELETE SET NULL;

PRIMARY KEY (id);

FOREIGN KEY (country_id) REFERENCES countries(id);

PRIMARY KEY (id);

UNIQUE (slug);

FOREIGN KEY (booking_id) REFERENCES travel_bookings(id) ON DELETE CASCADE;

FOREIGN KEY (owner_user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

PRIMARY KEY (id);

PRIMARY KEY (id);

FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

UNIQUE (user_id, target_type, target_id);

FOREIGN KEY (business_id) REFERENCES business_profiles(id) ON DELETE SET NULL;

PRIMARY KEY (id);

FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

UNIQUE (user_id);

FOREIGN KEY (owner_user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

PRIMARY KEY (id);

UNIQUE (share_token);

FOREIGN KEY (booking_id) REFERENCES travel_bookings(id) ON DELETE SET NULL;

FOREIGN KEY (destination_id) REFERENCES travel_destinations(id);

FOREIGN KEY (itinerary_id) REFERENCES travel_itineraries(id) ON DELETE CASCADE;

PRIMARY KEY (id);

FOREIGN KEY (business_id) REFERENCES business_profiles(id) ON DELETE CASCADE;

FOREIGN KEY (client_user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

FOREIGN KEY (created_by) REFERENCES auth.users(id);

FOREIGN KEY (currency_id) REFERENCES currencies(id);

PRIMARY KEY (id);

FOREIGN KEY (request_id) REFERENCES travel_requests(id) ON DELETE SET NULL;

CHECK (total_amount >= 0::numeric);

PRIMARY KEY (id);

FOREIGN KEY (reporter_user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

FOREIGN KEY (resolved_by) REFERENCES auth.users(id);

FOREIGN KEY (assigned_business_id) REFERENCES business_profiles(id) ON DELETE SET NULL;

FOREIGN KEY (crm_prospect_id) REFERENCES crm_prospects(id) ON DELETE SET NULL;

FOREIGN KEY (currency_id) REFERENCES currencies(id);

FOREIGN KEY (destination_id) REFERENCES travel_destinations(id);

PRIMARY KEY (id);

FOREIGN KEY (requester_user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

FOREIGN KEY (booking_id) REFERENCES travel_bookings(id) ON DELETE CASCADE;

UNIQUE (booking_id, reviewer_user_id, target_type, target_id);

PRIMARY KEY (id);

CHECK (rating >= 1 AND rating <= 5);

FOREIGN KEY (reviewer_user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

FOREIGN KEY (accommodation_id) REFERENCES travel_accommodations(id) ON DELETE CASCADE;

FOREIGN KEY (currency_id) REFERENCES currencies(id);

PRIMARY KEY (id);

FOREIGN KEY (destination_id) REFERENCES travel_destinations(id);

PRIMARY KEY (id);

FOREIGN KEY (tour_id) REFERENCES travel_tours(id) ON DELETE CASCADE;

UNIQUE (tour_id, stop_order);

FOREIGN KEY (business_id) REFERENCES business_profiles(id) ON DELETE CASCADE;

FOREIGN KEY (currency_id) REFERENCES currencies(id);

FOREIGN KEY (guide_id) REFERENCES travel_guides(id) ON DELETE SET NULL;

PRIMARY KEY (id);

FOREIGN KEY (nationality_country_id) REFERENCES countries(id);

FOREIGN KEY (owner_user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

PRIMARY KEY (id);

FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE CASCADE;

PRIMARY KEY (id);

FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

UNIQUE (user_id, module_id);

FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE CASCADE;

FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;

PRIMARY KEY (id);

FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

UNIQUE (user_id, module_id, organization_id);

FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE CASCADE;

PRIMARY KEY (id);

FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

CHECK (amount > 0::numeric);

FOREIGN KEY (currency_id) REFERENCES currencies(id) ON DELETE RESTRICT;

FOREIGN KEY (fee_currency_id) REFERENCES currencies(id) ON DELETE RESTRICT;

PRIMARY KEY (id);

UNIQUE (reference);

FOREIGN KEY (related_transaction_id) REFERENCES wallet_transactions(id) ON DELETE SET NULL;

FOREIGN KEY (wallet_id) REFERENCES wallets(id) ON DELETE RESTRICT;

CHECK (available_balance >= 0::numeric);

CHECK (balance >= 0::numeric);

FOREIGN KEY (currency_id) REFERENCES currencies(id) ON DELETE RESTRICT;

FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE SET NULL;

CHECK (pending_balance >= 0::numeric);

PRIMARY KEY (id);

UNIQUE (user_id, currency_id, organization_id);

FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

UNIQUE (idempotency_key);

PRIMARY KEY (id);
