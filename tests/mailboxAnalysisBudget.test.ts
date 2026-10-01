import test from 'node:test'
import assert from 'node:assert/strict'
import {withMailboxAnalysisBudget,mailboxTokenUsage} from '../supabase/functions/_shared/mailboxAnalysisBudget.ts'
test('a rejected or failed reservation never transmits mail to the model',async()=>{
 let calls=0;
 for(const reserve of [async()=>({error:'mailbox_ai_budget_exhausted'}),async()=>{throw new Error('storage_failed')}]){
  await assert.rejects(withMailboxAnalysisBudget({reserve,complete:async()=>{},run:async()=>{calls++;return []}}));
 }
 assert.equal(calls,0);
})
test('usage is recorded for success and failed output, without refunding attempts or retrying',async()=>{
 const completed:any[]=[];let calls=0;
 const base={reserve:async()=>({reserved:true}),complete:async(...args:any[])=>{completed.push(args)}};
 const usage={inputTokens:500,outputTokens:800};
 assert.equal(await withMailboxAnalysisBudget({...base,run:async report=>{calls++;report(usage);return 'ok'}}),'ok');
 await assert.rejects(withMailboxAnalysisBudget({...base,run:async report=>{calls++;report(usage);throw new Error('invalid_classification')}}),{message:'invalid_classification'});
 assert.deepEqual(completed,[['succeeded',usage],['failed',usage]]);assert.equal(calls,2);
})
test('accounting failure preserves a valid proposal and the consumed reservation',async()=>{
 const previous=console.warn,logs:any[]=[];console.warn=(...args)=>logs.push(args);
 try{assert.equal(await withMailboxAnalysisBudget({reserve:async()=>({reserved:true}),complete:async()=>{throw new Error('private detail')},run:async()=>42}),42);assert.deepEqual(logs,[['mailbox_analysis_accounting_unavailable']]);}
 finally{console.warn=previous}
})
test('usage metadata accepts only bounded integer token counts',()=>{
 assert.deepEqual(mailboxTokenUsage({prompt_tokens:500,completion_tokens:600}),{inputTokens:500,outputTokens:600});
 assert.deepEqual(mailboxTokenUsage({prompt_tokens:-1,completion_tokens:1.5}),{inputTokens:null,outputTokens:null});
 assert.deepEqual(mailboxTokenUsage({prompt_tokens:1000001,completion_tokens:'700'}),{inputTokens:null,outputTokens:null});
})
