import test from 'node:test';
import assert from 'node:assert/strict';
import {base64url,sealGmail} from '../supabase/functions/_shared/gmailMailbox.ts';

test('recovery authenticates before privileged reads, repeats consent and binds documents without AI or booking replay',async()=>{
 const oldFetch=globalThis.fetch,oldDeno=Object.getOwnPropertyDescriptor(globalThis,'Deno');
 const booking='10000000-0000-4000-8000-000000000001';
 const encryptionKey=base64url(new Uint8Array(32).fill(9));
 const env:Record<string,string>={SUPABASE_URL:'https://recovery.invalid',SUPABASE_ANON_KEY:'public',SUPABASE_SERVICE_ROLE_KEY:'service',CUEBOOKER_MAILBOX_ENABLED:'true',CUEBOOKER_MAILBOX_BACKGROUND_ENABLED:'true',CUEBOOKER_CONNECTED_ATTACHMENTS_ENABLED:'true',GMAIL_CLIENT_ID:'client',GMAIL_CLIENT_SECRET:'secret',GMAIL_TOKEN_ENCRYPTION_KEY:encryptionKey};
 const connection={id:'connection',workspace_id:'workspace',user_id:'owner',email:'dj@example.invalid',transport:'gmail',background_analysis_since:'2026-10-01T00:00:00Z'};
 const cipher=await sealGmail({accessToken:'fixture',refreshToken:'fixture',expiresAt:Date.now()+3600000,reauthAt:Date.now()+86400000},encryptionKey,'gmail:workspace:owner:dj@example.invalid');
 const pdf=new TextEncoder().encode('%PDF-1.7\nfixture');
 let handler:(r:Request)=>Promise<Response>,visible=true,revoked=false,revokeOnDownload=false,stored=false,declaredSize=pdf.length,providerReads=0,uploads=0,writes=0,privileged=0;
 Object.defineProperty(globalThis,'Deno',{configurable:true,value:{env:{get:(n:string)=>env[n]},serve:(h:any)=>{handler=h}}});
 globalThis.fetch=(async(input:any,init:RequestInit={})=>{
  const u=new URL(String(input)),headers=new Headers(init.headers),name=u.pathname.split('/').at(-1);
  if(u.hostname==='gmail.googleapis.com'){
   providerReads++;assert.equal(revoked,false);
   if(u.pathname.includes('/attachments/')){if(revokeOnDownload)revoked=true;return Response.json({data:base64url(pdf),size:pdf.length})}
   return Response.json({id:'message',threadId:'thread',internalDate:String(Date.now()),payload:{parts:[{mimeType:'application/pdf',filename:'offer.pdf',body:{attachmentId:'pdf',size:declaredSize}}]}});
  }
  assert.equal(u.hostname,'recovery.invalid');
  if(u.pathname==='/auth/v1/user')return Response.json({id:'requester'});
  if(name==='bookings'&&headers.get('apikey')==='public')return Response.json(visible?[{id:booking}]:[]);
  privileged++;
  if(u.pathname.includes('/storage/')){uploads++;assert.equal(revoked,false);return Response.json({Key:'fixture'})}
  if(name==='mailbox_incoming_jobs')return Response.json([{connection_id:'connection',message_id:'message',booking_id:booking,consent_revision:'revision',message_date:'2026-10-02T00:00:00Z'}]);
  if(name==='mailbox_connections')return Response.json(revoked?[]:[connection]);
  if(name==='bookings')return Response.json([{id:booking}]);
  if(name==='workspace_members')return Response.json([{user_id:'fixture'}]);
  if(name==='email_messages'){assert.equal(u.searchParams.get('booking_id'),'eq.'+booking);assert.equal(u.searchParams.get('provider'),'eq.nylas:connection');return Response.json([{id:'email'}])}
  if(name==='gmail_mailbox_credentials')return Response.json([{token_ciphertext:cipher,reauth_required:false}]);
  if(name==='booking_email_attachments'){
   if(init.method==='POST'){const data=JSON.parse(String(init.body));assert.equal(data.email_message_id,'email');assert.equal(data.mailbox_connection_id,'connection');assert.equal(data.booking_id,booking);assert.equal(revoked,false);writes++;stored=true;return new Response(null,{status:201})}
   assert.equal(u.searchParams.get('workspace_id'),'eq.workspace');assert.equal(u.searchParams.get('booking_id'),'eq.'+booking);return Response.json(stored?[{id:'saved'}]:[]);
  }
  throw new Error('Unexpected API, classification/creation/replay forbidden: '+name);
 }) as typeof fetch;
 try{
  await import('../supabase/functions/recover-mailbox-attachments/index.ts');
  const run=()=>handler!(new Request('https://recovery.invalid/function',{method:'POST',headers:{authorization:'Bearer fixture','content-type':'application/json'},body:JSON.stringify({booking_id:booking})}));
  visible=false;assert.equal((await run()).status,404);assert.equal(privileged,0);assert.equal(providerReads,0);
  visible=true;let r=await run();assert.equal(r.status,200);assert.equal((await r.json()).attachments[0].status,'stored');assert.equal(writes,1);
  r=await run();assert.equal((await r.json()).attachments[0].status,'already_stored');assert.equal(uploads,1);assert.equal(writes,1);
  stored=false;revokeOnDownload=true;r=await run();assert.equal((await r.json()).attachments[0].status,'consent_unavailable');assert.equal(uploads,1);assert.equal(writes,1);
  revoked=false;revokeOnDownload=false;declaredSize=pdf.length+1;r=await run();assert.equal((await r.json()).attachments[0].status,'unsupported_content');assert.equal(uploads,1);
 }finally{globalThis.fetch=oldFetch;if(oldDeno)Object.defineProperty(globalThis,'Deno',oldDeno);else Reflect.deleteProperty(globalThis,'Deno')}
});

test('download signs only the document returned by caller RLS, with a 60-second lifetime',async()=>{
 const oldFetch=globalThis.fetch,oldDeno=Object.getOwnPropertyDescriptor(globalThis,'Deno');
 let handler:(r:Request)=>Promise<Response>,allowed=false,signs=0;
 Object.defineProperty(globalThis,'Deno',{configurable:true,value:{env:{get:(n:string)=>({SUPABASE_URL:'https://download.invalid',SUPABASE_ANON_KEY:'public',SUPABASE_SERVICE_ROLE_KEY:'service'} as any)[n]},serve:(h:any)=>{handler=h}}});
 globalThis.fetch=(async(input:any,init:RequestInit={})=>{
  const url=new URL(String(input)),headers=new Headers(init.headers);
  if(url.pathname==='/auth/v1/user')return Response.json({id:'member'});
  if(url.pathname.includes('/rest/')){assert.equal(headers.get('apikey'),'public');assert.equal(headers.get('authorization'),'Bearer fixture');return Response.json(allowed?[{storage_path:'workspace/file',file_name:'offer.pdf'}]:[])}
  assert.equal(url.pathname,'/storage/v1/object/sign/booking-email-attachments/workspace/file');assert.equal(headers.get('apikey'),'service');assert.deepEqual(JSON.parse(String(init.body)),{expiresIn:60});signs++;return Response.json({signedURL:'/object/sign/booking-email-attachments/workspace/file?token=fixture'});
 }) as typeof fetch;
 try{
  await import('../supabase/functions/get-booking-email-attachment/index.ts');
  const run=(auth=true)=>handler!(new Request('https://download.invalid/function',{method:'POST',headers:auth?{authorization:'Bearer fixture'}:{},body:JSON.stringify({attachment_id:'10000000-0000-4000-8000-000000000001'})}));
  assert.equal((await run(false)).status,401);assert.equal(signs,0);
  assert.equal((await run()).status,404);assert.equal(signs,0);
  allowed=true;const response=await run();assert.equal(response.status,200);assert.equal((await response.json()).expires_in,60);assert.equal(signs,1);
 }finally{globalThis.fetch=oldFetch;if(oldDeno)Object.defineProperty(globalThis,'Deno',oldDeno);else Reflect.deleteProperty(globalThis,'Deno')}
});
