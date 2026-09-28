import assert from 'node:assert/strict'
import test from 'node:test'

import { assessCueIdV2Intake } from '../scripts/lib/cue-id-intake-assessor.mjs'

function createSyntheticGlb() {
  const gltf = {
    asset: { version: '2.0' },
    accessors: [{ count: 6 }, { count: 6 }],
    nodes: [
      { name: 'Root', mesh: 0 },
      { name: 'outfit_tee' }
    ],
    meshes: [
      {
        name: 'Body',
        extras: {
          targetNames: ['base_feminine', 'base_masculine', 'build_slim', 'build_strong']
        },
        primitives: [
          {
            attributes: { POSITION: 0 },
            indices: 1,
            targets: [
              { POSITION: 0 },
              { POSITION: 0 },
              { POSITION: 0 },
              { POSITION: 0 }
            ]
          }
        ]
      }
    ],
    materials: [
      { name: 'material_body' },
      { name: 'material_textile' }
    ],
    animations: [
      { name: 'pose_neutral', channels: [], samplers: [] },
      { name: 'pose_relaxed', channels: [], samplers: [] },
      { name: 'pose_focused', channels: [], samplers: [] },
      { name: 'pose_editorial', channels: [], samplers: [] }
    ],
    textures: [],
    scenes: [{ nodes: [0, 1] }],
    scene: 0
  }

  let json = Buffer.from(JSON.stringify(gltf), 'utf8')
  const jsonPadding = (4 - (json.length % 4)) % 4
  if (jsonPadding) json = Buffer.concat([json, Buffer.alloc(jsonPadding, 0x20)])

  const bin = Buffer.alloc(4)
  const totalLength = 12 + 8 + json.length + 8 + bin.length
  const buffer = Buffer.alloc(totalLength)

  buffer.writeUInt32LE(0x46546c67, 0)
  buffer.writeUInt32LE(2, 4)
  buffer.writeUInt32LE(totalLength, 8)

  let offset = 12
  buffer.writeUInt32LE(json.length, offset)
  buffer.writeUInt32LE(0x4e4f534a, offset + 4)
  json.copy(buffer, offset + 8)
  offset += 8 + json.length

  buffer.writeUInt32LE(bin.length, offset)
  buffer.writeUInt32LE(0x004e4942, offset + 4)
  bin.copy(buffer, offset + 8)

  return buffer
}

function createManifest(bytes) {
  const capabilities = {
    bases: ['feminine', 'masculine', 'neutral'],
    builds: ['slim', 'regular', 'strong'],
    outfits: ['tee'],
    accessories: [null],
    poses: ['neutral', 'relaxed', 'focused', 'editorial'],
    materials: ['matte'],
    accents: ['lime', 'red', null]
  }

  const variants = {}
  for (const base of capabilities.bases) {
    for (const build of capabilities.builds) {
      for (const outfit of capabilities.outfits) {
        for (const accessory of capabilities.accessories) {
          for (const pose of capabilities.poses) {
            for (const material of capabilities.materials) {
              for (const accent of capabilities.accents) {
                const key = [
                  base,
                  build,
                  outfit,
                  accessory ?? 'none',
                  pose,
                  material,
                  accent ?? 'none'
                ].join('__')
                variants[key] = {
                  portrait: `/cue-id/production/static/2.0.0/${key}-portrait.webp`,
                  square: `/cue-id/production/static/2.0.0/${key}-square.webp`
                }
              }
            }
          }
        }
      }
    }
  }

  return {
    manifestVersion: 1,
    family: 'club_minimal',
    assetVersion: '2.0.0',
    glbPath: '/cue-id/production/club-minimal-v2.glb',
    static: { variants },
    metrics: {
      compressedBytes: bytes,
      triangles: 2,
      materials: 2,
      textures: 0,
      largestTextureDimension: 0
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
      accessories: {},
      materials: {
        body: 'material_body',
        textile: 'material_textile'
      }
    }
  }
}

test('reports package invalid before review/admission status matters', () => {
  const glb = createSyntheticGlb()
  const manifest = createManifest(glb.length)
  manifest.metrics.triangles = 99

  const result = assessCueIdV2Intake(glb, manifest, { assetVersion: '2.0.0' })

  assert.equal(result.summary, 'package_invalid')
  assert.equal(result.package.ready, false)
  assert.equal(result.static.ready, false)
  assert.equal(result.interactive.ready, false)
})

test('reports review pending for a valid package without human evidence', () => {
  const glb = createSyntheticGlb()
  const manifest = createManifest(glb.length)

  const result = assessCueIdV2Intake(glb, manifest, { assetVersion: '2.0.0' })

  assert.equal(result.summary, 'package_valid_review_pending')
  assert.equal(result.package.ready, true)
  assert.equal(result.static.ready, false)
})

test('reports static ready while interactive performance evidence is pending', () => {
  const glb = createSyntheticGlb()
  const manifest = createManifest(glb.length)

  const result = assessCueIdV2Intake(glb, manifest, {
    assetVersion: '2.0.0',
    visualReview: true,
    mobileReview: true
  })

  assert.equal(result.summary, 'static_ready_interactive_pending')
  assert.equal(result.static.ready, true)
  assert.equal(result.interactive.ready, false)
})

test('reports interactive ready only with passing review and performance evidence', () => {
  const glb = createSyntheticGlb()
  const manifest = createManifest(glb.length)

  const result = assessCueIdV2Intake(glb, manifest, {
    assetVersion: '2.0.0',
    visualReview: true,
    mobileReview: true,
    performance: {
      full: 800,
      reduced: 1500
    }
  })

  assert.equal(result.summary, 'interactive_ready')
  assert.equal(result.package.ready, true)
  assert.equal(result.static.ready, true)
  assert.equal(result.interactive.ready, true)
})


test('rejects review evidence from another asset version', () => {
  const glb = createSyntheticGlb()
  const manifest = createManifest(glb.length)

  const result = assessCueIdV2Intake(glb, manifest, {
    assetVersion: '2.1.0',
    visualReview: true,
    mobileReview: true,
    performance: {
      full: 800,
      reduced: 1500
    }
  })

  assert.equal(result.static.ready, false)
  assert.equal(result.interactive.ready, false)
  assert.ok(result.static.issues.some(issue => issue.field === 'evidenceVersion'))
  assert.ok(result.interactive.issues.some(issue => issue.field === 'evidenceVersion'))
})
