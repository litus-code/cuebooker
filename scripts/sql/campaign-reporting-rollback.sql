begin;
create or replace function public.get_campaign_funnel(from_at timestamptz,to_at timestamptz,filter_source text default null,filter_utm_source text default null,filter_campaign text default null,filter_ref text default null,filter_dataset text default 'live')
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

delete from supabase_migrations.schema_migrations where version='20261020120000' and name='campaign_reporting_diagnostics';
commit;
