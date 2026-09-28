import assert from 'node:assert/strict'
import test from 'node:test'

import { decideCueIdRuntime } from '../app/domain/cueIdRuntime.ts'

const base = {
  saveData: false,
  deviceMemoryGb: 8,
  viewportWidth: 1440,
  webglAvailable: true,
  reducedMotion: false
}

test('full tier uses interactive runtime with capped DPR', () => {
  const result = decideCueIdRuntime(base)

  assert.equal(result.tier, 'full')
  assert.equal(result.shouldLoadRuntime, true)
  assert.equal(result.dprCap, 1.5)
  assert.equal(result.continuousIdle, true)
})

test('mobile viewport gets reduced interactive tier', () => {
  const result = decideCueIdRuntime({ ...base, viewportWidth: 390 })

  assert.equal(result.tier, 'reduced')
  assert.equal(result.dprCap, 1)
  assert.equal(result.continuousIdle, false)
  assert.equal(result.reason, 'reduced_viewport')
})

test('moderate-memory device gets reduced tier before viewport rules', () => {
  const result = decideCueIdRuntime({ ...base, deviceMemoryGb: 4 })

  assert.equal(result.tier, 'reduced')
  assert.equal(result.reason, 'reduced_memory')
})

test('Save-Data forces static fallback', () => {
  const result = decideCueIdRuntime({ ...base, saveData: true })

  assert.equal(result.tier, 'static')
  assert.equal(result.shouldLoadRuntime, false)
  assert.equal(result.reason, 'save_data')
})

test('2 GB or lower memory forces static fallback', () => {
  const result = decideCueIdRuntime({ ...base, deviceMemoryGb: 2 })

  assert.equal(result.tier, 'static')
  assert.equal(result.shouldLoadRuntime, false)
  assert.equal(result.reason, 'low_memory')
})

test('missing WebGL forces static fallback', () => {
  const result = decideCueIdRuntime({ ...base, webglAvailable: false })

  assert.equal(result.tier, 'static')
  assert.equal(result.shouldLoadRuntime, false)
  assert.equal(result.reason, 'webgl_unavailable')
})

test('reduced motion disables continuous idle without disabling full tier', () => {
  const result = decideCueIdRuntime({ ...base, reducedMotion: true })

  assert.equal(result.tier, 'full')
  assert.equal(result.shouldLoadRuntime, true)
  assert.equal(result.continuousIdle, false)
})


test('WebGL capability probe rejects experimental fallback paths', async () => {
  const source = await import('node:fs/promises')
  const runtime = await source.readFile(
    new URL('../app/domain/cueIdRuntime.ts', import.meta.url),
    'utf8'
  )

  assert.match(runtime, /failIfMajorPerformanceCaveat:\s*true/)
  assert.match(runtime, /getContext\('webgl2'/)
  assert.match(runtime, /getContext\('webgl'/)
  assert.doesNotMatch(runtime, /experimental-webgl/)
})
