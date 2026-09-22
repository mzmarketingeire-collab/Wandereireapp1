-- Wander Eire: admin-only official photography on a public CDN bucket.
-- Existing official photos stay in the legacy private bucket and remain readable.

alter table public.location_photos
  add column if not exists bucket_id text not null default 'location-photos',
  add column if not exists creator text,
  add column if not exists source_url text,
  add column if not exists license_name text,
  add column if not exists license_url text;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'official-location-photos',
  'official-location-photos',
  true,
  8388608,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Admins can upload public official photos" on storage.objects;
create policy "Admins can upload public official photos" on storage.objects
for insert to authenticated with check (
  bucket_id = 'official-location-photos'
  and (storage.foldername(name))[1] = 'official'
  and public.is_admin()
);

drop policy if exists "Admins can delete public official photos" on storage.objects;
create policy "Admins can delete public official photos" on storage.objects
for delete to authenticated using (
  bucket_id = 'official-location-photos'
  and (storage.foldername(name))[1] = 'official'
  and public.is_admin()
);

drop policy if exists "Users can upload location photos" on storage.objects;
drop policy if exists "Approved and owned location photo files are readable" on storage.objects;
drop policy if exists "Owners and admins can delete location photo files" on storage.objects;

revoke all on public.user_photos from anon, authenticated;
revoke all on sequence public.user_photos_id_seq from anon, authenticated;
