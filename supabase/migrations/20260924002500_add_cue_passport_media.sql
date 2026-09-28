begin;

create type public.passport_media_source as enum ('manual', 'instagram', 'upload', 'other');
create type public.passport_media_type as enum ('image', 'video', 'reel');
create type public.passport_media_status as enum ('suggested', 'linked', 'hidden');

create table public.passport_media (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  booking_id uuid not null,
  source public.passport_media_source not null default 'manual',
  media_type public.passport_media_type not null,
  status public.passport_media_status not null default 'suggested',
  external_id text,
  permalink text,
  media_url text,
  thumbnail_url text,
  caption text,
  captured_at timestamptz,
  suggested_match_score smallint check (
    suggested_match_score is null
    or suggested_match_score between 0 and 100
  ),
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object'),
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (workspace_id, booking_id)
    references public.bookings(workspace_id, id) on delete cascade,
  check (
    external_id is not null
    or media_url is not null
    or permalink is not null
  )
);

create unique index passport_media_external_unique
on public.passport_media(workspace_id, source, external_id)
where external_id is not null;

create index passport_media_booking_idx
on public.passport_media(workspace_id, booking_id, status, captured_at desc);

create index passport_media_workspace_status_idx
on public.passport_media(workspace_id, status, captured_at desc);

create trigger passport_media_preserve_identity
before update on public.passport_media
for each row execute function private.preserve_workspace_record_identity();

create trigger passport_media_set_updated_at
before update on public.passport_media
for each row execute function public.set_updated_at();

alter table public.passport_media enable row level security;

create policy passport_media_select_member
on public.passport_media for select
to authenticated
using (private.is_workspace_member(workspace_id));

create policy passport_media_insert_editor
on public.passport_media for insert
to authenticated
with check (
  private.can_edit_workspace(workspace_id)
  and created_by = (select auth.uid())
);

create policy passport_media_update_editor
on public.passport_media for update
to authenticated
using (private.can_edit_workspace(workspace_id))
with check (private.can_edit_workspace(workspace_id));

create policy passport_media_delete_editor
on public.passport_media for delete
to authenticated
using (private.can_edit_workspace(workspace_id));

commit;
