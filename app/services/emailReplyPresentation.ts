// Presentation only: keep the original stored email intact and render both parts as text.
const entities:Record<string,string>={amp:'&',lt:'<',gt:'>',quot:'"',apos:"'",nbsp:' ',laquo:'«',raquo:'»',aacute:'á',eacute:'é',iacute:'í',oacute:'ó',uacute:'ú',Aacute:'Á',Eacute:'É',Iacute:'Í',Oacute:'Ó',Uacute:'Ú',ntilde:'ñ',Ntilde:'Ñ',uuml:'ü',Uuml:'Ü',agrave:'à',egrave:'è',igrave:'ì',ograve:'ò',ugrave:'ù',ccedil:'ç',Ccedil:'Ç',auml:'ä',ouml:'ö',aring:'å',szlig:'ß'}
export function decodeEmailText(value:string){
 return value.replace(/&(#x[0-9a-f]+|#\d+|[a-z][a-z0-9]+);/gi,(entity,code:string)=>{
  if(!code.startsWith('#'))return entities[code]??entity
  const point=code[1]?.toLowerCase()==='x'?parseInt(code.slice(2),16):parseInt(code.slice(1),10)
  return point>0&&point<=0x10ffff&&!(point>=0xd800&&point<=0xdfff)?String.fromCodePoint(point):entity
 }).replace(/\r\n?/g,'\n')
}
export function emailReplyPresentation(value:string){
 const full=decodeEmailText(value).trim()
 const separators=[
  /^(?:[ \t]*)(?:El|On)[ \t]+(?=[^\n]{0,250}\d)[^\n]{1,250}?(?:escribió|wrote):[ \t]*$/gmi,
  /^[ \t]*[-_]{2,}[ \t]*(?:Original Message|Mensaje original|Forwarded message|Mensaje reenviado)[ \t]*[-_]{2,}[ \t]*$/gmi,
  /^[ \t]*(?:From|De):[^\n]+\n(?=[\s\S]{0,350}(?:Sent|Enviado|Date|Fecha):)(?=[\s\S]{0,350}(?:To|Para):)(?=[\s\S]{0,350}(?:Subject|Asunto):)/gmi
 ]
 const cuts=separators.flatMap(pattern=>Array.from(full.matchAll(pattern),m=>m.index!))
 // A trailing block of quoted lines is also safe to collapse. Leave inline replies visible.
 const lines=full.split('\n');let offset=0
 for(let i=0;i<lines.length;i++){
  if(/^\s*>/.test(lines[i]!)&&lines.slice(i).every(line=>!line.trim()||/^\s*>/.test(line))){cuts.push(offset);break}
  offset+=lines[i]!.length+1
 }
 const cut=cuts.length?Math.min(...cuts):-1
 if(cut<=0||!full.slice(0,cut).trim())return {body:full,quotedBody:''}
 return {body:full.slice(0,cut).trim(),quotedBody:full.slice(cut).trim()}
}
