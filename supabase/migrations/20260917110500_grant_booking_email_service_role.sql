begin;

-- Edge Functions authenticate independently and then use the service role only
-- for the narrow provider-side work that cannot be exposed to browser clients.
-- Keep these grants explicit instead of relying on broad schema privileges.
grant select on public.workspaces to service_role;
grant select on public.workspace_members to service_role;
grant select on public.contacts to service_role;
grant select on public.bookings to service_role;
grant select on public.booking_contacts to service_role;

grant select, insert, update on public.email_messages to service_role;
grant select, insert on public.activities to service_role;

commit;
