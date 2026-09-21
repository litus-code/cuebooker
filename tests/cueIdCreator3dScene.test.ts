import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'

test('production scene can apply optional creator 3D semantics', async () => {
  const source = await readFile(
    new URL('../app/components/CueIdProductionScene.client.vue', import.meta.url),
    'utf8'
  )

  assert.match(source, /creatorConfig\?: CueIdCreatorConfigV1 \| null/)
  assert.match(source, /resolveCueIdCreator3dBindings/)
  assert.match(source, /creatorResolved\.hairNodes/)
  assert.match(source, /creatorResolved\.facialHairNodes/)
  assert.match(source, /creatorResolved\.topNodes/)
  assert.match(source, /creatorResolved\.bottomNodes/)
  assert.match(source, /creatorResolved\.footwearNodes/)
  assert.match(source, /material\.color\.set\(creatorResolved\.skinColor\)/)
  assert.match(source, /\.\.\.\(creatorResolved\?\.morphs \|\| \[\]\)/)
})

test('legacy production semantics remain available without creator config', async () => {
  const source = await readFile(
    new URL('../app/components/CueIdProductionScene.client.vue', import.meta.url),
    'utf8'
  )

  assert.match(source, /resolveCueIdProductionBindings/)
  assert.match(source, /creatorResolved \? \[\] : resolved\.outfitNodes/)
  assert.match(source, /setSemanticVisibility\(root, resolved\.accessoryNodes, allAccessoryNodes\)/)
})
