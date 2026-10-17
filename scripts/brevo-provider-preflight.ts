// Manual, service-role-only, read-only release diagnostic. Never auto-deploy.
type Runtime = { env: { get(name: string): string | undefined }; serve(handler: (r: Request) => Promise<Response>): void }
declare const Deno: Runtime

function reply(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } })
}
function same(a: string, b: string) {
  let result = a.length ^ b.length
  for (let i = 0; i < Math.max(a.length, b.length); i++) result |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0)
  return result === 0
}
function endpoint(raw: unknown) {
  try {
    const u = new URL(String(raw))
    const hosts = ['qlocooqfdzehogbwcbhr.supabase.co', 'lycprjeuuynfzwskycwv.supabase.co']
    const paths = ['/functions/v1/ingest-booking-email', '/functions/v1/brevo-transactional-events']
    return hosts.includes(u.hostname) && paths.includes(u.pathname) ? u.origin + u.pathname : 'other_endpoint'
  } catch { return 'invalid_endpoint' }
}
export function brevoPreflight(getEnv: (n: string) => string | undefined, fetcher: typeof fetch = fetch) {
  return async (request: Request) => {
    if (request.method !== 'POST') return reply({ error: 'method_not_allowed' }, 405)
    const service = getEnv('SUPABASE_SERVICE_ROLE_KEY') || ''
    const legacyAuthorized = !!service && same(request.headers.get('Authorization') || '', `Bearer ${service}`)
    let secretAuthorized = false
    try {
      const keys = JSON.parse(getEnv('SUPABASE_SECRET_KEYS') || '{}')
      const supplied = request.headers.get('apikey') || ''
      secretAuthorized = !!supplied && Object.values(keys).some(k => typeof k === 'string' && k.startsWith('sb_secret_') && same(k, supplied))
    } catch { /* Invalid key configuration never grants access. */ }
    if (!legacyAuthorized && !secretAuthorized) return reply({ error: 'service_role_required' }, 401)
    const api = getEnv('BREVO_API_KEY') || ''
    if (!api) return reply({ error: 'provider_not_configured' }, 503)
    try {
      const callbacks = []
      for (const type of ['inbound', 'transactional']) {
        const r = await fetcher(`https://api.brevo.com/v3/webhooks?type=${type}`, {
          method: 'GET', redirect: 'error', signal: AbortSignal.timeout(15000), headers: { 'api-key': api, accept: 'application/json' }
        })
        if (!r.ok) {
          let detail: any = {}
          try { detail = await r.json() } catch { /* Never expose provider response text. */ }
          if (detail.code === 'document_not_found') {
            callbacks.push({ type, lookup_status: 'document_not_found' })
            continue
          }
          const codes = ['unauthorized', 'invalid_parameter', 'permission_denied', 'not_found', 'method_not_allowed', 'document_not_found', 'missing_parameter']
          const message = typeof detail.message === 'string' ? detail.message : ''
          return reply({ error: 'provider_read_failed', status: r.status, operation: type,
            provider_code: codes.includes(detail.code) ? detail.code : 'other',
            ip_review_required: /(?:ip|address).*(?:not authorized|not allowed|unauthorized|unrecognized|blocked)/i.test(message) || /unrecogni[sz]ed.*ip/i.test(message)
          }, 502)
        }
        const data = await r.json()
        if (!Array.isArray(data.webhooks) || data.webhooks.length > 1000) return reply({ error: 'unexpected_provider_response' }, 502)
        for (const w of data.webhooks) {
          const headers = Array.isArray(w.headers) ? w.headers : []
          const supplied = headers.find((h: any) => h.key === 'x-cuebooker-webhook-secret' || h.name === 'x-cuebooker-webhook-secret')?.value
          const expected = getEnv(type === 'inbound' ? 'CUEBOOKER_INBOUND_WEBHOOK_SECRET' : 'BREVO_TRANSACTIONAL_WEBHOOK_SECRET') || ''
          callbacks.push({ id: Number.isSafeInteger(w.id) ? w.id : null, type,
            domain: w.domain === 'reply.cuebooker.com' ? w.domain : 'other_or_unset', endpoint: endpoint(w.url),
            authentication_matches_production: !!expected && typeof supplied === 'string' && same(supplied, expected),
            events: Array.isArray(w.events) ? w.events.filter((e: unknown) => typeof e === 'string' && /^[a-zA-Z_]{1,40}$/.test(e)) : [] })
        }
      }
      return reply({ read_only: true, callbacks })
    } catch { return reply({ error: 'provider_read_failed' }, 502) }
  }
}
if (typeof Deno !== 'undefined') Deno.serve(brevoPreflight(n => Deno.env.get(n)))
