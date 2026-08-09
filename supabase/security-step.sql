-- Wander Eire: close client-side privilege-escalation paths.
-- Run once after the earlier SQL steps. Safe to re-run.

-- A signed-in person may change only their display name, never their role.
revoke update on public.profiles from anon, authenticated;
grant update (display_name) on public.profiles to authenticated;

-- Moderators only change contribution status; RLS still requires admin role.
revoke update on public.comments from anon, authenticated;
grant update (status) on public.comments to authenticated;

revoke update on public.user_photos from anon, authenticated;
grant update (status) on public.user_photos to authenticated;

-- Pin privileged functions to an empty search path.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

create or replace function public.delete_own_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- This deletes Storage catalog rows only, not the underlying object bytes.
  -- Account deletion must also use a trusted server-side Storage API call with
  -- the service role key to remove every object in this user's folder.
  delete from storage.objects
  where bucket_id = 'location-photos'
    and (storage.foldername(name))[1] = auth.uid()::text;
  delete from auth.users where id = auth.uid();
end;
$$;

revoke all on function public.delete_own_account() from public;
grant execute on function public.delete_own_account() to authenticated;
