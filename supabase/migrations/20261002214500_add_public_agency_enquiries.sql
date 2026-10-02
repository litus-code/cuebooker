begin;
create table public.public_agency_enquiry_submissions (
 id uuid primary key default gen_random_uuid(),
 organization_id uuid not null references public.organizations(id) on delete cascade,
 workspace_id uuid not null references public.workspaces(id) on delete cascade,
 idempotency_key uuid not null,
 request_fingerprint text not null check(request_fingerprint ~ '^[0-9a-f]{64}$'),
 booking_id uuid not null,
 created_at timestamptz not null default now(),
 unique(organization_id,idempotency_key),
 foreign key(workspace_id,booking_id) references public.bookings(workspace_id,id) on delete cascade
);
alter table public.public_agency_enquiry_submissions enable row level security;
revoke all on public.public_agency_enquiry_submissions from public,anon,authenticated;
grant all on public.public_agency_enquiry_submissions to service_role;

create function private.create_public_agency_enquiry(
 target_agency_slug text,target_idempotency_key uuid,target_request_fingerprint text,
 contact_name text,contact_email text,initial_message text
) returns table(booking_id uuid,created boolean)
language plpgsql security definer set search_path='' as $$
declare
 normalized_slug text:=lower(trim(coalesce(target_agency_slug,'')));
 normalized_name text:=nullif(trim(coalesce(contact_name,'')),'');
 normalized_email text:=lower(trim(coalesce(contact_email,'')));
 normalized_message text:=nullif(trim(coalesce(initial_message,'')),'');
 resolved_org uuid; resolved_workspace uuid; resolved_contact uuid;
 existing_booking uuid; existing_fingerprint text; new_booking uuid;
begin
 if normalized_slug='' or char_length(normalized_slug)>120 or normalized_slug !~ '^[a-z0-9]+(?:-[a-z0-9]+)*$' then raise exception 'invalid_agency_slug'; end if;
 if target_idempotency_key is null then raise exception 'idempotency_key_required'; end if;
 if target_request_fingerprint is null or target_request_fingerprint !~ '^[0-9a-f]{64}$' then raise exception 'invalid_request_fingerprint'; end if;
 if normalized_name is null or char_length(normalized_name)>160 then raise exception 'invalid_contact_name'; end if;
 if normalized_email='' or char_length(normalized_email)>320 or normalized_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then raise exception 'invalid_contact_email'; end if;
 if normalized_message is null or char_length(normalized_message)>10000 then raise exception 'invalid_message'; end if;

 select o.id,l.workspace_id into resolved_org,resolved_workspace
 from public.organizations o
 join public.workspace_legacy_organizations l on l.organization_id=o.id
 join public.workspaces w on w.id=l.workspace_id and w.kind='agency'
 where o.type='agency' and o.slug=normalized_slug and o.agency_public_enabled=true
 limit 1;
 if resolved_org is null or resolved_workspace is null then raise exception 'public_agency_unavailable'; end if;

 perform pg_advisory_xact_lock(hashtextextended(resolved_org::text||':'||target_idempotency_key::text,0));
 select submission.booking_id,submission.request_fingerprint into existing_booking,existing_fingerprint
 from public.public_agency_enquiry_submissions submission
 where submission.organization_id=resolved_org and submission.idempotency_key=target_idempotency_key;
 if existing_booking is not null then
  if existing_fingerprint<>target_request_fingerprint then raise exception 'idempotency_key_reused'; end if;
  return query select existing_booking,false; return;
 end if;

 select c.id into resolved_contact from public.contacts c
 where c.workspace_id=resolved_workspace and lower(coalesce(c.email,''))=normalized_email
 order by c.created_at asc limit 1;
 if resolved_contact is null then
  insert into public.contacts(workspace_id,name,email,created_by) values(resolved_workspace,normalized_name,normalized_email,null) returning id into resolved_contact;
 end if;

 insert into public.bookings(workspace_id,artist_id,primary_contact_id,source,origin_channel,capture_method,entry_source,status,created_by)
 values(resolved_workspace,null,resolved_contact,'booking_form','booking_form','public_form','agency_catalog','new',null)
 returning id into new_booking;
 insert into public.activities(workspace_id,booking_id,type,direction,contact_id,actor_user_id,body,metadata,visibility,created_by)
 values(resolved_workspace,new_booking,'note','inbound',resolved_contact,null,normalized_message,
  jsonb_build_object('capture','public_form','origin_channel','booking_form','entry_source','agency_catalog','kind','agency_enquiry','submitted_contact_name',normalized_name),
  'workspace',null);
 insert into public.booking_contacts(workspace_id,booking_id,contact_id,role_label,created_by)
 values(resolved_workspace,new_booking,resolved_contact,'primary',null);
 insert into public.public_agency_enquiry_submissions(organization_id,workspace_id,idempotency_key,request_fingerprint,booking_id)
 values(resolved_org,resolved_workspace,target_idempotency_key,target_request_fingerprint,new_booking);
 return query select new_booking,true;
end;
$$;
revoke all on function private.create_public_agency_enquiry(text,uuid,text,text,text,text) from public,anon,authenticated;
grant execute on function private.create_public_agency_enquiry(text,uuid,text,text,text,text) to service_role;
create function public.create_public_agency_enquiry(target_agency_slug text,target_idempotency_key uuid,target_request_fingerprint text,contact_name text,contact_email text,initial_message text)
returns table(booking_id uuid,created boolean) language sql security invoker set search_path='' as $$
 select * from private.create_public_agency_enquiry(target_agency_slug,target_idempotency_key,target_request_fingerprint,contact_name,contact_email,initial_message);
$$;
revoke all on function public.create_public_agency_enquiry(text,uuid,text,text,text,text) from public,anon,authenticated;
grant execute on function public.create_public_agency_enquiry(text,uuid,text,text,text,text) to service_role;
commit;
