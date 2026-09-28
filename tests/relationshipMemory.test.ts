import assert from 'node:assert/strict'
import test from 'node:test'

import { deriveRelationshipMemory } from '../app/services/relationshipMemory.ts'
import type { CoreBooking } from '../app/domain/bookingCore.ts'

function booking(id: string, overrides: Partial<CoreBooking> = {}): CoreBooking {
  return {
    id,
    workspace_id: 'workspace-1',
    artist_id: 'artist-1',
    primary_contact_id: 'contact-1',
    counterparty_id: 'party-1',
    source: 'manual',
    origin_channel: 'other',
    capture_method: 'manual',
    status: 'in_conversation',
    event_name: null,
    venue_name: null,
    city: 'Barcelona',
    country_code: 'ES',
    event_date: '2026-10-10',
    start_time: null,
    end_time: null,
    event_timezone: 'Europe/Madrid',
    offer_amount_minor: null,
    currency: null,
    fee_basis: null,
    archived_at: null,
    created_by: 'user-1',
    created_at: '2026-09-01T10:00:00.000Z',
    updated_at: '2026-09-01T10:00:00.000Z',
    ...overrides
  }
}

test('uses only historically earlier bookings for last date when current event date is known', () => {
  const current = booking('current', { event_date: '2026-10-10' })
  const memory = deriveRelationshipMemory(current, [
    current,
    booking('past', { event_date: '2026-09-01' }),
    booking('future', { event_date: '2026-11-01' })
  ])

  assert.equal(memory.lastPreviousBooking?.id, 'past')
})

test('uses the latest confirmed historical fee rather than an unconfirmed offer', () => {
  const current = booking('current', { event_date: '2026-10-10' })
  const memory = deriveRelationshipMemory(current, [
    current,
    booking('offer-only', {
      event_date: '2026-09-20',
      status: 'waiting_response',
      offer_amount_minor: 200000,
      currency: 'EUR'
    }),
    booking('confirmed-fee', {
      event_date: '2026-09-10',
      status: 'confirmed',
      offer_amount_minor: 150000,
      currency: 'EUR'
    })
  ])

  assert.equal(memory.lastConfirmedFeeBooking?.id, 'confirmed-fee')
})

test('keeps relationship history even when a previous booking was rejected', () => {
  const current = booking('current')
  const memory = deriveRelationshipMemory(current, [
    current,
    booking('rejected', { event_date: '2026-09-01', status: 'rejected' })
  ])

  assert.equal(memory.previousBookings.length, 1)
  assert.equal(memory.confirmedCount, 0)
})

test('prefers counterparty identity over contact identity when both exist', () => {
  const current = booking('current', { counterparty_id: 'party-1', primary_contact_id: 'contact-1' })
  const memory = deriveRelationshipMemory(current, [
    current,
    booking('same-contact-other-party', { counterparty_id: 'party-2', primary_contact_id: 'contact-1' }),
    booking('same-party-other-contact', { counterparty_id: 'party-1', primary_contact_id: 'contact-2' })
  ])

  assert.deepEqual(memory.previousBookings.map(item => item.id), ['same-party-other-contact'])
})
