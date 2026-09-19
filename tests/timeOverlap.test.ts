import test from 'node:test'
import assert from 'node:assert/strict'

import { intervalForDate, intervalsOverlap, timeToMinutes } from '../app/services/timeOverlap.ts'

test('converts valid clock values and rejects invalid ones', () => {
  assert.equal(timeToMinutes('18:30'), 1110)
  assert.equal(timeToMinutes('2026-09-17T02:15:00Z'), 135)
  assert.equal(timeToMinutes('25:00'), null)
  assert.equal(timeToMinutes(null), null)
})

test('adjacent ranges do not overlap while intersecting ranges do', () => {
  assert.equal(intervalsOverlap(18 * 60, 20 * 60, 20 * 60, 22 * 60), false)
  assert.equal(intervalsOverlap(18 * 60, 20 * 60, 19 * 60 + 30, 21 * 60), true)
})

test('missing time precision is treated conservatively as a possible conflict', () => {
  assert.equal(intervalsOverlap(null, null, 18 * 60, 20 * 60), true)
  assert.equal(intervalsOverlap(18 * 60, 20 * 60, null, null), true)
})

test('clips a cross-midnight range to the selected day', () => {
  assert.deepEqual(
    intervalForDate('2026-09-17T23:00:00', '2026-09-18T02:00:00', '2026-09-17'),
    { start: 23 * 60, end: 24 * 60 }
  )
  assert.deepEqual(
    intervalForDate('2026-09-17T23:00:00', '2026-09-18T02:00:00', '2026-09-18'),
    { start: 0, end: 2 * 60 }
  )
})

test('returns no interval when a range does not touch the selected date', () => {
  assert.equal(
    intervalForDate('2026-09-17T18:00:00', '2026-09-17T20:00:00', '2026-09-18'),
    null
  )
})
