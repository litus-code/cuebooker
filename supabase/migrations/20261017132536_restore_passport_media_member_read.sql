-- Restore the table privilege required before the existing workspace RLS policy can run.
do $$
begin
  if not exists (
    select 1 from pg_class
    where oid = 'public.passport_media'::regclass and relrowsecurity
  ) or not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'passport_media'
      and policyname = 'passport_media_select_member'
      and cmd = 'SELECT' and roles = array['authenticated']::name[]
      and qual = 'private.is_workspace_member(workspace_id)'
  ) then
    raise exception 'passport_media workspace RLS must be enabled before granting member reads';
  end if;
end
$$;
grant select on table public.passport_media to authenticated;
