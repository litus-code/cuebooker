#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises'
import { finalizeCueIdStaticVariants } from './lib/cue-id-static-finalizer.mjs'

function usage() {
  console.error('Usage: node scripts/finalize-cue-id-static-renders.mjs <manifest.json> <plan.json> --output <manifest.json> [--public-dir public]')
}

const args = process.argv.slice(2)
const [manifestPath, planPath] = args

function flagValue(name) {
  const index = args.indexOf(name)
  return index >= 0 ? args[index + 1] : null
}

const outputPath = flagValue('--output')
const publicDir = flagValue('--public-dir') || 'public'

if (!manifestPath || !planPath || !outputPath) {
  usage()
  process.exit(1)
}

try {
  const [manifestRaw, planRaw] = await Promise.all([
    readFile(manifestPath, 'utf8'),
    readFile(planPath, 'utf8')
  ])

  const finalized = await finalizeCueIdStaticVariants({
    manifest: JSON.parse(manifestRaw),
    plan: JSON.parse(planRaw),
    publicDir
  })

  await writeFile(outputPath, `${JSON.stringify(finalized, null, 2)}\n`, 'utf8')
  console.error(`Finalized manifest written to ${outputPath}`)
} catch (error) {
  console.error('[CUE ID] static finalization failed:', error instanceof Error ? error.message : error)
  process.exit(1)
}
