import assert from 'node:assert/strict'
import test from 'node:test'
import { agencyGlobalQuery, agencyViewForArtist, canOperateAgency } from '../app/domain/agencyContext.ts'

test('switching artists preserves bookings, activity and calendar; individual identity requires an artist', () => {
  for (const view of ['bookings', 'calendar', 'history'] as const) {
    assert.equal(agencyViewForArtist(view, true), view)
    assert.equal(agencyViewForArtist(view, false), view)
  }
  assert.equal(agencyViewForArtist('profile', true), 'profile')
  assert.equal(agencyViewForArtist('roster', true), 'roster')
  assert.equal(agencyViewForArtist('roster', false), 'roster')
  for (const view of ['profile', 'passport', 'cue-id'] as const) assert.equal(agencyViewForArtist(view, false), 'overview')
})

test('returning to global retains roster filters, month and day while removing booking and artist scope', () => {
  const query = agencyGlobalQuery({ artist: 'b', booking: 'booking-b', rosterArtist: 'a', rosterCalendar: 'a,b', rosterMonth: '2026-11-01', rosterDay: '2026-11-12', setup: 'profile' }, 'calendar')
  assert.equal(query.artist, undefined)
  assert.equal(query.booking, undefined)
  assert.equal(query.setup, undefined)
  assert.equal(query.scope, 'all')
  assert.equal(query.view, 'calendar')
  assert.equal(query.rosterArtist, 'a')
  assert.equal(query.rosterCalendar, 'a,b')
  assert.equal(query.rosterMonth, '2026-11-01')
  assert.equal(query.rosterDay, '2026-11-12')
})

test('beta operation access follows existing workspace roles; viewer remains read-only', () => {
  for (const role of ['owner', 'admin', 'manager', 'editor']) assert.equal(canOperateAgency(role), true)
  for (const role of ['viewer', 'member', '', 'foreign']) assert.equal(canOperateAgency(role), false)
})
