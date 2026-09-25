#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises'
import { createCueIdStaticRenderPlan } from '../app/domain/cueIdStaticVariants.ts'

function usage() {
  console.error('Usage: node --experimental-strip-types scripts/plan-cue-id-static-renders.mjs <manifest.json> [--output <plan.json>] [--base-path <path>]')
}

const args = process.argv.slice(2)
const manifestPath = args[0]

if (!manifestPath || manifestPath.startsWith('--')) {
  usage()
  process.exit(1)
}

function flagValue(name) {
  const index = args.indexOf(name)
  return index >= 0 ? args[index + 1] : null
}

try {
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'))
  const assetVersion = manifest.assetVersion

  if (!assetVersion || !manifest.capabilities) {
    throw new Error('manifest must contain assetVersion and capabilities')
  }

  const plan = createCueIdStaticRenderPlan(manifest.capabilities, {
    assetVersion,
    basePath: flagValue('--base-path') || undefined
  })

  const output = {
    assetVersion,
    count: plan.length,
    entries: plan
  }

  const outputPath = flagValue('--output')
  if (outputPath) {
    await writeFile(outputPath, `${JSON.stringify(output, null, 2)}\n`, 'utf8')
    console.error(`Static render plan written to ${outputPath}`)
  } else {
    process.stdout.write(`${JSON.stringify(output, null, 2)}\n`)
  }
} catch (error) {
  console.error('[CUE ID] static render planning failed:', error instanceof Error ? error.message : error)
  process.exit(1)
}
