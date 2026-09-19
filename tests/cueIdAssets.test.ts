import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile, stat } from 'node:fs/promises'

import {
  CUE_ID_ASSET_BUDGETS,
  CUE_ID_ASSETS,
  CUE_ID_BENCHMARK_ASSET,
  CUE_ID_CANDIDATE_ASSET,
  CUE_ID_CANDIDATE_ASSETS,
  assertCueIdAsset,
  getCueIdAssetHeadroom,
  validateCueIdAsset,
  type CueIdAssetDescriptor
} from '../app/domain/cueIdAssets.ts'

const validBase: CueIdAssetDescriptor = {
  id: 'club-minimal-base-neutral-v1',
  family: 'club_minimal',
  purpose: 'production',
  artDirection: 'club_minimal_v1',
  kind: 'base',
  glbPath: '/cue-id/club-minimal/base-neutral-v1.glb',
  fallbackPath: '/cue-id/club-minimal/base-neutral-v1.webp',
  compressedBytes: 780_000,
  triangles: 28_000,
  materials: 3,
  textures: [
    { width: 1024, height: 1024, format: 'ktx2' },
    { width: 1024, height: 1024, format: 'ktx2' }
  ],
  supportedTiers: ['full', 'reduced'],
  attribution: null
}

test('accepts a CUE ID base asset within the mobile performance budget', () => {
  assert.deepEqual(validateCueIdAsset(validBase), [])
  assert.equal(assertCueIdAsset(validBase), validBase)
})

test('rejects an oversized CUE ID asset before catalogue admission', () => {
  const issues = validateCueIdAsset({
    ...validBase,
    compressedBytes: CUE_ID_ASSET_BUDGETS.base.maxCompressedBytes + 1,
    triangles: CUE_ID_ASSET_BUDGETS.base.maxTriangles + 1,
    materials: CUE_ID_ASSET_BUDGETS.base.maxMaterials + 1,
    textures: Array.from({ length: CUE_ID_ASSET_BUDGETS.base.maxTextures + 1 }, () => ({
      width: 4096,
      height: 4096,
      format: 'png' as const
    }))
  })

  assert.ok(issues.some(issue => issue.field === 'compressedBytes'))
  assert.ok(issues.some(issue => issue.field === 'triangles'))
  assert.ok(issues.some(issue => issue.field === 'materials'))
  assert.ok(issues.some(issue => issue.field === 'textures'))
  assert.ok(issues.some(issue => issue.field === 'textureDimension'))
})

test('GLB catalogue entries never target the static-only device tier', () => {
  const issues = validateCueIdAsset({
    ...validBase,
    supportedTiers: ['static']
  })

  assert.ok(issues.some(issue => issue.field === 'supportedTiers'))
})


test('benchmark GLB stays outside the selectable CUE ID product catalogue', () => {
  assert.equal(CUE_ID_BENCHMARK_ASSET.id, 'khronos-rigged-figure-benchmark')
  assert.equal(CUE_ID_BENCHMARK_ASSET.compressedBytes, 50_116)
  assert.equal(CUE_ID_ASSETS.some(asset => asset.id === CUE_ID_BENCHMARK_ASSET.id), false)
})


test('production assets must declare Club Minimal V1 art direction', () => {
  const issues = validateCueIdAsset({
    ...validBase,
    artDirection: 'external_benchmark'
  })

  assert.ok(issues.some(issue => issue.message.includes('production assets must use club_minimal_v1')))
})

test('benchmark metadata remains explicit and attributed', () => {
  assert.equal(CUE_ID_BENCHMARK_ASSET.purpose, 'benchmark')
  assert.equal(CUE_ID_BENCHMARK_ASSET.artDirection, 'external_benchmark')
  assert.equal(CUE_ID_BENCHMARK_ASSET.attribution?.creator, 'Cesium')
  assert.equal(CUE_ID_BENCHMARK_ASSET.attribution?.license, 'CC-BY-4.0')
})


test('original Club Minimal candidate remains outside production catalogue until approved', () => {
  assert.equal(CUE_ID_CANDIDATE_ASSET.purpose, 'candidate')
  assert.equal(CUE_ID_CANDIDATE_ASSET.artDirection, 'club_minimal_v1')
  assert.equal(CUE_ID_CANDIDATE_ASSET.compressedBytes, 64_264)
  assert.equal(CUE_ID_CANDIDATE_ASSET.triangles, 4_232)
  assert.equal(CUE_ID_ASSETS.some(asset => asset.id === CUE_ID_CANDIDATE_ASSET.id), false)
  assert.deepEqual(validateCueIdAsset(CUE_ID_CANDIDATE_ASSET), [])
})


test('Club Minimal candidate descriptor matches generated artifact metadata', async () => {
  const metadataRaw = await readFile(
    new URL('../public/cue-id/candidates/club-minimal-candidate-v1.json', import.meta.url),
    'utf8'
  )
  const metadata = JSON.parse(metadataRaw) as {
    bytes: number
    triangles: number
    materials: number
    textures: number
    artDirection: string
    status: string
  }

  const file = await stat(
    new URL('../public/cue-id/candidates/club-minimal-candidate-v1.glb', import.meta.url)
  )

  assert.equal(file.size, CUE_ID_CANDIDATE_ASSET.compressedBytes)
  assert.equal(metadata.bytes, CUE_ID_CANDIDATE_ASSET.compressedBytes)
  assert.equal(metadata.triangles, CUE_ID_CANDIDATE_ASSET.triangles)
  assert.equal(metadata.materials, CUE_ID_CANDIDATE_ASSET.materials)
  assert.equal(metadata.textures, CUE_ID_CANDIDATE_ASSET.textures.length)
  assert.equal(metadata.artDirection, CUE_ID_CANDIDATE_ASSET.artDirection)
  assert.equal(metadata.status, 'candidate_not_production')
})


test('Club Minimal candidate reports substantial quality headroom', () => {
  const headroom = getCueIdAssetHeadroom(CUE_ID_CANDIDATE_ASSET)

  assert.equal(headroom.bytesRemaining, 935_736)
  assert.equal(headroom.trianglesRemaining, 30_768)
  assert.equal(headroom.materialsRemaining, 0)
  assert.equal(headroom.texturesRemaining, 6)
  assert.ok(headroom.byteUsageRatio < 0.07)
  assert.ok(headroom.triangleUsageRatio <= 0.12)
})


test('Club Minimal quality ladder stays inside the universal base budget', () => {
  assert.deepEqual(
    Object.fromEntries(
      Object.entries(CUE_ID_CANDIDATE_ASSETS).map(([quality, asset]) => [
        quality,
        { bytes: asset.compressedBytes, triangles: asset.triangles }
      ])
    ),
    {
      light: { bytes: 64_264, triangles: 4_232 },
      medium: { bytes: 106_688, triangles: 9_168 },
      high: { bytes: 207_336, triangles: 22_176 }
    }
  )

  for (const asset of Object.values(CUE_ID_CANDIDATE_ASSETS)) {
    assert.deepEqual(validateCueIdAsset(asset), [])
  }
})


test('Club Minimal quality descriptors match generated GLB and metadata files', async () => {
  const files = {
    light: {
      json: '../public/cue-id/candidates/club-minimal-candidate-v1.json',
      glb: '../public/cue-id/candidates/club-minimal-candidate-v1.glb'
    },
    medium: {
      json: '../public/cue-id/candidates/club-minimal-candidate-medium-v1.json',
      glb: '../public/cue-id/candidates/club-minimal-candidate-medium-v1.glb'
    },
    high: {
      json: '../public/cue-id/candidates/club-minimal-candidate-high-v1.json',
      glb: '../public/cue-id/candidates/club-minimal-candidate-high-v1.glb'
    }
  } as const

  for (const [quality, paths] of Object.entries(files) as Array<
    [keyof typeof files, (typeof files)[keyof typeof files]]
  >) {
    const metadata = JSON.parse(
      await readFile(new URL(paths.json, import.meta.url), 'utf8')
    ) as {
      id: string
      quality: string
      bytes: number
      triangles: number
      materials: number
      embeddedMaterials: number
      runtimeMaterials: number
      materialStrategy: string
      textures: number
      status: string
    }
    const glb = await stat(new URL(paths.glb, import.meta.url))
    const descriptor = CUE_ID_CANDIDATE_ASSETS[quality]

    assert.equal(metadata.quality, quality)
    assert.equal(metadata.id, descriptor.id)
    assert.equal(glb.size, descriptor.compressedBytes)
    assert.equal(metadata.bytes, descriptor.compressedBytes)
    assert.equal(metadata.triangles, descriptor.triangles)
    assert.equal(metadata.materials, descriptor.materials)
    assert.equal(metadata.embeddedMaterials, 4)
    assert.equal(metadata.runtimeMaterials, 4)
    assert.equal(metadata.materialStrategy, 'embedded_shared_pbr_mutated_runtime')
    assert.equal(metadata.textures, descriptor.textures.length)
    assert.equal(metadata.status, 'candidate_not_production')
  }
})
