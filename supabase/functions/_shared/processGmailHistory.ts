export async function processGmailHistory(input:{connection:any;watch:any;topic:string},deps:{authorized:()=>Promise<boolean>;provider:any;enqueue:(message:any)=>Promise<{accepted?:boolean;error?:string}>;save:(patch:Record<string,unknown>)=>Promise<void>}){
 const {watch,connection}=input;
 if(!await deps.authorized())return 'revoked';
 try{
  let current=watch.history_id;
  if(!current){
   const registration=await deps.provider.watch(input.topic);
   if(!await deps.authorized())return 'revoked';
   await deps.save({history_id:registration.historyId,watch_expires_at:registration.expiresAt,consent_revision:connection.background_analysis_revision});return 'watch_started';
  }
  // Drain to the final history page before moving the saved cursor. Retries use
  // message IDs to deduplicate against the existing incoming-job table.
  let pageToken:string|undefined,last=current;
  for(let page=0;page<5;page++){
   if(!await deps.authorized())return 'revoked';
   const history=await deps.provider.history(current,pageToken);
   if(!/^\d{1,30}$/.test(String(history.historyId)))throw new Error('invalid_provider_response');
   last=String(history.historyId);
   const ids=new Set<string>();
   for(const entry of history.history||[])for(const added of entry.messagesAdded||[]){if(typeof added.message?.id==='string')ids.add(added.message.id);}
   for(const id of ids){
    if(!await deps.authorized())return 'revoked';
    let message;try{message=await deps.provider.message(connection.grant_id,id);}catch(error){if(['mailbox_not_found','mailbox_history_backlog'].includes((error as Error).message))continue;throw error;}
    if(!message.folders.includes('INBOX')||message.folders.some((v:string)=>['SPAM','TRASH','SENT','DRAFT'].includes(v))||message.from?.[0]?.email===connection.email||message.date*1000<new Date(connection.background_analysis_since).getTime())continue;
    const queued=await deps.enqueue(message);if(queued.error)throw new Error('mailbox_incoming_queue_full');
   }
   pageToken=history.nextPageToken;if(!pageToken)break;
  }
  if(pageToken)throw new Error('mailbox_history_backlog');
  if(!await deps.authorized())return 'revoked';
  const patch:Record<string,unknown>={history_id:last};
  if(!watch.watch_expires_at||new Date(watch.watch_expires_at).getTime()<Date.now()+86400000){const renewed=await deps.provider.watch(input.topic);patch.watch_expires_at=renewed.expiresAt;}
  await deps.save(patch);return 'synced';
 }catch(error){if(['mailbox_not_found','mailbox_history_backlog'].includes((error as Error).message)){await deps.save({state:'resync_required'});return 'resync_required';}throw error;}
}
