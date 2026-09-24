import assert from 'node:assert/strict'
import test from 'node:test'

import type { CoreBooking } from '../app/domain/bookingCore.ts'
import {
  scoreCuePassportMediaCandidate,
  suggestCuePassportMedia
} from '../app/domain/cuePassportMedia.ts'

function booking(overrides: Partial<CoreBooking> = {}): CoreBooking {
  return {
    id: 'booking-1',
    workspace_id: 'workspace',
    artist_id: 'artist',
    primary_contact_id: null,
    counterparty_id: null,
    source: 'manual',
    origin_channel: 'other',
    capture_method: 'manual',
    status: 'confirmed',
    event_name: 'Club Night',
    venue_name: 'Apolo',
    city: 'Barcelona',
    country_code: 'ES',
    event_date: '2026-09-20',
    start_time: null,
    end_time: null,
    event_timezone: null,
    offer_amount_minor: null,
    currency: null,
    fee_basis: null,
    archived_at: null,
    created_by: 'user',
    created_at: '2026-09-01T00:00:00.000Z',
    updated_at: '2026-09-01T00:00:00.000Z',
    ...overrides
  }
}

test('Passport media matching prioritizes same-day event content', () => {
  const suggestion = scoreCuePassportMediaCandidate(booking(), {
    externalId: 'ig-1',
    source: 'instagram',
    mediaType: 'reel',
    capturedAt: '2026-09-20T23:45:00Z',
    caption: 'Tonight at Apolo Barcelona'
  })

  assert.equal(suggestion.bookingId, 'booking-1')
  assert.equal(suggestion.score, 100)
  assert.deepEqual(suggestion.reasons, ['same_day', 'city_match', 'venue_match'])
})

test('Passport media suggestions exclude weak unrelated matches', () => {
  const suggestions = suggestCuePassportMedia([booking()], [{
    externalId: 'ig-2',
    source: 'instagram',
    mediaType: 'image',
    capturedAt: '2026-10-10T12:00:00Z',
    caption: 'Studio day'
  }])

  assert.deepEqual(suggestions, [])
})

test('Passport media matching treats nearby dates as suggestions, not truth', () => {
  const suggestion = scoreCuePassportMediaCandidate(booking(), {
    externalId: 'ig-3',
    source: 'instagram',
    mediaType: 'image',
    capturedAt: '2026-09-21T12:00:00Z',
    caption: 'After Barcelona'
  })

  assert.equal(suggestion.score, 60)
  assert.deepEqual(suggestion.reasons, ['within_1_day', 'city_match'])
})
