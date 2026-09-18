import assert from 'node:assert/strict'
import test from 'node:test'

import { buildFailedEmailRetryDraft } from '../app/services/emailRetryDraft.ts'
import type { Activity } from '../app/domain/bookingCore.ts'
import type { BookingEmailMessage } from '../app/services/bookingCoreApi.ts'

function activity(emailMessageId: string, overrides: Partial<Activity> = {}): Activity {
  return {
    id: `activity-${emailMessageId}`,
    workspace_id: 'workspace-1',
    booking_id: 'booking-1',
    type: 'email',
    direction: 'outbound',
    contact_id: 'contact-1',
    actor_user_id: 'user-1',
    body: 'Hola, te reenvío la propuesta.',
    metadata: { email_message_id: emailMessageId, subject: 'Booking Sala X' },
    visibility: 'workspace',
    occurred_at: '2026-09-18T10:00:00.000Z',
    created_by: 'user-1',
    created_at: '2026-09-18T10:00:00.000Z',
    ...overrides
  }
}

function message(id: string, deliveryStatus: string | null, createdAt: string): BookingEmailMessage {
  return {
    id,
    booking_id: 'booking-1',
    delivery_status: deliveryStatus,
    delivered_at: null,
    bounced_at: deliveryStatus === 'hard_bounce' ? createdAt : null,
    opened_at: null,
    last_delivery_event_at: createdAt,
    delivery_failure_code: null,
    created_at: createdAt
  }
}

test('reuses the exact failed outbound email as an editable retry draft', () => {
  const draft = buildFailedEmailRetryDraft(
    [activity('email-1')],
    [message('email-1', 'hard_bounce', '2026-09-18T10:00:00.000Z')]
  )

  assert.deepEqual(draft, {
    subject: 'Booking Sala X',
    body: 'Hola, te reenvío la propuesta.'
  })
})

test('does not suggest retry when a newer attempt was accepted', () => {
  const draft = buildFailedEmailRetryDraft(
    [activity('email-1'), activity('email-2', { occurred_at: '2026-09-18T11:00:00.000Z' })],
    [
      message('email-1', 'hard_bounce', '2026-09-18T10:00:00.000Z'),
      message('email-2', 'accepted', '2026-09-18T11:00:00.000Z')
    ]
  )

  assert.equal(draft, null)
})

test('does not invent a retry when the failed provider row has no linked outbound Activity', () => {
  const draft = buildFailedEmailRetryDraft(
    [],
    [message('email-1', 'error', '2026-09-18T10:00:00.000Z')]
  )

  assert.equal(draft, null)
})
