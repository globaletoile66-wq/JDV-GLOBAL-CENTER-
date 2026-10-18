-- Provider credentials must never be directly selectable by browser roles.
-- No active application call sites reference this table; trusted server-side code uses service_role.
REVOKE ALL PRIVILEGES ON TABLE public.payment_provider_accounts FROM PUBLIC, anon, authenticated;
