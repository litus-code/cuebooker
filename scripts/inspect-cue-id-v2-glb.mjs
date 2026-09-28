#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises'
import { basename } from 'node:path'
import { inspectGlb, createManifestDraft } from './lib/cue-id-glb-inspector.mjs'

function usage() {
  console.error('Usage: node scripts/inspect-cue-id-v2-glb.mjs <asset.glb> [--manifest-draft <output.json>] [--asset-version <version>]')
}

const args = process.argv.slice(2)
const input = args[0]

if (!input || input.startsWith('--')) {
  usage()
  process.exit(1)
}

function flagValue(name) {
  const index = args.indexOf(name)
  return index >= 0 ? args[index + 1] : null
}

const manifestOutput = flagValue('--manifest-draft')
const assetVersion = flagValue('--asset-version') || 'v2-review'

try {
  const buffer = await readFile(input)
  const inspection = inspectGlb(buffer)

  const report = {
    file: basename(input),
    ...inspection
  }

  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`)

  if (manifestOutput) {
    const draft = createManifestDraft(inspection, { assetVersion })
    await writeFile(manifestOutput, `${JSON.stringify(draft, null, 2)}\n`, 'utf8')
    console.error(`Manifest draft written to ${manifestOutput}`)
  }
} catch (error) {
  console.error('[CUE ID] GLB inspection failed:', error instanceof Error ? error.message : error)
  process.exit(1)
}
