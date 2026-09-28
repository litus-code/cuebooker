import assert from 'node:assert/strict'
import test from 'node:test'

import type { CueIdAssetDescriptor } from '../app/domain/cueIdAssets.ts'
import {
  CueIdAssetLoadError,
  loadCueIdGlbBuffer
} from '../app/services/cueIdAssetLoader.ts'

const asset: CueIdAssetDescriptor = {
  id: 'benchmark-base',
  family: 'club_minimal',
  kind: 'base',
  glbPath: 'https://example.test/benchmark.glb',
  fallbackPath: null,
  compressedBytes: 64,
  triangles: 1_000,
  materials: 1,
  textures: [],
  supportedTiers: ['full', 'reduced']
}

function createGlb(totalBytes = 20) {
  const bytes = new Uint8Array(totalBytes)
  const view = new DataView(bytes.buffer)
  view.setUint32(0, 0x46546c67, true)
  view.setUint32(4, 2, true)
  view.setUint32(8, totalBytes, true)
  return bytes
}

test('loads and validates a bounded GLB v2 payload', async () => {
  const bytes = createGlb()
  const fetchImpl: typeof fetch = async () => new Response(bytes, {
    status: 200,
    headers: { 'content-length': String(bytes.byteLength) }
  })

  const result = await loadCueIdGlbBuffer(asset, { fetchImpl })

  assert.equal(result.bytes, bytes.byteLength)
  assert.equal(result.declaredBytes, bytes.byteLength)
  assert.equal(result.version, 2)
  assert.ok(result.loadMs >= 0)
})

test('rejects content-length above the catalogue budget before parsing', async () => {
  const bytes = createGlb()
  const fetchImpl: typeof fetch = async () => new Response(bytes, {
    status: 200,
    headers: { 'content-length': '65' }
  })

  await assert.rejects(
    () => loadCueIdGlbBuffer(asset, { fetchImpl }),
    (error: unknown) => error instanceof CueIdAssetLoadError && error.code === 'asset_too_large'
  )
})

test('rejects invalid GLB magic/version', async () => {
  const bytes = createGlb()
  new DataView(bytes.buffer).setUint32(0, 0x12345678, true)
  const fetchImpl: typeof fetch = async () => new Response(bytes, { status: 200 })

  await assert.rejects(
    () => loadCueIdGlbBuffer(asset, { fetchImpl }),
    (error: unknown) => error instanceof CueIdAssetLoadError && error.code === 'asset_invalid_glb'
  )
})

test('rejects a GLB whose declared length does not match the received payload', async () => {
  const bytes = createGlb()
  new DataView(bytes.buffer).setUint32(8, bytes.byteLength + 4, true)
  const fetchImpl: typeof fetch = async () => new Response(bytes, { status: 200 })

  await assert.rejects(
    () => loadCueIdGlbBuffer(asset, { fetchImpl }),
    (error: unknown) => error instanceof CueIdAssetLoadError && error.code === 'asset_length_mismatch'
  )
})

test('rejects HTTP failures with a stable loader error', async () => {
  const fetchImpl: typeof fetch = async () => new Response(null, { status: 404 })

  await assert.rejects(
    () => loadCueIdGlbBuffer(asset, { fetchImpl }),
    (error: unknown) => error instanceof CueIdAssetLoadError && error.code === 'asset_http_error'
  )
})
