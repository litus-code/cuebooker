begin;
set local lock_timeout = '3s';
set local statement_timeout = '30s';

-- Memberships use (entity_id,user_id) as their primary key, not an id column.
-- Lock the parent to serialize concurrent owner removals. A parent cascade
-- has no remaining parent row and must be allowed to remove its memberships.
create or replace function private.prevent_last_artist_owner_change()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if old.role = 'owner' and (tg_op = 'DELETE' or new.role <> 'owner') then
    perform 1 from public.artists where id = old.artist_id for update;
    if found and not exists (
      select 1 from public.artist_members am
      where am.artist_id = old.artist_id and am.role = 'owner'
        and am.user_id <> old.user_id
    ) then
      raise exception 'artist must keep at least one owner' using errcode = '23514';
    end if;
  end if;
  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;

create or replace function private.prevent_last_organization_owner_change()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if old.role = 'owner' and (tg_op = 'DELETE' or new.role <> 'owner') then
    perform 1 from public.organizations where id = old.organization_id for update;
    if found and not exists (
      select 1 from public.organization_members om
      where om.organization_id = old.organization_id and om.role = 'owner'
        and om.user_id <> old.user_id
    ) then
      raise exception 'organization must keep at least one owner' using errcode = '23514';
    end if;
  end if;
  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;

revoke all on function private.prevent_last_artist_owner_change() from public,anon,authenticated;
revoke all on function private.prevent_last_organization_owner_change() from public,anon,authenticated;
commit;
