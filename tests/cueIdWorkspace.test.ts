import assert from 'node:assert/strict'
import test from 'node:test'

import {
  DEFAULT_CUE_ID_STYLIZED_CREATOR_CONFIG
} from '../app/domain/cueIdStylizedCreator.ts'
import {
  CUE_ID_WORKSPACE_SECTIONS,
  cueIdExpressionPreviewTarget,
  cueIdHairPreviewTarget,
  cueIdPreviewBodyForConfig,
  cueIdSwitchBody
} from '../app/domain/cueIdWorkspace.ts'

test('workspace uses one body at a time', () => {
  assert.equal(
    cueIdPreviewBodyForConfig(DEFAULT_CUE_ID_STYLIZED_CREATOR_CONFIG),
    'male'
  )

  const female = cueIdSwitchBody(
    DEFAULT_CUE_ID_STYLIZED_CREATOR_CONFIG,
    'female'
  )

  assert.equal(cueIdPreviewBodyForConfig(female), 'female')
  assert.equal(female.hair, DEFAULT_CUE_ID_STYLIZED_CREATOR_CONFIG.hair)
  assert.equal(female.top, DEFAULT_CUE_ID_STYLIZED_CREATOR_CONFIG.top)
  assert.equal(female.footwear, DEFAULT_CUE_ID_STYLIZED_CREATOR_CONFIG.footwear)
})

test('expression previews always use the selected body', () => {
  const female = cueIdSwitchBody(
    DEFAULT_CUE_ID_STYLIZED_CREATOR_CONFIG,
    'female'
  )

  assert.deepEqual(cueIdExpressionPreviewTarget(female, 'smile'), {
    body: 'female',
    expression: 'smile',
    hair: female.hair
  })
})

test('hair previews always use the selected body', () => {
  const male = {
    ...DEFAULT_CUE_ID_STYLIZED_CREATOR_CONFIG,
    body: 'male' as const,
    expression: 'confident' as const
  }

  assert.deepEqual(cueIdHairPreviewTarget(male, 'mohawk'), {
    body: 'male',
    expression: 'confident',
    hair: 'mohawk'
  })
})

test('workspace keeps the agreed editing sections', () => {
  assert.deepEqual(CUE_ID_WORKSPACE_SECTIONS, [
    'identity',
    'hair',
    'face',
    'outfit',
    'footwear',
    'accessories'
  ])
})
