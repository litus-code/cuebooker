begin;
alter table public.mailbox_connections
 add column background_analysis_enabled boolean not null default false,
 add column background_analysis_processor text,
 add column background_analysis_since timestamptz,
 add column background_analysis_revision uuid,
 add constraint mailbox_background_consent_complete check (
  (not background_analysis_enabled and background_analysis_processor is null and background_analysis_since is null and background_analysis_revision is null)
  or (background_analysis_enabled and background_analysis_processor is not null and background_analysis_processor='groq-gpt-oss-20b-v1' and background_analysis_since is not null and background_analysis_revision is not null)
 );

create function public.reset_mailbox_background_consent()
returns trigger language plpgsql security invoker set search_path='' as $$
begin
 if new.grant_id is distinct from old.grant_id or new.connected_at is distinct from old.connected_at or new.status<>'connected' then
  new.background_analysis_enabled:=false;
  new.background_analysis_processor:=null;
  new.background_analysis_since:=null;
  new.background_analysis_revision:=null;
 end if;
 return new;
end;
$$;
create trigger mailbox_connection_consent_reset before update on public.mailbox_connections
for each row execute function public.reset_mailbox_background_consent();
revoke all on function public.reset_mailbox_background_consent() from public,anon,authenticated;
grant execute on function public.reset_mailbox_background_consent() to service_role;

create function public.set_mailbox_background_analysis(target_workspace uuid,target_actor uuid,target_connection uuid,target_enabled boolean,target_processor text)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare c public.mailbox_connections;
begin
 if target_enabled is null or (target_enabled and target_processor is distinct from 'groq-gpt-oss-20b-v1') then
  raise exception 'mailbox_background_consent_required';
 end if;
 if not exists(select 1 from public.workspace_members where workspace_id=target_workspace and user_id=target_actor and role in ('owner','admin','manager','editor')) then
  raise exception 'workspace_access_denied';
 end if;
 select * into c from public.mailbox_connections where id=target_connection and workspace_id=target_workspace and user_id=target_actor for update;
 if not found then raise exception 'connection_not_found'; end if;
 if target_enabled and c.status<>'connected' then raise exception 'mailbox_reconnect_required'; end if;
 -- Repeated authorization preserves the cutover/revision; reauthorization after pause starts fresh.
 update public.mailbox_connections set
  background_analysis_enabled=target_enabled,
  background_analysis_processor=case when target_enabled then target_processor end,
  background_analysis_since=case when target_enabled then coalesce(c.background_analysis_since,clock_timestamp()) end,
  background_analysis_revision=case when target_enabled then coalesce(c.background_analysis_revision,gen_random_uuid()) end
 where id=c.id returning * into c;
 return jsonb_build_object('enabled',c.background_analysis_enabled,'processor',c.background_analysis_processor,'since',c.background_analysis_since,'revision',c.background_analysis_revision);
end;
$$;
revoke all on function public.set_mailbox_background_analysis(uuid,uuid,uuid,boolean,text) from public,anon,authenticated;
grant execute on function public.set_mailbox_background_analysis(uuid,uuid,uuid,boolean,text) to service_role;
commit;
