-- Provider webhook payloads are operational/audit data and must not be directly writable by browser roles.
-- No active application call sites reference these event-log tables; trusted workers use service_role.
REVOKE ALL PRIVILEGES ON TABLE public.payment_provider_events FROM PUBLIC, anon, authenticated;
REVOKE ALL PRIVILEGES ON TABLE public.payment_webhook_events FROM PUBLIC, anon, authenticated;
