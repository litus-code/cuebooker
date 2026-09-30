import test from 'node:test'
import assert from 'node:assert/strict'
import { createNylasMailbox,mailboxAuthorizationUrl,normalizeMailboxEmail } from '../supabase/functions/_shared/nylasMailbox.ts'
const config={apiUri:'https://api.us.nylas.com',apiKey:'server-secret',clientId:'client',callbackUri:'https://staging.invalid/functions/v1/connected-mailbox'}
test('authorization uses hosted provider, opaque state and email-only scopes without API secret',()=>{
 for(const provider of ['google','microsoft','imap'] as const){
  const target=new URL(mailboxAuthorizationUrl(config,{email:' TEST@EXAMPLE.INVALID ',provider,state:'a'.repeat(64)}))
  assert.equal(target.origin,config.apiUri);assert.equal(target.searchParams.get('login_hint'),'test@example.invalid');assert.equal(target.searchParams.get('state'),'a'.repeat(64));assert.equal(target.searchParams.get('redirect_uri'),config.callbackUri);assert.equal(target.href.includes(config.apiKey),false)
  assert.doesNotMatch(target.searchParams.get('scope')||'',/calendar|contacts/i)
 }
 assert.throws(()=>mailboxAuthorizationUrl({...config,apiUri:'https://attacker.invalid'},{email:'a@b.invalid',provider:'google',state:'state'}))
 for(const email of ['bad','a@b.invalid\nInjected','a b@example.invalid'])assert.throws(()=>normalizeMailboxEmail(email))
})
test('exchange keeps API capability server-side and validates grant metadata',async()=>{
 const calls:Array<{url:string;options:RequestInit}>=[]
 const request=(async(url:any,options:any)=>{calls.push({url,options});return new Response(JSON.stringify(url.endsWith('/token')?{grant_id:'grant/one',access_token:'unused-secret'}:{data:{email:'TEST@EXAMPLE.INVALID',provider:'google',grant_status:'valid'}}),{status:200})}) as typeof fetch
 const api=createNylasMailbox(config,request),id=await api.exchange('authorization-code'),grant=await api.grant(id)
 assert.equal(id,'grant/one');assert.deepEqual(grant,{email:'test@example.invalid',provider:'google',status:'valid'});assert.equal(calls[1].url,'https://api.us.nylas.com/v3/grants/grant%2Fone');assert.equal(JSON.parse(String(calls[0].options.body)).client_secret,config.apiKey)
})
test('provider errors never expose provider bodies or private tokens',async()=>{
 for(const [status,expected] of [[401,'mailbox_reconnect_required'],[403,'mailbox_reconnect_required'],[404,'mailbox_not_found'],[500,'mailbox_provider_unavailable']] as const){
  const api=createNylasMailbox(config,(async()=>new Response('private message and secret',{status})) as typeof fetch)
  await assert.rejects(api.grant('grant'),{message:expected})
 }
 const invalid=createNylasMailbox(config,(async()=>new Response(JSON.stringify({data:{provider:'unknown',email:'a@b.invalid'}}))) as typeof fetch)
 await assert.rejects(invalid.grant('grant'),{message:'invalid_provider_response'})
})
