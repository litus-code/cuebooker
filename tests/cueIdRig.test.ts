import assert from 'node:assert/strict'
import test from 'node:test'

import {
  CUE_ID_ATTACHMENT_BONES,
  CUE_ID_EXPRESSION_MORPHS,
  CUE_ID_RIG_BONES,
  CUE_ID_RIG_CONTRACT,
  getCueIdExpressionMorph
} from '../app/domain/cueIdRig.ts'

test('male and female share the exact same rig contract', () => {
  assert.deepEqual(CUE_ID_RIG_CONTRACT.male, CUE_ID_RIG_CONTRACT.female)
  assert.equal(CUE_ID_RIG_CONTRACT.male, CUE_ID_RIG_BONES)
  assert.ok(CUE_ID_RIG_BONES.includes('head'))
  assert.ok(CUE_ID_RIG_BONES.includes('hand-l'))
  assert.ok(CUE_ID_RIG_BONES.includes('foot-r'))
})

test('expression morph contract keeps neutral as the base pose', () => {
  assert.equal(getCueIdExpressionMorph('neutral'), null)
  assert.equal(getCueIdExpressionMorph('smile'), 'cue_expression_smile')
  assert.equal(getCueIdExpressionMorph('focused'), 'cue_expression_focused')
  assert.equal(getCueIdExpressionMorph('confident'), 'cue_expression_confident')
  assert.equal(getCueIdExpressionMorph('playful'), 'cue_expression_playful')
  assert.equal(Object.keys(CUE_ID_EXPRESSION_MORPHS).length, 5)
})

test('accessory attachment points resolve to shared rig bones', () => {
  for (const bone of Object.values(CUE_ID_ATTACHMENT_BONES)) {
    assert.ok(CUE_ID_RIG_BONES.includes(bone))
  }
  assert.equal(CUE_ID_ATTACHMENT_BONES.torsoAccessory, 'chest')
  assert.equal(CUE_ID_ATTACHMENT_BONES.faceAccessory, 'head')
})
