import test from 'node:test'
import assert from 'node:assert/strict'
import {mailboxMessage} from '../supabase/functions/_shared/mailboxMessage.ts'
import {createNylasMailbox} from '../supabase/functions/_shared/nylasMailbox.ts'
const config={apiUri:'https://api.us.nylas.com',apiKey:'private',clientId:'client',callbackUri:'https://staging.invalid/callback'}
test('mail rendering removes active HTML and pixels, retaining text and thread identity',()=>{
 const m=mailboxMessage({id:'message',thread_id:'thread',date:1790000000,from:[{email:'PROMOTER@example.invalid'}],to:[{email:'dj@example.invalid'}],subject:'Actuación',body:'<style>private</style><script>secret()</script><p>Hola &amp; gracias</p><img src="https://tracking.invalid/pixel">'},'dj@example.invalid')
 assert.equal(m.threadId,'thread');assert.equal(m.from,'promoter@example.invalid');assert.equal(m.to,'dj@example.invalid');assert.equal(m.body,'Hola & gracias')
 assert.throws(()=>mailboxMessage({id:'x'},'dj@example.invalid'))
})
test('own-mailbox reply sends escaped body and the actual provider message reference',async()=>{
 let url='',payload:any
 const api=createNylasMailbox(config,(async(u:any,init:any)=>{url=u;payload=JSON.parse(init.body);return Response.json({data:{id:'sent',thread_id:'same'}})}) as typeof fetch)
 await api.send('grant/one',{to:'promoter@example.invalid',subject:'Re: Consulta',bodyText:'<script>example</script>\nHola',replyToMessageId:'original'})
 assert.equal(url,'https://api.us.nylas.com/v3/grants/grant%2Fone/messages/send');assert.equal(payload.reply_to_message_id,'original');assert.equal(payload.body,'&lt;script&gt;example&lt;/script&gt;<br>Hola');assert.equal('from' in payload,false)
})
test('message listing scopes query to the selected grant/thread and preserves pagination',async()=>{
 let url=''
 const api=createNylasMailbox(config,(async(u:any)=>{url=u;return Response.json({data:[],next_cursor:'next'})}) as typeof fetch)
 const result=await api.messages('grant','thread/one','cursor')
 const query=new URL(url).searchParams
 assert.equal(query.get('thread_id'),'thread/one');assert.equal(query.get('page_token'),'cursor');assert.equal(query.get('limit'),'20');assert.equal(result.nextCursor,'next')
})
