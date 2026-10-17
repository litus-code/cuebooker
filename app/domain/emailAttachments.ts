// Shared browser/server contract. File bytes never go to classification or logs.
export type EmailAttachment = { name: string; contentType: string; size: number; contentBase64: string }
export const EMAIL_ATTACHMENT_MAX_COUNT = 5
export const EMAIL_ATTACHMENT_MAX_BYTES = 5 * 1024 * 1024
export const NYLAS_ATTACHMENT_MAX_BYTES = 2 * 1024 * 1024
export const EMAIL_REQUEST_MAX_BYTES = 8 * 1024 * 1024
const mimeByExtension: Record<string,string> = {pdf:'application/pdf',png:'image/png',jpg:'image/jpeg',jpeg:'image/jpeg'}
export function emailAttachmentMime(bytes:Uint8Array) {
 if(bytes.length>=5&&String.fromCharCode(...bytes.slice(0,5))==='%PDF-')return 'application/pdf'
 if(bytes.length>=8&&[137,80,78,71,13,10,26,10].every((b,i)=>bytes[i]===b))return 'image/png'
 if(bytes.length>=3&&bytes[0]===255&&bytes[1]===216&&bytes[2]===255)return 'image/jpeg'
 return ''
}
export function emailAttachmentMetadata(files:Array<{name:string;type?:string;contentType?:string;size:number}>,maxTotal=EMAIL_ATTACHMENT_MAX_BYTES) {
 if(files.length>EMAIL_ATTACHMENT_MAX_COUNT)throw new Error('email_attachment_count')
 let total=0
 return files.map(file=>{
  if(!file||typeof file!=='object')throw new Error('email_attachment_invalid')
  if(typeof file.name!=='string'||!file.name.trim()||/[\\/\x00-\x1f\x7f]/.test(file.name)||new TextEncoder().encode(file.name).length>180)throw new Error('email_attachment_name')
  const expected=mimeByExtension[file.name.split('.').at(-1)?.toLowerCase()||'']
  const contentType=file.contentType||file.type||expected
  if(!expected||contentType!==expected)throw new Error('email_attachment_type')
  if(!Number.isSafeInteger(file.size)||file.size<1||file.size>EMAIL_ATTACHMENT_MAX_BYTES||(total+=file.size)>maxTotal)throw new Error('email_attachment_size')
  return {name:file.name,contentType,size:file.size}
 })
}
export function bytesBase64(bytes:Uint8Array) {
 let binary=''
 for(let i=0;i<bytes.length;i+=32768)binary+=String.fromCharCode(...bytes.subarray(i,i+32768))
 return btoa(binary)
}
export function validateEmailAttachments(value:unknown,maxTotal=EMAIL_ATTACHMENT_MAX_BYTES):EmailAttachment[] {
 if(value===undefined)return []
 if(!Array.isArray(value))throw new Error('email_attachment_invalid')
 const metadata=emailAttachmentMetadata(value,maxTotal)
 return metadata.map((file,index)=>{
  const contentBase64=value[index]?.contentBase64
  if(typeof contentBase64!=='string'||contentBase64.length!==4*Math.ceil(file.size/3)||!/^[A-Za-z0-9+/]*={0,2}$/.test(contentBase64))throw new Error('email_attachment_invalid')
  let binary:string
  try{binary=atob(contentBase64)}catch{throw new Error('email_attachment_invalid')}
  if(binary.length!==file.size||btoa(binary)!==contentBase64||emailAttachmentMime(Uint8Array.from(binary.slice(0,8),c=>c.charCodeAt(0)))!==file.contentType)throw new Error('email_attachment_invalid')
  return {...file,contentBase64}
 })
}
export async function prepareEmailAttachments(files:File[],maxTotal=EMAIL_ATTACHMENT_MAX_BYTES):Promise<EmailAttachment[]> {
 const metadata=emailAttachmentMetadata(files,maxTotal)
 const attachments:EmailAttachment[]=[]
 for(const [i,file] of files.entries()){
  const bytes=new Uint8Array(await file.arrayBuffer())
  if(bytes.length!==metadata[i].size||emailAttachmentMime(bytes)!==metadata[i].contentType)throw new Error('email_attachment_invalid')
  attachments.push({...metadata[i],contentBase64:bytesBase64(bytes)})
 }
 return attachments
}
