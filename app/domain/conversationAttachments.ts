import {conversationAttachmentWarnings} from './attachmentWarnings.ts'

type MessageActivity={id:string;type:string;metadata?:Record<string,unknown>|null}
type Email={id:string;attachment_warnings?:unknown}
export type ConversationAttachment={id:string;email_message_id:string|null;attachment_index?:number;file_name:string;byte_size:number}

// Only the saved message ID establishes ownership. Never guess from time or filename.
export function groupConversationAttachments(activities:MessageActivity[],messages:Email[],files:ConversationAttachment[],locale:'es'|'en'){
 const linkedMessages=new Set<string>()
 const byActivity=new Map<string,{files:ConversationAttachment[];warnings:Array<{id:string;text:string}>}>()
 for(const activity of activities){
  const id=activity.type==='email'&&typeof activity.metadata?.email_message_id==='string'?activity.metadata.email_message_id:''
  if(!id)continue
  linkedMessages.add(id)
  const ownFiles=files.filter(file=>file.email_message_id===id)
  byActivity.set(activity.id,{files:ownFiles,warnings:conversationAttachmentWarnings(messages.filter(message=>message.id===id),ownFiles,locale)})
 }
 return {byActivity,unassigned:{files:files.filter(file=>!file.email_message_id||!linkedMessages.has(file.email_message_id)),warnings:conversationAttachmentWarnings(messages.filter(message=>!linkedMessages.has(message.id)),files,locale)}}
}
