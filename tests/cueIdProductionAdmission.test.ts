import assert from 'node:assert/strict'
import test from 'node:test'

import {
  defineCueIdProductionCatalogue,
  validateCueIdProductionAdmission,
  type CueIdProductionAdmission
} from '../app/domain/cueIdProductionAdmission.ts'
import type { CueIdProductionManifest } from '../app/domain/cueIdProductionManifest.ts'

function manifest(): CueIdProductionManifest {
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
    }
  }
}

function staticAdmission(): CueIdProductionAdmission {
  return {
    stage: 'static_approved',
    manifest: manifest(),
    evidence: {
      visualReview: true,
      mobileReview: true,
      packageValidation: true
    }
  }
}

function interactiveAdmission(): CueIdProductionAdmission {
  return {
    stage: 'interactive_approved',
    manifest: manifest(),
    evidence: {
      visualReview: true,
      mobileReview: true,
      packageValidation: true,
      performance: {
        full: 800,
        reduced: 1500
      }
    }
  }
}

test('accepts a static-approved manifest without interactive performance evidence', () => {
  assert.deepEqual(validateCueIdProductionAdmission(staticAdmission()), [])
})

test('accepts an interactive-ready asset only with passing tier performance evidence', () => {
  assert.deepEqual(validateCueIdProductionAdmission(interactiveAdmission()), [])
})

test('rejects interactive admission when semantic bindings are incomplete', () => {
  const admission = interactiveAdmission()
  admission.manifest.bindings.poses = {}

  const issues = validateCueIdProductionAdmission(admission)

  assert.ok(issues.some(issue => issue.field === 'interactiveBindings'))
})

test('rejects interactive admission when a supported tier exceeds its ready budget', () => {
  const admission = interactiveAdmission()
  admission.evidence.performance = {
    full: 801,
    reduced: 1500
  }

  const issues = validateCueIdProductionAdmission(admission)

  assert.ok(issues.some(issue => issue.field === 'performance'))
})

test('rejects duplicate family and assetVersion catalogue entries', () => {
  const first = staticAdmission()
  const second = staticAdmission()

  assert.throws(
    () => defineCueIdProductionCatalogue([first, second]),
    /Duplicate CUE ID production catalogue entry/
  )
})

test('empty production catalogue remains valid', () => {
  assert.deepEqual(defineCueIdProductionCatalogue([]), [])
})
