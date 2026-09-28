begin;

create table if not exists public.workspace_billing (
  workspace_id uuid primary key references public.workspaces(id) on delete cascade,
  plan_code text not null default 'solo',
  status text not null default 'trialing'
    check (status in ('trialing','active','past_due','canceled','incomplete','paused')),
  trial_started_at timestamptz not null default now(),
  trial_ends_at timestamptz not null default (now() + interval '30 days'),
  provider text null check (provider is null or provider = 'stripe'),
  provider_customer_id text null,
  provider_subscription_id text null,
  current_period_end timestamptz null,
  cancel_at_period_end boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (trial_ends_at > trial_started_at)
);

create unique index if not exists workspace_billing_provider_customer_uidx
  on public.workspace_billing(provider_customer_id)
  where provider_customer_id is not null;

create unique index if not exists workspace_billing_provider_subscription_uidx
  on public.workspace_billing(provider_subscription_id)
  where provider_subscription_id is not null;

alter table public.workspace_billing enable row level security;

drop policy if exists workspace_billing_select_managers on public.workspace_billing;
create policy workspace_billing_select_managers
on public.workspace_billing
for select
to authenticated
using (
  exists (
    select 1
    from public.workspace_members wm
    where wm.workspace_id = workspace_billing.workspace_id
      and wm.user_id = (select auth.uid())
      and wm.role in ('owner','admin')
  )
);

revoke all on public.workspace_billing from anon;
revoke insert, update, delete on public.workspace_billing from authenticated;
grant select on public.workspace_billing to authenticated;
grant all on public.workspace_billing to service_role;

create or replace function private.ensure_workspace_trial()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.workspace_billing(
    workspace_id,
    plan_code,
    status,
    trial_started_at,
    trial_ends_at
  ) values (
    new.id,
    'solo',
    'trialing',
    now(),
    now() + interval '30 days'
  )
  on conflict (workspace_id) do nothing;

  return new;
end;
$$;

revoke all on function private.ensure_workspace_trial() from public;

drop trigger if exists workspaces_start_trial on public.workspaces;
create trigger workspaces_start_trial
after insert on public.workspaces
for each row
execute function private.ensure_workspace_trial();

insert into public.workspace_billing(
  workspace_id,
  plan_code,
  status,
  trial_started_at,
  trial_ends_at
)
select
  w.id,
  'solo',
  'trialing',
  now(),
  now() + interval '30 days'
from public.workspaces w
on conflict (workspace_id) do nothing;

comment on table public.workspace_billing is
  'Non-enforcing billing/trial foundation. New workspaces receive a 30-day Solo trial. Stripe identifiers are reserved for later billing integration.';

commit;