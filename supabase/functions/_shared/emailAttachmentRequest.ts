import {EMAIL_REQUEST_MAX_BYTES} from '../../../app/domain/emailAttachments.ts';
// Bound the actual stream as well as Content-Length before parsing base64 JSON.
export async function emailRequestJson(request:Request){
 const declared=request.headers.get('content-length');
 if(declared&&(!/^\d+$/.test(declared)||Number(declared)>EMAIL_REQUEST_MAX_BYTES))throw new Error('email_request_too_large');
 const reader=request.body?.getReader();if(!reader)throw new Error('invalid_json');
 const chunks:Uint8Array[]=[];let length=0;
 try{while(true){const {done,value}=await reader.read();if(done)break;length+=value.byteLength;if(length>EMAIL_REQUEST_MAX_BYTES){await reader.cancel();throw new Error('email_request_too_large');}chunks.push(value);}}
 finally{reader.releaseLock();}
 const bytes=new Uint8Array(length);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}
 try{return JSON.parse(new TextDecoder().decode(bytes));}catch{throw new Error('invalid_json');}
}
