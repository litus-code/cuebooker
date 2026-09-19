import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'

import { CUE_ID_OUTFITS, CUE_ID_OUTFIT_NODES } from '../app/domain/cueIdOutfit.ts'
import {
  CUE_ID_ACCESSORIES,
  CUE_ID_ACCESSORY_NODES,
  getCueIdAccessoryNodes
} from '../app/domain/cueIdAccessory.ts'

test('CUE ID exposes four outfit visibility groups', () => {
  assert.deepEqual(Object.keys(CUE_ID_OUTFITS), ['tee', 'tank', 'hoodie', 'bomber'])
})

test('CUE ID exposes three accessory visibility groups plus null', () => {
  assert.deepEqual(Object.keys(CUE_ID_ACCESSORIES), ['headphones', 'cap', 'glasses'])
  assert.deepEqual(getCueIdAccessoryNodes(null), [])
})

test('outfit visibility groups do not share geometry nodes', () => {
  const all = Object.values(CUE_ID_OUTFITS).flatMap(definition => definition.nodes)
  assert.equal(new Set(all).size, all.length)
  assert.equal(new Set(CUE_ID_OUTFIT_NODES).size, all.length)
})

test('accessory visibility groups do not share geometry nodes', () => {
  const all = Object.values(CUE_ID_ACCESSORIES).flatMap(definition => definition.nodes)
  assert.equal(new Set(all).size, all.length)
  assert.equal(new Set(CUE_ID_ACCESSORY_NODES).size, all.length)
})

function parseGlbNodeNames(buffer: Buffer) {
  assert.equal(buffer.toString('utf8', 0, 4), 'glTF')
  assert.equal(buffer.readUInt32LE(4), 2)

  let offset = 12
  while (offset < buffer.length) {
    const length = buffer.readUInt32LE(offset)
    const type = buffer.readUInt32LE(offset + 4)
    if (type === 0x4e4f534a) {
      const json = JSON.parse(
        buffer
          .subarray(offset + 8, offset + 8 + length)
          .toString('utf8')
          .replace(/\\0+$/g, '')
          .trim()
      ) as { nodes?: Array<{ name?: string }> }

      return new Set((json.nodes || []).map(node => node.name).filter(Boolean))
    }
    offset += 8 + length
  }

  throw new Error('GLB JSON chunk not found')
}

test('outfit and accessory nodes exist in the generated Club Minimal GLB', async () => {
  const buffer = await readFile(
    new URL('../public/cue-id/candidates/club-minimal-candidate-v1.glb', import.meta.url)
  )
  const nodeNames = parseGlbNodeNames(buffer)

  for (const name of [...CUE_ID_OUTFIT_NODES, ...CUE_ID_ACCESSORY_NODES]) {
    assert.ok(nodeNames.has(name), `visibility node "${name}" must exist in GLB`)
  }
})
