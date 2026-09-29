import assert from 'node:assert/strict'
import test from 'node:test'
import { createBookingCoreApi } from '../app/services/bookingCoreApi.ts'

test('agency calendar and holds fetch beyond the first PostgREST page', async () => {
  const original = (globalThis as any).$fetch
  const requests: Array<{ url: string; query: Record<string, string> }> = []
  try {
    ;(globalThis as any).$fetch = async (url: string, options: { query: Record<string, string> }) => {
      requests.push({ url, query: options.query })
      const count = options.query.offset === '0' ? 500 : 1
      return Array.from({ length: count }, (_, index) => ({ id: `${options.query.offset}-${index}` }))
    }
    const api = createBookingCoreApi({ baseUrl: 'https://example.invalid', publishableKey: 'test', accessToken: () => 'test', userId: () => 'test' })
    const calendar = await api.listRosterCalendarBookings('agency', '2026-09-01', '2026-10-01')
    const holds = await api.listRosterHolds('agency', '2026-09-01', '2026-10-01')
    assert.equal(calendar.length, 501)
    assert.equal(holds.length, 501)
    assert.deepEqual(requests.map(item => item.query.offset), ['0', '500', '0', '500'])
    assert.ok(requests.every(item => item.query.and?.includes('event_date.lt.2026-10-01')))
  } finally {
    ;(globalThis as any).$fetch = original
  }
})

test('agency list pages filter active roster before pagination', async () => {
  const original = (globalThis as any).$fetch
  const requests: Array<Record<string, string>> = []
  try {
    ;(globalThis as any).$fetch = async (_url: string, options: { query: Record<string, string> }) => {
      requests.push(options.query)
      return []
    }
    const api = createBookingCoreApi({ baseUrl: 'https://example.invalid', publishableKey: 'test', accessToken: () => 'test', userId: () => 'test' })
    await api.listRosterBookings('agency', 100, 100, undefined, ['artist-a', 'artist-b'])
    await api.listRosterActivities('agency', 100, 100, ['artist-a', 'artist-b'])
    assert.equal(requests[0]?.artist_id, 'in.(artist-a,artist-b)')
    assert.equal(requests[1]?.['bookings.artist_id'], 'in.(artist-a,artist-b)')
    assert.deepEqual(requests.map(item => item.offset), ['100', '100'])
  } finally {
    ;(globalThis as any).$fetch = original
  }
})
