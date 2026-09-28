import assert from 'node:assert/strict'
import test from 'node:test'

import {
  DEFAULT_CUE_ID_CREATOR_CONFIG
} from '../app/domain/cueIdCreator.ts'
import {
  isCueIdCreator3dReady,
  resolveCueIdCreator3dBindings,
  validateCueIdCreator3dBindings
} from '../app/domain/cueIdCreator3dBindings.ts'
import type { CueIdProductionManifest } from '../app/domain/cueIdProductionManifest.ts'
import { listCueIdRequiredStaticVariantKeys } from '../app/domain/cueIdStaticVariants.ts'

function manifest(): CueIdProductionManifest {
  const capabilities: CueIdProductionManifest['capabilities'] = {
    bases: ['feminine', 'masculine', 'neutral'],
    builds: ['slim', 'regular', 'strong'],
    outfits: ['tee'],
    accessories: [null],
    poses: ['neutral', 'relaxed', 'focused', 'editorial'],
    materials: ['matte'],
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
    assetVersion: '3.0.0-test',
    glbPath: '/cue-id/production/club-minimal-v3.glb',
    static: { variants },
    metrics: {
      compressedBytes: 760_000,
      triangles: 28_000,
      materials: 4,
      textures: 4,
      largestTextureDimension: 1024
    },
    supportedTiers: ['full', 'reduced'],
    capabilities,
    bindings: {
      creator: {
        capabilities: {
          skins: ['skin-03', 'skin-05'],
          faces: ['face-03', 'face-04'],
          hairs: ['textured-crop', 'locs'],
          facialHair: ['none', 'short-beard'],
          tops: ['oversized-tee', 'bomber'],
          bottoms: ['wide-trouser', 'cargo'],
          footwear: ['technical-sneaker', 'boot']
        },
        faces: {
          'face-04': 'cue_face_04'
        },
        skins: {
          'skin-03': '#b9805f',
          'skin-05': '#67402f'
        },
        hairs: {
          'textured-crop': ['cue_hair_textured_crop'],
          locs: ['cue_hair_locs']
        },
        facialHair: {
          'short-beard': ['cue_facial_short_beard']
        },
        tops: {
          'oversized-tee': ['cue_top_oversized_tee'],
          bomber: ['cue_top_bomber']
        },
        bottoms: {
          'wide-trouser': ['cue_bottom_wide_trouser'],
          cargo: ['cue_bottom_cargo']
        },
        footwear: {
          'technical-sneaker': ['cue_footwear_technical_sneaker'],
          boot: ['cue_footwear_boot']
        }
      }
    }
  }
}

test('creator 3D bindings can describe a narrow authored slice', () => {
  const value = manifest()

  assert.deepEqual(validateCueIdCreator3dBindings(value), [])
  assert.equal(isCueIdCreator3dReady(value), true)
})

test('reference face resolves without a face morph', () => {
  const resolved = resolveCueIdCreator3dBindings(
    DEFAULT_CUE_ID_CREATOR_CONFIG,
    manifest()
  )

  assert.deepEqual(resolved?.morphs, [])
  assert.deepEqual(resolved?.hairNodes, ['cue_hair_textured_crop'])
  assert.deepEqual(resolved?.topNodes, ['cue_top_oversized_tee'])
  assert.deepEqual(resolved?.bottomNodes, ['cue_bottom_wide_trouser'])
  assert.deepEqual(resolved?.footwearNodes, ['cue_footwear_technical_sneaker'])
  assert.equal(resolved?.skinColor, '#b9805f')
})

test('creator 3D bindings resolve authored face and visible parts', () => {
  const resolved = resolveCueIdCreator3dBindings({
    ...DEFAULT_CUE_ID_CREATOR_CONFIG,
    skin: 'skin-05',
    face: 'face-04',
    hair: 'locs',
    facialHair: 'short-beard',
    top: 'bomber',
    bottom: 'cargo',
    footwear: 'boot'
  }, manifest())

  assert.deepEqual(resolved?.morphs, [{ name: 'cue_face_04', weight: 1 }])
  assert.deepEqual(resolved?.hairNodes, ['cue_hair_locs'])
  assert.deepEqual(resolved?.facialHairNodes, ['cue_facial_short_beard'])
  assert.deepEqual(resolved?.topNodes, ['cue_top_bomber'])
  assert.deepEqual(resolved?.bottomNodes, ['cue_bottom_cargo'])
  assert.deepEqual(resolved?.footwearNodes, ['cue_footwear_boot'])
  assert.equal(resolved?.skinColor, '#67402f')
})

test('creator 3D resolver rejects config outside authored capabilities', () => {
  const resolved = resolveCueIdCreator3dBindings({
    ...DEFAULT_CUE_ID_CREATOR_CONFIG,
    hair: 'long-natural'
  }, manifest())

  assert.equal(resolved, null)
})

test('creator 3D validation rejects declared parts without bindings', () => {
  const value = manifest()
  delete value.bindings.creator?.hairs?.['locs']

  assert.ok(
    validateCueIdCreator3dBindings(value)
      .some(issue => issue.field === 'hair')
  )
})
