import assert from 'node:assert/strict'
import test from 'node:test'

import { DEFAULT_CUE_ID_CONFIG } from '../app/domain/cueId.ts'
import { resolveCueIdAsset } from '../app/domain/cueIdAssetResolver.ts'
import type { CueIdProductionAdmission } from '../app/domain/cueIdProductionAdmission.ts'
import type { CueIdProductionManifest } from '../app/domain/cueIdProductionManifest.ts'

function manifest(overrides: Partial<CueIdProductionManifest> = {}): CueIdProductionManifest {
  return {
    manifestVersion: 1,
    family: 'club_minimal',
    assetVersion: '2.0.0',
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
      materials: ['matte', 'satin'],
      accents: ['lime', 'red', null]
    },
    bindings: {
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
    },
    ...overrides
  }
}

function admission(
  stage: CueIdProductionAdmission['stage'] = 'interactive_approved',
  manifestOverrides: Partial<CueIdProductionManifest> = {}
): CueIdProductionAdmission {
  return {
    stage,
    manifest: manifest(manifestOverrides),
    evidence: {
      visualReview: true,
      mobileReview: true,
      packageValidation: true,
      ...(stage === 'interactive_approved'
        ? {
            performance: {
              full: 800,
              reduced: 1500
            }
          }
        : {})
    }
  }
}

test('returns null while no production manifests exist', () => {
  assert.equal(resolveCueIdAsset(DEFAULT_CUE_ID_CONFIG, 'full', []), null)
})

test('resolves an interactive-approved asset for a supported full tier config', () => {
  const result = resolveCueIdAsset(DEFAULT_CUE_ID_CONFIG, 'full', [admission()])

  assert.equal(result?.representation, 'interactive')
  assert.equal(result?.manifest.assetVersion, '2.0.0')
  assert.equal(result?.staticPath, '/cue-id/production/club-minimal-v2-portrait.webp')
})

test('resolves the same identity as static representation for static tier', () => {
  const result = resolveCueIdAsset(DEFAULT_CUE_ID_CONFIG, 'static', [admission()])

  assert.equal(result?.representation, 'static')
  assert.equal(result?.staticPath, '/cue-id/production/club-minimal-v2-portrait.webp')
})

test('rejects manifests that do not support the selected semantic config', () => {
  const unsupported = admission('interactive_approved', {
    capabilities: {
      ...manifest().capabilities,
      bases: ['masculine', 'neutral']
    }
  })

  const feminineConfig = { ...DEFAULT_CUE_ID_CONFIG, base: 'feminine' as const }

  assert.equal(resolveCueIdAsset(feminineConfig, 'full', [unsupported]), null)
})

test('ignores invalid manifests even when semantic capabilities match', () => {
  const invalid = admission('interactive_approved', {
    metrics: {
      ...manifest().metrics,
      triangles: 40_000
    }
  })

  assert.equal(resolveCueIdAsset(DEFAULT_CUE_ID_CONFIG, 'full', [invalid]), null)
})

test('prefers the newest compatible assetVersion', () => {
  const result = resolveCueIdAsset(DEFAULT_CUE_ID_CONFIG, 'full', [
    admission('interactive_approved', { assetVersion: '2.0.0' }),
    admission('interactive_approved', { assetVersion: '2.1.0', glbPath: '/cue-id/production/club-minimal-v2-1.glb' })
  ])

  assert.equal(result?.manifest.assetVersion, '2.1.0')
})


test('keeps static-approved assets static even when their bindings are complete', () => {
  const result = resolveCueIdAsset(
    DEFAULT_CUE_ID_CONFIG,
    'full',
    [admission('static_approved')]
  )

  assert.equal(result?.representation, 'static')
  assert.equal(result?.staticPath, '/cue-id/production/club-minimal-v2-portrait.webp')
})

test('ignores invalid interactive admissions', () => {
  const invalid = admission('interactive_approved')
  invalid.evidence.performance = {
    full: 801,
    reduced: 1500
  }

  assert.equal(resolveCueIdAsset(DEFAULT_CUE_ID_CONFIG, 'full', [invalid]), null)
})
