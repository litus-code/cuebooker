import { test } from 'node:test'
import assert from 'node:assert/strict'
import { brevoPreflight } from '../scripts/brevo-provider-preflight.ts'
const env: Record<string,string> = { SUPABASE_SERVICE_ROLE_KEY: 'test-service-only', BREVO_API_KEY: 'test-provider', CUEBOOKER_INBOUND_WEBHOOK_SECRET: 'test-inbound', BREVO_TRANSACTIONAL_WEBHOOK_SECRET: 'test-events' }
const request = (token = 'test-service-only', method = 'POST') => new Request('https://diagnostic.invalid', { method, headers: { Authorization: `Bearer ${token}` } })
test('diagnostic rejects all client callers and invalid methods before accessing provider', async () => {
 let calls = 0
 const handler = brevoPreflight(n=>env[n], (async()=>{calls++; throw Error('should not run')}) as typeof fetch)
 for (const token of ['', 'anon', 'user-jwt']) assert.equal((await handler(request(token))).status,401)
 assert.equal((await handler(request('test-service-only','GET'))).status,405)
 assert.equal(calls,0)
})
test('diagnostic only reads fixed provider endpoints and removes credentials and unrelated metadata', async () => {
 const calls: {url:string, init:RequestInit|undefined}[]=[]
 const handler = brevoPreflight(n=>env[n], (async(url,init)=>{
  calls.push({url:String(url),init})
  return new Response(JSON.stringify({webhooks:[{id:2191448, domain:'reply.cuebooker.com', url:'https://private:credential@lycprjeuuynfzwskycwv.supabase.co/functions/v1/ingest-booking-email?secret=private-query',headers:[{key:'x-cuebooker-webhook-secret',value:'test-inbound'}],events:['inboundEmailProcessed'],description:'private-description'}]}))
 }) as typeof fetch)
 const res=await handler(request()); assert.equal(res.status,200)
 const text=await res.text()
 for (const secret of ['private-query','credential','private-description','test-service-only','test-provider','test-inbound']) assert.equal(text.includes(secret),false)
 assert.equal(calls.length,2)
 for(const c of calls) { assert.equal(c.init?.method,'GET'); assert.equal(c.init?.redirect,'error'); assert.equal(new URL(c.url).origin,'https://api.brevo.com') }
 const data=JSON.parse(text); assert.equal(data.callbacks[0].authentication_matches_production,true); assert.equal(data.callbacks[1].authentication_matches_production,false)
})
test('provider errors and thrown secret-bearing messages never enter diagnostic output',async()=>{
 for(const fetcher of [(async()=>new Response('private-provider-body',{status:401})),(async()=>{throw Error('private-provider-body')})]) {
  const r=await brevoPreflight(n=>env[n],fetcher as typeof fetch)(request());assert.equal(r.status,502);assert.equal((await r.text()).includes('private-provider-body'),false)
 }
})
test('only exact platform secret keys authorize the current Supabase dashboard test',async()=>{
 let calls=0
 const values={...env,SUPABASE_SECRET_KEYS:JSON.stringify({default:'sb_secret_test_admin'})}
 const handler=brevoPreflight(n=>values[n as keyof typeof values],(async()=>{calls++;return new Response(JSON.stringify({webhooks:[]}))}) as typeof fetch)
 for(const key of ['','sb_publishable_test','sb_secret_wrong']) {
  const r=await handler(new Request('https://diagnostic.invalid',{method:'POST',headers:{apikey:key}}));assert.equal(r.status,401)
 }
 assert.equal(calls,0)
 const r=await handler(new Request('https://diagnostic.invalid',{method:'POST',headers:{apikey:'sb_secret_test_admin'}}));assert.equal(r.status,200);assert.equal(calls,2)
 assert.equal((await r.text()).includes('sb_secret_test_admin'),false)
})
test('provider not-found metadata is distinct from permission or invalid-credential failures',async()=>{
 let calls=0
 const handler=brevoPreflight(n=>env[n],(async()=>{calls++;return new Response(JSON.stringify({code:'document_not_found',message:'private-context'}),{status:400})}) as typeof fetch)
 const r=await handler(request());const body=await r.json();assert.equal(r.status,200);assert.equal(calls,2)
 assert.deepEqual(body.callbacks,[{type:'inbound',lookup_status:'document_not_found'},{type:'transactional',lookup_status:'document_not_found'}])
 const denied=await brevoPreflight(n=>env[n],(async()=>new Response(JSON.stringify({code:'unauthorized',message:'private-context'}),{status:401})) as typeof fetch)(request())
 assert.equal(denied.status,502);assert.equal((await denied.text()).includes('private-context'),false)
})
