import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {parse,compileScript,compileTemplate} from '@vue/compiler-sfc';
import {stripTypeScriptTypes} from 'node:module';
import {createRenderer,h,reactive,ref,computed,watch,onBeforeUnmount,nextTick} from 'vue';
test('reply composer selects/removes files, sends their bytes explicitly, clears successful files and protects changed booking/uncertain delivery',async()=>{
 const source=await readFile(new URL('../app/components/BookingActivityComposer.vue',import.meta.url),'utf8');
 const {descriptor}=parse(source);assert.deepEqual(compileTemplate({source:descriptor.template!.content,filename:'BookingActivityComposer.vue',id:'attachments'}).errors,[]);
 const compiled=compileScript(descriptor,{id:'attachments'}).content.replace(/from ['"]vue['"]/g,`from ${JSON.stringify(import.meta.resolve('vue'))}`).replace("'../domain/emailAttachments'",JSON.stringify(new URL('../app/domain/emailAttachments.ts',import.meta.url).href));
 const code=stripTypeScriptTypes(compiled,{mode:'transform'});const module=await import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`);
 let state:any,uncertain=false;const sends:any[]=[];
 const globals={ref,computed,reactive,watch,onBeforeUnmount,useBookingCore:()=>({createActivity:async()=>{}}),useBookingEmail:()=>({sendBookingEmail:async(input:any)=>{sends.push(input);return {status:'sent'}}}),useConnectedMailbox:()=>({status:async()=>({connections:[{id:'connection',email:'dj@example.invalid',status:'connected',transport:'gmail'}],linkedConnectionIds:['connection']}),send:async(input:any)=>{sends.push(input);if(uncertain)throw new Error('email_send_uncertain');return {status:'sent',attachmentStatus:{stored:input.attachments.length,pending:0}}}}),useAnalytics:()=>({track:()=>{}}),useCueEntitlements:()=>({can:()=>false})};
 const old=new Map(Object.keys(globals).map(k=>[k,Object.getOwnPropertyDescriptor(globalThis,k)]));for(const [k,v] of Object.entries(globals))(globalThis as any)[k]=v;
 const props=reactive({workspaceId:'workspace',booking:{id:'booking',primary_contact_id:'contact'},locale:'es',initialSubject:'Booking'});
 const renderer=createRenderer({createElement:()=>({}),insert:()=>{},remove:()=>{},createText:()=>({}),createComment:()=>({}),setText:()=>{},setElementText:()=>{},parentNode:()=>null,nextSibling:()=>null,patchProp:()=>{}});
 const app=renderer.createApp({setup(){state=module.default.setup(props,{expose:()=>{},emit:()=>{}});return()=>h('div')}});
 try{
  app.mount({});await nextTick();await nextTick();
  const pdf=new File(['%PDF-1.7\nfixture'],'contract.pdf',{type:'application/pdf'});
  const select=(files:File[])=>state.selectFiles({target:{files,value:'chosen'}});
  select([pdf]);assert.equal(state.selectedFiles.value.length,1);state.removeFile(0);assert.equal(state.selectedFiles.value.length,0);
  select([new File(['bad'],'bad.exe')]);assert.equal(state.selectedFiles.value.length,0);assert.match(state.errorMessage.value,/PDF/);
  select([pdf]);state.body.value='Adjunto contrato';await state.submit();assert.equal(sends.length,1);assert.equal(sends[0].connectionId,'connection');assert.equal(sends[0].bookingId,'booking');assert.equal(sends[0].attachments[0].name,'contract.pdf');assert.equal(Buffer.from(sends[0].attachments[0].contentBase64,'base64').toString(),'%PDF-1.7\nfixture');assert.equal(state.selectedFiles.value.length,0);
  select([pdf]);props.booking={id:'other',primary_contact_id:'contact'};await nextTick();await nextTick();assert.equal(state.selectedFiles.value.length,0);assert.equal(state.channelDrafts.email,'');
  let release:(buffer:ArrayBuffer)=>void=()=>{};const delayed=new File(['%PDF-1.7'],'delayed.pdf',{type:'application/pdf'});delayed.arrayBuffer=()=>new Promise(resolve=>{release=resolve});select([delayed]);state.body.value='Delayed';state.subject.value='Subject';const pending=state.submit();props.booking={id:'third',primary_contact_id:'contact'};await nextTick();release(new TextEncoder().encode('%PDF-1.7').buffer);await pending;assert.equal(sends.length,1);
  await nextTick();select([pdf]);state.body.value='Contrato';state.subject.value='Subject';uncertain=true;await state.submit();assert.equal(state.sendUncertain.value,true);assert.equal(state.selectedFiles.value.length,1);await state.submit();assert.equal(sends.length,2);
 }finally{app.unmount();for(const [k,d] of old){if(d)Object.defineProperty(globalThis,k,d);else Reflect.deleteProperty(globalThis,k)}}
});
