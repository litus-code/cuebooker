import test from 'node:test';
import assert from 'node:assert/strict';
import {attachmentWarnings,attachmentMetadataWarnings,conversationAttachmentWarnings} from '../app/domain/attachmentWarnings.ts';
import {saveAttachmentWarnings} from '../supabase/functions/_shared/saveAttachmentWarnings.ts';
import {saveMailboxAttachments} from '../supabase/functions/_shared/saveMailboxAttachments.ts';
test('WebP and oversize warnings do not download files or expose private filenames',async()=>{
 let downloads=0;
 const attachments=[{id:'a',name:'private.webp',mime:'image/webp',size:12},{id:'b',name:'private.pdf',mime:'application/pdf',size:5242881}];
 const result=await saveMailboxAttachments({attachments,authorize:async()=>true,existing:async()=>false,download:async()=>{downloads++;return new Uint8Array()},upload:async()=>{},record:async()=>{}});
 assert.equal(downloads,0);assert.equal(result.skipped,2);
 assert.deepEqual(result.issues,[{index:0,reason:'unsupported_format',format:'webp'},{index:1,reason:'too_large'}]);
 assert.deepEqual(attachmentMetadataWarnings(attachments),result.issues);
 assert.doesNotMatch(JSON.stringify(result),/private/);
});
test('warnings survive reload with zero saved documents and disappear after exact file recovery',()=>{
 const persisted=JSON.parse(JSON.stringify([{id:'message',attachment_warnings:[{index:0,reason:'unsupported_format',format:'webp'},{index:1,reason:'save_failed'}]}]));
 assert.match(conversationAttachmentWarnings(persisted,[],'es')[0].text,/WebP/);
 assert.equal(conversationAttachmentWarnings(persisted,[{email_message_id:'other',attachment_index:0}],'es').length,2);
 assert.equal(conversationAttachmentWarnings(persisted,[{email_message_id:'message',attachment_index:0}],'en').length,1);
 assert.equal(conversationAttachmentWarnings(persisted,[{email_message_id:'message',attachment_index:0},{email_message_id:'message',attachment_index:1}],'en').length,0);
 assert.deepEqual(attachmentWarnings([{index:-1,reason:'save_failed'},{index:0,reason:'raw-private-error'},{index:1,reason:'too_large',name:'private'}]),[{index:1,reason:'too_large'}]);
});
test('notice persistence rechecks authorization and binds exact inbound message, workspace and account',async()=>{
 let authorizations=0;const calls:any[]=[];
 const options={workspaceId:'workspace',bookingId:'booking',connectionId:'connection',messageId:'message',warnings:[{index:0,reason:'unsupported_format',format:'webp',name:'private'}],authorize:async()=>{authorizations++;return true},db:async(path:string,init:any)=>{calls.push({path,init});return [{id:'email',attachment_warnings:[{index:1,reason:'too_large'}]}]}};
 assert.equal(await saveAttachmentWarnings(options as any),true);assert.equal(authorizations,2);
 assert.match(calls[1].path,/workspace_id=eq.workspace&booking_id=eq.booking&provider=eq.nylas%3Aconnection&provider_message_id=eq.message&direction=eq.inbound/);
 assert.deepEqual(JSON.parse(calls[1].init.body).attachment_warnings,[{index:1,reason:'too_large'},{index:0,reason:'unsupported_format',format:'webp'}]);
 assert.doesNotMatch(calls[1].init.body,/private/);
 calls.length=0;authorizations=0;
 assert.equal(await saveAttachmentWarnings({...options,authorize:async()=>++authorizations<2} as any),false);assert.equal(calls.length,1);
 calls.length=0;
 assert.equal(await saveAttachmentWarnings({...options,db:async()=>[]} as any),false);assert.equal(calls.length,0);
});
