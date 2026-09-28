-- Internal beta analytics foundation.
-- This migration is intentionally not auto-seeded: founder/admin access must be granted explicitly.

create table if not exists public.internal_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.internal_admins enable row level security;

revoke all on public.internal_admins from anon, authenticated;
grant select on public.internal_admins to authenticated;

drop policy if exists internal_admins_read_self on public.internal_admins;
create policy internal_admins_read_self
on public.internal_admins
for select
to authenticated
using (user_id = auth.uid());

create table if not exists public.product_analytics_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  workspace_id uuid null references public.workspaces(id) on delete cascade,
  event_name text not null check (
    event_name in (
      'smart_capture_start',
      'smart_capture_result',
      'smart_capture_apply',
      'smart_capture_discard',
      'passport_media_add_started',
      'passport_media_linked',
      'passport_media_link_failed',
      'passport_media_status_changed',
      'passport_media_status_change_failed',
      'automation_created',
      'automation_completed'
    )
  ),
  properties jsonb not null default '{}'::jsonb check (jsonb_typeof(properties) = 'object'),
  created_at timestamptz not null default now()
);

create index if not exists product_analytics_events_created_at_idx
  on public.product_analytics_events(created_at desc);

create index if not exists product_analytics_events_user_created_idx
  on public.product_analytics_events(user_id, created_at desc);

create index if not exists product_analytics_events_workspace_created_idx
  on public.product_analytics_events(workspace_id, created_at desc)
  where workspace_id is not null;

alter table public.product_analytics_events enable row level security;

revoke all on public.product_analytics_events from anon, authenticated;
grant select, insert on public.product_analytics_events to authenticated;

drop policy if exists product_analytics_events_insert_own on public.product_analytics_events;
create policy product_analytics_events_insert_own
on public.product_analytics_events
for insert
to authenticated
with check (
  user_id = auth.uid()
  and (
    workspace_id is null
    or exists (
      select 1
      from public.workspace_members wm
      where wm.workspace_id = product_analytics_events.workspace_id
        and wm.user_id = auth.uid()
    )
  )
);

drop policy if exists product_analytics_events_admin_read on public.product_analytics_events;
create policy product_analytics_events_admin_read
on public.product_analytics_events
for select
to authenticated
using (
  exists (
    select 1
    from public.internal_admins ia
    where ia.user_id = auth.uid()
  )
);

create or replace function public.is_internal_admin()
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select exists (
    select 1
    from public.internal_admins ia
    where ia.user_id = auth.uid()
  );
$$;

revoke all on function public.is_internal_admin() from public;
grant execute on function public.is_internal_admin() to authenticated;

create or replace function public.record_product_analytics_event(
  target_workspace_id uuid,
  target_event_name text,
  target_properties jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  inserted_id uuid;
begin
  if auth.uid() is null then
    raise exception 'authentication_required';
  end if;

  if target_event_name not in (
    'smart_capture_start',
    'smart_capture_result',
    'smart_capture_apply',
    'smart_capture_discard',
    'passport_media_add_started',
    'passport_media_linked',
    'passport_media_link_failed',
    'passport_media_status_changed',
    'passport_media_status_change_failed',
    'automation_created',
    'automation_completed'
  ) then
    raise exception 'unsupported_product_event';
  end if;

  if target_workspace_id is not null and not exists (
    select 1
    from public.workspace_members wm
    where wm.workspace_id = target_workspace_id
      and wm.user_id = auth.uid()
  ) then
    raise exception 'workspace_access_denied';
  end if;

  insert into public.product_analytics_events(user_id, workspace_id, event_name, properties)
  values (
    auth.uid(),
    target_workspace_id,
    target_event_name,
    coalesce(target_properties, '{}'::jsonb)
  )
  returning id into inserted_id;

  return inserted_id;
end;
$$;

revoke all on function public.record_product_analytics_event(uuid, text, jsonb) from public;
grant execute on function public.record_product_analytics_event(uuid, text, jsonb) to authenticated;

create or replace function public.get_beta_analytics_summary(window_days integer default 30)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, auth
as $$
declare
  since_at timestamptz;
begin
  if not public.is_internal_admin() then
    raise exception 'internal_admin_required';
  end if;

  window_days := greatest(1, least(coalesce(window_days, 30), 365));
  since_at := now() - make_interval(days => window_days);

  return jsonb_build_object(
    'window_days', window_days,
    'users_total', (select count(*) from public.profiles),
    'users_new', (select count(*) from public.profiles where created_at >= since_at),
    'onboarding_completed', (select count(*) from public.profiles where onboarding_completed),
    'bookings_created', (select count(*) from public.bookings where created_at >= since_at),
    'bookings_confirmed', (select count(*) from public.bookings where status = 'confirmed' and updated_at >= since_at),
    'smart_capture_started', (select count(*) from public.product_analytics_events where event_name = 'smart_capture_start' and created_at >= since_at),
    'smart_capture_results', (select count(*) from public.product_analytics_events where event_name = 'smart_capture_result' and created_at >= since_at),
    'smart_capture_applied', (select count(*) from public.product_analytics_events where event_name = 'smart_capture_apply' and created_at >= since_at),
    'smart_capture_discarded', (select count(*) from public.product_analytics_events where event_name = 'smart_capture_discard' and created_at >= since_at),
    'media_linked', (select count(*) from public.passport_media where created_at >= since_at),
    'media_failures', (select count(*) from public.product_analytics_events where event_name in ('passport_media_link_failed','passport_media_status_change_failed') and created_at >= since_at),
    'automations_created', (select count(*) from public.next_moves where completion_trigger = 'inbound_activity' and created_at >= since_at),
    'automations_completed', (select count(*) from public.next_moves where completion_trigger = 'inbound_activity' and completed_at is not null and completed_at >= since_at),
    'active_users', (
      select count(distinct user_id)
      from (
        select pae.user_id from public.product_analytics_events pae where pae.created_at >= since_at
        union
        select b.created_by from public.bookings b where b.created_by is not null and b.created_at >= since_at
        union
        select pm.created_by from public.passport_media pm where pm.created_by is not null and pm.created_at >= since_at
        union
        select nm.created_by from public.next_moves nm where nm.created_by is not null and nm.created_at >= since_at
      ) activity
      where user_id is not null
    )
  );
end;
$$;

revoke all on function public.get_beta_analytics_summary(integer) from public;
grant execute on function public.get_beta_analytics_summary(integer) to authenticated;

create or replace function public.get_beta_analytics_users(window_days integer default 30)
returns table (
  user_id uuid,
  email text,
  display_name text,
  onboarding_completed boolean,
  account_type text,
  registered_at timestamptz,
  bookings bigint,
  smart_cue bigint,
  media bigint,
  automations bigint,
  last_activity timestamptz
)
language plpgsql
stable
security definer
set search_path = public, auth
as $$
declare
  since_at timestamptz;
begin
  if not public.is_internal_admin() then
    raise exception 'internal_admin_required';
  end if;

  window_days := greatest(1, least(coalesce(window_days, 30), 365));
  since_at := now() - make_interval(days => window_days);

  return query
  with user_workspaces as (
    select
      wm.user_id,
      string_agg(distinct w.kind::text, ', ' order by w.kind::text) as account_type
    from public.workspace_members wm
    join public.workspaces w on w.id = wm.workspace_id
    group by wm.user_id
  ),
  booking_counts as (
    select wm.user_id, count(distinct b.id)::bigint as value
    from public.workspace_members wm
    join public.bookings b on b.workspace_id = wm.workspace_id
    where b.created_at >= since_at
    group by wm.user_id
  ),
  smart_counts as (
    select pae.user_id, count(*)::bigint as value
    from public.product_analytics_events pae
    where pae.event_name like 'smart_capture_%'
      and pae.created_at >= since_at
    group by pae.user_id
  ),
  media_counts as (
    select wm.user_id, count(distinct pm.id)::bigint as value
    from public.workspace_members wm
    join public.passport_media pm on pm.workspace_id = wm.workspace_id
    where pm.created_at >= since_at
    group by wm.user_id
  ),
  automation_counts as (
    select wm.user_id, count(distinct nm.id)::bigint as value
    from public.workspace_members wm
    join public.next_moves nm on nm.workspace_id = wm.workspace_id
    where nm.completion_trigger = 'inbound_activity'
      and nm.created_at >= since_at
    group by wm.user_id
  ),
  last_seen as (
    select actor_user_id as user_id, max(activity_at) as value
    from (
      select pae.user_id as actor_user_id, pae.created_at as activity_at
      from public.product_analytics_events pae
      union all
      select b.created_by, b.created_at from public.bookings b where b.created_by is not null
      union all
      select pm.created_by, pm.created_at from public.passport_media pm where pm.created_by is not null
      union all
      select nm.created_by, nm.created_at from public.next_moves nm where nm.created_by is not null
    ) all_activity
    group by actor_user_id
  )
  select
    p.user_id,
    u.email::text,
    p.display_name,
    p.onboarding_completed,
    coalesce(uw.account_type, 'unknown')::text,
    p.created_at,
    coalesce(bc.value, 0),
    coalesce(sc.value, 0),
    coalesce(mc.value, 0),
    coalesce(ac.value, 0),
    greatest(p.updated_at, ls.value)
  from public.profiles p
  join auth.users u on u.id = p.user_id
  left join user_workspaces uw on uw.user_id = p.user_id
  left join booking_counts bc on bc.user_id = p.user_id
  left join smart_counts sc on sc.user_id = p.user_id
  left join media_counts mc on mc.user_id = p.user_id
  left join automation_counts ac on ac.user_id = p.user_id
  left join last_seen ls on ls.user_id = p.user_id
  order by greatest(p.updated_at, ls.value) desc nulls last, p.created_at desc;
end;
$$;

revoke all on function public.get_beta_analytics_users(integer) from public;
grant execute on function public.get_beta_analytics_users(integer) to authenticated;
