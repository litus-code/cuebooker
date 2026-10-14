export type MailboxTokenUsage={inputTokens:number|null;outputTokens:number|null}
export function mailboxTokenUsage(value:any):MailboxTokenUsage{
 const token=(n:unknown)=>Number.isSafeInteger(n)&&Number(n)>=0&&Number(n)<=1000000?Number(n):null;
 return {inputTokens:token(value?.prompt_tokens),outputTokens:token(value?.completion_tokens)};
}
export async function withMailboxAnalysisBudget<T>(options:{reserve:()=>Promise<{reserved?:boolean;error?:string}>;complete:(outcome:'succeeded'|'failed',usage:MailboxTokenUsage)=>Promise<unknown>;run:(report:(usage:MailboxTokenUsage)=>void)=>Promise<T>}){
 const reservation=await options.reserve();
 if(!reservation?.reserved)throw new Error(reservation?.error==='mailbox_analysis_already_attempted'?'mailbox_analysis_already_attempted':'mailbox_ai_budget_exhausted');
 let usage:MailboxTokenUsage={inputTokens:null,outputTokens:null},outcome:'succeeded'|'failed'='failed';
 try{const result=await options.run(value=>{usage=value});outcome='succeeded';return result;}
 finally{try{await options.complete(outcome,usage)}catch{console.warn('mailbox_analysis_accounting_unavailable')}}
}
