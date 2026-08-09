-- Wander Eire: allow an authenticated person to permanently delete their own account.
-- Child records and stored-file metadata are removed by the existing cascade rules.

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
