-- JDV Travel expansion: flight schedules, restaurant reservations and partner onboarding.
-- This migration is committed for review only; it is not applied to the remote database.

create table if not exists public.travel_airlines (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references public.business_profiles(id) on delete set null,
  country_id uuid references public.countries(id) on delete set null,
  name text not null,
  iata_code text,
  verification_status text not null default 'pending' check (verification_status in ('pending','verified','rejected')),
  is_active boolean not null default false,
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (iata_code)
);

create table if not exists public.travel_flights (
  id uuid primary key default gen_random_uuid(),
  airline_id uuid not null references public.travel_airlines(id) on delete cascade,
  flight_number text not null,
  origin_airport_code text not null,
  origin_city text not null,
  origin_country_id uuid references public.countries(id) on delete set null,
  destination_airport_code text not null,
  destination_city text not null,
  destination_country_id uuid references public.countries(id) on delete set null,
  departure_at timestamptz not null,
  arrival_at timestamptz not null,
  status text not null default 'scheduled' check (status in ('scheduled','boarding','delayed','cancelled','departed','landed')),
  price numeric(12,2) check (price is null or price >= 0),
  currency_code text,
  seats_available integer check (seats_available is null or seats_available >= 0),
  data_source text not null default 'partner',
  provider_reference text,
  last_synced_at timestamptz,
  is_published boolean not null default false,
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (arrival_at > departure_at),
  unique (airline_id, flight_number, departure_at)
);

create index if not exists travel_flights_schedule_idx on public.travel_flights (departure_at, origin_country_id, is_published);
create index if not exists travel_flights_route_idx on public.travel_flights (origin_airport_code, destination_airport_code, departure_at);
alter table public.travel_airlines enable row level security;
alter table public.travel_flights enable row level security;

drop policy if exists travel_airlines_public_verified_read on public.travel_airlines;
create policy travel_airlines_public_verified_read on public.travel_airlines
  for select to anon, authenticated using (is_active = true and verification_status = 'verified');
drop policy if exists travel_airlines_owner_manage on public.travel_airlines;
drop policy if exists travel_airlines_owner_insert_pending on public.travel_airlines;
create policy travel_airlines_owner_insert_pending on public.travel_airlines
  for insert to authenticated with check (
    created_by = (select auth.uid()) and verification_status = 'pending' and is_active = false
  );
drop policy if exists travel_airlines_owner_update_pending on public.travel_airlines;
create policy travel_airlines_owner_update_pending on public.travel_airlines
  for update to authenticated using (
    created_by = (select auth.uid()) and verification_status = 'pending' and is_active = false
  ) with check (
    created_by = (select auth.uid()) and verification_status = 'pending' and is_active = false
  );
drop policy if exists travel_airlines_admin_manage on public.travel_airlines;
create policy travel_airlines_admin_manage on public.travel_airlines
  for all to authenticated using (is_super_admin())
  with check (is_super_admin());

drop policy if exists travel_flights_public_schedule_read on public.travel_flights;
create policy travel_flights_public_schedule_read on public.travel_flights
  for select to anon, authenticated using (
    is_published = true and exists (
      select 1 from public.travel_airlines a
      where a.id = airline_id and a.is_active = true and a.verification_status = 'verified'
    )
  );
drop policy if exists travel_flights_creator_manage on public.travel_flights;
create policy travel_flights_creator_manage on public.travel_flights
  for all to authenticated using (
    created_by = (select auth.uid()) and exists (
      select 1 from public.travel_airlines a
      where a.id = airline_id and a.created_by = (select auth.uid())
    )
  ) with check (
    created_by = (select auth.uid()) and exists (
      select 1 from public.travel_airlines a
      where a.id = airline_id and a.created_by = (select auth.uid())
    )
  );
drop policy if exists travel_flights_admin_manage on public.travel_flights;
create policy travel_flights_admin_manage on public.travel_flights
  for all to authenticated using (is_super_admin())
  with check (is_super_admin());

create table if not exists public.travel_flight_booking_requests (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique default ('JDVF-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10))),
  flight_id uuid not null references public.travel_flights(id) on delete restrict,
  requester_user_id uuid not null references auth.users(id) on delete cascade,
  passenger_count integer not null default 1 check (passenger_count between 1 and 9),
  contact_email text,
  contact_phone text,
  request_status text not null default 'pending' check (request_status in ('pending','confirmed','rejected','cancelled')),
  provider_confirmation text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists travel_flight_booking_requests_owner_idx on public.travel_flight_booking_requests (requester_user_id, created_at desc);
alter table public.travel_flight_booking_requests enable row level security;
drop policy if exists travel_flight_requests_owner_read on public.travel_flight_booking_requests;
create policy travel_flight_requests_owner_read on public.travel_flight_booking_requests
  for select to authenticated using (requester_user_id = (select auth.uid()));
drop policy if exists travel_flight_requests_owner_insert on public.travel_flight_booking_requests;
create policy travel_flight_requests_owner_insert on public.travel_flight_booking_requests
  for insert to authenticated with check (
    requester_user_id = (select auth.uid()) and exists (
      select 1 from public.travel_flights f
      join public.travel_airlines a on a.id = f.airline_id
      where f.id = flight_id and f.is_published = true and f.status not in ('cancelled','departed','landed')
        and a.is_active = true and a.verification_status = 'verified'
        and (f.seats_available is null or f.seats_available >= passenger_count)
    )
  );

create table if not exists public.travel_restaurants (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references public.business_profiles(id) on delete set null,
  country_id uuid references public.countries(id) on delete set null,
  name text not null,
  city text,
  address text,
  cuisine_types text[] not null default '{}',
  description text,
  opening_hours jsonb not null default '{}'::jsonb,
  is_active boolean not null default false,
  verification_status text not null default 'pending' check (verification_status in ('pending','verified','rejected')),
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.travel_restaurants enable row level security;
drop policy if exists travel_restaurants_public_read on public.travel_restaurants;
create policy travel_restaurants_public_read on public.travel_restaurants
  for select to anon, authenticated using (is_active = true and verification_status = 'verified');
drop policy if exists travel_restaurants_owner_manage on public.travel_restaurants;
drop policy if exists travel_restaurants_owner_insert_pending on public.travel_restaurants;
create policy travel_restaurants_owner_insert_pending on public.travel_restaurants
  for insert to authenticated with check (
    created_by = (select auth.uid()) and verification_status = 'pending' and is_active = false
  );
drop policy if exists travel_restaurants_owner_update_pending on public.travel_restaurants;
create policy travel_restaurants_owner_update_pending on public.travel_restaurants
  for update to authenticated using (
    created_by = (select auth.uid()) and verification_status = 'pending' and is_active = false
  ) with check (
    created_by = (select auth.uid()) and verification_status = 'pending' and is_active = false
  );
drop policy if exists travel_restaurants_admin_manage on public.travel_restaurants;
create policy travel_restaurants_admin_manage on public.travel_restaurants
  for all to authenticated using (is_super_admin())
  with check (is_super_admin());

create table if not exists public.travel_restaurant_reservations (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.travel_restaurants(id) on delete restrict,
  requester_user_id uuid not null references auth.users(id) on delete cascade,
  reservation_at timestamptz not null,
  guest_count integer not null default 2 check (guest_count between 1 and 30),
  contact_name text not null,
  contact_phone text,
  notes text,
  reservation_status text not null default 'pending' check (reservation_status in ('pending','confirmed','rejected','cancelled','completed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.travel_restaurant_reservations enable row level security;
drop policy if exists travel_restaurant_reservations_owner_read on public.travel_restaurant_reservations;
create policy travel_restaurant_reservations_owner_read on public.travel_restaurant_reservations
  for select to authenticated using (requester_user_id = (select auth.uid()));
drop policy if exists travel_restaurant_reservations_owner_insert on public.travel_restaurant_reservations;
create policy travel_restaurant_reservations_owner_insert on public.travel_restaurant_reservations
  for insert to authenticated with check (
    requester_user_id = (select auth.uid()) and exists (
      select 1 from public.travel_restaurants r
      where r.id = restaurant_id and r.is_active = true and r.verification_status = 'verified'
    )
  );

create table if not exists public.travel_partner_applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  country_id uuid references public.countries(id) on delete set null,
  partner_type text not null check (partner_type in ('airline','hotel','restaurant','travel_agency')),
  business_name text not null,
  contact_email text not null,
  contact_phone text not null,
  registration_number text,
  application_status text not null default 'pending' check (application_status in ('pending','under_review','approved','rejected')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists travel_partner_applications_user_idx on public.travel_partner_applications (user_id, created_at desc);
alter table public.travel_partner_applications enable row level security;
drop policy if exists travel_partner_applications_owner_read on public.travel_partner_applications;
create policy travel_partner_applications_owner_read on public.travel_partner_applications
  for select to authenticated using (user_id = (select auth.uid()));
drop policy if exists travel_partner_applications_owner_insert on public.travel_partner_applications;
create policy travel_partner_applications_owner_insert on public.travel_partner_applications
  for insert to authenticated with check (user_id = (select auth.uid()));
