import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {parse,compileScript} from '@vue/compiler-sfc';
import {stripTypeScriptTypes} from 'node:module';
import {createRenderer,h,reactive,nextTick} from 'vue';
test('attachment info updates for mailbox limits and Escape closes and restores focus',async()=>{
 const {descriptor}=parse(await readFile(new URL('../app/components/AttachmentLimitsInfo.vue',import.meta.url),'utf8'));
 const code=stripTypeScriptTypes(compileScript(descriptor,{id:'attachment-info'}).content.replace(/from ['"]vue['"]/g,`from ${JSON.stringify(import.meta.resolve('vue'))}`),{mode:'transform'});
 const module=await import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`);
 const props=reactive({locale:'es',maxBytes:5242880,maxFiles:5,perFile:false});let state:any;
 const renderer=createRenderer({createElement:()=>({}),insert:()=>{},remove:()=>{},createText:()=>({}),createComment:()=>({}),setText:()=>{},setElementText:()=>{},parentNode:()=>null,nextSibling:()=>null,patchProp:()=>{}});
 const app=renderer.createApp({setup(){state=module.default.setup(props,{expose:()=>{}});return()=>h('span')}});app.mount({});
 try{
  assert.match(state.limit.value,/5 MiB en total/);
  props.maxBytes=2097152;await nextTick();assert.match(state.limit.value,/2 MiB en total/);
  props.locale='en';props.perFile=true;props.maxFiles=10;await nextTick();assert.match(state.limit.value,/10 files.*2 MiB per file/);
  let focused=false;const element={open:true,querySelector:()=>({focus:()=>{focused=true}})};state.details.value=element;state.close();assert.equal(element.open,false);assert.equal(focused,true);
 }finally{app.unmount()}
});
