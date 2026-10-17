import test from 'node:test';
import assert from 'node:assert/strict';
import {base64url,sealGmail} from '../supabase/functions/_shared/gmailMailbox.ts';

// Exercise the real Edge handler, Gmail adapter, classifier, cache/budget and
// attachment persistence. Network and SQL RPCs are explicit in-memory fixtures;
// this is not evidence of hosted RLS, Gmail delivery or a Supabase deployment.
test('incoming Edge circuit: schema fallback → one booking → PDF/image; reply → original booking; failures never replay creation',async()=>{
 const oldFetch=globalThis.fetch,oldDeno=Object.getOwnPropertyDescriptor(globalThis,'Deno');
 const secret='worker-fixture',encryptionKey=base64url(new Uint8Array(32).fill(8));
 const env:Record<string,string>={SUPABASE_URL:'https://staging-fixture.invalid',SUPABASE_SERVICE_ROLE_KEY:'service-fixture',MAILBOX_WORKER_SECRET:secret,CUEBOOKER_MAILBOX_ENABLED:'true',CUEBOOKER_MAILBOX_BACKGROUND_ENABLED:'true',CUEBOOKER_CONNECTED_ATTACHMENTS_ENABLED:'true',GMAIL_CLIENT_ID:'client-fixture',GMAIL_CLIENT_SECRET:'secret-fixture',GMAIL_TOKEN_ENCRYPTION_KEY:encryptionKey,GROQ_API_KEY:'groq-fixture'};
 const connection={id:'connection',workspace_id:'workspace',user_id:'actor',email:'dj@example.invalid',transport:'gmail',background_analysis_since:new Date(Date.now()-60000).toISOString()};
 const cipher=await sealGmail({accessToken:'access-fixture',refreshToken:'refresh-fixture',expiresAt:Date.now()+3600000,reauthAt:Date.now()+86400000},encryptionKey,'gmail:workspace:actor:dj@example.invalid');
 const pdf=new TextEncoder().encode('%PDF-1.7\nfixture');const png=Uint8Array.from([137,80,78,71,13,10,26,10,0]);
 let id='new',state='processing',booking:string|null=null,claimed=false,creates=0,groq=0,reads=0,uploads=0,syncs=0,metadataFailure=false,consent=true;
 const files=new Map<string,any>();
 let handler:(request:Request)=>Promise<Response>;
 Object.defineProperty(globalThis,'Deno',{configurable:true,value:{env:{get:(key:string)=>env[key]},serve:(value:any)=>{handler=value}}});
 const message=()=>({id,threadId:'thread',internalDate:String(Date.now()),labelIds:['INBOX'],payload:{mimeType:'multipart/mixed',headers:[{name:'From',value:'Promotor <promoter@example.invalid>'},{name:'To',value:connection.email},{name:'Subject',value:'Disponibilidad para una actuación'}],parts:[{mimeType:'text/plain',body:{data:base64url(new TextEncoder().encode('¿Qué disponibilidad tenéis? Oferta de 1200 EUR.'))}},{mimeType:'application/pdf',filename:'offer.pdf',body:{attachmentId:'pdf-id',size:pdf.length}},{mimeType:'image/png',filename:'stage.png',body:{data:base64url(png),size:png.length}}]}});
 globalThis.fetch=(async(input:any,init:RequestInit={})=>{
  const url=new URL(String(input));const body=init.body&&typeof init.body==='string'?JSON.parse(init.body):null;
  if(url.hostname==='api.groq.com'){
   groq++;assert.equal(body.messages[1].content.includes('offer.pdf'),false);
   if(groq===1)return Response.json({error:{code:'invalid_json_schema',message:'private provider details'}},{status:400});
   assert.equal(body.response_format.type,'json_object');
   return Response.json({usage:{prompt_tokens:100,completion_tokens:40},choices:[{finish_reason:'stop',message:{content:JSON.stringify({messages:[{id,kind:'booking',reason:'Pide una actuación',draft:{eventDate:null,startTime:null,endTime:null,venue:null,city:null,offerAmountMinor:120000,currency:'EUR',artistName:null,contactPhone:null,warnings:[]}}]})}}]});
  }
  if(url.hostname==='gmail.googleapis.com'){
   reads++;assert.ok(consent);
   if(url.pathname.endsWith('/attachments/pdf-id'))return Response.json({data:base64url(pdf),size:pdf.length});
   return Response.json(message());
  }
  assert.equal(url.hostname,'staging-fixture.invalid');
  if(url.pathname.includes('/storage/')){uploads++;assert.match(url.pathname,new RegExp(`/workspace/connection/${id}/[01]$`));assert.equal(new Headers(init.headers).get('x-upsert'),'true');return Response.json({Key:'fixture'})}
  const name=url.pathname.split('/').at(-1)!;
  if(name==='claim_mailbox_incoming'){if(claimed)return Response.json(null);claimed=true;return Response.json({id:'job-'+id,connectionId:connection.id,workspaceId:connection.workspace_id,actorId:connection.user_id,grantId:'',email:connection.email,messageId:id,threadId:'thread',since:connection.background_analysis_since,requestId:'request-'+id})}
  if(name==='authorize_mailbox_incoming')return Response.json(consent);
  if(name==='reserve_mailbox_analysis')return Response.json({reserved:true});
  if(name==='complete_mailbox_analysis')return Response.json(true);
  if(name==='create_automatic_mailbox_request'){creates++;assert.equal(body.target_classification.draft.offerAmountMinor,120000);booking='booking';state='completed';return Response.json(booking)}
  if(name==='ingest_mailbox_thread'){syncs++;assert.equal(body.target_booking,'booking');return Response.json('booking')}
  if(name==='complete_mailbox_incoming'){assert.equal(body.target_state,'ignored');state='ignored';return Response.json(true)}
  if(name==='mailbox_connections')return Response.json(consent||!url.searchParams.has('background_analysis_enabled')?[connection]:[]);
  if(name==='gmail_mailbox_credentials')return Response.json([{token_ciphertext:cipher,reauth_required:false}]);
  if(name==='mailbox_booking_threads')return Response.json(booking?[{booking_id:booking}]:[]);
  if(name==='mailbox_ai_results')return Response.json([]);
  if(name==='mailbox_incoming_jobs')return Response.json([{connection_id:connection.id,consent_revision:'revision',booking_id:state==='completed'?booking:null,state,message_date:new Date().toISOString()}]);
  if(name==='workspace_members')return Response.json([{user_id:'actor'}]);
  if(name==='email_messages'){assert.equal(url.searchParams.get('workspace_id'),'eq.workspace');assert.equal(url.searchParams.get('booking_id'),'eq.booking');assert.equal(url.searchParams.get('provider'),'eq.nylas:connection');assert.equal(url.searchParams.get('provider_message_id'),'eq.'+id);return Response.json([{id:'email-'+id}])}
  if(name==='booking_email_attachments'){
   if(init.method==='POST'){
    if(metadataFailure&&body.attachment_index===0)return Response.json({message:'private db contents'},{status:503});
    assert.equal(body.booking_id,'booking');assert.equal(body.email_message_id,'email-'+id);assert.equal(body.workspace_id,'workspace');assert.equal(body.mailbox_connection_id,'connection');files.set(`${id}:${body.attachment_index}`,body);return new Response(null,{status:201});
   }
   assert.equal(url.searchParams.get('workspace_id'),'eq.workspace');assert.equal(url.searchParams.get('booking_id'),'eq.booking');assert.equal(url.searchParams.get('mailbox_connection_id'),'eq.connection');
   const found=files.get(`${id}:${url.searchParams.get('attachment_index')?.slice(3)}`);return Response.json(found?[{id:'file'}]:[]);
  }
  throw new Error('Unexpected request: '+name);
 }) as typeof fetch;
 try{
  await import('../supabase/functions/process-mailbox-incoming/index.ts');
  const run=async()=>{const r=await handler!(new Request('https://staging-fixture.invalid/worker',{method:'POST',headers:{authorization:`Bearer ${secret}`}}));assert.equal(r.status,200);return r.json()};
  const unauthorized=await handler!(new Request('https://staging-fixture.invalid/worker',{method:'POST'}));assert.equal(unauthorized.status,401);assert.equal(reads,0);
  assert.equal((await run()).outcome,'created');assert.equal(creates,1);assert.equal(groq,2);assert.equal(files.size,2);assert.equal(uploads,2);
  assert.equal((await run()).processed,0);assert.equal(creates,1);assert.equal(groq,2);
  id='reply';state='processing';claimed=false;
  assert.equal((await run()).outcome,'synced');assert.equal(syncs,1);assert.equal(creates,1);assert.equal(groq,2);assert.equal(files.size,4);
  id='partial';state='processing';claimed=false;metadataFailure=true;
  assert.equal((await run()).outcome,'synced_attachments_pending');assert.equal(creates,1);assert.equal(groq,2);assert.equal(files.size,5);assert.ok(files.has('partial:1'));assert.equal(state,'ignored');
  id='revoked';state='processing';claimed=false;consent=false;const before=reads;
  assert.equal((await run()).outcome,'ignored');assert.equal(reads,before);assert.equal(creates,1);
 }finally{
  globalThis.fetch=oldFetch;if(oldDeno)Object.defineProperty(globalThis,'Deno',oldDeno);else Reflect.deleteProperty(globalThis,'Deno');
 }
});
