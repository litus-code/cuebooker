#!/usr/bin/env node
import { readFile } from 'node:fs/promises'
import { validateCueIdPackage } from './lib/cue-id-package-validator.mjs'

const [glbPath, manifestPath] = process.argv.slice(2)

if (!glbPath || !manifestPath) {
  console.error('Usage: node scripts/validate-cue-id-v2-package.mjs <asset.glb> <manifest.json>')
  process.exit(1)
}

try {
  const [buffer, manifestRaw] = await Promise.all([
    readFile(glbPath),
    readFile(manifestPath, 'utf8')
  ])

  const result = validateCueIdPackage(buffer, JSON.parse(manifestRaw))

  if (!result.valid) {
    for (const problem of result.issues) {
      console.error(`[${problem.field}] ${problem.message}`)
    }
    process.exit(1)
  }

  console.log(JSON.stringify({
    valid: true,
    bytes: result.inspection.bytes,
    triangles: result.inspection.triangles,
    materials: result.inspection.counts.materials,
    textures: result.inspection.counts.textures
  }, null, 2))
} catch (error) {
  console.error('[CUE ID] package validation failed:', error instanceof Error ? error.message : error)
  process.exit(1)
}
