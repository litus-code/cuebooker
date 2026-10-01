import test from 'node:test';
import assert from 'node:assert/strict';
import {createNylasEventsHandler} from '../supabase/functions/nylas-mailbox-events/index.ts';
import {verifyNylasSignature,boundedNotificationBody} from '../supabase/functions/_shared/nylasIncomingNotification.ts';
const secret='fictional-test-secret';
const notification={id:'event-one',type:'message.created',data:{object:{grant_id:'grant-one',id:'mail-one',thread_id:'thread-one',date:1790857800,subject:'Private subject',body:'Private body'}}};
async function signed(body:string){const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign']);return Array.from(new Uint8Array(await crypto.subtle.sign('HMAC',key,new TextEncoder().encode(body))),v=>v.toString(16).padStart(2,'0')).join('')}
async function request(value:unknown,signature?:string){const body=typeof value==='string'?value:JSON.stringify(value);return new Request('https://example.invalid/webhook',{method:'POST',body,headers:{'x-nylas-signature':signature??await signed(body)}})}
test('challenge echoes exact plain value without reading secrets or touching storage',async()=>{
 const handler=createNylasEventsHandler({secret:()=>{throw new Error('Unexpected secret read')},enqueue:async()=>{throw new Error('Unexpected queue')}});
 const response=await handler(new Request('https://example.invalid/webhook?challenge=test-challenge'));
 assert.equal(response.status,200);assert.equal(await response.text(),'test-challenge');assert.equal(response.headers.get('content-type'),'text/plain');
 assert.equal((await handler(new Request('https://example.invalid/webhook'))).status,400);
});
test('missing secret, invalid signature and changed exact bytes never enqueue',async()=>{
 let calls=0;const enqueue=async()=>{calls++;return {accepted:true}};
 const off=createNylasEventsHandler({secret:()=>'',enqueue});assert.equal((await off(await request(notification))).status,503);
 const handler=createNylasEventsHandler({secret:()=>secret,enqueue});
 assert.equal((await handler(await request(notification,'0'.repeat(64)))).status,401);
 assert.equal((await handler(await request(JSON.stringify(notification)+' ',await signed(JSON.stringify(notification))))).status,401);
 assert.equal(calls,0);
 assert.equal(await verifyNylasSignature(new Uint8Array(),'bad',secret),false);
});
test('signed incoming event enqueues only identifiers and provider date, with opaque acknowledgement',async()=>{
 const values:any[]=[];const handler=createNylasEventsHandler({secret:()=>secret,enqueue:async value=>{values.push(value);return {accepted:true,duplicate:values.length>1}}});
 for(let i=0;i<2;i++)assert.deepEqual(await (await handler(await request(notification))).json(),{received:true});
 assert.deepEqual(values[0],{target_grant:'grant-one',target_event:'event-one',target_message:'mail-one',target_thread:'thread-one',target_date:new Date(notification.data.object.date*1000).toISOString()});
 assert.equal(JSON.stringify(values).includes('Private'),false);
});
test('truncated new mail is supported while irrelevant events never enter queue',async()=>{
 let calls=0;const handler=createNylasEventsHandler({secret:()=>secret,enqueue:async()=>{calls++;return {accepted:false}}});
 assert.equal((await handler(await request({...notification,type:'message.created.truncated'}))).status,200);
 for(const type of ['message.updated','event.created','message.send_success'])assert.deepEqual(await (await handler(await request({...notification,type}))).json(),{received:true});
 assert.equal(calls,1);
});
test('malformed authenticated event fails before queue and queue failure asks for redelivery',async()=>{
 let calls=0;const handler=createNylasEventsHandler({secret:()=>secret,enqueue:async()=>{calls++;throw new Error('private database detail')}});
 for(const value of [{...notification,id:''},{...notification,data:{object:{...notification.data.object,date:null}}},'not-json'])assert.equal((await handler(await request(value))).status,400);
 assert.equal(calls,0);const r=await handler(await request(notification));assert.equal(r.status,503);assert.deepEqual(await r.json(),{error:'mailbox_queue_unavailable'});assert.equal(calls,1);
});
test('bounded body enforces actual stream length, and compressed delivery fails closed',async()=>{
 await assert.rejects(boundedNotificationBody(new Request('https://example.invalid',{method:'POST',body:'12345'}),4),/mailbox_notification_too_large/);
 await assert.rejects(boundedNotificationBody(new Request('https://example.invalid',{method:'POST',body:'1',headers:{'content-length':'999'}}),4),/mailbox_notification_too_large/);
 let calls=0;const handler=createNylasEventsHandler({secret:()=>secret,enqueue:async()=>{calls++;return {}}});
 const req=await request(notification);req.headers.set('content-encoding','gzip');assert.equal((await handler(req)).status,415);assert.equal(calls,0);
});
