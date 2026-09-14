begin;

create or replace function private.prevent_last_organization_owner_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.role = 'owner' and (tg_op = 'DELETE' or new.role <> 'owner') then
    if exists (select 1 from public.organizations o where o.id = old.organization_id) and
       (select count(*) from public.organization_members om where om.organization_id = old.organization_id and om.role = 'owner' and om.id <> old.id) = 0 then
      raise exception 'organization must keep at least one owner' using errcode = '23514';
    end if;
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;

  return new;
end;
$$;

create or replace function private.prevent_last_artist_owner_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.role = 'owner' and (tg_op = 'DELETE' or new.role <> 'owner') then
    if exists (select 1 from public.artists a where a.id = old.artist_id) and
       (select count(*) from public.artist_members am where am.artist_id = old.artist_id and am.role = 'owner' and am.id <> old.id) = 0 then
      raise exception 'artist must keep at least one owner' using errcode = '23514';
    end if;
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;

  return new;
end;
$$;

revoke all on function private.prevent_last_organization_owner_change() from public, anon, authenticated;
revoke all on function private.prevent_last_artist_owner_change() from public, anon, authenticated;

drop trigger if exists protect_last_organization_owner on public.organization_members;
create trigger protect_last_organization_owner
before update of role or delete on public.organization_members
for each row execute function private.prevent_last_organization_owner_change();

drop trigger if exists protect_last_artist_owner on public.artist_members;
create trigger protect_last_artist_owner
before update of role or delete on public.artist_members
for each row execute function private.prevent_last_artist_owner_change();

commit;
