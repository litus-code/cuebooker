begin;
-- Private attachments belong to an existing inbound email + its Booking Core workspace.
insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('booking-email-attachments','booking-email-attachments',false,5242880,
 array['application/pdf','image/jpeg','image/png'])
on conflict (id) do update set public=false,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;

create table if not exists public.booking_email_attachments (
 id uuid primary key default gen_random_uuid(),
 workspace_id uuid not null,
 booking_id uuid not null,
 email_message_id uuid not null,
 attachment_index integer not null check (attachment_index between 0 and 19),
 file_name text not null check (char_length(file_name) between 1 and 200),
 content_type text not null check (content_type in ('application/pdf','image/jpeg','image/png')),
 byte_size integer not null check (byte_size between 1 and 5242880),
 storage_path text not null unique,
 created_at timestamptz not null default now(),
 unique (email_message_id, attachment_index),
 foreign key(workspace_id,booking_id) references public.bookings(workspace_id,id) on delete cascade,
 foreign key(workspace_id,email_message_id) references public.email_messages(workspace_id,id) on delete cascade
);
-- A message cannot be attached to a different booking in the same workspace.
create or replace function private.verify_booking_email_attachment()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  if not exists (
    select 1 from public.email_messages em
    where em.id = new.email_message_id
      and em.workspace_id = new.workspace_id
      and em.booking_id = new.booking_id
      and em.direction = 'inbound'
  ) then
    raise exception 'attachment_email_booking_mismatch';
  end if;
  return new;
end;
$$;
create trigger booking_email_attachments_validate_link
before insert or update on public.booking_email_attachments
for each row execute function private.verify_booking_email_attachment();

create index if not exists booking_email_attachments_booking_idx on public.booking_email_attachments(workspace_id,booking_id,created_at);
alter table public.booking_email_attachments enable row level security;
create policy booking_email_attachments_member_read on public.booking_email_attachments
 for select to authenticated using (private.is_workspace_member(workspace_id));
grant select on public.booking_email_attachments to authenticated;
grant select,insert on public.booking_email_attachments to service_role;
-- No direct client read of Storage objects: implement authorised signed-URL endpoint separately.
commit;

