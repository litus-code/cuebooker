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

test('Groq repeated HTTP 400 fails after one format fallback',async()=>{
 const warn=console.warn;
 const logs:unknown[][]=[];
 console.warn=(...parts:unknown[])=>{logs.push(parts)};
 try{
  let calls=0;
  await assert.rejects(classifyBookingMail([{id:'one',subject:'Oferta',body:'Hola'}],'key',(async()=>{
   calls++;
   return Response.json({error:{code:'invalid_json_schema',message:'sensitive provider validation details'}},{status:400});
  }) as typeof fetch,true),{message:'mailbox_ai_bad_request'});
  assert.equal(calls,2);
  assert.deepEqual(logs.at(-1),['mailbox_classifier_http_status',400,'mailbox_ai_bad_request']);
  assert.doesNotMatch(JSON.stringify(logs),/sensitive provider validation details/);
 }finally{console.warn=warn}
});

test('Groq 400 reports only allowlisted rejection code',async()=>{
 const old=console.warn,logs:unknown[][]=[];
 console.warn=(...args:unknown[])=>{logs.push(args)};
 try{
  await assert.rejects(classifyBookingMail([{id:'one',subject:'Consulta',body:'Hola'}],'key',(async()=>
   Response.json({error:{code:'invalid_json_schema',message:'sensitive validation content'}},{status:400})
  ) as typeof fetch,true),{message:'mailbox_ai_bad_request'});
  assert.deepEqual(logs[0],['mailbox_classifier_rejected_request',{kind:'invalid_json_schema'}]);
  assert.doesNotMatch(JSON.stringify(logs),/sensitive validation content/);
 }finally{console.warn=old}
});

test('strict JSON rejection falls back once to JSON object with identical validation',async()=>{
 const modes:string[]=[];
 const booking={id:'one',kind:'other',reason:'No pide una actuación',draft:{eventDate:null,startTime:null,endTime:null,venue:null,city:null,offerAmountMinor:null,currency:null,artistName:null,contactPhone:null,warnings:[]}};
 const output=await classifyBookingMail([{id:'one',subject:'Publicidad',body:'Hola'}],'key',(async(_url:any,init:any)=>{
  const payload=JSON.parse(init.body);modes.push(payload.response_format.type);
  if(modes.length===1)return Response.json({error:{code:'invalid_json_schema'}},{status:400});
  return Response.json({choices:[{finish_reason:'stop',message:{content:JSON.stringify({messages:[booking]})}}]});
 }) as typeof fetch,true);
 assert.deepEqual(modes,['json_schema','json_object']);
 assert.equal(output[0].kind,'other');
});

test('generic 400, unsupported model, failed generation and malformed rejection never trigger fallback',async()=>{
 for(const failure of [{error:{code:'invalid_request_error',param:'temperature'}},{error:{code:'model_not_supported'}},{error:{code:'json_validate_failed',failed_generation:'private generated content'}},{error:{message:'json_schema not accepted? private message'}},null]){
  let calls=0;
  await assert.rejects(classifyBookingMail([{id:'one',subject:'Consulta',body:'Hola'}],'key',(async()=>{calls++;return Response.json(failure,{status:400})}) as typeof fetch,true),{message:'mailbox_ai_bad_request'});
  assert.equal(calls,1);
 }
});
test('object mode includes the full output contract and preserves extracted booking validation and usage',async()=>{
 const requests:any[]=[],usage:any[]=[];
 const draft={eventDate:'2027-03-15',startTime:'23:00',endTime:'01:00',venue:'Club de ejemplo',city:null,offerAmountMinor:120000,currency:'EUR',artistName:null,contactPhone:null,warnings:[]};
 const output=await classifyBookingMail([{id:'one',subject:'Disponibilidad 15 marzo 2027',body:'Oferta 1200 EUR'}],'key',(async(_url:any,init:any)=>{
  const body=JSON.parse(init.body);requests.push(body);
  if(requests.length===1)return Response.json({error:{code:'invalid_json_schema'}},{status:400});
  assert.match(body.messages[0].content,/Return only a JSON object/);
  assert.ok(body.messages[0].content.includes(JSON.stringify(requests[0].response_format.json_schema.schema)));
  assert.equal(body.messages[1].content,requests[0].messages[1].content);
  return Response.json({usage:{prompt_tokens:123,completion_tokens:45},choices:[{finish_reason:'stop',message:{content:JSON.stringify({messages:[{id:'one',kind:'booking',reason:'Pide disponibilidad',draft}]})}}]});
 }) as typeof fetch,true,value=>usage.push(value));
 assert.equal(requests.length,2);assert.equal(output[0].draft?.offerAmountMinor,120000);assert.deepEqual(usage.at(-1),{inputTokens:123,outputTokens:45});
});
test('fallback cannot bypass local IDs, field, date, money, draft or truncated-output checks',async()=>{
 const draft={eventDate:null,startTime:null,endTime:null,venue:null,city:null,offerAmountMinor:null,currency:null,artistName:null,contactPhone:null,warnings:[]};
 const valid={id:'one',kind:'booking',reason:'Consulta',draft};
 const invalid=[{messages:[{...valid,id:'foreign'}]},{messages:[valid,valid]},{messages:[{...valid,sendNow:true}]},{messages:[{...valid,draft:{...draft,offerAmountMinor:1.2}}]},{messages:[{...valid,draft:{...draft,eventDate:'2027-02-30'}}]},{messages:[{id:'one',kind:'booking',reason:'Consulta'}]},{messages:[{...valid,draft:null}]},{messages:[valid],action:'send'},null];
 for(const result of invalid){let calls=0;
  await assert.rejects(classifyBookingMail([{id:'one',subject:'Oferta',body:'Hola'}],'key',(async()=>++calls===1?Response.json({error:{code:'invalid_json_schema'}},{status:400}):Response.json({choices:[{finish_reason:'stop',message:{content:JSON.stringify(result)}}]})) as typeof fetch,true),{message:'invalid_classification'});
  assert.equal(calls,2);
 }
 for(const finish_reason of ['length']){let calls=0;
  await assert.rejects(classifyBookingMail([{id:'one',subject:'Oferta',body:'Hola'}],'key',(async()=>++calls===1?Response.json({error:{code:'invalid_json_schema'}},{status:400}):Response.json({choices:[{finish_reason,message:{content:JSON.stringify({messages:[valid]})}}]})) as typeof fetch,true),{message:'invalid_classification'});assert.equal(calls,2);
 }
});
test('quota, rate and transport errors during fallback are terminal and retain their category',async()=>{
 for(const [code,expected] of [['rate_limit_exceeded','mailbox_ai_rate_limit'],['insufficient_quota','mailbox_ai_quota_exhausted'],['network','private network failure']]){let calls=0;
  await assert.rejects(classifyBookingMail([{id:'one',subject:'Oferta',body:'Hola'}],'key',(async()=>{calls++;if(calls===1)return Response.json({error:{code:'invalid_json_schema'}},{status:400});if(code==='network')throw new Error('private network failure');return Response.json({error:{code}},{status:429})}) as typeof fetch,true),{message:expected});assert.equal(calls,2);
 }
});
