import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'

import {
  CUE_ID_ACCENT_COLORS,
  CUE_ID_MATERIAL_PRESETS,
  getCueIdAccentColor
} from '../app/domain/cueIdMaterial.ts'

function parseGlbJson(buffer: Buffer) {
  assert.equal(buffer.toString('utf8', 0, 4), 'glTF')
  assert.equal(buffer.readUInt32LE(4), 2)

  let offset = 12
  while (offset < buffer.length) {
    const length = buffer.readUInt32LE(offset)
    const type = buffer.readUInt32LE(offset + 4)
    if (type === 0x4e4f534a) {
      const json = buffer
        .subarray(offset + 8, offset + 8 + length)
        .toString('utf8')
        .replace(/\0+$/g, '')
        .trim()
      return JSON.parse(json) as {
        materials?: Array<{ name?: string }>
        textures?: unknown[]
      }
    }
    offset += 8 + length
  }

  throw new Error('GLB JSON chunk not found')
}

test('CUE ID material presets stay restrained', () => {
  for (const preset of Object.values(CUE_ID_MATERIAL_PRESETS)) {
    for (const surface of Object.values(preset)) {
      assert.ok(surface.roughness >= 0.35)
      assert.ok(surface.roughness <= 0.9)
      assert.ok(surface.metalness >= 0)
      assert.ok(surface.metalness <= 0.15)
    }
  }
})

test('CUE ID accent palette keeps lime red and neutral options distinct', () => {
  assert.equal(CUE_ID_ACCENT_COLORS.lime, '#ceff54')
  assert.equal(CUE_ID_ACCENT_COLORS.red, '#ff4545')
  assert.equal(CUE_ID_ACCENT_COLORS.none, '#737a72')
  assert.equal(getCueIdAccentColor('lime'), '#ceff54')
  assert.equal(getCueIdAccentColor('red'), '#ff4545')
  assert.equal(getCueIdAccentColor(null), '#737a72')
  assert.equal(new Set(Object.values(CUE_ID_ACCENT_COLORS)).size, 3)
})

test('all Club Minimal quality GLBs contain the same four PBR materials and no textures', async () => {
  const files = [
    '../public/cue-id/candidates/club-minimal-candidate-v1.glb',
    '../public/cue-id/candidates/club-minimal-candidate-medium-v1.glb',
    '../public/cue-id/candidates/club-minimal-candidate-high-v1.glb'
  ]

  for (const file of files) {
    const buffer = await readFile(new URL(file, import.meta.url))
    const json = parseGlbJson(buffer)

    assert.deepEqual(
      (json.materials || []).map(material => material.name).sort(),
      ['accent', 'body', 'dark', 'mid']
    )
    assert.equal(json.materials?.length, 4)
    assert.equal(json.textures?.length || 0, 0)
  }
})
