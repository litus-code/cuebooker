import assert from 'node:assert/strict'
import test from 'node:test'

import { DEFAULT_CUE_ID_CONFIG } from '../app/domain/cueId.ts'
import {
  getCueIdCreatorAssetStatus,
  getCueIdCreatorAssetStatusForConfig
} from '../app/domain/cueIdCreatorAssetStatus.ts'
import type { CueIdProductionAdmission } from '../app/domain/cueIdProductionAdmission.ts'
import { listCueIdRequiredStaticVariantKeys } from '../app/domain/cueIdStaticVariants.ts'

function admission(
  stage: CueIdProductionAdmission['stage'],
  version: string,
  performance?: { full?: number; reduced?: number }
): CueIdProductionAdmission {
  return {
    stage,
    manifest: {
      assetVersion: version
    },
    evidence: {
      visualReview: true,
      mobileReview: true,
      packageValidation: true,
      performance
    }
  } as CueIdProductionAdmission
}

test('creator asset status reports lab candidate when production catalogue is empty', () => {
  assert.deepEqual(getCueIdCreatorAssetStatus([]), {
    source: 'lab_candidate',
    assetVersion: null,
    visualReview: false,
    mobileReview: false,
    packageValidation: false,
    performanceReady: false
  })
})

test('creator asset status reports static-approved authored asset', () => {
  const status = getCueIdCreatorAssetStatus([
    admission('static_approved', '2.0.0')
  ])

  assert.equal(status.source, 'production_static')
  assert.equal(status.assetVersion, '2.0.0')
  assert.equal(status.visualReview, true)
  assert.equal(status.mobileReview, true)
  assert.equal(status.packageValidation, true)
  assert.equal(status.performanceReady, false)
})

test('creator asset status reports interactive readiness only with both tier measurements', () => {
  const incomplete = getCueIdCreatorAssetStatus([
    admission('interactive_approved', '2.0.0', { full: 700 })
  ])
  const complete = getCueIdCreatorAssetStatus([
    admission('interactive_approved', '2.0.1', { full: 700, reduced: 1200 })
  ])

  assert.equal(incomplete.source, 'production_interactive')
  assert.equal(incomplete.performanceReady, false)
  assert.equal(complete.source, 'production_interactive')
  assert.equal(complete.performanceReady, true)
})

test('creator asset status uses the latest semantic asset version', () => {
  const status = getCueIdCreatorAssetStatus([
    admission('static_approved', '2.2.0'),
    admission('interactive_approved', '2.10.0', { full: 700, reduced: 1200 }),
    admission('static_approved', '2.9.0')
  ])

  assert.equal(status.assetVersion, '2.10.0')
  assert.equal(status.source, 'production_interactive')
})


function staticTeeAdmission(): CueIdProductionAdmission {
  const capabilities = {
    bases: ['feminine', 'masculine', 'neutral'],
    builds: ['slim', 'regular', 'strong'],
    outfits: ['tee'],
    accessories: [null],
    poses: ['neutral', 'relaxed', 'focused', 'editorial'],
    materials: ['matte'],
    accents: ['lime']
  } as const

  const variants = Object.fromEntries(
    listCueIdRequiredStaticVariantKeys({
      bases: [...capabilities.bases],
      builds: [...capabilities.builds],
      outfits: [...capabilities.outfits],
      accessories: [...capabilities.accessories],
      poses: [...capabilities.poses],
      materials: [...capabilities.materials],
      accents: [...capabilities.accents]
    }).map(key => [
      key,
      {
        portrait: `/cue-id/production/static/2.0.0/${key}-portrait.webp`,
        square: `/cue-id/production/static/2.0.0/${key}-square.webp`
      }
    ])
  )

  return {
    stage: 'static_approved',
    manifest: {
      manifestVersion: 1,
      family: 'club_minimal',
      assetVersion: '2.0.0',
      glbPath: '/cue-id/production/cue-id-club-minimal-2.0.0.glb',
      static: { variants },
      metrics: {
        compressedBytes: 650_000,
        triangles: 24_000,
        materials: 4,
        textures: 3,
        largestTextureDimension: 1024
      },
      supportedTiers: ['full', 'reduced'],
      capabilities,
      bindings: {}
    },
    evidence: {
      visualReview: true,
      mobileReview: true,
      packageValidation: true
    }
  } as CueIdProductionAdmission
}

test('creator uses production only when the selected configuration is actually covered', () => {
  const admission = staticTeeAdmission()

  const teeStatus = getCueIdCreatorAssetStatusForConfig(
    DEFAULT_CUE_ID_CONFIG,
    [admission]
  )
  const hoodieStatus = getCueIdCreatorAssetStatusForConfig(
    { ...DEFAULT_CUE_ID_CONFIG, outfit: 'hoodie' },
    [admission]
  )

  assert.equal(teeStatus.source, 'production_static')
  assert.equal(teeStatus.assetVersion, '2.0.0')
  assert.equal(hoodieStatus.source, 'lab_candidate')
  assert.equal(hoodieStatus.assetVersion, null)
})
