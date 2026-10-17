-- Run against staging as postgres. Existing owner fixture required.
-- All temporary role changes are rolled back; no emails or invitations are sent.
begin;
select set_config('cuebooker.test_workspace',m.workspace_id::text,true),
       set_config('request.jwt.claim.sub',m.user_id::text,true)
from public.workspace_members m
join public.workspaces w on w.id=m.workspace_id
where w.kind='agency' and m.role='owner'
order by m.created_at limit 1;

set local role authenticated;
do $$
declare team_size integer;
begin
 select count(*) into team_size from public.list_agency_team(current_setting('cuebooker.test_workspace')::uuid);
 if team_size < 1 then raise exception 'owner_team_read_failed'; end if;
 perform count(*) from public.workspace_invitations
 where workspace_id=current_setting('cuebooker.test_workspace')::uuid;
end; $$;
reset role;

do $$
declare
 workspace uuid := current_setting('cuebooker.test_workspace')::uuid;
 owner_actor uuid := auth.uid();
 actor uuid;
 tested_role public.workspace_member_role;
begin
 if has_function_privilege('anon','public.list_agency_team(uuid)','EXECUTE') then
  raise exception 'anonymous_team_access';
 end if;
 begin
  perform public.manage_agency_member(workspace,owner_actor,'viewer');
  raise exception 'owner_change_allowed';
 exception when raise_exception then
  if sqlerrm <> 'owner_or_self_protected' then raise; end if;
 end;
 select u.id into actor from auth.users u
 where u.id <> owner_actor and not exists(
  select 1 from public.workspace_members m where m.workspace_id=workspace and m.user_id=u.id
 ) limit 1;
 if actor is null then raise exception 'second_test_actor_required'; end if;
 insert into public.workspace_members(workspace_id,user_id,role) values(workspace,actor,'admin');
 perform set_config('request.jwt.claim.sub',actor::text,true);
 foreach tested_role in array array['admin','manager','editor','viewer']::public.workspace_member_role[] loop
  update public.workspace_members set role=tested_role where workspace_id=workspace and user_id=actor;
  if tested_role in ('owner','admin') then
   perform count(*) from public.list_agency_team(workspace);
   begin
    perform public.manage_agency_member(workspace,actor,'viewer');
    raise exception 'self_change_allowed';
   exception when raise_exception then
    if sqlerrm <> 'owner_or_self_protected' then raise; end if;
   end;
  else
   begin
    perform count(*) from public.list_agency_team(workspace);
    raise exception 'restricted_role_allowed';
   exception when raise_exception then
    if sqlerrm <> 'workspace_access_denied' then raise; end if;
   end;
  end if;
 end loop;
 perform set_config('request.jwt.claim.sub',owner_actor::text,true);
 begin
  perform count(*) from public.list_agency_team(gen_random_uuid());
  raise exception 'foreign_workspace_allowed';
 exception when raise_exception then
  if sqlerrm <> 'workspace_access_denied' then raise; end if;
 end;
 perform set_config('request.jwt.claim.sub','',true);
 begin
  perform count(*) from public.list_agency_team(workspace);
  raise exception 'unauthenticated_actor_allowed';
 exception when raise_exception then
  if sqlerrm <> 'workspace_access_denied' then raise; end if;
 end;
end; $$;
rollback;
select 'team_contract_and_permissions_passed' as result;
