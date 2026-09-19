import assert from 'node:assert/strict'
import test from 'node:test'

import { renderBookingConversationEmail } from '../supabase/functions/_shared/bookingConversationEmailTemplate.ts'

test('renders booking conversation email with Cuebooker brand', () => {
  const result = renderBookingConversationEmail({
    artistName: 'LITS',
    bodyText: 'Hola,\n\ngracias por contar conmigo.'
  })

  assert.match(result.html, /CUEBOOKER/)
  assert.match(result.html, /BOOKING · LITS/)
  assert.match(result.html, /#e8ff2f/)
  assert.match(result.html, /gracias por contar conmigo\./)
  assert.equal(result.text, 'Hola,\n\ngracias por contar conmigo.')
})

test('escapes message and artist HTML', () => {
  const result = renderBookingConversationEmail({
    artistName: '<b>LITS</b>',
    bodyText: '<script>alert(1)</script>'
  })

  assert.doesNotMatch(result.html, /<script>alert\(1\)<\/script>/)
  assert.match(result.html, /&lt;script&gt;/)
  assert.match(result.html, /&lt;b&gt;LITS&lt;\/b&gt;/)
})
