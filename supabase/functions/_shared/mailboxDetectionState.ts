export type MailboxDetectionState='inactive'|'unavailable'|'starting'|'active'|'paused'|'reconnect_required';
export function mailboxDetectionState(input:{available:boolean;status:string;enabled:boolean;revision?:string|null;watch?:{state:string;consent_revision?:string|null;history_id?:string|null;watch_expires_at?:string|null;updated_at?:string};failed:number;stalled?:boolean;delayed?:boolean;transport?:string;now?:number}):MailboxDetectionState{
 if(input.status==='reconnect_required')return 'reconnect_required';
 if(input.status!=='connected')return 'paused';
 if(!input.available)return 'unavailable';
 if(!input.enabled)return 'inactive';
 if(input.failed>0||input.stalled||input.delayed)return 'paused';
 if(input.transport!=='gmail')return 'active';
 const w=input.watch,now=input.now??Date.now();
 if(w?.state==='resync_required')return 'paused';
 if(!w||!w.history_id||w.consent_revision!==input.revision||!w.watch_expires_at)return 'starting';
 if(!Number.isFinite(Date.parse(w.watch_expires_at))||Date.parse(w.watch_expires_at)<=now||!w.updated_at||!Number.isFinite(Date.parse(w.updated_at))||Date.parse(w.updated_at)<now-90*60000)return 'paused';
 return 'active';
}
