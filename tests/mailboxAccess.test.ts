import test from 'node:test'
import assert from 'node:assert/strict'
let handler:(request:Request)=>Promise<Response>
const workspace='aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',user='bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',connection='cccccccc-cccc-cccc-cccc-cccccccccccc',booking='dddddddd-dddd-dddd-dddd-dddddddddddd'
const env:Record<string,string>={SUPABASE_URL:'https://db.invalid',SUPABASE_ANON_KEY:'anon',SUPABASE_SERVICE_ROLE_KEY:'service',NYLAS_API_KEY:'private',NYLAS_CLIENT_ID:'client',CUEBOOKER_MAILBOX_ENABLED:'true',CUEBOOKER_MAILBOX_RETURN_URL:'https://pr-96.cuebooker-staging.pages.dev/workspace/'}
;(globalThis as any).Deno={env:{get:(key:string)=>env[key]},serve:(fn:any)=>{handler=fn}}
await import('../supabase/functions/connected-mailbox/index.ts')
const originalFetch=globalThis.fetch
test('linked-thread review reads old mail only from the owned booking link without AI or writes',async()=>{
 let providerReads=0
 globalThis.fetch=(async(url:any,init:any)=>{
  assert.notEqual(init?.method,'PATCH');assert.notEqual(init?.method,'POST')
  if(url.endsWith('/auth/v1/user'))return Response.json({id:user})
  if(url.includes('workspace_members'))return Response.json([{role:'owner'}])
  if(url.includes('mailbox_connections')){assert.match(url,new RegExp(`user_id=eq.${user}`));return Response.json([{id:connection,email:'dj@example.invalid',grant_id:'grant'}])}
  if(url.includes('mailbox_booking_threads')){assert.match(url,new RegExp(`workspace_id=eq.${workspace}`));assert.match(url,new RegExp(`booking_id=eq.${booking}`));assert.match(url,new RegExp(`connection_id=eq.${connection}`));return Response.json([{thread_id:'owned-thread'}])}
  if(url.includes('bookings?'))return Response.json([{id:booking,artist_id:user,status:'confirmed',updated_at:'2026-10-01T07:00:00Z'}])
  if(url.includes('nylas.com')){providerReads++;const u=new URL(url);assert.equal(u.searchParams.get('thread_id'),'owned-thread');assert.equal(u.searchParams.has('received_after'),false);return Response.json({data:[
   {id:'old',thread_id:'owned-thread',from:[{email:'promoter@example.invalid'}],to:[{email:'dj@example.invalid'}],body:'Old enquiry',date:1700000000},
   {id:'outbound',thread_id:'owned-thread',from:[{email:'dj@example.invalid'}],to:[{email:'promoter@example.invalid'}],date:1700000001},
   {id:'foreign',thread_id:'unrelated-thread',from:[{email:'someone@example.invalid'}],to:[{email:'dj@example.invalid'}],date:1700000002}
  ]})}
  throw new Error('Unexpected access')
 }) as typeof fetch
 try{const r=await handler(req('thread',{bookingId:booking}));assert.equal(r.status,200);const body=await r.json();assert.deepEqual(body.messages.map((m:any)=>m.id),['old']);assert.equal(body.messages[0].existingBooking.status,'confirmed');assert.equal(providerReads,1);assert.equal(body.hasMore,false)}finally{globalThis.fetch=originalFetch}
})
test('unlinked booking and foreign mailbox cannot read a thread or transmit to AI',async()=>{
 let external=0
 globalThis.fetch=(async(url:any)=>{
  if(url.endsWith('/auth/v1/user'))return Response.json({id:user})
  if(url.includes('workspace_members'))return Response.json([{role:'owner'}])
  if(url.includes('mailbox_connections'))return Response.json([{id:connection,email:'dj@example.invalid',grant_id:'grant'}])
  if(url.includes('mailbox_booking_threads'))return Response.json([])
  external++;throw new Error('Unexpected access')
 }) as typeof fetch
 try{const r=await handler(req('thread',{bookingId:booking}));assert.equal((await r.json()).error,'thread_mailbox_required');assert.equal(external,0)}finally{globalThis.fetch=originalFetch}
})
test('booking-scoped analysis rejects another thread before transmitting content to Groq',async()=>{
 env.GROQ_API_KEY='test-key';let aiCalls=0
 globalThis.fetch=(async(url:any)=>{
  if(url.endsWith('/auth/v1/user'))return Response.json({id:user})
  if(url.includes('workspace_members'))return Response.json([{role:'owner'}])
  if(url.includes('mailbox_connections'))return Response.json([{id:connection,email:'dj@example.invalid',grant_id:'grant'}])
  if(url.includes('nylas.com'))return Response.json({data:{id:'one',thread_id:'wrong-thread',from:[{email:'promoter@example.invalid'}],to:[{email:'dj@example.invalid'}],date:1700000000}})
  if(url.includes('mailbox_booking_threads')){assert.match(url,/thread_id=eq.wrong-thread/);return Response.json([])}
  if(url.includes('groq.com'))aiCalls++
  throw new Error('Unexpected access')
 }) as typeof fetch
 try{const r=await handler(req('classify',{bookingId:booking,messageId:'one',analysisConsent:true,analysisProvider:'groq'}));assert.equal((await r.json()).error,'thread_mailbox_required');assert.equal(aiCalls,0)}finally{globalThis.fetch=originalFetch;delete env.GROQ_API_KEY}
})
test('existing review is explicit, versioned and stale failures remain safe',async()=>{
 let providerReads=0,rpcCalls=0
 const reviewedDraft={eventDate:'2026-10-24',startTime:'23:00',endTime:'01:00',venue:null,city:null,offerAmountMinor:60000,currency:'EUR',contactName:'Contacto',contactPhone:null,eventTimezone:'Europe/Madrid'}
 globalThis.fetch=(async(url:any,init:any)=>{
  if(url.endsWith('/auth/v1/user'))return Response.json({id:user})
  if(url.includes('workspace_members'))return Response.json([{role:'owner'}])
  if(url.includes('mailbox_connections'))return Response.json([{id:connection,email:'dj@example.invalid',grant_id:'grant'}])
  if(url.includes('nylas.com')){providerReads++;return Response.json({data:{id:'one',thread_id:'thread',from:[{email:'promoter@example.invalid'}],to:[{email:'dj@example.invalid'}],subject:'Cambio de oferta',body:'600 euros',date:1700000000}})}
  if(url.includes('rpc/ingest_mailbox_thread')){rpcCalls++;const m=JSON.parse(init.body).target_messages[0];assert.equal(m.applyReviewedToExisting,true);assert.equal(m.expectedUpdatedAt,'2026-10-01T07:00:00Z');assert.equal('status' in m.reviewedDetails,false);return Response.json({message:'booking_review_stale',details:'private-detail'},{status:400})}
  throw new Error('Unexpected access')
 }) as typeof fetch
 try{
  const noVersion=await handler(req('import',{messageId:'one',artistId:user,reviewedDraft,applyReviewedToExisting:true}));assert.equal((await noVersion.json()).error,'invalid_booking_draft');assert.equal(providerReads,0)
  const stale=await handler(req('import',{messageId:'one',artistId:user,reviewedDraft,applyReviewedToExisting:true,expectedUpdatedAt:'2026-10-01T07:00:00Z'}));assert.deepEqual(await stale.json(),{error:'booking_review_stale'});assert.equal(rpcCalls,1)
 }finally{globalThis.fetch=originalFetch}
})
test('reviewed imports reject status or contact email injection before reading a provider message',async()=>{
 let external=0
 globalThis.fetch=(async(url:any)=>{if(url.endsWith('/auth/v1/user'))return Response.json({id:user});if(url.includes('workspace_members'))return Response.json([{role:'owner'}]);if(url.includes('mailbox_connections'))return Response.json([{id:connection,email:'dj@example.invalid',grant_id:'grant'}]);external++;throw new Error('Unexpected external call')}) as typeof fetch
 try{for(const reviewedDraft of [{status:'confirmed'},{email:'attacker@example.invalid'}]){const r=await handler(req('import',{messageId:'one',artistId:user,reviewedDraft}));assert.equal((await r.json()).error,'invalid_booking_draft')}assert.equal(external,0)}finally{globalThis.fetch=originalFetch}
})
function req(action:string,extra:Record<string,unknown>={}){return new Request('https://edge.invalid',{method:'POST',headers:{Authorization:'Bearer token','Content-Type':'application/json'},body:JSON.stringify({action,workspaceId:workspace,connectionId:connection,...extra})})}
test('monthly budget exhaustion blocks Groq at the actual authenticated Edge boundary',async()=>{
 env.GROQ_API_KEY='test-key';let aiCalls=0;
 globalThis.fetch=(async(url:any,init:any)=>{
  if(url.endsWith('/auth/v1/user'))return Response.json({id:user});
  if(url.includes('workspace_members'))return Response.json([{role:'owner'}]);
  if(url.includes('mailbox_connections'))return Response.json([{id:connection,email:'dj@example.invalid',grant_id:'grant'}]);
  if(url.includes('nylas.com'))return Response.json({data:{id:'one',thread_id:'thread',from:[{email:'promoter@example.invalid'}],to:[{email:'dj@example.invalid'}],body:'Solicitud ficticia',date:1700000000}});
  if(url.includes('rpc/reserve_mailbox_analysis')){const input=JSON.parse(init.body);assert.equal(input.target_workspace,workspace);assert.equal(input.target_actor,user);assert.equal(input.target_connection,connection);return Response.json({error:'mailbox_ai_budget_exhausted'})}
  if(url.includes('groq.com'))aiCalls++;
  throw new Error('Unexpected provider or accounting access');
 }) as typeof fetch;
 try{const response=await handler(req('classify',{messageId:'one',analysisConsent:true,analysisProvider:'groq'}));assert.deepEqual(await response.json(),{error:'mailbox_ai_budget_exhausted'});assert.equal(aiCalls,0)}finally{globalThis.fetch=originalFetch;delete env.GROQ_API_KEY}
})
test('storage timeout returns a safe category and never reaches mailbox provider',async()=>{
 const warn=console.warn,logs:any[]=[];console.warn=(...args)=>logs.push(args)
 globalThis.fetch=(async(url:any)=>{if(url.endsWith('/auth/v1/user'))return Response.json({id:user});if(url.includes('workspace_members'))throw new DOMException('private detail','TimeoutError');throw new Error('Unexpected provider access')}) as typeof fetch
 try{const response=await handler(req('status'));assert.equal((await response.json()).error,'mailbox_storage_timeout');assert.deepEqual(logs[0],['connected_mailbox_error','mailbox_storage_timeout','status'])}finally{globalThis.fetch=originalFetch;console.warn=warn}
})
test('foreign mailbox cannot reach Nylas even if caller supplies its connection ID',async()=>{
 const seen:string[]=[]
 globalThis.fetch=(async(url:any)=>{seen.push(url);if(url.endsWith('/auth/v1/user'))return Response.json({id:user});if(url.includes('workspace_members'))return Response.json([{role:'owner'}]);if(url.includes('mailbox_connections')){assert.match(url,new RegExp(`user_id=eq.${user}`));return Response.json([])}throw new Error('Unexpected access')}) as typeof fetch
 try{const response=await handler(req('recent'));assert.equal(response.status,404);assert.equal(seen.some(u=>u.includes('nylas.com')),false)}finally{globalThis.fetch=originalFetch}
})
test('read-only members cannot read private mailbox or send',async()=>{
 globalThis.fetch=(async(url:any)=>url.endsWith('/auth/v1/user')?Response.json({id:user}):Response.json([{role:'viewer'}])) as typeof fetch
 try{const response=await handler(req('send',{bookingId:booking}));assert.equal(response.status,403)}finally{globalThis.fetch=originalFetch}
})
test('repeated send attempt never sends again to the external provider',async()=>{
 let providerCalls=0
 globalThis.fetch=(async(url:any)=>{
 if(url.includes('nylas.com')){providerCalls++;throw new Error('Must not send')}
 if(url.endsWith('/auth/v1/user'))return Response.json({id:user})
 if(url.includes('workspace_members'))return Response.json([{role:'owner'}])
 if(url.includes('mailbox_connections'))return Response.json([{id:connection,email:'dj@example.invalid',grant_id:'grant'}])
 if(url.includes('mailbox_booking_threads'))return Response.json([])
 if(url.includes('mailbox_booking_threads'))return Response.json([])
 if(url.includes('bookings?'))return Response.json([{id:booking,primary_contact_id:user,archived_at:null}])
 if(url.includes('contacts?'))return Response.json([{email:'promoter@example.invalid'}])
 if(url.includes('mailbox_send_attempts'))return Response.json([{id:workspace,user_id:user,state:'uncertain'}])
 throw new Error('Unexpected access')
 }) as typeof fetch
 try{const response=await handler(req('send',{bookingId:booking,requestId:workspace,subject:'Consulta',bodyText:'Hola'}));assert.equal(response.status,409);assert.equal((await response.json()).error,'email_send_already_attempted');assert.equal(providerCalls,0)}finally{globalThis.fetch=originalFetch}
})

test('classification requires explicit analysis consent before reading or transmitting mail',async()=>{
 let providerCalls=0
 globalThis.fetch=(async(url:any)=>{
 if(url.includes('nylas.com')||url.includes('openai.com')){providerCalls++;throw new Error('Unexpected transmission')}
 if(url.endsWith('/auth/v1/user'))return Response.json({id:user})
 if(url.includes('workspace_members'))return Response.json([{role:'owner'}])
 if(url.includes('mailbox_connections'))return Response.json([{id:connection,email:'dj@example.invalid',grant_id:'grant'}])
 throw new Error('Unexpected access')
 }) as typeof fetch
 try{const response=await handler(req('classify'));assert.equal(response.status,400);assert.equal((await response.json()).error,'mailbox_analysis_consent_required');assert.equal(providerCalls,0)}finally{globalThis.fetch=originalFetch}
})

test('selected-mail analysis reads and transmits only the requested message',async()=>{
 env.GROQ_API_KEY='test-key'
 const reads:string[]=[]
 globalThis.fetch=(async(url:any,init:any)=>{
 if(url.includes('rpc/reserve_mailbox_analysis')){const input=JSON.parse(init.body);assert.equal(input.target_connection,connection);assert.equal(input.target_actor,user);return Response.json({reserved:true})}
 if(url.includes('rpc/complete_mailbox_analysis')){assert.equal(JSON.parse(init.body).target_outcome,'succeeded');return Response.json({recorded:true})}
 if(url.endsWith('/auth/v1/user'))return Response.json({id:user})
 if(url.includes('workspace_members'))return Response.json([{role:'owner'}])
 if(url.includes('mailbox_connections'))return Response.json([{id:connection,email:'dj@example.invalid',grant_id:'grant'}])
 if(url.includes('mailbox_booking_threads'))return Response.json([])
 if(url.includes('nylas.com')){reads.push(url);assert.match(url,/\/messages\/selected-mail$/);return Response.json({data:{id:'selected-mail',thread_id:'thread',from:[{email:'promoter@example.invalid'}],to:[{email:'dj@example.invalid'}],subject:'Disponibilidad',body:'Actuación de prueba',date:1700000000}})}
 if(url.includes('groq.com')){const payload=JSON.parse(init.body),messages=JSON.parse(payload.messages[1].content);assert.deepEqual(messages.map((m:any)=>m.id),['selected-mail']);return Response.json({choices:[{finish_reason:'stop',message:{content:JSON.stringify({messages:[{id:'selected-mail',kind:'booking',reason:'Consulta disponibilidad',draft:{eventDate:null,startTime:null,endTime:null,venue:null,city:null,offerAmountMinor:null,currency:null,artistName:null,contactPhone:null,warnings:['Falta fecha']}}]})}}]})}
 throw new Error('Unexpected access')
 }) as typeof fetch
 try{const response=await handler(req('classify',{analysisConsent:true,analysisProvider:'groq',messageId:'selected-mail'}));assert.equal(response.status,200);const result=await response.json();assert.equal(result.messages.length,1);assert.equal(result.messages[0].classification.kind,'booking');assert.equal(result.hasMore,false);assert.equal(reads.length,1)}finally{globalThis.fetch=originalFetch;delete env.GROQ_API_KEY}
})

test('old provider consent and missing Groq key never read mail or fall back to OpenAI',async()=>{
 env.OPENAI_API_KEY='old-key'
 let externalCalls=0
 globalThis.fetch=(async(url:any)=>{
  if(url.endsWith('/auth/v1/user'))return Response.json({id:user})
  if(url.includes('workspace_members'))return Response.json([{role:'owner'}])
  if(url.includes('mailbox_connections'))return Response.json([{id:connection,email:'dj@example.invalid',grant_id:'grant'}])
  externalCalls++;throw new Error('Unexpected transmission')
 }) as typeof fetch
 try{
  const old=await handler(req('classify',{analysisConsent:true,messageId:'one'}));assert.equal((await old.json()).error,'mailbox_analysis_consent_required')
  const missing=await handler(req('classify',{analysisConsent:true,analysisProvider:'groq',messageId:'one'}));assert.equal(missing.status,503);assert.equal((await missing.json()).error,'mailbox_ai_not_configured');assert.equal(externalCalls,0)
 }finally{globalThis.fetch=originalFetch;delete env.OPENAI_API_KEY}
})

test('invalid selected message cannot fall back to analyzing the mailbox',async()=>{
 let externalCalls=0
 globalThis.fetch=(async(url:any)=>{
 if(url.endsWith('/auth/v1/user'))return Response.json({id:user})
 if(url.includes('workspace_members'))return Response.json([{role:'owner'}])
 if(url.includes('mailbox_connections'))return Response.json([{id:connection,email:'dj@example.invalid',grant_id:'grant'}])
 externalCalls++;throw new Error('Unexpected transmission')
 }) as typeof fetch
 try{const response=await handler(req('classify',{analysisConsent:true,analysisProvider:'groq',messageId:''}));assert.equal(response.status,400);assert.equal(externalCalls,0)}finally{globalThis.fetch=originalFetch}
})

test('global beta full rejects authorization before contacting the provider',async()=>{
 let externalCalls=0
 globalThis.fetch=(async(url:any,init:any)=>{
  if(url.endsWith('/auth/v1/user'))return Response.json({id:user})
  if(url.includes('workspace_members'))return Response.json([{role:'owner'}])
  if(url.includes('mailbox_connections'))return Response.json([])
  if(url.includes('rpc/mailbox_beta_command')){const body=JSON.parse(init.body);assert.equal(body.target_action,'reserve');assert.equal(body.target_actor,user);return Response.json({error:'mailbox_beta_full'})}
  externalCalls++;throw new Error('Unexpected external access')
 }) as typeof fetch
 try{const response=await handler(req('connect',{email:'test@gmail.com'}));assert.equal(response.status,409);assert.equal((await response.json()).error,'mailbox_beta_full');assert.equal(externalCalls,0)}finally{globalThis.fetch=originalFetch}
})

test('email-only Gmail connection reserves a place and requests only email scopes',async()=>{
 globalThis.fetch=(async(url:any,init:any)=>{
  if(url.endsWith('/auth/v1/user'))return Response.json({id:user})
  if(url.includes('workspace_members'))return Response.json([{role:'owner'}])
  if(url.includes('mailbox_connections'))return Response.json([])
  if(url.includes('rpc/mailbox_beta_command')){const body=JSON.parse(init.body);assert.equal(body.target_provider,'google');assert.equal(body.target_email,'test@gmail.com');return Response.json({reserved:true})}
  throw new Error('No provider request should be needed')
 }) as typeof fetch
 try{const response=await handler(req('connect',{email:'test@gmail.com'}));assert.equal(response.status,200);const target=new URL((await response.json()).authorizationUrl);assert.equal(target.searchParams.get('provider'),'google');assert.doesNotMatch(target.searchParams.get('scope')||'',/calendar|contacts/)}finally{globalThis.fetch=originalFetch}
})

test('undetected custom domain releases its reservation and asks for a service',async()=>{
 let released=false
 globalThis.fetch=(async(url:any,init:any)=>{
  if(url.endsWith('/auth/v1/user'))return Response.json({id:user})
  if(url.includes('workspace_members'))return Response.json([{role:'owner'}])
  if(url.includes('mailbox_connections'))return Response.json([])
  if(url.includes('rpc/mailbox_beta_command'))return Response.json({reserved:true})
  if(url.includes('/providers/detect'))return Response.json({data:{provider:null}})
  if(url.includes('mailbox_oauth_states')){assert.equal(init.method,'DELETE');released=true;return Response.json([])}
  throw new Error('Unexpected access')
 }) as typeof fetch
 try{const response=await handler(req('connect',{email:'test@custom.invalid'}));assert.equal((await response.json()).error,'mailbox_provider_selection_required');assert.equal(released,true)}finally{globalThis.fetch=originalFetch}
})

test('waitlist uses authenticated membership without provider access',async()=>{
 globalThis.fetch=(async(url:any,init:any)=>{
  if(url.endsWith('/auth/v1/user'))return Response.json({id:user})
  if(url.includes('workspace_members'))return Response.json([{role:'owner'}])
  if(url.includes('rpc/mailbox_beta_command')){assert.equal(JSON.parse(init.body).target_action,'waitlist');return Response.json({waitlisted:true})}
  throw new Error('Unexpected access')
 }) as typeof fetch
 try{const response=await handler(req('waitlist'));assert.equal(response.status,200);assert.equal((await response.json()).waitlisted,true)}finally{globalThis.fetch=originalFetch}
})

test('replayed completion is rejected before exchanging a provider code',async()=>{
 globalThis.fetch=(async(url:any,init:any)=>{
  if(url.endsWith('/auth/v1/user'))return Response.json({id:user})
  if(url.includes('workspace_members'))return Response.json([{role:'owner'}])
  if(url.includes('rpc/mailbox_beta_command')){assert.equal(JSON.parse(init.body).target_action,'claim');return Response.json({error:'invalid_oauth_state'})}
  throw new Error('Must not reach provider')
 }) as typeof fetch
 try{const response=await handler(req('complete',{state:'a'.repeat(64),code:'used'}));assert.equal(response.status,400);assert.equal((await response.json()).error,'invalid_oauth_state')}finally{globalThis.fetch=originalFetch}
})
