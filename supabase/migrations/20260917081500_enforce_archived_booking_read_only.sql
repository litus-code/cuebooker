begin;

create or replace function private.guard_archived_booking_update()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if old.archived_at is null then
    return new;
  end if;

  if new.archived_at is not null then
    raise exception 'archived_booking_read_only';
  end if;

  if (to_jsonb(new) - 'archived_at' - 'updated_at')
       is distinct from
     (to_jsonb(old) - 'archived_at' - 'updated_at') then
    raise exception 'archived_booking_restore_only';
  end if;

  return new;
end;
$$;

create or replace function private.guard_archived_booking_child_mutation()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  target_workspace uuid := coalesce(new.workspace_id, old.workspace_id);
  target_booking uuid := coalesce(new.booking_id, old.booking_id);
begin
  if exists (
    select 1
    from public.bookings b
    where b.workspace_id = target_workspace
      and b.id = target_booking
      and b.archived_at is not null
  ) then
    raise exception 'archived_booking_read_only';
  end if;
  return coalesce(new, old);
end;
$$;

create or replace function private.guard_archived_booking_activity_insert()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if exists (
    select 1
    from public.bookings b
    where b.workspace_id = new.workspace_id
      and b.id = new.booking_id
      and b.archived_at is not null
  ) and not (
    new.type = 'system'
    and new.metadata->>'action' = 'archived'
  ) then
    raise exception 'archived_booking_read_only';
  end if;
  return new;
end;
$$;

drop trigger if exists bookings_guard_archived_update on public.bookings;
create trigger bookings_guard_archived_update
before update on public.bookings
for each row execute function private.guard_archived_booking_update();

drop trigger if exists next_moves_guard_archived_booking on public.next_moves;
create trigger next_moves_guard_archived_booking
before insert or update on public.next_moves
for each row execute function private.guard_archived_booking_child_mutation();

drop trigger if exists holds_guard_archived_booking on public.holds;
create trigger holds_guard_archived_booking
before insert or update on public.holds
for each row execute function private.guard_archived_booking_child_mutation();

drop trigger if exists activities_guard_archived_booking on public.activities;
create trigger activities_guard_archived_booking
before insert on public.activities
for each row execute function private.guard_archived_booking_activity_insert();

commit;
