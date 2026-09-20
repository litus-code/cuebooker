import assert from 'node:assert/strict'
import test from 'node:test'

import { getCueIdCreatorAssetStatus } from '../app/domain/cueIdCreatorAssetStatus.ts'
import type { CueIdProductionAdmission } from '../app/domain/cueIdProductionAdmission.ts'

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
