import assert from 'node:assert/strict'
import test from 'node:test'

import { DEFAULT_CUE_ID_CREATOR_CONFIG } from '../app/domain/cueIdCreator.ts'
import { getCueIdCreatorRepresentation } from '../app/domain/cueIdCreatorRepresentation.ts'

test('lab candidate treats creator dimensions as exact visual representations', () => {
  const result = getCueIdCreatorRepresentation(
    DEFAULT_CUE_ID_CREATOR_CONFIG,
    'hair',
    'lab_candidate'
  )

  assert.deepEqual(result, {
    status: 'exact',
    runtimeSemantic: 'textured-crop'
  })
})

test('production marks creator-only dimensions as not authored', () => {
  const result = getCueIdCreatorRepresentation(
    DEFAULT_CUE_ID_CREATOR_CONFIG,
    'hair',
    'production_interactive'
  )

  assert.deepEqual(result, {
    status: 'not_authored',
    runtimeSemantic: null
  })
})

test('production marks both creator tee fits as one shared runtime tee variant', () => {
  const oversized = getCueIdCreatorRepresentation(
    { ...DEFAULT_CUE_ID_CREATOR_CONFIG, top: 'oversized-tee' },
    'top',
    'production_interactive'
  )
  const fitted = getCueIdCreatorRepresentation(
    { ...DEFAULT_CUE_ID_CREATOR_CONFIG, top: 'fitted-tee' },
    'top',
    'production_interactive'
  )

  assert.deepEqual(oversized, {
    status: 'shared_runtime_variant',
    runtimeSemantic: 'tee'
  })
  assert.deepEqual(fitted, {
    status: 'shared_runtime_variant',
    runtimeSemantic: 'tee'
  })
})

test('production keeps distinct runtime outfits exact when authored', () => {
  const result = getCueIdCreatorRepresentation(
    { ...DEFAULT_CUE_ID_CREATOR_CONFIG, top: 'bomber' },
    'top',
    'production_interactive'
  )

  assert.deepEqual(result, {
    status: 'exact',
    runtimeSemantic: 'bomber'
  })
})
