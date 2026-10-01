export type ConnectedMailbox = {id:string;email:string;provider:string;status:'connected'|'reconnect_required'|'unknown';connectedAt:string;background?:{enabled:boolean;processor:string|null;since:string|null}}
import type {MailboxBookingDraft,ReviewedMailboxDraft} from '../../supabase/functions/_shared/mailboxBookingDraft'
export type MailboxExistingBooking={id:string;artist_id:string;status:string;event_date:string|null;start_time:string|null;end_time:string|null;venue_name:string|null;city:string|null;offer_amount_minor:number|null;currency:string|null;event_timezone:string|null;updated_at:string}
export type MailboxMessage = {id:string;threadId:string;from:string;to:string;senderName:string;subject:string;body:string;date:string;existingBooking?:MailboxExistingBooking|null;classification?:{id:string;kind:'booking'|'review'|'other';reason:string;draft?:MailboxBookingDraft}}
export function createConnectedMailboxApi(options:{baseUrl:string;publishableKey:string;accessToken:()=>string|null|undefined}) {
 async function call(payload:Record<string,unknown>) {
  const token=options.accessToken();if(!token)throw new Error('authentication_required');
  const response=await fetch(`${options.baseUrl.replace(/\/$/,'')}/functions/v1/connected-mailbox`,{method:'POST',headers:{apikey:options.publishableKey,Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify(payload)});
  const result=await response.json().catch(()=>({}));if(!response.ok)throw new Error(result.error||'mailbox_operation_failed');return result;
 }
 return {
  status:(workspaceId:string,bookingId?:string)=>call({action:'status',workspaceId,bookingId}) as Promise<{configured:boolean;ai?:{provider:string;model:string;configured:boolean};background?:{available:boolean;processor:string};connections:ConnectedMailbox[];linkedConnectionIds:string[];hasLinkedThread:boolean;beta:{available:boolean;waitlisted:boolean}}>,
  pauseBackground:(workspaceId:string,connectionId:string)=>call({action:'background',workspaceId,connectionId,enabled:false}),
  authorizeBackground:(workspaceId:string,connectionId:string,processor:string)=>call({action:'background',workspaceId,connectionId,enabled:true,processor}),
  waitlist:(workspaceId:string)=>call({action:'waitlist',workspaceId}) as Promise<{waitlisted:boolean}>,
  connect:(workspaceId:string,email:string,provider:string='auto')=>call({action:'connect',workspaceId,email,provider}) as Promise<{authorizationUrl:string}>,
  complete:(workspaceId:string,state:string,code:string)=>call({action:'complete',workspaceId,state,code}),
  recent:(workspaceId:string,connectionId:string)=>call({action:'recent',workspaceId,connectionId}) as Promise<{messages:MailboxMessage[];hasMore:boolean}>,
  thread:(workspaceId:string,connectionId:string,bookingId:string)=>call({action:'thread',workspaceId,connectionId,bookingId}) as Promise<{messages:MailboxMessage[];hasMore:boolean}>,
  classify:(workspaceId:string,connectionId:string,messageId?:string,bookingId?:string)=>call({action:'classify',workspaceId,connectionId,messageId,bookingId,analysisConsent:true,analysisProvider:'groq'}) as Promise<{messages:MailboxMessage[];hasMore:boolean}>,
  importMessage:(workspaceId:string,connectionId:string,messageId:string,artistId:string,bookingId?:string,reviewedDraft?:ReviewedMailboxDraft,applyReviewedToExisting=false,expectedUpdatedAt?:string)=>call({action:'import',workspaceId,connectionId,messageId,artistId,bookingId,reviewedDraft,applyReviewedToExisting,expectedUpdatedAt}) as Promise<{bookingId:string}>,
  sync:(workspaceId:string,connectionId:string,bookingId:string,cursor?:string)=>call({action:'sync',workspaceId,connectionId,bookingId,cursor}) as Promise<{synced:boolean;partial:boolean}>,
  send:(input:{workspaceId:string;connectionId:string;bookingId:string;subject:string;bodyText:string;requestId:string})=>call({action:'send',...input}),
  disconnect:(workspaceId:string,connectionId:string)=>call({action:'disconnect',workspaceId,connectionId})
 };
}
