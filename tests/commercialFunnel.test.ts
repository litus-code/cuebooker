import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { stripTypeScriptTypes } from 'node:module'
import { runInNewContext } from 'node:vm'
import * as Vue from 'vue'
import { publicCampaignQuery, campaignDestination } from '../app/domain/publicCampaign.ts'
const root = new URL('../', import.meta.url)
const analyticsSource = stripTypeScriptTypes((await readFile(new URL('app/composables/useAnalytics.ts', root), 'utf8')).replace(/^import .*\n/gm,'').replace('export const useAnalytics', 'const useAnalytics').replaceAll('import.meta.client','true'))
test('campaign analytics require consent and load one tag script without duplicating a CTA event', () => {
  const storage = new Map<string,string>(), state = new Map(), scripts: any[] = [], window: any = {location:{reload(){}}}
  const api: any = runInNewContext(analyticsSource + '\nuseAnalytics()', {
    ...Vue, window, campaignPage: (path: string)=>path === '/' ? 'home' : null, persistCampaignSignal(){}, revokeCampaignConsent(){}, useRuntimeConfig: () => ({ public: { gtmId: 'GTM-FIXTURE' } }),
    useCookie: () => ({ value: null }), useState: (key: string, init: Function) => { if (!state.has(key)) state.set(key, Vue.ref(init())); return state.get(key) },
    localStorage: { getItem: (key: string) => storage.get(key), setItem: (key: string, value: string) => storage.set(key,value) },
    document: { title: 'Fixture', getElementById: (id: string) => scripts.find(s=>s.id===id), createElement: () => ({}), head: { appendChild: (script: any) => scripts.push(script) } }
  })
  api.init(); assert.equal(api.track('signup_click'), false); assert.equal(window.dataLayer, undefined)
  api.deny(); assert.equal(api.track('signup_completed'), false)
  api.accept(); api.accept(); assert.equal(scripts.length,1)
  api.track('signup_click',{placement:'landing_dj_hero',audience:'dj'})
  assert.equal(window.dataLayer.filter((e: any)=>e.event==='signup_click').length,1)
  api.deny(); assert.equal(api.track('booking_capture_created'),false)
})
const landingSource = stripTypeScriptTypes((await readFile(new URL('app/composables/useCommercialLanding.ts',root),'utf8')).replace(/^import .*\n/gm,'').replace('export function','function').replaceAll('import.meta.client','true'))
for (const audience of ['dj','agency']) test(`campaign ${audience} destination retains allowlisted attribution and emits one existing CTA signal`, () => {
  const events: any[] = []
  const api: any = runInNewContext(landingSource+`\nuseCommercialLanding('${audience}')`,{
    ...Vue,publicCampaignQuery,es:{},en:{},useCuePreferences:()=>({locale:Vue.ref('es')}),useRoute:()=>({path:`/${audience}`,query:{ref:'campaign-2026',utm_source:'instagram',utm_medium:'paid',utm_campaign:'beta',utm_content:['reject','array'],email:'private@example.invalid',booking_text:'private content'}}),useAnalytics:()=>({track:(...args:any[])=>events.push(args)}),useCueAuth:()=>({captureReferral(){}}),onMounted:(fn:Function)=>fn(),watch(){},useHead(){},URLSearchParams
  })
  assert.deepEqual(JSON.parse(JSON.stringify(api.signupTo.value)),{path:'/access',query:{ref:'campaign-2026',utm_source:'instagram',utm_medium:'paid',utm_campaign:'beta',mode:'signup',source:audience}})
  api.trackSignup('hero');assert.equal(events.length,1);assert.equal(events[0][0],'signup_click')
  assert.deepEqual(Object.keys(events[0][1]).sort(),['audience','placement'])
})

test('home and cross-audience destinations keep campaign metadata but exclude private query data',()=>{
 const query={utm_source:'instagram',utm_campaign:'beta',ref:'campaign-2026',booking_text:'private',email:'private@example.invalid'}
 const landing=campaignDestination('/dj',query)
 const access=campaignDestination('/access?mode=signup',Object.fromEntries(new URL(landing,'https://example.invalid').searchParams))
 const result=new URL(access,'https://example.invalid')
 assert.equal(result.searchParams.get('utm_campaign'),'beta')
 assert.equal(result.searchParams.get('ref'),'campaign-2026')
 assert.equal(result.searchParams.has('booking_text'),false)
 assert.equal(result.searchParams.has('email'),false)
 assert.equal(campaignDestination('https://outside.invalid',query),'/')
})
