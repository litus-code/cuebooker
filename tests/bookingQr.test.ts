import assert from 'node:assert/strict'
import test from 'node:test'

import { createBookingQrSvg } from '../app/services/bookingQr.ts'

test('creates a scannable SVG payload for an attributed booking URL', () => {
  const svg = createBookingQrSvg('https://cuebooker.com/lits?booking=1&src=qr')

  assert.match(svg, /^<svg/)
  assert.match(svg, /viewBox=/)
  assert.ok(svg.length > 500)
})
