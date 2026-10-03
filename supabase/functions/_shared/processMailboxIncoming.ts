import {mailboxMessage} from './mailboxMessage.ts';
import type {BookingMailClassification} from './mailboxClassifier.ts';
type Job={id:string;connectionId:string;workspaceId:string;actorId:string;grantId:string;email:string;messageId:string;threadId:string;since:string};
export async function processMailboxIncoming(job:Job,options:{authorize:()=>Promise<boolean>;message:()=>Promise<any>;inbox:()=>Promise<{inbox:string[];excluded:string[]}>;linkedBooking:()=>Promise<string|null>;sync:(bookingId:string,message:ReturnType<typeof mailboxMessage>)=>Promise<unknown>;classify:(message:ReturnType<typeof mailboxMessage>)=>Promise<BookingMailClassification>;create:(message:ReturnType<typeof mailboxMessage>,classification:BookingMailClassification)=>Promise<unknown>;complete:(state:'completed'|'ignored'|'failed',classification?:BookingMailClassification)=>Promise<unknown>}){
 try{
  if(!await options.authorize()){await options.complete('ignored');return 'ignored';}
  const raw=await options.message(),message=mailboxMessage(raw,job.email);
  if(message.id!==job.messageId||message.threadId!==job.threadId||message.from===job.email||Date.parse(message.date)<Date.parse(job.since)){await options.complete('ignored');return 'ignored';}
  // Provider folder IDs are opaque. Accept only a resolved inbox, never guess IDs/names.
  const folders=await options.inbox();
  if(!Array.isArray(raw.folders)||!folders.inbox.length||raw.folders.some((id:unknown)=>typeof id==='string'&&folders.excluded.includes(id))||!raw.folders.some((id:unknown)=>typeof id==='string'&&folders.inbox.includes(id))){await options.complete('ignored');return 'ignored';}
  const bookingId=await options.linkedBooking();
  if(!await options.authorize()){await options.complete('ignored');return 'ignored';}
  if(bookingId){await options.sync(bookingId,message);await options.complete('ignored');return 'synced';}
  const classification=await options.classify(message);
  if(!await options.authorize()){await options.complete('ignored');return 'ignored';}
  if(classification.kind==='booking'){
   if(!classification.draft)throw new Error('missing_booking_draft');
   await options.create(message,classification);return 'created';
  }
  await options.complete('completed',classification);return 'classified';
 }catch{
  // No automatic retry after an uncertain AI/provider attempt. Operator review is required.
  await options.complete('failed');return 'failed';
 }
}
