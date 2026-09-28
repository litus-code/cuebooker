import assert from 'node:assert/strict'
import test from 'node:test'

import { CUE_ID_PRODUCTION_MANIFESTS } from '../app/domain/cueIdProductionCatalogue.ts'

test('production manifest catalogue stays empty until an authored V2 asset is approved', () => {
  assert.deepEqual(CUE_ID_PRODUCTION_MANIFESTS, [])
})
