-- Allow the review workflow while keeping delivery states distinct.
begin;
alter table public.pub_campaigns drop constraint if exists pub_campaigns_status_check;
alter table public.pub_campaigns add constraint pub_campaigns_status_check
  check (status = any (array['draft','pending_review','approved','rejected','scheduled','active','paused','completed','cancelled']::text[]));
alter table public.pub_campaigns drop constraint if exists pub_campaigns_budget_nonnegative_check;
commit;
