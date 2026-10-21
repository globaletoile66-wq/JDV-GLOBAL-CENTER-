-- Request-based accommodation reservations until a hotel inventory/payment connector is approved.
create table if not exists public.travel_accommodation_booking_requests (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique default ('JDVH-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10))),
  accommodation_id uuid not null references public.travel_accommodations(id) on delete restrict,
  room_id uuid references public.travel_rooms(id) on delete restrict,
  requester_user_id uuid not null references auth.users(id) on delete cascade,
  check_in date not null,
  check_out date not null,
  guest_count integer not null default 1 check (guest_count between 1 and 30),
  contact_name text not null,
  contact_phone text,
  request_status text not null default 'pending' check (request_status in ('pending','confirmed','rejected','cancelled')),
  provider_confirmation text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (check_out > check_in)
);
create index if not exists travel_accommodation_requests_owner_idx on public.travel_accommodation_booking_requests (requester_user_id, created_at desc);
alter table public.travel_accommodation_booking_requests enable row level security;
create policy travel_accommodation_requests_owner_read on public.travel_accommodation_booking_requests
for select to authenticated using (requester_user_id = (select auth.uid()));
create policy travel_accommodation_requests_owner_insert on public.travel_accommodation_booking_requests
for insert to authenticated with check (
  requester_user_id = (select auth.uid()) and exists (
    select 1 from public.travel_accommodations a
    where a.id = accommodation_id and a.publish_status = 'published'
  ) and (
    room_id is null or exists (
      select 1 from public.travel_rooms r
      where r.id = room_id and r.accommodation_id = accommodation_id and r.is_active = true
    )
  )
);
