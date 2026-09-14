begin;

create table public.organization_artists (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  artist_id uuid not null references public.artists(id) on delete cascade,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  primary key (organization_id, artist_id)
);

create index organization_artists_artist_id_idx on public.organization_artists(artist_id);
create index organization_artists_created_by_idx on public.organization_artists(created_by);

alter table public.organization_artists enable row level security;
revoke all on table public.organization_artists from anon, authenticated;
grant select, insert, delete on table public.organization_artists to authenticated;

create policy organization_artists_select_member
on public.organization_artists for select
to authenticated
using (
  private.is_organization_member(organization_id)
  or private.is_artist_member(artist_id)
);

create policy organization_artists_insert_managers
on public.organization_artists for insert
to authenticated
with check (
  private.can_manage_organization(organization_id)
  and private.can_manage_artist(artist_id)
  and created_by = (select auth.uid())
);

create policy organization_artists_delete_managers
on public.organization_artists for delete
to authenticated
using (private.can_manage_organization(organization_id));

create or replace function public.add_agency_artist(
  target_organization_id uuid,
  artist_name text,
  artist_slug text
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
  created_artist_id uuid;
begin
  if current_user_id is null then
    raise exception 'authentication_required';
  end if;

  if not private.can_manage_organization(target_organization_id) then
    raise exception 'organization_access_denied';
  end if;

  if char_length(trim(coalesce(artist_name, ''))) < 1 then
    raise exception 'invalid_artist_name';
  end if;

  if artist_slug is null or artist_slug <> lower(artist_slug)
    or artist_slug !~ '^[a-z0-9]+(?:-[a-z0-9]+)*$' then
    raise exception 'invalid_artist_slug';
  end if;

  insert into public.artists (stage_name, slug, created_by)
  values (trim(artist_name), artist_slug, current_user_id)
  returning id into created_artist_id;

  insert into public.organization_artists (organization_id, artist_id, created_by)
  values (target_organization_id, created_artist_id, current_user_id);

  return created_artist_id;
end;
$$;

revoke all on function public.add_agency_artist(uuid, text, text) from public, anon;
grant execute on function public.add_agency_artist(uuid, text, text) to authenticated;

commit;
