import { classifyBookingMail } from '../_shared/mailboxClassifier.ts';
import { mailboxMessage } from '../_shared/mailboxMessage.ts';
import { createNylasMailbox, mailboxAuthorizationUrl, normalizeMailboxEmail, knownMailboxProvider } from '../_shared/nylasMailbox.ts';
import type { MailboxProvider, NylasConfig } from '../_shared/nylasMailbox.ts';
const headers={'Access-Control-Allow-Origin':'https://pr-96.cuebooker-staging.pages.dev','Access-Control-Allow-Headers':'authorization, apikey, content-type','Access-Control-Allow-Methods':'POST, GET, OPTIONS','Cache-Control':'no-store','Referrer-Policy':'no-referrer'};
const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{...headers,'Content-Type':'application/json'}});
const uuid=(value:unknown)=>typeof value==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
async function hash(value:string){return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value))),v=>v.toString(16).padStart(2,'0')).join('');}
type Connection={id:string;email:string;provider:MailboxProvider;grant_id:string;status:string;connected_at:string};
Deno.serve(async(request:Request)=>{
 if(request.method==='OPTIONS')return new Response('ok',{headers});
 const supabaseUrl=Deno.env.get('SUPABASE_URL')||'',serviceKey=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')||'',anonKey=Deno.env.get('SUPABASE_ANON_KEY')||'';
 const config:NylasConfig={apiUri:Deno.env.get('NYLAS_API_URI')||'https://api.us.nylas.com',apiKey:Deno.env.get('NYLAS_API_KEY')||'',clientId:Deno.env.get('NYLAS_CLIENT_ID')||'',callbackUri:`${supabaseUrl}/functions/v1/connected-mailbox`};
 const returnUrl=Deno.env.get('CUEBOOKER_MAILBOX_RETURN_URL')||'';
 const configured=Deno.env.get('CUEBOOKER_MAILBOX_ENABLED')==='true'&&Boolean(config.apiKey&&config.clientId&&returnUrl);
 let action='authentication';
 async function db<T>(path:string,init:RequestInit={}):Promise<T>{
  let response:Response;
  try{response=await fetch(`${supabaseUrl}/rest/v1/${path}`,{...init,headers:{apikey:serviceKey,Authorization:`Bearer ${serviceKey}`,'Content-Type':'application/json',Prefer:'return=representation',...(init.headers||{})},signal:AbortSignal.timeout(10000)});}
  catch(error){if((error as Error).name==='TimeoutError')throw new Error('mailbox_storage_timeout');throw error;}
  if(!response.ok)throw new Error('mailbox_storage_failed');
  const text=await response.text();return (text?JSON.parse(text):null) as T;
 }
 async function member(workspace:string,user:string){
  const rows=await db<Array<{role:string}>>(`workspace_members?workspace_id=eq.${workspace}&user_id=eq.${user}&select=role&limit=1`);
  if(!rows[0]||!['owner','admin','manager','editor'].includes(rows[0].role))throw new Error('workspace_access_denied');
 }
 function back(status:string){
  const target=new URL(returnUrl);
  if(target.origin!=='https://pr-96.cuebooker-staging.pages.dev'||target.pathname!=='/workspace/'||target.search||target.hash)throw new Error('invalid_return_url');
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
  let input;try{input=await request.json();}catch{return json({error:'invalid_json'},400);}
  if(!uuid(input?.workspaceId))return json({error:'invalid_workspace'},400);
  action=['status','waitlist','complete','recent','classify','import','sync','send','connect','disconnect'].includes(input.action)?input.action:'invalid_action';
  const workspace=input.workspaceId,userId=user.id;
  await member(workspace,userId);
  const path=`mailbox_connections?workspace_id=eq.${workspace}&user_id=eq.${userId}`;
  async function beta(action:string,extra:Record<string,unknown>={}){
   return await db<any>('rpc/mailbox_beta_command',{method:'POST',body:JSON.stringify({target_action:action,target_workspace:workspace,target_actor:userId,...extra})});
  }
  if(input.action==='waitlist')return json(await beta('waitlist'));
  if(input.action==='status'){
   const connections=await db<Connection[]>(`${path}&status=eq.connected&select=id,email,provider,grant_id,status,connected_at&order=connected_at.desc&limit=5`);
   const safe=await Promise.all(connections.map(async(row)=>{
    let status='unknown';
    if(configured){try{const grant=await createNylasMailbox(config).grant(row.grant_id);status=grant.status==='valid'?'connected':'reconnect_required';}catch(error){if(['mailbox_reconnect_required','mailbox_not_found'].includes((error as Error).message))status='reconnect_required';}}
    return {id:row.id,email:row.email,provider:row.provider,status,connectedAt:row.connected_at};
   }));
   let linkedConnectionIds:string[]=[];
   let hasLinkedThread=false;
   if(uuid(input.bookingId)){
    const links=await db<Array<{connection_id:string}>>(`mailbox_booking_threads?workspace_id=eq.${workspace}&booking_id=eq.${input.bookingId}&select=connection_id`);
    hasLinkedThread=links.length>0;
    linkedConnectionIds=links.map(l=>l.connection_id).filter(id=>connections.some(c=>c.id===id));
   }
   return json({configured,connections:safe,linkedConnectionIds,hasLinkedThread,beta:await beta('status')});
  }
  if(!configured)return json({error:'mailbox_not_configured'},503);
  back('check');
  if(input.action==='complete'){
   const state=String(input.state||''),code=String(input.code||'');
   if(!/^[0-9a-f]{64}$/.test(state)||!code||code.length>4096)return json({error:'invalid_oauth_state'},400);
   const stateHash=await hash(state),pending=await beta('claim',{target_state:stateHash});
   if(pending.error)return json({error:pending.error},400);
   const provider=createNylasMailbox(config),grantId=await provider.exchange(code),grant=await provider.grant(grantId);
   if(grant.email!==pending.expected_email||grant.provider!==pending.provider)return json({error:'account_mismatch'},400);
   if(grant.status!=='valid')return json({error:'mailbox_reconnect_required'},400);
   await member(workspace,userId);
   const result=await beta('complete',{target_state:stateHash,target_email:grant.email,target_provider:grant.provider,target_grant:grantId});
   return json(result,result.error?409:200);
  }
  if(['recent','classify','import','sync','send'].includes(input.action)){
   if(!uuid(input.connectionId))return json({error:'invalid_connection'},400);
   const rows=await db<Connection[]>(`${path}&id=eq.${input.connectionId}&status=eq.connected&select=id,email,grant_id,provider,status,connected_at&limit=1`);
   const connection=rows[0];if(!connection)return json({error:'connection_not_found'},404);
   const provider=createNylasMailbox(config);
   if(input.action==='classify'&&input.analysisConsent!==true)return json({error:'mailbox_analysis_consent_required'},400);
   if(input.action==='recent'||input.action==='classify'){
    const single=input.action==='classify'&&input.messageId!==undefined;
    if(single&&(typeof input.messageId!=='string'||!input.messageId.trim()||input.messageId.length>512))return json({error:'invalid_message'},400);
    const result=single?{messages:[await provider.message(connection.grant_id,input.messageId)],nextCursor:null}:await provider.messages(connection.grant_id);
    const messages=result.messages.map((m:any)=>mailboxMessage(m,connection.email)).filter((m:any)=>m.from!==connection.email);
    if(input.action==='classify'){
     const threshold=encodeURIComponent(new Date(Date.now()-60000).toISOString());
     const claimed=await db<any[]>(`${path}&id=eq.${connection.id}&or=(ai_last_requested_at.is.null,ai_last_requested_at.lt.${threshold})`,{method:'PATCH',body:JSON.stringify({ai_last_requested_at:new Date().toISOString()})});
     if(!claimed.length)return json({error:'mailbox_analysis_rate_limit'},429);
     const classifications=await classifyBookingMail(messages,Deno.env.get('OPENAI_API_KEY')||'');
     return json({messages:messages.map((m:any)=>({...m,classification:classifications.find(c=>c.id===m.id)})),hasMore:Boolean(result.nextCursor)});
    }
    return json({messages,hasMore:Boolean(result.nextCursor)});
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
    const message=mailboxMessage(await provider.message(connection.grant_id,input.messageId),connection.email);
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
    const message=mailboxMessage({...sent,from:[{email:connection.email}],to:[{email:to}],subject:input.subject.trim(),body:input.bodyText.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'),date:sent.date||Math.floor(Date.now()/1000)},connection.email);
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
   if(!['auto','google','microsoft','imap'].includes(selection))return json({error:'invalid_provider'},400);
   let provider:MailboxProvider=selection==='auto'?(knownMailboxProvider(email)||'imap'):selection;
   const existing=await db<Connection[]>(`${path}&status=eq.connected&select=id,email&limit=5`);
   if(existing.length>=5&&!existing.some(row=>row.email===email))return json({error:'mailbox_limit'},409);
   const state=Array.from(crypto.getRandomValues(new Uint8Array(32)),v=>v.toString(16).padStart(2,'0')).join('');
   const stateHash=await hash(state),reserved=await beta('reserve',{target_email:email,target_provider:provider,target_state:stateHash});
   if(reserved.error)return json({error:reserved.error},reserved.error==='mailbox_attempt_limit'?429:409);
   try{
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
   const rows=await db<Connection[]>(`${path}&id=eq.${input.connectionId}&select=id,grant_id,status&limit=1`);
   if(!rows[0])return json({error:'connection_not_found'},404);
   if(rows[0].status==='connected'){
    try{await createNylasMailbox(config).disconnect(rows[0].grant_id);}catch(error){if((error as Error).message!=='mailbox_not_found')throw error;}
    await db(`${path}&id=eq.${input.connectionId}`,{method:'PATCH',body:JSON.stringify({status:'disconnected'})});
   }
   return json({disconnected:true});
  }
  return json({error:'invalid_action'},400);
 }catch(error){
  const name=(error as Error).name==='TimeoutError'?'mailbox_request_timeout':(error as Error).message;
  const allowed=['mailbox_provider_selection_required','mailbox_beta_full','workspace_access_denied','invalid_email','invalid_provider','invalid_provider_configuration','invalid_callback','invalid_return_url','mailbox_reconnect_required','mailbox_not_found','mailbox_provider_unavailable','mailbox_not_configured','invalid_oauth_state','account_mismatch','connection_not_found','invalid_message','artist_required','archived_booking_read_only','mailbox_analysis_consent_required','mailbox_ai_not_configured','mailbox_ai_unavailable','invalid_classification','mailbox_analysis_rate_limit'];
  allowed.push('mailbox_request_timeout','mailbox_storage_timeout','mailbox_provider_timeout','mailbox_ai_quota_exhausted','mailbox_ai_rate_limit');
  console.warn('connected_mailbox_error',allowed.includes(name)?name:'mailbox_operation_failed',action);
  return json({error:allowed.includes(name)?name:'mailbox_operation_failed'},name==='workspace_access_denied'?403:400);
 }
});
