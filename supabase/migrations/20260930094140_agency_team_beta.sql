begin;

-- Invitations are not a third Agency/Artist relation. Acceptance writes the
-- existing workspace_members and the legacy organization identity bridge.
create table public.workspace_invitations (
 id uuid primary key default gen_random_uuid(),
 workspace_id uuid not null references public.workspaces(id) on delete cascade,
 email text not null check (email = lower(trim(email)) and char_length(email) between 3 and 254),
 role public.workspace_member_role not null check (role in ('admin','manager','editor','viewer')),
 token_hash text not null unique,
 created_by uuid not null references auth.users(id),
 created_at timestamptz not null default now(),
 expires_at timestamptz not null default now() + interval '7 days',
 accepted_at timestamptz,
 revoked_at timestamptz
);
create index workspace_invitations_workspace_idx on public.workspace_invitations(workspace_id,created_at desc);
alter table public.workspace_invitations enable row level security;
create policy workspace_invitations_managers_read on public.workspace_invitations for select to authenticated using(private.can_manage_workspace(workspace_id));
revoke all on public.workspace_invitations from public,anon,authenticated;
grant select(id,workspace_id,email,role,created_by,created_at,expires_at,accepted_at,revoked_at) on public.workspace_invitations to authenticated;

create function private.create_agency_invitation(target_workspace_id uuid,invite_email text,invite_role public.workspace_member_role)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare raw_token text; invite_id uuid; normalized_email text := lower(trim(invite_email));
begin
 if (select auth.uid()) is null or not private.can_manage_workspace(target_workspace_id) then raise exception 'workspace_access_denied'; end if;
 if invite_role = 'owner' or (invite_role = 'admin' and not private.is_workspace_owner(target_workspace_id)) then raise exception 'role_access_denied'; end if;
 if normalized_email is null or normalized_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' or char_length(normalized_email)>254 then raise exception 'invalid_email'; end if;
 perform 1 from public.workspaces where id=target_workspace_id and kind='agency' for update;
 if not found then raise exception 'agency_not_found'; end if;
 if exists(select 1 from public.workspace_members m join auth.users u on u.id=m.user_id where m.workspace_id=target_workspace_id and lower(u.email)=normalized_email) then raise exception 'already_member'; end if;
 if (select count(*) from public.workspace_invitations where workspace_id=target_workspace_id and accepted_at is null and revoked_at is null and expires_at>now())>=50 then raise exception 'invitation_limit'; end if;
 update public.workspace_invitations set revoked_at=now() where workspace_id=target_workspace_id and email=normalized_email and accepted_at is null and revoked_at is null;
 raw_token := encode(extensions.gen_random_bytes(32),'hex');
 insert into public.workspace_invitations(workspace_id,email,role,token_hash,created_by) values(target_workspace_id,normalized_email,invite_role,encode(extensions.digest(raw_token,'sha256'),'hex'),(select auth.uid())) returning id into invite_id;
 return jsonb_build_object('id',invite_id,'token',raw_token,'expires_at',now()+interval '7 days');
end; $$;

create function private.review_agency_invitation(invite_token text,accept_invitation boolean default false)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare i public.workspace_invitations; current_email text; org_id uuid; agency_name text;
begin
 if (select auth.uid()) is null then raise exception 'authentication_required'; end if;
 if invite_token is null or invite_token !~ '^[a-f0-9]{64}$' then raise exception 'invitation_unavailable'; end if;
 select * into i from public.workspace_invitations where token_hash=encode(extensions.digest(invite_token,'sha256'),'hex') for update;
 if not found or i.revoked_at is not null or i.expires_at<=now() then raise exception 'invitation_unavailable'; end if;
 select lower(email) into current_email from auth.users where id=(select auth.uid()) and email_confirmed_at is not null;
 if current_email is distinct from i.email then raise exception 'invitation_email_mismatch'; end if;
 select name into agency_name from public.workspaces where id=i.workspace_id and kind='agency';
 if agency_name is null then raise exception 'agency_not_found'; end if;
 -- Revoking the inviter's admin role invalidates their unaccepted invitations.
 if i.accepted_at is null and not exists(select 1 from public.workspace_members where workspace_id=i.workspace_id and user_id=i.created_by and (role='owner' or (role='admin' and i.role<>'admin'))) then raise exception 'invitation_unavailable'; end if;
 if i.accepted_at is not null then
  if not private.is_workspace_member(i.workspace_id) then raise exception 'invitation_unavailable'; end if;
 elsif accept_invitation then
  select organization_id into org_id from public.workspace_legacy_organizations where workspace_id=i.workspace_id;
  if org_id is null then raise exception 'agency_identity_missing'; end if;
  -- Never overwrite an existing role, especially an owner, on retry/race.
  insert into public.workspace_members(workspace_id,user_id,role) values(i.workspace_id,(select auth.uid()),i.role) on conflict do nothing;
  insert into public.organization_members(organization_id,user_id,role) values(org_id,(select auth.uid()),case when i.role='admin' then 'admin'::public.organization_member_role else 'member'::public.organization_member_role end) on conflict do nothing;
  insert into public.profiles(user_id,onboarding_completed) values((select auth.uid()),true) on conflict(user_id) do update set onboarding_completed=true;
  update public.workspace_invitations set accepted_at=now() where id=i.id;
 end if;
 return jsonb_build_object('workspace_id',i.workspace_id,'agency_name',agency_name,'role',coalesce((select role from public.workspace_members where workspace_id=i.workspace_id and user_id=(select auth.uid())),i.role),'accepted',i.accepted_at is not null or accept_invitation);
end; $$;

create function private.manage_agency_member(target_workspace_id uuid,target_user_id uuid,new_role public.workspace_member_role default null)
returns void language plpgsql security definer set search_path = '' as $$
declare previous_role public.workspace_member_role; org_id uuid;
begin
 if (select auth.uid()) is null or not private.can_manage_workspace(target_workspace_id) then raise exception 'workspace_access_denied'; end if;
 perform 1 from public.workspaces where id=target_workspace_id and kind='agency' for update;
 if not found then raise exception 'agency_not_found'; end if;
 select role into previous_role from public.workspace_members where workspace_id=target_workspace_id and user_id=target_user_id for update;
 if previous_role is null then raise exception 'member_not_found'; end if;
 if previous_role='owner' or target_user_id=(select auth.uid()) or new_role='owner' then raise exception 'owner_or_self_protected'; end if;
 if (previous_role='admin' or new_role='admin') and not private.is_workspace_owner(target_workspace_id) then raise exception 'role_access_denied'; end if;
 select organization_id into org_id from public.workspace_legacy_organizations where workspace_id=target_workspace_id;
 if new_role is null then
  delete from public.workspace_members where workspace_id=target_workspace_id and user_id=target_user_id;
  delete from public.organization_members where organization_id=org_id and user_id=target_user_id;
  update public.workspace_invitations set revoked_at=now() where workspace_id=target_workspace_id and accepted_at is null and revoked_at is null and (created_by=target_user_id or email=(select lower(email) from auth.users where id=target_user_id));
 else
  update public.workspace_members set role=new_role where workspace_id=target_workspace_id and user_id=target_user_id;
  update public.organization_members set role=case when new_role='admin' then 'admin'::public.organization_member_role else 'member'::public.organization_member_role end where organization_id=org_id and user_id=target_user_id;
 end if;
end; $$;

create function private.list_agency_team(target_workspace_id uuid)
returns table(user_id uuid,display_name text,email text,role public.workspace_member_role) language plpgsql security definer set search_path = '' as $$
begin
 if (select auth.uid()) is null or not private.can_manage_workspace(target_workspace_id) then raise exception 'workspace_access_denied'; end if;
 if not exists(select 1 from public.workspaces where id=target_workspace_id and kind='agency') then raise exception 'agency_not_found'; end if;
 return query select m.user_id,p.display_name,u.email,m.role from public.workspace_members m join auth.users u on u.id=m.user_id left join public.profiles p on p.user_id=m.user_id where m.workspace_id=target_workspace_id order by m.created_at;
end; $$;

create function private.revoke_agency_invitation(target_invitation_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare i public.workspace_invitations;
begin
 select * into i from public.workspace_invitations where id=target_invitation_id for update;
 if (select auth.uid()) is null or i.id is null or not private.can_manage_workspace(i.workspace_id) then raise exception 'workspace_access_denied'; end if;
 if i.role='admin' and not private.is_workspace_owner(i.workspace_id) then raise exception 'role_access_denied'; end if;
 update public.workspace_invitations set revoked_at=now() where id=i.id and accepted_at is null;
end; $$;

-- Public invoker wrappers are explicit authenticated API contracts.
create function public.create_agency_invitation(target_workspace_id uuid,invite_email text,invite_role public.workspace_member_role) returns jsonb language sql security invoker set search_path = '' as $$ select private.create_agency_invitation(target_workspace_id,invite_email,invite_role); $$;
create function public.review_agency_invitation(invite_token text,accept_invitation boolean default false) returns jsonb language sql security invoker set search_path = '' as $$ select private.review_agency_invitation(invite_token,accept_invitation); $$;
create function public.manage_agency_member(target_workspace_id uuid,target_user_id uuid,new_role public.workspace_member_role default null) returns void language sql security invoker set search_path = '' as $$ select private.manage_agency_member(target_workspace_id,target_user_id,new_role); $$;
create function public.list_agency_team(target_workspace_id uuid) returns table(user_id uuid,display_name text,email text,role public.workspace_member_role) language sql security invoker set search_path = '' as $$ select * from private.list_agency_team(target_workspace_id); $$;
create function public.revoke_agency_invitation(target_invitation_id uuid) returns void language sql security invoker set search_path = '' as $$ select private.revoke_agency_invitation(target_invitation_id); $$;

revoke all on function private.create_agency_invitation(uuid,text,public.workspace_member_role), private.review_agency_invitation(text,boolean), private.manage_agency_member(uuid,uuid,public.workspace_member_role), private.list_agency_team(uuid), private.revoke_agency_invitation(uuid), public.create_agency_invitation(uuid,text,public.workspace_member_role), public.review_agency_invitation(text,boolean), public.manage_agency_member(uuid,uuid,public.workspace_member_role), public.list_agency_team(uuid), public.revoke_agency_invitation(uuid) from public,anon;
grant execute on function private.create_agency_invitation(uuid,text,public.workspace_member_role), private.review_agency_invitation(text,boolean), private.manage_agency_member(uuid,uuid,public.workspace_member_role), private.list_agency_team(uuid), private.revoke_agency_invitation(uuid), public.create_agency_invitation(uuid,text,public.workspace_member_role), public.review_agency_invitation(text,boolean), public.manage_agency_member(uuid,uuid,public.workspace_member_role), public.list_agency_team(uuid), public.revoke_agency_invitation(uuid) to authenticated;
commit;
