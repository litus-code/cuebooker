import test from 'node:test';
import assert from 'node:assert/strict';
import {bytesBase64} from '../app/domain/emailAttachments.ts';
test('platform email includes validated files, saves outgoing documents and never resends a claimed or uncertain request',async()=>{
 const oldFetch=globalThis.fetch,oldDeno=Object.getOwnPropertyDescriptor(globalThis,'Deno');
 const env:Record<string,string>={SUPABASE_URL:'https://platform-fixture.invalid',SUPABASE_ANON_KEY:'public',SUPABASE_SERVICE_ROLE_KEY:'service',BREVO_API_KEY:'fixture',CUEBOOKER_REPLY_DOMAIN:'reply.example.invalid'};
 const fileBytes=new TextEncoder().encode('%PDF-1.7\nfixture'),file={name:'contract.pdf',contentType:'application/pdf',size:fileBytes.length,contentBase64:bytesBase64(fileBytes)};
 let handler:(r:Request)=>Promise<Response>,providerSends=0,records=0,role='owner',bound=false,ambiguous=false,storageFailure=false;
 const queued=new Map<string,any>();
 Object.defineProperty(globalThis,'Deno',{configurable:true,value:{env:{get:(key:string)=>env[key]},serve:(h:any)=>{handler=h}}});
 globalThis.fetch=(async(input:any,init:RequestInit={})=>{
  const u=new URL(String(input)),body=typeof init.body==='string'?JSON.parse(init.body):null;
  if(u.hostname==='api.brevo.com'){
   providerSends++;assert.deepEqual(body.attachment,[{name:file.name,content:file.contentBase64}]);assert.equal(body.to[0].email,'promoter@example.invalid');assert.match(body.replyTo.email,/^booking\+/);if(ambiguous)throw new Error('uncertain');return Response.json({messageId:'sent-'+providerSends});
  }
  if(u.pathname==='/auth/v1/user')return Response.json({id:'actor'});
  if(u.pathname.includes('/storage/'))return Response.json({ok:true},{status:storageFailure?503:200});
  const name=u.pathname.split('/').at(-1);
  if(name==='workspace_members')return Response.json([{role}]);
  if(name==='bookings')return Response.json([{id:'booking',artist_id:'artist',primary_contact_id:'contact',archived_at:null}]);
  if(name==='contacts')return Response.json([{email:'promoter@example.invalid'}]);
  if(name==='mailbox_booking_threads')return Response.json(bound?[{connection_id:'mailbox'}]:[]);
  if(name==='email_messages'){
   if(init.method==='POST'){queued.set(body.id,body);return Response.json([{id:body.id,reply_token:'fixture'}])}
   if(init.method==='PATCH')return new Response(null,{status:204});
   return Response.json(queued.has(u.searchParams.get('id')!.slice(3))?[{id:'existing'}]:[]);
  }
  if(name==='artists')return Response.json([{stage_name:'Fixture'}]);
  if(name==='activities')return new Response(null,{status:201});
  if(name==='booking_email_attachments'){
   if(init.method==='POST'){records++;assert.equal(body.booking_id,'booking');assert.ok(queued.has(body.email_message_id));return new Response(null,{status:201})}
   return Response.json([]);
  }
  throw new Error('Unexpected API '+name);
 }) as typeof fetch;
 try{
  await import('../supabase/functions/send-booking-email/index.ts');
  const requestId=crypto.randomUUID();
  const run=(overrides:any={})=>handler!(new Request('https://platform-fixture.invalid/function',{method:'POST',headers:{authorization:'Bearer fixture'},body:JSON.stringify({workspaceId:'workspace',bookingId:'booking',subject:'Contrato',bodyText:'Adjunto el contrato',requestId,attachments:[file],...overrides})}));
  role='viewer';assert.equal((await run()).status,403);assert.equal(providerSends,0);role='owner';
  bound=true;assert.equal((await run()).status,409);assert.equal(providerSends,0);bound=false;
  assert.equal((await run({attachments:[{...file,name:'bad.exe'}]})).status,400);assert.equal(queued.size,0);
  let response=await run();assert.equal(response.status,200);assert.deepEqual((await response.json()).attachmentStatus,{stored:1,pending:0});assert.equal(records,1);
  assert.equal((await run()).status,409);assert.equal(providerSends,1);
  storageFailure=true;response=await run({requestId:crypto.randomUUID()});const partial=await response.json();assert.equal(partial.status,'sent');assert.deepEqual(partial.attachmentStatus,{stored:0,pending:1});
  ambiguous=true;const uncertainId=crypto.randomUUID();assert.equal((await (await run({requestId:uncertainId})).json()).error,'email_send_uncertain');assert.equal(providerSends,3);
  assert.equal((await run({requestId:uncertainId})).status,409);assert.equal(providerSends,3);
 }finally{globalThis.fetch=oldFetch;if(oldDeno)Object.defineProperty(globalThis,'Deno',oldDeno);else Reflect.deleteProperty(globalThis,'Deno')}
});
