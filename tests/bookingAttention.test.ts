import test from 'node:test'
import assert from 'node:assert/strict'

import { deriveBookingAttentionSignals, deriveEmailDeliveryAttentionSignals } from '../app/services/bookingAttention.ts'
import type { Activity, CoreBooking } from '../app/domain/bookingCore.ts'

function booking(overrides: Partial<CoreBooking>): CoreBooking {
  return {
    id: 'booking-1',
    workspace_id: 'workspace-1',
    artist_id: 'artist-1',
    primary_contact_id: null,
    counterparty_id: null,
    source: 'manual',
    origin_channel: 'other',
    capture_method: 'manual',
    status: 'new',
    event_name: null,
    venue_name: null,
    city: null,
    country_code: null,
    event_date: null,
    start_time: null,
    end_time: null,
    event_timezone: null,
    offer_amount_minor: null,
    currency: null,
    fee_basis: null,
    archived_at: null,
    created_by: 'user-1',
    created_at: '2026-09-18T08:00:00.000Z',
    updated_at: '2026-09-18T08:00:00.000Z',
    ...overrides
  }
}

function activity(overrides: Partial<Activity>): Activity {
  return {
    id: 'activity-1',
    workspace_id: 'workspace-1',
    booking_id: 'booking-1',
    type: 'email',
    direction: 'inbound',
    contact_id: null,
    actor_user_id: null,
    body: 'reply',
    metadata: {},
    visibility: 'workspace',
    occurred_at: '2026-09-18T09:00:00.000Z',
    created_by: 'user-1',
    created_at: '2026-09-18T09:00:00.000Z',
    ...overrides
  }
}

test('surfaces new bookings without requiring a manually created next action', () => {
  const signals = deriveBookingAttentionSignals(
    [booking({ status: 'new' })],
    [],
    new Date('2026-09-18T12:00:00.000Z')
  )

  assert.equal(signals.length, 1)
  assert.equal(signals[0]?.kind, 'new_booking')
})

test('surfaces an inbound reply when the automatic booking state is in conversation', () => {
  const signals = deriveBookingAttentionSignals(
    [booking({ status: 'in_conversation' })],
    [activity({ direction: 'inbound', occurred_at: '2026-09-18T11:45:00.000Z' })],
    new Date('2026-09-18T12:00:00.000Z')
  )

  assert.equal(signals.length, 1)
  assert.equal(signals[0]?.kind, 'reply_received')
  assert.equal(signals[0]?.occurredAt, '2026-09-18T11:45:00.000Z')
})

test('waits 72 hours before surfacing a stale waiting-response booking', () => {
  const current = new Date('2026-09-18T12:00:00.000Z')
  const recent = activity({ direction: 'outbound', occurred_at: '2026-09-16T12:01:00.000Z' })
  const stale = activity({ direction: 'outbound', occurred_at: '2026-09-15T11:59:00.000Z' })

  assert.equal(
    deriveBookingAttentionSignals(
      [booking({ status: 'waiting_response' })],
      [recent],
      current
    ).length,
    0
  )

  assert.equal(
    deriveBookingAttentionSignals(
      [booking({ status: 'waiting_response' })],
      [stale],
      current
    )[0]?.kind,
    'stale_waiting'
  )
})

test('does not generate operational attention for archived or terminal bookings', () => {
  const signals = deriveBookingAttentionSignals(
    [
      booking({ id: 'archived', archived_at: '2026-09-18T10:00:00.000Z' }),
      booking({ id: 'confirmed', status: 'confirmed' }),
      booking({ id: 'rejected', status: 'rejected' }),
      booking({ id: 'cancelled', status: 'cancelled' })
    ],
    [],
    new Date('2026-09-18T12:00:00.000Z')
  )

  assert.deepEqual(signals, [])
})


test('surfaces one attention signal for the latest real email delivery failure per booking', () => {
  const signals = deriveEmailDeliveryAttentionSignals(
    [booking({ status: 'waiting_response' })],
    [
      {
        id: 'email-old',
        booking_id: 'booking-1',
        delivery_status: 'soft_bounce',
        bounced_at: '2026-09-18T09:00:00.000Z',
        last_delivery_event_at: '2026-09-18T09:00:00.000Z',
        created_at: '2026-09-18T08:59:00.000Z'
      },
      {
        id: 'email-new',
        booking_id: 'booking-1',
        delivery_status: 'hard_bounce',
        bounced_at: '2026-09-18T10:00:00.000Z',
        last_delivery_event_at: '2026-09-18T10:00:00.000Z',
        created_at: '2026-09-18T09:59:00.000Z'
      }
    ]
  )

  assert.equal(signals.length, 1)
  assert.equal(signals[0]?.kind, 'delivery_failed')
  assert.equal(signals[0]?.id, 'delivery-email-new')
})

test('ignores accepted/delivered email and terminal or archived bookings for delivery attention', () => {
  const messages = [
    {
      id: 'email-1',
      booking_id: 'booking-1',
      delivery_status: 'delivered',
      bounced_at: null,
      last_delivery_event_at: '2026-09-18T10:00:00.000Z',
      created_at: '2026-09-18T09:59:00.000Z'
    }
  ]

  assert.deepEqual(deriveEmailDeliveryAttentionSignals([booking({ status: 'waiting_response' })], messages), [])
  assert.deepEqual(deriveEmailDeliveryAttentionSignals([booking({ status: 'rejected' })], [{ ...messages[0], delivery_status: 'error' }]), [])
  assert.deepEqual(deriveEmailDeliveryAttentionSignals([booking({ archived_at: '2026-09-18T11:00:00.000Z' })], [{ ...messages[0], delivery_status: 'blocked' }]), [])
})


test('clears an old delivery failure when a newer outbound attempt is accepted', () => {
  const signals = deriveEmailDeliveryAttentionSignals(
    [booking({ status: 'waiting_response' })],
    [
      {
        id: 'email-bounced',
        booking_id: 'booking-1',
        delivery_status: 'hard_bounce',
        bounced_at: '2026-09-18T09:00:00.000Z',
        last_delivery_event_at: '2026-09-18T09:00:00.000Z',
        created_at: '2026-09-18T08:59:00.000Z'
      },
      {
        id: 'email-retry',
        booking_id: 'booking-1',
        delivery_status: 'accepted',
        bounced_at: null,
        last_delivery_event_at: '2026-09-18T10:00:00.000Z',
        created_at: '2026-09-18T09:59:00.000Z'
      }
    ]
  )

  assert.deepEqual(signals, [])
})
