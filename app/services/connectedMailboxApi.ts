export type ConnectedMailbox = {id:string;email:string;provider:string;status:'connected'|'reconnect_required'|'unknown';connectedAt:string}
export function createConnectedMailboxApi(options:{baseUrl:string;publishableKey:string;accessToken:()=>string|null|undefined}) {
 async function call(payload:Record<string,unknown>) {
  const token=options.accessToken();if(!token)throw new Error('authentication_required');
  const response=await fetch(`${options.baseUrl.replace(/\/$/,'')}/functions/v1/connected-mailbox`,{method:'POST',headers:{apikey:options.publishableKey,Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify(payload)});
  const result=await response.json().catch(()=>({}));if(!response.ok)throw new Error(result.error||'mailbox_operation_failed');return result;
 }
 return {
  status:(workspaceId:string)=>call({action:'status',workspaceId}) as Promise<{configured:boolean;connections:ConnectedMailbox[]}>,
  connect:(workspaceId:string,email:string,provider:string)=>call({action:'connect',workspaceId,email,provider}) as Promise<{authorizationUrl:string}>,
  complete:(workspaceId:string,state:string,code:string)=>call({action:'complete',workspaceId,state,code}),
  disconnect:(workspaceId:string,connectionId:string)=>call({action:'disconnect',workspaceId,connectionId})
 };
}
