begin;

create policy public_booking_submissions_deny_client_access
on public.public_booking_submissions
for all
to anon, authenticated
using (false)
with check (false);

commit;
