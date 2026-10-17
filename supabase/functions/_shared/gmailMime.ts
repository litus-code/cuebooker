import {bytesBase64} from '../../../app/domain/emailAttachments.ts';
import type {EmailAttachment} from '../../../app/domain/emailAttachments.ts';
const wrapped=(base64:string)=>base64.match(/.{1,76}/g)?.join('\r\n')||'';
export function gmailMime(headers:string[],body:string,files:EmailAttachment[]){
 const text=['Content-Type: text/plain; charset=UTF-8','Content-Transfer-Encoding: base64','',wrapped(bytesBase64(new TextEncoder().encode(body)))].join('\r\n');
 if(!files.length)return [...headers,text].join('\r\n');
 const boundary='cuebooker_'+crypto.randomUUID().replace(/-/g,'');
 const parts=[text,...files.map(file=>{
  const ascii=file.name.replace(/[^\x20-\x7e]|["\\;]/g,'_');
  const encoded=encodeURIComponent(file.name).replace(/[!'()*]/g,c=>'%'+c.charCodeAt(0).toString(16).toUpperCase());
  return [`Content-Type: ${file.contentType}`,`Content-Disposition: attachment; filename="${ascii}";`,` filename*=UTF-8''${encoded}`,'Content-Transfer-Encoding: base64','',wrapped(file.contentBase64)].join('\r\n');
 })];
 return [...headers,`Content-Type: multipart/mixed; boundary="${boundary}"`,'',...parts.map(part=>`--${boundary}\r\n${part}`),`--${boundary}--`,''].join('\r\n');
}
