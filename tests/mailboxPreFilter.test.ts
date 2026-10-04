import test from 'node:test';
import assert from 'node:assert/strict';
import {mailboxPreFilter} from '../supabase/functions/_shared/mailboxPreFilter.ts';
import {gmailMessage} from '../supabase/functions/_shared/gmailMailbox.ts';

test('short, generic-address and keyword-free enquiries still reach AI',()=>{
 for(const raw of [{from:[{email:'info@example.invalid'}],body:'Libre el viernes?'},{from:[{email:'noreply@example.invalid'}],body:'Actuación'},{body:'Sí'},{}])assert.equal(mailboxPreFilter(raw,'id'),null);
});
test('automatically generated booking forms are not rejected',()=>{
 assert.equal(mailboxPreFilter({automation:{autoSubmitted:'auto-generated'},body:'Nueva solicitud de actuación'},'id'),null);
});
test('automatic replies remain reviewable rather than generating new bookings',()=>{
 assert.deepEqual(mailboxPreFilter({automation:{autoSubmitted:'Auto-Replied; owner-email=x'}},'id')?.kind,'review');
 assert.equal(mailboxPreFilter({automation:{autoSubmitted:'no'}},'id'),null);
});
test('distribution-list evidence must be combined and stays reviewable',()=>{
 const automation={listId:'<events.example.invalid>',listUnsubscribe:'<mailto:unsubscribe@example.invalid>',precedence:'bulk'};
 assert.equal(mailboxPreFilter({automation},'id')?.kind,'review');
 for(const field of Object.keys(automation))assert.equal(mailboxPreFilter({automation:{...automation,[field]:''}},'id'),null);
});
test('only delivery-status multipart reports are marked other',()=>{
 assert.equal(mailboxPreFilter({automation:{contentType:'multipart/report; report-type="delivery-status"; boundary=x'}},'id')?.kind,'other');
 for(const contentType of ['text/plain','multipart/report; report-type=disposition-notification','delivery-status'])assert.equal(mailboxPreFilter({automation:{contentType}},'id'),null);
});
test('Gmail headers feed server-only filtering without leaking into normalized UI messages',async()=>{
 const {mailboxMessage}=await import('../supabase/functions/_shared/mailboxMessage.ts');
 const raw=gmailMessage({id:'m',threadId:'t',internalDate:'1790849100000',payload:{headers:[{name:'From',value:'sender@example.invalid'},{name:'Auto-Submitted',value:'auto-replied'}]}});
 assert.equal(mailboxPreFilter(raw,'m')?.kind,'review');
 assert.equal('automation' in mailboxMessage(raw,'dj@example.invalid'),false);
});
