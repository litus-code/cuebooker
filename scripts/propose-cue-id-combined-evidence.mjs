#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises'
import { createCueIdCombinedEvidenceProposal } from './lib/cue-id-combined-evidence-proposal.mjs'

const args = process.argv.slice(2)
const [sculptPath, mobilePath, performancePath, evidencePath] = args

function flagValue(name) {
  const index = args.indexOf(name)
  return index >= 0 ? args[index + 1] : null
}

const outputPath = flagValue('--output')

if (!sculptPath || !mobilePath || !performancePath || !evidencePath) {
  console.error(
    'Usage: node --experimental-strip-types scripts/propose-cue-id-combined-evidence.mjs <sculpt-review.json> <mobile-review.json> <performance-review.json> <evidence.json> [--output <proposal.json>]'
  )
  process.exit(1)
}

try {
  const [sculptRaw, mobileRaw, performanceRaw, evidenceRaw] = await Promise.all([
    readFile(sculptPath, 'utf8'),
    readFile(mobilePath, 'utf8'),
    readFile(performancePath, 'utf8'),
    readFile(evidencePath, 'utf8')
  ])

  const proposal = createCueIdCombinedEvidenceProposal({
    sculptReview: JSON.parse(sculptRaw),
    mobileReview: JSON.parse(mobileRaw),
    performanceReview: JSON.parse(performanceRaw),
    evidence: JSON.parse(evidenceRaw)
  })

  const serialized = `${JSON.stringify(proposal, null, 2)}\n`

  if (outputPath) {
    await writeFile(outputPath, serialized, 'utf8')
    console.error(`Combined evidence proposal written to ${outputPath}`)
  } else {
    process.stdout.write(serialized)
  }
} catch (error) {
  console.error(
    '[CUE ID] combined evidence proposal failed:',
    error instanceof Error ? error.message : error
  )
  process.exit(1)
}
