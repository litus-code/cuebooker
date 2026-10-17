/** Campaign dimensions are codes, never arbitrary URLs, names, or enquiry text. */
export const CAMPAIGN_KEYS = ['source','ref','utm_source','utm_medium','utm_campaign','utm_content','utm_term'] as const
export function campaignDimensions(query: Record<string, unknown>) {
  const result: Record<string,string> = {}
  for (const key of CAMPAIGN_KEYS) {
    const value = query[key]
    if (typeof value !== 'string' || !/^[a-zA-Z0-9_.~-]{1,128}$/.test(value)) continue
    if (key === 'source' && !['dj','agency'].includes(value)) continue
    result[key] = value
  }
  return result
}
export function campaignPage(path: string) {
  const pathname = path.split(/[?#]/)[0]?.replace(/\/+$/,'') || '/'
  return ({'/':'home','/dj':'dj','/agency':'agency','/access':'access'} as Record<string,string>)[pathname] || null
}
export function campaignConversion(numerator: number, denominator: number): number | null {
  return denominator > 0 ? Math.round(numerator / denominator * 1000) / 10 : null
}
export type CampaignMetric = { step: string; events: number; visitors: number; users: number; workspaces: number }
export type CampaignReport = {
  rows: CampaignMetric[]
  breakdown: { step: string; page: string; placement: string; audience: string; account_type: string; events: number; visitors: number; users: number }[]
  conversions: { from_step: string; to_step: string; unit: string; numerator: number; denominator: number }[]
  dataset: string
}
