import test from 'node:test'
import assert from 'node:assert/strict'
import {groupConversationAttachments} from '../app/domain/conversationAttachments.ts'
const file=(id:string,message:string|null)=>({id,email_message_id:message,attachment_index:0,file_name:'same-name.png',byte_size:12})
test('inbound/outbound documents and warnings stay with their exact email despite identical names',()=>{
 const activities=[{id:'incoming',type:'email',metadata:{email_message_id:'in'}},{id:'outgoing',type:'email',metadata:{email_message_id:'out'}},{id:'rejected',type:'email',metadata:{email_message_id:'webp'}},{id:'note',type:'note',metadata:{email_message_id:'in'}}]
 const result=groupConversationAttachments(activities,[{id:'in'},{id:'out'},{id:'webp',attachment_warnings:[{index:0,reason:'unsupported_format',format:'webp'}]}],[file('a','in'),file('b','out')],'es')
 assert.deepEqual(result.byActivity.get('incoming')?.files.map(f=>f.id),['a'])
 assert.deepEqual(result.byActivity.get('outgoing')?.files.map(f=>f.id),['b'])
 assert.equal(result.byActivity.has('note'),false)
 assert.equal(result.byActivity.get('incoming')?.warnings.length,0)
 assert.equal(result.byActivity.get('rejected')?.files.length,0)
 assert.match(result.byActivity.get('rejected')!.warnings[0].text,/WebP/)
 assert.deepEqual(result.unassigned,{files:[],warnings:[]})
})
test('unlinked historical documents remain available without guessing a message',()=>{
 const result=groupConversationAttachments([{id:'email',type:'email',metadata:{email_message_id:'known'}}],[{id:'missing',attachment_warnings:[{index:1,reason:'save_failed'}]}],[file('legacy',null),file('unloaded','missing'),file('known','known')],'en')
 assert.deepEqual(result.unassigned.files.map(f=>f.id),['legacy','unloaded'])
 assert.equal(result.unassigned.warnings.length,1)
 assert.deepEqual(result.byActivity.get('email')?.files.map(f=>f.id),['known'])
})
