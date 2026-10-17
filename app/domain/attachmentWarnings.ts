// Fixed diagnostic codes only. Never store filenames, bodies or provider errors here.
export type AttachmentWarning={index:number;reason:'unsupported_format'|'too_large'|'invalid_file'|'save_failed';format?:'webp'}
const reasons=['unsupported_format','too_large','invalid_file','save_failed']
export function attachmentWarnings(value:unknown):AttachmentWarning[]{
 if(!Array.isArray(value))return []
 return value.slice(0,10).filter(v=>v&&Number.isInteger(v.index)&&v.index>=0&&v.index<10&&reasons.includes(v.reason)).map(v=>({index:v.index,reason:v.reason,...(v.format==='webp'?{format:'webp' as const}:{})}))
}
export function attachmentMetadataWarning(item:any,index:number):AttachmentWarning|null{
 const format=item?.mime==='image/webp'||(typeof item?.name==='string'&&/\.webp$/i.test(item.name))?'webp' as const:undefined
 if(!item||typeof item.id!=='string'||!item.id||!Number.isSafeInteger(item.size)||item.size<1)return {index,reason:'invalid_file'}
 if(!['application/pdf','image/png','image/jpeg'].includes(item.mime))return {index,reason:'unsupported_format',...(format?{format}:{})}
 if(item.size>5*1024*1024)return {index,reason:'too_large'}
 return null
}
export function attachmentMetadataWarnings(items:unknown){
 return Array.isArray(items)?items.slice(0,10).flatMap((item,index)=>{const issue=attachmentMetadataWarning(item,index);return issue?[issue]:[]}):[]
}
export function attachmentWarningText(issue:AttachmentWarning,locale:'es'|'en'){
 if(locale==='es'){
  if(issue.reason==='unsupported_format')return issue.format==='webp'?'El archivo WebP no se ha guardado. Formatos admitidos: PDF, PNG y JPG.':'Un archivo no se ha guardado porque su formato no está admitido. Formatos admitidos: PDF, PNG y JPG.'
  if(issue.reason==='too_large')return 'Un archivo no se ha guardado porque supera el máximo de 5 MiB por archivo.'
  if(issue.reason==='invalid_file')return 'Un archivo no se ha guardado porque no ha superado la validación.'
  return 'Un archivo no se ha podido guardar. El mensaje sigue disponible en la conversación.'
 }
 if(issue.reason==='unsupported_format')return issue.format==='webp'?'The WebP file was not saved. Supported formats: PDF, PNG and JPG.':'A file was not saved because its format is unsupported. Supported formats: PDF, PNG and JPG.'
 if(issue.reason==='too_large')return 'A file was not saved because it exceeds the 5 MiB per-file limit.'
 if(issue.reason==='invalid_file')return 'A file was not saved because it did not pass validation.'
 return 'A file could not be saved. The message remains available in the conversation.'
}
export function conversationAttachmentWarnings(messages:Array<{id:string;attachment_warnings?:unknown}>,files:Array<{email_message_id:string|null;attachment_index?:number}>,locale:'es'|'en'){
 return messages.flatMap(message=>attachmentWarnings(message.attachment_warnings).filter(issue=>!files.some(file=>file.email_message_id===message.id&&file.attachment_index===issue.index)).map(issue=>({id:`${message.id}:${issue.index}`,text:attachmentWarningText(issue,locale)})))
}
