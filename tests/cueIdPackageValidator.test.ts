import assert from 'node:assert/strict'
import test from 'node:test'

import { validateCueIdPackage } from '../scripts/lib/cue-id-package-validator.mjs'

function createSyntheticGlb() {
  const gltf = {
    asset: { version: '2.0' },
    accessors: [{ count: 6 }, { count: 6 }],
    nodes: [
      { name: 'Root', mesh: 0 },
      { name: 'outfit_tee' },
      { name: 'accessory_glasses' }
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
      { name: 'material_textile' },
      { name: 'material_technical' },
      { name: 'material_accent' }
    ],
    animations: [
      { name: 'pose_neutral', channels: [], samplers: [] },
      { name: 'pose_relaxed', channels: [], samplers: [] },
      { name: 'pose_focused', channels: [], samplers: [] },
      { name: 'pose_editorial', channels: [], samplers: [] }
    ],
    textures: [],
    scenes: [{ nodes: [0, 1, 2] }],
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

function manifest(bytes) {
  return {
    manifestVersion: 1,
    assetVersion: '2.0.0',
    metrics: {
      compressedBytes: bytes,
      triangles: 2,
      materials: 4,
      textures: 0
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

test('accepts a package whose bindings resolve against the GLB', () => {
  const glb = createSyntheticGlb()
  const result = validateCueIdPackage(glb, manifest(glb.length))

  assert.equal(result.valid, true)
  assert.deepEqual(result.issues, [])
})

test('rejects manifest metrics that do not match the GLB', () => {
  const glb = createSyntheticGlb()
  const invalid = manifest(glb.length)
  invalid.metrics.triangles = 99

  const result = validateCueIdPackage(glb, invalid)

  assert.equal(result.valid, false)
  assert.ok(result.issues.some(issue => issue.field === 'metrics.triangles'))
})

test('rejects morph, clip, node and material bindings absent from the GLB', () => {
  const glb = createSyntheticGlb()
  const invalid = manifest(glb.length)

  invalid.bindings.morphs['base.feminine'] = 'missing_morph'
  invalid.bindings.poses.editorial = 'missing_clip'
  invalid.bindings.outfits.tee = ['missing_node']
  invalid.bindings.materials.body = 'missing_material'

  const result = validateCueIdPackage(glb, invalid)

  assert.ok(result.issues.some(issue => issue.field === 'bindings.morphs.base.feminine'))
  assert.ok(result.issues.some(issue => issue.field === 'bindings.poses.editorial'))
  assert.ok(result.issues.some(issue => issue.field === 'bindings.outfits.tee'))
  assert.ok(result.issues.some(issue => issue.field === 'bindings.materials.body'))
})

test('rejects visibility node reuse across outfit/accessory bindings', () => {
  const glb = createSyntheticGlb()
  const invalid = manifest(glb.length)
  invalid.bindings.accessories.glasses = ['outfit_tee']

  const result = validateCueIdPackage(glb, invalid)

  assert.ok(result.issues.some(issue => issue.field === 'bindings.visibility'))
})
