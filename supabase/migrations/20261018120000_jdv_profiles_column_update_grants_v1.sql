-- Restrict profile updates at the database privilege layer.
-- RLS scopes rows; column grants prevent clients from changing identity or account state.
REVOKE UPDATE ON TABLE public.profiles FROM authenticated;

GRANT UPDATE (
  first_name,
  last_name,
  full_name,
  phone,
  avatar_url,
  country_id,
  preferred_language_id,
  preferred_currency_id,
  timezone,
  usage_type,
  onboarding_completed,
  updated_at
) ON TABLE public.profiles TO authenticated;
