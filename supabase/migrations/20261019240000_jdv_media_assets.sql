-- JDV Media phase 3: private creator asset storage and processing metadata.
-- The bucket is private; delivery/transcoding must be configured separately before public playback.
alter table public.media_contents
  add column if not exists storage_path text,
  add column if not exists media_mime_type text,
  add column if not exists media_file_size_bytes bigint,
  add column if not exists media_processing_status text not null default 'not_uploaded'
    check (media_processing_status in ('not_uploaded','uploaded','processing','ready','failed'));
create index if not exists idx_media_contents_processing on public.media_contents(media_processing_status, created_at desc);
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'jdv-media-assets',
  'jdv-media-assets',
  false,
  104857600,
  array['image/jpeg','image/png','image/webp','image/gif','audio/mpeg','audio/mp4','audio/wav','audio/ogg','video/mp4','video/webm','video/quicktime']::text[]
)
on conflict (id) do update set
  public = false,
  file_size_limit = 104857600,
  allowed_mime_types = excluded.allowed_mime_types;
drop policy if exists jdv_media_assets_owner_read on storage.objects;
create policy jdv_media_assets_owner_read on storage.objects for select to authenticated
using (bucket_id = 'jdv-media-assets' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists jdv_media_assets_owner_insert on storage.objects;
create policy jdv_media_assets_owner_insert on storage.objects for insert to authenticated
with check (bucket_id = 'jdv-media-assets' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists jdv_media_assets_owner_update on storage.objects;
create policy jdv_media_assets_owner_update on storage.objects for update to authenticated
using (bucket_id = 'jdv-media-assets' and (storage.foldername(name))[1] = auth.uid()::text)
with check (bucket_id = 'jdv-media-assets' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists jdv_media_assets_owner_delete on storage.objects;
create policy jdv_media_assets_owner_delete on storage.objects for delete to authenticated
using (bucket_id = 'jdv-media-assets' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists jdv_media_assets_admin_read on storage.objects;
create policy jdv_media_assets_admin_read on storage.objects for select to authenticated
using (bucket_id = 'jdv-media-assets' and public.is_super_admin());
