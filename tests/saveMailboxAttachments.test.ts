import test from 'node:test';
import assert from 'node:assert/strict';
import {saveMailboxAttachments,mailboxAttachmentMime} from '../supabase/functions/_shared/saveMailboxAttachments.ts';
const pdf=new TextEncoder().encode('%PDF-1.7\nfixture');
const png=Uint8Array.from([137,80,78,71,13,10,26,10,0]);
function setup(overrides:any={}){
 const events:string[]=[];const rows=new Set<number>();
 const options={attachments:[{id:'pdf',name:'fixture.pdf',mime:'application/pdf',size:pdf.length}],authorize:async()=>{events.push('authorize');return true},existing:async(index:number)=>rows.has(index),download:async()=>{events.push('download');return pdf},upload:async()=>{events.push('upload')},record:async(index:number)=>{events.push('record');rows.add(index)},...overrides};
 return {events,rows,options};
}
test('validated PDF is saved once, with consent before download/upload/metadata',async()=>{
 const {events,options}=setup();assert.deepEqual(await saveMailboxAttachments(options),{stored:1,alreadyStored:0,skipped:0,failed:0,blocked:false});assert.deepEqual(events,['authorize','download','authorize','upload','authorize','record']);
 events.length=0;assert.equal((await saveMailboxAttachments(options)).alreadyStored,1);assert.deepEqual(events,['authorize']);
});
test('revocation before read, during download or after upload stops further private file work',async()=>{
 for(const stop of [1,2,3]){let checks=0;const {events,options}=setup({authorize:async()=>++checks<stop});const result=await saveMailboxAttachments(options);assert.equal(result.blocked,true);assert.equal(events.includes('record'),false);assert.equal(events.includes('download'),stop>1);assert.equal(events.includes('upload'),stop>2)}
});
test('unsupported MIME and size are skipped before download; full magic and actual size are checked',async()=>{
 for(const attachment of [{mime:'text/html',size:pdf.length},{mime:'application/pdf',size:5242881},{mime:'application/pdf',size:0}]){const {events,options}=setup({attachments:[{id:'a',name:'a',...attachment}]});assert.equal((await saveMailboxAttachments(options)).skipped,1);assert.deepEqual(events,[])}
 for(const bytes of [new Uint8Array(),png,new Uint8Array(pdf.length+1)]){const {events,options}=setup({download:async()=>bytes});assert.equal((await saveMailboxAttachments(options)).failed,1);assert.equal(events.includes('upload'),false)}
 assert.equal(mailboxAttachmentMime(Uint8Array.from([137,80,78,71,13,10,0,0])),'');assert.equal(mailboxAttachmentMime(png),'image/png');assert.equal(mailboxAttachmentMime(Uint8Array.from([255,216,255])),'image/jpeg');
});
test('partial metadata failure is visible and recovers by deterministic upload without re-saving successful files',async()=>{
 let fails=true;const uploads:number[]=[],records:number[]=[];
 const {rows,options}=setup({attachments:[{id:'a',name:'a.pdf',mime:'application/pdf',size:pdf.length},{id:'b',name:'b.pdf',mime:'application/pdf',size:pdf.length}],upload:async(i:number)=>{uploads.push(i)},record:async(i:number)=>{if(i===0&&fails)throw new Error('private metadata details');rows.add(i);records.push(i)}});
 const first=await saveMailboxAttachments(options);assert.equal(first.failed,1);assert.equal(first.stored,1);fails=false;
 const second=await saveMailboxAttachments(options);assert.equal(second.stored,1);assert.equal(second.alreadyStored,1);assert.deepEqual(uploads,[0,1,0]);assert.deepEqual(records,[1,0]);
});
test('lookup, provider and upload failures are diagnostic, contain no private exception data and do not stop other files',async()=>{
 const old=console.warn,logs:any[]=[];console.warn=(...args)=>logs.push(args);
 try{for(const [operation,stage] of [['authorize','authorization'],['existing','metadata_lookup'],['download','provider'],['upload','storage'],['record','metadata']]){const {options}=setup({[operation]:async()=>{throw new Error('private-key-and-filename')}});assert.equal((await saveMailboxAttachments(options)).failed,1);assert.deepEqual(logs.at(-1),['mailbox_attachment_item_failed',{stage,index:0}])}assert.doesNotMatch(JSON.stringify(logs),/private-key-and-filename/)}finally{console.warn=old}
});
