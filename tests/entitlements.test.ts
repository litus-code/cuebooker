import assert from 'node:assert/strict'
import test from 'node:test'

import {
  cueMinimumPlan,
  cuePlanBadge,
  cuePlanLimit,
  hasCueEntitlement,
  resolveCueEntitlement
} from '../app/domain/entitlements.ts'

test('Free keeps the complete basic Cuebooker loop available', () => {
  for (const entitlement of [
    'booking.core',
    'profile.public',
    'booking_form.public',
    'calendar.basic',
    'notifications.basic',
    'capture.manual',
    'passport.basic',
    'cue_id.basic',
    'distribution.basic'
  ] as const) {
    assert.equal(hasCueEntitlement('free', entitlement), true, entitlement)
  }
})

test('Artist Pro owns advanced artist capabilities without agency workspace rights', () => {
  assert.equal(hasCueEntitlement('artist_pro', 'passport.media'), true)
  assert.equal(hasCueEntitlement('artist_pro', 'automation.advanced'), true)
  assert.equal(hasCueEntitlement('artist_pro', 'workspace.multi_artist'), false)
  assert.equal(cuePlanBadge('passport.media'), 'PRO')
})

test('Agency capabilities are labelled independently from Artist Pro', () => {
  assert.equal(cueMinimumPlan('workspace.multi_artist'), 'agency')
  assert.equal(cuePlanBadge('workspace.multi_artist'), 'AGENCY')
  assert.equal(hasCueEntitlement('agency', 'workspace.multi_artist'), true)
})

test('Free capacity limits remain separate from capability access', () => {
  assert.equal(cuePlanLimit('free', 'activeBookings'), 5)
  assert.equal(cuePlanLimit('free', 'smartCaptureMonthly'), 10)
  assert.equal(cuePlanLimit('artist_pro', 'activeBookings'), null)
})

test('Entitlement overrides can simulate a feature without changing plan definitions', () => {
  assert.equal(resolveCueEntitlement('free', 'passport.media'), false)
  assert.equal(resolveCueEntitlement('free', 'passport.media', { 'passport.media': true }), true)
  assert.equal(resolveCueEntitlement('artist_pro', 'passport.media', { 'passport.media': false }), false)
})
