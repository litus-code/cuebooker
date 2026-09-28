#!/usr/bin/env node
import { scaffoldCueIdV2Package } from './lib/cue-id-package-scaffold.mjs'

const args = process.argv.slice(2)

function flagValue(name) {
  const index = args.indexOf(name)
  return index >= 0 ? args[index + 1] : null
}

const version = flagValue('--version')
const outputDir = flagValue('--output-dir') || '.'
const profile = flagValue('--profile') || 'v2'

if (!version) {
  console.error('Usage: node scripts/scaffold-cue-id-v2-package.mjs --version <x.y.z> [--output-dir <path>] [--profile v2|creator-3d-v1]')
  process.exit(1)
}

try {
  const result = await scaffoldCueIdV2Package(outputDir, version, { profile })
  console.log(JSON.stringify(result, null, 2))
} catch (error) {
  console.error('[CUE ID] package scaffold failed:', error instanceof Error ? error.message : error)
  process.exit(1)
}
