import type {BookingMailClassification} from './mailboxClassifier.ts';

// Only explicit provider metadata can avoid an AI call. Never reject by sender,
// body length or missing booking words. Ambiguous automated mail stays reviewable.
export function mailboxPreFilter(raw:any,id:string):BookingMailClassification|null {
 const metadata=raw?.automation;
 if(!metadata||typeof metadata!=='object')return null;
 const auto=String(metadata.autoSubmitted||'').trim().toLowerCase();
 const contentType=String(metadata.contentType||'').trim().toLowerCase();
 if(/^multipart\/report\s*;/.test(contentType)&&/\breport-type\s*=\s*"?delivery-status\b/.test(contentType))
  return {id,kind:'other',reason:'Informe automático de entrega. Puedes revisar el mensaje en tu correo.'};
 if(/^auto-replied(?:\s*;|$)/.test(auto))
  return {id,kind:'review',reason:'Respuesta automática de un hilo sin solicitud vinculada. Revisa si requiere seguimiento.'};
 if(String(metadata.listId||'').trim()&&String(metadata.listUnsubscribe||'').trim()&&/^(bulk|list)$/.test(String(metadata.precedence||'').trim().toLowerCase()))
  return {id,kind:'review',reason:'Mensaje de una lista de distribución. Revisa si contiene una consulta de actuación.'};
 return null;
}
