import assert from 'node:assert/strict'
import test from 'node:test'

import {
  CUE_ID_READY_BUDGET_MS,
  evaluateCueIdReadyPerformance
} from '../app/domain/cueIdPerformance.ts'

test('full tier passes at or below the 800 ms ready budget', () => {
  assert.equal(CUE_ID_READY_BUDGET_MS.full, 800)
  assert.deepEqual(evaluateCueIdReadyPerformance('full', 800), {
    status: 'pass',
    budgetMs: 800,
    totalReadyMs: 800,
    remainingMs: 0
  })
})

test('full tier warns when ready time exceeds budget', () => {
  const gate = evaluateCueIdReadyPerformance('full', 801)

  assert.equal(gate.status, 'warn')
  assert.equal(gate.remainingMs, -1)
})

test('reduced tier uses the 1500 ms mobile-safe budget', () => {
  assert.equal(CUE_ID_READY_BUDGET_MS.reduced, 1500)

  const pass = evaluateCueIdReadyPerformance('reduced', 1499)
  const warn = evaluateCueIdReadyPerformance('reduced', 1501)

  assert.equal(pass.status, 'pass')
  assert.equal(warn.status, 'warn')
})

test('static tier never evaluates an interactive ready-time budget', () => {
  assert.deepEqual(evaluateCueIdReadyPerformance('static', null), {
    status: 'not_applicable',
    budgetMs: null,
    totalReadyMs: null,
    remainingMs: null
  })
})

test('missing runtime timing remains not applicable', () => {
  assert.equal(evaluateCueIdReadyPerformance('full', null).status, 'not_applicable')
})
