import assert from 'node:assert/strict'
import test from 'node:test'

import type { CoreBooking } from '../app/domain/bookingCore.ts'
import {
  cuePassportNextMilestones,
  cuePassportUnlockedMilestones,
  deriveCuePassportSnapshot
} from '../app/domain/cuePassport.ts'

function booking(overrides: Partial<CoreBooking>): CoreBooking {
  return {
    id: crypto.randomUUID(),
    workspace_id: 'workspace',
    artist_id: 'artist',
    primary_contact_id: null,
    counterparty_id: null,
    source: 'manual',
    origin_channel: 'other',
    capture_method: 'manual',
    status: 'confirmed',
    event_name: null,
    venue_name: null,
    city: null,
    country_code: null,
    event_date: '2026-01-01',
    start_time: null,
    end_time: null,
    event_timezone: null,
    offer_amount_minor: null,
    currency: null,
    fee_basis: null,
    archived_at: null,
    created_by: 'user',
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
    ...overrides
  }
}

test('Passport only derives trajectory from active confirmed bookings', () => {
  const snapshot = deriveCuePassportSnapshot({
    baseCountryCode: 'ES',
    bookings: [
      booking({ city: 'Barcelona', country_code: 'ES', venue_name: 'Sala A' }),
      booking({ status: 'new', city: 'Madrid', country_code: 'ES', venue_name: 'Sala B' }),
      booking({ archived_at: '2026-03-01T00:00:00.000Z', city: 'Paris', country_code: 'FR', venue_name: 'Club C' })
    ]
  })

  assert.equal(snapshot.confirmedBookings, 1)
  assert.deepEqual(snapshot.cities, ['Barcelona'])
  assert.deepEqual(snapshot.venues, ['Sala A'])
})

test('Passport unlocks international milestone from base country comparison', () => {
  const snapshot = deriveCuePassportSnapshot({
    baseCountryCode: 'ES',
    bookings: [
      booking({ city: 'Barcelona', country_code: 'ES', event_date: '2026-01-01' }),
      booking({ city: 'Berlin', country_code: 'DE', event_date: '2026-02-01' })
    ]
  })

  const international = snapshot.milestones.find(item => item.id === 'first-international')
  assert.equal(international?.unlocked, true)
  assert.equal(international?.metadata?.countryCode, 'DE')
})

test('Passport normalizes duplicate city and venue labels', () => {
  const snapshot = deriveCuePassportSnapshot({
    bookings: [
      booking({ city: 'Barcelona', venue_name: 'Razzmatazz' }),
      booking({ city: 'barcelona', venue_name: 'razzmatazz' }),
      booking({ city: 'Madrid', venue_name: 'Sala X' })
    ]
  })

  assert.deepEqual(snapshot.cities, ['Barcelona', 'Madrid'])
  assert.deepEqual(snapshot.venues, ['Razzmatazz', 'Sala X'])
})

test('Passport exposes unlocked stickers and nearest locked milestones', () => {
  const snapshot = deriveCuePassportSnapshot({
    bookings: [
      booking({ city: 'Barcelona', venue_name: 'A' }),
      booking({ city: 'Madrid', venue_name: 'B' }),
      booking({ city: 'Berlin', venue_name: 'C' }),
      booking({ city: 'Paris', venue_name: 'D' })
    ]
  })

  assert.ok(cuePassportUnlockedMilestones(snapshot).some(item => item.id === 'first-booking'))
  const next = cuePassportNextMilestones(snapshot)
  assert.equal(next[0]?.id, 'cities-5')
  assert.equal(next[0]?.progressCurrent, 4)
  assert.equal(next[0]?.progressTarget, 5)
})
