import assert from 'node:assert/strict'
import test from 'node:test'
import {readFile} from 'node:fs/promises'
import {parse,compileScript} from '@vue/compiler-sfc'
import {stripTypeScriptTypes} from 'node:module'
import {createRenderer,h,reactive,nextTick,ref,computed,watch,onBeforeUnmount} from 'vue'

test('numeric mailbox offer stays reviewable and saves only after explicit approval',async()=>{
 const filename=new URL('../app/components/MailboxRequestsPanel.vue',import.meta.url)
 const {descriptor}=parse(await readFile(filename,'utf8'))
 const compiled=compileScript(descriptor,{id:'mailbox-review'}).content
 const draftUrl=new URL('../supabase/functions/_shared/mailboxBookingDraft.ts',import.meta.url).href
 const code=stripTypeScriptTypes(compiled.replace("'../../supabase/functions/_shared/mailboxBookingDraft'",JSON.stringify(draftUrl)).replace(/from ['"]vue['"]/g,`from ${JSON.stringify(import.meta.resolve('vue'))}`),{mode:'transform'})
 const module=await import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`)
 let calls:any[]=[]
 const globals={ref,reactive,computed,watch,onBeforeUnmount,useConnectedMailbox:()=>({status:async()=>({connections:[]}),importMessage:async(...args:any[])=>{calls.push(args);return {bookingId:'booking'}}})}
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
 }finally{app.unmount();for(const key of Object.keys(globals))delete (globalThis as any)[key]}
})
