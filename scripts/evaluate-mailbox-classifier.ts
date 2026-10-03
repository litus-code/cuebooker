import {setTimeout as pace} from 'node:timers/promises'
import {classifyBookingMail} from '../supabase/functions/_shared/mailboxClassifier.ts'
import {mailboxEvaluationCases,scoreMailboxEvaluation} from './mailbox-evaluation-cases.ts'
// Optional operator-only synthetic test. Never logs a credential or reads mail.
if(!process.argv.includes('--live')){
 console.log(JSON.stringify({mode:'dry-run',cases:mailboxEvaluationCases.length,extractionCases:mailboxEvaluationCases.filter(c=>c.draft).length,model:'openai/gpt-oss-20b',providerCalls:0}));
}else{
 const key=process.env.GROQ_API_KEY;
 if(!key)throw new Error('GROQ_API_KEY must be supplied securely in the operator environment');
 let inputTokens=0,outputTokens=0,usageMissing=0,calls=0;
 const report=(u:{inputTokens:number|null;outputTokens:number|null})=>{if(u.inputTokens===null||u.outputTokens===null)usageMissing++;inputTokens+=u.inputTokens||0;outputTokens+=u.outputTokens||0};
 try{
  calls++;const categories=await classifyBookingMail(mailboxEvaluationCases,key,fetch,false,report);
  const extracted=[];
  for(const item of mailboxEvaluationCases.filter(c=>c.draft)){await pace(35000);calls++;extracted.push(...await classifyBookingMail([item],key,fetch,true,report));}
  const categoryReport=scoreMailboxEvaluation(mailboxEvaluationCases,categories);
  const draftReport=scoreMailboxEvaluation(mailboxEvaluationCases.filter(c=>c.draft),extracted,true);
  console.log(JSON.stringify({mode:'live-synthetic',model:'openai/gpt-oss-20b',categories:categoryReport,extraction:draftReport,calls,inputTokens,outputTokens,usageMissing}));
  if(categoryReport.failures.length||draftReport.failures.length)process.exitCode=1;
 }catch{console.error('Synthetic evaluation stopped after a provider or validation failure; no automatic retry.');process.exitCode=1;}
}
