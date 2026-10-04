import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {parse,compileScript} from '@vue/compiler-sfc';
import {stripTypeScriptTypes} from 'node:module';
import {createRenderer,h,reactive,nextTick,ref,computed,watch,onBeforeUnmount} from 'vue';
async function mountPanel(api:any){
 const {descriptor}=parse(await readFile(new URL('../app/components/ConnectedMailboxPanel.vue',import.meta.url),'utf8'));
 const code=stripTypeScriptTypes(compileScript(descriptor,{id:'mailbox-beta-access'}).content.replace(/from ['"]vue['"]/g,`from ${JSON.stringify(import.meta.resolve('vue'))}`),{mode:'transform'});
 const module=await import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`);
 const globals={ref,computed,watch,onBeforeUnmount,useRoute:()=>({query:{}}),useConnectedMailbox:()=>api};
 for(const [key,value] of Object.entries(globals))(globalThis as any)[key]=value;
 const props=reactive({workspaceId:'workspace-a',locale:'es',demo:false});let state:any;
 const renderer=createRenderer({createElement:()=>({}),insert:()=>{},remove:()=>{},createText:()=>({}),createComment:()=>({}),setText:()=>{},setElementText:()=>{},parentNode:()=>null,nextSibling:()=>null,patchProp:()=>{}});
 const app=renderer.createApp({setup(){state=module.default.setup(props,{expose:()=>{},emit:()=>{}});return()=>h('span')}});
 app.mount({});await nextTick();await nextTick();
 return {state,props,close:()=>{app.unmount();for(const key of Object.keys(globals))delete (globalThis as any)[key]}};
}
const status=(beta:any)=>({configured:true,connections:[],beta:{available:true,waitlisted:false,approvalRequired:true,status:'not_requested',requestedEmail:null,...beta}});
test('unapproved panel blocks connect and saves scoped request, pending disables access',async()=>{
 const requests:any[]=[];let connects=0;
 const panel=await mountPanel({status:async()=>status({}),waitlist:async(...args:any[])=>{requests.push(args);return {waitlisted:true,status:'pending',requestedEmail:'pilot@example.invalid'}},connect:async()=>{connects++;throw Error('unexpected')}});
 try{assert.equal(panel.state.canConnect.value,false);await panel.state.connect();assert.equal(connects,0);panel.state.email.value=' PILOT@EXAMPLE.INVALID ';await panel.state.joinWaitlist();assert.deepEqual(requests,[['workspace-a','pilot@example.invalid','es']]);assert.equal(panel.state.accessStatus.value,'pending');assert.equal(panel.state.requestedEmail.value,'pilot@example.invalid');assert.equal(panel.state.canConnect.value,false)}finally{panel.close()}
});
test('approval supplies the authorized email and changing workspace fails closed',async()=>{
 let resolveOther:any;
 const panel=await mountPanel({status:async(workspace:string)=>workspace==='workspace-a'?status({status:'approved',requestedEmail:'approved@example.invalid'}):await new Promise(resolve=>{resolveOther=resolve})});
 try{assert.equal(panel.state.canConnect.value,true);assert.equal(panel.state.email.value,'approved@example.invalid');panel.props.workspaceId='workspace-b';await nextTick();assert.equal(panel.state.canConnect.value,false);assert.equal(panel.state.email.value,'');resolveOther(status({status:'rejected',requestedEmail:'other@example.invalid'}));await nextTick();await nextTick();assert.equal(panel.state.canConnect.value,false);assert.equal(panel.state.accessStatus.value,'rejected')}finally{panel.close()}
});
test('request from previous workspace cannot overwrite current admission state',async()=>{
 let resolveRequest:any;
 const panel=await mountPanel({status:async()=>status({}),waitlist:async()=>await new Promise(resolve=>{resolveRequest=resolve})});
 try{panel.state.email.value='pilot@example.invalid';const pending=panel.state.joinWaitlist();panel.props.workspaceId='workspace-b';await nextTick();await nextTick();assert.equal(panel.state.busy.value,false);resolveRequest({waitlisted:true,status:'approved',requestedEmail:'previous@example.invalid'});await pending;assert.equal(panel.state.canConnect.value,false);assert.equal(panel.state.requestedEmail.value,'');assert.equal(panel.state.accessStatus.value,'not_requested')}finally{panel.close()}
});
