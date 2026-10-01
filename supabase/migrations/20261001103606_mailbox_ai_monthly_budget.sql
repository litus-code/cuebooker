begin;
-- Conservative monthly attempt caps, not a dollar billing limit.
create table public.mailbox_ai_budget_settings (
 singleton boolean primary key default true check(singleton),
 monthly_app_attempts integer not null default 1000 check(monthly_app_attempts between 0 and 1000000),
 monthly_connection_attempts integer not null default 100 check(monthly_connection_attempts between 0 and 1000000)
);
insert into public.mailbox_ai_budget_settings(singleton) values(true);
create table public.mailbox_ai_attempts (
 id uuid primary key,
 workspace_id uuid references public.workspaces(id) on delete set null,
 connection_id uuid references public.mailbox_connections(id) on delete set null,
 month_start date not null,
 outcome text not null default 'reserved' check(outcome in ('reserved','succeeded','failed')),
 input_tokens integer check(input_tokens between 0 and 1000000),
 output_tokens integer check(output_tokens between 0 and 1000000),
 created_at timestamptz not null default now(),
 completed_at timestamptz
);
create index mailbox_ai_attempts_month on public.mailbox_ai_attempts(month_start);
create index mailbox_ai_attempts_connection on public.mailbox_ai_attempts(connection_id,month_start);
create index mailbox_ai_attempts_workspace on public.mailbox_ai_attempts(workspace_id);
alter table public.mailbox_ai_budget_settings enable row level security;
alter table public.mailbox_ai_attempts enable row level security;
revoke all on public.mailbox_ai_budget_settings,public.mailbox_ai_attempts from public,anon,authenticated;
grant select,insert,update on public.mailbox_ai_budget_settings,public.mailbox_ai_attempts to service_role;

create function public.reserve_mailbox_analysis(target_workspace uuid,target_actor uuid,target_connection uuid,target_request uuid)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare settings public.mailbox_ai_budget_settings; period date:=date_trunc('month',now() at time zone 'UTC')::date; app_used bigint; connection_used bigint;
begin
 if not exists(select 1 from public.mailbox_connections c join public.workspace_members m on m.workspace_id=c.workspace_id and m.user_id=c.user_id
  where c.id=target_connection and c.workspace_id=target_workspace and c.user_id=target_actor and c.status='connected' and m.role in ('owner','admin','manager','editor')) then
  raise exception 'workspace_access_denied';
 end if;
 if target_request is null then raise exception 'invalid_analysis_request'; end if;
 -- One lock serializes all reservations, including across workspaces/connections.
 select * into settings from public.mailbox_ai_budget_settings where singleton for update;
 if not found then return jsonb_build_object('error','mailbox_ai_budget_exhausted'); end if;
 if exists(select 1 from public.mailbox_ai_attempts where id=target_request) then
  return jsonb_build_object('error','mailbox_analysis_already_attempted');
 end if;
 select count(*),count(*) filter(where connection_id=target_connection) into app_used,connection_used
  from public.mailbox_ai_attempts where month_start=period;
 if app_used>=settings.monthly_app_attempts or connection_used>=settings.monthly_connection_attempts then
  return jsonb_build_object('error','mailbox_ai_budget_exhausted');
 end if;
 insert into public.mailbox_ai_attempts(id,workspace_id,connection_id,month_start) values(target_request,target_workspace,target_connection,period);
 return jsonb_build_object('reserved',true);
end;
$$;

create function public.complete_mailbox_analysis(target_workspace uuid,target_actor uuid,target_connection uuid,target_request uuid,target_outcome text,target_input_tokens integer default null,target_output_tokens integer default null)
returns jsonb language plpgsql security invoker set search_path='' as $$
begin
 if target_outcome not in ('succeeded','failed') or target_outcome is null then raise exception 'invalid_analysis_request'; end if;
 if not exists(select 1 from public.mailbox_connections c join public.workspace_members m on m.workspace_id=c.workspace_id and m.user_id=c.user_id
  where c.id=target_connection and c.workspace_id=target_workspace and c.user_id=target_actor and m.role in ('owner','admin','manager','editor')) then raise exception 'workspace_access_denied'; end if;
 update public.mailbox_ai_attempts set outcome=target_outcome,input_tokens=target_input_tokens,output_tokens=target_output_tokens,completed_at=now()
  where id=target_request and workspace_id=target_workspace and connection_id=target_connection and outcome='reserved';
 return jsonb_build_object('recorded',found);
end;
$$;
revoke all on function public.reserve_mailbox_analysis(uuid,uuid,uuid,uuid) from public,anon,authenticated;
revoke all on function public.complete_mailbox_analysis(uuid,uuid,uuid,uuid,text,integer,integer) from public,anon,authenticated;
grant execute on function public.reserve_mailbox_analysis(uuid,uuid,uuid,uuid),public.complete_mailbox_analysis(uuid,uuid,uuid,uuid,text,integer,integer) to service_role;
commit;
