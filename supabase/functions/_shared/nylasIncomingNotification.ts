export async function verifyNylasSignature(body:Uint8Array,signature:string|null,secret:string){
 if(!secret||!signature||!/^[a-f0-9]{64}$/i.test(signature))return false;
 const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(secret),{name:'HMAC',hash:'SHA-256'},false,['verify']);
 const bytes=Uint8Array.from(signature.match(/../g)!,v=>parseInt(v,16));
 return crypto.subtle.verify('HMAC',key,bytes,body);
}
const identifier=(value:unknown)=>typeof value==='string'&&value.length>0&&value.length<=512&&!/[\u0000-\u001f]/.test(value);
export function nylasIncomingNotification(value:any){
 if(!['message.created','message.created.truncated'].includes(value?.type))return null;
 const object=value?.data?.object;
 if(!identifier(value.id)||!identifier(object?.grant_id)||!identifier(object?.id)||!identifier(object?.thread_id)
  ||!Number.isSafeInteger(object?.date)||object.date<=0||object.date>253402300799)throw new Error('invalid_mailbox_notification');
 return {target_grant:object.grant_id,target_event:value.id,target_message:object.id,target_thread:object.thread_id,target_date:new Date(object.date*1000).toISOString()};
}
export async function boundedNotificationBody(request:Request,limit=1048576){
 const size=request.headers.get('content-length');
 if(size&&(!/^\d+$/.test(size)||Number(size)>limit))throw new Error('mailbox_notification_too_large');
 if(!request.body)return new Uint8Array();
 const reader=request.body.getReader(),chunks:Uint8Array[]=[];let length=0;
 try{while(true){const item=await reader.read();if(item.done)break;length+=item.value.byteLength;if(length>limit){await reader.cancel();throw new Error('mailbox_notification_too_large')}chunks.push(item.value)}}finally{reader.releaseLock()}
 const result=new Uint8Array(length);let offset=0;for(const chunk of chunks){result.set(chunk,offset);offset+=chunk.length}return result;
}
