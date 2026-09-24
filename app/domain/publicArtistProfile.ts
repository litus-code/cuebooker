import type { CueIdConfigV1 } from './cueId'

export type PublicCueIdConfig = Pick<CueIdConfigV1, 'schemaVersion' | 'family' | 'base' | 'build' | 'outfit' | 'accessory' | 'pose' | 'material' | 'accent'>

export function toPublicCueIdConfig(config: CueIdConfigV1): PublicCueIdConfig {
  return {
    schemaVersion: config.schemaVersion,
    family: config.family,
    base: config.base,
    build: config.build,
    outfit: config.outfit,
    accessory: config.accessory,
    pose: config.pose,
    material: config.material,
    accent: config.accent
  }
}

export type PublicPassportMilestone = {
  id: string
  title: string
  subtitle: string
}

export type PublicPassportSummary = {
  confirmedBookings: number
  cities: string[]
  venues: string[]
  milestones: PublicPassportMilestone[]
}

export type PublicArtistProfile = {
  stageName: string
  slug: string
  bio: string | null
  city: string | null
  countryCode: string | null
  languages: string[]
  primaryGenres: string[]
  secondaryGenres: string[]
  performanceFormats: string[]
  eventTypes: string[]
  yearsActive: number | null
  websiteUrl: string | null
  instagramUrl: string | null
  soundcloudUrl: string | null
  mixcloudUrl: string | null
  youtubeUrl: string | null
  spotifyUrl: string | null
  coverUrl: string | null
  coverPositionY: number
  artistImageUrl: string | null
  artistCutoutUrl: string | null
  artistImageStyle: string
  artistImagePositionX: number
  artistImagePositionY: number
  artistImageScale: number
  visualMode?: 'photo' | 'artwork' | 'cue_id'
  cueId?: PublicCueIdConfig | null
  passport?: PublicPassportSummary | null
  acceptingRequests: boolean
}

export type PublicBookingRequestInput = {
  artistSlug: string
  requestId: string
  contactName: string
  contactEmail: string
  contactPhone?: string | null
  organizationName?: string | null
  eventName?: string | null
  venueName?: string | null
  eventCity?: string | null
  eventCountryCode?: string | null
  eventDate?: string | null
  offerAmountMinor?: number | null
  offerCurrency?: string | null
  initialMessage?: string | null
  entrySource?: string | null
  locale?: 'es' | 'en'
  website?: string
}

export type PublicBookingRequestResult = {
  accepted: true
  created: boolean
  confirmationSent?: boolean
  reference?: string
}

export const RESERVED_ARTIST_SLUGS = new Set([
  'access',
  'account',
  'admin',
  'api',
  'app',
  'artist',
  'artists',
  'auth',
  'book',
  'booking',
  'cue-id',
  'login',
  'onboarding',
  'request',
  'settings',
  'signup',
  'workspace'
])

export function isReservedArtistSlug(value: string) {
  return RESERVED_ARTIST_SLUGS.has(value.trim().toLowerCase())
}

export function normalizePublicEntrySource(value: unknown) {
  if (typeof value !== 'string') return null
  const normalized = value.trim().toLowerCase()
  if (!normalized || normalized.length > 64 || !/^[a-z0-9][a-z0-9_-]*$/.test(normalized)) return null
  return normalized
}
