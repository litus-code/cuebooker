import test from 'node:test';
import assert from 'node:assert/strict';
import {mailboxReplyReferences,resolveMailboxReply,savedReplyBooking} from '../supabase/functions/_shared/mailboxReplyLink.ts';
const reply={threading:{inReplyTo:'<parent@example.invalid>',references:'<first@example.invalid> <parent@example.invalid>'}};
test('saved references only link the same counterparty; forwarded and conflicting records require review',()=>{
 const incoming={booking_id:'booking',direction:'inbound',from_email:'promoter@example.invalid',to_email:'dj@example.invalid'};
 const outgoing={...incoming,direction:'outbound',from_email:incoming.to_email,to_email:incoming.from_email};
 assert.equal(savedReplyBooking([incoming],'PROMOTER@example.invalid'),'booking');assert.equal(savedReplyBooking([outgoing],'promoter@example.invalid'),'booking');
 assert.equal(savedReplyBooking([incoming],'other@example.invalid'),null);assert.equal(savedReplyBooking([incoming,outgoing],'promoter@example.invalid'),null);assert.equal(savedReplyBooking([{...incoming,direction:'unknown'}],'promoter@example.invalid'),null);
});
test('reply references prioritize direct parent and deduplicate ancestors',()=>{
 assert.deepEqual(mailboxReplyReferences(reply),['<parent@example.invalid>','<first@example.invalid>']);
});
test('oversized or excessively long chains stay reviewable without provider calls',async()=>{
 for(const raw of [{threading:{references:'x'.repeat(4097)}},{threading:{references:Array.from({length:11},(_,i)=>`<${i}@example.invalid>`).join(' ')}}]){
  assert.deepEqual(await resolveMailboxReply(raw,{authorize:async()=>true,find:async()=>{throw Error('must not call')},savedBooking:async()=>null}),{review:true});
 }
});
test('a saved parent links a changed thread to exactly one existing booking',async()=>{
 const seen:string[]=[];assert.equal(await resolveMailboxReply(reply,{authorize:async()=>true,find:async reference=>{seen.push(reference);return reference.includes('parent')?['saved-message']:[]},savedBooking:async id=>id==='saved-message'?'booking':null}),'booking');assert.equal(seen.length,2);
});
test('a provider hit without a saved scoped message cannot establish booking ownership',async()=>{
 assert.deepEqual(await resolveMailboxReply(reply,{authorize:async()=>true,find:async()=>['foreign-message'],savedBooking:async()=>null}),{review:true});
});
test('conflicting saved parents remain reviewable instead of choosing a booking',async()=>{
 assert.deepEqual(await resolveMailboxReply(reply,{authorize:async()=>true,find:async reference=>[reference],savedBooking:async id=>id.includes('parent')?'one':'two'}),{review:true});
});
test('permission withdrawal stops reference lookups and final linkage',async()=>{
 let reads=0;await assert.rejects(resolveMailboxReply(reply,{authorize:async()=>false,find:async()=>{reads++;return []},savedBooking:async()=>null}),{message:'mailbox_consent_withdrawn'});assert.equal(reads,0);
 let checks=0;await assert.rejects(resolveMailboxReply({threading:{inReplyTo:'<parent@example.invalid>'}},{authorize:async()=>++checks===1,find:async()=>['saved'],savedBooking:async()=>'booking'}),{message:'mailbox_consent_withdrawn'});
});
test('new mail without references follows ordinary detection; malformed replies require review',async()=>{
 const options={authorize:async()=>true,find:async()=>[],savedBooking:async()=>null};
 assert.equal(await resolveMailboxReply({},options),null);assert.deepEqual(await resolveMailboxReply({threading:{inReplyTo:'unexpected syntax'}},options),{review:true});
});
