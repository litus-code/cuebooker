import assert from 'node:assert/strict'
import test from 'node:test'
import {
  brevoDeliveryStatus,
  isBrevoFailureStatus,
  isBrevoOpenEvent,
  normalizeBrevoEvent
} from '../supabase/functions/_shared/brevoTransactionalEvent.ts'

test('normalizes Brevo delivery event names', () => {
  assert.equal(normalizeBrevoEvent('Hard Bounce'), 'hard_bounce')
  assert.equal(normalizeBrevoEvent('unique-proxy-open'), 'unique_proxy_open')
})

test('maps tracked transactional delivery states', () => {
  assert.equal(brevoDeliveryStatus('sent'), 'accepted')
  assert.equal(brevoDeliveryStatus('delivered'), 'delivered')
  assert.equal(brevoDeliveryStatus('deferred'), 'deferred')
  assert.equal(brevoDeliveryStatus('soft_bounce'), 'soft_bounce')
  assert.equal(brevoDeliveryStatus('hard_bounce'), 'hard_bounce')
  assert.equal(brevoDeliveryStatus('blocked'), 'blocked')
  assert.equal(brevoDeliveryStatus('spam'), 'spam')
  assert.equal(brevoDeliveryStatus('invalid_email'), 'invalid')
  assert.equal(brevoDeliveryStatus('error'), 'error')
  assert.equal(brevoDeliveryStatus('clicked'), null)
})

test('classifies delivery failures without treating deferred as final failure', () => {
  assert.equal(isBrevoFailureStatus('hard_bounce'), true)
  assert.equal(isBrevoFailureStatus('error'), true)
  assert.equal(isBrevoFailureStatus('deferred'), false)
  assert.equal(isBrevoFailureStatus('delivered'), false)
})

test('recognizes direct and proxy open events', () => {
  assert.equal(isBrevoOpenEvent('opened'), true)
  assert.equal(isBrevoOpenEvent('unique_opened'), true)
  assert.equal(isBrevoOpenEvent('proxy_open'), true)
  assert.equal(isBrevoOpenEvent('unique_proxy_open'), true)
  assert.equal(isBrevoOpenEvent('clicked'), false)
})
