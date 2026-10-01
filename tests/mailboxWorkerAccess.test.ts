import test from 'node:test';
import assert from 'node:assert/strict';
let handler:(request:Request)=>Promise<Response>;
const env:Record<string,string>={SUPABASE_URL:'https://db.invalid',SUPABASE_SERVICE_ROLE_KEY:'service',NYLAS_API_KEY:'provider',NYLAS_CLIENT_ID:'client',GROQ_API_KEY:'fictional-model-test-key',NYLAS_WEBHOOK_SECRET:'fictional-signing-test-key',CUEBOOKER_MAILBOX_ENABLED:'true'};
;(globalThis as any).Deno={env:{get:(key:string)=>env[key]},serve:(value:any)=>{handler=value}};
await import('../supabase/functions/process-mailbox-incoming/index.ts');
const original=globalThis.fetch;
const request=(authorization='Bearer worker-test-secret')=>new Request('https://edge.invalid/worker',{method:'POST',headers:{authorization}});
test('background server gate, missing worker secret and wrong authorization cannot access storage or providers',async()=>{
 let calls=0;globalThis.fetch=(async()=>{calls++;throw new Error('Unexpected access')}) as typeof fetch;
 try{
  assert.equal((await handler(request())).status,503);
  env.CUEBOOKER_MAILBOX_BACKGROUND_ENABLED='true';assert.equal((await handler(request())).status,503);
  env.MAILBOX_WORKER_SECRET='worker-test-secret';assert.equal((await handler(request('Bearer wrong'))).status,401);
  assert.equal(calls,0);
 }finally{globalThis.fetch=original;delete env.CUEBOOKER_MAILBOX_BACKGROUND_ENABLED;delete env.MAILBOX_WORKER_SECRET}
});
test('authenticated worker syncs an owned linked-thread reply without AI reservation or sending mail',async()=>{
 env.CUEBOOKER_MAILBOX_BACKGROUND_ENABLED='true';env.MAILBOX_WORKER_SECRET='worker-test-secret';let sync=0,completed=0;
 const job={id:'job',connectionId:'connection',workspaceId:'workspace',actorId:'actor',grantId:'grant',email:'dj@example.invalid',messageId:'mail',threadId:'thread',since:'2026-10-01T10:00:00Z'};
 globalThis.fetch=(async(url:any,init:any)=>{
  assert.equal(String(url).includes('/send'),false);assert.equal(String(url).includes('groq.com'),false);assert.equal(String(url).includes('reserve_mailbox_analysis'),false);
  if(url.includes('rpc/claim_mailbox_incoming'))return Response.json(job);
  if(url.includes('rpc/authorize_mailbox_incoming'))return Response.json(true);
  if(url.includes('/messages/mail'))return Response.json({data:{id:'mail',thread_id:'thread',date:1790849100,from:[{email:'promoter@example.invalid'}],to:[{email:job.email}],folders:['opaque-inbox'],body:'Respuesta'}});
  if(url.includes('/folders?'))return Response.json({data:[{id:'opaque-inbox',attributes:['\\Inbox']}]});
  if(url.includes('mailbox_booking_threads'))return Response.json([{booking_id:'booking'}]);
  if(url.includes('rpc/ingest_mailbox_thread')){sync++;const body=JSON.parse(init.body);assert.equal(body.target_booking,'booking');assert.equal(body.target_actor,'actor');assert.equal(body.target_messages.length,1);assert.equal('reviewedDetails' in body.target_messages[0],false);return Response.json('booking');}
  if(url.includes('rpc/complete_mailbox_incoming')){completed++;assert.deepEqual(JSON.parse(init.body),{target_job:'job',target_state:'ignored',target_kind:null,target_reason:null});return Response.json(true);}
  throw new Error('Unexpected access');
 }) as typeof fetch;
 try{const r=await handler(request());assert.equal(r.status,200);assert.deepEqual(await r.json(),{processed:1,outcome:'synced'});assert.equal(sync,1);assert.equal(completed,1)}finally{globalThis.fetch=original;delete env.CUEBOOKER_MAILBOX_BACKGROUND_ENABLED;delete env.MAILBOX_WORKER_SECRET}
});
