import { campaignDimensions, campaignPage } from '../domain/campaignAnalytics'
const KEY = 'cuebooker:campaign-consented:v1'
let pendingWrite: Promise<unknown> = Promise.resolve()
const MAX_AGE = 30 * 86400000
export type CampaignSnapshot = { token: string; createdAt: number; dimensions: Record<string,string> }
function readSnapshot(includeExpired = false): CampaignSnapshot | null {
  try {
    const data = JSON.parse(localStorage.getItem(KEY) || 'null')
    if (!data || !/^[a-f0-9]{64}$/.test(data.token) || !Number.isFinite(data.createdAt) || (!includeExpired && Date.now()-data.createdAt > MAX_AGE)) return null
    return { token: data.token, createdAt: data.createdAt, dimensions: campaignDimensions(data.dimensions || {}) }
  } catch { return null }
}
export function campaignSnapshot(create = false): CampaignSnapshot | null {
  if (typeof window === 'undefined') return null
  const existing = readSnapshot()
  if (existing || !create) return existing
  try {
    const token = Array.from(crypto.getRandomValues(new Uint8Array(32)), b=>b.toString(16).padStart(2,'0')).join('')
    const data = { token, createdAt: Date.now(), dimensions: campaignDimensions(Object.fromEntries(new URLSearchParams(window.location.search))) }
    localStorage.setItem(KEY, JSON.stringify(data))
    return data
  } catch { return null }
}
export async function campaignSignupMetadata() {
  if (typeof window === 'undefined') return {}
  try {
    if (localStorage.getItem('cuebooker:analytics-consent:v2') !== 'granted') return {}
    const snapshot = campaignSnapshot(true)
    if (!snapshot) return {}
    // The auth trigger matches this unguessable browser token hash, not email or a URL parameter.
    await Promise.race([pendingWrite, new Promise(resolve=>setTimeout(resolve,400))])
    const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(snapshot.token))
    return { cuebooker_campaign: { token_hash: Array.from(new Uint8Array(hash), b=>b.toString(16).padStart(2,'0')).join(''), ...snapshot.dimensions, ...campaignDimensions(Object.fromEntries(new URLSearchParams(window.location.search))) } }
  } catch { return {} }
}
export function persistCampaignSignal(baseURL: string, key: string, event: string, payload: Record<string,unknown>) {
  try { if (localStorage.getItem('cuebooker:analytics-consent:v2') !== 'granted') return } catch { return }
  if (!['page_view','signup_click','signup_started'].includes(event) || !baseURL || !key) return
  const page = campaignPage(event === 'page_view' && typeof payload.page_path === 'string' ? payload.page_path : window.location.pathname)
  if (!page || (event === 'page_view' && page === 'access')) return
  const snapshot = campaignSnapshot(true)
  if (!snapshot) return
  const properties: Record<string,unknown> = { ...snapshot.dimensions, ...campaignDimensions(Object.fromEntries(new URLSearchParams(window.location.search))), page }
  if (page === 'dj' || page === 'agency') properties.source = page
  if (['dj','agency'].includes(String(payload.audience))) properties.source = payload.audience
  if (typeof payload.placement === 'string' && /^[a-z0-9_-]{1,80}$/.test(payload.placement)) properties.placement = payload.placement
  pendingWrite = fetch(`${baseURL.replace(/\/$/,'')}/functions/v1/campaign-analytics`, {
    method:'POST', keepalive:true, headers:{apikey:key,'Content-Type':'application/json'},
    body:JSON.stringify({operation:'event',visitor_token:snapshot.token,event_key:crypto.randomUUID(),event_name:event,dimensions:properties})
  }).catch(()=>{ /* Optional metrics never block navigation or registration. No replay without consent. */ })
  return true
}
export function revokeCampaignConsent(baseURL: string, key: string) {
  const snapshot = readSnapshot(true)
  try { localStorage.removeItem(KEY); localStorage.removeItem('cuebooker.referral.first-touch.v1') } catch { /* Storage may be unavailable. */ }
  if (!snapshot || !baseURL || !key) return
  // Withdrawal only: this endpoint deletes optional facts; it does not collect a new event.
  void fetch(`${baseURL.replace(/\/$/,'')}/functions/v1/campaign-analytics`, {
    method:'POST',keepalive:true,headers:{apikey:key,'Content-Type':'application/json'},body:JSON.stringify({operation:'withdraw',visitor_token:snapshot.token})
  }).catch(()=>{})
}
