-- Internal operational tables are accessed through trusted functions/workers only.
-- RLS without policies already blocks client rows; remove unnecessary SQL grants as defense in depth.
REVOKE ALL PRIVILEGES ON TABLE public.rate_limits FROM anon, authenticated;
REVOKE ALL PRIVILEGES ON TABLE public.subscription_limits FROM anon, authenticated;
