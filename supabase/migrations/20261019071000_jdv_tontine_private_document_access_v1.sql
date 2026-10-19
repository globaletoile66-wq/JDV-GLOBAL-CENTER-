-- Limit identity and contract document access to the uploader and the tontine president/owner.
drop policy if exists tontine_documents_member_read on public.tontine_documents;
create policy tontine_documents_private_read on public.tontine_documents
for select to authenticated using (
  uploaded_by = auth.uid()
  or exists (
    select 1 from public.tontine_members tm
    where tm.tontine_id = public.tontine_documents.tontine_id
      and tm.user_id = auth.uid()
      and tm.role in ('president','owner')
  )
);
drop policy if exists tontine_documents_member_insert on public.tontine_documents;
create policy tontine_documents_private_insert on public.tontine_documents
for insert to authenticated with check (
  uploaded_by = auth.uid()
  and exists (
    select 1 from public.tontine_members tm
    where tm.tontine_id = public.tontine_documents.tontine_id
      and tm.user_id = auth.uid()
      and tm.membership_status in ('active','pending')
  )
);
drop policy if exists jdv_tontine_private_read on storage.objects;
create policy jdv_tontine_private_read on storage.objects for select to authenticated using (
  bucket_id = 'jdv-tontine-private'
  and (
    split_part(name, '/', 2) = auth.uid()::text
    or exists (
      select 1 from public.tontine_members tm
      where tm.tontine_id = split_part(name, '/', 1)::uuid
        and tm.user_id = auth.uid()
        and tm.role in ('president','owner')
    )
  )
);
drop policy if exists jdv_tontine_private_insert on storage.objects;
create policy jdv_tontine_private_insert on storage.objects for insert to authenticated with check (
  bucket_id = 'jdv-tontine-private'
  and split_part(name, '/', 2) = auth.uid()::text
  and exists (
    select 1 from public.tontine_members tm
    where tm.tontine_id = split_part(name, '/', 1)::uuid
      and tm.user_id = auth.uid()
      and tm.membership_status in ('active','pending')
  )
);
