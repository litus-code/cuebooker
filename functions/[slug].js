const RESERVED = new Set([
  'access', 'account', 'admin', 'api', 'app', 'artist', 'artists', 'auth', 'book', 'booking',
  'cue-id', 'login', 'onboarding', 'request', 'settings', 'signup', 'workspace'
])

const STAGING_SUPABASE_URL = 'https://lycprjeuuynfzwskycwv.supabase.co'
const PRODUCTION_SUPABASE_URL = 'https://qlocooqfdzehogbwcbhr.supabase.co'

function supabaseUrlForHost(hostname) {
  return hostname === 'cuebooker.com' || hostname === 'www.cuebooker.com'
    ? PRODUCTION_SUPABASE_URL
    : STAGING_SUPABASE_URL
}

function compactDescription(value) {
  if (typeof value !== 'string') return ''
  return value.replace(/\s+/g, ' ').trim().slice(0, 180)
}

class TitleHandler {
  constructor(value) { this.value = value }
  element(element) { element.setInnerContent(this.value) }
}

class AttributeHandler {
  constructor(attribute, value) {
    this.attribute = attribute
    this.value = value
  }
  element(element) { element.setAttribute(this.attribute, this.value) }
}

async function passThrough(context, reason) {
  const response = await context.next()
  const headers = new Headers(response.headers)
  headers.set('X-Cuebooker-Artist-Route', reason)
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  })
}

export async function onRequestGet(context) {
  const slug = String(context.params.slug || '').trim().toLowerCase()
  if (!slug || RESERVED.has(slug) || slug.includes('.') || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    return passThrough(context, 'reserved-or-invalid')
  }

  const requestUrl = new URL(context.request.url)
  const publicProfileEndpoint = `${supabaseUrlForHost(requestUrl.hostname)}/functions/v1/get-public-artist-profile`

  let profileResponse
  try {
    const endpoint = new URL(publicProfileEndpoint)
    endpoint.searchParams.set('slug', slug)
    profileResponse = await fetch(endpoint, { headers: { Accept: 'application/json' } })
  } catch {
    return passThrough(context, 'profile-fetch-error')
  }

  if (profileResponse.status === 404) return passThrough(context, 'profile-not-found')
  if (!profileResponse.ok) return passThrough(context, `profile-${profileResponse.status}`)

  const payload = await profileResponse.json().catch(() => null)
  const artist = payload?.artist
  if (!artist?.stageName || artist.slug !== slug) return passThrough(context, 'profile-invalid')

  // Pages' ASSETS binding expects the pretty path, not the physical HTML filename.
  const shellUrl = new URL('/200', context.request.url)
  let shell = await context.env.ASSETS.fetch(new Request(shellUrl, context.request))
  if (!shell.ok) {
    const fallbackUrl = new URL('/', context.request.url)
    shell = await context.env.ASSETS.fetch(new Request(fallbackUrl, context.request))
  }
  if (!shell.ok) return passThrough(context, 'shell-unavailable')

  const title = `${artist.stageName} · Booking | Cuebooker`
  const description = compactDescription(artist.bio) || `Professional artist profile and booking enquiries for ${artist.stageName} on Cuebooker.`
  const canonical = `https://cuebooker.com/${encodeURIComponent(slug)}`

  const response = new HTMLRewriter()
    .on('title', new TitleHandler(title))
    .on('meta[name="description"]', new AttributeHandler('content', description))
    .on('meta[property="og:type"]', new AttributeHandler('content', 'profile'))
    .on('meta[property="og:title"]', new AttributeHandler('content', title))
    .on('meta[property="og:description"]', new AttributeHandler('content', description))
    .on('meta[property="og:url"]', new AttributeHandler('content', canonical))
    .on('meta[name="twitter:title"]', new AttributeHandler('content', title))
    .on('meta[name="twitter:description"]', new AttributeHandler('content', description))
    .on('link[rel="canonical"]', new AttributeHandler('href', canonical))
    .transform(shell)

  const headers = new Headers(response.headers)
  headers.set('Cache-Control', 'public, max-age=60, s-maxage=300')
  headers.set('Vary', 'Accept-Encoding')
  headers.set('X-Cuebooker-Artist-Route', 'hit')
  return new Response(response.body, { status: 200, headers })
}
