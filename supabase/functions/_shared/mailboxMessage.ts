// Mail is always rendered as text. Never return provider HTML for v-html.
export function mailboxMessage(message:any,mailboxEmail:string) {
 const sender=String(message.from?.[0]?.email||'').trim().toLowerCase();
 const recipients=Array.isArray(message.to)?message.to:[];
 const to=sender===mailboxEmail?String(recipients[0]?.email||'').toLowerCase():mailboxEmail;
 if(!message.id||!message.thread_id||!sender||!to||!Number.isFinite(message.date))throw new Error('invalid_message');
 const body=String(message.body||message.snippet||'').replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi,'').replace(/<br\s*\/?\s*>|<\/p>|<\/div>/gi,'\n').replace(/<[^>]*>/g,'').replace(/&nbsp;/gi,' ').replace(/&lt;/gi,'<').replace(/&gt;/gi,'>').replace(/&quot;/gi,'"').replace(/&#39;/g,"'").replace(/&amp;/gi,'&').trim().slice(0,20000);
 return {id:String(message.id),threadId:String(message.thread_id),from:sender,to,senderName:String(message.from?.[0]?.name||sender).slice(0,200),subject:String(message.subject||'(Sin asunto)').slice(0,300),body:body||'(Mensaje sin texto)',date:new Date(message.date*1000).toISOString()};
}
