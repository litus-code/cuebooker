/** Public acquisition metadata only; never carry enquiry content or arbitrary route data. */
export function publicCampaignQuery(query: Record<string, unknown>) {
  const result: Record<string,string> = {}
  for (const key of ['ref','utm_source','utm_medium','utm_campaign','utm_content','utm_term']) {
    const value = query[key]
    if (typeof value !== 'string' || !value || value.length > 128) continue
    if (key === 'ref' && !/^[a-z0-9][a-z0-9_-]{1,63}$/i.test(value)) continue
    result[key] = value
  }
  return result
}
export function campaignDestination(destination: string, query: Record<string, unknown>) {
  if (destination.startsWith('#')) return destination
  const url = new URL(destination, 'https://cuebooker.invalid')
  if (url.origin !== 'https://cuebooker.invalid') return '/'
  for (const [key,value] of Object.entries(publicCampaignQuery(query))) url.searchParams.set(key,value)
  if (url.pathname === '/access' && !url.searchParams.has('source') && ['dj','agency'].includes(String(query.source))) url.searchParams.set('source',String(query.source))
  return `${url.pathname}${url.search}${url.hash}`
}
