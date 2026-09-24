import type { CoreBooking } from './bookingCore'
import type { CuePassportMedia } from './cuePassportMedia'

export type CuePassportMilestoneKind =
  | 'first_booking'
  | 'booking_count'
  | 'first_city'
  | 'city_count'
  | 'first_venue'
  | 'venue_count'
  | 'first_international'

export type CuePassportMilestone = {
  id: string
  kind: CuePassportMilestoneKind
  title: string
  subtitle: string
  unlockedAt: string | null
  permanent: boolean
  unlocked: boolean
  progressCurrent?: number
  progressTarget?: number
  metadata?: Record<string, string | number | boolean | null>
}

export type CuePassportSnapshot = {
  confirmedBookings: number
  cities: string[]
  countries: string[]
  venues: string[]
  milestones: CuePassportMilestone[]
}

export type CuePassportBookingNode = {
  id: string
  eventName: string | null
  eventDate: string | null
  media: CuePassportMedia[]
}

export type CuePassportVenueNode = {
  id: string
  name: string
  bookings: CuePassportBookingNode[]
}

export type CuePassportCityNode = {
  id: string
  name: string
  countryCode: string
  venues: CuePassportVenueNode[]
  bookings: CuePassportBookingNode[]
}

export type CuePassportCountryNode = {
  id: string
  code: string
  cities: CuePassportCityNode[]
}

export type CuePassportWorld = {
  countries: CuePassportCountryNode[]
  bookingCount: number
}

type PassportInput = {
  bookings: CoreBooking[]
  baseCountryCode?: string | null
}

function normalize(value?: string | null) {
  return value?.trim() || ''
}

function canonical(value?: string | null) {
  return normalize(value).toLocaleLowerCase()
}

function uniqueLabels(values: Array<string | null | undefined>) {
  const seen = new Map<string, string>()
  for (const value of values) {
    const label = normalize(value)
    if (!label) continue
    const key = canonical(label)
    if (!seen.has(key)) seen.set(key, label)
  }
  return [...seen.values()]
}

function bookingDateValue(booking: CoreBooking) {
  return booking.event_date || booking.updated_at || booking.created_at
}

function earliestBooking(bookings: CoreBooking[], predicate: (booking: CoreBooking) => boolean) {
  return bookings
    .filter(predicate)
    .sort((a, b) => bookingDateValue(a).localeCompare(bookingDateValue(b)))[0] || null
}

function countMilestone(
  kind: CuePassportMilestoneKind,
  id: string,
  title: string,
  subtitle: string,
  current: number,
  target: number
): CuePassportMilestone {
  return {
    id,
    kind,
    title,
    subtitle,
    unlockedAt: null,
    permanent: true,
    unlocked: current >= target,
    progressCurrent: Math.min(current, target),
    progressTarget: target
  }
}

export function deriveCuePassportSnapshot({ bookings, baseCountryCode }: PassportInput): CuePassportSnapshot {
  const confirmed = bookings
    .filter(booking => booking.status === 'confirmed' && !booking.archived_at)
    .sort((a, b) => bookingDateValue(a).localeCompare(bookingDateValue(b)))

  const cities = uniqueLabels(confirmed.map(booking => booking.city))
  const countries = uniqueLabels(confirmed.map(booking => booking.country_code?.toUpperCase() || null))
  const venues = uniqueLabels(confirmed.map(booking => booking.venue_name))

  const firstBooking = confirmed[0] || null
  const firstCityBooking = earliestBooking(confirmed, booking => Boolean(normalize(booking.city)))
  const firstVenueBooking = earliestBooking(confirmed, booking => Boolean(normalize(booking.venue_name)))
  const baseCountry = normalize(baseCountryCode).toUpperCase()
  const firstInternationalBooking = baseCountry
    ? earliestBooking(confirmed, booking => {
        const country = normalize(booking.country_code).toUpperCase()
        return Boolean(country && country !== baseCountry)
      })
    : null

  const milestones: CuePassportMilestone[] = [
    {
      id: 'first-booking',
      kind: 'first_booking',
      title: 'FIRST BOOKING',
      subtitle: 'First confirmed date in Cuebooker',
      unlockedAt: firstBooking ? bookingDateValue(firstBooking) : null,
      permanent: true,
      unlocked: Boolean(firstBooking)
    },
    {
      id: 'first-city',
      kind: 'first_city',
      title: firstCityBooking?.city?.toUpperCase() || 'FIRST CITY',
      subtitle: 'First city added to the trajectory',
      unlockedAt: firstCityBooking ? bookingDateValue(firstCityBooking) : null,
      permanent: true,
      unlocked: Boolean(firstCityBooking),
      metadata: firstCityBooking?.city ? { city: firstCityBooking.city } : undefined
    },
    {
      id: 'first-venue',
      kind: 'first_venue',
      title: firstVenueBooking?.venue_name?.toUpperCase() || 'FIRST VENUE',
      subtitle: 'First venue added to the Passport',
      unlockedAt: firstVenueBooking ? bookingDateValue(firstVenueBooking) : null,
      permanent: true,
      unlocked: Boolean(firstVenueBooking),
      metadata: firstVenueBooking?.venue_name ? { venue: firstVenueBooking.venue_name } : undefined
    },
    countMilestone('booking_count', 'bookings-10', '10 BOOKINGS', 'Confirm 10 dates', confirmed.length, 10),
    countMilestone('city_count', 'cities-5', '5 CITIES', 'Play in 5 different cities', cities.length, 5),
    countMilestone('venue_count', 'venues-10', '10 VENUES', 'Add 10 different venues to your trajectory', venues.length, 10),
    {
      id: 'first-international',
      kind: 'first_international',
      title: 'INTERNATIONAL',
      subtitle: baseCountry ? 'First confirmed date outside your base country' : 'Set your base country to track this milestone',
      unlockedAt: firstInternationalBooking ? bookingDateValue(firstInternationalBooking) : null,
      permanent: true,
      unlocked: Boolean(firstInternationalBooking),
      metadata: firstInternationalBooking?.country_code
        ? { countryCode: firstInternationalBooking.country_code.toUpperCase() }
        : undefined
    }
  ]

  return {
    confirmedBookings: confirmed.length,
    cities,
    countries,
    venues,
    milestones
  }
}

export function cuePassportUnlockedMilestones(snapshot: CuePassportSnapshot) {
  return snapshot.milestones.filter(milestone => milestone.unlocked)
}

export function cuePassportNextMilestones(snapshot: CuePassportSnapshot) {
  return snapshot.milestones
    .filter(milestone => !milestone.unlocked && milestone.progressTarget)
    .sort((a, b) => {
      const aRemaining = (a.progressTarget || 0) - (a.progressCurrent || 0)
      const bRemaining = (b.progressTarget || 0) - (b.progressCurrent || 0)
      return aRemaining - bRemaining
    })
}


export function buildCuePassportWorld(bookings: CoreBooking[], media: CuePassportMedia[] = []): CuePassportWorld {
  const confirmed = bookings
    .filter(booking => booking.status === 'confirmed' && !booking.archived_at)
    .sort((a, b) => bookingDateValue(a).localeCompare(bookingDateValue(b)))

  const countries = new Map<string, CuePassportCountryNode>()

  for (const booking of confirmed) {
    const countryCode = normalize(booking.country_code).toUpperCase() || 'XX'
    const cityName = normalize(booking.city) || 'Unknown city'
    const cityId = `${countryCode}:${canonical(cityName)}`
    const venueName = normalize(booking.venue_name) || 'Unknown venue'
    const venueId = `${cityId}:${canonical(venueName)}`

    let country = countries.get(countryCode)
    if (!country) {
      country = { id: countryCode, code: countryCode, cities: [] }
      countries.set(countryCode, country)
    }

    let city = country.cities.find(item => item.id === cityId)
    if (!city) {
      city = {
        id: cityId,
        name: cityName,
        countryCode,
        venues: [],
        bookings: []
      }
      country.cities.push(city)
    }

    const bookingNode: CuePassportBookingNode = {
      id: booking.id,
      eventName: booking.event_name,
      eventDate: booking.event_date,
      media: media.filter(item => item.booking_id === booking.id && item.status === 'linked')
    }
    city.bookings.push(bookingNode)

    let venue = city.venues.find(item => item.id === venueId)
    if (!venue) {
      venue = { id: venueId, name: venueName, bookings: [] }
      city.venues.push(venue)
    }
    venue.bookings.push(bookingNode)
  }

  return {
    countries: [...countries.values()].map(country => ({
      ...country,
      cities: country.cities.map(city => ({
        ...city,
        venues: [...city.venues].sort((a, b) => a.name.localeCompare(b.name))
      })).sort((a, b) => a.name.localeCompare(b.name))
    })).sort((a, b) => a.code.localeCompare(b.code)),
    bookingCount: confirmed.length
  }
}
