import {mailboxDetectionState} from '../_shared/mailboxDetectionState.ts';
import {gmailConfig,gmailCredentialContext,mailboxTransport} from '../_shared/mailboxTransport.ts';
import {gmailConfigured,gmailAuthorization,exchangeGmail,sealGmail,openGmail,createGmailMailbox} from '../_shared/gmailMailbox.ts';
import { classifyBookingMail } from '../_shared/mailboxClassifier.ts';
import { withMailboxAnalysisBudget } from '../_shared/mailboxAnalysisBudget.ts';
import { withMailboxAnalysisCache } from '../_shared/mailboxAnalysisCache.ts';
import { validateReviewedMailboxDraft } from '../_shared/mailboxBookingDraft.ts';
import { mailboxMessage } from '../_shared/mailboxMessage.ts';
import { createNylasMailbox, mailboxAuthorizationUrl, normalizeMailboxEmail, knownMailboxProvider } from '../_shared/nylasMailbox.ts';
import type { MailboxProvider, NylasConfig } from '../_shared/nylasMailbox.ts';
import { mailboxReturnUrl, mailboxBrowserOrigin } from '../_shared/mailboxReturnUrl.ts';
import { dispatchMailboxBetaNotification } from '../_shared/mailboxBetaNotifications.ts';
const uuid=(value:unknown)=>typeof value==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
async function hash(value:string){return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value))),v=>v.toString(16).padStart(2,'0')).join('');}
type Connection={transport?:'nylas'|'gmail';workspace_id:string;user_id:string;id:string;email:string;provider:MailboxProvider;grant_id:string;status:string;connected_at:string;background_analysis_enabled?:boolean;background_analysis_processor?:string|null;background_analysis_since?:string|null;background_analysis_revision?:string|null};
Deno.serve(async(request:Request)=>{
 const supabaseUrl=Deno.env.get('SUPABASE_URL')||'',serviceKey=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')||'',anonKey=Deno.env.get('SUPABASE_ANON_KEY')||'';
 const returnUrl=Deno.env.get('CUEBOOKER_MAILBOX_RETURN_URL')||'';
 const targetReturnUrl=mailboxReturnUrl(supabaseUrl,returnUrl);
 const browserOrigin=mailboxBrowserOrigin(supabaseUrl,returnUrl);
 const headers={'Access-Control-Allow-Headers':'authorization, apikey, content-type','Access-Control-Allow-Methods':'POST, GET, OPTIONS','Cache-Control':'no-store','Referrer-Policy':'no-referrer','Vary':'Origin',...(browserOrigin?{'Access-Control-Allow-Origin':browserOrigin}:{})};
 const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{...headers,'Content-Type':'application/json'}});
 const origin=request.headers.get('Origin');
 if(origin&&origin!==browserOrigin)return json({error:'origin_not_allowed'},403);
 if(request.method==='OPTIONS')return new Response('ok',{headers});
 const config:NylasConfig={apiUri:Deno.env.get('NYLAS_API_URI')||'https://api.us.nylas.com',apiKey:Deno.env.get('NYLAS_API_KEY')||'',clientId:Deno.env.get('NYLAS_CLIENT_ID')||'',callbackUri:`${supabaseUrl}/functions/v1/connected-mailbox`};
 const gmail=gmailConfig(n=>Deno.env.get(n)),newTransport=Deno.env.get('CUEBOOKER_MAILBOX_TRANSPORT')==='nylas'?'nylas':'gmail';
 const configured=Deno.env.get('CUEBOOKER_MAILBOX_ENABLED')==='true'&&Boolean(targetReturnUrl)&&(newTransport==='gmail'?gmailConfigured(gmail):Boolean(config.apiKey&&config.clientId));
 let action='authentication';
 async function db<T>(path:string,init:RequestInit={}):Promise<T>{
  let response:Response;
  try{response=await fetch(`${supabaseUrl}/rest/v1/${path}`,{...init,headers:{apikey:serviceKey,Authorization:`Bearer ${serviceKey}`,'Content-Type':'application/json',Prefer:'return=representation',...(init.headers||{})},signal:AbortSignal.timeout(10000)});}
  catch(error){if((error as Error).name==='TimeoutError')throw new Error('mailbox_storage_timeout');throw error;}
  if(!response.ok){if(['rpc/ingest_mailbox_thread','rpc/request_mailbox_beta_access'].includes(path)){const failure=await response.json().catch(()=>null);if(['booking_review_stale','archived_booking_read_only','invalid_booking_draft','verified_email_required','beta_request_email_locked','invalid_beta_request'].includes(failure?.message))throw new Error(failure.message);}throw new Error('mailbox_storage_failed');}
  const text=await response.text();return (text?JSON.parse(text):null) as T;
 }
 async function member(workspace:string,user:string){
  const rows=await db<Array<{role:string}>>(`workspace_members?workspace_id=eq.${workspace}&user_id=eq.${user}&select=role&limit=1`);
  if(!rows[0]||!['owner','admin','manager','editor'].includes(rows[0].role))throw new Error('workspace_access_denied');
 }
 function back(status:string){
  if(!targetReturnUrl)throw new Error('invalid_return_url');
  const target=new URL(targetReturnUrl.href);
  target.searchParams.set('mailbox',status);
  return new Response(null,{status:303,headers:{...headers,Location:target.href}});
 }
 if(request.method==='GET'){
  if(!configured)return json({error:'mailbox_not_configured'},503);
  try{
   const params=new URL(request.url).searchParams,state=params.get('state')||'';
   if(!/^[0-9a-f]{64}$/.test(state))return json({error:'invalid_oauth_state'},400);
   if(params.has('error'))return back('cancelled');
   const code=params.get('code');if(!code||code.length>4096)return back('failed');
   // Finish only with the initiating user's authenticated session in Cuebooker.
   // A hosted callback alone must never bind a mailbox to another user's workspace.
   const response=back('authorize'),target=new URL(response.headers.get('Location')!);
   target.hash=new URLSearchParams({mailbox_code:code,mailbox_state:state}).toString();
   return new Response(null,{status:303,headers:{...headers,Location:target.href}});
  }catch{return json({error:'mailbox_connection_failed'},400);}
 }
 if(request.method!=='POST')return json({error:'method_not_allowed'},405);
 try{
  const token=(request.headers.get('Authorization')||'').replace(/^Bearer\s+/i,'').trim();
  if(!token)return json({error:'authentication_required'},401);
  const response=await fetch(`${supabaseUrl}/auth/v1/user`,{headers:{apikey:anonKey,Authorization:`Bearer ${token}`},signal:AbortSignal.timeout(10000)});
  if(!response.ok)return json({error:'authentication_required'},401);
  const user=await response.json();if(!uuid(user?.id))return json({error:'authentication_required'},401);
  let input:any;try{input=await request.json();}catch{return json({error:'invalid_json'},400);}
  if(!uuid(input?.workspaceId))return json({error:'invalid_workspace'},400);
  action=['status','waitlist','complete','recent','thread','classify','import','sync','send','connect','disconnect','background'].includes(input.action)?input.action:'invalid_action';
  const workspace=input.workspaceId,userId=user.id;
  await member(workspace,userId);
  const path=`mailbox_connections?workspace_id=eq.${workspace}&user_id=eq.${userId}`;
  async function beta(action:string,extra:Record<string,unknown>={}){
   return await db<any>('rpc/mailbox_beta_command',{method:'POST',body:JSON.stringify({target_action:action,target_workspace:workspace,target_actor:userId,...extra})});
  }
  if(input.action==='waitlist'){
   const email=normalizeMailboxEmail(input.email||user.email),locale=input.locale==='en'?'en':'es';
   const result=await db<any>('rpc/request_mailbox_beta_access',{method:'POST',body:JSON.stringify({target_workspace:workspace,target_actor:userId,target_email:email,target_locale:locale})});
   // Request survives a delivery outage. Only saved recipients are dispatched.
   let notification:any={notification:'queued'};
   try{notification=await dispatchMailboxBetaNotification(result.notificationId,n=>Deno.env.get(n),db,targetReturnUrl?.href);}catch{}
   return json({waitlisted:result.waitlisted,status:result.status,requestedEmail:result.requestedEmail,...notification});
  }
  // Operator gate stays off until webhook/scheduler and model evaluation are verified.
  const backgroundAvailable=configured&&Deno.env.get('CUEBOOKER_MAILBOX_BACKGROUND_ENABLED')==='true'&&Boolean((newTransport==='gmail'?(Deno.env.get('GMAIL_PUBSUB_TOPIC')&&Deno.env.get('GMAIL_PUBSUB_SUBSCRIPTION')&&Deno.env.get('GMAIL_PUSH_SERVICE_ACCOUNT')):Deno.env.get('NYLAS_WEBHOOK_SECRET'))&&Deno.env.get('MAILBOX_WORKER_SECRET')&&Deno.env.get('GROQ_API_KEY')),backgroundProcessor='groq-gpt-oss-20b-v1';
  async function enableDetection(connectionId:string){
   if(!backgroundAvailable)throw new Error('mailbox_background_unavailable');
   const rows=await db<Connection[]>(`${path}&id=eq.${connectionId}&select=id,status,email,transport,workspace_id,user_id,background_analysis_enabled&limit=1`);
   const row=rows[0];if(!row)throw new Error('connection_not_found');
   if(row.transport==='gmail'){
    const provider=mailboxTransport(row,n=>Deno.env.get(n),db);
    if(!('watch' in provider))throw new Error('mailbox_background_unavailable');
    const registration=await provider.watch(Deno.env.get('GMAIL_PUBSUB_TOPIC')||'');
    return await db('rpc/start_gmail_mailbox_detection',{method:'POST',body:JSON.stringify({target_workspace:workspace,target_actor:userId,target_connection:connectionId,target_history:registration.historyId,target_expires:registration.expiresAt})});
   }
   return await db('rpc/set_mailbox_background_analysis',{method:'POST',body:JSON.stringify({target_workspace:workspace,target_actor:userId,target_connection:connectionId,target_enabled:true,target_processor:backgroundProcessor})});
  }
  if(input.action==='background'){
   if(!uuid(input.connectionId))return json({error:'invalid_connection'},400);
   if(typeof input.enabled!=='boolean'||(input.enabled&&input.processor!==backgroundProcessor))return json({error:'mailbox_background_consent_required'},400);
   if(input.enabled&&!backgroundAvailable)return json({error:'mailbox_background_unavailable'},409);
   const rows=await db<Connection[]>(`${path}&id=eq.${input.connectionId}&select=id,status,email,transport,workspace_id,user_id&limit=1`);
   if(!rows[0])return json({error:'connection_not_found'},404);
   const preference=input.enabled?await enableDetection(input.connectionId):await db('rpc/set_mailbox_background_analysis',{method:'POST',body:JSON.stringify({target_workspace:workspace,target_actor:userId,target_connection:input.connectionId,target_enabled:false,target_processor:null})});
   if(!input.enabled&&rows[0].transport==='gmail'){try{const transport=mailboxTransport(rows[0],n=>Deno.env.get(n),db);if('stop' in transport)await transport.stop();}catch{}}
   return json({background:preference});
  }
  if(input.action==='status'){
   const connections=await db<Connection[]>(`${path}&status=eq.connected&select=id,email,provider,grant_id,status,connected_at,transport,workspace_id,user_id,background_analysis_enabled,background_analysis_processor,background_analysis_since,background_analysis_revision&order=connected_at.desc&limit=5`);
   const safe=await Promise.all(connections.map(async(row)=>{
    let status='unknown';
    if(Deno.env.get('CUEBOOKER_MAILBOX_ENABLED')==='true'){try{const grant=await mailboxTransport(row,n=>Deno.env.get(n),db).grant(row.grant_id);status=grant.status==='valid'?'connected':'reconnect_required';}catch(error){if(['mailbox_reconnect_required','mailbox_not_found'].includes((error as Error).message))status='reconnect_required';}}
    let watch:any=null;
    if(row.transport==='gmail'){const watches=await db<any[]>(`gmail_mailbox_watches?connection_id=eq.${row.id}&select=state,consent_revision,history_id,watch_expires_at,updated_at&limit=1`);watch=watches[0]||null;}
    const jobs=row.background_analysis_revision?await db<Array<{state:string;created_at:string;processing_started_at?:string;retry_reason?:string|null}>>(`mailbox_incoming_jobs?connection_id=eq.${row.id}&consent_revision=eq.${row.background_analysis_revision}&state=in.(pending,processing,failed)&select=state,created_at,processing_started_at,retry_reason&limit=1001`):[];
    const pending=jobs.filter(j=>j.state!=='failed').length;
    // Historical failures remain available for diagnostics but must not keep a healthy connection in warning forever.
    const recentFailureCutoff=Date.now()-2*60*60*1000;
    const failed=jobs.filter(j=>j.state==='failed'&&Number.isFinite(Date.parse(j.created_at))&&Date.parse(j.created_at)>=recentFailureCutoff).length;
    const stalled=jobs.some(j=>j.state==='processing'&&Date.parse(j.processing_started_at||j.created_at)<Date.now()-10*60000);
    const detection=mailboxDetectionState({available:backgroundAvailable,status,enabled:row.background_analysis_enabled===true,revision:row.background_analysis_revision,watch,failed,stalled,delayed:jobs.some(j=>j.retry_reason==='rate_limit'),transport:row.transport});
    return {id:row.id,email:row.email,provider:row.provider,transport:row.transport,status,connectedAt:row.connected_at,background:{state:detection,pending,failed,retrying:jobs.some(j=>j.retry_reason==='rate_limit'),syncState:watch?.state||null,enabled:row.background_analysis_enabled===true,processor:row.background_analysis_processor||null,since:row.background_analysis_since||null}};
   }));
   let linkedConnectionIds:string[]=[];
   let hasLinkedThread=false;
   if(uuid(input.bookingId)){
    const links=await db<Array<{connection_id:string}>>(`mailbox_booking_threads?workspace_id=eq.${workspace}&booking_id=eq.${input.bookingId}&select=connection_id`);
    hasLinkedThread=links.length>0;
    linkedConnectionIds=links.map(l=>l.connection_id).filter(id=>connections.some(c=>c.id===id));
   }
   return json({configured,transport:newTransport,connections:safe,linkedConnectionIds,hasLinkedThread,beta:await beta('status'),background:{available:backgroundAvailable,processor:backgroundProcessor},ai:{provider:'groq',model:'openai/gpt-oss-20b',configured:Boolean(Deno.env.get('GROQ_API_KEY'))}});
  }
  if(!configured&&['connect','complete'].includes(input.action))return json({error:'mailbox_not_configured'},503);
  back('check');
  if(input.action==='complete'){
   const state=String(input.state||''),code=String(input.code||'');
   if(!/^[0-9a-f]{64}$/.test(state)||!code||code.length>4096)return json({error:'invalid_oauth_state'},400);
   const stateHash=await hash(state),pending=await beta('claim',{target_state:stateHash});
   if(pending.error)return json({error:pending.error},400);
   if(pending.transport==='gmail'){
    const stored=await openGmail<string|{verifier:string;backgroundProcessor:string}>(pending.verifier_ciphertext,gmail.encryptionKey,`oauth:${stateHash}`);
    const verifier=typeof stored==='string'?stored:stored.verifier;
    const automaticConsent=typeof stored==='object'&&stored.backgroundProcessor===backgroundProcessor;
    const tokens=await exchangeGmail(gmail,code,verifier);
    const temporary=createGmailMailbox(gmail,{read:async()=>tokens,write:async()=>{},reauth:async()=>{}});
    const grant=await temporary.grant('');
    if(grant.email!==pending.expected_email)return json({error:'account_mismatch'},400);
    await member(workspace,userId);
    const result=await db<{connected:boolean;connectionId:string}>('rpc/complete_gmail_mailbox',{method:'POST',body:JSON.stringify({target_workspace:workspace,target_actor:userId,target_state:stateHash,target_email:grant.email,target_ciphertext:await sealGmail(tokens,gmail.encryptionKey,gmailCredentialContext({workspace_id:workspace,user_id:userId,email:grant.email})),target_access_expires:new Date(tokens.expiresAt).toISOString(),target_reauth_at:new Date(tokens.reauthAt).toISOString()})});
    if(automaticConsent){try{await enableDetection(result.connectionId)}catch{console.warn('mailbox_detection_start_pending');return json({...result,detectionPending:true})}}
    return json(result);
   }
   const provider=createNylasMailbox(config),grantId=await provider.exchange(code),grant=await provider.grant(grantId);
   if(grant.email!==pending.expected_email||grant.provider!==pending.provider)return json({error:'account_mismatch'},400);
   if(grant.status!=='valid')return json({error:'mailbox_reconnect_required'},400);
   await member(workspace,userId);
   const result=await beta('complete',{target_state:stateHash,target_email:grant.email,target_provider:grant.provider,target_grant:grantId});
   return json(result,result.error?409:200);
  }
  if(['recent','thread','classify','import','sync','send'].includes(input.action)){
   if(!uuid(input.connectionId))return json({error:'invalid_connection'},400);
   const rows=await db<Connection[]>(`${path}&id=eq.${input.connectionId}&status=eq.connected&select=id,email,grant_id,provider,status,connected_at,transport,workspace_id,user_id&limit=1`);
   const connection=rows[0];if(!connection)return json({error:'connection_not_found'},404);
   const provider=mailboxTransport(connection,n=>Deno.env.get(n),db);
   async function linkedBooking(threadId?:string){
    if(!uuid(input.bookingId))throw new Error('invalid_booking');
    const links=await db<Array<{thread_id:string}>>(`mailbox_booking_threads?workspace_id=eq.${workspace}&connection_id=eq.${connection.id}&booking_id=eq.${input.bookingId}${threadId?`&thread_id=eq.${encodeURIComponent(threadId)}`:''}&select=thread_id&limit=20`);
    if(!links.length)throw new Error('thread_mailbox_required');
    const bookings=await db<any[]>(`bookings?workspace_id=eq.${workspace}&id=eq.${input.bookingId}&select=id,artist_id,status,archived_at,event_date,start_time,end_time,venue_name,city,offer_amount_minor,currency,event_timezone,updated_at&limit=1`);
    if(!bookings[0])throw new Error('booking_not_found');
    return {links,booking:bookings[0]};
   }
   if(input.action==='thread'){
    const {links,booking}=await linkedBooking();
    // IDs come only from the authenticated owner's existing booking links.
    // Read one bound thread page, never the account-wide recent-mail feed.
    const result=await provider.messages(connection.grant_id,links[0].thread_id);
    const messages=result.messages.map((m:any)=>mailboxMessage(m,connection.email)).filter((m:any)=>m.threadId===links[0].thread_id&&m.from!==connection.email).map((m:any)=>({...m,existingBooking:booking}));
    return json({messages,hasMore:Boolean(result.nextCursor)||links.length>1});
   }
   if(input.action==='classify'&&input.analysisConsent!==true)return json({error:'mailbox_analysis_consent_required'},400);
   if(input.action==='classify'&&input.analysisProvider!=='groq')return json({error:'mailbox_analysis_consent_required'},400);
   if(input.action==='recent'||input.action==='classify'){
    const single=input.action==='classify'&&input.messageId!==undefined;
    if(single&&(typeof input.messageId!=='string'||!input.messageId.trim()||input.messageId.length>512))return json({error:'invalid_message'},400);
    if(input.action==='classify'&&!Deno.env.get('GROQ_API_KEY'))return json({error:'mailbox_ai_not_configured'},503);
    const result=single?{messages:[await provider.message(connection.grant_id,input.messageId)],nextCursor:null}:await provider.messages(connection.grant_id);
    const messages=result.messages.map((m:any)=>mailboxMessage(m,connection.email)).filter((m:any)=>m.from!==connection.email);
    if(input.bookingId!==undefined){
     if(!single||!messages[0])return json({error:'invalid_message'},400);
     await linkedBooking(messages[0].threadId);
    }
    if(input.action==='classify'){
     const cachePath=`mailbox_ai_results?connection_id=eq.${connection.id}`;
     const classifications=await withMailboxAnalysisCache({messages,extractDraft:single,
      read:keys=>db(`${cachePath}&extract_draft=eq.${single}&input_hash=in.(${keys.join(',')})&expires_at=gt.${encodeURIComponent(new Date().toISOString())}&select=input_hash,classification`),
      write:async rows=>{
       await db(`${cachePath}&expires_at=lte.${encodeURIComponent(new Date().toISOString())}`,{method:'DELETE'});
       return db('mailbox_ai_results?on_conflict=connection_id,message_id,extract_draft',{method:'POST',headers:{Prefer:'resolution=merge-duplicates,return=minimal'},body:JSON.stringify(rows.map(row=>({...row,connection_id:connection.id,extract_draft:single,expires_at:new Date(Date.now()+86400000).toISOString()})))});
      },
      run:async missing=>{
     const threshold=encodeURIComponent(new Date(Date.now()-60000).toISOString());
     const claimed=await db<any[]>(`${path}&id=eq.${connection.id}&or=(ai_last_requested_at.is.null,ai_last_requested_at.lt.${threshold})`,{method:'PATCH',body:JSON.stringify({ai_last_requested_at:new Date().toISOString()})});
     if(!claimed.length)throw new Error('mailbox_analysis_rate_limit');
     const requestId=crypto.randomUUID();
     const budgetContext={target_workspace:workspace,target_actor:userId,target_connection:connection.id,target_request:requestId};
     return await withMailboxAnalysisBudget({
      reserve:()=>db<any>('rpc/reserve_mailbox_analysis',{method:'POST',body:JSON.stringify(budgetContext)}),
      complete:(outcome,usage)=>db('rpc/complete_mailbox_analysis',{method:'POST',body:JSON.stringify({...budgetContext,target_outcome:outcome,target_input_tokens:usage.inputTokens,target_output_tokens:usage.outputTokens})}),
      run:report=>classifyBookingMail(missing,Deno.env.get('GROQ_API_KEY')||'',fetch,single,report)
     });
      }
     });
     let existingBooking:any=null;
     if(single&&messages[0]){
      const links=await db<Array<{booking_id:string}>>(`mailbox_booking_threads?workspace_id=eq.${workspace}&connection_id=eq.${connection.id}&thread_id=eq.${encodeURIComponent(messages[0].threadId)}&select=booking_id&limit=1`);
      if(links[0]){const saved=await db<any[]>(`bookings?workspace_id=eq.${workspace}&id=eq.${links[0].booking_id}&select=id,artist_id,status,event_date,start_time,end_time,venue_name,city,offer_amount_minor,currency,event_timezone,updated_at&limit=1`);existingBooking=saved[0]||null;}
     }
     return json({messages:messages.map((m:any)=>({...m,classification:classifications.find(c=>c.id===m.id),...(single?{existingBooking}:{})})),hasMore:Boolean(result.nextCursor)});
    }
    let detected:Array<{message_id:string;classification_kind:string;classification_reason:string;booking_id:string|null}>=[];
    try{detected=await db(`mailbox_incoming_jobs?connection_id=eq.${connection.id}&state=eq.completed&select=message_id,classification_kind,classification_reason,booking_id&order=created_at.desc&limit=100`)}catch{console.warn('mailbox_detection_metadata_unavailable');}
    return json({messages:messages.map((message:any)=>{const saved=detected.find(row=>row.message_id===message.id);return saved?{...message,bookingId:saved.booking_id,classification:{id:message.id,kind:saved.classification_kind,reason:saved.classification_reason}}:message}),hasMore:Boolean(result.nextCursor)});
   }
   const bookingId=input.bookingId;
   if(bookingId&&!uuid(bookingId))return json({error:'invalid_booking'},400);
   let booking:any;
   if(bookingId){
    const bookings=await db<any[]>(`bookings?workspace_id=eq.${workspace}&id=eq.${bookingId}&select=id,primary_contact_id,archived_at&limit=1`);
    booking=bookings[0];if(!booking)return json({error:'booking_not_found'},404);
    if(booking.archived_at)return json({error:'archived_booking_read_only'},409);
   }
   async function ingest(threadId:string,messages:any[],artistId?:string){
    return await db<string>('rpc/ingest_mailbox_thread',{method:'POST',body:JSON.stringify({target_connection:connection.id,target_actor:userId,target_thread:threadId,target_messages:messages,target_artist:artistId||null,target_booking:bookingId||null})});
   }
   if(input.action==='import'){
    if(!bookingId&&!uuid(input.artistId))return json({error:'artist_required'},400);
    if(typeof input.messageId!=='string'||input.messageId.length>512)return json({error:'invalid_message'},400);
    const reviewed=input.reviewedDraft===undefined?null:validateReviewedMailboxDraft(input.reviewedDraft);
    if(input.applyReviewedToExisting!==undefined&&typeof input.applyReviewedToExisting!=='boolean')return json({error:'invalid_booking_draft'},400);
    if(input.applyReviewedToExisting===true&&(!reviewed||typeof input.expectedUpdatedAt!=='string'||input.expectedUpdatedAt.length>60||!Number.isFinite(Date.parse(input.expectedUpdatedAt))))return json({error:'invalid_booking_draft'},400);
    const message={...mailboxMessage(await provider.message(connection.grant_id,input.messageId),connection.email),...(reviewed?{reviewedDetails:reviewed,applyReviewedToExisting:input.applyReviewedToExisting===true,expectedUpdatedAt:input.expectedUpdatedAt}:{})};
    const id=await ingest(message.threadId,[message],input.artistId);
    return json({bookingId:id});
   }
   if(!booking)return json({error:'invalid_booking'},400);
   const links=await db<any[]>(`mailbox_booking_threads?connection_id=eq.${connection.id}&workspace_id=eq.${workspace}&booking_id=eq.${bookingId}&select=thread_id&limit=20`);
   if(input.action==='sync'){
    let partial=false;
    for(const link of links){
     let cursor:string|undefined;
     for(let page=0;page<5;page++){
      const result=await provider.messages(connection.grant_id,link.thread_id,cursor);
      if(result.messages.length)await ingest(link.thread_id,result.messages.map((m:any)=>mailboxMessage(m,connection.email)));
      cursor=result.nextCursor||undefined;
      if(!cursor)break;
     }
     if(cursor)partial=true;
    }
    return json({synced:true,partial});
   }
   if(!uuid(input.requestId)||typeof input.subject!=='string'||typeof input.bodyText!=='string'||!input.subject.trim()||!input.bodyText.trim()||input.subject.length>300||input.bodyText.length>20000)return json({error:'invalid_email_content'},400);
   const allLinks=await db<any[]>(`mailbox_booking_threads?workspace_id=eq.${workspace}&booking_id=eq.${bookingId}&select=connection_id&limit=1`);
   if(allLinks.length&&!links.length)return json({error:'thread_mailbox_required'},409);
   const contacts=await db<any[]>(`contacts?workspace_id=eq.${workspace}&id=eq.${booking.primary_contact_id}&select=email&limit=1`);
   const to=contacts[0]?.email;if(!to)return json({error:'contact_email_required'},400);
   // The request key is claimed before external delivery. A timeout is ambiguous,
   // therefore repeating this key never issues another provider send.
   const previous=await db<any[]>(`mailbox_send_attempts?id=eq.${input.requestId}&select=id,user_id,state,provider_message_id&limit=1`);
   if(previous.length)return json({error:'email_send_already_attempted'},409);
   await db('mailbox_send_attempts',{method:'POST',body:JSON.stringify({id:input.requestId,connection_id:connection.id,workspace_id:workspace,booking_id:bookingId,user_id:userId})});
   try{
    let replyId:string|undefined;
    if(links.length){
     const thread=await provider.messages(connection.grant_id,links[0].thread_id);
     const candidates=thread.messages.filter((m:any)=>m.from?.[0]?.email?.toLowerCase()===to.toLowerCase()||(m.from?.[0]?.email?.toLowerCase()===connection.email&&m.to?.some((r:any)=>r.email?.toLowerCase()===to.toLowerCase()))).sort((a:any,b:any)=>b.date-a.date);
     if(!candidates[0])return json({error:'thread_recipient_mismatch'},409);
     replyId=candidates[0].id;
    }
    const sent=await provider.send(connection.grant_id,{to,subject:input.subject.trim(),bodyText:input.bodyText.trim(),replyToMessageId:replyId});
    const message=mailboxMessage({...sent,from:[{email:connection.email}],to:[{email:to}],subject:sent.subject||input.subject.trim(),body:input.bodyText.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'),date:sent.date||Math.floor(Date.now()/1000)},connection.email);
    await ingest(message.threadId,[message]);
    await db(`mailbox_send_attempts?id=eq.${input.requestId}`,{method:'PATCH',body:JSON.stringify({state:'sent',provider_message_id:message.id})});
    return json({id:input.requestId,status:'sent',to,providerMessageId:message.id,from:connection.email});
   }catch{
    await db(`mailbox_send_attempts?id=eq.${input.requestId}`,{method:'PATCH',body:JSON.stringify({state:'uncertain'})});
    return json({error:'email_send_uncertain'},409);
   }
  }
  if(input.action==='connect'){
   const email=normalizeMailboxEmail(input.email),selection=input.provider||'auto';
   if(input.backgroundProcessor!==undefined&&(newTransport!=='gmail'||input.backgroundProcessor!==backgroundProcessor||!backgroundAvailable))return json({error:'mailbox_background_unavailable'},409);
   if(!['auto','google','microsoft','imap'].includes(selection))return json({error:'invalid_provider'},400);
   if(newTransport==='gmail'&&!['auto','google'].includes(selection))return json({error:'invalid_provider'},400);
   let provider:MailboxProvider=newTransport==='gmail'?'google':selection==='auto'?(knownMailboxProvider(email)||'imap'):selection;
   const existing=await db<Connection[]>(`${path}&status=eq.connected&select=id,email&limit=5`);
   if(existing.length>=5&&!existing.some(row=>row.email===email))return json({error:'mailbox_limit'},409);
   const state=Array.from(crypto.getRandomValues(new Uint8Array(32)),v=>v.toString(16).padStart(2,'0')).join('');
   const stateHash=await hash(state),reserved=await beta('reserve',{target_email:email,target_provider:provider,target_state:stateHash});
   if(reserved.error)return json({error:reserved.error},reserved.error==='mailbox_attempt_limit'?429:409);
   try{
    if(newTransport==='gmail'){
     const auth=await gmailAuthorization(gmail,email,state);
     await db(`mailbox_oauth_states?state_hash=eq.${stateHash}&workspace_id=eq.${workspace}&user_id=eq.${userId}`,{method:'PATCH',body:JSON.stringify({transport:'gmail',verifier_ciphertext:await sealGmail(input.backgroundProcessor?{verifier:auth.verifier,backgroundProcessor}:auth.verifier,gmail.encryptionKey,`oauth:${stateHash}`)})});
     return json({authorizationUrl:auth.url});
    }
    if(selection==='auto'&&!knownMailboxProvider(email)){
     const detected=await createNylasMailbox(config).detect(email);
     if(!detected)throw new Error('mailbox_provider_selection_required');
     provider=detected;
     await db(`mailbox_oauth_states?state_hash=eq.${stateHash}&workspace_id=eq.${workspace}&user_id=eq.${userId}`,{method:'PATCH',body:JSON.stringify({provider})});
    }
    return json({authorizationUrl:mailboxAuthorizationUrl(config,{email,provider,state})});
   }catch(error){
    await db(`mailbox_oauth_states?state_hash=eq.${stateHash}&workspace_id=eq.${workspace}&user_id=eq.${userId}`,{method:'DELETE'});
    throw error;
   }
  }
  if(input.action==='disconnect'){
   if(!uuid(input.connectionId))return json({error:'invalid_connection'},400);
   const rows=await db<Connection[]>(`${path}&id=eq.${input.connectionId}&select=id,grant_id,status,email,transport,workspace_id,user_id&limit=1`);
   if(!rows[0])return json({error:'connection_not_found'},404);
   if(rows[0].status==='connected'){
    await db('rpc/set_mailbox_background_analysis',{method:'POST',body:JSON.stringify({target_workspace:workspace,target_actor:userId,target_connection:input.connectionId,target_enabled:false,target_processor:null})});
    try{await mailboxTransport(rows[0],n=>Deno.env.get(n),db).disconnect(rows[0].grant_id);}catch(error){if((error as Error).message!=='mailbox_not_found')throw error;}
    await db(`${path}&id=eq.${input.connectionId}`,{method:'PATCH',body:JSON.stringify({status:'disconnected'})});
   }
   if(rows[0].transport==='gmail')await db(`gmail_mailbox_credentials?connection_id=eq.${rows[0].id}`,{method:'DELETE'});
   return json({disconnected:true});
  }
  return json({error:'invalid_action'},400);
 }catch(error){
  const name=(error as Error).name==='TimeoutError'?'mailbox_request_timeout':(error as Error).message;
  const allowed=['mailbox_provider_selection_required','mailbox_beta_full','workspace_access_denied','invalid_email','invalid_provider','invalid_provider_configuration','invalid_callback','invalid_return_url','mailbox_reconnect_required','mailbox_not_found','mailbox_provider_unavailable','mailbox_not_configured','invalid_oauth_state','account_mismatch','connection_not_found','invalid_message','artist_required','archived_booking_read_only','mailbox_analysis_consent_required','mailbox_ai_not_configured','mailbox_ai_unavailable','invalid_classification','mailbox_analysis_rate_limit','mailbox_ai_rate_limit','mailbox_ai_quota_exhausted','mailbox_background_unavailable'];
  allowed.push('mailbox_request_timeout','mailbox_storage_timeout','mailbox_provider_timeout','mailbox_ai_quota_exhausted','mailbox_ai_rate_limit','invalid_booking_draft','booking_time_requires_date','booking_currency_required','booking_review_stale','invalid_booking','booking_not_found','thread_mailbox_required');
  allowed.push('mailbox_ai_budget_exhausted','mailbox_analysis_already_attempted');
  allowed.push('mailbox_scopes_required','mailbox_credentials_unavailable');
  allowed.push('verified_email_required','beta_request_email_locked','invalid_beta_request','mailbox_beta_approval_required','mailbox_beta_email_not_approved');
  console.warn('connected_mailbox_error',allowed.includes(name)?name:'mailbox_operation_failed',action);
  return json({error:allowed.includes(name)?name:'mailbox_operation_failed'},name==='workspace_access_denied'?403:name==='mailbox_analysis_rate_limit'?429:400);
 }
});
