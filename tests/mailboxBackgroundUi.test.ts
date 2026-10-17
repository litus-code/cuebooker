import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {parse,compileScript} from '@vue/compiler-sfc';
import {stripTypeScriptTypes} from 'node:module';
import {createRenderer,h,reactive,nextTick,ref,computed,watch,onBeforeUnmount} from 'vue';
test('automatic authorization requires a scoped explicit checkbox and resets after save or workspace change',async()=>{
 const {descriptor}=parse(await readFile(new URL('../app/components/ConnectedMailboxPanel.vue',import.meta.url),'utf8'));
 const code=stripTypeScriptTypes(compileScript(descriptor,{id:'mailbox-background'}).content.replace(/from ['"]vue['"]/g,`from ${JSON.stringify(import.meta.resolve('vue'))}`),{mode:'transform'});
 const module=await import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`),calls:any[]=[];
 const globals={ref,computed,watch,onBeforeUnmount,useRoute:()=>({query:{}}),useConnectedMailbox:()=>({status:async()=>({configured:true,ai:{configured:true},background:{available:true,processor:'groq-gpt-oss-20b-v1'},connections:[{id:'connection',status:'connected'}],beta:{available:true,waitlisted:false}}),authorizeBackground:async(...args:any[])=>{calls.push(args)},pauseBackground:async()=>{}})};
 for(const [key,value] of Object.entries(globals))(globalThis as any)[key]=value;
 const props=reactive({workspaceId:'workspace-a',locale:'es',demo:false});
 const renderer=createRenderer({createElement:()=>({}),insert:()=>{},remove:()=>{},createText:()=>({}),createComment:()=>({}),setText:()=>{},setElementText:()=>{},parentNode:()=>null,nextSibling:()=>null,patchProp:()=>{}});let state:any;
 const app=renderer.createApp({setup(){state=module.default.setup(props,{expose:()=>{},emit:()=>{}});return()=>h('span')}});
 try{
  app.mount({});await nextTick();await nextTick();
  assert.equal(state.backgroundAvailable.value,true);await state.authorizeBackground('connection');assert.equal(calls.length,0);
  state.backgroundConsents.value=['connection'];await state.authorizeBackground('connection');assert.deepEqual(calls,[['workspace-a','connection','groq-gpt-oss-20b-v1']]);assert.deepEqual(state.backgroundConsents.value,[]);
  state.backgroundConsents.value=['connection'];props.workspaceId='workspace-b';await nextTick();await nextTick();
  assert.deepEqual(state.backgroundConsents.value,[]);await state.authorizeBackground('connection');assert.equal(calls.length,1);
 }finally{app.unmount();for(const key of Object.keys(globals))delete (globalThis as any)[key]}
});
