begin;

-- A short-lived staging-only Booking Core prototype was applied before the
-- workspace-tenant architecture was accepted. It never reached production and
-- contains no data. Keep this migration idempotent so production safely no-ops.

-- Tables first. CASCADE removes prototype-only triggers/policies/FKs.
drop table if exists public.booking_activities cascade;
drop table if exists public.bookings cascade;
drop table if exists public.booking_contacts cascade;
drop table if exists public.booking_organizations cascade;

-- Prototype RPC/helpers may survive table removal depending on their signatures.
drop function if exists public.open_booking(uuid) cascade;
drop function if exists public.decide_booking(uuid, public.booking_status, text) cascade;
drop function if exists public.add_booking_note(uuid, text) cascade;
drop function if exists private.open_booking(uuid) cascade;
drop function if exists private.decide_booking(uuid, public.booking_status, text) cascade;
drop function if exists private.add_booking_note(uuid, text) cascade;
drop function if exists private.record_booking_created() cascade;
drop function if exists private.can_access_artist_workspace(uuid) cascade;
drop function if exists private.can_manage_artist_workspace(uuid) cascade;

-- Enum names are reused by the accepted workspace-scoped Booking Core.
drop type if exists public.booking_activity_actor_type cascade;
drop type if exists public.booking_activity_type cascade;
drop type if exists public.booking_party_type cascade;
drop type if exists public.booking_status cascade;
drop type if exists public.booking_source cascade;

commit;
