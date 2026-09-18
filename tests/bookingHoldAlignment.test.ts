import assert from 'node:assert/strict'
import test from 'node:test'

import { holdMatchesBookingSchedule } from '../app/services/bookingHoldAlignment.ts'
import type { CoreBooking, Hold } from '../app/domain/bookingCore.ts'

function booking(overrides: Partial<CoreBooking> = {}): CoreBooking {
  return {
    id: 'booking-1',
    workspace_id: 'workspace-1',
    artist_id: 'artist-1',
    primary_contact_id: null,
    counterparty_id: null,
    source: 'manual',
    origin_channel: 'other',
    capture_method: 'manual',
    status: 'in_conversation',
    event_name: null,
    venue_name: null,
    city: null,
    country_code: null,
    event_date: '2026-10-10',
    start_time: '22:00:00',
    end_time: '23:30:00',
    event_timezone: 'Europe/Madrid',
    offer_amount_minor: null,
    currency: null,
    fee_basis: null,
    archived_at: null,
    created_by: 'user-1',
    created_at: '2026-09-18T10:00:00.000Z',
    updated_at: '2026-09-18T10:00:00.000Z',
    ...overrides
  }
}

function hold(overrides: Partial<Hold> = {}): Hold {
  return {
    id: 'hold-1',
    workspace_id: 'workspace-1',
    booking_id: 'booking-1',
    event_date: '2026-10-10',
    starts_at: '2026-10-10T22:00:00+02:00',
    ends_at: '2026-10-10T23:30:00+02:00',
    event_timezone: 'Europe/Madrid',
    expires_at: null,
    priority: null,
    status: 'active',
    released_at: null,
    converted_at: null,
    created_by: 'user-1',
    created_at: '2026-09-18T10:00:00.000Z',
    updated_at: '2026-09-18T10:00:00.000Z',
    ...overrides
  }
}

test('matches a timed Hold to the current booking schedule', () => {
  assert.equal(holdMatchesBookingSchedule(booking(), hold()), true)
})

test('detects date drift', () => {
  assert.equal(holdMatchesBookingSchedule(booking(), hold({ event_date: '2026-10-11' })), false)
})

test('detects time drift on the same date', () => {
  assert.equal(
    holdMatchesBookingSchedule(booking(), hold({ starts_at: '2026-10-10T23:00:00+02:00' })),
    false
  )
})

test('treats an all-day Hold on the booking date as aligned', () => {
  assert.equal(
    holdMatchesBookingSchedule(booking(), hold({ starts_at: null, ends_at: null })),
    true
  )
})

test('does not invent a time mismatch when the booking itself has no schedule', () => {
  assert.equal(
    holdMatchesBookingSchedule(
      booking({ start_time: null, end_time: null }),
      hold()
    ),
    true
  )
})
