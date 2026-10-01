import {processMailboxIncoming} from '../_shared/processMailboxIncoming.ts';
import {createNylasMailbox} from '../_shared/nylasMailbox.ts';
import {classifyBookingMail} from '../_shared/mailboxClassifier.ts';
import {withMailboxAnalysisBudget} from '../_shared/mailboxAnalysisBudget.ts';
import {withMailboxAnalysisCache} from '../_shared/mailboxAnalysisCache.ts';
const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json','Cache-Control':'no-store'}});
Deno.serve(async(request:Request)=>{
 if(request.method!=='POST')return json({error:'method_not_allowed'},405);
 const secret=Deno.env.get('MAILBOX_WORKER_SECRET')||'';
 if(Deno.env.get('CUEBOOKER_MAILBOX_ENABLED')!=='true'||Deno.env.get('CUEBOOKER_MAILBOX_BACKGROUND_ENABLED')!=='true'||!secret||!Deno.env.get('NYLAS_WEBHOOK_SECRET')||!Deno.env.get('NYLAS_API_KEY')||!Deno.env.get('NYLAS_CLIENT_ID')||!Deno.env.get('GROQ_API_KEY'))return json({error:'mailbox_background_unavailable'},503);
 const actual=request.headers.get('authorization')||'',expected=`Bearer ${secret}`;let difference=actual.length^expected.length;for(let i=0;i<expected.length;i++)difference|=(actual.charCodeAt(i)||0)^expected.charCodeAt(i);if(difference)return json({error:'unauthorized'},401);
 const base=Deno.env.get('SUPABASE_URL')||'',key=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')||'';
 async function db<T>(path:string,init:RequestInit={}):Promise<T>{const response=await fetch(`${base}/rest/v1/${path}`,{...init,headers:{apikey:key,Authorization:`Bearer ${key}`,'Content-Type':'application/json',Prefer:'return=representation',...(init.headers||{})},signal:AbortSignal.timeout(8000)});if(!response.ok)throw new Error('mailbox_storage_failed');const text=await response.text();return (text?JSON.parse(text):null) as T;}
 const rpc=<T>(name:string,payload:unknown={})=>db<T>(`rpc/${name}`,{method:'POST',body:JSON.stringify(payload)});
 try{
  const job=await rpc<any>('claim_mailbox_incoming');if(!job)return json({processed:0});
  const provider=createNylasMailbox({apiUri:Deno.env.get('NYLAS_API_URI')||'https://api.us.nylas.com',apiKey:Deno.env.get('NYLAS_API_KEY')||'',clientId:Deno.env.get('NYLAS_CLIENT_ID')||'',callbackUri:`${base}/functions/v1/connected-mailbox`});
  const outcome=await processMailboxIncoming(job,{
   authorize:()=>rpc<boolean>('authorize_mailbox_incoming',{target_job:job.id}),
   message:()=>provider.message(job.grantId,job.messageId),inbox:()=>provider.inboxFolders(job.grantId),
   linkedBooking:async()=>{const rows=await db<any[]>(`mailbox_booking_threads?connection_id=eq.${job.connectionId}&workspace_id=eq.${job.workspaceId}&thread_id=eq.${encodeURIComponent(job.threadId)}&select=booking_id&limit=1`);return rows[0]?.booking_id||null;},
   sync:(bookingId,message)=>rpc('ingest_mailbox_thread',{target_connection:job.connectionId,target_actor:job.actorId,target_thread:job.threadId,target_messages:[message],target_artist:null,target_booking:bookingId}),
   classify:async message=>{
    const context={target_workspace:job.workspaceId,target_actor:job.actorId,target_connection:job.connectionId,target_request:job.id};
    const values=await withMailboxAnalysisCache({messages:[message],extractDraft:false,
     read:keys=>db(`mailbox_ai_results?connection_id=eq.${job.connectionId}&extract_draft=eq.false&input_hash=in.(${keys.join(',')})&expires_at=gt.${encodeURIComponent(new Date().toISOString())}&select=input_hash,classification`),
     write:async rows=>{await db(`mailbox_ai_results?connection_id=eq.${job.connectionId}&expires_at=lte.${encodeURIComponent(new Date().toISOString())}`,{method:'DELETE'});return db('mailbox_ai_results?on_conflict=connection_id,message_id,extract_draft',{method:'POST',headers:{Prefer:'resolution=merge-duplicates,return=minimal'},body:JSON.stringify(rows.map(row=>({...row,connection_id:job.connectionId,extract_draft:false,expires_at:new Date(Date.now()+86400000).toISOString()})))});},
     run:messages=>withMailboxAnalysisBudget({reserve:()=>rpc('reserve_mailbox_analysis',context),complete:(outcome,usage)=>rpc('complete_mailbox_analysis',{...context,target_outcome:outcome,target_input_tokens:usage.inputTokens,target_output_tokens:usage.outputTokens}),run:async report=>{if(!await rpc<boolean>('authorize_mailbox_incoming',{target_job:job.id}))throw new Error('mailbox_consent_withdrawn');return classifyBookingMail(messages,Deno.env.get('GROQ_API_KEY')||'',fetch,false,report)}})
    });return values[0];
   },
   complete:(state,value)=>rpc('complete_mailbox_incoming',{target_job:job.id,target_state:state,target_kind:value?.kind||null,target_reason:value?.reason||null})
  });
  return json({processed:1,outcome});
 }catch{console.warn('mailbox_incoming_processing_failed');return json({error:'mailbox_processing_unavailable'},503);}
});
