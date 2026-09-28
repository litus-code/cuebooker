import assert from 'node:assert/strict'
import test from 'node:test'

import { resolveVoiceCaptureMode } from '../app/services/voiceCaptureMode.ts'

test('prefers recorder when recorder and speech recognition are both available', () => {
  assert.equal(resolveVoiceCaptureMode(true, true), 'recorder')
})

test('falls back to speech recognition when recorder is unavailable', () => {
  assert.equal(resolveVoiceCaptureMode(false, true), 'speech')
})

test('reports no voice mode when neither capability exists', () => {
  assert.equal(resolveVoiceCaptureMode(false, false), 'none')
})
