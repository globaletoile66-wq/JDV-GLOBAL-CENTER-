-- JDV Tontine: classes, organization board, private documents and party verification.
create table if not exists public.tontine_classes (
  code text primary key,
  name text not null,
  description text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
insert into public.tontine_classes(code,name,description) values
 ('rotating_classic','Tontine rotative classique','Cotisations périodiques et ordre de ramassage rotatif.'),
 ('target_savings','Épargne à objectif','Épargne avec objectif, échéance et conditions de sortie définis.'),
 ('solidarity','Tontine de solidarité','Cotisations destinées à une aide ou un événement défini.'),
 ('commercial_professional','Tontine commerciale ou professionnelle','Cotisations organisées autour d’une activité économique.'),
 ('flexible_contributions','Tontine à cotisations flexibles','Montants variables selon les règles et bornes acceptées.'),
 ('custom','Tontine personnalisée','Règles personnalisées communiquées et acceptées avant activation.')
on conflict (code) do update set name=excluded.name, description=excluded.description;

alter table public.tontines add column if not exists tontine_class text not null default 'rotating_classic';
do $$ begin
  if not exists (select 1 from pg_constraint where conname='tontines_tontine_class_fkey') then
    alter table public.tontines add constraint tontines_tontine_class_fkey foreign key (tontine_class) references public.tontine_classes(code);
  end if;
end $$;

create table if not exists public.tontine_organization_board (
 id uuid primary key default gen_random_uuid(),
 tontine_id uuid not null references public.tontines(id) on delete cascade,
 function_title text not null,
 full_name text not null,
 phone text,
 user_id uuid references auth.users(id) on delete set null,
 status text not null default 'pending' check (status in ('pending','submitted','verified','rejected')),
 created_by uuid not null references auth.users(id),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create table if not exists public.tontine_documents (
 id uuid primary key default gen_random_uuid(),
 tontine_id uuid not null references public.tontines(id) on delete cascade,
 document_kind text not null check (document_kind in ('creation_form','signed_contract','organization_bylaws','member_identity','beneficiary_identity','witness_identity','other')),
 storage_path text not null,
 original_filename text not null,
 mime_type text not null default 'application/pdf',
 file_size_bytes bigint,
 uploaded_by uuid not null references auth.users(id),
 status text not null default 'submitted' check (status in ('draft','submitted','under_review','verified','rejected')),
 reviewed_by uuid references auth.users(id),
 reviewed_at timestamptz,
 review_note text,
 created_at timestamptz not null default now()
);
create index if not exists tontine_documents_tontine_idx on public.tontine_documents(tontine_id, created_at desc);
create table if not exists public.tontine_party_verifications (
 id uuid primary key default gen_random_uuid(),
 tontine_id uuid not null references public.tontines(id) on delete cascade,
 party_role text not null check (party_role in ('member','beneficiary','witness_1','witness_2','president','board_member')),
 user_id uuid references auth.users(id) on delete set null,
 full_name text not null,
 phone text not null,
 country_code text,
 identity_document_type text,
 identity_document_number_masked text,
 identity_document_path text,
 identity_status text not null default 'pending' check (identity_status in ('pending','submitted','verified','rejected','expired')),
 phone_status text not null default 'pending' check (phone_status in ('pending','verified','rejected')),
 consented_at timestamptz,
 verified_by uuid references auth.users(id),
 verified_at timestamptz,
 review_note text,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 unique (tontine_id, party_role, phone)
);
create index if not exists tontine_party_verifications_tontine_idx on public.tontine_party_verifications(tontine_id, party_role);

alter table public.tontine_classes enable row level security;
alter table public.tontine_organization_board enable row level security;
alter table public.tontine_documents enable row level security;
alter table public.tontine_party_verifications enable row level security;

drop policy if exists tontine_classes_authenticated_read on public.tontine_classes;
create policy tontine_classes_authenticated_read on public.tontine_classes for select to authenticated using (is_active);
drop policy if exists tontine_board_member_read on public.tontine_organization_board;
create policy tontine_board_member_read on public.tontine_organization_board for select to authenticated using (
 exists (select 1 from public.tontine_members tm where tm.tontine_id=public.tontine_organization_board.tontine_id and tm.user_id=auth.uid())
);
drop policy if exists tontine_board_president_insert on public.tontine_organization_board;
create policy tontine_board_president_insert on public.tontine_organization_board for insert to authenticated with check (
 created_by=auth.uid() and exists (select 1 from public.tontine_members tm where tm.tontine_id=public.tontine_organization_board.tontine_id and tm.user_id=auth.uid() and tm.role in ('president','owner') and tm.membership_status in ('active','pending'))
);
drop policy if exists tontine_documents_member_read on public.tontine_documents;
create policy tontine_documents_member_read on public.tontine_documents for select to authenticated using (
 exists (select 1 from public.tontine_members tm where tm.tontine_id=public.tontine_documents.tontine_id and tm.user_id=auth.uid())
);
drop policy if exists tontine_documents_member_insert on public.tontine_documents;
create policy tontine_documents_member_insert on public.tontine_documents for insert to authenticated with check (
 uploaded_by=auth.uid() and exists (select 1 from public.tontine_members tm where tm.tontine_id=public.tontine_documents.tontine_id and tm.user_id=auth.uid() and tm.membership_status in ('active','pending'))
);
drop policy if exists tontine_party_verifications_member_read on public.tontine_party_verifications;
create policy tontine_party_verifications_member_read on public.tontine_party_verifications for select to authenticated using (
 user_id=auth.uid() or exists (select 1 from public.tontine_members tm where tm.tontine_id=public.tontine_party_verifications.tontine_id and tm.user_id=auth.uid() and tm.role in ('president','owner'))
);
drop policy if exists tontine_party_verifications_self_insert on public.tontine_party_verifications;
create policy tontine_party_verifications_self_insert on public.tontine_party_verifications for insert to authenticated with check (
 user_id=auth.uid() or exists (select 1 from public.tontine_members tm where tm.tontine_id=public.tontine_party_verifications.tontine_id and tm.user_id=auth.uid() and tm.role in ('president','owner'))
);
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values ('jdv-tontine-private','jdv-tontine-private',false,15728640,array['application/pdf','image/jpeg','image/png','image/webp'])
on conflict (id) do update set public=false, file_size_limit=15728640, allowed_mime_types=array['application/pdf','image/jpeg','image/png','image/webp'];
drop policy if exists jdv_tontine_private_read on storage.objects;
create policy jdv_tontine_private_read on storage.objects for select to authenticated using (
 bucket_id='jdv-tontine-private' and exists (select 1 from public.tontine_members tm where tm.tontine_id=split_part(name,'/',1)::uuid and tm.user_id=auth.uid())
);
drop policy if exists jdv_tontine_private_insert on storage.objects;
create policy jdv_tontine_private_insert on storage.objects for insert to authenticated with check (
 bucket_id='jdv-tontine-private' and exists (select 1 from public.tontine_members tm where tm.tontine_id=split_part(name,'/',1)::uuid and tm.user_id=auth.uid() and tm.membership_status in ('active','pending'))
);
