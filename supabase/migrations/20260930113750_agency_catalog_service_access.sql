begin;
-- Server-only Edge reader uses invoker wrappers in the private schema.
grant usage on schema private to service_role;
commit;
