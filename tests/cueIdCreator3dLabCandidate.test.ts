import assert from 'node:assert/strict'
import test from 'node:test'

import { DEFAULT_CUE_ID_CONFIG } from '../app/domain/cueId.ts'
import { DEFAULT_CUE_ID_CREATOR_CONFIG } from '../app/domain/cueIdCreator.ts'
import { resolveCueIdCreator3dLabCandidate } from '../app/domain/cueIdCreator3dLabCandidate.ts'
import type { CueIdProductionManifest } from '../app/domain/cueIdProductionManifest.ts'

function manifest(): CueIdProductionManifest {
  return {
    manifestVersion: 1,
    family: 'club_minimal',
    assetVersion: '3.0.0-lab',
    glbPath: '/cue-id/lab/creator-v1.glb',
    static: { variants: {} },
    metrics: {
      compressedBytes: 700_000,
      triangles: 26_000,
      materials: 4,
      textures: 3,
      largestTextureDimension: 1024
    },
    supportedTiers: ['full', 'reduced'],
    capabilities: {
      bases: ['neutral'],
      builds: ['regular'],
      outfits: ['tee'],
      accessories: [null],
      poses: ['neutral', 'relaxed'],
      materials: ['matte'],
      accents: ['lime']
    },
    bindings: {
      poses: {
        neutral: 'cue_pose_neutral',
        relaxed: 'cue_pose_relaxed'
      },
      outfits: {
        tee: ['cue_top_oversized_tee']
      },
      materials: {
        body: 'cue_mat_body',
        textile: 'cue_mat_textile'
      },
      creator: {
        capabilities: {
          skins: ['skin-03', 'skin-05'],
          faces: ['face-03', 'face-04'],
          hairs: ['textured-crop', 'curly-crop', 'locs'],
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
          'curly-crop': ['cue_hair_curly_crop'],
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

test('authored lab candidate resolves only when current creator config is covered', () => {
  const candidate = manifest()

  assert.equal(
    resolveCueIdCreator3dLabCandidate(
      DEFAULT_CUE_ID_CREATOR_CONFIG,
      DEFAULT_CUE_ID_CONFIG,
      candidate
    ),
    candidate
  )

  assert.equal(
    resolveCueIdCreator3dLabCandidate(
      {
        ...DEFAULT_CUE_ID_CREATOR_CONFIG,
        hair: 'long-natural'
      },
      DEFAULT_CUE_ID_CONFIG,
      candidate
    ),
    null
  )
})

test('authored lab candidate does not require production-wide manifest readiness', () => {
  const candidate = manifest()

  assert.deepEqual(candidate.static.variants, {})
  assert.equal(candidate.capabilities.bases.length, 1)
  assert.equal(
    resolveCueIdCreator3dLabCandidate(
      DEFAULT_CUE_ID_CREATOR_CONFIG,
      DEFAULT_CUE_ID_CONFIG,
      candidate
    )?.assetVersion,
    '3.0.0-lab'
  )
})
