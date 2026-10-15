import {mailboxMessage} from './mailboxMessage.ts';
import type {BookingMailClassification} from './mailboxClassifier.ts';
import {mailboxPreFilter} from './mailboxPreFilter.ts';
import type {MailboxReplyLink} from './mailboxReplyLink.ts';
type Job={id:string;connectionId:string;workspaceId:string;actorId:string;grantId:string;email:string;messageId:string;threadId:string;since:string};
export async function processMailboxIncoming(job:Job,options:{authorize:()=>Promise<boolean>;message:()=>Promise<any>;inbox:()=>Promise<{inbox:string[];excluded:string[]}>;linkedBooking:(raw:any)=>Promise<MailboxReplyLink>;sync:(bookingId:string,message:ReturnType<typeof mailboxMessage>)=>Promise<unknown>;classify:(message:ReturnType<typeof mailboxMessage>)=>Promise<BookingMailClassification>;create:(message:ReturnType<typeof mailboxMessage>,classification:BookingMailClassification)=>Promise<unknown>;saveAttachments?:(raw:any,bookingId:string)=>Promise<void>;retry?:()=>Promise<boolean>;complete:(state:'completed'|'ignored'|'failed',classification?:BookingMailClassification,failureStage?:string)=>Promise<unknown>}){
 let stage='authorization';
 try{
  if(!await options.authorize()){await options.complete('ignored');return 'ignored';}
  stage='provider_read';
  const raw=await options.message(),message=mailboxMessage(raw,job.email);
  if(message.id!==job.messageId||message.threadId!==job.threadId||message.from===job.email||Date.parse(message.date)<Date.parse(job.since)){await options.complete('ignored');return 'ignored';}
  // Provider folder IDs are opaque. Accept only a resolved inbox, never guess IDs/names.
  stage='inbox_check';
  const folders=await options.inbox();
  if(!Array.isArray(raw.folders)||!folders.inbox.length||raw.folders.some((id:unknown)=>typeof id==='string'&&folders.excluded.includes(id))||!raw.folders.some((id:unknown)=>typeof id==='string'&&folders.inbox.includes(id))){await options.complete('ignored');return 'ignored';}
  stage='reply_matching';
  const bookingId=await options.linkedBooking(raw);
  if(!await options.authorize()){await options.complete('ignored');return 'ignored';}
  if(typeof bookingId==='string'){stage='conversation_sync';await options.sync(bookingId,message);await options.complete('ignored');return 'synced';}
  if(bookingId?.review){await options.complete('completed',{id:message.id,kind:'review',reason:'Respuesta sin una relación única con una solicitud guardada. Revisa la conversación.'});return 'review';}
  const filtered=mailboxPreFilter(raw,message.id);
  if(filtered){await options.complete('completed',filtered);return 'filtered';}
  stage='classification';
  const classification=await options.classify(message);
  if(!await options.authorize()){await options.complete('ignored');return 'ignored';}
  if(classification.kind==='booking'){
   if(!classification.draft)throw new Error('missing_booking_draft');
   stage='booking_creation';
   const created=await options.create(message,classification);
   if(typeof created==='string'&&options.saveAttachments){
    try{await options.saveAttachments(raw,created);}catch{console.warn('mailbox_attachment_processing_failed');}
   }
   return 'created';
  }
  stage='completion';
  await options.complete('completed',classification);return 'classified';
 }catch(error){
  if(error instanceof Error&&error.message==='mailbox_ai_rate_limit'&&options.retry&&await options.retry())return 'deferred';
  // No automatic retry after an uncertain AI/provider attempt. Operator review is required.
  // Store only a fixed phase name; never persist raw provider errors or email contents.
  const safeClassifyCodes=['mailbox_ai_quota_exhausted','mailbox_ai_unavailable','mailbox_ai_not_configured','invalid_classification','missing_booking_draft','mailbox_ai_request_too_large','mailbox_ai_rate_limit'];
  const code=error instanceof Error?error.message:'';
  const diagnostic=stage;
  await options.complete('failed',undefined,diagnostic);return 'failed';
 }
}
