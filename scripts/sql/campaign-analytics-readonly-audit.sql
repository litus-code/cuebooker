-- Run separately in each project's SQL editor; no mutation, no identifiers/PII returned.
-- If the campaign foundation is missing, stop on the missing relation; do not create it.
begin transaction read only;
select dataset as collection_dataset_for_new_browsers from private.campaign_analytics_settings where singleton;
select name,version from supabase_migrations.schema_migrations
where name ilike '%campaign%' or name ilike '%analytics%' order by version;
select dataset,event_name,count(*) as events,count(distinct campaign_visitor_id) as browsers,
 count(distinct user_id) as accounts,count(distinct workspace_id) as workspaces,
 max(created_at) as latest_event
from public.product_analytics_events
where created_at>=now()-interval '30 days' and campaign_visitor_id is not null
group by dataset,event_name order by dataset,event_name;
select e.dataset,count(*) as instagram_events,count(distinct e.campaign_visitor_id) as instagram_browsers
from public.product_analytics_events e join private.campaign_visitors v on v.id=e.campaign_visitor_id and v.consent
where e.created_at>=now()-interval '30 days' and e.properties->>'utm_source'='instagram'
 and e.properties->>'utm_medium'='social' and e.properties->>'utm_campaign'='launch2026'
group by e.dataset;
select n.nspname as schema,p.proname,pg_get_function_identity_arguments(p.oid) as arguments,
 p.prosecdef as security_definer,md5(pg_get_functiondef(p.oid)) as source_hash,
 has_function_privilege('anon',p.oid,'execute') as anon_execute,
 has_function_privilege('authenticated',p.oid,'execute') as authenticated_execute,
 has_function_privilege('service_role',p.oid,'execute') as service_execute
from pg_proc p join pg_namespace n on n.oid=p.pronamespace
where n.nspname in ('public','private') and p.prokind='f'
 and (p.proname ilike '%campaign%' or p.proname='is_internal_admin') order by 1,2,3;
select n.nspname as schema,c.relname,c.relrowsecurity,
 has_table_privilege('anon',c.oid,'select') as anon_select,
 has_table_privilege('authenticated',c.oid,'select') as authenticated_select
from pg_class c join pg_namespace n on n.oid=c.relnamespace
where n.nspname='private' and c.relkind='r' and c.relname ilike '%campaign%' order by 1,2;
select count(*) as internal_admin_count from public.internal_admins;
-- Do not include cron command text or return_message: those can contain secrets.
select j.jobid,j.jobname,j.schedule,j.active,r.status as last_status,r.end_time as last_finished
from cron.job j left join lateral (
 select status,end_time from cron.job_run_details where jobid=j.jobid order by runid desc limit 1
) r on true where j.jobname='cuebooker-prune-campaign-analytics';
rollback;
