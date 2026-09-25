begin;

grant select on table public.notifications to service_role;
grant select on table public.profiles to service_role;

comment on table public.notifications is
  'User-facing notification event stream. Service role select supports server-side delivery; authenticated access remains constrained by RLS.';

comment on table public.profiles is
  'User profile data. Service role select supports server-side notification personalization; authenticated access remains constrained by RLS.';

commit;
