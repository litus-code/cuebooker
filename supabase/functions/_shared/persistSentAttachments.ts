import type {EmailAttachment} from '../../../app/domain/emailAttachments.ts';
export async function persistSentAttachments(options:{
 base:string;key:string;workspaceId:string;bookingId:string;emailMessageId:string;
 files:EmailAttachment[];authorize:()=>Promise<boolean>;request?:typeof fetch;
}){
 const request=options.request||fetch;
 const headers={apikey:options.key,Authorization:`Bearer ${options.key}`};
 let stored=0,pending=0;
 for(const [index,file] of options.files.entries()){
  try{
   if(!await options.authorize())throw new Error('attachment_access_revoked');
   const query=`workspace_id=eq.${options.workspaceId}&booking_id=eq.${options.bookingId}&email_message_id=eq.${options.emailMessageId}&attachment_index=eq.${index}&select=id&limit=1`;
   const existing=await request(`${options.base}/rest/v1/booking_email_attachments?${query}`,{headers,signal:AbortSignal.timeout(8000)});
   if(!existing.ok)throw new Error('metadata_lookup_failed');
   if((await existing.json()).length){stored++;continue;}
   const path=`${options.workspaceId}/outgoing/${options.emailMessageId}/${index}`;
   const bytes=Uint8Array.from(atob(file.contentBase64),c=>c.charCodeAt(0));
   if(!await options.authorize())throw new Error('attachment_access_revoked');
   const upload=await request(`${options.base}/storage/v1/object/booking-email-attachments/${path}`,{method:'POST',headers:{...headers,'content-type':file.contentType,'x-upsert':'true'},body:bytes.buffer,signal:AbortSignal.timeout(15000)});
   if(!upload.ok)throw new Error('upload_failed');
   if(!await options.authorize())throw new Error('attachment_access_revoked');
   const record=await request(`${options.base}/rest/v1/booking_email_attachments`,{method:'POST',headers:{...headers,'content-type':'application/json',Prefer:'return=minimal'},body:JSON.stringify({workspace_id:options.workspaceId,booking_id:options.bookingId,email_message_id:options.emailMessageId,attachment_index:index,file_name:file.name,content_type:file.contentType,byte_size:file.size,storage_path:path}),signal:AbortSignal.timeout(8000)});
   if(!record.ok){
    if(record.status!==409)throw new Error('metadata_write_failed');
    const saved=await request(`${options.base}/rest/v1/booking_email_attachments?${query}`,{headers,signal:AbortSignal.timeout(8000)});
    if(!saved.ok||!(await saved.json()).length)throw new Error('metadata_write_failed');
   }
   stored++;
  }catch{pending++;console.warn('outbound_attachment_persistence_pending',{index});}
 }
 return {stored,pending};
}
