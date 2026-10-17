import assert from 'node:assert/strict'
import test from 'node:test'
import {readFile} from 'node:fs/promises'
import {parse,compileScript} from '@vue/compiler-sfc'
import {stripTypeScriptTypes} from 'node:module'
import {createRenderer,h,reactive,nextTick,ref,computed,watch,onUnmounted} from 'vue'

test('actual AgencyWorkspace keeps one operational scope across selected artist, bookings and calendar',async()=>{
 const filename=new URL('../app/components/AgencyWorkspace.vue',import.meta.url)
 const {descriptor}=parse(await readFile(filename,'utf8'))
 assert.match(descriptor.template!.content, /<fieldset class="agency-calendar-filters">/)
 const compiled=compileScript(descriptor,{id:'agency-scope'}).content
 const rosterUrl=new URL('../app/domain/agencyRoster.ts',import.meta.url).href
 const emailUrl=new URL('../app/services/emailReplyPresentation.ts',import.meta.url).href
 const code=stripTypeScriptTypes(compiled.replace("'../domain/agencyRoster'",JSON.stringify(rosterUrl)).replace("'../services/emailReplyPresentation'",JSON.stringify(emailUrl)).replace(/from ['"]vue['"]/g,`from ${JSON.stringify(import.meta.resolve('vue'))}`),{mode:'transform'})
 const module=await import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`)
 const globals={ref,computed,watch,onUnmounted,nextTick,useRoute:()=>({query:{}}),useRouter:()=>({replace:async()=>{}}),useBookingCore:()=>({}),useArtistProfile:()=>({})}
 for(const [key,value] of Object.entries(globals))(globalThis as any)[key]=value
 const props=reactive({workspaceId:'demo',agencyName:'Test',view:'calendar',locale:'es',selectedArtistId:'b',artists:[{id:'a',stage_name:'A',slug:'a'},{id:'b',stage_name:'B',slug:'b'}],canManageRoster:true,canCapture:true,createArtist:async()=>true,demoData:{bookings:[{id:'a1',artist_id:'a',status:'confirmed',event_date:'2026-10-08',archived_at:null},{id:'b1',artist_id:'b',status:'confirmed',event_date:'2026-10-12',archived_at:null}],activities:[],holds:[],contacts:[],counterparties:[]},initialMonth:'2026-10-01'})
 const renderer=createRenderer({createElement:()=>({}),insert:()=>{},remove:()=>{},createText:()=>({}),createComment:()=>({}),setText:()=>{},setElementText:()=>{},parentNode:()=>null,nextSibling:()=>null,patchProp:()=>{}})
 let state:any
 const harness={setup(){state=module.default.setup(props,{expose:()=>{},emit:()=>{}});return()=>h('span','scope')}}
 const app=renderer.createApp(harness)
 try{
  app.mount({});await nextTick()
  const reply='Recibido!\nEl 2026-09-30 23:38, Test escribi&oacute;:\nMensaje anterior'
  assert.equal(state.activityPreview({type:'email',body:reply}),'Recibido!')
  assert.equal(state.activityPreview({type:'note',body:reply}),reply)
  const scrolls:any[]=[]
  let mobile=true
  let reducedMotion=false
  ;(globalThis as any).window={scrollY:300,matchMedia:(query:string)=>({matches:query.includes('reduced-motion')?reducedMotion:mobile}),scrollTo:(options:any)=>scrolls.push(options),getComputedStyle:()=>({position:'sticky'})}
  ;(globalThis as any).document={getElementById:()=>({getBoundingClientRect:()=>({height:80})}),querySelector:()=>null}
  state.dayAgenda.value={getBoundingClientRect:()=>({top:500})}
  await state.selectCalendarDay('2026-10-12')
  assert.equal(state.selectedDay.value,'2026-10-12')
  assert.deepEqual(scrolls,[{top:708,behavior:'smooth'}])
  reducedMotion=true
  await state.selectCalendarDay('2026-10-12')
  assert.equal(scrolls[1].behavior,'auto')
  mobile=false
  await state.selectCalendarDay('2026-10-08')
  assert.equal(state.selectedDay.value,'2026-10-08')
  assert.equal(scrolls.length,2)
  delete (globalThis as any).window
  delete (globalThis as any).document
  assert.deepEqual(state.scopedArtists.value.map((a:any)=>a.id),['b'])
  assert.deepEqual(state.calendarArtists.value,['b'])
  assert.deepEqual(state.visibleMonthBookings.value.map((b:any)=>b.id),['b1'])
  state.toggleCalendarArtist('a');await nextTick()
  assert.deepEqual(state.visibleMonthBookings.value.map((b:any)=>b.id).sort(),['a1','b1'])
  state.toggleCalendarArtist('b');await nextTick()
  assert.deepEqual(state.visibleMonthBookings.value.map((b:any)=>b.id),['a1'])
  props.selectedArtistId='a';await nextTick();await nextTick()
  assert.deepEqual(state.visibleMonthBookings.value.map((b:any)=>b.id),['a1'])
  props.view='bookings';await nextTick();await nextTick()
  assert.deepEqual(state.visibleBookings.value.map((b:any)=>b.id),['a1'])
  props.selectedArtistId='';await nextTick();await nextTick()
  assert.deepEqual(state.visibleBookings.value.map((b:any)=>b.id).sort(),['a1','b1'])
 }finally{delete (globalThis as any).window;delete (globalThis as any).document;app.unmount();for(const key of Object.keys(globals))delete (globalThis as any)[key]}
})
