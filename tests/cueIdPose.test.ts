import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'

import { CUE_ID_POSES } from '../app/domain/cueIdPose.ts'

const expectedPoses = ['neutral', 'relaxed', 'focused', 'editorial'] as const

test('CUE ID exposes the four semantic poses', () => {
  assert.deepEqual(Object.keys(CUE_ID_POSES), expectedPoses)
})

test('neutral pose remains the zero-delta reference', () => {
  assert.deepEqual(CUE_ID_POSES.neutral.rootRotation, [0, 0, 0])
  assert.deepEqual(CUE_ID_POSES.neutral.rootPosition, [0, 0, 0])
  assert.deepEqual(CUE_ID_POSES.neutral.nodes, {})
})

test('semantic pose transforms stay intentionally restrained', () => {
  for (const pose of Object.values(CUE_ID_POSES)) {
    for (const value of [...pose.rootRotation, ...pose.rootPosition]) {
      assert.ok(Math.abs(value) <= 0.3)
    }

    for (const transform of Object.values(pose.nodes)) {
      for (const value of transform.rotation || []) {
        assert.ok(Math.abs(value) <= 0.3)
      }
      for (const value of transform.position || []) {
        assert.ok(Math.abs(value) <= 0.3)
      }
    }
  }
})

test('pose node names map to generated Club Minimal geometry names', async () => {
  const generator = await readFile(
    new URL('../scripts/generate-cue-id-club-minimal-candidate.py', import.meta.url),
    'utf8'
  )

  const names = new Set(
    Object.values(CUE_ID_POSES)
      .flatMap(pose => Object.keys(pose.nodes))
  )

  for (const name of names) {
    assert.ok(
      generator.includes(name),
      `semantic pose node "${name}" must exist in the candidate generator`
    )
  }
})
