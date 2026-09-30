import test from 'node:test'
import assert from 'node:assert/strict'
import {classifyBookingMail,validateMailClassifications} from '../supabase/functions/_shared/mailboxClassifier.ts'
test('classifier rejects invented IDs, duplicated results and unexpected categories',()=>{
 const value={messages:[{id:'one',kind:'booking',reason:'Pide disponibilidad'}]}
 assert.equal(validateMailClassifications(value,['one'])[0].kind,'booking')
 assert.throws(()=>validateMailClassifications(value,['other']))
 assert.throws(()=>validateMailClassifications({messages:[value.messages[0],value.messages[0]]},['one','two']))
 assert.throws(()=>validateMailClassifications({messages:[{id:'one',kind:'send_now',reason:''}]},['one']))
})
test('analysis sends bounded text with no attachments, disables storage and treats mail as untrusted',async()=>{
 let payload:any
 const result=await classifyBookingMail([{id:'one',subject:'Disponibilidad',body:'x'.repeat(10000)}],'key',(async(_url:any,init:any)=>{payload=JSON.parse(init.body);return Response.json({output:[{content:[{type:'output_text',text:JSON.stringify({messages:[{id:'one',kind:'review',reason:'Falta contexto'}]})}]}]})}) as typeof fetch)
 assert.equal(payload.store,false);assert.equal(JSON.parse(payload.input)[0].body.length,2500);assert.match(payload.instructions,/untrusted/);assert.equal('tools' in payload,false);assert.equal(result[0].kind,'review')
})
