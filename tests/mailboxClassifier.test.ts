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
 const result=await classifyBookingMail([{id:'one',subject:'Disponibilidad',body:'x'.repeat(10000)}],'key',(async(url:any,init:any)=>{assert.equal(url,'https://api.groq.com/openai/v1/chat/completions');payload=JSON.parse(init.body);return Response.json({choices:[{finish_reason:'stop',message:{content:JSON.stringify({messages:[{id:'one',kind:'review',reason:'Falta contexto'}]})}}]})}) as typeof fetch)
 assert.equal(payload.model,'openai/gpt-oss-20b');assert.equal(payload.reasoning_effort,'low');assert.equal(payload.max_completion_tokens,1600);assert.equal(payload.response_format.json_schema.strict,true);assert.equal('store' in payload,false);assert.equal(JSON.parse(payload.messages[1].content)[0].body.length,2500);assert.match(payload.messages[0].content,/untrusted/);assert.equal('tools' in payload,false);assert.equal(result[0].kind,'review')
})

test('413 splits rejected batches, preserves all IDs and accounts for successful calls',async()=>{
 const batches:string[][]=[],usage:any[]=[];
 const messages=Array.from({length:5},(_,i)=>({id:String(i),subject:'Test',body:'Test'}));
 const result=await classifyBookingMail(messages,'key',(async(_url:any,init:any)=>{
  const batch=JSON.parse(JSON.parse(init.body).messages[1].content);batches.push(batch.map((m:any)=>m.id));
  if(batch.length>2)return Response.json({error:{message:'private-provider-detail'}},{status:413});
  return Response.json({usage:{prompt_tokens:100,completion_tokens:20},choices:[{finish_reason:'stop',message:{content:JSON.stringify({messages:batch.map((m:any)=>({id:m.id,kind:'other',reason:'No solicita actuación'}))})}}]});
 }) as typeof fetch,false,value=>usage.push(value));
 assert.deepEqual(result.map(m=>m.id),messages.map(m=>m.id));
 assert.deepEqual(batches,[['0','1','2','3','4'],['0','1','2'],['0','1'],['2'],['3','4']]);
 assert.deepEqual(usage.at(-1),{inputTokens:300,outputTokens:60});
});
test('splitting stops at a single rejected message and never retries rate limits',async()=>{
 let calls=0;
 await assert.rejects(classifyBookingMail([{id:'one',subject:'Test',body:'Test'}],'key',(async()=>{calls++;return new Response('',{status:413})}) as typeof fetch),{message:'mailbox_ai_unavailable'});
 assert.equal(calls,1);
 calls=0;const usage:any[]=[];
 await assert.rejects(classifyBookingMail([{id:'one',subject:'Test',body:'Test'},{id:'two',subject:'Test',body:'Test'}],'key',(async(_url:any,init:any)=>{
  calls++;const batch=JSON.parse(JSON.parse(init.body).messages[1].content);
  if(batch.length>1)return new Response('',{status:413});
  if(batch[0].id==='two')return Response.json({error:{code:'rate_limit_exceeded'}},{status:429});
  return Response.json({usage:{prompt_tokens:100,completion_tokens:20},choices:[{finish_reason:'stop',message:{content:JSON.stringify({messages:[{id:'one',kind:'other',reason:'No solicita actuación'}]})}}]});
 }) as typeof fetch,false,value=>usage.push(value)),{message:'mailbox_ai_rate_limit'});
 assert.equal(calls,3);assert.deepEqual(usage.at(-1),{inputTokens:100,outputTokens:20});
});

test('Groq HTTP 400 is a non-retryable request error, never presented as outage',async()=>{
 const warn=console.warn;
 const logs:unknown[][]=[];
 console.warn=(...parts:unknown[])=>{logs.push(parts)};
 try{
  let calls=0;
  await assert.rejects(classifyBookingMail([{id:'one',subject:'Oferta',body:'Hola'}],'key',(async()=>{
   calls++;
   return Response.json({error:{message:'sensitive provider validation details'}},{status:400});
  }) as typeof fetch,true),{message:'mailbox_ai_bad_request'});
  assert.equal(calls,1);
  assert.deepEqual(logs.at(-1),['mailbox_classifier_http_status',400,'mailbox_ai_bad_request']);
  assert.doesNotMatch(JSON.stringify(logs),/sensitive provider validation details/);
 }finally{console.warn=warn}
});
