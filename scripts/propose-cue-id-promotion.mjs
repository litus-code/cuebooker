#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises'
import { createCueIdPromotionProposal } from './lib/cue-id-promotion-proposal.mjs'

function usage() {
  console.error('Usage: node --experimental-strip-types scripts/propose-cue-id-promotion.mjs <asset.glb> <manifest.json> --evidence <evidence.json> [--stage auto|static_approved|interactive_approved] [--output <proposal.json>]')
}

const args = process.argv.slice(2)
const [glbPath, manifestPath] = args

function flagValue(name) {
  const index = args.indexOf(name)
  return index >= 0 ? args[index + 1] : null
}

const evidencePath = flagValue('--evidence')
const requestedStage = flagValue('--stage') || 'auto'
const outputPath = flagValue('--output')

if (!glbPath || !manifestPath || !evidencePath) {
  usage()
  process.exit(1)
}

try {
  const [buffer, manifestRaw, evidenceRaw] = await Promise.all([
    readFile(glbPath),
    readFile(manifestPath, 'utf8'),
    readFile(evidencePath, 'utf8')
  ])

  const proposal = createCueIdPromotionProposal(
    buffer,
    JSON.parse(manifestRaw),
    JSON.parse(evidenceRaw),
    requestedStage
  )

  const serialized = `${JSON.stringify(proposal, null, 2)}\n`

  if (outputPath) {
    await writeFile(outputPath, serialized, 'utf8')
    console.error(`Promotion proposal written to ${outputPath}`)
  } else {
    process.stdout.write(serialized)
  }
} catch (error) {
  console.error('[CUE ID] promotion proposal failed:', error instanceof Error ? error.message : error)
  process.exit(1)
}
