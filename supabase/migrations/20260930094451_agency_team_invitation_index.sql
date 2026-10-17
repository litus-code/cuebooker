begin;
create index workspace_invitations_creator_idx on public.workspace_invitations(created_by);

-- The new system route must never be assigned to an artist public slug.
alter table public.artists add constraint artists_slug_agency_invite_reserved check (slug <> 'agency-invite') not valid;
alter table public.artists validate constraint artists_slug_agency_invite_reserved;
commit;
