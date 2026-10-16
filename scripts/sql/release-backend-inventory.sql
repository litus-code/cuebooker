-- Read-only release comparison. No rows, credentials, cron commands or function bodies
-- leave the database. Run separately on the explicit staging and production projects.
-- Compare definitions as well as migration versions: historical timestamp drift exists.
begin transaction read only;
select current_setting('server_version') as postgres_version;
select version from supabase_migrations.schema_migrations order by version;
select extname, extversion from pg_extension order by extname;
select n.nspname as schema, c.relname as relation, c.relkind,
       c.relrowsecurity, c.relforcerowsecurity,
       md5(coalesce(string_agg(a.attname || ':' || format_type(a.atttypid,a.atttypmod)
         || ':' || a.attnotnull::text || ':' || coalesce(pg_get_expr(d.adbin,d.adrelid),''),
         ',' order by a.attnum),'')) as columns_hash
from pg_class c join pg_namespace n on n.oid=c.relnamespace
left join pg_attribute a on a.attrelid=c.oid and a.attnum>0 and not a.attisdropped
left join pg_attrdef d on d.adrelid=c.oid and d.adnum=a.attnum
where n.nspname in ('public','private','auth','storage') and c.relkind in ('r','p','v','m')
group by n.nspname,c.relname,c.relkind,c.relrowsecurity,c.relforcerowsecurity
order by 1,2;
select n.nspname as schema, p.proname, pg_get_function_identity_arguments(p.oid) as arguments,
       p.prosecdef as security_definer, p.proacl::text as grants,
       md5(pg_get_functiondef(p.oid)) as definition_hash
from pg_proc p join pg_namespace n on n.oid=p.pronamespace
where n.nspname in ('public','private') and p.prokind in ('f','p') order by 1,2,3;
select schemaname,tablename,policyname,roles,cmd,
       md5(coalesce(qual,'') || ':' || coalesce(with_check,'')) as definition_hash
from pg_policies where schemaname in ('public','private','storage') order by 1,2,3;
select n.nspname as schema,c.relname,t.tgname,t.tgenabled,
       md5(pg_get_triggerdef(t.oid)) as definition_hash
from pg_trigger t join pg_class c on c.oid=t.tgrelid
join pg_namespace n on n.oid=c.relnamespace
where not t.tgisinternal and n.nspname in ('public','private','auth') order by 1,2,3;
select table_schema,table_name,grantee,privilege_type
from information_schema.role_table_grants
where table_schema in ('public','private','storage') order by 1,2,3,4;
select n.nspname as schema,c.relname,k.conname,k.contype,k.convalidated,
       md5(pg_get_constraintdef(k.oid)) as definition_hash
from pg_constraint k join pg_class c on c.oid=k.conrelid
join pg_namespace n on n.oid=c.relnamespace
where n.nspname in ('public','private','auth','storage') order by 1,2,3;
select schemaname,tablename,indexname,md5(indexdef) as definition_hash
from pg_indexes where schemaname in ('public','private','auth','storage') order by 1,2,3;
rollback;
