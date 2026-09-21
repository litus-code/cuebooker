import assert from 'node:assert/strict'
import test from 'node:test'

import { DEFAULT_CUE_ID_CONFIG } from '../app/domain/cueId.ts'
import { resolveCueIdProductionBindings } from '../app/domain/cueIdProductionBindings.ts'
import type { CueIdProductionManifest } from '../app/domain/cueIdProductionManifest.ts'
import { listCueIdRequiredStaticVariantKeys } from '../app/domain/cueIdStaticVariants.ts'

function manifest(): CueIdProductionManifest {
  const capabilities: CueIdProductionManifest['capabilities'] = {
    bases: ['feminine', 'masculine', 'neutral'],
    builds: ['slim', 'regular', 'strong'],
    outfits: ['tee'],
    accessories: [null, 'glasses'],
    poses: ['neutral', 'relaxed', 'focused', 'editorial'],
    materials: ['matte', 'satin'],
    accents: ['lime', 'red', null]
  }

  const variants = Object.fromEntries(
    listCueIdRequiredStaticVariantKeys(capabilities).map(key => [
      key,
      {
        portrait: `/cue-id/production/static/${key}-portrait.webp`,
        square: `/cue-id/production/static/${key}-square.webp`
      }
    ])
  ) as CueIdProductionManifest['static']['variants']

  return {
    manifestVersion: 1,
    family: 'club_minimal',
    assetVersion: '2.0.0',
    glbPath: '/cue-id/production/club-minimal-v2.glb',
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
      accessories: {
        glasses: ['accessory_glasses']
      },
      materials: {
        body: 'material_body',
        textile: 'material_textile',
        technical: 'material_technical',
        accent: 'material_accent'
      }
    }
  }
}

test('resolves neutral regular reference state without unnecessary morphs', () => {
  const result = resolveCueIdProductionBindings(DEFAULT_CUE_ID_CONFIG, manifest())

  assert.deepEqual(result?.morphs, [])
  assert.equal(result?.poseClip, 'pose_neutral')
  assert.deepEqual(result?.outfitNodes, ['outfit_tee'])
})

test('resolves authored base and build morph bindings', () => {
  const config = {
    ...DEFAULT_CUE_ID_CONFIG,
    base: 'feminine' as const,
    build: 'strong' as const,
    pose: 'editorial' as const
  }

  const result = resolveCueIdProductionBindings(config, manifest())

  assert.deepEqual(result?.morphs, [
    { name: 'base_feminine', weight: 1 },
    { name: 'build_strong', weight: 1 }
  ])
  assert.equal(result?.poseClip, 'pose_editorial')
})

test('resolves accessory nodes only when selected', () => {
  const withGlasses = {
    ...DEFAULT_CUE_ID_CONFIG,
    accessory: 'glasses' as const
  }

  assert.deepEqual(
    resolveCueIdProductionBindings(withGlasses, manifest())?.accessoryNodes,
    ['accessory_glasses']
  )
  assert.deepEqual(
    resolveCueIdProductionBindings(DEFAULT_CUE_ID_CONFIG, manifest())?.accessoryNodes,
    []
  )
})

test('returns null for manifests that are not interactive-ready', () => {
  const incomplete = manifest()
  incomplete.bindings.poses = {}

  assert.equal(resolveCueIdProductionBindings(DEFAULT_CUE_ID_CONFIG, incomplete), null)
})

test('returns null when a selected accessory has no authored binding', () => {
  const incomplete = manifest()
  incomplete.bindings.accessories = {}

  const config = {
    ...DEFAULT_CUE_ID_CONFIG,
    accessory: 'glasses' as const
  }

  assert.equal(resolveCueIdProductionBindings(config, incomplete), null)
})


test('partial authored lab bindings can resolve the selected state without production-wide readiness', () => {
  const partial = manifest()
  partial.bindings.morphs = {}
  partial.bindings.poses = { neutral: 'pose_neutral' }
  partial.bindings.outfits = { tee: ['outfit_tee'] }
  partial.bindings.materials = {
    body: 'material_body',
    textile: 'material_textile'
  }

  assert.equal(
    resolveCueIdProductionBindings(DEFAULT_CUE_ID_CONFIG, partial),
    null
  )

  const resolved = resolveCueIdProductionBindings(
    DEFAULT_CUE_ID_CONFIG,
    partial,
    { allowPartial: true }
  )

  assert.equal(resolved?.poseClip, 'pose_neutral')
  assert.deepEqual(resolved?.outfitNodes, ['outfit_tee'])
})
