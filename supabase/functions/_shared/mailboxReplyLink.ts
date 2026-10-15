export type MailboxReplyLink=string|null|{review:true};
export function savedReplyBooking(rows:Array<{booking_id:string;direction:string;from_email:string;to_email:string}>,sender:string):string|null {
 if(rows.length!==1||!sender)return null;
 const row=rows[0];
 const address=row.direction==='outbound'?row.to_email:row.direction==='inbound'?row.from_email:null;
 return address&&sender.trim().toLowerCase()===address.trim().toLowerCase()?row.booking_id:null;
}

// RFC headers are untrusted. Only exact, bounded IDs are searched, and a
// provider hit must resolve to a message already saved for this connection.
export function mailboxReplyReferences(raw:any):string[] {
 const headers=raw?.threading;
 if(!headers)return [];
 const parent=String(headers.inReplyTo||'');
 const ancestors=String(headers.references||'');
 if(parent.length>4096||ancestors.length>4096)return [];
 const tokens=(value:string)=>value.match(/<[A-Za-z0-9._+-]+@[A-Za-z0-9.-]+>/g)||[];
 const refs=[...new Set([...tokens(parent),...tokens(ancestors).reverse()])];
 return refs.length>10||refs.some(id=>id.length>512)?[]:refs;
}

export async function resolveMailboxReply(raw:any,options:{
 authorize:()=>Promise<boolean>;
 find:(reference:string)=>Promise<string[]>;
 savedBooking:(messageId:string)=>Promise<string|null>;
}):Promise<MailboxReplyLink> {
 const refs=mailboxReplyReferences(raw);
 if(!refs.length)return raw?.threading&&(raw.threading.inReplyTo||raw.threading.references)?{review:true}:null;
 const bookings=new Set<string>();
 for(const reference of refs){
  if(!await options.authorize())throw new Error('mailbox_consent_withdrawn');
  const ids=await options.find(reference);
  if(ids.length>5) return {review:true};
  for(const id of ids){const booking=await options.savedBooking(id);if(booking)bookings.add(booking);}
  if(bookings.size>1)return {review:true};
 }
 if(!await options.authorize())throw new Error('mailbox_consent_withdrawn');
 return bookings.size===1?[...bookings][0]:{review:true};
}
