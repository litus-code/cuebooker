import assert from 'node:assert/strict'
import test from 'node:test'

import {
  assertCueIdProductionManifest,
  validateCueIdProductionManifest,
  type CueIdProductionManifest
} from '../app/domain/cueIdProductionManifest.ts'

function createManifest(): CueIdProductionManifest {
  return {
    manifestVersion: 1,
    family: 'club_minimal',
    assetVersion: 'v2-test',
    glbPath: '/cue-id/production/club-minimal-v2.glb',
    static: {
      portrait: '/cue-id/production/club-minimal-v2-portrait.webp',
      square: '/cue-id/production/club-minimal-v2-square.webp'
    },
    metrics: {
      compressedBytes: 650_000,
      triangles: 24_000,
      materials: 4,
      textures: 3,
      largestTextureDimension: 1024
    },
    supportedTiers: ['full', 'reduced'],
    capabilities: {
      bases: ['feminine', 'masculine', 'neutral'],
      builds: ['slim', 'regular', 'strong'],
      outfits: ['tee'],
      accessories: [null],
      poses: ['neutral', 'relaxed', 'focused', 'editorial'],
      materials: ['matte'],
      accents: ['lime', 'red', null]
    },
    bindings: {}
  }
}

test('accepts a V2-ready production manifest inside the asset budget', () => {
  const manifest = createManifest()

  assert.deepEqual(validateCueIdProductionManifest(manifest), [])
  assert.equal(assertCueIdProductionManifest(manifest), manifest)
})

test('separates static-valid manifests from interactive binding readiness', async () => {
  const { isCueIdProductionInteractiveReady } = await import('../app/domain/cueIdProductionManifest.ts')
  const manifest = createManifest()

  assert.equal(isCueIdProductionInteractiveReady(manifest), false)

  manifest.bindings = {
    morphs: {
      'base.feminine': 'base_feminine',
      'base.masculine': 'base_masculine',
      'build.slim': 'build_slim',
      'build.strong': 'build_strong'
    },
    poses: {
      neutral: 'pose_neutral',
      relaxed: 'pose_relaxed',
      focused: 'pose_focused',
      editorial: 'pose_editorial'
    },
    outfits: {
      tee: ['outfit_tee']
    },
    materials: {
      body: 'material_body',
      textile: 'material_textile'
    }
  }

  assert.equal(isCueIdProductionInteractiveReady(manifest), true)
})

test('rejects manifests that do not expose all three first-class bases', () => {
  const manifest = createManifest()
  manifest.capabilities.bases = ['masculine', 'neutral']

  const issues = validateCueIdProductionManifest(manifest)

  assert.ok(issues.some(issue => issue.field === 'capabilities'))
})

test('rejects manifests that exceed the production base budget', () => {
  const manifest = createManifest()
  manifest.metrics.triangles = 35_001

  const issues = validateCueIdProductionManifest(manifest)

  assert.ok(issues.some(issue => issue.field === 'metrics'))
})

test('rejects external asset paths', () => {
  const manifest = createManifest()
  manifest.glbPath = 'https://example.com/model.glb'

  const issues = validateCueIdProductionManifest(manifest)

  assert.ok(issues.some(issue => issue.field === 'glbPath'))
})
