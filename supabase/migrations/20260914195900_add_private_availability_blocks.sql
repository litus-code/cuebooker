begin;

create type public.availability_block_status as enum ('unavailable', 'hold', 'confirmed');

create table public.availability_blocks (
  id uuid primary key default gen_random_uuid(),
  artist_id uuid not null references public.artists(id) on delete cascade,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status public.availability_block_status not null default 'unavailable',
  label text,
  note text,
  booking_reference text,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint availability_blocks_time_order check (ends_at > starts_at),
  constraint availability_blocks_label_length check (label is null or char_length(label) <= 160),
  constraint availability_blocks_note_length check (note is null or char_length(note) <= 2000),
  constraint availability_blocks_booking_reference_length check (
    booking_reference is null or char_length(booking_reference) <= 160
  )
);

create index availability_blocks_artist_time_idx
  on public.availability_blocks(artist_id, starts_at, ends_at);

create index availability_blocks_booking_reference_idx
  on public.availability_blocks(booking_reference)
  where booking_reference is not null;

create trigger availability_blocks_set_updated_at
before update on public.availability_blocks
for each row execute function public.set_updated_at();

alter table public.availability_blocks enable row level security;

create policy availability_blocks_select_artist_members
on public.availability_blocks for select
to authenticated
using (private.is_artist_member(artist_id));

create policy availability_blocks_insert_artist_managers
on public.availability_blocks for insert
to authenticated
with check (
  created_by = (select auth.uid())
  and private.can_manage_artist(artist_id)
);

create policy availability_blocks_update_artist_managers
on public.availability_blocks for update
to authenticated
using (private.can_manage_artist(artist_id))
with check (private.can_manage_artist(artist_id));

create policy availability_blocks_delete_artist_managers
on public.availability_blocks for delete
to authenticated
using (private.can_manage_artist(artist_id));

revoke all on public.availability_blocks from anon, authenticated;
grant select, insert, update, delete on public.availability_blocks to authenticated;

commit;
