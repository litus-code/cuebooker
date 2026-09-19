import assert from 'node:assert/strict'
import test from 'node:test'

import {
  CUE_ID_ASSET_BUDGETS,
  assertCueIdAsset,
  validateCueIdAsset,
  type CueIdAssetDescriptor
} from '../app/domain/cueIdAssets.ts'

const validBase: CueIdAssetDescriptor = {
  id: 'club-minimal-base-neutral-v1',
  family: 'club_minimal',
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
  supportedTiers: ['full', 'reduced']
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
