import assert from 'node:assert/strict'
import test from 'node:test'
import { readdir, readFile } from 'node:fs/promises'
import { join, relative } from 'node:path'

async function collectSourceFiles(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true })
  const files: string[] = []

  for (const entry of entries) {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) {
      files.push(...await collectSourceFiles(path))
      continue
    }

    if (/\.(?:ts|js|vue)$/.test(entry.name)) {
      files.push(path)
    }
  }

  return files
}

test('Three/Tres runtime imports stay isolated to the two CUE ID client renderers', async () => {
  const appDir = new URL('../app/', import.meta.url)
  const files = await collectSourceFiles(appDir.pathname)
  const violations: string[] = []

  for (const file of files) {
    const source = await readFile(file, 'utf8')
    const uses3dRuntime =
      source.includes('@tresjs/core')
      || /from\s+['"]three['"]/.test(source)
      || source.includes('three/addons/')

    if (!uses3dRuntime) continue

    const rel = relative(appDir.pathname, file)
    const allowedRenderers = new Set([
      'components/CueIdScene.client.vue',
      'components/CueIdProductionScene.client.vue'
    ])
    if (!allowedRenderers.has(rel)) {
      violations.push(rel)
    }
  }

  assert.deepEqual(
    violations,
    [],
    `3D runtime imports leaked outside the CUE ID client renderers: ${violations.join(', ')}`
  )
})

test('CueIdStage keeps both CUE ID renderers behind async component boundaries', async () => {
  const source = await readFile(
    new URL('../app/components/CueIdStage.vue', import.meta.url),
    'utf8'
  )

  assert.match(
    source,
    /defineAsyncComponent\(\(\)\s*=>\s*import\(['"]\.\/CueIdScene\.client\.vue['"]\)\)/
  )
  assert.match(
    source,
    /defineAsyncComponent\(\(\)\s*=>\s*import\(['"]\.\/CueIdProductionScene\.client\.vue['"]\)\)/
  )
})

test('public Artist Profile remains explicitly non-interactive', async () => {
  const source = await readFile(
    new URL('../app/components/PublicArtistProfile.vue', import.meta.url),
    'utf8'
  )

  assert.match(source, /:interactive="false"/)
})
