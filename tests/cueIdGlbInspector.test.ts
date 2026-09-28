import assert from 'node:assert/strict'
import test from 'node:test'

import {
  createManifestDraft,
  inspectGlb,
  parseGlb
} from '../scripts/lib/cue-id-glb-inspector.mjs'

function createSyntheticGlb() {
  const gltf = {
    asset: { version: '2.0' },
    accessors: [
      { count: 6 },
      { count: 6 }
    ],
    nodes: [
      { name: 'Root', mesh: 0 }
    ],
    meshes: [
      {
        name: 'Body',
        extras: { targetNames: ['base_feminine', 'base_masculine'] },
        primitives: [
          {
            attributes: { POSITION: 0 },
            indices: 1,
            targets: [{ POSITION: 0 }, { POSITION: 0 }]
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
      { name: 'pose_editorial', channels: [], samplers: [] }
    ],
    textures: [{ source: 0 }],
    images: [{ name: 'atlas', mimeType: 'image/png', bufferView: 0 }],
    scenes: [{ nodes: [0] }],
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

test('parses a valid GLB v2 container', () => {
  const parsed = parseGlb(createSyntheticGlb())

  assert.equal(parsed.version, 2)
  assert.equal(parsed.json.asset.version, '2.0')
})

test('inspects triangles, morphs, animations and materials', () => {
  const inspection = inspectGlb(createSyntheticGlb())

  assert.equal(inspection.triangles, 2)
  assert.deepEqual(inspection.discovered.morphTargets, ['base_feminine', 'base_masculine'])
  assert.deepEqual(inspection.discovered.animationNames, ['pose_neutral', 'pose_editorial'])
  assert.deepEqual(inspection.discovered.materialNames, ['material_body', 'material_textile'])
  assert.deepEqual(inspection.discovered.nodeNames, ['Root'])
  assert.equal(inspection.counts.textures, 1)
  assert.equal(inspection.counts.images, 1)
})

test('creates a manifest draft without guessing semantic bindings', () => {
  const inspection = inspectGlb(createSyntheticGlb())
  const draft = createManifestDraft(inspection, { assetVersion: '2.0.0' })

  assert.equal(draft.assetVersion, '2.0.0')
  assert.equal(draft.metrics.triangles, 2)
  assert.deepEqual(draft.bindings.morphs, {})
  assert.deepEqual(draft.bindings.poses, {})
  assert.deepEqual(draft.inspection.discoveredMorphTargets, ['base_feminine', 'base_masculine'])
})

test('rejects invalid GLB headers', () => {
  const invalid = Buffer.alloc(12)
  assert.throws(() => parseGlb(invalid), /Invalid GLB magic/)
})
