import test from 'node:test';
import assert from 'node:assert/strict';
import {mailboxAnalysisKey,withMailboxAnalysisCache} from '../supabase/functions/_shared/mailboxAnalysisCache.ts';
const a={id:'a',subject:'Consulta',body:'Disponible el 24 de octubre?'},b={...a,id:'b'};
const classification=(id:string)=>({id,kind:'booking' as const,reason:'Consulta de actuación'});
test('cache identity tracks effective transmitted content and extraction mode',async()=>{
 const key=await mailboxAnalysisKey(a,false);
 assert.notEqual(key,await mailboxAnalysisKey({...a,subject:'Cambio'},false));
 assert.notEqual(key,await mailboxAnalysisKey({...a,body:'Otra oferta'},false));
 assert.notEqual(key,await mailboxAnalysisKey(b,false));
 assert.notEqual(key,await mailboxAnalysisKey(a,true));
 assert.equal(await mailboxAnalysisKey({...a,body:'x'.repeat(2500)+'old'},false),await mailboxAnalysisKey({...a,body:'x'.repeat(2500)+'new'},false));
});
test('mixed batch transmits only misses, restores order and reuses a second read without spending',async()=>{
 const stored=[{input_hash:await mailboxAnalysisKey(a,false),classification:classification('a')}];let calls=0,writes=0;
 const options={messages:[b,a],extractDraft:false,read:async()=>stored,write:async(rows:any[])=>{writes++;stored.push(...rows)},run:async(messages:any[])=>{calls++;assert.deepEqual(messages.map(m=>m.id),['b']);return [classification('b')]}};
 assert.deepEqual((await withMailboxAnalysisCache(options)).map(v=>v.id),['b','a']);
 assert.deepEqual((await withMailboxAnalysisCache(options)).map(v=>v.id),['b','a']);
 assert.equal(calls,1);assert.equal(writes,1);
});
test('invalid stored result is not trusted and failed model output is never cached',async()=>{
 let writes=0;
 await assert.rejects(withMailboxAnalysisCache({messages:[a],extractDraft:false,read:async()=>[{input_hash:await mailboxAnalysisKey(a,false),classification:classification('foreign')}],write:async()=>{writes++},run:async()=>[classification('foreign')]}),/invalid_classification/);
 assert.equal(writes,0);
});
test('cache read failure fails closed before transmitting mail',async()=>{
 let calls=0;
 await assert.rejects(withMailboxAnalysisCache({messages:[a],extractDraft:false,read:async()=>{throw new Error('storage_failed')},write:async()=>{},run:async()=>{calls++;return [classification('a')]}}),/storage_failed/);
 assert.equal(calls,0);
});
