begin;

-- Keep privileged bootstrap logic out of the exposed public API schema.
alter function public.ensure_booking_workspace(uuid, uuid) set schema private;

revoke all on function private.ensure_booking_workspace(uuid, uuid) from public, anon;
grant execute on function private.ensure_booking_workspace(uuid, uuid) to authenticated;

create function public.ensure_booking_workspace(
  target_organization_id uuid default null,
  target_artist_id uuid default null
)
returns uuid
language sql
security invoker
set search_path = ''
as $$
  select private.ensure_booking_workspace(target_organization_id, target_artist_id);
$$;

revoke all on function public.ensure_booking_workspace(uuid, uuid) from public, anon;
grant execute on function public.ensure_booking_workspace(uuid, uuid) to authenticated;

comment on function public.ensure_booking_workspace(uuid, uuid) is
  'Authenticated API wrapper. Privileged implementation lives in the private schema and validates legacy ownership before creating a Booking Core workspace.';

-- Cover foreign keys that can otherwise turn deletes/maintenance into table scans.
create index activities_actor_user_id_idx
  on public.activities(actor_user_id)
  where actor_user_id is not null;
create index activities_created_by_idx on public.activities(created_by);

create index booking_contacts_workspace_booking_idx
  on public.booking_contacts(workspace_id, booking_id);
create index booking_contacts_workspace_contact_idx
  on public.booking_contacts(workspace_id, contact_id);
create index booking_contacts_created_by_idx on public.booking_contacts(created_by);

create index bookings_created_by_idx on public.bookings(created_by);

create index contact_counterparties_workspace_contact_idx
  on public.contact_counterparties(workspace_id, contact_id);
create index contact_counterparties_workspace_counterparty_idx
  on public.contact_counterparties(workspace_id, counterparty_id);
create index contact_counterparties_created_by_idx
  on public.contact_counterparties(created_by);

create index contacts_created_by_idx on public.contacts(created_by);
create index counterparties_created_by_idx on public.counterparties(created_by);
create index workspace_artists_created_by_idx on public.workspace_artists(created_by);
create index workspaces_created_by_idx on public.workspaces(created_by);

commit;
