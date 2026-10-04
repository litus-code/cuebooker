begin;
-- Invoker beta commands verify the account and send approval only to its
-- confirmed Auth email. No SECURITY DEFINER and no whole-table/password grant.
-- auth remains outside the exposed Data API schemas. Browser roles unchanged.
grant select(id,email,email_confirmed_at) on auth.users to service_role;
commit;
