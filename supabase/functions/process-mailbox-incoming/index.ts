import {processMailboxIncoming} from '../_shared/processMailboxIncoming.ts';
import {mailboxTransport,gmailConfig} from '../_shared/mailboxTransport.ts';
import {gmailConfigured} from '../_shared/gmailMailbox.ts';
import {classifyBookingMail} from '../_shared/mailboxClassifier.ts';
import {withMailboxAnalysisBudget} from '../_shared/mailboxAnalysisBudget.ts';
import {withMailboxAnalysisCache} from '../_shared/mailboxAnalysisCache.ts';
import {automaticMailboxDraft} from '../_shared/automaticMailboxDraft.ts';
import {resolveMailboxReply,savedReplyBooking} from '../_shared/mailboxReplyLink.ts';
const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json','Cache-Control':'no-store'}});
Deno.serve(async(request:Request)=>{
 if(request.method!=='POST')return json({error:'method_not_allowed'},405);
 const secret=Deno.env.get('MAILBOX_WORKER_SECRET')||'';
 if(Deno.env.get('CUEBOOKER_MAILBOX_ENABLED')!=='true'||Deno.env.get('CUEBOOKER_MAILBOX_BACKGROUND_ENABLED')!=='true'||!secret||!(gmailConfigured(gmailConfig(n=>Deno.env.get(n)))||(Deno.env.get('NYLAS_WEBHOOK_SECRET')&&Deno.env.get('NYLAS_API_KEY')&&Deno.env.get('NYLAS_CLIENT_ID')))||!Deno.env.get('GROQ_API_KEY'))return json({error:'mailbox_background_unavailable'},503);
 const actual=request.headers.get('authorization')||'',expected=`Bearer ${secret}`;let difference=actual.length^expected.length;for(let i=0;i<expected.length;i++)difference|=(actual.charCodeAt(i)||0)^expected.charCodeAt(i);if(difference)return json({error:'unauthorized'},401);
 const base=Deno.env.get('SUPABASE_URL')||'',key=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')||'';
 async function db<T>(path:string,init:RequestInit={}):Promise<T>{const response=await fetch(`${base}/rest/v1/${path}`,{...init,headers:{apikey:key,Authorization:`Bearer ${key}`,'Content-Type':'application/json',Prefer:'return=representation',...(init.headers||{})},signal:AbortSignal.timeout(8000)});if(!response.ok)throw new Error('mailbox_storage_failed');const text=await response.text();return (text?JSON.parse(text):null) as T;}
 const rpc=<T>(name:string,payload:unknown={})=>db<T>(`rpc/${name}`,{method:'POST',body:JSON.stringify(payload)});
 try{
  const job=await rpc<any>('claim_mailbox_incoming');if(!job)return json({processed:0});
  const connections=await db<any[]>(`mailbox_connections?id=eq.${job.connectionId}&workspace_id=eq.${job.workspaceId}&user_id=eq.${job.actorId}&status=eq.connected&select=id,email,workspace_id,user_id,transport&limit=1`);
  if(!connections[0])throw new Error('connection_not_found');
  const provider=mailboxTransport(connections[0],n=>Deno.env.get(n),db);
  const outcome=await processMailboxIncoming(job,{
   authorize:()=>rpc<boolean>('authorize_mailbox_incoming',{target_job:job.id}),
   message:()=>provider.message(job.grantId,job.messageId),inbox:()=>provider.inboxFolders(job.grantId),
   linkedBooking:async raw=>{
    const rows=await db<any[]>(`mailbox_booking_threads?connection_id=eq.${job.connectionId}&workspace_id=eq.${job.workspaceId}&thread_id=eq.${encodeURIComponent(job.threadId)}&select=booking_id&limit=1`);
    if(rows[0])return rows[0].booking_id;
    if(!('referencedMessages' in provider))return null;
    return resolveMailboxReply(raw,{
     authorize:()=>rpc<boolean>('authorize_mailbox_incoming',{target_job:job.id}),
     find:reference=>provider.referencedMessages(reference),
     savedBooking:async id=>{
      // Existing ingest stores connection-scoped IDs under this namespace for
      // both transports. Never match another mailbox or workspace's messages.
      const saved=await db<any[]>(`email_messages?workspace_id=eq.${job.workspaceId}&provider=eq.${encodeURIComponent('nylas:'+job.connectionId)}&provider_message_id=eq.${encodeURIComponent(id)}&select=booking_id,direction,from_email,to_email&limit=2`);
      const sender=String(raw.from?.[0]?.email||'').trim().toLowerCase();
      return savedReplyBooking(saved,sender);
     }
    });
   },
   sync:(bookingId,message)=>rpc('ingest_mailbox_thread',{target_connection:job.connectionId,target_actor:job.actorId,target_thread:job.threadId,target_messages:[message],target_artist:null,target_booking:bookingId}),
   classify:async message=>{
    const context={target_workspace:job.workspaceId,target_actor:job.actorId,target_connection:job.connectionId,target_request:job.requestId};
    const values=await withMailboxAnalysisCache({messages:[message],extractDraft:true,
     read:keys=>db(`mailbox_ai_results?connection_id=eq.${job.connectionId}&extract_draft=eq.true&input_hash=in.(${keys.join(',')})&expires_at=gt.${encodeURIComponent(new Date().toISOString())}&select=input_hash,classification`),
     write:async rows=>{await db(`mailbox_ai_results?connection_id=eq.${job.connectionId}&expires_at=lte.${encodeURIComponent(new Date().toISOString())}`,{method:'DELETE'});return db('mailbox_ai_results?on_conflict=connection_id,message_id,extract_draft',{method:'POST',headers:{Prefer:'resolution=merge-duplicates,return=minimal'},body:JSON.stringify(rows.map(row=>({...row,connection_id:job.connectionId,extract_draft:true,expires_at:new Date(Date.now()+86400000).toISOString()})))});},
     run:messages=>withMailboxAnalysisBudget({reserve:()=>rpc('reserve_mailbox_analysis',context),complete:(outcome,usage)=>rpc('complete_mailbox_analysis',{...context,target_outcome:outcome,target_input_tokens:usage.inputTokens,target_output_tokens:usage.outputTokens}),run:async report=>{if(!await rpc<boolean>('authorize_mailbox_incoming',{target_job:job.id}))throw new Error('mailbox_consent_withdrawn');return classifyBookingMail(messages,Deno.env.get('GROQ_API_KEY')||'',fetch,true,report)}})
    });return values[0];
   },
   create:(message,value)=>rpc('create_automatic_mailbox_request',{target_job:job.id,target_message:message,target_classification:{...value,draft:automaticMailboxDraft(value.draft!)}}),
   complete:(state,value)=>rpc('complete_mailbox_incoming',{target_job:job.id,target_state:state,target_kind:value?.kind||null,target_reason:value?.reason||null})
  });
  return json({processed:1,outcome});
 }catch{console.warn('mailbox_incoming_processing_failed');return json({error:'mailbox_processing_unavailable'},503);}
});
