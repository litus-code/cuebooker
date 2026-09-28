begin;

alter table public.workspace_billing
  alter column plan_code set default 'free',
  alter column status set default 'active',
  alter column trial_started_at drop not null,
  alter column trial_started_at drop default,
  alter column trial_ends_at drop not null,
  alter column trial_ends_at drop default;

update public.workspace_billing
set
  plan_code = 'free',
  status = 'active',
  trial_started_at = null,
  trial_ends_at = null,
  current_period_end = null,
  cancel_at_period_end = false
where provider is null
  and plan_code = 'solo';

alter table public.workspace_billing
  drop constraint if exists workspace_billing_plan_code_v1_check;

alter table public.workspace_billing
  add constraint workspace_billing_plan_code_v1_check
  check (plan_code in ('free','artist_pro','agency','solo'));

create or replace function private.ensure_workspace_billing()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.workspace_billing(
    workspace_id,
    plan_code,
    status
  ) values (
    new.id,
    'free',
    'active'
  )
  on conflict (workspace_id) do nothing;

  return new;
end;
$$;

revoke all on function private.ensure_workspace_billing() from public;

drop trigger if exists workspaces_start_trial on public.workspaces;
drop trigger if exists workspaces_ensure_billing on public.workspaces;

create trigger workspaces_ensure_billing
after insert on public.workspaces
for each row
execute function private.ensure_workspace_billing();

comment on table public.workspace_billing is
  'Workspace commercial state. Free is permanent and provider-free; Artist Pro and Agency may be backed by Stripe once billing is enabled. Legacy solo rows are accepted only for migration compatibility.';

comment on column public.workspace_billing.plan_code is
  'Cuebooker commercial plan: free, artist_pro or agency. solo is legacy compatibility only and must not be emitted by new application code.';

commit;
