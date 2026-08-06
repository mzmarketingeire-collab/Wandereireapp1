-- Wander Eire: let logged-out visitors view official location photography.
-- Pending user uploads stay private because they are stored outside /official/.
-- Safe to re-run after official-photos-step.sql.

drop policy if exists "Official location photo files are readable" on storage.objects;
drop policy if exists "Official location photo files are publicly readable" on storage.objects;

create policy "Official location photo files are publicly readable"
on storage.objects
for select
to anon, authenticated
using (
  bucket_id = 'location-photos'
  and (storage.foldername(name))[1] = 'official'
);
