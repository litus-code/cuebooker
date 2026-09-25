#!/usr/bin/env node
import { readFile } from 'node:fs/promises'
import { assessCueIdSculptReview } from './lib/cue-id-sculpt-review.mjs'

const reviewPath = process.argv[2]

if (!reviewPath) {
  console.error('Usage: node scripts/assess-cue-id-sculpt-review.mjs <sculpt-review.json>')
  process.exit(1)
}

try {
  const review = JSON.parse(await readFile(reviewPath, 'utf8'))
  const result = assessCueIdSculptReview(review)
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`)
  process.exit(result.ready ? 0 : 1)
} catch (error) {
  console.error('[CUE ID] sculpt review assessment failed:', error instanceof Error ? error.message : error)
  process.exit(1)
}
