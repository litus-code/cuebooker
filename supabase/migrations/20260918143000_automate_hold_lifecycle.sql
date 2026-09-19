begin;

create or replace function private.release_expired_holds(
  target_limit integer default 100
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_hold public.holds;
  released_count integer := 0;
  activity_time timestamptz;
begin
  if target_limit < 1 or target_limit > 500 then
    raise exception 'invalid_hold_expiry_batch_size';
  end if;

  for current_hold in
    select h.*
    from public.holds h
    where h.status = 'active'
      and h.expires_at is not null
      and h.expires_at <= now()
    order by h.expires_at asc, h.created_at asc
    limit target_limit
    for update skip locked
  loop
    activity_time := now();

    update public.holds
    set status = 'released',
        released_at = activity_time
    where id = current_hold.id
      and status = 'active';

    if found then
      insert into public.activities (
        workspace_id,
        booking_id,
        type,
        direction,
        actor_user_id,
        body,
        metadata,
        visibility,
        occurred_at,
        created_by
      ) values (
        current_hold.workspace_id,
        current_hold.booking_id,
        'hold_released',
        'internal',
        null,
        null,
        jsonb_build_object(
          'hold_id', current_hold.id,
          'automatic', true,
          'reason', 'hold_expired',
          'expires_at', current_hold.expires_at
        ),
        'workspace',
        activity_time,
        null
      );

      released_count := released_count + 1;
    end if;
  end loop;

  return released_count;
end;
$$;

revoke all on function private.release_expired_holds(integer)
  from public, anon, authenticated;

comment on function private.release_expired_holds(integer) is
  'Automatically releases active holds after their explicit expires_at deadline and records a system Activity. It never changes the Booking commercial decision state.';

create or replace function private.release_holds_after_terminal_booking_decision()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  changed_hold public.holds;
  actor_id uuid := (select auth.uid());
  activity_time timestamptz := now();
  release_reason text;
begin
  if new.status is not distinct from old.status then
    return new;
  end if;

  if new.status not in ('rejected', 'cancelled') then
    return new;
  end if;

  release_reason := case
    when new.status = 'rejected' then 'booking_rejected'
    else 'booking_cancelled'
  end;

  for changed_hold in
    update public.holds
    set status = 'released',
        released_at = activity_time
    where workspace_id = new.workspace_id
      and booking_id = new.id
      and status = 'active'
    returning *
  loop
    insert into public.activities (
      workspace_id,
      booking_id,
      type,
      direction,
      actor_user_id,
      body,
      metadata,
      visibility,
      occurred_at,
      created_by
    ) values (
      new.workspace_id,
      new.id,
      'hold_released',
      'internal',
      actor_id,
      null,
      jsonb_build_object(
        'hold_id', changed_hold.id,
        'automatic', true,
        'reason', release_reason
      ),
      'workspace',
      activity_time,
      actor_id
    );
  end loop;

  return new;
end;
$$;

drop trigger if exists bookings_release_holds_after_terminal_decision
  on public.bookings;

create trigger bookings_release_holds_after_terminal_decision
after update of status on public.bookings
for each row
execute function private.release_holds_after_terminal_booking_decision();

revoke all on function private.release_holds_after_terminal_booking_decision()
  from public, anon, authenticated;

comment on function private.release_holds_after_terminal_booking_decision() is
  'Automatically releases active holds after a human rejects or cancels a Booking. The human owns the decision; hold cleanup is derived system work.';

do $$
declare
  existing_job_id bigint;
begin
  select jobid
  into existing_job_id
  from cron.job
  where jobname = 'cuebooker-expire-holds'
  limit 1;

  if existing_job_id is not null then
    perform cron.unschedule(existing_job_id);
  end if;

  perform cron.schedule(
    'cuebooker-expire-holds',
    '*/5 * * * *',
    'select private.release_expired_holds(100);'
  );
end;
$$;

commit;
