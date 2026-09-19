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

test('outfit and accessory nodes map to generated Club Minimal geometry', async () => {
  const generator = await readFile(
    new URL('../scripts/generate-cue-id-club-minimal-candidate.py', import.meta.url),
    'utf8'
  )

  for (const name of [...CUE_ID_OUTFIT_NODES, ...CUE_ID_ACCESSORY_NODES]) {
    assert.ok(generator.includes(name), `visibility node "${name}" must exist in generator`)
  }
})
