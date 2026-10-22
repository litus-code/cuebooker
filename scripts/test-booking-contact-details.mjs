// Isolated PostgreSQL fixture, real old/new commands, no hosted user data.
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
const { PGlite } = await import(process.env.PGLITE_MODULE || '@electric-sql/pglite')
const db = new PGlite()
await db.exec(`
create role anon; create role authenticated; create role service_role;
create schema auth; create schema private;
create function auth.uid() returns uuid language sql as $$select nullif(current_setting('test.uid',true),'')::uuid$$;
create table workspace_members(workspace_id uuid,user_id uuid,role text);
create function private.can_edit_workspace(w uuid) returns boolean language sql security definer set search_path='' as $$
select exists(select 1 from public.workspace_members where workspace_id=w and user_id=auth.uid() and role in ('owner','editor'))$$;
create table contacts(id uuid primary key default gen_random_uuid(),workspace_id uuid,name text not null check(length(trim(name)) between 1 and 160),email text,phone text,role_label text,notes text,created_by uuid,unique(workspace_id,id));
create table bookings(id uuid primary key default gen_random_uuid(),workspace_id uuid,primary_contact_id uuid,event_name text,venue_name text,city text,country_code text,event_date date,start_time time,end_time time,event_timezone text,offer_amount_minor bigint,currency text,fee_basis text,status text default 'new',archived_at timestamptz,unique(workspace_id,id),foreign key(workspace_id,primary_contact_id) references contacts(workspace_id,id),check(status<>'confirmed' or event_date is not null));
create table booking_contacts(workspace_id uuid,booking_id uuid,contact_id uuid,created_by uuid,primary key(booking_id,contact_id),foreign key(workspace_id,booking_id) references bookings(workspace_id,id),foreign key(workspace_id,contact_id) references contacts(workspace_id,id));
create table activities(workspace_id uuid,booking_id uuid,type text,direction text,actor_user_id uuid,body text,metadata jsonb,visibility text,created_by uuid);
grant usage on schema public,auth,private to authenticated;
grant select,insert,update on contacts,bookings,booking_contacts to authenticated;
grant select,insert on activities to authenticated;
alter table contacts enable row level security;
alter table bookings enable row level security;
alter table booking_contacts enable row level security;
alter table activities enable row level security;
create policy contacts_member on contacts to authenticated using(private.can_edit_workspace(workspace_id)) with check(private.can_edit_workspace(workspace_id));
create policy bookings_member on bookings to authenticated using(private.can_edit_workspace(workspace_id)) with check(private.can_edit_workspace(workspace_id));
create policy links_member on booking_contacts to authenticated using(private.can_edit_workspace(workspace_id)) with check(private.can_edit_workspace(workspace_id));
create policy activity_member on activities to authenticated using(private.can_edit_workspace(workspace_id)) with check(private.can_edit_workspace(workspace_id));
`)
for (const file of ['20260918032500_allow_overnight_booking_times.sql','20261022153614_booking_details_with_contact.sql']) {
 await db.exec(await readFile(new URL('../supabase/migrations/'+file,import.meta.url),'utf8'))
}
let checks=0
const q=async(sql,p=[]) => (await db.query(sql,p)).rows
const scalar=async(sql,p=[]) => Object.values((await q(sql,p))[0])[0]
const check=(v,m)=>{assert.ok(v,m);checks++}
const U=crypto.randomUUID(), W=crypto.randomUUID(), other=crypto.randomUUID()
await q("insert into workspace_members values($1,$2,'owner')",[W,U])
const B=await scalar("insert into bookings(workspace_id,event_name) values($1,'Original') returning id",[W])
const foreignB=await scalar("insert into bookings(workspace_id) values($1) returning id",[other])
await q("select set_config('test.uid',$1,false)",[U]); await db.exec('set role authenticated')
const invoke=async(opts={}) => {
 const o={w:W,b:B,id:null,name:'Marta',email:'MARTA@example.invalid',phone:'123',event:'Changed',...opts}
 return scalar('select to_jsonb(public.update_booking_details_with_contact($1,$2,$3,$4,$5,$6,next_event_name:=$7))',[o.w,o.b,o.id,o.name,o.email,o.phone,o.event])
}
const made=await invoke()
check(!!made.primary_contact_id,'missing contact created and linked')
check(await scalar('select email from contacts where id=$1',[made.primary_contact_id])==='marta@example.invalid','email normalized')
check(await scalar('select count(*) from booking_contacts where booking_id=$1',[B])===1,'association stored')
check(made.event_name==='Changed','booking saved too')
await q("update contacts set role_label='Promoter',notes='Keep me' where id=$1",[made.primary_contact_id])
const before=await scalar('select count(*) from activities')
await invoke({id:made.primary_contact_id,email:'new@example.invalid'})
check(await scalar('select count(*) from contacts')===1,'existing identity reused')
check(await scalar('select notes from contacts')==='Keep me','unexposed contact fields preserved')
await invoke({id:made.primary_contact_id,email:'new@example.invalid'})
check(await scalar('select count(*) from activities')===before+1,'same values do not duplicate activity')
async function denied(opts,pattern) {await assert.rejects(()=>invoke(opts),pattern);checks++}
await denied({id:null},/booking_contact_changed/)
await denied({id:made.primary_contact_id,email:'invalid'},/invalid_contact_email/)
await denied({id:made.primary_contact_id,name:''},/contact_name_required/)
await denied({w:other,b:foreignB},/workspace_access_denied/)
await denied({b:foreignB},/booking_not_found/)
await denied({id:crypto.randomUUID()},/booking_contact_changed/)
check(await scalar('select event_name from bookings where id=$1',[B])==='Changed','invalid input preserves booking')
await db.exec('reset role')
await q('update bookings set archived_at=now() where id=$1',[B])
await db.exec('set role authenticated')
await denied({id:made.primary_contact_id},/booking_archived/)
await db.exec('reset role')
await q('update bookings set archived_at=null where id=$1',[B])
// Fail after the booking write to prove the transaction rolls back both sides.
await db.exec(`create function reject_person() returns trigger language plpgsql as $$begin raise exception 'fixture_contact_failure';end$$;
create trigger reject_person before update on contacts for each row execute function reject_person();set role authenticated;`)
await denied({id:made.primary_contact_id,event:'Must rollback',name:'Changed name'},/fixture_contact_failure/)
check(await scalar('select event_name from bookings where id=$1',[B])==='Changed','late failure rolls booking back')
check(await scalar('select name from contacts')==='Marta','late failure rolls contact back')
await db.exec('reset role; drop trigger reject_person on contacts')
await q("update workspace_members set role='viewer' where user_id=$1",[U])
await db.exec('set role authenticated')
await denied({id:made.primary_contact_id},/workspace_access_denied/)
await db.exec('reset role; set role anon')
await denied({},/permission denied/)
await db.exec('reset role')
check(await scalar(`select not prosecdef from pg_proc where proname='update_booking_details_with_contact'`),'invoker keeps RLS')
check(await scalar(`select not has_function_privilege('service_role',oid,'EXECUTE') from pg_proc where proname='update_booking_details_with_contact'`),'no service/public default execute grant')
await db.close()
console.log(JSON.stringify({checks,environment:'isolated PGlite, minimal dependency schema; real command SQL'}))
