import test from 'node:test'
import assert from 'node:assert/strict'
import {classifyBookingMail,validateMailClassifications} from '../supabase/functions/_shared/mailboxClassifier.ts'
test('AI 429 distinguishes explicit quota and rate codes without exposing provider text or retrying',async()=>{
 const warn=console.warn,logs:any[]=[];console.warn=(...args)=>{logs.push(args)}
 try{
  for(const [code,expected] of [['insufficient_quota','mailbox_ai_quota_exhausted'],['rate_limit_exceeded','mailbox_ai_rate_limit'],['private-code','mailbox_ai_unavailable']]){
   let calls=0
   await assert.rejects(classifyBookingMail([{id:'one',subject:'Test',body:'Test'}],'key',(async()=>{calls++;return Response.json({error:{code,message:'private-provider-detail'}},{status:429})}) as typeof fetch),{message:expected})
   assert.equal(calls,1)
  }
  assert.doesNotMatch(JSON.stringify(logs),/private-provider-detail|private-code/)
 }finally{console.warn=warn}
})
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
