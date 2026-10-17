import test from 'node:test';
import assert from 'node:assert/strict';
import {base64url,sealGmail} from '../supabase/functions/_shared/gmailMailbox.ts';
import {bytesBase64} from '../app/domain/emailAttachments.ts';
const ids={workspace:'10000000-0000-4000-8000-000000000001',actor:'10000000-0000-4000-8000-000000000002',connection:'10000000-0000-4000-8000-000000000003',booking:'10000000-0000-4000-8000-000000000004',request:'10000000-0000-4000-8000-000000000005'};
test('connected outbound Edge: validation, tenant/editor checks, one threaded send, documents, partial history failure and uncertain retry denial',async()=>{
 const oldFetch=globalThis.fetch,oldDeno=Object.getOwnPropertyDescriptor(globalThis,'Deno');
 const encryptionKey=base64url(new Uint8Array(32).fill(8));
 const env:Record<string,string>={SUPABASE_URL:'https://lycprjeuuynfzwskycwv.supabase.co',SUPABASE_ANON_KEY:'public-fixture',SUPABASE_SERVICE_ROLE_KEY:'service-fixture',CUEBOOKER_MAILBOX_RETURN_URL:'https://pr-96.cuebooker-staging.pages.dev/workspace/',CUEBOOKER_MAILBOX_ENABLED:'true',GMAIL_CLIENT_ID:'fixture',GMAIL_CLIENT_SECRET:'fixture',GMAIL_TOKEN_ENCRYPTION_KEY:encryptionKey};
 const connection={id:ids.connection,workspace_id:ids.workspace,user_id:ids.actor,email:'dj@example.invalid',transport:'gmail',grant_id:'fixture'};
 const cipher=await sealGmail({accessToken:'fixture',refreshToken:'fixture',expiresAt:Date.now()+3600000,reauthAt:Date.now()+86400000},encryptionKey,`gmail:${ids.workspace}:${ids.actor}:dj@example.invalid`);
 const bytes=new TextEncoder().encode('%PDF-1.7\nfixture'),file={name:'contract.pdf',contentType:'application/pdf',size:bytes.length,contentBase64:bytesBase64(bytes)};
 let handler:(r:Request)=>Promise<Response>,role='owner',archived=false,providerSends=0,storageFailure=false,ambiguous=false,records=0,uploads=0,foreign=false;
 const attempts=new Map<string,any>();
 Object.defineProperty(globalThis,'Deno',{configurable:true,value:{env:{get:(key:string)=>env[key]},serve:(h:any)=>{handler=h}}});
 globalThis.fetch=(async(input:any,init:RequestInit={})=>{
  const url=new URL(String(input)),body=typeof init.body==='string'?JSON.parse(init.body):null;
  if(url.hostname==='gmail.googleapis.com'){
   if(url.pathname.endsWith('/send')){providerSends++;assert.equal(JSON.parse(String(init.body)).threadId,'thread');if(ambiguous)throw new Error('private uncertain');return Response.json({id:'sent-'+providerSends,threadId:'thread'})}
   if(url.pathname.includes('/threads/'))return Response.json({messages:[{id:'parent',threadId:'thread',internalDate:String(Date.now()),payload:{headers:[{name:'From',value:'promoter@example.invalid'},{name:'To',value:'dj@example.invalid'}]}}]});
   return Response.json({id:'parent',threadId:'thread',payload:{headers:[{name:'Subject',value:'Booking original'},{name:'Message-ID',value:'<parent@example.invalid>'}]}});
  }
  assert.equal(url.hostname,'lycprjeuuynfzwskycwv.supabase.co');
  if(url.pathname==='/auth/v1/user')return Response.json({id:ids.actor});
  if(url.pathname.includes('/storage/')){uploads++;assert.match(url.pathname,new RegExp(`/outgoing/email-sent-${providerSends}/0$`));return Response.json({ok:true},{status:storageFailure?503:200})}
  const table=url.pathname.split('/').at(-1);
  if(table==='workspace_members')return Response.json([{role}]);
  if(table==='mailbox_connections'){assert.equal(url.searchParams.get('workspace_id'),'eq.'+ids.workspace);assert.equal(url.searchParams.get('user_id'),'eq.'+ids.actor);return Response.json(foreign?[]:[connection])}
  if(table==='gmail_mailbox_credentials')return Response.json([{token_ciphertext:cipher,reauth_required:false}]);
  if(table==='bookings')return Response.json([{id:ids.booking,primary_contact_id:'contact',archived_at:archived?'2026-10-15':null}]);
  if(table==='mailbox_booking_threads')return Response.json([{thread_id:'thread',connection_id:ids.connection}]);
  if(table==='contacts')return Response.json([{email:'promoter@example.invalid'}]);
  if(table==='mailbox_send_attempts'){
   if(init.method==='POST'){assert.equal(body.workspace_id,ids.workspace);attempts.set(body.id,body);return Response.json([body])}
   if(init.method==='PATCH')return Response.json([]);
   return Response.json(attempts.has(url.searchParams.get('id')!.slice(3))?[{id:'attempt'}]:[]);
  }
  if(table==='ingest_mailbox_thread'){assert.equal(body.target_booking,ids.booking);assert.equal(body.target_thread,'thread');return Response.json(ids.booking)}
  if(table==='email_messages')return Response.json([{id:'email-sent-'+providerSends}]);
  if(table==='booking_email_attachments'){
   if(init.method==='POST'){records++;assert.equal(body.email_message_id,'email-sent-'+providerSends);assert.equal(body.booking_id,ids.booking);assert.equal(body.workspace_id,ids.workspace);assert.equal(body.content_type,'application/pdf');return new Response(null,{status:201})}
   return Response.json([]);
  }
  throw new Error('Unexpected side effect '+table);
 }) as typeof fetch;
 try{
  await import('../supabase/functions/connected-mailbox/index.ts');
  const run=(overrides:any={})=>handler!(new Request('https://lycprjeuuynfzwskycwv.supabase.co/function',{method:'POST',headers:{authorization:'Bearer fixture'},body:JSON.stringify({action:'send',workspaceId:ids.workspace,bookingId:ids.booking,connectionId:ids.connection,requestId:ids.request,subject:'Re: Booking',bodyText:'Adjunto el contrato',attachments:[file],...overrides})}));
  role='viewer';assert.equal((await run()).status,403);assert.equal(providerSends,0);role='owner';
  foreign=true;assert.equal((await run()).status,404);assert.equal(providerSends,0);foreign=false;
  archived=true;assert.equal((await run()).status,409);assert.equal(providerSends,0);archived=false;
  assert.equal((await run({attachments:[{...file,contentType:'image/png'}]})).status,400);assert.equal(attempts.size,0);
  let response=await run();assert.equal(response.status,200);assert.deepEqual((await response.json()).attachmentStatus,{stored:1,pending:0});assert.equal(providerSends,1);assert.equal(records,1);assert.equal(uploads,1);
  assert.equal((await run()).status,409);assert.equal(providerSends,1);
  storageFailure=true;response=await run({requestId:crypto.randomUUID()});const partial=await response.json();assert.equal(partial.status,'sent');assert.deepEqual(partial.attachmentStatus,{stored:0,pending:1});assert.equal(providerSends,2);
  ambiguous=true;const requestId=crypto.randomUUID();response=await run({requestId});assert.equal((await response.json()).error,'email_send_uncertain');assert.equal(providerSends,3);
  assert.equal((await run({requestId})).status,409);assert.equal(providerSends,3);
 }finally{globalThis.fetch=oldFetch;if(oldDeno)Object.defineProperty(globalThis,'Deno',oldDeno);else Reflect.deleteProperty(globalThis,'Deno')}
});
