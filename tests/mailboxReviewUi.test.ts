import assert from 'node:assert/strict'
import test from 'node:test'
import {readFile} from 'node:fs/promises'
import {parse,compileScript} from '@vue/compiler-sfc'
import {stripTypeScriptTypes} from 'node:module'
import {createRenderer,h,reactive,nextTick,ref,computed,watch,onBeforeUnmount} from 'vue'

async function mailboxComponent(){
 const filename=new URL('../app/components/MailboxRequestsPanel.vue',import.meta.url)
 const {descriptor}=parse(await readFile(filename,'utf8'))
 const compiled=compileScript(descriptor,{id:'mailbox-review'}).content
 const draftUrl=new URL('../supabase/functions/_shared/mailboxBookingDraft.ts',import.meta.url).href
 const code=stripTypeScriptTypes(compiled.replace("'../../supabase/functions/_shared/mailboxBookingDraft'",JSON.stringify(draftUrl)).replace(/from ['"]vue['"]/g,`from ${JSON.stringify(import.meta.resolve('vue'))}`),{mode:'transform'})
 return import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`)
}
test('numeric mailbox offer stays reviewable and saves only after explicit approval',async()=>{
 const module=await mailboxComponent()
 let calls:any[]=[],threadCalls:any[]=[]
 const existing={id:'booking',artist_id:'artist',updated_at:'2026-10-01T07:00:00Z',offer_amount_minor:50000,currency:'EUR'}
 const mail={id:'old-message',from:'test@example.invalid',senderName:'Test',existingBooking:existing}
 const globals={ref,reactive,computed,watch,onBeforeUnmount,useConnectedMailbox:()=>({status:async(_workspace:string,bookingId?:string)=>bookingId?{connections:[{id:'connection',status:'connected'},{id:'unrelated',status:'connected'}],linkedConnectionIds:['connection']}:{connections:[]},thread:async(...args:any[])=>{threadCalls.push(args);return {messages:[mail],hasMore:false}},recent:async()=>{throw new Error('Thread review must not read the recent inbox')},importMessage:async(...args:any[])=>{calls.push(args);return {bookingId:'booking'}}})}
 for(const [key,value] of Object.entries(globals))(globalThis as any)[key]=value
 const props=reactive({workspaceId:'workspace',locale:'es',artists:[{id:'artist',stage_name:'Test'}]})
 const renderer=createRenderer({createElement:()=>({}),insert:()=>{},remove:()=>{},createText:()=>({}),createComment:()=>({}),setText:()=>{},setElementText:()=>{},parentNode:()=>null,nextSibling:()=>null,patchProp:()=>{}})
 let state:any
 const app=renderer.createApp({setup(){state=module.default.setup(props,{expose:()=>{},emit:()=>{}});return()=>h('span')}})
 try{
  app.mount({});await nextTick();await nextTick()
  state.selected.value={id:'message',from:'test@example.invalid',senderName:'Test',existingBooking:{id:'booking',artist_id:'artist',updated_at:'2026-10-01T07:00:00Z',offer_amount_minor:50000,currency:'EUR'}}
  await nextTick()
  state.review.amount=600 // Vue type=number v-model emits a number after editing.
  await nextTick()
  assert.equal(state.existingChanges.value.find((c:any)=>c.label==='Presupuesto').to,'600')
  assert.equal(state.applyExisting.value,false)
  await state.importMessage();assert.equal(calls.length,0)
  state.applyExisting.value=true
  await state.importMessage()
  assert.equal(calls.length,1)
  assert.equal(calls[0][5].offerAmountMinor,60000)
  assert.equal(calls[0][6],true)
  assert.equal(calls[0][7],'2026-10-01T07:00:00Z')
  state.review.amount=0;await nextTick();assert.equal(state.applyExisting.value,false)
  ;(props as any).bookingId='booking'
  await nextTick();await nextTick();await nextTick()
  assert.deepEqual(threadCalls,[['workspace','connection','booking']])
  assert.deepEqual(state.connections.value.map((c:any)=>c.id),['connection'])
  assert.equal(state.shownMessages.value[0].id,'old-message')
  state.selected.value=state.messages.value[0];await nextTick()
  props.artists=[{id:'other',stage_name:'Other'},{id:'artist',stage_name:'Test'}];await nextTick()
  assert.equal(state.artistId.value,'artist')
  state.review.amount=650;await nextTick();state.applyExisting.value=true
  await state.importMessage()
  assert.equal(calls[1][4],'booking')
  assert.equal(calls[1][5].offerAmountMinor,65000)
 }finally{app.unmount();for(const key of Object.keys(globals))delete (globalThis as any)[key]}
})

test('mailbox refresh does not analyze, failed detection preserves manual intake and consent stays scoped',async()=>{
 const module=await mailboxComponent()
 const calls:any[]=[],imports:any[]=[]
 let failure='',resolveAnalysis:((value:any)=>void)|undefined
 const mail={id:'message',from:'test@example.invalid',senderName:'Test',subject:'Consulta de fecha',body:'Consulta de prueba',date:'2026-10-01'}
 const globals={ref,reactive,computed,watch,onBeforeUnmount,useConnectedMailbox:()=>({
  status:async()=>({connections:[{id:'one',status:'connected'},{id:'two',status:'connected'}]}),
  recent:async(_workspace:string,id:string)=>{calls.push(['recent',id]);return {messages:[mail],hasMore:false}},
  classify:async(_workspace:string,id:string)=>{calls.push(['classify',id]);if(failure==='pending')return new Promise(resolve=>{resolveAnalysis=resolve});if(failure)throw new Error(failure);return {messages:[{...mail,classification:{kind:'booking',reason:'Consulta de disponibilidad'}}],hasMore:false}},
  importMessage:async(...args:any[])=>{imports.push(args);return {bookingId:'created'}}
 })}
 for(const [key,value] of Object.entries(globals))(globalThis as any)[key]=value
 const props=reactive({workspaceId:'workspace',locale:'es',artists:[{id:'artist',stage_name:'Test'}]})
 const renderer=createRenderer({createElement:()=>({}),insert:()=>{},remove:()=>{},createText:()=>({}),createComment:()=>({}),setText:()=>{},setElementText:()=>{},parentNode:()=>null,nextSibling:()=>null,patchProp:()=>{}})
 let state:any
 const app=renderer.createApp({setup(){state=module.default.setup(props,{expose:()=>{},emit:()=>{}});return()=>h('span')}})
 try{
  app.mount({});await nextTick();await nextTick();await nextTick()
  await state.detectRequests();assert.equal(calls.filter(c=>c[0]==='classify').length,0)
  state.analysisConsent.value=true;await state.detectRequests()
  assert.equal(state.shownMessages.value.length,1)
  await state.load()
  assert.equal(calls.filter(c=>c[0]==='classify').length,1,'Refresh must only read mail')
  assert.equal(state.shownMessages.value.length,1,'Refresh retains a readable inbox')
  failure='mailbox_ai_quota_exhausted';await state.detectRequests()
  assert.match(state.error.value,/agotado su cuota/)
  assert.equal(state.shownMessages.value[0].id,'message')
  state.selected.value=state.shownMessages.value[0];await nextTick();await state.importMessage()
  assert.equal(imports.length,1,'Manual import remains available after AI failure')
  assert.equal(calls.filter(c=>c[0]==='classify').length,2,'Import must not repeat analysis')
  state.connectionId.value='two';state.changeMailbox();await nextTick();await nextTick();await nextTick()
  assert.equal(state.analysisConsent.value,false)
  assert.equal(state.selectedConsent.value,false)
  await state.detectRequests();assert.equal(calls.filter(c=>c[0]==='classify').length,2)
  failure='pending';state.analysisConsent.value=true
  const pending=state.detectRequests();await nextTick()
  props.workspaceId='another-workspace';await nextTick();await nextTick();await nextTick()
  resolveAnalysis!({messages:[{...mail,id:'old-workspace'}],hasMore:false});await pending
  assert.equal(state.messages.value[0].id,'message','Old analysis cannot repopulate a changed workspace')
  assert.equal(state.analysisConsent.value,false)
 }finally{app.unmount();for(const key of Object.keys(globals))delete (globalThis as any)[key]}
})
