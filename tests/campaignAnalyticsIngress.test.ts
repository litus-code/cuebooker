import test from 'node:test'
import assert from 'node:assert/strict'
import { handleCampaignAnalytics } from '../supabase/functions/_shared/campaignAnalyticsIngress.ts'
const valid={operation:'event',visitor_token:'a'.repeat(64),event_key:'10000000-0000-4000-8000-000000000001',event_name:'page_view',dimensions:{page:'dj'}}
const request=(body:unknown)=>new Request('https://fixture.invalid',{method:'POST',body:JSON.stringify(body)})
test('campaign ingress rejects unbounded, malformed and forged milestone requests before persistence',async()=>{
 let count=0;const deps={limit:async()=>({allowed:true,retryAfterSeconds:0}),persist:async()=>{count++;return true}}
 assert.equal((await handleCampaignAnalytics(request({...valid,padding:'x'.repeat(5000)}),deps)).status,413)
 for(const body of [null,[],{}, {...valid,event_name:'signup_completed'},{...valid,visitor_token:'email@example.invalid'},{...valid,dimensions:[]}]) assert.equal((await handleCampaignAnalytics(request(body),deps)).status,400)
 assert.equal(count,0)
 assert.equal((await handleCampaignAnalytics(request(valid),deps)).status,200);assert.equal(count,1)
})
test('campaign ingress reuses abuse limit, fails closed and allows withdrawal without a tracking event',async()=>{
 const calls:any[]=[]
 const deps={limit:async()=>({allowed:false,retryAfterSeconds:60}),persist:async(...args:any[])=>{calls.push(args);return null}}
 const limited=await handleCampaignAnalytics(request(valid),deps)
 assert.equal(limited.status,429);assert.equal(limited.headers.get('Retry-After'),'60');assert.equal(calls.length,0)
 assert.equal((await handleCampaignAnalytics(request({operation:'withdraw',visitor_token:valid.visitor_token}),deps)).status,200)
 assert.equal(calls.length,1);assert.equal(calls[0][0],'withdraw')
 assert.equal((await handleCampaignAnalytics(request(valid),{...deps,limit:async()=>{throw new Error('backend unavailable')}})).status,503)
})

test('actual Edge adapter uses existing rate-limit RPC and privileged writes, with no private errors in responses',async()=>{
 const {readFile}=await import('node:fs/promises'),{stripTypeScriptTypes}=await import('node:module')
 const root=new URL('../supabase/functions/',import.meta.url)
 const source=await readFile(new URL('campaign-analytics/index.ts',root),'utf8')
 const code=stripTypeScriptTypes(source.replace(/^import 'jsr:[^\n]+\n/m,'').replace("'../_shared/campaignAnalyticsIngress.ts'",JSON.stringify(new URL('_shared/campaignAnalyticsIngress.ts',root).href)).replace("'../_shared/publicRateLimit.ts'",JSON.stringify(new URL('_shared/publicRateLimit.ts',root).href)))
 const savedDeno=Object.getOwnPropertyDescriptor(globalThis,'Deno'),originalFetch=globalThis.fetch
 const calls:any[]=[];let handler:Function=()=>{},allowed=true
 Object.defineProperty(globalThis,'Deno',{configurable:true,value:{env:{get:(name:string)=>({SUPABASE_URL:'https://isolated.invalid',SUPABASE_SERVICE_ROLE_KEY:'fixture-server-key'} as Record<string,string>)[name]},serve:(fn:Function)=>{handler=fn}}})
 globalThis.fetch=async(url:any,init:any)=>{
  calls.push({url,headers:init.headers,body:JSON.parse(init.body)})
  if(String(url).endsWith('revoke_campaign_consent'))return new Response(null,{status:204})
  return new Response(JSON.stringify(String(url).endsWith('consume_public_rate_limit')?[{allowed,retry_after_seconds:60,remaining:10}]:true),{status:200})
 }
 try {
  await import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`)
  const incoming=()=>new Request('https://isolated.invalid',{method:'POST',headers:{'x-forwarded-for':'192.0.2.25'},body:JSON.stringify(valid)})
  assert.equal((await handler(incoming())).status,200);assert.equal(calls.length,2)
  assert.match(calls[0].url,/consume_public_rate_limit$/);assert.match(calls[0].body.target_key_hash,/^[a-f0-9]{64}$/)
  assert.equal(calls[0].body.target_scope,'campaign_client');assert.doesNotMatch(JSON.stringify(calls[0].body),/192\.0\.2\.25/)
  assert.match(calls[1].url,/record_campaign_event$/);assert.equal(calls[1].headers.Authorization,'Bearer fixture-server-key')
  allowed=false;assert.equal((await handler(incoming())).status,429);assert.equal(calls.length,3)
  const noAddress=await handler(request(valid));assert.equal(noAddress.status,429);assert.equal(calls.length,3)
  const withdrawal=await handler(request({operation:'withdraw',visitor_token:valid.visitor_token}));assert.equal(withdrawal.status,200);assert.match(calls[3].url,/revoke_campaign_consent$/)
 }finally{globalThis.fetch=originalFetch;if(savedDeno)Object.defineProperty(globalThis,'Deno',savedDeno);else delete (globalThis as any).Deno}
})
