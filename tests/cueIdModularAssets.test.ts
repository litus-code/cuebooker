import assert from 'node:assert/strict'
import { test } from 'node:test'
import { cueIdModularAssets, validateCueIdModularRegistry, type CueIdModularAsset } from '../app/domain/cueIdModularAssets.ts'

test('modular registry remains empty until an asset is reviewed', () => {
  assert.deepEqual(validateCueIdModularRegistry(cueIdModularAssets), [])
  assert.equal(Object.keys(cueIdModularAssets).length, 0)
})

test('rejects missing mounting contract, invalid paths and dangling incompatibilities', () => {
  const piece: CueIdModularAsset = {
    id: 'top_tee_oversized_01', category: 'top', label: 'Tee',
    src: '/cue-id/tops/top_tee_oversized_01_v1.glb',
    thumbnail: '/cue-id/thumbnails/top_tee_oversized_01.webp', version: 1,
    bodyVariants: ['male'], supportedTiers: ['full'],
    mount: { kind: 'skinned', rig: 'cue_rig', hideBodyRegions: ['torso_upper'] }
  }
  assert.deepEqual(validateCueIdModularRegistry({ [piece.id]: piece }), [])
  const broken = {
    ...piece, src: '/cue-id/lab/test.glb', incompatibleWith: ['acc_missing_01'],
    mount: { kind: 'skinned', rig: 'cue_rig', hideBodyRegions: ['unknown'] }
  } as unknown as CueIdModularAsset
  const errors = validateCueIdModularRegistry({ [piece.id]: broken })
  assert.equal(errors.length, 3)
})
