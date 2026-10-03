-- Keep the existing authorization boundary; normalize auth.users.email to the RPC contract.
create or replace function private.list_agency_team(target_workspace_id uuid)
returns table(user_id uuid, display_name text, email text, role public.workspace_member_role)
language plpgsql security definer set search_path = '' as $$
begin
 if (select auth.uid()) is null or not private.can_manage_workspace(target_workspace_id) then
  raise exception 'workspace_access_denied';
 end if;
 if not exists(select 1 from public.workspaces where id=target_workspace_id and kind='agency') then
  raise exception 'agency_not_found';
 end if;
 return query
 select m.user_id, p.display_name, u.email::text, m.role
 from public.workspace_members m
 join auth.users u on u.id=m.user_id
 left join public.profiles p on p.user_id=m.user_id
 where m.workspace_id=target_workspace_id
 order by m.created_at, m.user_id;
end; $$;
