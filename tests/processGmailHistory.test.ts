import test from 'node:test';
import assert from 'node:assert/strict';
import {processGmailHistory} from '../supabase/functions/_shared/processGmailHistory.ts';
const connection={id:'c',grant_id:'gmail:grant',email:'dj@example.invalid',background_analysis_since:'2026-10-01T00:00:00Z',background_analysis_revision:'revision'};
const message={id:'m',thread_id:'t',folders:['INBOX'],from:[{email:'promoter@example.invalid'}],date:1790849100};
test('first watch sets baseline without replaying older mailbox messages',async()=>{
 let saved:any;const result=await processGmailHistory({connection,watch:{},topic:'topic'},{authorized:async()=>true,provider:{watch:async()=>({historyId:'100',expiresAt:'2026-10-10T00:00:00Z'})},enqueue:async()=>{throw new Error('must not replay');},save:async patch=>{saved=patch;}});
 assert.equal(result,'watch_started');assert.equal(saved.history_id,'100');
});
test('history fetch uses Gmail message IDs, queues unique entries and advances only final cursor',async()=>{
 const enqueued:any[]=[],saved:any[]=[],pages:any[]=[];
 const result=await processGmailHistory({connection,watch:{history_id:'100',watch_expires_at:'2099-10-10T00:00:00Z'},topic:'topic'},{authorized:async()=>true,provider:{history:async(start:string,cursor?:string)=>{pages.push([start,cursor]);return cursor?{historyId:'300',history:[]}:{historyId:'200',nextPageToken:'page2',history:[{messagesAdded:[{message:{id:'m'}},{message:{id:'m'}}]}]};},message:async()=>message},enqueue:async m=>{enqueued.push(m);return {accepted:true};},save:async patch=>{saved.push(patch);}});
 assert.equal(result,'synced');assert.equal(enqueued.length,1);assert.deepEqual(pages,[['100',undefined],['100','page2']]);assert.deepEqual(saved,[{history_id:'300'}]);
});
test('queue full does not advance cursor and consent withdrawal stops provider reads',async()=>{
 let saved=0,calls=0;const deps={authorized:async()=>true,provider:{history:async()=>{calls++;return {historyId:'200',history:[{messagesAdded:[{message:{id:'m'}}]}]};},message:async()=>message},enqueue:async()=>({error:'mailbox_incoming_queue_full'}),save:async()=>{saved++;}};
 await assert.rejects(processGmailHistory({connection,watch:{history_id:'100'},topic:'topic'},deps));assert.equal(saved,0);
 assert.equal(await processGmailHistory({connection,watch:{history_id:'100'},topic:'topic'},{...deps,authorized:async()=>false}),'revoked');assert.equal(calls,1);
});
test('expired history is visible as resync_required, without silently replaying inbox',async()=>{
 let saved:any;const result=await processGmailHistory({connection,watch:{history_id:'100'},topic:'topic'},{authorized:async()=>true,provider:{history:async()=>{throw new Error('mailbox_not_found');}},enqueue:async()=>({}),save:async p=>{saved=p;}});
 assert.equal(result,'resync_required');assert.deepEqual(saved,{state:'resync_required'});
});
