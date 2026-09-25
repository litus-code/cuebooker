import assert from 'node:assert/strict'
import test from 'node:test'

import { createCueIdPromotionProposal } from '../scripts/lib/cue-id-promotion-proposal.mjs'

function createSyntheticGlb() {
  const gltf = {
    asset: { version: '2.0' },
    accessors: [{ count: 6 }, { count: 6 }],
    nodes: [{ name: 'Root', mesh: 0 }, { name: 'outfit_tee' }],
    meshes: [{
      name: 'Body',
      extras: { targetNames: ['base_feminine', 'base_masculine', 'build_slim', 'build_strong'] },
      primitives: [{
        attributes: { POSITION: 0 },
        indices: 1,
        targets: [{ POSITION: 0 }, { POSITION: 0 }, { POSITION: 0 }, { POSITION: 0 }]
      }]
    }],
    materials: [{ name: 'material_body' }, { name: 'material_textile' }],
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
  const padding = (4 - (json.length % 4)) % 4
  if (padding) json = Buffer.concat([json, Buffer.alloc(padding, 0x20)])
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
  for (const base of capabilities.bases)
    for (const build of capabilities.builds)
      for (const outfit of capabilities.outfits)
        for (const accessory of capabilities.accessories)
          for (const pose of capabilities.poses)
            for (const material of capabilities.materials)
              for (const accent of capabilities.accents) {
                const key = [base, build, outfit, accessory ?? 'none', pose, material, accent ?? 'none'].join('__')
                variants[key] = {
                  portrait: `/cue-id/production/static/2.0.0/${key}-portrait.webp`,
                  square: `/cue-id/production/static/2.0.0/${key}-square.webp`
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
      outfits: { tee: ['outfit_tee'] },
      accessories: {},
      materials: {
        body: 'material_body',
        textile: 'material_textile'
      }
    }
  }
}

test('auto proposes static approval when reviews pass but performance is missing', () => {
  const glb = createSyntheticGlb()
  const manifest = createManifest(glb.length)

  const proposal = createCueIdPromotionProposal(glb, manifest, {
    assetVersion: '2.0.0',
    visualReview: true,
    mobileReview: true
  })

  assert.equal(proposal.stage, 'static_approved')
  assert.equal(proposal.assessment.summary, 'static_ready_interactive_pending')
})

test('auto proposes interactive approval when every gate passes', () => {
  const glb = createSyntheticGlb()
  const manifest = createManifest(glb.length)

  const proposal = createCueIdPromotionProposal(glb, manifest, {
    assetVersion: '2.0.0',
    visualReview: true,
    mobileReview: true,
    performance: { full: 800, reduced: 1500 }
  })

  assert.equal(proposal.stage, 'interactive_approved')
  assert.deepEqual(proposal.evidence.performance, { full: 800, reduced: 1500 })
})

test('rejects forced interactive promotion when only static-ready', () => {
  const glb = createSyntheticGlb()
  const manifest = createManifest(glb.length)

  assert.throws(
    () => createCueIdPromotionProposal(
      glb,
      manifest,
      { assetVersion: '2.0.0', visualReview: true, mobileReview: true },
      'interactive_approved'
    ),
    /not interactive-ready/
  )
})

test('rejects promotion when human review evidence is incomplete', () => {
  const glb = createSyntheticGlb()
  const manifest = createManifest(glb.length)

  assert.throws(
    () => createCueIdPromotionProposal(glb, manifest, { assetVersion: '2.0.0' }),
    /not promotion-ready/
  )
})
