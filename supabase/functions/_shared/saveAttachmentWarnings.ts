import {attachmentWarnings} from '../../../app/domain/attachmentWarnings.ts';
import type {MailboxDb} from './mailboxTransport.ts';
export async function saveAttachmentWarnings(options:{workspaceId:string;bookingId:string;connectionId:string;messageId:string;warnings:unknown;db:MailboxDb;authorize:()=>Promise<boolean>}){
 const warnings=attachmentWarnings(options.warnings);if(!warnings.length)return true;
 try{
  if(!await options.authorize())return false;
  const filter=`workspace_id=eq.${options.workspaceId}&booking_id=eq.${options.bookingId}&provider=eq.${encodeURIComponent('nylas:'+options.connectionId)}&provider_message_id=eq.${encodeURIComponent(options.messageId)}&direction=eq.inbound`;
  const rows=await options.db<Array<{id:string;attachment_warnings:unknown}>>(`email_messages?${filter}&select=id,attachment_warnings&limit=1`);
  if(!rows[0])return false;
  const merged=new Map(attachmentWarnings(rows[0].attachment_warnings).map(w=>[w.index,w]));
  for(const issue of warnings)merged.set(issue.index,issue);
  if(!await options.authorize())return false;
  await options.db(`email_messages?id=eq.${rows[0].id}&${filter}`,{method:'PATCH',headers:{Prefer:'return=minimal'},body:JSON.stringify({attachment_warnings:[...merged.values()].slice(0,10)})});
  return true;
 }catch{console.warn('mailbox_attachment_notice_failed');return false;}
}
