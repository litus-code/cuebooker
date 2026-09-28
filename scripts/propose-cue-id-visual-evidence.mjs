#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises'
import { createCueIdVisualEvidenceProposal } from './lib/cue-id-visual-evidence-proposal.mjs'

const args = process.argv.slice(2)
const [reviewPath, evidencePath] = args

function flagValue(name) {
  const index = args.indexOf(name)
  return index >= 0 ? args[index + 1] : null
}

const outputPath = flagValue('--output')

if (!reviewPath || !evidencePath) {
  console.error('Usage: node scripts/propose-cue-id-visual-evidence.mjs <sculpt-review.json> <evidence.json> [--output <proposal.json>]')
  process.exit(1)
}

try {
  const [reviewRaw, evidenceRaw] = await Promise.all([
    readFile(reviewPath, 'utf8'),
    readFile(evidencePath, 'utf8')
  ])

  const proposal = createCueIdVisualEvidenceProposal(
    JSON.parse(reviewRaw),
    JSON.parse(evidenceRaw)
  )
  const serialized = `${JSON.stringify(proposal, null, 2)}\n`

  if (outputPath) {
    await writeFile(outputPath, serialized, 'utf8')
    console.error(`Visual evidence proposal written to ${outputPath}`)
  } else {
    process.stdout.write(serialized)
  }
} catch (error) {
  console.error('[CUE ID] visual evidence proposal failed:', error instanceof Error ? error.message : error)
  process.exit(1)
}
