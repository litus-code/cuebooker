#!/usr/bin/env node
import { readFile } from 'node:fs/promises'
import { assessCueIdV2Intake } from './lib/cue-id-intake-assessor.mjs'

function usage() {
  console.error('Usage: node --experimental-strip-types scripts/assess-cue-id-v2.mjs <asset.glb> <manifest.json> [--evidence <evidence.json>]')
}

const args = process.argv.slice(2)
const [glbPath, manifestPath] = args

function flagValue(name) {
  const index = args.indexOf(name)
  return index >= 0 ? args[index + 1] : null
}

if (!glbPath || !manifestPath) {
  usage()
  process.exit(1)
}

try {
  const evidencePath = flagValue('--evidence')
  const [buffer, manifestRaw, evidenceRaw] = await Promise.all([
    readFile(glbPath),
    readFile(manifestPath, 'utf8'),
    evidencePath ? readFile(evidencePath, 'utf8') : Promise.resolve('{}')
  ])

  const result = assessCueIdV2Intake(
    buffer,
    JSON.parse(manifestRaw),
    JSON.parse(evidenceRaw)
  )

  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`)
  process.exit(result.interactive.ready || result.static.ready ? 0 : 1)
} catch (error) {
  console.error('[CUE ID] intake assessment failed:', error instanceof Error ? error.message : error)
  process.exit(1)
}
