-- Safe bounded diagnostics; never filenames, message bodies or provider errors.
alter table public.email_messages
  add column attachment_warnings jsonb not null default '[]'::jsonb,
  add constraint email_messages_attachment_warnings_bounded check (
    jsonb_typeof(attachment_warnings) = 'array'
    and jsonb_array_length(attachment_warnings) <= 10
    and octet_length(attachment_warnings::text) <= 2048
  );
comment on column public.email_messages.attachment_warnings is
  'Bounded attachment diagnostic codes (index, reason, optional format); no private filenames or provider errors.';
