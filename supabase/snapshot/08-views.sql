-- LIVE SUPABASE VIEW DEFINITIONS

CREATE OR REPLACE VIEW public.payment_providers_catalog AS  SELECT id,
    code,
    name,
    description,
    provider_type,
    is_active,
    supported_countries,
    supported_currencies,
    created_at,
    updated_at
   FROM payment_providers
  WHERE is_active = true;;
