import test from 'node:test'
import assert from 'node:assert/strict'
let handler:(request:Request)=>Promise<Response>
const workspace='aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',user='bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',connection='cccccccc-cccc-cccc-cccc-cccccccccccc',booking='dddddddd-dddd-dddd-dddd-dddddddddddd'
const env:Record<string,string>={SUPABASE_URL:'https://db.invalid',SUPABASE_ANON_KEY:'anon',SUPABASE_SERVICE_ROLE_KEY:'service',NYLAS_API_KEY:'private',NYLAS_CLIENT_ID:'client',CUEBOOKER_MAILBOX_ENABLED:'true',CUEBOOKER_MAILBOX_RETURN_URL:'https://pr-96.cuebooker-staging.pages.dev/workspace/'}
;(globalThis as any).Deno={env:{get:(key:string)=>env[key]},serve:(fn:any)=>{handler=fn}}
await import('../supabase/functions/connected-mailbox/index.ts')
const originalFetch=globalThis.fetch
function req(action:string,extra:Record<string,unknown>={}){return new Request('https://edge.invalid',{method:'POST',headers:{Authorization:'Bearer token','Content-Type':'application/json'},body:JSON.stringify({action,workspaceId:workspace,connectionId:connection,...extra})})}
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
 env.OPENAI_API_KEY='test-key'
 const reads:string[]=[]
 globalThis.fetch=(async(url:any,init:any)=>{
 if(url.endsWith('/auth/v1/user'))return Response.json({id:user})
 if(url.includes('workspace_members'))return Response.json([{role:'owner'}])
 if(url.includes('mailbox_connections'))return Response.json([{id:connection,email:'dj@example.invalid',grant_id:'grant'}])
 if(url.includes('nylas.com')){reads.push(url);assert.match(url,/\/messages\/selected-mail$/);return Response.json({data:{id:'selected-mail',thread_id:'thread',from:[{email:'promoter@example.invalid'}],to:[{email:'dj@example.invalid'}],subject:'Disponibilidad',body:'Actuación de prueba',date:1700000000}})}
 if(url.includes('openai.com')){const payload=JSON.parse(init.body),messages=JSON.parse(payload.input);assert.deepEqual(messages.map((m:any)=>m.id),['selected-mail']);return Response.json({output:[{content:[{type:'output_text',text:JSON.stringify({messages:[{id:'selected-mail',kind:'booking',reason:'Consulta disponibilidad'}]})}]}]})}
 throw new Error('Unexpected access')
 }) as typeof fetch
 try{const response=await handler(req('classify',{analysisConsent:true,messageId:'selected-mail'}));assert.equal(response.status,200);const result=await response.json();assert.equal(result.messages.length,1);assert.equal(result.messages[0].classification.kind,'booking');assert.equal(result.hasMore,false);assert.equal(reads.length,1)}finally{globalThis.fetch=originalFetch;delete env.OPENAI_API_KEY}
})

test('invalid selected message cannot fall back to analyzing the mailbox',async()=>{
 let externalCalls=0
 globalThis.fetch=(async(url:any)=>{
 if(url.endsWith('/auth/v1/user'))return Response.json({id:user})
 if(url.includes('workspace_members'))return Response.json([{role:'owner'}])
 if(url.includes('mailbox_connections'))return Response.json([{id:connection,email:'dj@example.invalid',grant_id:'grant'}])
 externalCalls++;throw new Error('Unexpected transmission')
 }) as typeof fetch
 try{const response=await handler(req('classify',{analysisConsent:true,messageId:''}));assert.equal(response.status,400);assert.equal(externalCalls,0)}finally{globalThis.fetch=originalFetch}
})
