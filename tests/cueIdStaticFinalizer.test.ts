import assert from 'node:assert/strict'
import { mkdtemp, mkdir, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'

import { finalizeCueIdStaticVariants } from '../scripts/lib/cue-id-static-finalizer.mjs'

function fixture() {
  const manifest = {
    assetVersion: '2.0.0',
    capabilities: {
      bases: ['neutral'],
      builds: ['regular'],
      outfits: ['tee'],
      accessories: [null],
      poses: ['neutral'],
      materials: ['matte'],
      accents: ['lime']
    },
    static: {
      variants: {}
    }
  }

  const key = 'neutral__regular__tee__none__neutral__matte__lime'
  const plan = {
    assetVersion: '2.0.0',
    count: 1,
    entries: [
      {
        key,
        portrait: `/cue-id/production/static/2.0.0/${key}-portrait.webp`,
        square: `/cue-id/production/static/2.0.0/${key}-square.webp`
      }
    ]
  }

  return { manifest, plan, key }
}

test('finalizes static variants only when all planned files physically exist', async () => {
  const root = await mkdtemp(join(tmpdir(), 'cue-id-static-'))
  const { manifest, plan, key } = fixture()
  const dir = join(root, 'cue-id/production/static/2.0.0')

  await mkdir(dir, { recursive: true })
  await writeFile(join(dir, `${key}-portrait.webp`), 'portrait')
  await writeFile(join(dir, `${key}-square.webp`), 'square')

  const finalized = await finalizeCueIdStaticVariants({
    manifest,
    plan,
    publicDir: root
  })

  assert.deepEqual(finalized.static.variants[key], {
    portrait: plan.entries[0].portrait,
    square: plan.entries[0].square
  })
})

test('rejects finalization when any planned static render is missing', async () => {
  const root = await mkdtemp(join(tmpdir(), 'cue-id-static-'))
  const { manifest, plan, key } = fixture()
  const dir = join(root, 'cue-id/production/static/2.0.0')

  await mkdir(dir, { recursive: true })
  await writeFile(join(dir, `${key}-portrait.webp`), 'portrait')

  await assert.rejects(
    () => finalizeCueIdStaticVariants({
      manifest,
      plan,
      publicDir: root
    }),
    /1 missing render files/
  )
})

test('rejects render plans from another asset version', async () => {
  const root = await mkdtemp(join(tmpdir(), 'cue-id-static-'))
  const { manifest, plan } = fixture()
  plan.assetVersion = '2.1.0'

  await assert.rejects(
    () => finalizeCueIdStaticVariants({
      manifest,
      plan,
      publicDir: root
    }),
    /does not match manifest assetVersion/
  )
})
