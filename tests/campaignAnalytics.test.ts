import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { stripTypeScriptTypes } from 'node:module'
import { runInNewContext } from 'node:vm'
import { webcrypto, randomUUID } from 'node:crypto'
import { campaignDimensions, campaignPage, campaignConversion } from '../app/domain/campaignAnalytics.ts'
const serviceSource=stripTypeScriptTypes((await readFile(new URL('../app/services/campaignAnalytics.ts',import.meta.url),'utf8')).replace(/^import .*\n/gm,'').replace(/export /g,''))
function service(consent='unknown') {
 const storage = new Map<string,string>([['cuebooker:analytics-consent:v2',consent]])
 const sent: any[]=[]
 const location={pathname:'/dj/',search:'?utm_source=instagram&utm_campaign=beta_launch&ref=campaign-2026&email=private@example.invalid'}
 const api:any=runInNewContext(serviceSource+'\n({persistCampaignSignal,campaignSignupMetadata,campaignSnapshot,revokeCampaignConsent})',{
  campaignDimensions,campaignPage,window:{location},localStorage:{getItem:(k:string)=>storage.get(k),setItem:(k:string,v:string)=>storage.set(k,v),removeItem:(k:string)=>storage.delete(k)},crypto:{getRandomValues:webcrypto.getRandomValues.bind(webcrypto),subtle:webcrypto.subtle,randomUUID},URLSearchParams,TextEncoder,Uint8Array,Date,setTimeout,fetch:async(url:string,options:any)=>{sent.push({url,...options,body:JSON.parse(options.body)});return {ok:true}}
 })
 return {api,storage,sent,location}
}
test('campaign dimensions and page paths never accept arbitrary query content or profile slugs',()=>{
 assert.deepEqual(campaignDimensions({source:'agency',utm_source:'paid-social',ref:'beta',email:'private@example.invalid',utm_term:'private@example.invalid',utm_campaign:['one','two']}),{source:'agency',utm_source:'paid-social',ref:'beta'})
 assert.equal(campaignPage('/dj/?email=private@example.invalid#x'),'dj')
 assert.equal(campaignPage('/private-artist-slug'),null)
 assert.equal(campaignConversion(0,0),null);assert.equal(campaignConversion(1,3),33.3)
})
for (const consent of ['unknown','denied']) test(`campaign ${consent} creates no optional identifier or network traffic`,async()=>{
 const {api,storage,sent}=service(consent)
 api.persistCampaignSignal('https://fixture.invalid','key','page_view',{})
 assert.deepEqual(JSON.parse(JSON.stringify(await api.campaignSignupMetadata())),{})
 assert.equal(storage.has('cuebooker:campaign-consented:v1'),false)
 assert.equal(sent.length,0)
})
test('one consented browser carries source/ref/UTM into signup without raw token, email or enquiry content',async()=>{
 const {api,sent,location}=service('granted')
 api.persistCampaignSignal('https://fixture.invalid','key','page_view',{email:'private@example.invalid'})
 api.persistCampaignSignal('https://fixture.invalid','key','signup_click',{audience:'dj',placement:'landing_dj_hero',booking_text:'private message'})
 const token=sent[0].body.visitor_token
 assert.equal(token.length,64);assert.equal(sent[1].body.visitor_token,token)
 assert.notEqual(sent[0].body.event_key,sent[1].body.event_key)
 location.pathname='/access';location.search='?mode=signup&source=dj'
 const metadata=JSON.parse(JSON.stringify(await api.campaignSignupMetadata()))
 assert.equal(metadata.cuebooker_campaign.source,'dj')
 assert.equal(metadata.cuebooker_campaign.utm_campaign,'beta_launch')
 assert.equal(metadata.cuebooker_campaign.ref,'campaign-2026')
 assert.equal(metadata.cuebooker_campaign.token_hash.length,64)
 assert.notEqual(metadata.cuebooker_campaign.token_hash,token)
 assert.doesNotMatch(JSON.stringify(sent),/private message|private@example/)
 assert.doesNotMatch(JSON.stringify(metadata),/private@example/)
 api.persistCampaignSignal('https://fixture.invalid','key','signup_completed',{})
 assert.equal(sent.length,2,'client completion does not forge a persisted server account')
})
test('withdrawal deletes optional browser state and sends only a deletion command',async()=>{
 const {api,storage,sent}=service('granted')
 api.persistCampaignSignal('https://fixture.invalid','key','page_view',{})
 const token=sent[0].body.visitor_token
 api.revokeCampaignConsent('https://fixture.invalid','key')
 assert.equal(storage.has('cuebooker:campaign-consented:v1'),false)
 assert.match(sent[1].url,/campaign-analytics$/)
 assert.deepEqual(sent[1].body,{operation:'withdraw',visitor_token:token})
 storage.set('cuebooker:analytics-consent:v2','denied')
 api.persistCampaignSignal('https://fixture.invalid','key','page_view',{})
 assert.equal(sent.length,2)
})

test('internal product telemetry also requires optional analytics consent',async()=>{
 const Vue=await import('vue')
 const source=stripTypeScriptTypes((await readFile(new URL('../app/composables/useProductTelemetry.ts',import.meta.url),'utf8')).replace('export function','function').replaceAll('import.meta.client','true'))
 const calls:any[]=[];const consent=Vue.ref('denied')
 const api:any=runInNewContext(source+'\nuseProductTelemetry()',{...Vue,useRuntimeConfig:()=>({public:{supabaseUrl:'https://fixture.invalid',supabasePublishableKey:'fixture-key'}}),useCueAuth:()=>({session:Vue.ref({access_token:'fixture-token'})}),useAnalytics:()=>({consent}),$fetch:async(...args:any[])=>{calls.push(args);return null}})
 assert.equal(await api.record('smart_capture_start',{mode:'text'}),false)
 assert.equal(calls.length,0)
 consent.value='granted';assert.equal(await api.record('smart_capture_start',{mode:'text'}),true)
 assert.equal(calls.length,1)
 consent.value='denied';assert.equal(await api.record('automation_created'),false);assert.equal(calls.length,1)
})

test('analytics router plugin emits one initial view and ignores hash-only navigation',async()=>{
 const Vue=await import('vue')
 const source=stripTypeScriptTypes((await readFile(new URL('../app/plugins/analytics.client.ts',import.meta.url),'utf8')).replace('export default',''))
 const consent=Vue.ref('granted'), currentRoute=Vue.ref({fullPath:'/dj?utm_campaign=beta'})
 const events:string[]=[];let afterEach:Function=()=>{},consentWatch:Function=()=>{}
 runInNewContext(source,{defineNuxtPlugin:(fn:Function)=>fn(),useAnalytics:()=>({consent,init(){},trackPageView:(path:string)=>events.push(path)}),URL,useRouter:()=>({currentRoute,isReady:()=>Promise.resolve(),afterEach:(fn:Function)=>{afterEach=fn}}),watch:(_get:Function,fn:Function)=>{consentWatch=fn},queueMicrotask})
 afterEach({fullPath:currentRoute.value.fullPath},{fullPath:'/'})
 await new Promise(resolve=>setImmediate(resolve))
 assert.deepEqual(events,['/dj?utm_campaign=beta'])
 currentRoute.value={fullPath:'/dj/?utm_campaign=beta&utm_source=review#cue-id'};afterEach({fullPath:currentRoute.value.fullPath},{fullPath:'/dj?utm_campaign=beta'})
 await new Promise(resolve=>setImmediate(resolve));assert.equal(events.length,1)
 consent.value='denied';consentWatch('denied','granted')
 currentRoute.value={fullPath:'/agency'};afterEach({fullPath:'/agency'},{fullPath:'/dj'})
 await new Promise(resolve=>setImmediate(resolve));assert.equal(events.length,1)
 consent.value='granted';consentWatch('granted','denied')
 await new Promise(resolve=>setImmediate(resolve));assert.deepEqual(events,['/dj?utm_campaign=beta','/agency'])
})
