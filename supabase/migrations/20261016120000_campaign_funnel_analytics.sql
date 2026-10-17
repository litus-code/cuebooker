-- Prepared for review only. Not applied to a hosted project by this PR.
-- Reuse the existing event vocabulary, event store and internal-admin authorization.
begin;
create table private.campaign_analytics_settings (
 singleton boolean primary key default true check(singleton),
 dataset text not null default 'test' check(dataset in ('test','live'))
);
insert into private.campaign_analytics_settings default values;
create table private.campaign_visitors (
 id uuid primary key default gen_random_uuid(),
 token_hash text not null unique check(token_hash ~ '^[a-f0-9]{64}$'),
 created_at timestamptz not null default now(),
 consent boolean not null default true,
 dataset text not null check(dataset in ('test','live')),
 acquisition jsonb not null default '{}'
);
-- A shared browser can create multiple accounts. Never collapse accounts into visitors.
create table private.campaign_registrations (
 user_id uuid primary key references auth.users(id) on delete cascade,
 visitor_id uuid not null references private.campaign_visitors(id) on delete cascade,
 acquisition jsonb not null,
 dataset text not null check(dataset in ('test','live'))
);
alter table private.campaign_registrations enable row level security;
revoke all on private.campaign_registrations from public,anon,authenticated;
-- Non-personal retry tombstones: keep workspace milestone keys after optional facts are erased.
create table private.campaign_workspace_dedup (event_key text primary key,workspace_id uuid not null references public.workspaces(id) on delete cascade);
alter table private.campaign_workspace_dedup enable row level security;
revoke all on private.campaign_workspace_dedup from public,anon,authenticated;
alter table private.campaign_visitors enable row level security;
alter table private.campaign_analytics_settings enable row level security;
revoke all on private.campaign_visitors,private.campaign_analytics_settings from public,anon,authenticated;
alter table public.product_analytics_events alter column user_id drop not null;
alter table public.product_analytics_events add column campaign_visitor_id uuid references private.campaign_visitors(id) on delete cascade,
 add column event_key text unique,
 add column dataset text not null default 'legacy' check(dataset in ('legacy','test','live'));
alter table public.product_analytics_events drop constraint product_analytics_events_event_name_check;
alter table public.product_analytics_events add constraint product_analytics_events_event_name_check check(event_name in (
 'smart_capture_start','smart_capture_result','smart_capture_apply','smart_capture_discard',
 'passport_media_add_started','passport_media_linked','passport_media_link_failed',
 'passport_media_status_changed','passport_media_status_change_failed','automation_created','automation_completed',
 'page_view','signup_click','signup_started','signup_completed','onboarding_completed',
 'artist_profile_published','agency_catalog_published','workspace_first_request_received'
));
create index product_analytics_campaign_window_idx on public.product_analytics_events(dataset,created_at,event_name) where campaign_visitor_id is not null;
create index product_analytics_campaign_visitor_idx on public.product_analytics_events(campaign_visitor_id,created_at);
-- Direct inserts previously allowed arbitrary JSON. All writes now use the bounded RPCs.
revoke insert on public.product_analytics_events from authenticated;
drop policy product_analytics_events_insert_own on public.product_analytics_events;

create function private.clean_campaign_dimensions(input jsonb) returns jsonb
language sql immutable set search_path='' as $$
 select coalesce(jsonb_object_agg(key,value),'{}'::jsonb) from jsonb_each_text(coalesce(input,'{}'))
 where key in ('source','ref','utm_source','utm_medium','utm_campaign','utm_content','utm_term','page','placement','account_type')
 and value ~ '^[a-zA-Z0-9_.~-]{1,128}$'
 and (key<>'source' or value in ('dj','agency'))
 and (key<>'account_type' or value in ('dj','agency'))
 and (key<>'page' or value in ('home','dj','agency','access'));
$$;
revoke all on function private.clean_campaign_dimensions(jsonb) from public,anon,authenticated;

-- Revoke direct client-role grants as well as PUBLIC: Supabase default privileges
-- can grant EXECUTE to anon/authenticated for the migration owner.
create function public.record_campaign_event(visitor_token text,event_key uuid,event_name text,dimensions jsonb default '{}')
returns boolean language plpgsql security definer set search_path='' as $$
declare visitor private.campaign_visitors; clean jsonb; fingerprint text;
begin
 if visitor_token !~ '^[a-f0-9]{64}$' or visitor_token is null or event_key is null then raise exception 'invalid_campaign_event'; end if;
 if event_name not in ('page_view','signup_click','signup_started') or event_name is null then raise exception 'unsupported_campaign_event'; end if;
 if jsonb_typeof(dimensions)<>'object' or octet_length(dimensions::text)>2048 then raise exception 'invalid_campaign_dimensions'; end if;
 clean:=private.clean_campaign_dimensions(dimensions);
 if clean->>'page' not in ('home','dj','agency','access') or clean->>'page' is null then raise exception 'invalid_campaign_page'; end if;
 if event_name='page_view' and clean->>'page'='access' then return false; end if;
 if event_name='signup_click' and clean->>'placement' is null then raise exception 'missing_campaign_placement'; end if;
 fingerprint:=encode(sha256(convert_to(visitor_token,'UTF8')),'hex');
 insert into private.campaign_visitors(token_hash,dataset,acquisition)
 select fingerprint,dataset,clean - 'page' - 'placement' from private.campaign_analytics_settings where singleton
 on conflict(token_hash) do nothing;
 select * into visitor from private.campaign_visitors where token_hash=fingerprint for update;
 if not visitor.consent or visitor.created_at<now()-interval '30 days' then return false; end if;
 -- Bounded per-browser collector. No account data, IP or user-agent retention.
 if (select count(*) from public.product_analytics_events e where e.campaign_visitor_id=visitor.id and e.created_at>now()-interval '1 hour')>=200 then return false; end if;
 insert into public.product_analytics_events(event_name,properties,campaign_visitor_id,event_key,dataset)
 values(event_name,clean,visitor.id,event_key::text,visitor.dataset) on conflict do nothing;
 return true;
end; $$;
revoke all on function public.record_campaign_event(text,uuid,text,jsonb) from public,anon,authenticated;
grant execute on function public.record_campaign_event(text,uuid,text,jsonb) to service_role;

create function public.revoke_campaign_consent(visitor_token text) returns void
language plpgsql security definer set search_path='' as $$
declare visitor uuid;
begin
 if visitor_token !~ '^[a-f0-9]{64}$' or visitor_token is null then return; end if;
 update private.campaign_visitors set consent=false,acquisition='{}'
 where token_hash=encode(sha256(convert_to(visitor_token,'UTF8')),'hex') returning id into visitor;
 delete from public.product_analytics_events where campaign_visitor_id=visitor;
 delete from private.campaign_registrations where visitor_id=visitor;
end; $$;
revoke all on function public.revoke_campaign_consent(text) from public,anon,authenticated;
grant execute on function public.revoke_campaign_consent(text) to service_role;

-- Only an actual newly created auth account can produce a persisted signup_completed.
-- Client dataLayer signup_completed stays an API-accepted signal, never a second stored signup.
create function private.campaign_signup_created() returns trigger
language plpgsql security definer set search_path='' as $$
declare visitor private.campaign_visitors; clean jsonb;
begin
 -- Signup metadata is a transport envelope, not a second indefinitely retained attribution store.
 if new.raw_user_meta_data ? 'cuebooker_campaign' then
  update auth.users set raw_user_meta_data=raw_user_meta_data-'cuebooker_campaign' where id=new.id;
 end if;
 select * into visitor from private.campaign_visitors where token_hash=new.raw_user_meta_data->'cuebooker_campaign'->>'token_hash' for update;
 if visitor.id is null or not visitor.consent or visitor.created_at<now()-interval '30 days' then return new; end if;
 clean:=private.clean_campaign_dimensions(new.raw_user_meta_data->'cuebooker_campaign');
 insert into private.campaign_registrations values(new.id,visitor.id,visitor.acquisition || clean,visitor.dataset) on conflict do nothing;
 insert into public.product_analytics_events(user_id,event_name,properties,campaign_visitor_id,event_key,dataset,created_at)
 values(new.id,'signup_completed',visitor.acquisition || clean || jsonb_build_object('page','access'),visitor.id,'signup:'||new.id,visitor.dataset,new.created_at) on conflict do nothing;
 return new;
exception when others then
 -- Analytics must not prevent account creation. Categorical warning only.
 begin
  update auth.users set raw_user_meta_data=raw_user_meta_data-'cuebooker_campaign' where id=new.id;
 exception when others then raise warning 'campaign_metadata_cleanup_failed'; end;
 raise warning 'campaign_signup_measurement_failed'; return new;
end; $$;
revoke all on function private.campaign_signup_created() from public,anon,authenticated;
create trigger campaign_signup_created after insert on auth.users for each row execute function private.campaign_signup_created();

create function private.record_campaign_milestone(target_user uuid,target_workspace uuid,target_event text,target_key text,actual_type text default null)
returns void language plpgsql security definer set search_path='' as $$
declare registration private.campaign_registrations;
begin
 select r.* into registration from private.campaign_registrations r join private.campaign_visitors v on v.id=r.visitor_id
 where r.user_id=target_user and v.consent and v.created_at>now()-interval '30 days';
 if registration.user_id is null then return; end if;
 if target_event in ('workspace_first_request_received','artist_profile_published','agency_catalog_published') then
  insert into private.campaign_workspace_dedup values(target_key,target_workspace) on conflict do nothing;
  if not found then return; end if;
 end if;
 if actual_type is not null then
  update public.product_analytics_events set properties=properties || jsonb_build_object('account_type',actual_type) where event_key='signup:'||target_user;
 end if;
 insert into public.product_analytics_events(user_id,workspace_id,event_name,properties,campaign_visitor_id,event_key,dataset)
 values(target_user,target_workspace,target_event,registration.acquisition || case when actual_type is not null then jsonb_build_object('account_type',actual_type) else '{}'::jsonb end,registration.visitor_id,target_key,registration.dataset)
 on conflict(event_key) do update set workspace_id=coalesce(product_analytics_events.workspace_id,excluded.workspace_id),properties=product_analytics_events.properties || excluded.properties;
end; $$;
revoke all on function private.record_campaign_milestone(uuid,uuid,text,text,text) from public,anon,authenticated;

-- Onboarding is an account milestone. Attach only its first owned workspace, never every agency member.
create function private.campaign_onboarding_completed() returns trigger
language plpgsql security definer set search_path='' as $$
declare target_user uuid; w uuid; kind text;
begin
 if tg_table_name='profiles' then
  if not new.onboarding_completed or (tg_op='UPDATE' and old.onboarding_completed) then return new; end if;
  target_user:=new.user_id;
 else
  if new.role::text<>'owner' then return new; end if;
  target_user:=new.user_id;
  if not exists(select 1 from public.profiles where user_id=target_user and onboarding_completed) then return new; end if;
 end if;
 select m.workspace_id,case when ws.kind::text='agency' then 'agency' else 'dj' end into w,kind
 from public.workspace_members m join public.workspaces ws on ws.id=m.workspace_id
 where m.user_id=target_user and m.role::text='owner' order by m.created_at,m.workspace_id limit 1;
 if kind is null then
  select case when ws.kind::text='agency' then 'agency' else 'dj' end into kind from public.workspace_members m join public.workspaces ws on ws.id=m.workspace_id where m.user_id=target_user order by m.created_at limit 1;
 end if;
 perform private.record_campaign_milestone(target_user,w,'onboarding_completed','onboarding:'||target_user,kind);
 return new;
exception when others then raise warning 'campaign_onboarding_measurement_failed'; return new;
end; $$;
revoke all on function private.campaign_onboarding_completed() from public,anon,authenticated;
create trigger campaign_onboarding_completed after insert or update of onboarding_completed on public.profiles for each row execute function private.campaign_onboarding_completed();
create trigger campaign_workspace_attached after insert on public.workspace_members for each row execute function private.campaign_onboarding_completed();

create function private.campaign_workspace_milestone(w uuid,event text,event_key text) returns void
language plpgsql security definer set search_path='' as $$
declare owner_user uuid; kind text;
begin
 select m.user_id,case when ws.kind::text='agency' then 'agency' else 'dj' end into owner_user,kind
 from public.workspace_members m join public.workspaces ws on ws.id=m.workspace_id
 join private.campaign_registrations r on r.user_id=m.user_id
 join private.campaign_visitors v on v.id=r.visitor_id and v.consent
 where m.workspace_id=w and m.role::text='owner' order by m.created_at,m.user_id limit 1;
 if owner_user is not null then perform private.record_campaign_milestone(owner_user,w,event,event_key,kind); end if;
end; $$;
revoke all on function private.campaign_workspace_milestone(uuid,text,text) from public,anon,authenticated;

create function private.campaign_presence_published() returns trigger
language plpgsql security definer set search_path='' as $$
declare w uuid; event text;
begin
 if tg_table_name='artists' then
  if not new.public_profile_enabled or old.public_profile_enabled then return new; end if;
  -- Shared/previous agency membership is not publication ownership. Use the actual
  -- canonical booking route even when requests are closed. Only unambiguous legacy
  -- association is a valid fallback; never choose an arbitrary oldest workspace.
  select workspace_id into w from public.artist_booking_routes where artist_id=new.id;
  if w is null then
   select min(workspace_id::text)::uuid into w from public.workspace_artists where artist_id=new.id having count(*)=1;
  end if;
  event:='artist_profile_published';
 else
  if not new.agency_public_enabled or old.agency_public_enabled then return new; end if;
  select workspace_id into w from public.workspace_legacy_organizations where organization_id=new.id limit 1;
  event:='agency_catalog_published';
 end if;
 if w is not null then perform private.campaign_workspace_milestone(w,event,'publication:'||w); end if;
 return new;
exception when others then raise warning 'campaign_publication_measurement_failed'; return new;
end; $$;
revoke all on function private.campaign_presence_published() from public,anon,authenticated;
create trigger campaign_artist_published after update of public_profile_enabled on public.artists for each row execute function private.campaign_presence_published();
create trigger campaign_catalog_published after update of agency_public_enabled on public.organizations for each row execute function private.campaign_presence_published();

-- Received enquiry: public_form, email_import, or automatic mailbox ai_capture with email origin.
-- Automatic mailbox creation and validated message ingestion commit in the same transaction.
-- Manual captures, outbound messages and other AI inputs do not activate a workspace.
-- No historical first-request reconstruction: existing received enquiries disqualify a new 'first'.
create function private.campaign_first_request() returns trigger
language plpgsql security definer set search_path='' as $$
begin
 if (new.capture_method::text in ('public_form','email_import') or (new.capture_method::text='ai_capture' and new.origin_channel::text='email')) is not true then return new; end if;
 if tg_op='UPDATE' and (old.capture_method::text in ('public_form','email_import') or (old.capture_method::text='ai_capture' and old.origin_channel::text='email')) then return new; end if;
 perform pg_advisory_xact_lock(hashtextextended('campaign-first:'||new.workspace_id,0));
 if exists(select 1 from public.bookings where workspace_id=new.workspace_id and (created_at,id)<(new.created_at,new.id) and (capture_method::text in ('public_form','email_import') or (capture_method::text='ai_capture' and origin_channel::text='email'))) then return new; end if;
 perform private.campaign_workspace_milestone(new.workspace_id,'workspace_first_request_received','activation:'||new.workspace_id);
 return new;
exception when others then raise warning 'campaign_activation_measurement_failed'; return new;
end; $$;
revoke all on function private.campaign_first_request() from public,anon,authenticated;
create trigger campaign_first_request after insert or update of capture_method,origin_channel on public.bookings for each row execute function private.campaign_first_request();

-- Aggregate only. Never expose tokens, user IDs, email, booking content or per-visitor journeys.
create function public.get_campaign_funnel(from_at timestamptz,to_at timestamptz,filter_source text default null,filter_utm_source text default null,filter_campaign text default null,filter_ref text default null,filter_dataset text default 'live')
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare result jsonb;
begin
 if not public.is_internal_admin() then raise exception 'internal_admin_required'; end if;
 if from_at is null or to_at is null or to_at<=from_at or to_at-from_at>interval '366 days' then raise exception 'invalid_campaign_window'; end if;
 if filter_dataset not in ('live','test') or filter_dataset is null then raise exception 'invalid_campaign_dataset'; end if;
 with events as (
  select e.*,case e.event_name when 'page_view' then 'visit' when 'signup_click' then 'interest' when 'signup_completed' then 'registration' when 'onboarding_completed' then 'onboarding' when 'artist_profile_published' then 'publication' when 'agency_catalog_published' then 'publication' when 'workspace_first_request_received' then 'activation' end as step
  from public.product_analytics_events e join private.campaign_visitors v on v.id=e.campaign_visitor_id and v.consent
  where e.dataset=filter_dataset and e.created_at>=from_at and e.created_at<to_at
   and (filter_source is null or e.properties->>'source'=filter_source)
   and (filter_utm_source is null or e.properties->>'utm_source'=filter_utm_source)
   and (filter_campaign is null or e.properties->>'utm_campaign'=filter_campaign)
   and (filter_ref is null or e.properties->>'ref'=filter_ref)
 ), steps(step,ord) as (values ('visit',1),('interest',2),('registration',3),('onboarding',4),('publication',5),('activation',6)),
 metrics as (
  select s.step,s.ord,count(e.id) as events,count(distinct e.campaign_visitor_id) as visitors,count(distinct e.user_id) as users,count(distinct e.workspace_id) as workspaces
  from steps s left join events e on e.step=s.step group by s.step,s.ord
 ), pairs(a,b,unit) as (values ('visit','interest','visitors'),('interest','registration','visitors'),('registration','onboarding','users'),('onboarding','publication','workspaces'),('publication','activation','workspaces')),
 subjects as (
  select step,created_at,campaign_visitor_id::text as subject,'visitors' as unit from events where step in ('visit','interest','registration')
  union all select step,created_at,user_id::text,'users' from events where step in ('registration','onboarding') and user_id is not null
  union all select step,created_at,workspace_id::text,'workspaces' from events where step in ('onboarding','publication','activation') and workspace_id is not null
 ), firsts as (select step,subject,unit,min(created_at) as at from subjects group by step,subject,unit),
 conversions as (
  select p.a as from_step,p.b as to_step,p.unit,count(distinct f.subject) as denominator,count(distinct t.subject) as numerator
  from pairs p left join firsts f on f.step=p.a and f.unit=p.unit
  left join firsts t on t.step=p.b and t.unit=p.unit and t.subject=f.subject and t.at>=f.at group by p.a,p.b,p.unit
 ), breakdown as (
  select coalesce(properties->>'page','—') as page,coalesce(properties->>'placement','—') as placement,coalesce(properties->>'source','unknown') as audience,coalesce(properties->>'account_type','unknown') as account_type,
  step,count(*) as events,count(distinct campaign_visitor_id) as visitors,count(distinct user_id) as users
  from events where step in ('visit','interest','registration') group by 1,2,3,4,5
 )
 select jsonb_build_object('dataset',filter_dataset,'rows',(select jsonb_agg(to_jsonb(m)-'ord' order by ord) from metrics m),
 'conversions',(select coalesce(jsonb_agg(to_jsonb(c) order by array_position(array['visit','interest','registration','onboarding','publication'],c.from_step)),'[]') from conversions c),
 'breakdown',(select coalesce(jsonb_agg(to_jsonb(b) order by step,page,placement,audience),'[]') from breakdown b)) into result;
 return result;
end; $$;
revoke all on function public.get_campaign_funnel(timestamptz,timestamptz,text,text,text,text,text) from public,anon;
grant execute on function public.get_campaign_funnel(timestamptz,timestamptz,text,text,text,text,text) to authenticated;

-- Revocation and retention preserve no optional activity. Expired hashes are tombstones to
-- prevent old auth metadata from reviving consent; schedule this admin-only maintenance after deploy.
create function private.purge_campaign_analytics() returns void language plpgsql security definer set search_path='' as $$
begin
 update private.campaign_visitors set consent=false,acquisition='{}' where created_at<now()-interval '90 days';
 delete from public.product_analytics_events e using private.campaign_visitors v where e.campaign_visitor_id=v.id and not v.consent;
 delete from private.campaign_registrations r using private.campaign_visitors v where r.visitor_id=v.id and not v.consent;
end; $$;
revoke all on function private.purge_campaign_analytics() from public,anon,authenticated;
create function public.purge_campaign_analytics() returns void language plpgsql security definer set search_path='' as $$
begin
 if not public.is_internal_admin() then raise exception 'internal_admin_required'; end if;
 perform private.purge_campaign_analytics();
end; $$;
revoke all on function public.purge_campaign_analytics() from public,anon;
grant execute on function public.purge_campaign_analytics() to authenticated;
commit;
