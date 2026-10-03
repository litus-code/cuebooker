import {mailboxClassifierInput,mailboxClassifierVersion,validateMailClassifications} from './mailboxClassifier.ts';
import type {BookingMailClassification} from './mailboxClassifier.ts';
type Message={id:string;subject:string;body:string};
export async function mailboxAnalysisKey(message:Message,extractDraft:boolean){
 const input=JSON.stringify({version:mailboxClassifierVersion,extractDraft,message:mailboxClassifierInput(message,extractDraft)});
 return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(input))),v=>v.toString(16).padStart(2,'0')).join('');
}
export async function withMailboxAnalysisCache(options:{
 messages:Message[];extractDraft:boolean;
 read:(keys:string[])=>Promise<Array<{input_hash:string;classification:unknown}>>;
 write:(rows:Array<{message_id:string;input_hash:string;classification:BookingMailClassification}>)=>Promise<unknown>;
 run:(messages:Message[])=>Promise<BookingMailClassification[]>;
}){
 if(!options.messages.length)return [];
 const keys=await Promise.all(options.messages.map(m=>mailboxAnalysisKey(m,options.extractDraft)));
 const rows=await options.read(keys),hits=new Map<string,BookingMailClassification>();
 for(let i=0;i<keys.length;i++){
  const row=rows.find(r=>r.input_hash===keys[i]);if(!row)continue;
  try{const [value]=validateMailClassifications({messages:[row.classification]},[options.messages[i].id]);
   if(options.extractDraft&&!value.draft)continue;hits.set(value.id,value);
  }catch{/* Invalid stored output cannot become an AI proposal. */}
 }
 const missing=options.messages.filter(m=>!hits.has(m.id));
 if(missing.length){
  const fresh=validateMailClassifications({messages:await options.run(missing)},missing.map(m=>m.id));
  if(options.extractDraft&&fresh.some(v=>!v.draft))throw new Error('invalid_classification');
  // Surface persistence failure; this path does not automatically retry AI.
  await options.write(fresh.map(classification=>({message_id:classification.id,input_hash:keys[options.messages.findIndex(m=>m.id===classification.id)],classification})));
  for(const value of fresh)hits.set(value.id,value);
 }
 return options.messages.map(m=>hits.get(m.id)!);
}
