begin;

create or replace function public.protect_workspace_last_owner()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  remaining_owners integer;
begin
  -- Deleting a workspace cascades into workspace_members through an FK trigger.
  -- Allow that nested delete while still protecting direct membership changes.
  if tg_op = 'DELETE' and pg_trigger_depth() > 1 then
    return old;
  end if;

  if old.role <> 'owner' then
    if tg_op = 'DELETE' then return old; end if;
    return new;
  end if;

  if tg_op = 'UPDATE' and new.role = 'owner' then
    return new;
  end if;

  select count(*) into remaining_owners
  from public.workspace_members wm
  where wm.workspace_id = old.workspace_id
    and wm.role = 'owner'
    and wm.user_id <> old.user_id;

  if remaining_owners = 0 then
    raise exception 'workspace_requires_owner';
  end if;

  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;

revoke all on function public.protect_workspace_last_owner() from public, anon, authenticated;

commit;
