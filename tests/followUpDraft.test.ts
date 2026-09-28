import assert from 'node:assert/strict'
import test from 'node:test'

import { buildFollowUpDraft, shouldSuggestFollowUp } from '../app/services/followUpDraft.ts'
import type { Activity, Contact, CoreBooking } from '../app/domain/bookingCore.ts'

function booking(overrides: Partial<CoreBooking> = {}): CoreBooking {
  return {
    id: 'booking-1',
    workspace_id: 'workspace-1',
    artist_id: 'artist-1',
    primary_contact_id: 'contact-1',
    counterparty_id: null,
    source: 'email',
    origin_channel: 'email',
    capture_method: 'manual',
    status: 'waiting_response',
    event_name: 'Club Night',
    venue_name: 'Sala X',
    city: 'Barcelona',
    country_code: 'ES',
    event_date: '2026-10-10',
    start_time: null,
    end_time: null,
    event_timezone: null,
    offer_amount_minor: null,
    currency: null,
    fee_basis: null,
    archived_at: null,
    created_by: 'user-1',
    created_at: '2026-09-10T10:00:00.000Z',
    updated_at: '2026-09-15T10:00:00.000Z',
    ...overrides
  }
}

function activity(overrides: Partial<Activity> = {}): Activity {
  return {
    id: 'activity-1',
    workspace_id: 'workspace-1',
    booking_id: 'booking-1',
    type: 'email',
    direction: 'outbound',
    contact_id: 'contact-1',
    actor_user_id: 'user-1',
    body: 'Initial email',
    metadata: { subject: 'Booking Club Night' },
    visibility: 'workspace',
    occurred_at: '2026-09-15T10:00:00.000Z',
    created_by: 'user-1',
    created_at: '2026-09-15T10:00:00.000Z',
    ...overrides
  }
}

const contact: Contact = {
  id: 'contact-1',
  workspace_id: 'workspace-1',
  name: 'Héctor',
  email: 'hector@example.com',
  phone: null,
  role_label: null,
  notes: null,
  created_by: 'user-1',
  created_at: '2026-09-10T10:00:00.000Z',
  updated_at: '2026-09-10T10:00:00.000Z'
}

test('suggests follow-up only after a stale latest outbound interaction', () => {
  const now = new Date('2026-09-18T10:01:00.000Z')
  assert.equal(shouldSuggestFollowUp(booking(), [activity()], now), true)
  assert.equal(
    shouldSuggestFollowUp(booking(), [activity({ direction: 'inbound', occurred_at: '2026-09-18T09:00:00.000Z' })], now),
    false
  )
  assert.equal(shouldSuggestFollowUp(booking({ status: 'confirmed' }), [activity()], now), false)
})

test('builds an editable Spanish follow-up from booking context and prior subject', () => {
  const draft = buildFollowUpDraft(booking(), contact, [activity()], 'es')
  assert.equal(draft.subject, 'Re: Booking Club Night')
  assert.match(draft.body, /Hola Héctor,/)
  assert.match(draft.body, /Club Night/)
  assert.match(draft.body, /10 de octubre/)
})

test('falls back to booking context when no previous email subject exists', () => {
  const draft = buildFollowUpDraft(booking({ event_name: null, venue_name: 'Sala X' }), null, [], 'en')
  assert.equal(draft.subject, 'Follow-up · Sala X')
  assert.match(draft.body, /Hi,/)
  assert.match(draft.body, /Sala X/)
})
