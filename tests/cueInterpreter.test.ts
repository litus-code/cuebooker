import test from 'node:test'
import assert from 'node:assert/strict'

import { interpretCueText } from '../app/services/cueInterpreter.ts'

test('extracts the core booking context from a natural Spanish CUE', () => {
  const result = interpretCueText(
    'Me ha llamado Héctor de Nitsa para el 23 de septiembre. 1.200 €, pendiente confirmar horario.',
    'es',
    new Date('2026-09-17T10:00:00+02:00')
  )

  assert.deepEqual(result, {
    contactName: 'Héctor',
    counterpartyName: 'Nitsa',
    offerAmountMinor: 120000,
    currency: 'EUR',
    source: 'phone',
    eventDate: '2026-09-23',
    nextMoveLabel: 'Confirmar horario'
  })
})

test('rolls a date without a year into the next year when the date has already passed', () => {
  const result = interpretCueText(
    'Me han escrito para el 5 de enero.',
    'es',
    new Date('2026-12-30T12:00:00+01:00')
  )

  assert.equal(result.eventDate, '2027-01-05')
})

test('understands Catalan tomorrow and WhatsApp source', () => {
  const result = interpretCueText(
    'WhatsApp: proposta per demà, pendent confirmar horari.',
    'es',
    new Date('2026-09-17T10:00:00+02:00')
  )

  assert.equal(result.source, 'whatsapp')
  assert.equal(result.eventDate, '2026-09-18')
  assert.equal(result.nextMoveLabel, 'Confirmar horari')
})

test('parses English contact, counterparty and decimal currency amount', () => {
  const result = interpretCueText(
    'Spoke with Alex from Fabric for October 10, $1,250.50, pending confirm schedule.',
    'en',
    new Date('2026-09-17T09:00:00Z')
  )

  assert.equal(result.contactName, 'Alex')
  assert.equal(result.counterpartyName, 'Fabric')
  assert.equal(result.eventDate, '2026-10-10')
  assert.equal(result.offerAmountMinor, 125050)
  assert.equal(result.currency, 'USD')
  assert.equal(result.nextMoveLabel, 'Confirm schedule')
})

test('accepts ISO and slash date formats', () => {
  assert.equal(
    interpretCueText('Date 2027-03-28', 'en', new Date('2026-09-17T09:00:00Z')).eventDate,
    '2027-03-28'
  )
  assert.equal(
    interpretCueText('Fecha 28/03/2027', 'es', new Date('2026-09-17T09:00:00Z')).eventDate,
    '2027-03-28'
  )
})

test('rejects impossible calendar dates instead of normalizing them', () => {
  assert.equal(
    interpretCueText('Fecha 31/02/2027', 'es', new Date('2026-09-17T09:00:00Z')).eventDate,
    undefined
  )
  assert.equal(
    interpretCueText('February 30, 2027', 'en', new Date('2026-09-17T09:00:00Z')).eventDate,
    undefined
  )
})

test('parses common European and English booking fee formats consistently', () => {
  const now = new Date('2026-09-17T09:00:00Z')
  const cases: Array<[string, number, string]> = [
    ['Oferta 1.200 €', 120000, 'EUR'],
    ['Oferta 1,200 €', 120000, 'EUR'],
    ['Oferta 1.200,50 €', 120050, 'EUR'],
    ['Offer $1,200.50', 120050, 'USD'],
    ['Fee £950', 95000, 'GBP']
  ]

  for (const [text, minor, currency] of cases) {
    const result = interpretCueText(text, currency === 'EUR' ? 'es' : 'en', now)
    assert.equal(result.offerAmountMinor, minor, text)
    assert.equal(result.currency, currency, text)
  }
})

test('does not fabricate structured data from unrelated text', () => {
  const result = interpretCueText(
    'Fue una conversación interesante y ya hablaremos más adelante.',
    'es',
    new Date('2026-09-17T10:00:00+02:00')
  )

  assert.deepEqual(result, {})
})
