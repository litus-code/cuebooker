/** Isolated PostgreSQL-WASM contract test; never connects to Supabase.
 * PGLITE_MODULE=/absolute/path/to/@electric-sql/pglite/dist/index.js node scripts/test-campaign-analytics.mjs
 * Minimal dependency schema is explicit; this is not a full migration-chain rehearsal.
 */
import { readFile } from 'node:fs/promises'
import assert from 'node:assert/strict'
const { PGlite } = await import(process.env.PGLITE_MODULE || '@electric-sql/pglite')
const db = new PGlite()
await db.exec(`
 create role anon; create role authenticated; create role service_role bypassrls; create schema auth; create schema private;
 create function auth.uid() returns uuid language sql as $$select nullif(current_setting('test.user_id',true),'')::uuid$$;
 create table auth.users(id uuid primary key default gen_random_uuid(),email text,raw_user_meta_data jsonb default '{}',created_at timestamptz default now());
 create table public.profiles(user_id uuid primary key references auth.users(id),display_name text,onboarding_completed boolean default false,created_at timestamptz default now(),updated_at timestamptz default now());
 create table public.workspaces(id uuid primary key default gen_random_uuid(),kind text,created_at timestamptz default now());
 create table public.workspace_members(workspace_id uuid references public.workspaces(id),user_id uuid references auth.users(id),role text,created_at timestamptz default now(),primary key(workspace_id,user_id));
 create table public.artists(id uuid primary key default gen_random_uuid(),public_profile_enabled boolean default false);
 create table public.organizations(id uuid primary key default gen_random_uuid(),agency_public_enabled boolean default false);
 create table public.workspace_artists(workspace_id uuid,artist_id uuid,created_at timestamptz default now());
 create table public.artist_booking_routes(artist_id uuid primary key,workspace_id uuid);
 create table public.workspace_legacy_organizations(workspace_id uuid,organization_id uuid);
 create table public.bookings(id uuid primary key default gen_random_uuid(),workspace_id uuid,created_by uuid,capture_method text,origin_channel text,created_at timestamptz default now(),updated_at timestamptz default now(),status text);
`)
await db.exec(await readFile(new URL('../supabase/migrations/20260928204500_add_internal_beta_analytics.sql',import.meta.url),'utf8'))
// The disconnected restore applies SQL as supabase_admin, whose Supabase defaults
// grant EXECUTE directly to client roles. Revoking only PUBLIC must not pass.
await db.exec('alter default privileges in schema public grant execute on functions to anon,authenticated,service_role;')
await db.exec(await readFile(new URL('../supabase/migrations/20261016120000_campaign_funnel_analytics.sql',import.meta.url),'utf8'))
let assertions=0
const check=(condition,message)=>{assert.ok(condition,message);assertions++}
const query=async(sql,params=[]) => (await db.query(sql,params)).rows
const scalar=async(sql,params=[])=>Object.values((await query(sql,params))[0])[0]
for (const signature of ['public.record_campaign_event(text,uuid,text,jsonb)','public.revoke_campaign_consent(text)']) {
 for (const role of ['anon','authenticated','service_role']) {
  check(await scalar("select has_function_privilege($1,$2,'EXECUTE')",[role,signature])===(role==='service_role'), `${role} privilege for ${signature} respects service-only contract despite default grants`)
 }
}
const token='a'.repeat(64), visitorHash=await scalar(`select encode(sha256(convert_to($1,'UTF8')),'hex')`,[token])
const dims={source:'agency',utm_source:'instagram',utm_campaign:'beta_launch',ref:'campaign-2026',page:'agency'}
async function record(event,properties=dims,key=crypto.randomUUID(),t=token){return scalar(`select public.record_campaign_event($1,$2,$3,$4::jsonb)`,[t,key,event,JSON.stringify(properties)])}
async function rejects(sql,params,pattern){await assert.rejects(()=>query(sql,params),pattern);assertions++}
const duplicateKey=crypto.randomUUID()
await record('page_view', {...dims,email:'never@example.invalid',booking_text:'private message',utm_term:'email@example.invalid'},duplicateKey)
await record('page_view',dims,duplicateKey)
check(await scalar('select count(*) from public.product_analytics_events')===1,'retry deduplicates event_key')
check(!JSON.stringify(await query('select properties from public.product_analytics_events')).match(/private message|never@|email@/),'unknown/free-text/PII dimensions removed')
await record('signup_click',{...dims,placement:'landing_agency_hero'})
await record('signup_click',{...dims,placement:'landing_agency_closing'})
await rejects(`select public.record_campaign_event($1,$2,'signup_completed',$3)`,[token,crypto.randomUUID(),JSON.stringify(dims)],/unsupported_campaign_event/)
// Anonymous data cannot be read, nor can the collector spoof an authenticated milestone.
await db.exec('set role anon')
await rejects('select * from public.product_analytics_events',[],/permission denied/)
await rejects('select * from private.campaign_visitors',[],/permission denied/)
await rejects(`select public.get_campaign_funnel(now()-interval '1 day',now())`,[],/permission denied/)
await rejects(`select public.record_campaign_event($1,$2,'page_view',$3)`,[token,crypto.randomUUID(),JSON.stringify(dims)],/permission denied/)
await db.exec('reset role')
await record('signup_started',{...dims,page:'access'})
const U=await scalar(`insert into auth.users(email,raw_user_meta_data) values('fixture@example.invalid',$1) returning id`,[JSON.stringify({cuebooker_campaign:{token_hash:visitorHash,...dims}})])
check(await scalar(`select count(*) from public.product_analytics_events where event_name='signup_completed'`)===1,'signup server fact persisted once')
check(await scalar(`select count(*) from auth.users where raw_user_meta_data ? 'cuebooker_campaign'`)===0,'transient signup metadata removed from auth storage')
await db.exec(`insert into public.internal_admins(user_id) values('${U}');select set_config('test.user_id','${U}',false);`)
const W=await scalar(`insert into public.workspaces(kind) values('agency') returning id`)
await query(`insert into public.profiles(user_id) values($1)`,[U])
await query(`update public.profiles set onboarding_completed=true where user_id=$1`,[U])
await query(`insert into public.workspace_members(workspace_id,user_id,role) values($1,$2,'owner')`,[W,U])
check(await scalar(`select workspace_id from public.product_analytics_events where event_name='onboarding_completed'`)===W,'lazy workspace attaches to single onboarding fact')
const member=await scalar(`insert into auth.users(email) values('member@example.invalid') returning id`)
await query(`insert into public.profiles(user_id,onboarding_completed) values($1,true)`,[member])
await query(`insert into public.workspace_members(workspace_id,user_id,role) values($1,$2,'admin')`,[W,member])
const O=await scalar('insert into public.organizations default values returning id')
await query('insert into public.workspace_legacy_organizations values($1,$2)',[W,O])
await query('update public.organizations set agency_public_enabled=true where id=$1',[O])
await query('update public.organizations set agency_public_enabled=false where id=$1',[O])
await query('update public.organizations set agency_public_enabled=true where id=$1',[O])
check(await scalar(`select count(*) from public.product_analytics_events where event_name='agency_catalog_published'`)===1,'republishing counts once per workspace')
await query(`insert into public.bookings(workspace_id,capture_method) values($1,'manual')`,[W])
check(await scalar(`select count(*) from public.product_analytics_events where event_name='workspace_first_request_received'`)===0,'manual capture is not received enquiry')
await query(`insert into public.bookings(workspace_id,capture_method) values($1,'public_form'),($1,'email_import')`,[W])
check(await scalar(`select count(*) from public.product_analytics_events where event_name='workspace_first_request_received'`)===1,'two enquiries and two agency members still one activation')
const report=async(source=null,campaign=null,dataset='test')=>scalar(`select public.get_campaign_funnel(now()-interval '1 day',now()+interval '1 day',$1,null,$2,null,$3)`,[source,campaign,dataset])
const result=await report('agency','beta_launch')
check(result.rows.find(r=>r.step==='interest').events===2,'total CTA clicks are two')
check(result.rows.find(r=>r.step==='interest').visitors===1,'same browser is one visitor, not two people')
check(result.rows.find(r=>r.step==='registration').users===1,'registration counted as server account')
check(result.rows.find(r=>r.step==='activation').workspaces===1,'activation unit workspace')
check(result.breakdown.find(r=>r.step==='registration').account_type==='agency','actual chosen account type available separately from source')
check(result.conversions.map(c=>c.from_step).join(',')==='visit,interest,registration,onboarding,publication','conversion rows follow funnel order')
check(result.conversions.every(c=>c.denominator===1&&c.numerator===1),'conversions intersect same unit with temporal order')
check((await report(null,'other_campaign')).rows.every(r=>r.events===0),'campaign filter has empty state')
check((await report(null,null,'live')).rows.every(r=>r.events===0),'test data is excluded from live dataset')
await query(`select set_config('test.user_id',$1,false)`,[member])
await db.exec('set role authenticated')
await rejects(`select public.get_campaign_funnel(now()-interval '1 day',now())`,[],/internal_admin_required/)
await rejects(`insert into public.product_analytics_events(user_id,event_name) values($1,'signup_completed')`,[member],/permission denied/)
await db.exec('reset role')
await query(`select set_config('test.user_id',$1,false)`,[U])
// An existing historical first enquiry is not reconstructed as a new campaign activation.
const historicW=await scalar(`insert into public.workspaces(kind) values('artist') returning id`)
await query(`insert into public.bookings(workspace_id,capture_method) values($1,'public_form')`,[historicW])
await query(`insert into public.workspace_members values($1,$2,'owner',now())`,[historicW,U])
await query(`insert into public.bookings(workspace_id,capture_method) values($1,'email_import')`,[historicW])
check(await scalar(`select count(*) from public.product_analytics_events where workspace_id=$1 and event_name='workspace_first_request_received'`,[historicW])===0,'no historical activation backfill')
// Two actual accounts may share one consented browser; account totals must not become visitor totals.
const sharedUser=await scalar(`insert into auth.users(email,raw_user_meta_data) values('shared-browser@example.invalid',$1) returning id`,[JSON.stringify({cuebooker_campaign:{token_hash:visitorHash,...dims}})])
const shared=await report()
check(shared.rows.find(r=>r.step==='registration').users===2,'two server accounts remain two registered users')
check(shared.rows.find(r=>r.step==='registration').visitors===1,'two accounts in one browser remain one visitor')
await query(`insert into public.profiles(user_id) values($1)`,[sharedUser])
await query(`insert into public.workspace_members values($1,$2,'admin',now())`,[W,sharedUser])
await query(`update public.profiles set onboarding_completed=true where user_id=$1`,[sharedUser])
check((await report()).rows.find(r=>r.step==='onboarding').users===2,'agency member onboarding counts account')
check((await report()).rows.find(r=>r.step==='onboarding').workspaces===1,'agency members do not duplicate workspace denominator')
check(await scalar(`select count(*) from public.get_campaign_funnel(now()-interval '1 day',now()+interval '1 day',null,'other_origin',null,null,'test') r where (r::jsonb->'rows'->0->>'events')::int<>0`)===0,'origin filter excludes unrelated events')
check((await scalar(`select public.get_campaign_funnel(now()-interval '1 day',now()+interval '1 day',null,null,null,'other_ref','test')`)).rows.every(r=>r.events===0),'referral filter excludes unrelated events')
check((await scalar(`select public.get_campaign_funnel(now()-interval '3 days',now()-interval '2 days',null,null,null,null,'test')`)).rows.every(r=>r.events===0),'date window filters persisted timestamps')
await query('select public.revoke_campaign_consent($1)',[token])
check(await record('page_view')===false,'revoked token cannot emit again')
check((await report()).rows.every(r=>r.events===0),'revocation removes optional facts from storage and report')
await query(`update public.organizations set agency_public_enabled=false where id=$1`,[O])
await query(`update public.organizations set agency_public_enabled=true where id=$1`,[O])
check((await report()).rows.every(r=>r.events===0),'server milestones respect revoked consent')
check(await scalar('select count(*) from private.campaign_registrations')===0,'withdrawal removes account-browser attribution')
// Automatic email creates ai_capture, distinct from manually captured Smart CUE.
const autoToken='c'.repeat(64)
await record('page_view',{...dims,source:'dj'},crypto.randomUUID(),autoToken)
const autoHash=await scalar(`select encode(sha256(convert_to($1,'UTF8')),'hex')`,[autoToken])
const autoUser=await scalar(`insert into auth.users(raw_user_meta_data) values($1) returning id`,[JSON.stringify({cuebooker_campaign:{token_hash:autoHash,source:'dj'}})])
const autoW=await scalar(`insert into public.workspaces(kind) values('artist') returning id`)
await query(`insert into public.profiles(user_id,onboarding_completed) values($1,true)`,[autoUser])
await query(`insert into public.workspace_members values($1,$2,'owner',now())`,[autoW,autoUser])
await query(`insert into public.bookings(workspace_id,capture_method,origin_channel) values($1,'ai_capture','other'),($1,'ai_capture',null)`,[autoW])
check(await scalar(`select count(*) from public.product_analytics_events where workspace_id=$1 and event_name='workspace_first_request_received'`,[autoW])===0,'other AI capture is not received email')
await query(`insert into public.bookings(workspace_id,capture_method,origin_channel) values($1,'ai_capture','email')`,[autoW])
check(await scalar(`select count(*) from public.product_analytics_events where workspace_id=$1 and event_name='workspace_first_request_received'`,[autoW])===1,'actual automatic mailbox AI capture activates workspace')
const autoArtist=await scalar('insert into public.artists default values returning id')
await query(`insert into public.workspace_artists values($1,$2,now()-interval '1 day'),($3,$2,now())`,[historicW,autoArtist,autoW])
await query('insert into public.artist_booking_routes values($1,$2)',[autoArtist,autoW])
await query('update public.artists set public_profile_enabled=true where id=$1',[autoArtist])
const reversed=await report('dj')
check(reversed.rows.find(r=>r.step==='publication').workspaces===1,'shared artist publication belongs to canonical route, not oldest workspace')
check(reversed.conversions.find(c=>c.from_step==='publication').numerator===0,'earlier activation cannot convert a later publication')
await query(`delete from public.bookings where workspace_id=$1`,[autoW])
await query(`delete from public.product_analytics_events where workspace_id=$1 and event_name='workspace_first_request_received'`,[autoW])
await query(`insert into public.bookings(workspace_id,capture_method) values($1,'public_form')`,[autoW])
check(await scalar(`select count(*) from public.product_analytics_events where workspace_id=$1 and event_name='workspace_first_request_received'`,[autoW])===0,'workspace dedup tombstone survives optional fact removal')
await query(`update private.campaign_visitors set created_at=now()-interval '91 days' where token_hash=$1`,[autoHash])
await query('select public.purge_campaign_analytics()')
check((await report()).rows.every(r=>r.events===0),'retention maintenance removes expired optional facts')
await rejects(`select public.get_campaign_funnel(now(),now()-interval '1 day')`,[],/invalid_campaign_window/)
console.log(JSON.stringify({assertions,checks:'collector → persisted facts → admin report; roles, consent, deduplication, dataset, campaign filters, units',environment:'isolated PGlite PostgreSQL; minimal dependency schema, no hosted operations'}))
if (!process.env.CUEBOOKER_CAMPAIGN_BRIDGE_PORT) await db.close()
else {
 const {createServer}=await import('node:http')
 const {handleCampaignAnalytics}=await import('../supabase/functions/_shared/campaignAnalyticsIngress.ts')
 let browserUser=null,browserWorkspace=null,browserEntity=null
 const server=createServer(async(req,res)=>{
  let chunks=[];for await(const chunk of req)chunks.push(chunk)
  let body={};try{body=JSON.parse(Buffer.concat(chunks).toString()||'{}')}catch{}
  const path=new URL(req.url,'http://fixture.invalid').pathname
  const send=(data,status=200)=>{res.writeHead(status,{'Content-Type':'application/json'});res.end(JSON.stringify(data))}
  try {
   if(path==='/fixture/reset'){
    await db.exec('delete from public.product_analytics_events; delete from private.campaign_registrations; delete from private.campaign_workspace_dedup; delete from private.campaign_visitors;')
    browserUser=null;browserWorkspace=null;browserEntity=null;return send({ok:true})
   }
   if(path.endsWith('/campaign-analytics')) {
    const request=new Request('http://fixture.invalid',{method:'POST',body:JSON.stringify(body)})
    const response=await handleCampaignAnalytics(request,{
     limit:async()=>({allowed:true,retryAfterSeconds:0}),
     persist:async(op,b)=>op==='withdraw'?scalar('select public.revoke_campaign_consent($1)',[b.visitor_token]):scalar('select public.record_campaign_event($1,$2,$3,$4)',[b.visitor_token,b.event_key,b.event_name,JSON.stringify(b.dimensions)])
    })
    res.writeHead(response.status,Object.fromEntries(response.headers));return res.end(await response.text())
   }
   if(path.endsWith('/signup')){
    browserUser=await scalar('insert into auth.users(email,raw_user_meta_data) values($1,$2) returning id',[body.email,JSON.stringify(body.data)])
    await query('insert into public.profiles(user_id) values($1)',[browserUser])
    await query('insert into public.internal_admins values($1,now())',[browserUser])
    return send({access_token:'fixture-browser-token',refresh_token:'fixture-browser-refresh',expires_in:3600,user:{id:browserUser,email:body.email,user_metadata:body.data}})
   }
   if(path.endsWith('/profiles'))return send(browserUser?await query('select * from public.profiles where user_id=$1',[browserUser]):[])
   if(path.endsWith('/complete_onboarding')) {
    browserWorkspace=await scalar('insert into public.workspaces(kind) values($1) returning id',[body.account_type==='agency'?'agency':'artist'])
    await query(`insert into public.workspace_members values($1,$2,'owner',now())`,[browserWorkspace,browserUser])
    if(body.account_type==='agency'){
     browserEntity=await scalar('insert into public.organizations default values returning id')
     await query('insert into public.workspace_legacy_organizations values($1,$2)',[browserWorkspace,browserEntity])
    }else{
     browserEntity=await scalar('insert into public.artists default values returning id')
     await query('insert into public.workspace_artists values($1,$2,now())',[browserWorkspace,browserEntity])
    }
    await query('update public.profiles set onboarding_completed=true where user_id=$1',[browserUser])
    return send({account_type:body.account_type,entity_id:browserEntity,onboarding_completed:true})
   }
   if(path==='/fixture/operations'){
    const agency=await scalar(`select kind='agency' from public.workspaces where id=$1`,[browserWorkspace])
    await query(agency?'update public.organizations set agency_public_enabled=true where id=$1':'update public.artists set public_profile_enabled=true where id=$1',[browserEntity])
    await query(`insert into public.bookings(workspace_id,capture_method) values($1,'public_form')`,[browserWorkspace])
    return send({ok:true})
   }
   if(path.endsWith('/is_internal_admin'))return send(Boolean(browserUser))
   if(path.endsWith('/get_beta_analytics_summary'))return send({window_days:30,users_total:0,users_new:0,active_users:0,onboarding_completed:0,bookings_created:0,bookings_confirmed:0,smart_capture_started:0,smart_capture_results:0,smart_capture_applied:0,smart_capture_discarded:0,media_linked:0,media_failures:0,automations_created:0,automations_completed:0})
   if(path.endsWith('/get_beta_analytics_users'))return send([])
   if(path.endsWith('/get_campaign_funnel')){
    await query(`select set_config('test.user_id',$1,false)`,[browserUser])
    return send(await scalar('select public.get_campaign_funnel($1,$2,$3,$4,$5,$6,$7)',[body.from_at,body.to_at,body.filter_source,body.filter_utm_source,body.filter_campaign,body.filter_ref,body.filter_dataset]))
   }
   if(path==='/fixture/report')return send(await report())
   return send([])
  }catch{send({message:'isolated_fixture_error'},500)}
 })
 server.listen(Number(process.env.CUEBOOKER_CAMPAIGN_BRIDGE_PORT),'127.0.0.1',()=>console.log('Isolated campaign fixture bridge ready'))
}
