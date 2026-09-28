import assert from 'node:assert/strict'
import test from 'node:test'

import { createCaptureEngine, localInterpretationToSmartCapture } from '../app/services/captureEngine.ts'
import type { SmartCaptureResult } from '../app/domain/smartCapture.ts'

function smartResult(transcript = 'Smart result'): SmartCaptureResult {
  const unknown = <T>(value: T | null = null) => ({ value, confidence: value == null ? 'unknown' as const : 'high' as const, evidence: null })
  return {
    transcript,
    summary: 'Summary',
    source: unknown(null),
    contact: { name: unknown(null), email: unknown(null), phone: unknown(null) },
    counterparty: { name: unknown(null), kind: unknown(null) },
    event: {
      name: unknown(null), venueName: unknown(null), city: unknown(null), countryCode: unknown(null),
      eventDate: unknown(null), startTime: unknown(null), endTime: unknown(null), timezone: unknown(null)
    },
    offer: { amountMinor: unknown(null), currency: unknown(null), feeBasis: unknown(null) },
    nextAction: { label: unknown(null), dueAt: unknown(null) },
    conditions: [],
    missingFields: [],
    warnings: []
  }
}

test('uses Smart Capture for text when available', async () => {
  const expected = smartResult('text')
  const engine = createCaptureEngine({
    analyzeText: async () => expected,
    analyzeAudio: async () => smartResult('audio'),
    interpretText: () => ({})
  })

  const analysis = await engine.analyzeText({
    workspaceId: 'workspace-1',
    artistId: 'artist-1',
    locale: 'es',
    text: 'Héctor llama para Nitsa'
  })

  assert.equal(analysis.method, 'smart_text')
  assert.equal(analysis.result, expected)
})

test('normalizes local text fallback into SmartCaptureResult', async () => {
  const engine = createCaptureEngine({
    analyzeText: async () => { throw new Error('provider_down') },
    analyzeAudio: async () => smartResult('audio'),
    interpretText: () => ({
      contactName: 'Héctor',
      venueName: 'Nitsa',
      eventDate: '2026-10-10',
      offerAmountMinor: 120000,
      currency: 'EUR'
    })
  })

  const analysis = await engine.analyzeText({
    workspaceId: 'workspace-1',
    artistId: 'artist-1',
    locale: 'es',
    text: 'Héctor de Nitsa para el 10/10, 1200 EUR'
  })

  assert.equal(analysis.method, 'local_parser')
  assert.equal(analysis.result.contact.name.value, 'Héctor')
  assert.equal(analysis.result.event.venueName.value, 'Nitsa')
  assert.equal(analysis.result.offer.amountMinor.value, 120000)
  assert.equal(analysis.result.offer.amountMinor.confidence, 'medium')
  assert.equal(analysis.result.warnings.length, 1)
})

test('recovers failed audio through browser transcript and Smart Capture text', async () => {
  const engine = createCaptureEngine({
    analyzeText: async input => smartResult(input.text),
    analyzeAudio: async () => { throw new Error('audio_failed') },
    interpretText: () => ({})
  })

  const analysis = await engine.analyzeAudio({
    workspaceId: 'workspace-1',
    artistId: 'artist-1',
    locale: 'es',
    audio: new Blob(['audio']),
    fallbackTranscript: 'Texto recuperado del navegador'
  })

  assert.equal(analysis.method, 'browser_transcript')
  assert.equal(analysis.result.transcript, 'Texto recuperado del navegador')
})

test('falls back from failed audio and failed text extraction to one SmartCaptureResult', async () => {
  const engine = createCaptureEngine({
    analyzeText: async () => { throw new Error('text_failed') },
    analyzeAudio: async () => { throw new Error('audio_failed') },
    interpretText: () => ({ nextMoveLabel: 'Confirmar horario' })
  })

  const analysis = await engine.analyzeAudio({
    workspaceId: 'workspace-1',
    artistId: 'artist-1',
    locale: 'es',
    audio: new Blob(['audio']),
    fallbackTranscript: 'Pendiente confirmar horario'
  })

  assert.equal(analysis.method, 'local_parser')
  assert.equal(analysis.result.nextAction.label.value, 'Confirmar horario')
})

test('rethrows audio failure when no fallback transcript exists', async () => {
  const engine = createCaptureEngine({
    analyzeText: async () => smartResult(),
    analyzeAudio: async () => { throw new Error('audio_failed') },
    interpretText: () => ({})
  })

  await assert.rejects(() => engine.analyzeAudio({
    workspaceId: 'workspace-1',
    artistId: 'artist-1',
    locale: 'es',
    audio: new Blob(['audio'])
  }), /audio_failed/)
})

test('local conversion always preserves the original capture as transcript', () => {
  const result = localInterpretationToSmartCapture('raw capture', 'en', { source: 'whatsapp' })
  assert.equal(result.transcript, 'raw capture')
  assert.equal(result.source.value, 'whatsapp')
})
