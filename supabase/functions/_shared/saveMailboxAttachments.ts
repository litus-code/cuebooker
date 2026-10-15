export type MailboxAttachmentReport={stored:number;alreadyStored:number;skipped:number;failed:number;blocked:boolean};
export type MailboxAttachment={id:string;name:string;mime:string;size:number};
const limit=5*1024*1024;
export function mailboxAttachmentMime(bytes:Uint8Array){
 if(bytes.length>=5&&String.fromCharCode(...bytes.slice(0,5))==='%PDF-')return 'application/pdf';
 if(bytes.length>=8&&[137,80,78,71,13,10,26,10].every((byte,index)=>bytes[index]===byte))return 'image/png';
 if(bytes.length>=3&&bytes[0]===255&&bytes[1]===216&&bytes[2]===255)return 'image/jpeg';
 return '';
}
// File work is separate from booking creation. A partial failure must never replay
// classification/creation, and another file may still be saved successfully.
export async function saveMailboxAttachments(options:{
 attachments:unknown;
 authorize:()=>Promise<boolean>;
 existing:(index:number)=>Promise<boolean>;
 download:(item:MailboxAttachment)=>Promise<Uint8Array>;
 upload:(index:number,item:MailboxAttachment,bytes:Uint8Array)=>Promise<void>;
 record:(index:number,item:MailboxAttachment,bytes:Uint8Array)=>Promise<void>;
}){
 const report:MailboxAttachmentReport={stored:0,alreadyStored:0,skipped:0,failed:0,blocked:false};
 if(!Array.isArray(options.attachments))return report;
 for(const [index,value] of options.attachments.slice(0,10).entries()){
  const item=value as MailboxAttachment;
  if(!item||typeof item.id!=='string'||!item.id||!Number.isSafeInteger(item.size)||item.size<1||item.size>limit||!['application/pdf','image/png','image/jpeg'].includes(item.mime)){
   report.skipped++;continue;
  }
  let stage='authorization';
  try{
   if(!await options.authorize()){report.blocked=true;break;}
   stage='metadata_lookup';
   if(await options.existing(index)){report.alreadyStored++;continue;}
   stage='provider';
   const bytes=await options.download(item);
   if(!bytes.length||bytes.length>limit||bytes.length!==item.size||mailboxAttachmentMime(bytes)!==item.mime){
    report.failed++;console.warn('mailbox_attachment_item_failed',{stage:'validation',index});continue;
   }
   // Consent can be withdrawn during download. Do not persist after that point.
   stage='authorization';
   if(!await options.authorize()){report.blocked=true;break;}
   stage='storage';await options.upload(index,item,bytes);
   stage='authorization';
   if(!await options.authorize()){report.blocked=true;break;}
   stage='metadata';await options.record(index,item,bytes);
   report.stored++;
  }catch{report.failed++;console.warn('mailbox_attachment_item_failed',{stage,index});}
 }
 console.info('mailbox_attachment_result',report);
 return report;
}
