import assert from 'node:assert/strict'
import test from 'node:test'

import { renderNotificationEmail } from '../supabase/functions/_shared/notificationEmailTemplates.ts'

test('renders a friendly booking request email in Spanish', () => {
  const result = renderNotificationEmail({
    kind: 'booking_request_received',
    locale: 'es',
    recipientName: 'Litus',
    artistName: 'LITUS',
    contactName: 'Alex',
    venueName: 'Sala Test',
    city: 'Barcelona',
    eventDate: '2026-10-19',
    bookingUrl: 'https://staging.cuebooker.com/workspace?booking=abc'
  })

  assert.match(result.subject, /Nueva solicitud de booking/)
  assert.match(result.preheader, /Alex/)
  assert.match(result.text, /Sala Test · Barcelona · 2026-10-19/)
  assert.match(result.html, /Ver solicitud/)
  assert.match(result.html, /CUEBOOKER/)
})

test('renders a promoter reply email without exposing message body', () => {
  const result = renderNotificationEmail({
    kind: 'promoter_reply_received',
    locale: 'es',
    artistName: 'LITUS',
    contactName: 'Alex',
    eventName: 'Club Night',
    bookingUrl: 'https://staging.cuebooker.com/workspace?booking=abc'
  })

  assert.match(result.subject, /Nueva respuesta/)
  assert.match(result.text, /Ver conversación/)
  assert.doesNotMatch(result.text, /mensaje secreto/)
})

test('escapes dynamic HTML content', () => {
  const result = renderNotificationEmail({
    kind: 'booking_request_received',
    locale: 'en',
    artistName: '<script>alert(1)</script>',
    venueName: '<b>Venue</b>',
    bookingUrl: 'https://cuebooker.com/workspace?booking=abc'
  })

  assert.doesNotMatch(result.html, /<script>alert\(1\)<\/script>/)
  assert.match(result.html, /&lt;script&gt;/)
  assert.match(result.html, /&lt;b&gt;Venue&lt;\/b&gt;/)
})
