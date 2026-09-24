-- LIVE SUPABASE RLS CONFIGURATION AND POLICIES

CREATE POLICY academy_assessments_access ON public.academy_assessments AS PERMISSIVE FOR * TO authenticated USING ((is_super_admin() OR (EXISTS ( SELECT 1
   FROM (academy_courses c
     JOIN academy_programs p ON ((p.id = c.program_id)))
  WHERE ((c.id = academy_assessments.course_id) AND is_org_member(p.organization_id)))))) WITH CHECK ((is_super_admin() OR (EXISTS ( SELECT 1
   FROM (academy_courses c
     JOIN academy_programs p ON ((p.id = c.program_id)))
  WHERE ((c.id = academy_assessments.course_id) AND is_org_admin(p.organization_id))))));
ALTER TABLE public.academy_assessments ENABLE ROW LEVEL SECURITY;
CREATE POLICY academy_courses_access ON public.academy_courses AS PERMISSIVE FOR * TO authenticated USING ((is_super_admin() OR (EXISTS ( SELECT 1
   FROM academy_programs p
  WHERE ((p.id = academy_courses.program_id) AND is_org_member(p.organization_id)))))) WITH CHECK ((is_super_admin() OR (EXISTS ( SELECT 1
   FROM academy_programs p
  WHERE ((p.id = academy_courses.program_id) AND is_org_admin(p.organization_id))))));
ALTER TABLE public.academy_courses ENABLE ROW LEVEL SECURITY;
CREATE POLICY academy_enrollments_access ON public.academy_enrollments AS PERMISSIVE FOR * TO authenticated USING ((is_super_admin() OR (student_user_id = auth.uid()) OR (EXISTS ( SELECT 1
   FROM (academy_courses c
     JOIN academy_programs p ON ((p.id = c.program_id)))
  WHERE ((c.id = academy_enrollments.course_id) AND is_org_member(p.organization_id)))))) WITH CHECK ((is_super_admin() OR (student_user_id = auth.uid()) OR (EXISTS ( SELECT 1
   FROM (academy_courses c
     JOIN academy_programs p ON ((p.id = c.program_id)))
  WHERE ((c.id = academy_enrollments.course_id) AND is_org_admin(p.organization_id))))));
ALTER TABLE public.academy_enrollments ENABLE ROW LEVEL SECURITY;
CREATE POLICY academy_lessons_access ON public.academy_lessons AS PERMISSIVE FOR * TO authenticated USING ((is_super_admin() OR (EXISTS ( SELECT 1
   FROM (academy_courses c
     JOIN academy_programs p ON ((p.id = c.program_id)))
  WHERE ((c.id = academy_lessons.course_id) AND is_org_member(p.organization_id)))))) WITH CHECK ((is_super_admin() OR (EXISTS ( SELECT 1
   FROM (academy_courses c
     JOIN academy_programs p ON ((p.id = c.program_id)))
  WHERE ((c.id = academy_lessons.course_id) AND is_org_admin(p.organization_id))))));
ALTER TABLE public.academy_lessons ENABLE ROW LEVEL SECURITY;
CREATE POLICY academy_programs_access ON public.academy_programs AS PERMISSIVE FOR * TO authenticated USING ((is_super_admin() OR is_org_member(organization_id))) WITH CHECK ((is_super_admin() OR is_org_admin(organization_id)));
ALTER TABLE public.academy_programs ENABLE ROW LEVEL SECURITY;
CREATE POLICY academy_results_access ON public.academy_results AS PERMISSIVE FOR * TO authenticated USING ((is_super_admin() OR (student_user_id = auth.uid()) OR (graded_by = auth.uid()) OR (EXISTS ( SELECT 1
   FROM ((academy_assessments a
     JOIN academy_courses c ON ((c.id = a.course_id)))
     JOIN academy_programs p ON ((p.id = c.program_id)))
  WHERE ((a.id = academy_results.assessment_id) AND is_org_member(p.organization_id)))))) WITH CHECK ((is_super_admin() OR (student_user_id = auth.uid()) OR (graded_by = auth.uid()) OR (EXISTS ( SELECT 1
   FROM ((academy_assessments a
     JOIN academy_courses c ON ((c.id = a.course_id)))
     JOIN academy_programs p ON ((p.id = c.program_id)))
  WHERE ((a.id = academy_results.assessment_id) AND is_org_admin(p.organization_id))))));
ALTER TABLE public.academy_results ENABLE ROW LEVEL SECURITY;
CREATE POLICY agri_crops_access ON public.agri_crops AS PERMISSIVE FOR * TO authenticated USING ((is_super_admin() OR (EXISTS ( SELECT 1
   FROM agri_farms f
  WHERE ((f.id = agri_crops.farm_id) AND ((f.owner_user_id = auth.uid()) OR is_org_member(f.organization_id))))))) WITH CHECK ((is_super_admin() OR (EXISTS ( SELECT 1
   FROM agri_farms f
  WHERE ((f.id = agri_crops.farm_id) AND ((f.owner_user_id = auth.uid()) OR is_org_admin(f.organization_id)))))));
ALTER TABLE public.agri_crops ENABLE ROW LEVEL SECURITY;
CREATE POLICY agri_farms_access ON public.agri_farms AS PERMISSIVE FOR * TO authenticated USING ((is_super_admin() OR (owner_user_id = auth.uid()) OR is_org_member(organization_id))) WITH CHECK ((is_super_admin() OR (owner_user_id = auth.uid()) OR is_org_admin(organization_id)));
ALTER TABLE public.agri_farms ENABLE ROW LEVEL SECURITY;
CREATE POLICY agri_order_items_access ON public.agri_order_items AS PERMISSIVE FOR * TO authenticated USING ((is_super_admin() OR (EXISTS ( SELECT 1
   FROM agri_orders o
  WHERE ((o.id = agri_order_items.order_id) AND ((o.buyer_user_id = auth.uid()) OR is_org_member(o.organization_id))))))) WITH CHECK ((is_super_admin() OR (EXISTS ( SELECT 1
   FROM agri_orders o
  WHERE ((o.id = agri_order_items.order_id) AND ((o.buyer_user_id = auth.uid()) OR is_org_admin(o.organization_id)))))));
ALTER TABLE public.agri_order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY agri_orders_access ON public.agri_orders AS PERMISSIVE FOR * TO authenticated USING ((is_super_admin() OR (buyer_user_id = auth.uid()) OR is_org_member(organization_id))) WITH CHECK ((is_super_admin() OR (buyer_user_id = auth.uid()) OR is_org_admin(organization_id)));
ALTER TABLE public.agri_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY agri_production_access ON public.agri_production_records AS PERMISSIVE FOR * TO authenticated USING ((is_super_admin() OR (recorded_by = auth.uid()) OR (EXISTS ( SELECT 1
   FROM (agri_crops c
     JOIN agri_farms f ON ((f.id = c.farm_id)))
  WHERE ((c.id = agri_production_records.crop_id) AND ((f.owner_user_id = auth.uid()) OR is_org_member(f.organization_id))))))) WITH CHECK ((is_super_admin() OR (recorded_by = auth.uid()) OR (EXISTS ( SELECT 1
   FROM (agri_crops c
     JOIN agri_farms f ON ((f.id = c.farm_id)))
  WHERE ((c.id = agri_production_records.crop_id) AND ((f.owner_user_id = auth.uid()) OR is_org_admin(f.organization_id)))))));
ALTER TABLE public.agri_production_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY agri_products_access ON public.agri_products AS PERMISSIVE FOR * TO authenticated USING ((is_super_admin() OR (EXISTS ( SELECT 1
   FROM agri_farms f
  WHERE ((f.id = agri_products.farm_id) AND ((f.owner_user_id = auth.uid()) OR is_org_member(f.organization_id))))))) WITH CHECK ((is_super_admin() OR (EXISTS ( SELECT 1
   FROM agri_farms f
  WHERE ((f.id = agri_products.farm_id) AND ((f.owner_user_id = auth.uid()) OR is_org_admin(f.organization_id)))))));
ALTER TABLE public.agri_products ENABLE ROW LEVEL SECURITY;
CREATE POLICY agriculture_farms_owner_select ON public.agriculture_farms AS PERMISSIVE FOR r TO authenticated USING (((( SELECT auth.uid() AS uid) = owner_user_id) OR ( SELECT is_super_admin() AS is_super_admin)));
ALTER TABLE public.agriculture_farms ENABLE ROW LEVEL SECURITY;
CREATE POLICY agriculture_products_owner_select ON public.agriculture_products AS PERMISSIVE FOR r TO authenticated USING (((( SELECT auth.uid() AS uid) = owner_user_id) OR ( SELECT is_super_admin() AS is_super_admin)));
ALTER TABLE public.agriculture_products ENABLE ROW LEVEL SECURITY;
CREATE POLICY ai_access_log_select ON public.ai_access_log AS PERMISSIVE FOR r TO authenticated USING (((user_id = auth.uid()) OR is_super_admin()));
ALTER TABLE public.ai_access_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY ai_conversations_delete ON public.ai_conversations AS PERMISSIVE FOR d TO authenticated USING (((user_id = auth.uid()) OR is_super_admin()));
CREATE POLICY ai_conversations_insert ON public.ai_conversations AS PERMISSIVE FOR a TO authenticated WITH CHECK ((user_id = auth.uid()));
CREATE POLICY ai_conversations_select ON public.ai_conversations AS PERMISSIVE FOR r TO authenticated USING (((user_id = auth.uid()) OR is_super_admin()));
CREATE POLICY ai_conversations_update ON public.ai_conversations AS PERMISSIVE FOR w TO authenticated USING (((user_id = auth.uid()) OR is_super_admin())) WITH CHECK (((user_id = auth.uid()) OR is_super_admin()));
ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY ai_messages_insert ON public.ai_messages AS PERMISSIVE FOR a TO authenticated WITH CHECK ((user_id = auth.uid()));
CREATE POLICY ai_messages_select ON public.ai_messages AS PERMISSIVE FOR r TO authenticated USING (((user_id = auth.uid()) OR is_super_admin()));
ALTER TABLE public.ai_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY ai_model_catalog_admin_delete ON public.ai_model_catalog AS PERMISSIVE FOR d TO authenticated USING (is_super_admin());
CREATE POLICY ai_model_catalog_admin_insert ON public.ai_model_catalog AS PERMISSIVE FOR a TO authenticated WITH CHECK (is_super_admin());
CREATE POLICY ai_model_catalog_admin_update ON public.ai_model_catalog AS PERMISSIVE FOR w TO authenticated USING (is_super_admin()) WITH CHECK (is_super_admin());
CREATE POLICY ai_model_catalog_select ON public.ai_model_catalog AS PERMISSIVE FOR r TO authenticated USING ((is_enabled OR is_super_admin()));
ALTER TABLE public.ai_model_catalog ENABLE ROW LEVEL SECURITY;
CREATE POLICY ai_org_policies_select ON public.ai_org_policies AS PERMISSIVE FOR r TO authenticated USING ((is_super_admin() OR is_org_admin(organization_id)));
ALTER TABLE public.ai_org_policies ENABLE ROW LEVEL SECURITY;
CREATE POLICY ai_provider_configs_delete ON public.ai_provider_configs AS PERMISSIVE FOR d TO authenticated USING ((is_super_admin() OR ((organization_id IS NOT NULL) AND is_org_admin(organization_id))));
CREATE POLICY ai_provider_configs_insert ON public.ai_provider_configs AS PERMISSIVE FOR a TO authenticated WITH CHECK ((is_super_admin() OR ((organization_id IS NOT NULL) AND is_org_admin(organization_id))));
CREATE POLICY ai_provider_configs_select ON public.ai_provider_configs AS PERMISSIVE FOR r TO authenticated USING ((is_super_admin() OR ((organization_id IS NOT NULL) AND is_org_admin(organization_id))));
CREATE POLICY ai_provider_configs_update ON public.ai_provider_configs AS PERMISSIVE FOR w TO authenticated USING ((is_super_admin() OR ((organization_id IS NOT NULL) AND is_org_admin(organization_id)))) WITH CHECK ((is_super_admin() OR ((organization_id IS NOT NULL) AND is_org_admin(organization_id))));
ALTER TABLE public.ai_provider_configs ENABLE ROW LEVEL SECURITY;
CREATE POLICY ai_usage_select ON public.ai_usage AS PERMISSIVE FOR r TO authenticated USING (((user_id = auth.uid()) OR is_super_admin()));
ALTER TABLE public.ai_usage ENABLE ROW LEVEL SECURITY;
CREATE POLICY audit_logs_insert ON public.audit_logs AS PERMISSIVE FOR a TO authenticated WITH CHECK ((user_id = auth.uid()));
CREATE POLICY audit_logs_own_read ON public.audit_logs AS PERMISSIVE FOR r TO authenticated USING (((user_id = auth.uid()) OR is_super_admin()));
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY bill_payments_owner_insert ON public.bill_payments AS PERMISSIVE FOR a TO unknown (OID=0) WITH CHECK ((auth.uid() = user_id));
CREATE POLICY bill_payments_owner_select ON public.bill_payments AS PERMISSIVE FOR r TO unknown (OID=0) USING ((auth.uid() = user_id));
ALTER TABLE public.bill_payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY billers_public_read ON public.billers AS PERMISSIVE FOR r TO unknown (OID=0) USING ((is_active = true));
ALTER TABLE public.billers ENABLE ROW LEVEL SECURITY;
CREATE POLICY business_appointments_insert ON public.business_appointments AS PERMISSIVE FOR a TO authenticated WITH CHECK (user_has_business_access(business_id));
CREATE POLICY business_appointments_select ON public.business_appointments AS PERMISSIVE FOR r TO authenticated USING (user_has_business_access(business_id));
CREATE POLICY business_appointments_update ON public.business_appointments AS PERMISSIVE FOR w TO authenticated USING (user_has_business_access(business_id)) WITH CHECK (user_has_business_access(business_id));
ALTER TABLE public.business_appointments ENABLE ROW LEVEL SECURITY;
CREATE POLICY business_categories_read ON public.business_categories AS PERMISSIVE FOR r TO unknown (OID=0) USING (true);
ALTER TABLE public.business_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY business_clients_insert ON public.business_clients AS PERMISSIVE FOR a TO authenticated WITH CHECK (user_has_business_access(business_id));
CREATE POLICY business_clients_select ON public.business_clients AS PERMISSIVE FOR r TO authenticated USING (user_has_business_access(business_id));
CREATE POLICY business_clients_update ON public.business_clients AS PERMISSIVE FOR w TO authenticated USING (user_has_business_access(business_id)) WITH CHECK (user_has_business_access(business_id));
ALTER TABLE public.business_clients ENABLE ROW LEVEL SECURITY;
CREATE POLICY business_documents_insert ON public.business_documents AS PERMISSIVE FOR a TO authenticated WITH CHECK (user_has_business_access(business_id));
CREATE POLICY business_documents_select ON public.business_documents AS PERMISSIVE FOR r TO authenticated USING (user_has_business_access(business_id));
ALTER TABLE public.business_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY business_expenses_insert ON public.business_expenses AS PERMISSIVE FOR a TO authenticated WITH CHECK (user_has_business_access(business_id));
CREATE POLICY business_expenses_select ON public.business_expenses AS PERMISSIVE FOR r TO authenticated USING (user_has_business_access(business_id));
CREATE POLICY business_expenses_update ON public.business_expenses AS PERMISSIVE FOR w TO authenticated USING (user_has_business_access(business_id)) WITH CHECK (user_has_business_access(business_id));
ALTER TABLE public.business_expenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY business_invoices_insert ON public.business_invoices AS PERMISSIVE FOR a TO authenticated WITH CHECK (user_has_business_access(business_id));
CREATE POLICY business_invoices_select ON public.business_invoices AS PERMISSIVE FOR r TO authenticated USING (user_has_business_access(business_id));
CREATE POLICY business_invoices_update ON public.business_invoices AS PERMISSIVE FOR w TO authenticated USING (user_has_business_access(business_id)) WITH CHECK (user_has_business_access(business_id));
ALTER TABLE public.business_invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY business_members_insert ON public.business_members AS PERMISSIVE FOR a TO authenticated WITH CHECK (((business_id IN ( SELECT business_profiles.id
   FROM business_profiles
  WHERE (business_profiles.owner_user_id = auth.uid()))) OR (business_id IN ( SELECT bm2.business_id
   FROM business_members bm2
  WHERE ((bm2.user_id = auth.uid()) AND (bm2.role = ANY (ARRAY['OWNER'::business_member_role, 'ADMIN'::business_member_role])) AND (bm2.is_active = true))))));
CREATE POLICY business_members_select ON public.business_members AS PERMISSIVE FOR r TO authenticated USING (((user_id = auth.uid()) OR (business_id IN ( SELECT business_profiles.id
   FROM business_profiles
  WHERE (business_profiles.owner_user_id = auth.uid()))) OR (business_id IN ( SELECT bm2.business_id
   FROM business_members bm2
  WHERE ((bm2.user_id = auth.uid()) AND (bm2.is_active = true))))));
CREATE POLICY business_members_update ON public.business_members AS PERMISSIVE FOR w TO authenticated USING (((business_id IN ( SELECT bp.id
   FROM business_profiles bp
  WHERE (bp.owner_user_id = auth.uid()))) OR (business_id IN ( SELECT bm2.business_id
   FROM business_members bm2
  WHERE ((bm2.user_id = auth.uid()) AND (bm2.role = ANY (ARRAY['OWNER'::business_member_role, 'ADMIN'::business_member_role])) AND (bm2.is_active = true)))))) WITH CHECK (((business_id IN ( SELECT bp.id
   FROM business_profiles bp
  WHERE (bp.owner_user_id = auth.uid()))) OR (business_id IN ( SELECT bm2.business_id
   FROM business_members bm2
  WHERE ((bm2.user_id = auth.uid()) AND (bm2.role = ANY (ARRAY['OWNER'::business_member_role, 'ADMIN'::business_member_role])) AND (bm2.is_active = true))))));
ALTER TABLE public.business_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY business_orders_insert ON public.business_orders AS PERMISSIVE FOR a TO authenticated WITH CHECK (user_has_business_access(business_id));
CREATE POLICY business_orders_select ON public.business_orders AS PERMISSIVE FOR r TO authenticated USING (user_has_business_access(business_id));
CREATE POLICY business_orders_update ON public.business_orders AS PERMISSIVE FOR w TO authenticated USING (user_has_business_access(business_id)) WITH CHECK (user_has_business_access(business_id));
ALTER TABLE public.business_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY business_product_categories_insert ON public.business_product_categories AS PERMISSIVE FOR a TO authenticated WITH CHECK (user_has_business_access(business_id));
CREATE POLICY business_product_categories_select ON public.business_product_categories AS PERMISSIVE FOR r TO authenticated USING (user_has_business_access(business_id));
ALTER TABLE public.business_product_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY business_products_insert ON public.business_products AS PERMISSIVE FOR a TO authenticated WITH CHECK (user_has_business_access(business_id));
CREATE POLICY business_products_select ON public.business_products AS PERMISSIVE FOR r TO authenticated USING (user_has_business_access(business_id));
CREATE POLICY business_products_update ON public.business_products AS PERMISSIVE FOR w TO authenticated USING (user_has_business_access(business_id)) WITH CHECK (user_has_business_access(business_id));
ALTER TABLE public.business_products ENABLE ROW LEVEL SECURITY;
CREATE POLICY business_profiles_insert ON public.business_profiles AS PERMISSIVE FOR a TO authenticated WITH CHECK ((owner_user_id = auth.uid()));
CREATE POLICY business_profiles_select ON public.business_profiles AS PERMISSIVE FOR r TO unknown (OID=0) USING (((owner_user_id = auth.uid()) OR (id IN ( SELECT business_members.business_id
   FROM business_members
  WHERE ((business_members.user_id = auth.uid()) AND (business_members.is_active = true)))) OR (is_public = true)));
CREATE POLICY business_profiles_update ON public.business_profiles AS PERMISSIVE FOR w TO authenticated USING (((owner_user_id = auth.uid()) OR (id IN ( SELECT bm.business_id
   FROM business_members bm
  WHERE ((bm.user_id = auth.uid()) AND (bm.role = ANY (ARRAY['OWNER'::business_member_role, 'ADMIN'::business_member_role, 'MANAGER'::business_member_role])) AND (bm.is_active = true)))))) WITH CHECK (((owner_user_id = auth.uid()) OR (id IN ( SELECT bm.business_id
   FROM business_members bm
  WHERE ((bm.user_id = auth.uid()) AND (bm.role = ANY (ARRAY['OWNER'::business_member_role, 'ADMIN'::business_member_role, 'MANAGER'::business_member_role])) AND (bm.is_active = true))))));
ALTER TABLE public.business_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY business_sale_items_insert ON public.business_sale_items AS PERMISSIVE FOR a TO authenticated WITH CHECK ((sale_id IN ( SELECT bs.id
   FROM business_sales bs
  WHERE user_has_business_access(bs.business_id))));
CREATE POLICY business_sale_items_select ON public.business_sale_items AS PERMISSIVE FOR r TO authenticated USING ((sale_id IN ( SELECT bs.id
   FROM business_sales bs
  WHERE user_has_business_access(bs.business_id))));
ALTER TABLE public.business_sale_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY business_sales_insert ON public.business_sales AS PERMISSIVE FOR a TO authenticated WITH CHECK (user_has_business_access(business_id));
CREATE POLICY business_sales_select ON public.business_sales AS PERMISSIVE FOR r TO authenticated USING (user_has_business_access(business_id));
CREATE POLICY business_sales_update ON public.business_sales AS PERMISSIVE FOR w TO authenticated USING (user_has_business_access(business_id)) WITH CHECK (user_has_business_access(business_id));
ALTER TABLE public.business_sales ENABLE ROW LEVEL SECURITY;
CREATE POLICY business_suppliers_insert ON public.business_suppliers AS PERMISSIVE FOR a TO authenticated WITH CHECK (user_has_business_access(business_id));
CREATE POLICY business_suppliers_select ON public.business_suppliers AS PERMISSIVE FOR r TO authenticated USING (user_has_business_access(business_id));
CREATE POLICY business_suppliers_update ON public.business_suppliers AS PERMISSIVE FOR w TO authenticated USING (user_has_business_access(business_id)) WITH CHECK (user_has_business_access(business_id));
ALTER TABLE public.business_suppliers ENABLE ROW LEVEL SECURITY;
CREATE POLICY cashback_accounts_owner_select ON public.cashback_accounts AS PERMISSIVE FOR r TO unknown (OID=0) USING ((auth.uid() = user_id));
ALTER TABLE public.cashback_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY cashback_transactions_owner_select ON public.cashback_transactions AS PERMISSIVE FOR r TO unknown (OID=0) USING ((cashback_account_id IN ( SELECT cashback_accounts.id
   FROM cashback_accounts
  WHERE (cashback_accounts.user_id = auth.uid()))));
ALTER TABLE public.cashback_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY countries_public_read ON public.countries AS PERMISSIVE FOR r TO unknown (OID=0) USING (true);
ALTER TABLE public.countries ENABLE ROW LEVEL SECURITY;
CREATE POLICY crm_appointments_delete ON public.crm_appointments AS PERMISSIVE FOR d TO authenticated USING (crm_is_business_privileged(business_id));
CREATE POLICY crm_appointments_insert ON public.crm_appointments AS PERMISSIVE FOR a TO authenticated WITH CHECK (user_has_business_access(business_id));
CREATE POLICY crm_appointments_select ON public.crm_appointments AS PERMISSIVE FOR r TO authenticated USING (user_has_business_access(business_id));
CREATE POLICY crm_appointments_update ON public.crm_appointments AS PERMISSIVE FOR w TO authenticated USING (user_has_business_access(business_id)) WITH CHECK (user_has_business_access(business_id));
ALTER TABLE public.crm_appointments ENABLE ROW LEVEL SECURITY;
CREATE POLICY crm_collection_insert ON public.crm_collection_activities AS PERMISSIVE FOR a TO authenticated WITH CHECK ((user_has_business_access(business_id) AND (actor_user_id = auth.uid())));
CREATE POLICY crm_collection_select ON public.crm_collection_activities AS PERMISSIVE FOR r TO authenticated USING (user_has_business_access(business_id));
ALTER TABLE public.crm_collection_activities ENABLE ROW LEVEL SECURITY;
CREATE POLICY crm_commission_rules_select ON public.crm_commission_rules AS PERMISSIVE FOR r TO authenticated USING (user_has_business_access(business_id));
CREATE POLICY crm_commission_rules_update ON public.crm_commission_rules AS PERMISSIVE FOR w TO authenticated USING (crm_is_business_privileged(business_id)) WITH CHECK (crm_is_business_privileged(business_id));
CREATE POLICY crm_commission_rules_write ON public.crm_commission_rules AS PERMISSIVE FOR a TO authenticated WITH CHECK (crm_is_business_privileged(business_id));
ALTER TABLE public.crm_commission_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY crm_commissions_privileged_update ON public.crm_commissions AS PERMISSIVE FOR w TO authenticated USING (crm_is_business_privileged(business_id)) WITH CHECK (crm_is_business_privileged(business_id));
CREATE POLICY crm_commissions_privileged_write ON public.crm_commissions AS PERMISSIVE FOR a TO authenticated WITH CHECK (crm_is_business_privileged(business_id));
CREATE POLICY crm_commissions_select ON public.crm_commissions AS PERMISSIVE FOR r TO authenticated USING ((crm_is_business_privileged(business_id) OR crm_prospect_is_mine(prospecteur_id)));
ALTER TABLE public.crm_commissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY crm_credit_terms_select ON public.crm_credit_terms AS PERMISSIVE FOR r TO authenticated USING (user_has_business_access(business_id));
CREATE POLICY crm_credit_terms_update ON public.crm_credit_terms AS PERMISSIVE FOR w TO authenticated USING (crm_is_business_privileged(business_id)) WITH CHECK (crm_is_business_privileged(business_id));
CREATE POLICY crm_credit_terms_write ON public.crm_credit_terms AS PERMISSIVE FOR a TO authenticated WITH CHECK (crm_is_business_privileged(business_id));
ALTER TABLE public.crm_credit_terms ENABLE ROW LEVEL SECURITY;
CREATE POLICY crm_documents_delete ON public.crm_documents AS PERMISSIVE FOR d TO authenticated USING ((crm_is_business_privileged(business_id) OR (uploaded_by = auth.uid())));
CREATE POLICY crm_documents_insert ON public.crm_documents AS PERMISSIVE FOR a TO authenticated WITH CHECK ((user_has_business_access(business_id) AND (uploaded_by = auth.uid())));
CREATE POLICY crm_documents_select ON public.crm_documents AS PERMISSIVE FOR r TO authenticated USING (user_has_business_access(business_id));
ALTER TABLE public.crm_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY crm_schedules_privileged_write ON public.crm_payment_schedules AS PERMISSIVE FOR a TO authenticated WITH CHECK (crm_is_business_privileged(business_id));
CREATE POLICY crm_schedules_select ON public.crm_payment_schedules AS PERMISSIVE FOR r TO authenticated USING (user_has_business_access(business_id));
ALTER TABLE public.crm_payment_schedules ENABLE ROW LEVEL SECURITY;
CREATE POLICY crm_payments_privileged_insert ON public.crm_payments AS PERMISSIVE FOR a TO authenticated WITH CHECK (crm_is_business_privileged(business_id));
CREATE POLICY crm_payments_select ON public.crm_payments AS PERMISSIVE FOR r TO authenticated USING (user_has_business_access(business_id));
ALTER TABLE public.crm_payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY crm_activities_insert ON public.crm_prospect_activities AS PERMISSIVE FOR a TO authenticated WITH CHECK ((user_has_business_access(business_id) AND (actor_user_id = auth.uid())));
CREATE POLICY crm_activities_select ON public.crm_prospect_activities AS PERMISSIVE FOR r TO authenticated USING (user_has_business_access(business_id));
CREATE POLICY crm_activities_update ON public.crm_prospect_activities AS PERMISSIVE FOR w TO authenticated USING ((crm_is_business_privileged(business_id) OR (actor_user_id = auth.uid()))) WITH CHECK ((crm_is_business_privileged(business_id) OR (actor_user_id = auth.uid())));
ALTER TABLE public.crm_prospect_activities ENABLE ROW LEVEL SECURITY;
CREATE POLICY crm_prospecteur_stocks_privileged_update ON public.crm_prospecteur_stocks AS PERMISSIVE FOR w TO authenticated USING (crm_is_business_privileged(business_id)) WITH CHECK (crm_is_business_privileged(business_id));
CREATE POLICY crm_prospecteur_stocks_privileged_write ON public.crm_prospecteur_stocks AS PERMISSIVE FOR a TO authenticated WITH CHECK (crm_is_business_privileged(business_id));
CREATE POLICY crm_prospecteur_stocks_select ON public.crm_prospecteur_stocks AS PERMISSIVE FOR r TO authenticated USING (user_has_business_access(business_id));
ALTER TABLE public.crm_prospecteur_stocks ENABLE ROW LEVEL SECURITY;
CREATE POLICY crm_prospecteurs_delete ON public.crm_prospecteurs AS PERMISSIVE FOR d TO authenticated USING (crm_is_business_privileged(business_id));
CREATE POLICY crm_prospecteurs_select ON public.crm_prospecteurs AS PERMISSIVE FOR r TO authenticated USING (user_has_business_access(business_id));
CREATE POLICY crm_prospecteurs_update ON public.crm_prospecteurs AS PERMISSIVE FOR w TO authenticated USING (crm_is_business_privileged(business_id)) WITH CHECK (crm_is_business_privileged(business_id));
CREATE POLICY crm_prospecteurs_write ON public.crm_prospecteurs AS PERMISSIVE FOR a TO authenticated WITH CHECK (crm_is_business_privileged(business_id));
ALTER TABLE public.crm_prospecteurs ENABLE ROW LEVEL SECURITY;
CREATE POLICY crm_prospects_delete ON public.crm_prospects AS PERMISSIVE FOR d TO authenticated USING (crm_is_business_privileged(business_id));
CREATE POLICY crm_prospects_insert ON public.crm_prospects AS PERMISSIVE FOR a TO authenticated WITH CHECK (user_has_business_access(business_id));
CREATE POLICY crm_prospects_select ON public.crm_prospects AS PERMISSIVE FOR r TO authenticated USING ((crm_is_business_privileged(business_id) OR crm_prospect_is_mine(assigned_prospecteur_id)));
CREATE POLICY crm_prospects_update ON public.crm_prospects AS PERMISSIVE FOR w TO authenticated USING ((crm_is_business_privileged(business_id) OR crm_prospect_is_mine(assigned_prospecteur_id))) WITH CHECK ((crm_is_business_privileged(business_id) OR crm_prospect_is_mine(assigned_prospecteur_id)));
ALTER TABLE public.crm_prospects ENABLE ROW LEVEL SECURITY;
CREATE POLICY crm_stock_movements_privileged_insert ON public.crm_stock_movements AS PERMISSIVE FOR a TO authenticated WITH CHECK (crm_is_business_privileged(business_id));
CREATE POLICY crm_stock_movements_select ON public.crm_stock_movements AS PERMISSIVE FOR r TO authenticated USING (user_has_business_access(business_id));
ALTER TABLE public.crm_stock_movements ENABLE ROW LEVEL SECURITY;
CREATE POLICY crm_targets_select ON public.crm_targets AS PERMISSIVE FOR r TO authenticated USING ((crm_is_business_privileged(business_id) OR crm_prospect_is_mine(prospecteur_id)));
CREATE POLICY crm_targets_update ON public.crm_targets AS PERMISSIVE FOR w TO authenticated USING (crm_is_business_privileged(business_id)) WITH CHECK (crm_is_business_privileged(business_id));
CREATE POLICY crm_targets_write ON public.crm_targets AS PERMISSIVE FOR a TO authenticated WITH CHECK (crm_is_business_privileged(business_id));
ALTER TABLE public.crm_targets ENABLE ROW LEVEL SECURITY;
CREATE POLICY currencies_public_read ON public.currencies AS PERMISSIVE FOR r TO unknown (OID=0) USING (true);
ALTER TABLE public.currencies ENABLE ROW LEVEL SECURITY;
CREATE POLICY energy_assets_access ON public.energy_assets AS PERMISSIVE FOR * TO authenticated USING ((is_super_admin() OR (EXISTS ( SELECT 1
   FROM energy_sites s
  WHERE ((s.id = energy_assets.site_id) AND ((s.owner_user_id = auth.uid()) OR is_org_member(s.organization_id))))))) WITH CHECK ((is_super_admin() OR (EXISTS ( SELECT 1
   FROM energy_sites s
  WHERE ((s.id = energy_assets.site_id) AND ((s.owner_user_id = auth.uid()) OR is_org_admin(s.organization_id)))))));
ALTER TABLE public.energy_assets ENABLE ROW LEVEL SECURITY;
CREATE POLICY energy_billing_access ON public.energy_billing_records AS PERMISSIVE FOR * TO authenticated USING ((is_super_admin() OR (EXISTS ( SELECT 1
   FROM energy_sites s
  WHERE ((s.id = energy_billing_records.site_id) AND ((s.owner_user_id = auth.uid()) OR is_org_member(s.organization_id))))))) WITH CHECK ((is_super_admin() OR (EXISTS ( SELECT 1
   FROM energy_sites s
  WHERE ((s.id = energy_billing_records.site_id) AND ((s.owner_user_id = auth.uid()) OR is_org_admin(s.organization_id)))))));
ALTER TABLE public.energy_billing_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY energy_readings_access ON public.energy_meter_readings AS PERMISSIVE FOR * TO authenticated USING ((is_super_admin() OR (recorded_by = auth.uid()) OR (EXISTS ( SELECT 1
   FROM energy_sites s
  WHERE ((s.id = energy_meter_readings.site_id) AND ((s.owner_user_id = auth.uid()) OR is_org_member(s.organization_id))))))) WITH CHECK ((is_super_admin() OR (recorded_by = auth.uid()) OR (EXISTS ( SELECT 1
   FROM energy_sites s
  WHERE ((s.id = energy_meter_readings.site_id) AND ((s.owner_user_id = auth.uid()) OR is_org_admin(s.organization_id)))))));
ALTER TABLE public.energy_meter_readings ENABLE ROW LEVEL SECURITY;
CREATE POLICY energy_providers_access ON public.energy_providers AS PERMISSIVE FOR * TO authenticated USING ((is_super_admin() OR is_org_member(organization_id))) WITH CHECK ((is_super_admin() OR is_org_admin(organization_id)));
ALTER TABLE public.energy_providers ENABLE ROW LEVEL SECURITY;
CREATE POLICY energy_sites_access ON public.energy_sites AS PERMISSIVE FOR * TO authenticated USING ((is_super_admin() OR (owner_user_id = auth.uid()) OR is_org_member(organization_id))) WITH CHECK ((is_super_admin() OR (owner_user_id = auth.uid()) OR is_org_admin(organization_id)));
ALTER TABLE public.energy_sites ENABLE ROW LEVEL SECURITY;
CREATE POLICY exchange_rates_public_read ON public.exchange_rates AS PERMISSIVE FOR r TO unknown (OID=0) USING (true);
ALTER TABLE public.exchange_rates ENABLE ROW LEVEL SECURITY;
CREATE POLICY exchange_transactions_owner_insert ON public.exchange_transactions AS PERMISSIVE FOR a TO unknown (OID=0) WITH CHECK ((auth.uid() = user_id));
CREATE POLICY exchange_transactions_owner_select ON public.exchange_transactions AS PERMISSIVE FOR r TO unknown (OID=0) USING ((auth.uid() = user_id));
ALTER TABLE public.exchange_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY fee_rules_authenticated_read ON public.fee_rules AS PERMISSIVE FOR r TO unknown (OID=0) USING (((auth.uid() IS NOT NULL) AND (is_active = true)));
ALTER TABLE public.fee_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY health_appointments_access ON public.health_appointments AS PERMISSIVE FOR r TO authenticated USING ((is_super_admin() OR (patient_user_id = ( SELECT auth.uid() AS uid)) OR user_has_business_access(business_id) OR (EXISTS ( SELECT 1
   FROM health_professionals hp
  WHERE ((hp.id = health_appointments.professional_id) AND (hp.user_id = ( SELECT auth.uid() AS uid)))))));
CREATE POLICY health_appointments_insert ON public.health_appointments AS PERMISSIVE FOR a TO authenticated WITH CHECK ((is_super_admin() OR (patient_user_id = ( SELECT auth.uid() AS uid)) OR user_has_business_access(business_id)));
CREATE POLICY health_appointments_select ON public.health_appointments AS PERMISSIVE FOR r TO authenticated USING (((patient_user_id = auth.uid()) OR (EXISTS ( SELECT 1
   FROM health_professionals p
  WHERE ((p.id = health_appointments.professional_id) AND (p.user_id = auth.uid())))) OR user_has_business_access(business_id) OR is_super_admin()));
CREATE POLICY health_appointments_update ON public.health_appointments AS PERMISSIVE FOR w TO authenticated USING ((is_super_admin() OR (patient_user_id = ( SELECT auth.uid() AS uid)) OR user_has_business_access(business_id) OR (EXISTS ( SELECT 1
   FROM health_professionals hp
  WHERE ((hp.id = health_appointments.professional_id) AND (hp.user_id = ( SELECT auth.uid() AS uid))))))) WITH CHECK ((is_super_admin() OR (patient_user_id = ( SELECT auth.uid() AS uid)) OR user_has_business_access(business_id) OR (EXISTS ( SELECT 1
   FROM health_professionals hp
  WHERE ((hp.id = health_appointments.professional_id) AND (hp.user_id = ( SELECT auth.uid() AS uid)))))));
ALTER TABLE public.health_appointments ENABLE ROW LEVEL SECURITY;
CREATE POLICY health_availabilities_manage ON public.health_availabilities AS PERMISSIVE FOR * TO authenticated USING ((is_super_admin() OR (EXISTS ( SELECT 1
   FROM health_professionals hp
  WHERE ((hp.id = health_availabilities.professional_id) AND user_has_business_access(hp.business_id)))))) WITH CHECK ((is_super_admin() OR (EXISTS ( SELECT 1
   FROM health_professionals hp
  WHERE ((hp.id = health_availabilities.professional_id) AND user_has_business_access(hp.business_id))))));
CREATE POLICY health_availabilities_professional_update ON public.health_availabilities AS PERMISSIVE FOR w TO authenticated USING (((EXISTS ( SELECT 1
   FROM health_professionals p
  WHERE ((p.id = health_availabilities.professional_id) AND (p.user_id = auth.uid())))) OR is_super_admin())) WITH CHECK (((EXISTS ( SELECT 1
   FROM health_professionals p
  WHERE ((p.id = health_availabilities.professional_id) AND (p.user_id = auth.uid())))) OR is_super_admin()));
CREATE POLICY health_availabilities_professional_write ON public.health_availabilities AS PERMISSIVE FOR a TO authenticated WITH CHECK (((EXISTS ( SELECT 1
   FROM health_professionals p
  WHERE ((p.id = health_availabilities.professional_id) AND (p.user_id = auth.uid())))) OR user_has_business_access(( SELECT p.business_id
   FROM health_professionals p
  WHERE (p.id = health_availabilities.professional_id))) OR is_super_admin()));
CREATE POLICY health_availabilities_public_select ON public.health_availabilities AS PERMISSIVE FOR r TO anon, authenticated USING (((is_active = true) AND (EXISTS ( SELECT 1
   FROM health_professionals p
  WHERE ((p.id = health_availabilities.professional_id) AND (p.is_active = true) AND ((p.verification_status)::text = 'verified'::text))))));
ALTER TABLE public.health_availabilities ENABLE ROW LEVEL SECURITY;
CREATE POLICY health_documents_insert ON public.health_documents AS PERMISSIVE FOR a TO unknown (OID=0) WITH CHECK ((uploaded_by = auth.uid()));
CREATE POLICY health_documents_select ON public.health_documents AS PERMISSIVE FOR r TO unknown (OID=0) USING (((owner_user_id = auth.uid()) OR ((business_id IS NOT NULL) AND user_has_business_access(business_id))));
ALTER TABLE public.health_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY health_emergency_contacts_select ON public.health_emergency_contacts AS PERMISSIVE FOR r TO unknown (OID=0) USING (true);
CREATE POLICY health_emergency_contacts_write ON public.health_emergency_contacts AS PERMISSIVE FOR a TO unknown (OID=0) WITH CHECK (is_super_admin());
ALTER TABLE public.health_emergency_contacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY health_home_care_insert ON public.health_home_care_requests AS PERMISSIVE FOR a TO unknown (OID=0) WITH CHECK ((patient_user_id = auth.uid()));
CREATE POLICY health_home_care_select ON public.health_home_care_requests AS PERMISSIVE FOR r TO unknown (OID=0) USING (((patient_user_id = auth.uid()) OR ((business_id IS NOT NULL) AND user_has_business_access(business_id)) OR (EXISTS ( SELECT 1
   FROM health_professionals p
  WHERE ((p.id = health_home_care_requests.professional_id) AND (p.user_id = auth.uid()))))));
CREATE POLICY health_home_care_update ON public.health_home_care_requests AS PERMISSIVE FOR w TO unknown (OID=0) USING (((patient_user_id = auth.uid()) OR ((business_id IS NOT NULL) AND user_has_business_access(business_id))));
ALTER TABLE public.health_home_care_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY health_invoices_select ON public.health_invoices AS PERMISSIVE FOR r TO unknown (OID=0) USING (((patient_user_id = auth.uid()) OR ((business_id IS NOT NULL) AND user_has_business_access(business_id))));
ALTER TABLE public.health_invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY health_lab_orders_insert ON public.health_laboratory_orders AS PERMISSIVE FOR a TO unknown (OID=0) WITH CHECK ((patient_user_id = auth.uid()));
CREATE POLICY health_lab_orders_select ON public.health_laboratory_orders AS PERMISSIVE FOR r TO unknown (OID=0) USING (((patient_user_id = auth.uid()) OR ((business_id IS NOT NULL) AND user_has_business_access(business_id)) OR (EXISTS ( SELECT 1
   FROM health_professionals p
  WHERE ((p.id = health_laboratory_orders.ordering_professional_id) AND (p.user_id = auth.uid()))))));
CREATE POLICY health_lab_orders_update ON public.health_laboratory_orders AS PERMISSIVE FOR w TO unknown (OID=0) USING (((business_id IS NOT NULL) AND user_has_business_access(business_id)));
ALTER TABLE public.health_laboratory_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY health_lab_results_select ON public.health_laboratory_results AS PERMISSIVE FOR r TO unknown (OID=0) USING ((EXISTS ( SELECT 1
   FROM health_laboratory_orders o
  WHERE ((o.id = health_laboratory_results.order_id) AND ((o.patient_user_id = auth.uid()) OR ((o.business_id IS NOT NULL) AND user_has_business_access(o.business_id)) OR (EXISTS ( SELECT 1
           FROM health_professionals p
          WHERE ((p.id = o.ordering_professional_id) AND (p.user_id = auth.uid())))))))));
ALTER TABLE public.health_laboratory_results ENABLE ROW LEVEL SECURITY;
CREATE POLICY health_access_log_select ON public.health_medical_record_access_log AS PERMISSIVE FOR r TO authenticated USING (((accessor_user_id = auth.uid()) OR is_super_admin() OR (EXISTS ( SELECT 1
   FROM health_medical_records r
  WHERE ((r.id = health_medical_record_access_log.record_id) AND (r.patient_user_id = auth.uid()))))));
CREATE POLICY health_medical_record_access_log_insert ON public.health_medical_record_access_log AS PERMISSIVE FOR a TO authenticated WITH CHECK ((is_super_admin() OR (accessor_user_id = ( SELECT auth.uid() AS uid))));
CREATE POLICY health_medical_record_access_log_select ON public.health_medical_record_access_log AS PERMISSIVE FOR r TO authenticated USING ((is_super_admin() OR (accessor_user_id = ( SELECT auth.uid() AS uid)) OR (EXISTS ( SELECT 1
   FROM health_medical_records mr
  WHERE ((mr.id = health_medical_record_access_log.record_id) AND ((mr.patient_user_id = ( SELECT auth.uid() AS uid)) OR user_has_business_access(mr.business_id)))))));
ALTER TABLE public.health_medical_record_access_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY health_medical_records_access ON public.health_medical_records AS PERMISSIVE FOR r TO authenticated USING (((patient_user_id = auth.uid()) OR health_can_access_medical_record(id)));
CREATE POLICY health_medical_records_insert ON public.health_medical_records AS PERMISSIVE FOR a TO authenticated WITH CHECK ((EXISTS ( SELECT 1
   FROM health_professionals p
  WHERE ((p.id = health_medical_records.author_professional_id) AND (p.user_id = auth.uid()) AND (p.is_active = true) AND ((p.verification_status)::text = 'verified'::text) AND ((p.business_id IS NULL) OR (p.business_id = health_medical_records.business_id))))));
CREATE POLICY health_medical_records_select ON public.health_medical_records AS PERMISSIVE FOR r TO authenticated USING (( SELECT health_can_access_medical_record(health_medical_records.id) AS health_can_access_medical_record));
CREATE POLICY health_medical_records_update ON public.health_medical_records AS PERMISSIVE FOR w TO authenticated USING ((is_super_admin() OR (author_professional_id IN ( SELECT health_professionals.id
   FROM health_professionals
  WHERE (health_professionals.user_id = ( SELECT auth.uid() AS uid)))) OR user_has_business_access(business_id))) WITH CHECK ((is_super_admin() OR (author_professional_id IN ( SELECT health_professionals.id
   FROM health_professionals
  WHERE (health_professionals.user_id = ( SELECT auth.uid() AS uid)))) OR user_has_business_access(business_id)));
ALTER TABLE public.health_medical_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY health_consents_select ON public.health_patient_consents AS PERMISSIVE FOR r TO authenticated USING (((patient_user_id = auth.uid()) OR ((grantee_professional_id IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM health_professionals p
  WHERE ((p.id = health_patient_consents.grantee_professional_id) AND (p.user_id = auth.uid()))))) OR ((grantee_business_id IS NOT NULL) AND user_has_business_access(grantee_business_id))));
CREATE POLICY health_patient_consents_access ON public.health_patient_consents AS PERMISSIVE FOR r TO authenticated USING ((is_super_admin() OR (patient_user_id = ( SELECT auth.uid() AS uid)) OR (grantee_professional_id IN ( SELECT health_professionals.id
   FROM health_professionals
  WHERE (health_professionals.user_id = ( SELECT auth.uid() AS uid)))) OR user_has_business_access(grantee_business_id)));
CREATE POLICY health_patient_consents_insert ON public.health_patient_consents AS PERMISSIVE FOR a TO authenticated WITH CHECK ((is_super_admin() OR (patient_user_id = ( SELECT auth.uid() AS uid))));
CREATE POLICY health_patient_consents_update ON public.health_patient_consents AS PERMISSIVE FOR w TO authenticated USING ((is_super_admin() OR (patient_user_id = ( SELECT auth.uid() AS uid)))) WITH CHECK ((is_super_admin() OR (patient_user_id = ( SELECT auth.uid() AS uid))));
ALTER TABLE public.health_patient_consents ENABLE ROW LEVEL SECURITY;
CREATE POLICY health_prescription_items_select ON public.health_prescription_items AS PERMISSIVE FOR r TO unknown (OID=0) USING ((EXISTS ( SELECT 1
   FROM health_prescriptions pr
  WHERE ((pr.id = health_prescription_items.prescription_id) AND ((pr.patient_user_id = auth.uid()) OR (EXISTS ( SELECT 1
           FROM health_professionals p
          WHERE ((p.id = pr.prescriber_professional_id) AND (p.user_id = auth.uid())))))))));
ALTER TABLE public.health_prescription_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY health_prescriptions_select ON public.health_prescriptions AS PERMISSIVE FOR r TO unknown (OID=0) USING (((patient_user_id = auth.uid()) OR (EXISTS ( SELECT 1
   FROM health_professionals p
  WHERE ((p.id = health_prescriptions.prescriber_professional_id) AND (p.user_id = auth.uid()))))));
ALTER TABLE public.health_prescriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY health_professionals_business_manage ON public.health_professionals AS PERMISSIVE FOR * TO authenticated USING ((is_super_admin() OR user_has_business_access(business_id) OR ((is_active = true) AND ((verification_status)::text = 'verified'::text)))) WITH CHECK ((is_super_admin() OR user_has_business_access(business_id)));
CREATE POLICY health_professionals_business_select ON public.health_professionals AS PERMISSIVE FOR r TO authenticated USING (((user_id = auth.uid()) OR user_has_business_access(business_id) OR is_super_admin()));
CREATE POLICY health_professionals_business_update ON public.health_professionals AS PERMISSIVE FOR w TO authenticated USING (((user_id = auth.uid()) OR user_has_business_access(business_id) OR is_super_admin())) WITH CHECK (((user_id = auth.uid()) OR user_has_business_access(business_id) OR is_super_admin()));
CREATE POLICY health_professionals_insert ON public.health_professionals AS PERMISSIVE FOR a TO authenticated WITH CHECK (((user_id = auth.uid()) OR user_has_business_access(business_id) OR is_super_admin()));
CREATE POLICY health_professionals_public_read ON public.health_professionals AS PERMISSIVE FOR r TO anon USING (((is_active = true) AND ((verification_status)::text = 'verified'::text)));
CREATE POLICY health_professionals_public_select ON public.health_professionals AS PERMISSIVE FOR r TO anon, authenticated USING (((is_active = true) AND ((verification_status)::text = 'verified'::text)));
ALTER TABLE public.health_professionals ENABLE ROW LEVEL SECURITY;
CREATE POLICY health_provider_profiles_business_insert ON public.health_provider_profiles AS PERMISSIVE FOR a TO authenticated WITH CHECK ((user_has_business_access(business_id) OR is_super_admin()));
CREATE POLICY health_provider_profiles_business_manage ON public.health_provider_profiles AS PERMISSIVE FOR * TO authenticated USING ((is_super_admin() OR user_has_business_access(business_id) OR ((is_public = true) AND ((verification_status)::text = 'verified'::text)))) WITH CHECK ((is_super_admin() OR user_has_business_access(business_id)));
CREATE POLICY health_provider_profiles_business_update ON public.health_provider_profiles AS PERMISSIVE FOR w TO authenticated USING ((user_has_business_access(business_id) OR is_super_admin())) WITH CHECK ((user_has_business_access(business_id) OR is_super_admin()));
CREATE POLICY health_provider_profiles_public_read ON public.health_provider_profiles AS PERMISSIVE FOR r TO anon USING (((is_public = true) AND ((verification_status)::text = 'verified'::text)));
CREATE POLICY health_provider_profiles_public_select ON public.health_provider_profiles AS PERMISSIVE FOR r TO anon, authenticated USING ((is_public = true));
ALTER TABLE public.health_provider_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY health_reviews_insert ON public.health_reviews AS PERMISSIVE FOR a TO unknown (OID=0) WITH CHECK (((reviewer_user_id = auth.uid()) AND (EXISTS ( SELECT 1
   FROM health_appointments a
  WHERE ((a.id = health_reviews.appointment_id) AND (a.patient_user_id = auth.uid()))))));
CREATE POLICY health_reviews_select ON public.health_reviews AS PERMISSIVE FOR r TO unknown (OID=0) USING (((review_status = 'published'::text) OR (reviewer_user_id = auth.uid()) OR is_super_admin()));
ALTER TABLE public.health_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY health_services_business_manage ON public.health_services AS PERMISSIVE FOR * TO authenticated USING ((is_super_admin() OR user_has_business_access(business_id) OR (is_active = true))) WITH CHECK ((is_super_admin() OR user_has_business_access(business_id)));
CREATE POLICY health_services_business_select ON public.health_services AS PERMISSIVE FOR r TO authenticated USING ((user_has_business_access(business_id) OR is_super_admin()));
CREATE POLICY health_services_business_update ON public.health_services AS PERMISSIVE FOR w TO authenticated USING ((user_has_business_access(business_id) OR is_super_admin())) WITH CHECK ((user_has_business_access(business_id) OR is_super_admin()));
CREATE POLICY health_services_business_write ON public.health_services AS PERMISSIVE FOR a TO authenticated WITH CHECK ((user_has_business_access(business_id) OR is_super_admin()));
CREATE POLICY health_services_public_read ON public.health_services AS PERMISSIVE FOR r TO anon USING ((is_active = true));
CREATE POLICY health_services_public_select ON public.health_services AS PERMISSIVE FOR r TO anon, authenticated USING ((is_active = true));
ALTER TABLE public.health_services ENABLE ROW LEVEL SECURITY;
CREATE POLICY health_specialties_admin_manage ON public.health_specialties AS PERMISSIVE FOR * TO authenticated USING ((is_super_admin() OR (is_active = true))) WITH CHECK (is_super_admin());
CREATE POLICY health_specialties_public_read ON public.health_specialties AS PERMISSIVE FOR r TO anon USING ((is_active = true));
CREATE POLICY health_specialties_public_select ON public.health_specialties AS PERMISSIVE FOR r TO anon, authenticated USING ((is_active = true));
ALTER TABLE public.health_specialties ENABLE ROW LEVEL SECURITY;
CREATE POLICY health_verification_select ON public.health_verification_records AS PERMISSIVE FOR r TO unknown (OID=0) USING ((is_super_admin() OR ((target_type = 'professional'::text) AND (EXISTS ( SELECT 1
   FROM health_professionals p
  WHERE ((p.id = health_verification_records.target_id) AND (p.user_id = auth.uid()))))) OR ((target_type = 'provider'::text) AND (EXISTS ( SELECT 1
   FROM health_provider_profiles pp
  WHERE ((pp.id = health_verification_records.target_id) AND user_has_business_access(pp.business_id)))))));
CREATE POLICY health_verification_write ON public.health_verification_records AS PERMISSIVE FOR a TO unknown (OID=0) WITH CHECK (is_super_admin());
ALTER TABLE public.health_verification_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY immo_agencies_select ON public.immo_agencies AS PERMISSIVE FOR r TO authenticated USING (true);
CREATE POLICY immo_agencies_update ON public.immo_agencies AS PERMISSIVE FOR w TO authenticated USING (user_has_business_access(business_id)) WITH CHECK (user_has_business_access(business_id));
CREATE POLICY immo_agencies_write ON public.immo_agencies AS PERMISSIVE FOR a TO authenticated WITH CHECK (user_has_business_access(business_id));
ALTER TABLE public.immo_agencies ENABLE ROW LEVEL SECURITY;
CREATE POLICY immo_agents_select ON public.immo_agents AS PERMISSIVE FOR r TO authenticated USING (true);
CREATE POLICY immo_agents_update ON public.immo_agents AS PERMISSIVE FOR w TO authenticated USING (user_has_business_access(business_id)) WITH CHECK (user_has_business_access(business_id));
CREATE POLICY immo_agents_write ON public.immo_agents AS PERMISSIVE FOR a TO authenticated WITH CHECK (user_has_business_access(business_id));
ALTER TABLE public.immo_agents ENABLE ROW LEVEL SECURITY;
CREATE POLICY immo_appointments_insert ON public.immo_appointments AS PERMISSIVE FOR a TO authenticated WITH CHECK ((requester_user_id = auth.uid()));
CREATE POLICY immo_appointments_select ON public.immo_appointments AS PERMISSIVE FOR r TO authenticated USING (((requester_user_id = auth.uid()) OR (EXISTS ( SELECT 1
   FROM immo_properties p
  WHERE ((p.id = immo_appointments.property_id) AND ((p.owner_user_id = auth.uid()) OR ((p.business_id IS NOT NULL) AND user_has_business_access(p.business_id))))))));
CREATE POLICY immo_appointments_update ON public.immo_appointments AS PERMISSIVE FOR w TO authenticated USING (((requester_user_id = auth.uid()) OR (EXISTS ( SELECT 1
   FROM immo_properties p
  WHERE ((p.id = immo_appointments.property_id) AND ((p.owner_user_id = auth.uid()) OR ((p.business_id IS NOT NULL) AND user_has_business_access(p.business_id)))))))) WITH CHECK (((requester_user_id = auth.uid()) OR (EXISTS ( SELECT 1
   FROM immo_properties p
  WHERE ((p.id = immo_appointments.property_id) AND ((p.owner_user_id = auth.uid()) OR ((p.business_id IS NOT NULL) AND user_has_business_access(p.business_id))))))));
ALTER TABLE public.immo_appointments ENABLE ROW LEVEL SECURITY;
CREATE POLICY immo_commissions_select ON public.immo_commissions AS PERMISSIVE FOR r TO authenticated USING ((user_has_business_access(business_id) OR (EXISTS ( SELECT 1
   FROM immo_agents a
  WHERE ((a.id = immo_commissions.agent_id) AND (a.user_id = auth.uid()))))));
CREATE POLICY immo_commissions_write ON public.immo_commissions AS PERMISSIVE FOR a TO authenticated WITH CHECK (user_has_business_access(business_id));
ALTER TABLE public.immo_commissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY immo_developers_select ON public.immo_developers AS PERMISSIVE FOR r TO authenticated USING (true);
CREATE POLICY immo_developers_update ON public.immo_developers AS PERMISSIVE FOR w TO authenticated USING (user_has_business_access(business_id)) WITH CHECK (user_has_business_access(business_id));
CREATE POLICY immo_developers_write ON public.immo_developers AS PERMISSIVE FOR a TO authenticated WITH CHECK (user_has_business_access(business_id));
ALTER TABLE public.immo_developers ENABLE ROW LEVEL SECURITY;
CREATE POLICY immo_documents_insert ON public.immo_documents AS PERMISSIVE FOR a TO authenticated WITH CHECK ((uploaded_by = auth.uid()));
CREATE POLICY immo_documents_select ON public.immo_documents AS PERMISSIVE FOR r TO authenticated USING (((is_public = true) OR (uploaded_by = auth.uid()) OR ((property_id IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM immo_properties p
  WHERE ((p.id = immo_documents.property_id) AND ((p.owner_user_id = auth.uid()) OR ((p.business_id IS NOT NULL) AND user_has_business_access(p.business_id))))))) OR ((lease_id IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM immo_leases l
  WHERE ((l.id = immo_documents.lease_id) AND ((l.tenant_user_id = auth.uid()) OR (l.landlord_user_id = auth.uid()) OR ((l.landlord_business_id IS NOT NULL) AND user_has_business_access(l.landlord_business_id)))))))));
ALTER TABLE public.immo_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY immo_favorites_delete ON public.immo_favorites AS PERMISSIVE FOR d TO authenticated USING ((user_id = auth.uid()));
CREATE POLICY immo_favorites_insert ON public.immo_favorites AS PERMISSIVE FOR a TO authenticated WITH CHECK ((user_id = auth.uid()));
CREATE POLICY immo_favorites_select ON public.immo_favorites AS PERMISSIVE FOR r TO authenticated USING ((user_id = auth.uid()));
ALTER TABLE public.immo_favorites ENABLE ROW LEVEL SECURITY;
CREATE POLICY immo_leases_select ON public.immo_leases AS PERMISSIVE FOR r TO authenticated USING (((tenant_user_id = auth.uid()) OR (landlord_user_id = auth.uid()) OR ((landlord_business_id IS NOT NULL) AND user_has_business_access(landlord_business_id))));
CREATE POLICY immo_leases_update ON public.immo_leases AS PERMISSIVE FOR w TO authenticated USING (((landlord_user_id = auth.uid()) OR ((landlord_business_id IS NOT NULL) AND user_has_business_access(landlord_business_id)))) WITH CHECK (((landlord_user_id = auth.uid()) OR ((landlord_business_id IS NOT NULL) AND user_has_business_access(landlord_business_id))));
CREATE POLICY immo_leases_write ON public.immo_leases AS PERMISSIVE FOR a TO authenticated WITH CHECK (((landlord_user_id = auth.uid()) OR ((landlord_business_id IS NOT NULL) AND user_has_business_access(landlord_business_id))));
ALTER TABLE public.immo_leases ENABLE ROW LEVEL SECURITY;
CREATE POLICY immo_offers_insert ON public.immo_offers AS PERMISSIVE FOR a TO authenticated WITH CHECK ((buyer_user_id = auth.uid()));
CREATE POLICY immo_offers_select ON public.immo_offers AS PERMISSIVE FOR r TO authenticated USING (((buyer_user_id = auth.uid()) OR (EXISTS ( SELECT 1
   FROM immo_properties p
  WHERE ((p.id = immo_offers.property_id) AND ((p.owner_user_id = auth.uid()) OR ((p.business_id IS NOT NULL) AND user_has_business_access(p.business_id))))))));
CREATE POLICY immo_offers_update ON public.immo_offers AS PERMISSIVE FOR w TO authenticated USING (((buyer_user_id = auth.uid()) OR (EXISTS ( SELECT 1
   FROM immo_properties p
  WHERE ((p.id = immo_offers.property_id) AND ((p.owner_user_id = auth.uid()) OR ((p.business_id IS NOT NULL) AND user_has_business_access(p.business_id)))))))) WITH CHECK (((buyer_user_id = auth.uid()) OR (EXISTS ( SELECT 1
   FROM immo_properties p
  WHERE ((p.id = immo_offers.property_id) AND ((p.owner_user_id = auth.uid()) OR ((p.business_id IS NOT NULL) AND user_has_business_access(p.business_id))))))));
ALTER TABLE public.immo_offers ENABLE ROW LEVEL SECURITY;
CREATE POLICY immo_project_media_select ON public.immo_project_media AS PERMISSIVE FOR r TO unknown (OID=0) USING (true);
CREATE POLICY immo_project_media_write ON public.immo_project_media AS PERMISSIVE FOR a TO authenticated WITH CHECK ((EXISTS ( SELECT 1
   FROM immo_projects pr
  WHERE ((pr.id = immo_project_media.project_id) AND user_has_business_access(pr.business_id)))));
ALTER TABLE public.immo_project_media ENABLE ROW LEVEL SECURITY;
CREATE POLICY immo_projects_select ON public.immo_projects AS PERMISSIVE FOR r TO unknown (OID=0) USING (true);
CREATE POLICY immo_projects_update ON public.immo_projects AS PERMISSIVE FOR w TO authenticated USING (user_has_business_access(business_id)) WITH CHECK (user_has_business_access(business_id));
CREATE POLICY immo_projects_write ON public.immo_projects AS PERMISSIVE FOR a TO authenticated WITH CHECK (user_has_business_access(business_id));
ALTER TABLE public.immo_projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY immo_properties_delete ON public.immo_properties AS PERMISSIVE FOR d TO authenticated USING (((owner_user_id = auth.uid()) OR ((business_id IS NOT NULL) AND user_has_business_access(business_id))));
CREATE POLICY immo_properties_insert ON public.immo_properties AS PERMISSIVE FOR a TO authenticated WITH CHECK (((owner_user_id = auth.uid()) OR ((business_id IS NOT NULL) AND user_has_business_access(business_id))));
CREATE POLICY immo_properties_select_public ON public.immo_properties AS PERMISSIVE FOR r TO unknown (OID=0) USING (((property_status = 'published'::immo_property_status) OR (owner_user_id = auth.uid()) OR ((business_id IS NOT NULL) AND user_has_business_access(business_id)) OR is_super_admin()));
CREATE POLICY immo_properties_update ON public.immo_properties AS PERMISSIVE FOR w TO authenticated USING (((owner_user_id = auth.uid()) OR ((business_id IS NOT NULL) AND user_has_business_access(business_id)) OR is_super_admin())) WITH CHECK (((owner_user_id = auth.uid()) OR ((business_id IS NOT NULL) AND user_has_business_access(business_id)) OR is_super_admin()));
ALTER TABLE public.immo_properties ENABLE ROW LEVEL SECURITY;
CREATE POLICY immo_property_media_delete ON public.immo_property_media AS PERMISSIVE FOR d TO authenticated USING ((EXISTS ( SELECT 1
   FROM immo_properties p
  WHERE ((p.id = immo_property_media.property_id) AND ((p.owner_user_id = auth.uid()) OR ((p.business_id IS NOT NULL) AND user_has_business_access(p.business_id)))))));
CREATE POLICY immo_property_media_select ON public.immo_property_media AS PERMISSIVE FOR r TO unknown (OID=0) USING ((EXISTS ( SELECT 1
   FROM immo_properties p
  WHERE ((p.id = immo_property_media.property_id) AND ((p.property_status = 'published'::immo_property_status) OR (p.owner_user_id = auth.uid()) OR ((p.business_id IS NOT NULL) AND user_has_business_access(p.business_id)) OR is_super_admin())))));
CREATE POLICY immo_property_media_write ON public.immo_property_media AS PERMISSIVE FOR a TO authenticated WITH CHECK ((EXISTS ( SELECT 1
   FROM immo_properties p
  WHERE ((p.id = immo_property_media.property_id) AND ((p.owner_user_id = auth.uid()) OR ((p.business_id IS NOT NULL) AND user_has_business_access(p.business_id)))))));
ALTER TABLE public.immo_property_media ENABLE ROW LEVEL SECURITY;
CREATE POLICY immo_property_types_select ON public.immo_property_types AS PERMISSIVE FOR r TO unknown (OID=0) USING (true);
ALTER TABLE public.immo_property_types ENABLE ROW LEVEL SECURITY;
CREATE POLICY immo_rent_schedules_select ON public.immo_rent_schedules AS PERMISSIVE FOR r TO authenticated USING ((EXISTS ( SELECT 1
   FROM immo_leases l
  WHERE ((l.id = immo_rent_schedules.lease_id) AND ((l.tenant_user_id = auth.uid()) OR (l.landlord_user_id = auth.uid()) OR ((l.landlord_business_id IS NOT NULL) AND user_has_business_access(l.landlord_business_id)))))));
CREATE POLICY immo_rent_schedules_write ON public.immo_rent_schedules AS PERMISSIVE FOR a TO authenticated WITH CHECK ((EXISTS ( SELECT 1
   FROM immo_leases l
  WHERE ((l.id = immo_rent_schedules.lease_id) AND ((l.landlord_user_id = auth.uid()) OR ((l.landlord_business_id IS NOT NULL) AND user_has_business_access(l.landlord_business_id)))))));
ALTER TABLE public.immo_rent_schedules ENABLE ROW LEVEL SECURITY;
CREATE POLICY immo_reports_insert ON public.immo_reports AS PERMISSIVE FOR a TO authenticated WITH CHECK ((reporter_user_id = auth.uid()));
CREATE POLICY immo_reports_select ON public.immo_reports AS PERMISSIVE FOR r TO authenticated USING (((reporter_user_id = auth.uid()) OR is_super_admin() OR ((agency_business_id IS NOT NULL) AND user_has_business_access(agency_business_id))));
ALTER TABLE public.immo_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY immo_requests_insert ON public.immo_requests AS PERMISSIVE FOR a TO authenticated WITH CHECK ((requester_user_id = auth.uid()));
CREATE POLICY immo_requests_select ON public.immo_requests AS PERMISSIVE FOR r TO authenticated USING (((requester_user_id = auth.uid()) OR ((assigned_business_id IS NOT NULL) AND user_has_business_access(assigned_business_id)) OR is_super_admin()));
CREATE POLICY immo_requests_update ON public.immo_requests AS PERMISSIVE FOR w TO authenticated USING (((requester_user_id = auth.uid()) OR ((assigned_business_id IS NOT NULL) AND user_has_business_access(assigned_business_id)))) WITH CHECK (((requester_user_id = auth.uid()) OR ((assigned_business_id IS NOT NULL) AND user_has_business_access(assigned_business_id))));
ALTER TABLE public.immo_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY immo_reservations_insert ON public.immo_reservations AS PERMISSIVE FOR a TO authenticated WITH CHECK ((client_user_id = auth.uid()));
CREATE POLICY immo_reservations_select ON public.immo_reservations AS PERMISSIVE FOR r TO authenticated USING (((client_user_id = auth.uid()) OR (EXISTS ( SELECT 1
   FROM immo_properties p
  WHERE ((p.id = immo_reservations.property_id) AND ((p.owner_user_id = auth.uid()) OR ((p.business_id IS NOT NULL) AND user_has_business_access(p.business_id))))))));
ALTER TABLE public.immo_reservations ENABLE ROW LEVEL SECURITY;
CREATE POLICY immo_units_select ON public.immo_units AS PERMISSIVE FOR r TO authenticated USING (true);
CREATE POLICY immo_units_update ON public.immo_units AS PERMISSIVE FOR w TO authenticated USING ((EXISTS ( SELECT 1
   FROM immo_projects pr
  WHERE ((pr.id = immo_units.project_id) AND user_has_business_access(pr.business_id))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM immo_projects pr
  WHERE ((pr.id = immo_units.project_id) AND user_has_business_access(pr.business_id)))));
CREATE POLICY immo_units_write ON public.immo_units AS PERMISSIVE FOR a TO authenticated WITH CHECK ((EXISTS ( SELECT 1
   FROM immo_projects pr
  WHERE ((pr.id = immo_units.project_id) AND user_has_business_access(pr.business_id)))));
ALTER TABLE public.immo_units ENABLE ROW LEVEL SECURITY;
CREATE POLICY insurance_claim_documents_access ON public.insurance_claim_documents AS PERMISSIVE FOR r TO authenticated USING ((EXISTS ( SELECT 1
   FROM insurance_claims c
  WHERE ((c.id = insurance_claim_documents.claim_id) AND ((c.assigned_to = ( SELECT auth.uid() AS uid)) OR (EXISTS ( SELECT 1
           FROM insurance_customers cu
          WHERE ((cu.id = c.customer_id) AND (cu.user_id = ( SELECT auth.uid() AS uid))))) OR is_super_admin())))));
ALTER TABLE public.insurance_claim_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY insurance_claim_access ON public.insurance_claims AS PERMISSIVE FOR r TO authenticated USING (((assigned_to = ( SELECT auth.uid() AS uid)) OR (EXISTS ( SELECT 1
   FROM insurance_customers c
  WHERE ((c.id = insurance_claims.customer_id) AND (c.user_id = ( SELECT auth.uid() AS uid))))) OR (EXISTS ( SELECT 1
   FROM insurance_policies p
  WHERE ((p.id = insurance_claims.policy_id) AND ((p.created_by = ( SELECT auth.uid() AS uid)) OR is_org_admin(p.organization_id))))) OR is_super_admin()));
ALTER TABLE public.insurance_claims ENABLE ROW LEVEL SECURITY;
CREATE POLICY insurance_commission_access ON public.insurance_commissions AS PERMISSIVE FOR r TO authenticated USING (((beneficiary_user_id = ( SELECT auth.uid() AS uid)) OR is_org_admin(organization_id) OR is_super_admin()));
ALTER TABLE public.insurance_commissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY insurance_coverages_customer_access ON public.insurance_coverages AS PERMISSIVE FOR r TO authenticated USING (((EXISTS ( SELECT 1
   FROM (insurance_policies p
     JOIN insurance_customers c ON ((c.id = p.customer_id)))
  WHERE ((p.id = insurance_coverages.policy_id) AND ((c.user_id = ( SELECT auth.uid() AS uid)) OR (p.created_by = ( SELECT auth.uid() AS uid)) OR is_org_admin(p.organization_id))))) OR is_super_admin()));
ALTER TABLE public.insurance_coverages ENABLE ROW LEVEL SECURITY;
CREATE POLICY insurance_customers_self ON public.insurance_customers AS PERMISSIVE FOR * TO authenticated USING (((user_id = ( SELECT auth.uid() AS uid)) OR is_super_admin() OR is_org_admin(organization_id))) WITH CHECK (((user_id = ( SELECT auth.uid() AS uid)) OR is_super_admin() OR is_org_admin(organization_id)));
ALTER TABLE public.insurance_customers ENABLE ROW LEVEL SECURITY;
CREATE POLICY insurance_payment_access ON public.insurance_payments AS PERMISSIVE FOR r TO authenticated USING (((EXISTS ( SELECT 1
   FROM insurance_customers c
  WHERE ((c.id = insurance_payments.customer_id) AND (c.user_id = ( SELECT auth.uid() AS uid))))) OR (EXISTS ( SELECT 1
   FROM insurance_policies p
  WHERE ((p.id = insurance_payments.policy_id) AND ((p.created_by = ( SELECT auth.uid() AS uid)) OR is_org_admin(p.organization_id))))) OR is_super_admin()));
ALTER TABLE public.insurance_payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY insurance_policies_customer_access ON public.insurance_policies AS PERMISSIVE FOR r TO authenticated USING (((created_by = ( SELECT auth.uid() AS uid)) OR (EXISTS ( SELECT 1
   FROM insurance_customers c
  WHERE ((c.id = insurance_policies.customer_id) AND (c.user_id = ( SELECT auth.uid() AS uid))))) OR is_super_admin() OR is_org_admin(organization_id)));
ALTER TABLE public.insurance_policies ENABLE ROW LEVEL SECURITY;
CREATE POLICY insurance_schedule_access ON public.insurance_premium_schedules AS PERMISSIVE FOR r TO authenticated USING (((EXISTS ( SELECT 1
   FROM (insurance_policies p
     JOIN insurance_customers c ON ((c.id = p.customer_id)))
  WHERE ((p.id = insurance_premium_schedules.policy_id) AND ((c.user_id = ( SELECT auth.uid() AS uid)) OR (p.created_by = ( SELECT auth.uid() AS uid)) OR is_org_admin(p.organization_id))))) OR is_super_admin()));
ALTER TABLE public.insurance_premium_schedules ENABLE ROW LEVEL SECURITY;
CREATE POLICY insurance_products_public_catalog ON public.insurance_products AS PERMISSIVE FOR r TO anon, authenticated USING ((is_active = true));
ALTER TABLE public.insurance_products ENABLE ROW LEVEL SECURITY;
CREATE POLICY insurance_providers_public_catalog ON public.insurance_providers AS PERMISSIVE FOR r TO anon, authenticated USING (((is_active = true) AND (verification_status = 'verified'::text)));
ALTER TABLE public.insurance_providers ENABLE ROW LEVEL SECURITY;
CREATE POLICY kyc_documents_owner_insert ON public.kyc_documents AS PERMISSIVE FOR a TO unknown (OID=0) WITH CHECK ((kyc_profile_id IN ( SELECT kyc_profiles.id
   FROM kyc_profiles
  WHERE (kyc_profiles.user_id = auth.uid()))));
CREATE POLICY kyc_documents_owner_select ON public.kyc_documents AS PERMISSIVE FOR r TO unknown (OID=0) USING ((kyc_profile_id IN ( SELECT kyc_profiles.id
   FROM kyc_profiles
  WHERE (kyc_profiles.user_id = auth.uid()))));
ALTER TABLE public.kyc_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY kyc_profiles_owner_insert ON public.kyc_profiles AS PERMISSIVE FOR a TO unknown (OID=0) WITH CHECK ((auth.uid() = user_id));
CREATE POLICY kyc_profiles_owner_select ON public.kyc_profiles AS PERMISSIVE FOR r TO unknown (OID=0) USING ((auth.uid() = user_id));
CREATE POLICY kyc_profiles_owner_update ON public.kyc_profiles AS PERMISSIVE FOR w TO authenticated USING ((( SELECT auth.uid() AS uid) = user_id)) WITH CHECK ((( SELECT auth.uid() AS uid) = user_id));
ALTER TABLE public.kyc_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY languages_public_read ON public.languages AS PERMISSIVE FOR r TO unknown (OID=0) USING (true);
ALTER TABLE public.languages ENABLE ROW LEVEL SECURITY;
CREATE POLICY marketplace_addresses_owner_all ON public.marketplace_addresses AS PERMISSIVE FOR * TO authenticated USING ((user_id = auth.uid())) WITH CHECK ((user_id = auth.uid()));
ALTER TABLE public.marketplace_addresses ENABLE ROW LEVEL SECURITY;
CREATE POLICY marketplace_cart_items_owner_all ON public.marketplace_cart_items AS PERMISSIVE FOR * TO authenticated USING ((cart_id IN ( SELECT marketplace_carts.id
   FROM marketplace_carts
  WHERE (marketplace_carts.user_id = auth.uid())))) WITH CHECK ((cart_id IN ( SELECT marketplace_carts.id
   FROM marketplace_carts
  WHERE (marketplace_carts.user_id = auth.uid()))));
ALTER TABLE public.marketplace_cart_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY marketplace_carts_owner_all ON public.marketplace_carts AS PERMISSIVE FOR * TO authenticated USING ((user_id = auth.uid())) WITH CHECK ((user_id = auth.uid()));
ALTER TABLE public.marketplace_carts ENABLE ROW LEVEL SECURITY;
CREATE POLICY marketplace_categories_public_read ON public.marketplace_categories AS PERMISSIVE FOR r TO unknown (OID=0) USING ((is_active = true));
ALTER TABLE public.marketplace_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY marketplace_conversations_participant_all ON public.marketplace_conversations AS PERMISSIVE FOR * TO authenticated USING (((buyer_id = auth.uid()) OR (seller_id IN ( SELECT marketplace_sellers.id
   FROM marketplace_sellers
  WHERE (marketplace_sellers.user_id = auth.uid()))))) WITH CHECK (((buyer_id = auth.uid()) OR (seller_id IN ( SELECT marketplace_sellers.id
   FROM marketplace_sellers
  WHERE (marketplace_sellers.user_id = auth.uid())))));
ALTER TABLE public.marketplace_conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY marketplace_coupons_public_read ON public.marketplace_coupons AS PERMISSIVE FOR r TO anon USING (((is_active = true) AND ((starts_at IS NULL) OR (starts_at <= now())) AND ((ends_at IS NULL) OR (ends_at >= now())) AND ((max_uses IS NULL) OR (used_count < max_uses))));
CREATE POLICY marketplace_coupons_seller_all ON public.marketplace_coupons AS PERMISSIVE FOR * TO authenticated USING ((seller_id IN ( SELECT marketplace_sellers.id
   FROM marketplace_sellers
  WHERE (marketplace_sellers.user_id = auth.uid())))) WITH CHECK ((seller_id IN ( SELECT marketplace_sellers.id
   FROM marketplace_sellers
  WHERE (marketplace_sellers.user_id = auth.uid()))));
ALTER TABLE public.marketplace_coupons ENABLE ROW LEVEL SECURITY;
CREATE POLICY marketplace_favorites_owner_all ON public.marketplace_favorites AS PERMISSIVE FOR * TO authenticated USING ((user_id = auth.uid())) WITH CHECK ((user_id = auth.uid()));
ALTER TABLE public.marketplace_favorites ENABLE ROW LEVEL SECURITY;
CREATE POLICY marketplace_listing_media_public_read ON public.marketplace_listing_media AS PERMISSIVE FOR r TO anon USING ((EXISTS ( SELECT 1
   FROM marketplace_listings l
  WHERE ((l.id = marketplace_listing_media.listing_id) AND (l.listing_status = 'published'::marketplace_listing_status)))));
CREATE POLICY marketplace_listing_media_seller_all ON public.marketplace_listing_media AS PERMISSIVE FOR * TO authenticated USING ((listing_id IN ( SELECT l.id
   FROM (marketplace_listings l
     JOIN marketplace_sellers s ON ((l.seller_id = s.id)))
  WHERE (s.user_id = auth.uid())))) WITH CHECK ((listing_id IN ( SELECT l.id
   FROM (marketplace_listings l
     JOIN marketplace_sellers s ON ((l.seller_id = s.id)))
  WHERE (s.user_id = auth.uid()))));
ALTER TABLE public.marketplace_listing_media ENABLE ROW LEVEL SECURITY;
CREATE POLICY marketplace_listings_public_read ON public.marketplace_listings AS PERMISSIVE FOR r TO anon USING ((listing_status = 'published'::marketplace_listing_status));
CREATE POLICY marketplace_listings_seller_all ON public.marketplace_listings AS PERMISSIVE FOR * TO authenticated USING ((seller_id IN ( SELECT marketplace_sellers.id
   FROM marketplace_sellers
  WHERE (marketplace_sellers.user_id = auth.uid())))) WITH CHECK ((seller_id IN ( SELECT marketplace_sellers.id
   FROM marketplace_sellers
  WHERE (marketplace_sellers.user_id = auth.uid()))));
ALTER TABLE public.marketplace_listings ENABLE ROW LEVEL SECURITY;
CREATE POLICY marketplace_messages_participant_all ON public.marketplace_messages AS PERMISSIVE FOR * TO authenticated USING ((conversation_id IN ( SELECT marketplace_conversations.id
   FROM marketplace_conversations
  WHERE ((marketplace_conversations.buyer_id = auth.uid()) OR (marketplace_conversations.seller_id IN ( SELECT marketplace_sellers.id
           FROM marketplace_sellers
          WHERE (marketplace_sellers.user_id = auth.uid()))))))) WITH CHECK ((conversation_id IN ( SELECT marketplace_conversations.id
   FROM marketplace_conversations
  WHERE ((marketplace_conversations.buyer_id = auth.uid()) OR (marketplace_conversations.seller_id IN ( SELECT marketplace_sellers.id
           FROM marketplace_sellers
          WHERE (marketplace_sellers.user_id = auth.uid())))))));
ALTER TABLE public.marketplace_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY marketplace_order_items_insert ON public.marketplace_order_items AS PERMISSIVE FOR a TO authenticated WITH CHECK ((order_id IN ( SELECT marketplace_orders.id
   FROM marketplace_orders
  WHERE (marketplace_orders.buyer_id = auth.uid()))));
CREATE POLICY marketplace_order_items_read ON public.marketplace_order_items AS PERMISSIVE FOR r TO authenticated USING ((order_id IN ( SELECT marketplace_orders.id
   FROM marketplace_orders
  WHERE ((marketplace_orders.buyer_id = auth.uid()) OR (marketplace_orders.seller_id IN ( SELECT marketplace_sellers.id
           FROM marketplace_sellers
          WHERE (marketplace_sellers.user_id = auth.uid())))))));
ALTER TABLE public.marketplace_order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY marketplace_orders_buyer_insert ON public.marketplace_orders AS PERMISSIVE FOR a TO authenticated WITH CHECK ((buyer_id = auth.uid()));
CREATE POLICY marketplace_orders_buyer_or_seller_read ON public.marketplace_orders AS PERMISSIVE FOR r TO authenticated USING (((buyer_id = auth.uid()) OR (seller_id IN ( SELECT s.id
   FROM marketplace_sellers s
  WHERE (s.user_id = auth.uid())))));
CREATE POLICY marketplace_orders_buyer_or_seller_update ON public.marketplace_orders AS PERMISSIVE FOR w TO authenticated USING (((buyer_id = auth.uid()) OR (seller_id IN ( SELECT s.id
   FROM marketplace_sellers s
  WHERE (s.user_id = auth.uid()))))) WITH CHECK (((buyer_id = auth.uid()) OR (seller_id IN ( SELECT s.id
   FROM marketplace_sellers s
  WHERE (s.user_id = auth.uid())))));
ALTER TABLE public.marketplace_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY marketplace_price_history_read ON public.marketplace_price_history AS PERMISSIVE FOR r TO unknown (OID=0) USING ((EXISTS ( SELECT 1
   FROM marketplace_listings l
  WHERE ((l.id = marketplace_price_history.listing_id) AND (l.listing_status = 'published'::marketplace_listing_status)))));
ALTER TABLE public.marketplace_price_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY marketplace_promotions_seller_all ON public.marketplace_promotions AS PERMISSIVE FOR * TO authenticated USING ((seller_id IN ( SELECT marketplace_sellers.id
   FROM marketplace_sellers
  WHERE (marketplace_sellers.user_id = auth.uid())))) WITH CHECK ((seller_id IN ( SELECT marketplace_sellers.id
   FROM marketplace_sellers
  WHERE (marketplace_sellers.user_id = auth.uid()))));
ALTER TABLE public.marketplace_promotions ENABLE ROW LEVEL SECURITY;
CREATE POLICY marketplace_refunds_participant_read ON public.marketplace_refunds AS PERMISSIVE FOR r TO authenticated USING (((buyer_id = auth.uid()) OR (order_id IN ( SELECT marketplace_orders.id
   FROM marketplace_orders
  WHERE (marketplace_orders.seller_id IN ( SELECT marketplace_sellers.id
           FROM marketplace_sellers
          WHERE (marketplace_sellers.user_id = auth.uid())))))));
ALTER TABLE public.marketplace_refunds ENABLE ROW LEVEL SECURITY;
CREATE POLICY marketplace_reports_user_all ON public.marketplace_reports AS PERMISSIVE FOR * TO authenticated USING ((reporter_id = auth.uid())) WITH CHECK ((reporter_id = auth.uid()));
ALTER TABLE public.marketplace_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY marketplace_returns_participant_all ON public.marketplace_returns AS PERMISSIVE FOR * TO authenticated USING (((buyer_id = auth.uid()) OR (seller_id IN ( SELECT marketplace_sellers.id
   FROM marketplace_sellers
  WHERE (marketplace_sellers.user_id = auth.uid()))))) WITH CHECK (((buyer_id = auth.uid()) OR (seller_id IN ( SELECT marketplace_sellers.id
   FROM marketplace_sellers
  WHERE (marketplace_sellers.user_id = auth.uid())))));
ALTER TABLE public.marketplace_returns ENABLE ROW LEVEL SECURITY;
CREATE POLICY marketplace_reviews_buyer_insert ON public.marketplace_reviews AS PERMISSIVE FOR a TO authenticated WITH CHECK (((reviewer_id = auth.uid()) AND (EXISTS ( SELECT 1
   FROM (marketplace_orders o
     JOIN marketplace_order_items oi ON ((oi.order_id = o.id)))
  WHERE ((o.id = marketplace_reviews.order_id) AND (o.buyer_id = auth.uid()) AND (o.seller_id = marketplace_reviews.seller_id) AND (oi.listing_id = marketplace_reviews.listing_id))))));
CREATE POLICY marketplace_reviews_buyer_update ON public.marketplace_reviews AS PERMISSIVE FOR w TO authenticated USING ((reviewer_id = auth.uid())) WITH CHECK ((reviewer_id = auth.uid()));
CREATE POLICY marketplace_reviews_public_read ON public.marketplace_reviews AS PERMISSIVE FOR r TO unknown (OID=0) USING ((review_status = 'published'::marketplace_review_status));
ALTER TABLE public.marketplace_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY marketplace_sellers_owner_all ON public.marketplace_sellers AS PERMISSIVE FOR * TO authenticated USING ((user_id = auth.uid())) WITH CHECK ((user_id = auth.uid()));
CREATE POLICY marketplace_sellers_public_read ON public.marketplace_sellers AS PERMISSIVE FOR r TO anon USING ((seller_status = 'active'::marketplace_seller_status));
ALTER TABLE public.marketplace_sellers ENABLE ROW LEVEL SECURITY;
CREATE POLICY marketplace_settlements_seller_read ON public.marketplace_settlements AS PERMISSIVE FOR r TO authenticated USING ((seller_id IN ( SELECT marketplace_sellers.id
   FROM marketplace_sellers
  WHERE (marketplace_sellers.user_id = auth.uid()))));
ALTER TABLE public.marketplace_settlements ENABLE ROW LEVEL SECURITY;
CREATE POLICY marketplace_shipments_buyer_or_seller_manage ON public.marketplace_shipments AS PERMISSIVE FOR * TO authenticated USING ((order_id IN ( SELECT o.id
   FROM marketplace_orders o
  WHERE ((o.buyer_id = auth.uid()) OR (o.seller_id IN ( SELECT s.id
           FROM marketplace_sellers s
          WHERE (s.user_id = auth.uid()))))))) WITH CHECK ((order_id IN ( SELECT o.id
   FROM marketplace_orders o
  WHERE (o.seller_id IN ( SELECT s.id
           FROM marketplace_sellers s
          WHERE (s.user_id = auth.uid()))))));
ALTER TABLE public.marketplace_shipments ENABLE ROW LEVEL SECURITY;
CREATE POLICY media_categories_access ON public.media_categories AS PERMISSIVE FOR * TO authenticated USING (is_super_admin()) WITH CHECK (is_super_admin());
ALTER TABLE public.media_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY media_channels_access ON public.media_channels AS PERMISSIVE FOR * TO authenticated USING ((is_super_admin() OR is_org_member(organization_id))) WITH CHECK ((is_super_admin() OR is_org_admin(organization_id)));
ALTER TABLE public.media_channels ENABLE ROW LEVEL SECURITY;
CREATE POLICY media_content_categories_access ON public.media_content_categories AS PERMISSIVE FOR * TO authenticated USING ((is_super_admin() OR (EXISTS ( SELECT 1
   FROM (media_contents m
     JOIN media_channels c ON ((c.id = m.channel_id)))
  WHERE ((m.id = media_content_categories.content_id) AND ((m.author_user_id = auth.uid()) OR is_org_member(c.organization_id))))))) WITH CHECK ((is_super_admin() OR (EXISTS ( SELECT 1
   FROM (media_contents m
     JOIN media_channels c ON ((c.id = m.channel_id)))
  WHERE ((m.id = media_content_categories.content_id) AND ((m.author_user_id = auth.uid()) OR is_org_admin(c.organization_id)))))));
ALTER TABLE public.media_content_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY media_metrics_access ON public.media_content_metrics AS PERMISSIVE FOR * TO authenticated USING ((is_super_admin() OR (EXISTS ( SELECT 1
   FROM (media_contents m
     JOIN media_channels c ON ((c.id = m.channel_id)))
  WHERE ((m.id = media_content_metrics.content_id) AND is_org_member(c.organization_id)))))) WITH CHECK (is_super_admin());
ALTER TABLE public.media_content_metrics ENABLE ROW LEVEL SECURITY;
CREATE POLICY media_contents_access ON public.media_contents AS PERMISSIVE FOR * TO authenticated USING ((is_super_admin() OR (author_user_id = auth.uid()) OR (EXISTS ( SELECT 1
   FROM media_channels c
  WHERE ((c.id = media_contents.channel_id) AND is_org_member(c.organization_id)))))) WITH CHECK ((is_super_admin() OR (author_user_id = auth.uid()) OR (EXISTS ( SELECT 1
   FROM media_channels c
  WHERE ((c.id = media_contents.channel_id) AND is_org_admin(c.organization_id))))));
ALTER TABLE public.media_contents ENABLE ROW LEVEL SECURITY;
CREATE POLICY modules_authenticated_read ON public.modules AS PERMISSIVE FOR r TO authenticated USING (true);
CREATE POLICY modules_public_read ON public.modules AS PERMISSIVE FOR r TO anon USING (true);
CREATE POLICY modules_super_admin_write ON public.modules AS PERMISSIVE FOR * TO authenticated USING (is_super_admin()) WITH CHECK (is_super_admin());
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;
CREATE POLICY notifications_own ON public.notifications AS PERMISSIVE FOR * TO authenticated USING ((user_id = auth.uid())) WITH CHECK ((user_id = auth.uid()));
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY org_invitations_insert ON public.organization_invitations AS PERMISSIVE FOR a TO authenticated WITH CHECK ((is_org_admin(organization_id) OR is_super_admin()));
CREATE POLICY org_invitations_read ON public.organization_invitations AS PERMISSIVE FOR r TO authenticated USING ((is_org_admin(organization_id) OR (email = ( SELECT profiles.email
   FROM profiles
  WHERE (profiles.id = auth.uid())
 LIMIT 1)) OR is_super_admin()));
ALTER TABLE public.organization_invitations ENABLE ROW LEVEL SECURITY;
CREATE POLICY org_members_insert ON public.organization_members AS PERMISSIVE FOR a TO authenticated WITH CHECK (((user_id = auth.uid()) OR is_org_admin(organization_id) OR is_super_admin()));
CREATE POLICY org_members_read ON public.organization_members AS PERMISSIVE FOR r TO authenticated USING (((user_id = auth.uid()) OR is_org_member(organization_id) OR is_super_admin()));
CREATE POLICY org_members_update ON public.organization_members AS PERMISSIVE FOR w TO authenticated USING ((is_org_admin(organization_id) OR is_super_admin())) WITH CHECK ((is_org_admin(organization_id) OR is_super_admin()));
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY orgs_admin_update ON public.organizations AS PERMISSIVE FOR w TO authenticated USING (((owner_id = auth.uid()) OR is_org_admin(id) OR is_super_admin())) WITH CHECK (((owner_id = auth.uid()) OR is_org_admin(id) OR is_super_admin()));
CREATE POLICY orgs_member_read ON public.organizations AS PERMISSIVE FOR r TO authenticated USING (((owner_id = auth.uid()) OR is_org_member(id) OR is_super_admin()));
CREATE POLICY orgs_owner_insert ON public.organizations AS PERMISSIVE FOR a TO authenticated WITH CHECK ((owner_id = auth.uid()));
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
CREATE POLICY beneficiaries_owner_delete ON public.pay_beneficiaries AS PERMISSIVE FOR d TO unknown (OID=0) USING ((auth.uid() = owner_user_id));
CREATE POLICY beneficiaries_owner_insert ON public.pay_beneficiaries AS PERMISSIVE FOR a TO unknown (OID=0) WITH CHECK ((auth.uid() = owner_user_id));
CREATE POLICY beneficiaries_owner_select ON public.pay_beneficiaries AS PERMISSIVE FOR r TO unknown (OID=0) USING ((auth.uid() = owner_user_id));
CREATE POLICY beneficiaries_owner_update ON public.pay_beneficiaries AS PERMISSIVE FOR w TO authenticated USING ((( SELECT auth.uid() AS uid) = owner_user_id)) WITH CHECK ((( SELECT auth.uid() AS uid) = owner_user_id));
ALTER TABLE public.pay_beneficiaries ENABLE ROW LEVEL SECURITY;
CREATE POLICY payment_methods_owner_delete ON public.payment_methods AS PERMISSIVE FOR d TO unknown (OID=0) USING ((auth.uid() = user_id));
CREATE POLICY payment_methods_owner_insert ON public.payment_methods AS PERMISSIVE FOR a TO unknown (OID=0) WITH CHECK ((auth.uid() = user_id));
CREATE POLICY payment_methods_owner_select ON public.payment_methods AS PERMISSIVE FOR r TO unknown (OID=0) USING ((auth.uid() = user_id));
CREATE POLICY payment_methods_owner_update ON public.payment_methods AS PERMISSIVE FOR w TO authenticated USING ((( SELECT auth.uid() AS uid) = user_id)) WITH CHECK ((( SELECT auth.uid() AS uid) = user_id));
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;
CREATE POLICY payment_provider_routes_public_read ON public.payment_provider_routes AS PERMISSIVE FOR r TO unknown (OID=0) USING ((is_active = true));
ALTER TABLE public.payment_provider_routes ENABLE ROW LEVEL SECURITY;
CREATE POLICY payment_providers_public_read ON public.payment_providers AS PERMISSIVE FOR r TO unknown (OID=0) USING ((is_active = true));
ALTER TABLE public.payment_providers ENABLE ROW LEVEL SECURITY;
CREATE POLICY payment_requests_owner_insert ON public.payment_requests AS PERMISSIVE FOR a TO unknown (OID=0) WITH CHECK ((auth.uid() = requester_user_id));
CREATE POLICY payment_requests_owner_select ON public.payment_requests AS PERMISSIVE FOR r TO unknown (OID=0) USING (((auth.uid() = requester_user_id) OR (auth.uid() = paid_by_user_id)));
CREATE POLICY payment_requests_owner_update ON public.payment_requests AS PERMISSIVE FOR w TO authenticated USING ((( SELECT auth.uid() AS uid) = requester_user_id)) WITH CHECK ((( SELECT auth.uid() AS uid) = requester_user_id));
ALTER TABLE public.payment_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY payment_subscriptions_owner_insert ON public.payment_subscriptions AS PERMISSIVE FOR a TO unknown (OID=0) WITH CHECK ((auth.uid() = user_id));
CREATE POLICY payment_subscriptions_owner_select ON public.payment_subscriptions AS PERMISSIVE FOR r TO unknown (OID=0) USING ((auth.uid() = user_id));
CREATE POLICY payment_subscriptions_owner_update ON public.payment_subscriptions AS PERMISSIVE FOR w TO authenticated USING ((( SELECT auth.uid() AS uid) = user_id)) WITH CHECK ((( SELECT auth.uid() AS uid) = user_id));
ALTER TABLE public.payment_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY permissions_public_read ON public.permissions AS PERMISSIVE FOR r TO unknown (OID=0) USING (true);
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY profiles_own_or_super_admin ON public.profiles AS PERMISSIVE FOR * TO authenticated USING (((id = auth.uid()) OR is_super_admin())) WITH CHECK ((id = auth.uid()));
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY pub_advertisers_access ON public.pub_advertisers AS PERMISSIVE FOR * TO authenticated USING ((is_super_admin() OR (user_id = auth.uid()) OR is_org_member(organization_id))) WITH CHECK ((is_super_admin() OR (user_id = auth.uid()) OR is_org_admin(organization_id)));
ALTER TABLE public.pub_advertisers ENABLE ROW LEVEL SECURITY;
CREATE POLICY pub_campaign_placements_access ON public.pub_campaign_placements AS PERMISSIVE FOR * TO authenticated USING ((is_super_admin() OR (EXISTS ( SELECT 1
   FROM (pub_campaigns c
     JOIN pub_advertisers a ON ((a.id = c.advertiser_id)))
  WHERE ((c.id = pub_campaign_placements.campaign_id) AND ((a.user_id = auth.uid()) OR is_org_member(a.organization_id))))))) WITH CHECK ((is_super_admin() OR (EXISTS ( SELECT 1
   FROM (pub_campaigns c
     JOIN pub_advertisers a ON ((a.id = c.advertiser_id)))
  WHERE ((c.id = pub_campaign_placements.campaign_id) AND ((a.user_id = auth.uid()) OR is_org_admin(a.organization_id)))))));
ALTER TABLE public.pub_campaign_placements ENABLE ROW LEVEL SECURITY;
CREATE POLICY pub_campaigns_access ON public.pub_campaigns AS PERMISSIVE FOR * TO authenticated USING ((is_super_admin() OR (EXISTS ( SELECT 1
   FROM pub_advertisers a
  WHERE ((a.id = pub_campaigns.advertiser_id) AND ((a.user_id = auth.uid()) OR is_org_member(a.organization_id))))))) WITH CHECK ((is_super_admin() OR (EXISTS ( SELECT 1
   FROM pub_advertisers a
  WHERE ((a.id = pub_campaigns.advertiser_id) AND ((a.user_id = auth.uid()) OR is_org_admin(a.organization_id)))))));
ALTER TABLE public.pub_campaigns ENABLE ROW LEVEL SECURITY;
CREATE POLICY pub_creatives_access ON public.pub_creatives AS PERMISSIVE FOR * TO authenticated USING ((is_super_admin() OR (EXISTS ( SELECT 1
   FROM (pub_campaigns c
     JOIN pub_advertisers a ON ((a.id = c.advertiser_id)))
  WHERE ((c.id = pub_creatives.campaign_id) AND ((a.user_id = auth.uid()) OR is_org_member(a.organization_id))))))) WITH CHECK ((is_super_admin() OR (EXISTS ( SELECT 1
   FROM (pub_campaigns c
     JOIN pub_advertisers a ON ((a.id = c.advertiser_id)))
  WHERE ((c.id = pub_creatives.campaign_id) AND ((a.user_id = auth.uid()) OR is_org_admin(a.organization_id)))))));
ALTER TABLE public.pub_creatives ENABLE ROW LEVEL SECURITY;
CREATE POLICY pub_impressions_access ON public.pub_impressions AS PERMISSIVE FOR r TO authenticated USING ((is_super_admin() OR (EXISTS ( SELECT 1
   FROM (pub_campaigns c
     JOIN pub_advertisers a ON ((a.id = c.advertiser_id)))
  WHERE ((c.id = pub_impressions.campaign_id) AND ((a.user_id = auth.uid()) OR is_org_member(a.organization_id)))))));
ALTER TABLE public.pub_impressions ENABLE ROW LEVEL SECURITY;
CREATE POLICY pub_placements_access ON public.pub_placements AS PERMISSIVE FOR * TO authenticated USING ((is_super_admin() OR (is_active = true))) WITH CHECK (is_super_admin());
ALTER TABLE public.pub_placements ENABLE ROW LEVEL SECURITY;
CREATE POLICY role_permissions_public_read ON public.role_permissions AS PERMISSIVE FOR r TO unknown (OID=0) USING (true);
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY roles_public_read ON public.roles AS PERMISSIVE FOR r TO unknown (OID=0) USING (true);
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY social_comments_access ON public.social_comments AS PERMISSIVE FOR * TO authenticated USING ((is_super_admin() OR (user_id = auth.uid()) OR (EXISTS ( SELECT 1
   FROM social_posts p
  WHERE ((p.id = social_comments.post_id) AND (p.author_user_id = auth.uid())))))) WITH CHECK ((is_super_admin() OR (user_id = auth.uid())));
ALTER TABLE public.social_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY social_follows_access ON public.social_follows AS PERMISSIVE FOR * TO authenticated USING ((is_super_admin() OR (follower_user_id = auth.uid()) OR (following_user_id = auth.uid()))) WITH CHECK ((is_super_admin() OR (follower_user_id = auth.uid())));
ALTER TABLE public.social_follows ENABLE ROW LEVEL SECURITY;
CREATE POLICY social_posts_access ON public.social_posts AS PERMISSIVE FOR * TO authenticated USING ((is_super_admin() OR (author_user_id = auth.uid()) OR (visibility = 'public'::text))) WITH CHECK ((is_super_admin() OR (author_user_id = auth.uid())));
ALTER TABLE public.social_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY social_profiles_access ON public.social_profiles AS PERMISSIVE FOR * TO authenticated USING ((is_super_admin() OR (user_id = auth.uid()))) WITH CHECK ((is_super_admin() OR (user_id = auth.uid())));
ALTER TABLE public.social_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY social_reactions_access ON public.social_reactions AS PERMISSIVE FOR * TO authenticated USING ((is_super_admin() OR (user_id = auth.uid()))) WITH CHECK ((is_super_admin() OR (user_id = auth.uid())));
ALTER TABLE public.social_reactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY super_admins_read ON public.super_admins AS PERMISSIVE FOR r TO authenticated USING (((user_id = auth.uid()) OR is_super_admin()));
ALTER TABLE public.super_admins ENABLE ROW LEVEL SECURITY;
CREATE POLICY system_settings_admin_all ON public.system_settings AS PERMISSIVE FOR * TO authenticated USING (is_super_admin()) WITH CHECK (is_super_admin());
CREATE POLICY system_settings_authenticated_public_read ON public.system_settings AS PERMISSIVE FOR r TO authenticated USING ((is_public = true));
CREATE POLICY system_settings_public_read ON public.system_settings AS PERMISSIVE FOR r TO anon USING ((is_public = true));
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY tontine_schedules_admin ON public.tontine_contribution_schedules AS PERMISSIVE FOR * TO authenticated USING ((EXISTS ( SELECT 1
   FROM (tontine_cycles tc
     JOIN tontines t ON ((t.id = tc.tontine_id)))
  WHERE ((tc.id = tontine_contribution_schedules.cycle_id) AND (is_org_admin(t.organization_id) OR is_super_admin()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM (tontine_cycles tc
     JOIN tontines t ON ((t.id = tc.tontine_id)))
  WHERE ((tc.id = tontine_contribution_schedules.cycle_id) AND (is_org_admin(t.organization_id) OR is_super_admin())))));
CREATE POLICY tontine_schedules_select ON public.tontine_contribution_schedules AS PERMISSIVE FOR r TO authenticated USING ((EXISTS ( SELECT 1
   FROM ((tontine_members tm
     JOIN tontine_cycles tc ON ((tc.id = tontine_contribution_schedules.cycle_id)))
     JOIN tontines t ON ((t.id = tc.tontine_id)))
  WHERE ((tm.id = tontine_contribution_schedules.member_id) AND ((tm.user_id = ( SELECT auth.uid() AS uid)) OR is_org_admin(t.organization_id) OR is_super_admin())))));
ALTER TABLE public.tontine_contribution_schedules ENABLE ROW LEVEL SECURITY;
CREATE POLICY tontine_contributions_admin_update ON public.tontine_contributions AS PERMISSIVE FOR w TO authenticated USING ((EXISTS ( SELECT 1
   FROM (tontine_members tm
     JOIN tontines t ON ((t.id = ( SELECT tc.tontine_id
           FROM (tontine_cycles tc
             JOIN tontine_contribution_schedules s ON ((s.cycle_id = tc.id)))
          WHERE (s.id = tontine_contributions.schedule_id)))))
  WHERE ((tm.id = tontine_contributions.member_id) AND (is_org_admin(t.organization_id) OR is_super_admin()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM (tontine_members tm
     JOIN tontines t ON ((t.id = ( SELECT tc.tontine_id
           FROM (tontine_cycles tc
             JOIN tontine_contribution_schedules s ON ((s.cycle_id = tc.id)))
          WHERE (s.id = tontine_contributions.schedule_id)))))
  WHERE ((tm.id = tontine_contributions.member_id) AND (is_org_admin(t.organization_id) OR is_super_admin())))));
CREATE POLICY tontine_contributions_insert ON public.tontine_contributions AS PERMISSIVE FOR a TO authenticated WITH CHECK (((created_by = ( SELECT auth.uid() AS uid)) AND (EXISTS ( SELECT 1
   FROM tontine_members tm
  WHERE ((tm.id = tontine_contributions.member_id) AND (tm.user_id = ( SELECT auth.uid() AS uid)) AND (tm.membership_status = ANY (ARRAY['approved'::text, 'active'::text])))))));
CREATE POLICY tontine_contributions_select ON public.tontine_contributions AS PERMISSIVE FOR r TO authenticated USING (((created_by = ( SELECT auth.uid() AS uid)) OR (EXISTS ( SELECT 1
   FROM ((tontine_members tm
     JOIN tontine_cycles tc ON ((tc.id = ( SELECT s.cycle_id
           FROM tontine_contribution_schedules s
          WHERE (s.id = tontine_contributions.schedule_id)))))
     JOIN tontines t ON ((t.id = tc.tontine_id)))
  WHERE ((tm.id = tontine_contributions.member_id) AND ((tm.user_id = ( SELECT auth.uid() AS uid)) OR is_org_admin(t.organization_id) OR is_super_admin()))))));
ALTER TABLE public.tontine_contributions ENABLE ROW LEVEL SECURITY;
CREATE POLICY tontine_cycles_admin ON public.tontine_cycles AS PERMISSIVE FOR * TO authenticated USING ((EXISTS ( SELECT 1
   FROM tontines t
  WHERE ((t.id = tontine_cycles.tontine_id) AND (is_org_admin(t.organization_id) OR is_super_admin()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM tontines t
  WHERE ((t.id = tontine_cycles.tontine_id) AND (is_org_admin(t.organization_id) OR is_super_admin())))));
CREATE POLICY tontine_cycles_select ON public.tontine_cycles AS PERMISSIVE FOR r TO authenticated USING ((EXISTS ( SELECT 1
   FROM tontines t
  WHERE ((t.id = tontine_cycles.tontine_id) AND (is_org_member(t.organization_id) OR is_super_admin())))));
ALTER TABLE public.tontine_cycles ENABLE ROW LEVEL SECURITY;
CREATE POLICY tontine_financial_reconciliations_no_direct_access ON public.tontine_financial_reconciliations AS PERMISSIVE FOR * TO authenticated USING (false) WITH CHECK (false);
ALTER TABLE public.tontine_financial_reconciliations ENABLE ROW LEVEL SECURITY;
CREATE POLICY tontine_join_links_select_admin ON public.tontine_join_links AS PERMISSIVE FOR r TO authenticated USING ((is_super_admin() OR (EXISTS ( SELECT 1
   FROM tontines t
  WHERE ((t.id = tontine_join_links.tontine_id) AND is_org_admin(t.organization_id))))));
ALTER TABLE public.tontine_join_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY tontine_members_delete ON public.tontine_members AS PERMISSIVE FOR d TO authenticated USING (((user_id = ( SELECT auth.uid() AS uid)) OR (EXISTS ( SELECT 1
   FROM tontines t
  WHERE ((t.id = tontine_members.tontine_id) AND (is_org_admin(t.organization_id) OR is_super_admin()))))));
CREATE POLICY tontine_members_insert ON public.tontine_members AS PERMISSIVE FOR a TO authenticated WITH CHECK (((user_id = ( SELECT auth.uid() AS uid)) AND (EXISTS ( SELECT 1
   FROM tontines t
  WHERE ((t.id = tontine_members.tontine_id) AND is_org_member(t.organization_id))))));
CREATE POLICY tontine_members_select ON public.tontine_members AS PERMISSIVE FOR r TO authenticated USING (((user_id = ( SELECT auth.uid() AS uid)) OR (EXISTS ( SELECT 1
   FROM tontines t
  WHERE ((t.id = tontine_members.tontine_id) AND (is_org_admin(t.organization_id) OR is_super_admin()))))));
CREATE POLICY tontine_members_update ON public.tontine_members AS PERMISSIVE FOR w TO authenticated USING (((user_id = ( SELECT auth.uid() AS uid)) OR (EXISTS ( SELECT 1
   FROM tontines t
  WHERE ((t.id = tontine_members.tontine_id) AND (is_org_admin(t.organization_id) OR is_super_admin())))))) WITH CHECK (((user_id = ( SELECT auth.uid() AS uid)) OR (EXISTS ( SELECT 1
   FROM tontines t
  WHERE ((t.id = tontine_members.tontine_id) AND (is_org_admin(t.organization_id) OR is_super_admin()))))));
ALTER TABLE public.tontine_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tontine dispatch member read" ON public.tontine_payout_dispatches AS PERMISSIVE FOR r TO authenticated USING (((EXISTS ( SELECT 1
   FROM (tontine_members tm
     JOIN tontines t ON ((t.id = tm.tontine_id)))
  WHERE ((tm.user_id = auth.uid()) AND (tm.tontine_id = tm.tontine_id) AND (tm.membership_status = 'active'::text)))) OR is_super_admin()));
ALTER TABLE public.tontine_payout_dispatches ENABLE ROW LEVEL SECURITY;
CREATE POLICY tontine_payouts_admin ON public.tontine_payouts AS PERMISSIVE FOR * TO authenticated USING ((EXISTS ( SELECT 1
   FROM ((tontine_rotations tr
     JOIN tontine_cycles tc ON ((tc.id = tr.cycle_id)))
     JOIN tontines t ON ((t.id = tc.tontine_id)))
  WHERE ((tr.id = tontine_payouts.rotation_id) AND (is_org_admin(t.organization_id) OR is_super_admin()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM ((tontine_rotations tr
     JOIN tontine_cycles tc ON ((tc.id = tr.cycle_id)))
     JOIN tontines t ON ((t.id = tc.tontine_id)))
  WHERE ((tr.id = tontine_payouts.rotation_id) AND (is_org_admin(t.organization_id) OR is_super_admin())))));
CREATE POLICY tontine_payouts_select ON public.tontine_payouts AS PERMISSIVE FOR r TO authenticated USING (((beneficiary_member_id IN ( SELECT tontine_members.id
   FROM tontine_members
  WHERE (tontine_members.user_id = ( SELECT auth.uid() AS uid)))) OR (EXISTS ( SELECT 1
   FROM ((tontine_rotations tr
     JOIN tontine_cycles tc ON ((tc.id = tr.cycle_id)))
     JOIN tontines t ON ((t.id = tc.tontine_id)))
  WHERE ((tr.id = tontine_payouts.rotation_id) AND (is_org_admin(t.organization_id) OR is_super_admin()))))));
ALTER TABLE public.tontine_payouts ENABLE ROW LEVEL SECURITY;
CREATE POLICY tontine_rotations_admin ON public.tontine_rotations AS PERMISSIVE FOR * TO authenticated USING ((EXISTS ( SELECT 1
   FROM (tontine_cycles tc
     JOIN tontines t ON ((t.id = tc.tontine_id)))
  WHERE ((tc.id = tontine_rotations.cycle_id) AND (is_org_admin(t.organization_id) OR is_super_admin()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM (tontine_cycles tc
     JOIN tontines t ON ((t.id = tc.tontine_id)))
  WHERE ((tc.id = tontine_rotations.cycle_id) AND (is_org_admin(t.organization_id) OR is_super_admin())))));
CREATE POLICY tontine_rotations_select ON public.tontine_rotations AS PERMISSIVE FOR r TO authenticated USING ((EXISTS ( SELECT 1
   FROM ((tontine_cycles tc
     JOIN tontines t ON ((t.id = tc.tontine_id)))
     JOIN tontine_members tm ON ((tm.tontine_id = t.id)))
  WHERE ((tc.id = tontine_rotations.cycle_id) AND ((tm.user_id = ( SELECT auth.uid() AS uid)) OR is_org_admin(t.organization_id) OR is_super_admin())))));
ALTER TABLE public.tontine_rotations ENABLE ROW LEVEL SECURITY;
CREATE POLICY tontines_delete_admin ON public.tontines AS PERMISSIVE FOR d TO authenticated USING ((is_org_admin(organization_id) OR is_super_admin()));
CREATE POLICY tontines_insert_admin ON public.tontines AS PERMISSIVE FOR a TO authenticated WITH CHECK ((is_org_admin(organization_id) AND (created_by = ( SELECT auth.uid() AS uid))));
CREATE POLICY tontines_select_member ON public.tontines AS PERMISSIVE FOR r TO authenticated USING ((is_org_member(organization_id) OR is_super_admin()));
CREATE POLICY tontines_update_admin ON public.tontines AS PERMISSIVE FOR w TO authenticated USING ((is_org_admin(organization_id) OR is_super_admin())) WITH CHECK ((is_org_admin(organization_id) OR is_super_admin()));
ALTER TABLE public.tontines ENABLE ROW LEVEL SECURITY;
CREATE POLICY transaction_fees_owner_select ON public.transaction_fees AS PERMISSIVE FOR r TO unknown (OID=0) USING (((transaction_id IN ( SELECT wallet_transactions.id
   FROM wallet_transactions
  WHERE (wallet_transactions.wallet_id IN ( SELECT wallets.id
           FROM wallets
          WHERE (wallets.user_id = auth.uid()))))) OR (transfer_id IN ( SELECT transfers.id
   FROM transfers
  WHERE ((transfers.sender_user_id = auth.uid()) OR (transfers.recipient_user_id = auth.uid()))))));
ALTER TABLE public.transaction_fees ENABLE ROW LEVEL SECURITY;
CREATE POLICY transaction_limits_authenticated_read ON public.transaction_limits AS PERMISSIVE FOR r TO unknown (OID=0) USING (((auth.uid() IS NOT NULL) AND (is_active = true)));
ALTER TABLE public.transaction_limits ENABLE ROW LEVEL SECURITY;
CREATE POLICY transfer_events_participant_select ON public.transfer_events AS PERMISSIVE FOR r TO unknown (OID=0) USING ((transfer_id IN ( SELECT transfers.id
   FROM transfers
  WHERE ((transfers.sender_user_id = auth.uid()) OR (transfers.recipient_user_id = auth.uid())))));
ALTER TABLE public.transfer_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY transfers_sender_insert ON public.transfers AS PERMISSIVE FOR a TO unknown (OID=0) WITH CHECK ((auth.uid() = sender_user_id));
CREATE POLICY transfers_sender_select ON public.transfers AS PERMISSIVE FOR r TO unknown (OID=0) USING (((auth.uid() = sender_user_id) OR (auth.uid() = recipient_user_id)));
ALTER TABLE public.transfers ENABLE ROW LEVEL SECURITY;
CREATE POLICY transit_containers_select ON public.transit_containers AS PERMISSIVE FOR r TO authenticated USING (((shipment_id IS NULL) OR transit_has_shipment_access(shipment_id)));
CREATE POLICY transit_containers_write ON public.transit_containers AS PERMISSIVE FOR a TO authenticated WITH CHECK (((shipment_id IS NULL) OR transit_has_shipment_access(shipment_id)));
ALTER TABLE public.transit_containers ENABLE ROW LEVEL SECURITY;
CREATE POLICY transit_customs_cases_select ON public.transit_customs_cases AS PERMISSIVE FOR r TO authenticated USING (transit_has_operation_access(operation_id));
CREATE POLICY transit_customs_cases_update ON public.transit_customs_cases AS PERMISSIVE FOR w TO authenticated USING (transit_has_operation_access(operation_id)) WITH CHECK (transit_has_operation_access(operation_id));
CREATE POLICY transit_customs_cases_write ON public.transit_customs_cases AS PERMISSIVE FOR a TO authenticated WITH CHECK (transit_has_operation_access(operation_id));
ALTER TABLE public.transit_customs_cases ENABLE ROW LEVEL SECURITY;
CREATE POLICY transit_customs_declarations_select ON public.transit_customs_declarations AS PERMISSIVE FOR r TO authenticated USING ((EXISTS ( SELECT 1
   FROM transit_customs_cases c
  WHERE ((c.id = transit_customs_declarations.customs_case_id) AND transit_has_operation_access(c.operation_id)))));
CREATE POLICY transit_customs_declarations_write ON public.transit_customs_declarations AS PERMISSIVE FOR a TO authenticated WITH CHECK ((EXISTS ( SELECT 1
   FROM transit_customs_cases c
  WHERE ((c.id = transit_customs_declarations.customs_case_id) AND transit_has_operation_access(c.operation_id)))));
ALTER TABLE public.transit_customs_declarations ENABLE ROW LEVEL SECURITY;
CREATE POLICY transit_document_requirements_select ON public.transit_document_requirements AS PERMISSIVE FOR r TO unknown (OID=0) USING (true);
CREATE POLICY transit_document_requirements_write ON public.transit_document_requirements AS PERMISSIVE FOR a TO authenticated WITH CHECK (is_super_admin());
ALTER TABLE public.transit_document_requirements ENABLE ROW LEVEL SECURITY;
CREATE POLICY transit_documents_insert ON public.transit_documents AS PERMISSIVE FOR a TO authenticated WITH CHECK ((uploaded_by = auth.uid()));
CREATE POLICY transit_documents_select ON public.transit_documents AS PERMISSIVE FOR r TO authenticated USING (((is_public = true) OR (uploaded_by = auth.uid()) OR ((operation_id IS NOT NULL) AND transit_has_operation_access(operation_id)) OR ((shipment_id IS NOT NULL) AND transit_has_shipment_access(shipment_id))));
ALTER TABLE public.transit_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY transit_goods_select ON public.transit_goods AS PERMISSIVE FOR r TO authenticated USING (transit_has_operation_access(operation_id));
CREATE POLICY transit_goods_write ON public.transit_goods AS PERMISSIVE FOR a TO authenticated WITH CHECK (transit_has_operation_access(operation_id));
ALTER TABLE public.transit_goods ENABLE ROW LEVEL SECURITY;
CREATE POLICY transit_invoices_select ON public.transit_invoices AS PERMISSIVE FOR r TO authenticated USING (((client_user_id = auth.uid()) OR user_has_business_access(business_id)));
CREATE POLICY transit_invoices_write ON public.transit_invoices AS PERMISSIVE FOR a TO authenticated WITH CHECK (user_has_business_access(business_id));
ALTER TABLE public.transit_invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY transit_locations_select ON public.transit_locations AS PERMISSIVE FOR r TO unknown (OID=0) USING (true);
CREATE POLICY transit_locations_write ON public.transit_locations AS PERMISSIVE FOR a TO authenticated WITH CHECK (is_super_admin());
ALTER TABLE public.transit_locations ENABLE ROW LEVEL SECURITY;
CREATE POLICY transit_logistic_units_select ON public.transit_logistic_units AS PERMISSIVE FOR r TO authenticated USING (transit_has_shipment_access(shipment_id));
CREATE POLICY transit_logistic_units_write ON public.transit_logistic_units AS PERMISSIVE FOR a TO authenticated WITH CHECK (transit_has_shipment_access(shipment_id));
ALTER TABLE public.transit_logistic_units ENABLE ROW LEVEL SECURITY;
CREATE POLICY transit_operations_insert ON public.transit_operations AS PERMISSIVE FOR a TO authenticated WITH CHECK ((client_user_id = auth.uid()));
CREATE POLICY transit_operations_select ON public.transit_operations AS PERMISSIVE FOR r TO authenticated USING (((client_user_id = auth.uid()) OR (responsible_user_id = auth.uid()) OR ((business_id IS NOT NULL) AND user_has_business_access(business_id)) OR is_super_admin()));
CREATE POLICY transit_operations_update ON public.transit_operations AS PERMISSIVE FOR w TO authenticated USING (((responsible_user_id = auth.uid()) OR ((business_id IS NOT NULL) AND user_has_business_access(business_id)) OR is_super_admin())) WITH CHECK (((responsible_user_id = auth.uid()) OR ((business_id IS NOT NULL) AND user_has_business_access(business_id)) OR is_super_admin()));
ALTER TABLE public.transit_operations ENABLE ROW LEVEL SECURITY;
CREATE POLICY transit_packages_select ON public.transit_packages AS PERMISSIVE FOR r TO authenticated USING (transit_has_shipment_access(shipment_id));
CREATE POLICY transit_packages_write ON public.transit_packages AS PERMISSIVE FOR a TO authenticated WITH CHECK (transit_has_shipment_access(shipment_id));
ALTER TABLE public.transit_packages ENABLE ROW LEVEL SECURITY;
CREATE POLICY transit_partners_select ON public.transit_partners AS PERMISSIVE FOR r TO authenticated USING ((((business_id IS NOT NULL) AND user_has_business_access(business_id)) OR is_super_admin()));
CREATE POLICY transit_partners_update ON public.transit_partners AS PERMISSIVE FOR w TO authenticated USING ((((business_id IS NOT NULL) AND user_has_business_access(business_id)) OR is_super_admin())) WITH CHECK ((((business_id IS NOT NULL) AND user_has_business_access(business_id)) OR is_super_admin()));
CREATE POLICY transit_partners_write ON public.transit_partners AS PERMISSIVE FOR a TO authenticated WITH CHECK (((business_id IS NULL) OR user_has_business_access(business_id)));
ALTER TABLE public.transit_partners ENABLE ROW LEVEL SECURITY;
CREATE POLICY transit_payment_schedules_select ON public.transit_payment_schedules AS PERMISSIVE FOR r TO authenticated USING ((EXISTS ( SELECT 1
   FROM transit_invoices i
  WHERE ((i.id = transit_payment_schedules.invoice_id) AND ((i.client_user_id = auth.uid()) OR user_has_business_access(i.business_id))))));
CREATE POLICY transit_payment_schedules_write ON public.transit_payment_schedules AS PERMISSIVE FOR a TO authenticated WITH CHECK ((EXISTS ( SELECT 1
   FROM transit_invoices i
  WHERE ((i.id = transit_payment_schedules.invoice_id) AND user_has_business_access(i.business_id)))));
ALTER TABLE public.transit_payment_schedules ENABLE ROW LEVEL SECURITY;
CREATE POLICY transit_quotes_select ON public.transit_quotes AS PERMISSIVE FOR r TO authenticated USING (((client_user_id = auth.uid()) OR user_has_business_access(business_id)));
CREATE POLICY transit_quotes_update ON public.transit_quotes AS PERMISSIVE FOR w TO authenticated USING (((client_user_id = auth.uid()) OR user_has_business_access(business_id))) WITH CHECK (((client_user_id = auth.uid()) OR user_has_business_access(business_id)));
CREATE POLICY transit_quotes_write ON public.transit_quotes AS PERMISSIVE FOR a TO authenticated WITH CHECK (user_has_business_access(business_id));
ALTER TABLE public.transit_quotes ENABLE ROW LEVEL SECURITY;
CREATE POLICY transit_reports_insert ON public.transit_reports AS PERMISSIVE FOR a TO authenticated WITH CHECK ((reporter_user_id = auth.uid()));
CREATE POLICY transit_reports_select ON public.transit_reports AS PERMISSIVE FOR r TO authenticated USING (((reporter_user_id = auth.uid()) OR is_super_admin()));
ALTER TABLE public.transit_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY transit_requests_insert ON public.transit_requests AS PERMISSIVE FOR a TO authenticated WITH CHECK ((requester_user_id = auth.uid()));
CREATE POLICY transit_requests_select ON public.transit_requests AS PERMISSIVE FOR r TO authenticated USING (((requester_user_id = auth.uid()) OR ((assigned_business_id IS NOT NULL) AND user_has_business_access(assigned_business_id)) OR is_super_admin()));
CREATE POLICY transit_requests_update ON public.transit_requests AS PERMISSIVE FOR w TO authenticated USING (((requester_user_id = auth.uid()) OR ((assigned_business_id IS NOT NULL) AND user_has_business_access(assigned_business_id)))) WITH CHECK (((requester_user_id = auth.uid()) OR ((assigned_business_id IS NOT NULL) AND user_has_business_access(assigned_business_id))));
ALTER TABLE public.transit_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY transit_shipment_legs_select ON public.transit_shipment_legs AS PERMISSIVE FOR r TO authenticated USING (transit_has_shipment_access(shipment_id));
CREATE POLICY transit_shipment_legs_update ON public.transit_shipment_legs AS PERMISSIVE FOR w TO authenticated USING (transit_has_shipment_access(shipment_id)) WITH CHECK (transit_has_shipment_access(shipment_id));
CREATE POLICY transit_shipment_legs_write ON public.transit_shipment_legs AS PERMISSIVE FOR a TO authenticated WITH CHECK (transit_has_shipment_access(shipment_id));
ALTER TABLE public.transit_shipment_legs ENABLE ROW LEVEL SECURITY;
CREATE POLICY transit_shipments_select ON public.transit_shipments AS PERMISSIVE FOR r TO authenticated USING (transit_has_operation_access(operation_id));
CREATE POLICY transit_shipments_update ON public.transit_shipments AS PERMISSIVE FOR w TO authenticated USING (transit_has_operation_access(operation_id)) WITH CHECK (transit_has_operation_access(operation_id));
CREATE POLICY transit_shipments_write ON public.transit_shipments AS PERMISSIVE FOR a TO authenticated WITH CHECK (transit_has_operation_access(operation_id));
ALTER TABLE public.transit_shipments ENABLE ROW LEVEL SECURITY;
CREATE POLICY transit_storage_records_select ON public.transit_storage_records AS PERMISSIVE FOR r TO authenticated USING (transit_has_shipment_access(shipment_id));
CREATE POLICY transit_storage_records_write ON public.transit_storage_records AS PERMISSIVE FOR a TO authenticated WITH CHECK ((EXISTS ( SELECT 1
   FROM transit_warehouses w
  WHERE ((w.id = transit_storage_records.warehouse_id) AND user_has_business_access(w.business_id)))));
ALTER TABLE public.transit_storage_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY transit_tracking_events_select ON public.transit_tracking_events AS PERMISSIVE FOR r TO authenticated USING (transit_has_shipment_access(shipment_id));
CREATE POLICY transit_tracking_events_write ON public.transit_tracking_events AS PERMISSIVE FOR a TO authenticated WITH CHECK (transit_has_shipment_access(shipment_id));
ALTER TABLE public.transit_tracking_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY transit_warehouses_select ON public.transit_warehouses AS PERMISSIVE FOR r TO authenticated USING ((user_has_business_access(business_id) OR is_super_admin()));
CREATE POLICY transit_warehouses_update ON public.transit_warehouses AS PERMISSIVE FOR w TO authenticated USING (user_has_business_access(business_id)) WITH CHECK (user_has_business_access(business_id));
CREATE POLICY transit_warehouses_write ON public.transit_warehouses AS PERMISSIVE FOR a TO authenticated WITH CHECK (user_has_business_access(business_id));
ALTER TABLE public.transit_warehouses ENABLE ROW LEVEL SECURITY;
CREATE POLICY transport_bookings_insert ON public.transport_bookings AS PERMISSIVE FOR a TO authenticated WITH CHECK ((passenger_user_id = auth.uid()));
CREATE POLICY transport_bookings_select ON public.transport_bookings AS PERMISSIVE FOR r TO authenticated USING (((passenger_user_id = auth.uid()) OR ((driver_id IS NOT NULL) AND (driver_id IN ( SELECT transport_drivers.id
   FROM transport_drivers
  WHERE (transport_drivers.user_id = auth.uid())))) OR ((business_id IS NOT NULL) AND user_has_business_access(business_id)) OR is_super_admin()));
CREATE POLICY transport_bookings_update ON public.transport_bookings AS PERMISSIVE FOR w TO authenticated USING (((passenger_user_id = auth.uid()) OR ((driver_id IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM transport_drivers d
  WHERE ((d.id = transport_bookings.driver_id) AND (d.user_id = auth.uid()))))) OR ((business_id IS NOT NULL) AND user_has_business_access(business_id)) OR is_super_admin())) WITH CHECK (((passenger_user_id = auth.uid()) OR ((driver_id IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM transport_drivers d
  WHERE ((d.id = transport_bookings.driver_id) AND (d.user_id = auth.uid()))))) OR ((business_id IS NOT NULL) AND user_has_business_access(business_id)) OR is_super_admin()));
ALTER TABLE public.transport_bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY transport_commissions_select ON public.transport_commissions AS PERMISSIVE FOR r TO authenticated USING ((((business_id IS NOT NULL) AND user_has_business_access(business_id)) OR ((driver_id IS NOT NULL) AND (driver_id IN ( SELECT transport_drivers.id
   FROM transport_drivers
  WHERE (transport_drivers.user_id = auth.uid()))))));
CREATE POLICY transport_commissions_write ON public.transport_commissions AS PERMISSIVE FOR a TO authenticated WITH CHECK (((business_id IS NOT NULL) AND user_has_business_access(business_id)));
ALTER TABLE public.transport_commissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY transport_deliveries_insert ON public.transport_deliveries AS PERMISSIVE FOR a TO authenticated WITH CHECK ((sender_user_id = auth.uid()));
CREATE POLICY transport_deliveries_select ON public.transport_deliveries AS PERMISSIVE FOR r TO authenticated USING (((sender_user_id = auth.uid()) OR ((driver_id IS NOT NULL) AND (driver_id IN ( SELECT transport_drivers.id
   FROM transport_drivers
  WHERE (transport_drivers.user_id = auth.uid())))) OR ((business_id IS NOT NULL) AND user_has_business_access(business_id)) OR is_super_admin()));
CREATE POLICY transport_deliveries_update ON public.transport_deliveries AS PERMISSIVE FOR w TO authenticated USING (((sender_user_id = auth.uid()) OR ((driver_id IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM transport_drivers d
  WHERE ((d.id = transport_deliveries.driver_id) AND (d.user_id = auth.uid()))))) OR ((business_id IS NOT NULL) AND user_has_business_access(business_id)) OR is_super_admin())) WITH CHECK (((sender_user_id = auth.uid()) OR ((driver_id IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM transport_drivers d
  WHERE ((d.id = transport_deliveries.driver_id) AND (d.user_id = auth.uid()))))) OR ((business_id IS NOT NULL) AND user_has_business_access(business_id)) OR is_super_admin()));
ALTER TABLE public.transport_deliveries ENABLE ROW LEVEL SECURITY;
CREATE POLICY transport_delivery_events_select ON public.transport_delivery_events AS PERMISSIVE FOR r TO authenticated USING ((EXISTS ( SELECT 1
   FROM transport_deliveries d
  WHERE ((d.id = transport_delivery_events.delivery_id) AND ((d.sender_user_id = auth.uid()) OR ((d.business_id IS NOT NULL) AND user_has_business_access(d.business_id)) OR ((d.driver_id IS NOT NULL) AND (d.driver_id IN ( SELECT transport_drivers.id
           FROM transport_drivers
          WHERE (transport_drivers.user_id = auth.uid())))))))));
ALTER TABLE public.transport_delivery_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY transport_delivery_proofs_select ON public.transport_delivery_proofs AS PERMISSIVE FOR r TO authenticated USING ((EXISTS ( SELECT 1
   FROM transport_deliveries d
  WHERE ((d.id = transport_delivery_proofs.delivery_id) AND ((d.sender_user_id = auth.uid()) OR ((d.business_id IS NOT NULL) AND user_has_business_access(d.business_id)) OR ((d.driver_id IS NOT NULL) AND (d.driver_id IN ( SELECT transport_drivers.id
           FROM transport_drivers
          WHERE (transport_drivers.user_id = auth.uid())))))))));
CREATE POLICY transport_delivery_proofs_write ON public.transport_delivery_proofs AS PERMISSIVE FOR a TO authenticated WITH CHECK ((EXISTS ( SELECT 1
   FROM transport_deliveries d
  WHERE ((d.id = transport_delivery_proofs.delivery_id) AND ((d.driver_id IS NOT NULL) AND (d.driver_id IN ( SELECT transport_drivers.id
           FROM transport_drivers
          WHERE (transport_drivers.user_id = auth.uid()))))))));
ALTER TABLE public.transport_delivery_proofs ENABLE ROW LEVEL SECURITY;
CREATE POLICY transport_driver_availability_select ON public.transport_driver_availability AS PERMISSIVE FOR r TO unknown (OID=0) USING (((driver_id IN ( SELECT transport_drivers.id
   FROM transport_drivers
  WHERE (transport_drivers.user_id = auth.uid()))) OR (EXISTS ( SELECT 1
   FROM transport_drivers d
  WHERE ((d.id = transport_driver_availability.driver_id) AND (d.business_id IS NOT NULL) AND user_has_business_access(d.business_id)))) OR (EXISTS ( SELECT 1
   FROM transport_bookings b
  WHERE ((b.driver_id = transport_driver_availability.driver_id) AND (b.passenger_user_id = auth.uid()) AND (b.booking_status = ANY (ARRAY['accepted'::transport_booking_status, 'driver_arriving'::transport_booking_status, 'driver_arrived'::transport_booking_status, 'in_progress'::transport_booking_status]))))) OR is_super_admin()));
CREATE POLICY transport_driver_availability_update ON public.transport_driver_availability AS PERMISSIVE FOR w TO authenticated USING ((EXISTS ( SELECT 1
   FROM transport_drivers d
  WHERE ((d.id = transport_driver_availability.driver_id) AND ((d.user_id = auth.uid()) OR ((d.business_id IS NOT NULL) AND user_has_business_access(d.business_id)) OR is_super_admin()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM transport_drivers d
  WHERE ((d.id = transport_driver_availability.driver_id) AND ((d.user_id = auth.uid()) OR ((d.business_id IS NOT NULL) AND user_has_business_access(d.business_id)) OR is_super_admin())))));
CREATE POLICY transport_driver_availability_write ON public.transport_driver_availability AS PERMISSIVE FOR a TO authenticated WITH CHECK ((driver_id IN ( SELECT transport_drivers.id
   FROM transport_drivers
  WHERE (transport_drivers.user_id = auth.uid()))));
ALTER TABLE public.transport_driver_availability ENABLE ROW LEVEL SECURITY;
CREATE POLICY transport_driver_documents_insert ON public.transport_driver_documents AS PERMISSIVE FOR a TO authenticated WITH CHECK ((EXISTS ( SELECT 1
   FROM transport_drivers d
  WHERE ((d.id = transport_driver_documents.driver_id) AND (d.user_id = auth.uid())))));
CREATE POLICY transport_driver_documents_select ON public.transport_driver_documents AS PERMISSIVE FOR r TO authenticated USING ((EXISTS ( SELECT 1
   FROM transport_drivers d
  WHERE ((d.id = transport_driver_documents.driver_id) AND ((d.user_id = auth.uid()) OR ((d.business_id IS NOT NULL) AND user_has_business_access(d.business_id)) OR is_super_admin())))));
ALTER TABLE public.transport_driver_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY transport_drivers_insert ON public.transport_drivers AS PERMISSIVE FOR a TO authenticated WITH CHECK (((user_id = auth.uid()) OR ((business_id IS NOT NULL) AND user_has_business_access(business_id))));
CREATE POLICY transport_drivers_select ON public.transport_drivers AS PERMISSIVE FOR r TO unknown (OID=0) USING (((user_id = auth.uid()) OR ((business_id IS NOT NULL) AND user_has_business_access(business_id)) OR is_super_admin() OR (EXISTS ( SELECT 1
   FROM transport_bookings b
  WHERE ((b.driver_id = transport_drivers.id) AND (b.passenger_user_id = auth.uid()) AND (b.booking_status = ANY (ARRAY['accepted'::transport_booking_status, 'driver_arriving'::transport_booking_status, 'driver_arrived'::transport_booking_status, 'in_progress'::transport_booking_status, 'completed'::transport_booking_status])))))));
CREATE POLICY transport_drivers_update ON public.transport_drivers AS PERMISSIVE FOR w TO authenticated USING (((user_id = auth.uid()) OR ((business_id IS NOT NULL) AND user_has_business_access(business_id)) OR is_super_admin())) WITH CHECK (((user_id = auth.uid()) OR ((business_id IS NOT NULL) AND user_has_business_access(business_id)) OR is_super_admin()));
ALTER TABLE public.transport_drivers ENABLE ROW LEVEL SECURITY;
CREATE POLICY transport_parcels_select ON public.transport_parcels AS PERMISSIVE FOR r TO unknown (OID=0) USING ((EXISTS ( SELECT 1
   FROM transport_deliveries d
  WHERE ((d.id = transport_parcels.delivery_id) AND ((d.sender_user_id = auth.uid()) OR ((d.business_id IS NOT NULL) AND user_has_business_access(d.business_id)) OR ((d.driver_id IS NOT NULL) AND (d.driver_id IN ( SELECT transport_drivers.id
           FROM transport_drivers
          WHERE (transport_drivers.user_id = auth.uid())))))))));
CREATE POLICY transport_parcels_write ON public.transport_parcels AS PERMISSIVE FOR a TO authenticated WITH CHECK ((EXISTS ( SELECT 1
   FROM transport_deliveries d
  WHERE ((d.id = transport_parcels.delivery_id) AND (d.sender_user_id = auth.uid())))));
ALTER TABLE public.transport_parcels ENABLE ROW LEVEL SECURITY;
CREATE POLICY transport_pricing_rules_select ON public.transport_pricing_rules AS PERMISSIVE FOR r TO unknown (OID=0) USING (((is_active = true) OR user_has_business_access(business_id) OR is_super_admin()));
CREATE POLICY transport_pricing_rules_update ON public.transport_pricing_rules AS PERMISSIVE FOR w TO authenticated USING ((user_has_business_access(business_id) OR is_super_admin())) WITH CHECK ((user_has_business_access(business_id) OR is_super_admin()));
CREATE POLICY transport_pricing_rules_write ON public.transport_pricing_rules AS PERMISSIVE FOR a TO authenticated WITH CHECK ((((business_id IS NULL) AND is_super_admin()) OR user_has_business_access(business_id)));
ALTER TABLE public.transport_pricing_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY transport_rentals_insert ON public.transport_rentals AS PERMISSIVE FOR a TO authenticated WITH CHECK ((renter_user_id = auth.uid()));
CREATE POLICY transport_rentals_select ON public.transport_rentals AS PERMISSIVE FOR r TO unknown (OID=0) USING (((renter_user_id = auth.uid()) OR ((business_id IS NOT NULL) AND user_has_business_access(business_id)) OR is_super_admin()));
CREATE POLICY transport_rentals_update ON public.transport_rentals AS PERMISSIVE FOR w TO authenticated USING (((renter_user_id = auth.uid()) OR ((business_id IS NOT NULL) AND user_has_business_access(business_id)) OR is_super_admin())) WITH CHECK (((renter_user_id = auth.uid()) OR ((business_id IS NOT NULL) AND user_has_business_access(business_id)) OR is_super_admin()));
ALTER TABLE public.transport_rentals ENABLE ROW LEVEL SECURITY;
CREATE POLICY transport_reports_insert ON public.transport_reports AS PERMISSIVE FOR a TO authenticated WITH CHECK ((reporter_user_id = auth.uid()));
CREATE POLICY transport_reports_select ON public.transport_reports AS PERMISSIVE FOR r TO authenticated USING (((reporter_user_id = auth.uid()) OR is_super_admin()));
ALTER TABLE public.transport_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY transport_requests_insert ON public.transport_requests AS PERMISSIVE FOR a TO authenticated WITH CHECK ((requester_user_id = auth.uid()));
CREATE POLICY transport_requests_select ON public.transport_requests AS PERMISSIVE FOR r TO authenticated USING (((requester_user_id = auth.uid()) OR ((assigned_business_id IS NOT NULL) AND user_has_business_access(assigned_business_id)) OR is_super_admin()));
CREATE POLICY transport_requests_update ON public.transport_requests AS PERMISSIVE FOR w TO authenticated USING (((requester_user_id = auth.uid()) OR ((assigned_business_id IS NOT NULL) AND user_has_business_access(assigned_business_id)))) WITH CHECK (((requester_user_id = auth.uid()) OR ((assigned_business_id IS NOT NULL) AND user_has_business_access(assigned_business_id))));
ALTER TABLE public.transport_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY transport_reviews_insert ON public.transport_reviews AS PERMISSIVE FOR a TO authenticated WITH CHECK (((reviewer_user_id = auth.uid()) AND (((booking_id IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM transport_bookings b
  WHERE ((b.id = transport_reviews.booking_id) AND (b.passenger_user_id = auth.uid()))))) OR ((delivery_id IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM transport_deliveries d
  WHERE ((d.id = transport_reviews.delivery_id) AND (d.sender_user_id = auth.uid()))))))));
CREATE POLICY transport_reviews_select ON public.transport_reviews AS PERMISSIVE FOR r TO unknown (OID=0) USING (((review_status = 'published'::transport_review_status) OR (reviewer_user_id = auth.uid()) OR is_super_admin()));
ALTER TABLE public.transport_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY transport_routes_select ON public.transport_routes AS PERMISSIVE FOR r TO unknown (OID=0) USING (true);
CREATE POLICY transport_routes_update ON public.transport_routes AS PERMISSIVE FOR w TO authenticated USING (user_has_business_access(business_id)) WITH CHECK (user_has_business_access(business_id));
CREATE POLICY transport_routes_write ON public.transport_routes AS PERMISSIVE FOR a TO authenticated WITH CHECK (user_has_business_access(business_id));
ALTER TABLE public.transport_routes ENABLE ROW LEVEL SECURITY;
CREATE POLICY transport_schedules_select ON public.transport_schedules AS PERMISSIVE FOR r TO unknown (OID=0) USING (true);
CREATE POLICY transport_schedules_update ON public.transport_schedules AS PERMISSIVE FOR w TO authenticated USING ((EXISTS ( SELECT 1
   FROM transport_routes r
  WHERE ((r.id = transport_schedules.route_id) AND user_has_business_access(r.business_id))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM transport_routes r
  WHERE ((r.id = transport_schedules.route_id) AND user_has_business_access(r.business_id)))));
CREATE POLICY transport_schedules_write ON public.transport_schedules AS PERMISSIVE FOR a TO authenticated WITH CHECK ((EXISTS ( SELECT 1
   FROM transport_routes r
  WHERE ((r.id = transport_schedules.route_id) AND user_has_business_access(r.business_id)))));
ALTER TABLE public.transport_schedules ENABLE ROW LEVEL SECURITY;
CREATE POLICY transport_seat_reservations_select ON public.transport_seat_reservations AS PERMISSIVE FOR r TO unknown (OID=0) USING (((passenger_user_id = auth.uid()) OR (EXISTS ( SELECT 1
   FROM (transport_schedules s
     JOIN transport_routes r ON ((r.id = s.route_id)))
  WHERE ((s.id = transport_seat_reservations.schedule_id) AND user_has_business_access(r.business_id))))));
ALTER TABLE public.transport_seat_reservations ENABLE ROW LEVEL SECURITY;
CREATE POLICY transport_seats_select ON public.transport_seats AS PERMISSIVE FOR r TO unknown (OID=0) USING (true);
CREATE POLICY transport_seats_write ON public.transport_seats AS PERMISSIVE FOR a TO authenticated WITH CHECK ((EXISTS ( SELECT 1
   FROM (transport_schedules s
     JOIN transport_routes r ON ((r.id = s.route_id)))
  WHERE ((s.id = transport_seats.schedule_id) AND user_has_business_access(r.business_id)))));
ALTER TABLE public.transport_seats ENABLE ROW LEVEL SECURITY;
CREATE POLICY transport_service_types_select ON public.transport_service_types AS PERMISSIVE FOR r TO unknown (OID=0) USING (true);
ALTER TABLE public.transport_service_types ENABLE ROW LEVEL SECURITY;
CREATE POLICY transport_stops_select ON public.transport_stops AS PERMISSIVE FOR r TO unknown (OID=0) USING (true);
CREATE POLICY transport_stops_write ON public.transport_stops AS PERMISSIVE FOR a TO authenticated WITH CHECK ((EXISTS ( SELECT 1
   FROM transport_routes r
  WHERE ((r.id = transport_stops.route_id) AND user_has_business_access(r.business_id)))));
ALTER TABLE public.transport_stops ENABLE ROW LEVEL SECURITY;
CREATE POLICY transport_vehicle_documents_insert ON public.transport_vehicle_documents AS PERMISSIVE FOR a TO authenticated WITH CHECK ((EXISTS ( SELECT 1
   FROM transport_vehicles v
  WHERE ((v.id = transport_vehicle_documents.vehicle_id) AND ((v.owner_user_id = auth.uid()) OR ((v.business_id IS NOT NULL) AND user_has_business_access(v.business_id)))))));
CREATE POLICY transport_vehicle_documents_select ON public.transport_vehicle_documents AS PERMISSIVE FOR r TO unknown (OID=0) USING ((EXISTS ( SELECT 1
   FROM transport_vehicles v
  WHERE ((v.id = transport_vehicle_documents.vehicle_id) AND ((v.owner_user_id = auth.uid()) OR ((v.business_id IS NOT NULL) AND user_has_business_access(v.business_id)) OR is_super_admin())))));
ALTER TABLE public.transport_vehicle_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY transport_vehicle_types_select ON public.transport_vehicle_types AS PERMISSIVE FOR r TO unknown (OID=0) USING (true);
ALTER TABLE public.transport_vehicle_types ENABLE ROW LEVEL SECURITY;
CREATE POLICY transport_vehicles_insert ON public.transport_vehicles AS PERMISSIVE FOR a TO authenticated WITH CHECK (((owner_user_id = auth.uid()) OR ((business_id IS NOT NULL) AND user_has_business_access(business_id))));
CREATE POLICY transport_vehicles_select ON public.transport_vehicles AS PERMISSIVE FOR r TO unknown (OID=0) USING (((owner_user_id = auth.uid()) OR ((business_id IS NOT NULL) AND user_has_business_access(business_id)) OR is_super_admin()));
CREATE POLICY transport_vehicles_update ON public.transport_vehicles AS PERMISSIVE FOR w TO authenticated USING (((owner_user_id = auth.uid()) OR ((business_id IS NOT NULL) AND user_has_business_access(business_id)) OR is_super_admin())) WITH CHECK (((owner_user_id = auth.uid()) OR ((business_id IS NOT NULL) AND user_has_business_access(business_id)) OR is_super_admin()));
ALTER TABLE public.transport_vehicles ENABLE ROW LEVEL SECURITY;
CREATE POLICY travel_accommodation_media_select ON public.travel_accommodation_media AS PERMISSIVE FOR r TO unknown (OID=0) USING ((EXISTS ( SELECT 1
   FROM travel_accommodations a
  WHERE ((a.id = travel_accommodation_media.accommodation_id) AND ((a.publish_status = 'published'::travel_publish_status) OR user_has_business_access(a.business_id))))));
CREATE POLICY travel_accommodation_media_write ON public.travel_accommodation_media AS PERMISSIVE FOR a TO authenticated WITH CHECK ((EXISTS ( SELECT 1
   FROM travel_accommodations a
  WHERE ((a.id = travel_accommodation_media.accommodation_id) AND user_has_business_access(a.business_id)))));
ALTER TABLE public.travel_accommodation_media ENABLE ROW LEVEL SECURITY;
CREATE POLICY travel_accommodations_select ON public.travel_accommodations AS PERMISSIVE FOR r TO unknown (OID=0) USING (((publish_status = 'published'::travel_publish_status) OR user_has_business_access(business_id) OR is_super_admin()));
CREATE POLICY travel_accommodations_update ON public.travel_accommodations AS PERMISSIVE FOR w TO authenticated USING (user_has_business_access(business_id)) WITH CHECK (user_has_business_access(business_id));
CREATE POLICY travel_accommodations_write ON public.travel_accommodations AS PERMISSIVE FOR a TO authenticated WITH CHECK (user_has_business_access(business_id));
ALTER TABLE public.travel_accommodations ENABLE ROW LEVEL SECURITY;
CREATE POLICY travel_activities_select ON public.travel_activities AS PERMISSIVE FOR r TO unknown (OID=0) USING (((publish_status = 'published'::travel_publish_status) OR user_has_business_access(business_id) OR is_super_admin()));
CREATE POLICY travel_activities_update ON public.travel_activities AS PERMISSIVE FOR w TO authenticated USING (user_has_business_access(business_id)) WITH CHECK (user_has_business_access(business_id));
CREATE POLICY travel_activities_write ON public.travel_activities AS PERMISSIVE FOR a TO authenticated WITH CHECK (user_has_business_access(business_id));
ALTER TABLE public.travel_activities ENABLE ROW LEVEL SECURITY;
CREATE POLICY travel_activity_media_select ON public.travel_activity_media AS PERMISSIVE FOR r TO unknown (OID=0) USING ((EXISTS ( SELECT 1
   FROM travel_activities a
  WHERE ((a.id = travel_activity_media.activity_id) AND ((a.publish_status = 'published'::travel_publish_status) OR user_has_business_access(a.business_id))))));
CREATE POLICY travel_activity_media_write ON public.travel_activity_media AS PERMISSIVE FOR a TO authenticated WITH CHECK ((EXISTS ( SELECT 1
   FROM travel_activities a
  WHERE ((a.id = travel_activity_media.activity_id) AND user_has_business_access(a.business_id)))));
ALTER TABLE public.travel_activity_media ENABLE ROW LEVEL SECURITY;
CREATE POLICY travel_agencies_select ON public.travel_agencies AS PERMISSIVE FOR r TO unknown (OID=0) USING (true);
CREATE POLICY travel_agencies_update ON public.travel_agencies AS PERMISSIVE FOR w TO authenticated USING (user_has_business_access(business_id)) WITH CHECK (user_has_business_access(business_id));
CREATE POLICY travel_agencies_write ON public.travel_agencies AS PERMISSIVE FOR a TO authenticated WITH CHECK (user_has_business_access(business_id));
ALTER TABLE public.travel_agencies ENABLE ROW LEVEL SECURITY;
CREATE POLICY travel_agents_select ON public.travel_agents AS PERMISSIVE FOR r TO unknown (OID=0) USING (true);
CREATE POLICY travel_agents_update ON public.travel_agents AS PERMISSIVE FOR w TO authenticated USING (user_has_business_access(business_id)) WITH CHECK (user_has_business_access(business_id));
CREATE POLICY travel_agents_write ON public.travel_agents AS PERMISSIVE FOR a TO authenticated WITH CHECK (user_has_business_access(business_id));
ALTER TABLE public.travel_agents ENABLE ROW LEVEL SECURITY;
CREATE POLICY travel_availability_select ON public.travel_availability AS PERMISSIVE FOR r TO unknown (OID=0) USING (true);
CREATE POLICY travel_availability_update ON public.travel_availability AS PERMISSIVE FOR w TO authenticated USING ((((resource_type = 'room'::travel_resource_type) AND (EXISTS ( SELECT 1
   FROM (travel_rooms r
     JOIN travel_accommodations a ON ((a.id = r.accommodation_id)))
  WHERE ((r.id = travel_availability.resource_id) AND user_has_business_access(a.business_id))))) OR ((resource_type = 'activity'::travel_resource_type) AND (EXISTS ( SELECT 1
   FROM travel_activities ac
  WHERE ((ac.id = travel_availability.resource_id) AND user_has_business_access(ac.business_id))))) OR ((resource_type = 'tour'::travel_resource_type) AND (EXISTS ( SELECT 1
   FROM travel_tours t
  WHERE ((t.id = travel_availability.resource_id) AND user_has_business_access(t.business_id))))))) WITH CHECK ((((resource_type = 'room'::travel_resource_type) AND (EXISTS ( SELECT 1
   FROM (travel_rooms r
     JOIN travel_accommodations a ON ((a.id = r.accommodation_id)))
  WHERE ((r.id = travel_availability.resource_id) AND user_has_business_access(a.business_id))))) OR ((resource_type = 'activity'::travel_resource_type) AND (EXISTS ( SELECT 1
   FROM travel_activities ac
  WHERE ((ac.id = travel_availability.resource_id) AND user_has_business_access(ac.business_id))))) OR ((resource_type = 'tour'::travel_resource_type) AND (EXISTS ( SELECT 1
   FROM travel_tours t
  WHERE ((t.id = travel_availability.resource_id) AND user_has_business_access(t.business_id)))))));
CREATE POLICY travel_availability_write ON public.travel_availability AS PERMISSIVE FOR a TO authenticated WITH CHECK ((((resource_type = 'room'::travel_resource_type) AND (EXISTS ( SELECT 1
   FROM (travel_rooms r
     JOIN travel_accommodations a ON ((a.id = r.accommodation_id)))
  WHERE ((r.id = travel_availability.resource_id) AND user_has_business_access(a.business_id))))) OR ((resource_type = 'activity'::travel_resource_type) AND (EXISTS ( SELECT 1
   FROM travel_activities ac
  WHERE ((ac.id = travel_availability.resource_id) AND user_has_business_access(ac.business_id))))) OR ((resource_type = 'tour'::travel_resource_type) AND (EXISTS ( SELECT 1
   FROM travel_tours t
  WHERE ((t.id = travel_availability.resource_id) AND user_has_business_access(t.business_id)))))));
ALTER TABLE public.travel_availability ENABLE ROW LEVEL SECURITY;
CREATE POLICY travel_bookings_insert ON public.travel_bookings AS PERMISSIVE FOR a TO authenticated WITH CHECK ((buyer_user_id = auth.uid()));
CREATE POLICY travel_bookings_select ON public.travel_bookings AS PERMISSIVE FOR r TO authenticated USING (((buyer_user_id = auth.uid()) OR ((business_id IS NOT NULL) AND user_has_business_access(business_id)) OR is_super_admin()));
CREATE POLICY travel_bookings_update_business ON public.travel_bookings AS PERMISSIVE FOR w TO authenticated USING (((business_id IS NOT NULL) AND user_has_business_access(business_id))) WITH CHECK (((business_id IS NOT NULL) AND user_has_business_access(business_id)));
ALTER TABLE public.travel_bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY travel_commissions_select ON public.travel_commissions AS PERMISSIVE FOR r TO authenticated USING ((user_has_business_access(business_id) OR (EXISTS ( SELECT 1
   FROM travel_agents a
  WHERE ((a.id = travel_commissions.agent_id) AND (a.user_id = auth.uid())))) OR (EXISTS ( SELECT 1
   FROM travel_guides g
  WHERE ((g.id = travel_commissions.guide_id) AND (g.user_id = auth.uid()))))));
CREATE POLICY travel_commissions_write ON public.travel_commissions AS PERMISSIVE FOR a TO authenticated WITH CHECK (user_has_business_access(business_id));
ALTER TABLE public.travel_commissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY travel_destinations_select ON public.travel_destinations AS PERMISSIVE FOR r TO unknown (OID=0) USING (true);
CREATE POLICY travel_destinations_update ON public.travel_destinations AS PERMISSIVE FOR w TO authenticated USING (is_super_admin()) WITH CHECK (is_super_admin());
CREATE POLICY travel_destinations_write ON public.travel_destinations AS PERMISSIVE FOR a TO authenticated WITH CHECK (is_super_admin());
ALTER TABLE public.travel_destinations ENABLE ROW LEVEL SECURITY;
CREATE POLICY travel_documents_insert ON public.travel_documents AS PERMISSIVE FOR a TO authenticated WITH CHECK ((owner_user_id = auth.uid()));
CREATE POLICY travel_documents_select ON public.travel_documents AS PERMISSIVE FOR r TO authenticated USING (((is_public = true) OR (owner_user_id = auth.uid()) OR ((booking_id IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM travel_bookings b
  WHERE ((b.id = travel_documents.booking_id) AND (b.business_id IS NOT NULL) AND user_has_business_access(b.business_id)))))));
ALTER TABLE public.travel_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY travel_favorites_delete ON public.travel_favorites AS PERMISSIVE FOR d TO authenticated USING ((user_id = auth.uid()));
CREATE POLICY travel_favorites_insert ON public.travel_favorites AS PERMISSIVE FOR a TO authenticated WITH CHECK ((user_id = auth.uid()));
CREATE POLICY travel_favorites_select ON public.travel_favorites AS PERMISSIVE FOR r TO unknown (OID=0) USING ((user_id = auth.uid()));
ALTER TABLE public.travel_favorites ENABLE ROW LEVEL SECURITY;
CREATE POLICY travel_guides_select ON public.travel_guides AS PERMISSIVE FOR r TO unknown (OID=0) USING (true);
CREATE POLICY travel_guides_update ON public.travel_guides AS PERMISSIVE FOR w TO authenticated USING (((user_id = auth.uid()) OR ((business_id IS NOT NULL) AND user_has_business_access(business_id)))) WITH CHECK (((user_id = auth.uid()) OR ((business_id IS NOT NULL) AND user_has_business_access(business_id))));
CREATE POLICY travel_guides_write ON public.travel_guides AS PERMISSIVE FOR a TO authenticated WITH CHECK ((user_id = auth.uid()));
ALTER TABLE public.travel_guides ENABLE ROW LEVEL SECURITY;
CREATE POLICY travel_itineraries_delete ON public.travel_itineraries AS PERMISSIVE FOR d TO authenticated USING ((owner_user_id = auth.uid()));
CREATE POLICY travel_itineraries_select ON public.travel_itineraries AS PERMISSIVE FOR r TO unknown (OID=0) USING (((owner_user_id = auth.uid()) OR (is_shared = true)));
CREATE POLICY travel_itineraries_update ON public.travel_itineraries AS PERMISSIVE FOR w TO authenticated USING ((owner_user_id = auth.uid())) WITH CHECK ((owner_user_id = auth.uid()));
CREATE POLICY travel_itineraries_write ON public.travel_itineraries AS PERMISSIVE FOR a TO authenticated WITH CHECK ((owner_user_id = auth.uid()));
ALTER TABLE public.travel_itineraries ENABLE ROW LEVEL SECURITY;
CREATE POLICY travel_itinerary_items_delete ON public.travel_itinerary_items AS PERMISSIVE FOR d TO authenticated USING ((EXISTS ( SELECT 1
   FROM travel_itineraries i
  WHERE ((i.id = travel_itinerary_items.itinerary_id) AND (i.owner_user_id = auth.uid())))));
CREATE POLICY travel_itinerary_items_select ON public.travel_itinerary_items AS PERMISSIVE FOR r TO unknown (OID=0) USING ((EXISTS ( SELECT 1
   FROM travel_itineraries i
  WHERE ((i.id = travel_itinerary_items.itinerary_id) AND ((i.owner_user_id = auth.uid()) OR (i.is_shared = true))))));
CREATE POLICY travel_itinerary_items_write ON public.travel_itinerary_items AS PERMISSIVE FOR a TO authenticated WITH CHECK ((EXISTS ( SELECT 1
   FROM travel_itineraries i
  WHERE ((i.id = travel_itinerary_items.itinerary_id) AND (i.owner_user_id = auth.uid())))));
ALTER TABLE public.travel_itinerary_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY travel_quotes_select ON public.travel_quotes AS PERMISSIVE FOR r TO authenticated USING (((client_user_id = auth.uid()) OR user_has_business_access(business_id)));
CREATE POLICY travel_quotes_update ON public.travel_quotes AS PERMISSIVE FOR w TO authenticated USING (((client_user_id = auth.uid()) OR user_has_business_access(business_id))) WITH CHECK (((client_user_id = auth.uid()) OR user_has_business_access(business_id)));
CREATE POLICY travel_quotes_write ON public.travel_quotes AS PERMISSIVE FOR a TO authenticated WITH CHECK (user_has_business_access(business_id));
ALTER TABLE public.travel_quotes ENABLE ROW LEVEL SECURITY;
CREATE POLICY travel_reports_insert ON public.travel_reports AS PERMISSIVE FOR a TO authenticated WITH CHECK ((reporter_user_id = auth.uid()));
CREATE POLICY travel_reports_select ON public.travel_reports AS PERMISSIVE FOR r TO authenticated USING (((reporter_user_id = auth.uid()) OR is_super_admin()));
ALTER TABLE public.travel_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY travel_requests_insert ON public.travel_requests AS PERMISSIVE FOR a TO authenticated WITH CHECK ((requester_user_id = auth.uid()));
CREATE POLICY travel_requests_select ON public.travel_requests AS PERMISSIVE FOR r TO authenticated USING (((requester_user_id = auth.uid()) OR ((assigned_business_id IS NOT NULL) AND user_has_business_access(assigned_business_id)) OR is_super_admin()));
CREATE POLICY travel_requests_update ON public.travel_requests AS PERMISSIVE FOR w TO authenticated USING (((requester_user_id = auth.uid()) OR ((assigned_business_id IS NOT NULL) AND user_has_business_access(assigned_business_id)))) WITH CHECK (((requester_user_id = auth.uid()) OR ((assigned_business_id IS NOT NULL) AND user_has_business_access(assigned_business_id))));
ALTER TABLE public.travel_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY travel_reviews_insert ON public.travel_reviews AS PERMISSIVE FOR a TO authenticated WITH CHECK (((reviewer_user_id = auth.uid()) AND (EXISTS ( SELECT 1
   FROM travel_bookings b
  WHERE ((b.id = travel_reviews.booking_id) AND (b.buyer_user_id = auth.uid()))))));
CREATE POLICY travel_reviews_select ON public.travel_reviews AS PERMISSIVE FOR r TO authenticated USING (((review_status = 'published'::travel_review_status) OR (reviewer_user_id = auth.uid()) OR is_super_admin()));
ALTER TABLE public.travel_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY travel_rooms_select ON public.travel_rooms AS PERMISSIVE FOR r TO unknown (OID=0) USING ((EXISTS ( SELECT 1
   FROM travel_accommodations a
  WHERE ((a.id = travel_rooms.accommodation_id) AND ((a.publish_status = 'published'::travel_publish_status) OR user_has_business_access(a.business_id))))));
CREATE POLICY travel_rooms_update ON public.travel_rooms AS PERMISSIVE FOR w TO authenticated USING ((EXISTS ( SELECT 1
   FROM travel_accommodations a
  WHERE ((a.id = travel_rooms.accommodation_id) AND user_has_business_access(a.business_id))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM travel_accommodations a
  WHERE ((a.id = travel_rooms.accommodation_id) AND user_has_business_access(a.business_id)))));
CREATE POLICY travel_rooms_write ON public.travel_rooms AS PERMISSIVE FOR a TO authenticated WITH CHECK ((EXISTS ( SELECT 1
   FROM travel_accommodations a
  WHERE ((a.id = travel_rooms.accommodation_id) AND user_has_business_access(a.business_id)))));
ALTER TABLE public.travel_rooms ENABLE ROW LEVEL SECURITY;
CREATE POLICY travel_tour_stops_select ON public.travel_tour_stops AS PERMISSIVE FOR r TO unknown (OID=0) USING ((EXISTS ( SELECT 1
   FROM travel_tours t
  WHERE ((t.id = travel_tour_stops.tour_id) AND ((t.publish_status = 'published'::travel_publish_status) OR user_has_business_access(t.business_id))))));
CREATE POLICY travel_tour_stops_write ON public.travel_tour_stops AS PERMISSIVE FOR a TO authenticated WITH CHECK ((EXISTS ( SELECT 1
   FROM travel_tours t
  WHERE ((t.id = travel_tour_stops.tour_id) AND user_has_business_access(t.business_id)))));
ALTER TABLE public.travel_tour_stops ENABLE ROW LEVEL SECURITY;
CREATE POLICY travel_tours_select ON public.travel_tours AS PERMISSIVE FOR r TO unknown (OID=0) USING (((publish_status = 'published'::travel_publish_status) OR user_has_business_access(business_id) OR is_super_admin()));
CREATE POLICY travel_tours_update ON public.travel_tours AS PERMISSIVE FOR w TO authenticated USING (user_has_business_access(business_id)) WITH CHECK (user_has_business_access(business_id));
CREATE POLICY travel_tours_write ON public.travel_tours AS PERMISSIVE FOR a TO authenticated WITH CHECK (user_has_business_access(business_id));
ALTER TABLE public.travel_tours ENABLE ROW LEVEL SECURITY;
CREATE POLICY travelers_delete ON public.travelers AS PERMISSIVE FOR d TO authenticated USING ((owner_user_id = auth.uid()));
CREATE POLICY travelers_select ON public.travelers AS PERMISSIVE FOR r TO authenticated USING ((owner_user_id = auth.uid()));
CREATE POLICY travelers_update ON public.travelers AS PERMISSIVE FOR w TO authenticated USING ((( SELECT auth.uid() AS uid) = owner_user_id)) WITH CHECK ((( SELECT auth.uid() AS uid) = owner_user_id));
CREATE POLICY travelers_write ON public.travelers AS PERMISSIVE FOR a TO authenticated WITH CHECK ((owner_user_id = auth.uid()));
ALTER TABLE public.travelers ENABLE ROW LEVEL SECURITY;
CREATE POLICY user_favorites_own ON public.user_favorites AS PERMISSIVE FOR * TO authenticated USING ((user_id = auth.uid())) WITH CHECK ((user_id = auth.uid()));
ALTER TABLE public.user_favorites ENABLE ROW LEVEL SECURITY;
CREATE POLICY user_module_access_own ON public.user_module_access AS PERMISSIVE FOR * TO authenticated USING (((user_id = auth.uid()) OR is_super_admin())) WITH CHECK (((user_id = auth.uid()) OR is_super_admin()));
ALTER TABLE public.user_module_access ENABLE ROW LEVEL SECURITY;
CREATE POLICY user_recent_own ON public.user_recent_services AS PERMISSIVE FOR * TO authenticated USING ((user_id = auth.uid())) WITH CHECK ((user_id = auth.uid()));
ALTER TABLE public.user_recent_services ENABLE ROW LEVEL SECURITY;
CREATE POLICY wallet_transactions_owner_select ON public.wallet_transactions AS PERMISSIVE FOR r TO unknown (OID=0) USING ((wallet_id IN ( SELECT wallets.id
   FROM wallets
  WHERE (wallets.user_id = auth.uid()))));
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY wallets_owner_select ON public.wallets AS PERMISSIVE FOR r TO unknown (OID=0) USING ((auth.uid() = user_id));
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
CREATE POLICY webhook_events_super_admin ON public.webhook_events AS PERMISSIVE FOR * TO authenticated USING (is_super_admin()) WITH CHECK (is_super_admin());
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;
