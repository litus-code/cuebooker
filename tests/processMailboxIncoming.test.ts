import test from 'node:test';
import assert from 'node:assert/strict';
import {processMailboxIncoming} from '../supabase/functions/_shared/processMailboxIncoming.ts';
const job={id:'job',connectionId:'connection',workspaceId:'workspace',actorId:'actor',grantId:'grant',email:'dj@example.invalid',messageId:'mail',threadId:'thread',since:'2026-10-01T10:00:00Z'};
const draft={eventDate:null,startTime:null,endTime:null,venue:null,city:null,offerAmountMinor:220000,currency:'EUR',artistName:null,contactPhone:null,warnings:['Revisa los artistas y la fecha.']};
const raw={id:'mail',thread_id:'thread',date:1790849100,from:[{email:'promoter@example.invalid'}],to:[{email:job.email}],body:'Consulta',folders:['opaque-inbox']};
function setup(overrides:any={}){const calls:string[]=[];const options={authorize:async()=>{calls.push('authorize');return true},message:async()=>{calls.push('read');return raw},inbox:async()=>({inbox:['opaque-inbox'],excluded:['spam']}),linkedBooking:async()=>null,sync:async()=>{calls.push('sync')},classify:async()=>{calls.push('ai');return {id:'mail',kind:'booking' as const,reason:'Consulta',draft}},create:async()=>{calls.push('create')},complete:async(state:string)=>{calls.push(state)},...overrides};return {calls,options}}
test('disabled/stale permission never reads message or calls AI',async()=>{const {calls,options}=setup({authorize:async()=>false});assert.equal(await processMailboxIncoming(job,options),'ignored');assert.deepEqual(calls,['ignored'])});
test('outgoing, pre-cutover and non-inbox messages never reach AI or booking sync',async()=>{
 for(const message of [{...raw,from:[{email:job.email}]},{...raw,date:1},{...raw,folders:['spam']},{...raw,folders:['spam','opaque-inbox']},{...raw,folders:[]},{...raw,id:'foreign'},{...raw,thread_id:'foreign'}]){const {calls,options}=setup({message:async()=>message});assert.equal(await processMailboxIncoming(job,options),'ignored');assert.equal(calls.includes('ai'),false);assert.equal(calls.includes('sync'),false)}
});
test('linked-thread reply syncs deterministically without classifying or creating a booking',async()=>{const {calls,options}=setup({linkedBooking:async()=> 'booking',sync:async(id:string,message:any)=>{assert.equal(id,'booking');assert.equal(message.id,'mail');calls.push('sync')}});assert.equal(await processMailboxIncoming(job,options),'synced');assert.equal(calls.includes('ai'),false);assert.equal(calls.includes('sync'),true)});
test('one eligible request is created after final consent check without sending or confirming',async()=>{const {calls,options}=setup();assert.equal(await processMailboxIncoming(job,options),'created');assert.deepEqual(calls,['authorize','read','authorize','ai','authorize','create'])});
test('other and uncertain mail never creates a request',async()=>{for(const kind of ['other','review']){const {calls,options}=setup({classify:async()=>({id:'mail',kind,reason:'Revisar',draft})});assert.equal(await processMailboxIncoming(job,options),'classified');assert.equal(calls.includes('create'),false);assert.equal(calls.at(-1),'completed')}});
test('withdrawal while model runs prevents automatic capture',async()=>{let check=0;const {calls,options}=setup({authorize:async()=>++check<3});assert.equal(await processMailboxIncoming(job,options),'ignored');assert.equal(calls.includes('create'),false)});
test('missing extraction fails closed instead of creating empty or invented data',async()=>{const {calls,options}=setup({classify:async()=>({id:'mail',kind:'booking',reason:'Consulta'})});assert.equal(await processMailboxIncoming(job,options),'failed');assert.equal(calls.includes('create'),false)});
test('permission withdrawn during provider read prevents AI and sync',async()=>{let check=0;const {calls,options}=setup({authorize:async()=>++check===1});assert.equal(await processMailboxIncoming(job,options),'ignored');assert.equal(calls.includes('ai'),false)});
test('provider/model uncertainty is marked failed without retry',async()=>{let attempts=0;const {calls,options}=setup({classify:async()=>{attempts++;throw new Error('provider failure')}});assert.equal(await processMailboxIncoming(job,options),'failed');assert.equal(attempts,1);assert.equal(calls.at(-1),'failed')});
test('automated unlinked mail is saved for review without AI or a new booking',async()=>{
 let saved:any;const {calls,options}=setup({message:async()=>({...raw,automation:{autoSubmitted:'auto-replied'}}),complete:async(state:string,value:any)=>{saved=value;calls.push(state)}});
 assert.equal(await processMailboxIncoming(job,options),'filtered');assert.equal(saved.kind,'review');assert.equal(calls.includes('ai'),false);assert.equal(calls.includes('create'),false);assert.equal(calls.at(-1),'completed');
});
test('linked automatic replies sync before filtering without losing the conversation',async()=>{
 const {calls,options}=setup({message:async()=>({...raw,automation:{autoSubmitted:'auto-replied'}}),linkedBooking:async()=>'booking'});
 assert.equal(await processMailboxIncoming(job,options),'synced');assert.equal(calls.includes('sync'),true);assert.equal(calls.includes('ai'),false);
});
test('withdrawn consent prevents deterministic filter completion',async()=>{
 let checks=0;const {calls,options}=setup({message:async()=>({...raw,automation:{autoSubmitted:'auto-replied'}}),authorize:async()=>++checks===1});
 assert.equal(await processMailboxIncoming(job,options),'ignored');assert.equal(calls.includes('completed'),false);
});
test('ambiguous reply references stay reviewable without AI or a duplicate request',async()=>{
 let saved:any;const {calls,options}=setup({linkedBooking:async()=>({review:true}),complete:async(state:string,value:any)=>{saved=value;calls.push(state)}});
 assert.equal(await processMailboxIncoming(job,options),'review');assert.equal(saved.kind,'review');assert.equal(calls.includes('ai'),false);assert.equal(calls.includes('create'),false);
});

test('explicit AI rate limit defers a retained job, uncertain errors never request a retry',async()=>{
 let retries=0,completed=0;
 const base={authorize:async()=>true,message:async()=>raw,inbox:async()=>({inbox:['opaque-inbox'],excluded:[]}),linkedBooking:async()=>null,sync:async()=>{},create:async()=>{},complete:async()=>{completed++},retry:async()=>{retries++;return true}};
 assert.equal(await processMailboxIncoming(job,{...base,classify:async()=>{throw new Error('mailbox_ai_rate_limit')}}),'deferred');
 assert.equal(retries,1);assert.equal(completed,0);
 assert.equal(await processMailboxIncoming(job,{...base,classify:async()=>{throw new Error('mailbox_ai_unavailable')}}),'failed');
 assert.equal(retries,1);assert.equal(completed,1);
});

test('failed processing records a safe phase, without persisting provider error details',async()=>{
 let failureStage='';
 const {options}=setup({
  message:async()=>{throw new Error('private provider token and email contents')},
  complete:async(state:string,_value:unknown,stage?:string)=>{assert.equal(state,'failed');failureStage=stage||''}
 });
 assert.equal(await processMailboxIncoming(job,options),'failed');
 assert.equal(failureStage,'provider_read');
 assert.equal(failureStage.includes('token'),false);
});
test('classification failure stage is distinguishable from booking creation',async()=>{
 let failureStage='';
 const {options}=setup({
  classify:async()=>{throw new Error('provider failure')},
  complete:async(_state:string,_value:unknown,stage?:string)=>{failureStage=stage||''}
 });
 assert.equal(await processMailboxIncoming(job,options),'failed');
 assert.equal(failureStage,'classification');
});

test('attachments are stored only after the original booking is created',async()=>{
 const events:string[]=[];
 const {options}=setup({
  create:async()=>{events.push('created');return 'booking-id'},
  saveAttachments:async(_raw:any,id:string)=>{assert.equal(id,'booking-id');events.push('attachments')}
 });
 assert.equal(await processMailboxIncoming(job,options),'created');
 assert.deepEqual(events,['created','attachments']);
});
test('attachment failure never creates another booking or retries AI',async()=>{
 let creates=0,uploads=0,retries=0;
 const {options}=setup({
  create:async()=>{creates++;return 'booking-id'},
  saveAttachments:async()=>{uploads++;throw new Error('storage unavailable')},
  retry:async()=>{retries++;return true}
 });
 assert.equal(await processMailboxIncoming(job,options),'created');
 assert.equal(creates,1);
 assert.equal(uploads,1);
 assert.equal(retries,0);
});
test('unclassified mail never downloads attachments',async()=>{
 let attachments=0;
 const {options}=setup({
  classify:async()=>({id:'mail',kind:'other' as const,reason:'not a booking'}),
  saveAttachments:async()=>{attachments++}
 });
 assert.equal(await processMailboxIncoming(job,options),'classified');
 assert.equal(attachments,0);
});

test('classification failure logs only a known category and keeps the database failure phase',async()=>{
 let stage='';
 const {options}=setup({
  classify:async()=>{throw new Error('mailbox_ai_unavailable')},
  complete:async(_state:string,_value:unknown,reason?:string)=>{stage=reason||''}
 });
 const previous=console.warn;
 const entries:unknown[][]=[];
 console.warn=(...items:unknown[])=>{entries.push(items)};
 try{
  assert.equal(await processMailboxIncoming(job,options),'failed');
  assert.equal(stage,'classification');
  assert.deepEqual(entries[0],['mailbox_classification_failure_category','mailbox_ai_unavailable']);
 }finally{console.warn=previous}
});
