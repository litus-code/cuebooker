import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'

test('Blender Creator V1 export gate enforces the authored slice contract', async () => {
  const source = await readFile(
    new URL('../scripts/blender/cue-id-creator-v1-export.py', import.meta.url),
    'utf8'
  )

  assert.match(source, /cue_face_04/)
  assert.match(source, /cue_hair_textured_crop/)
  assert.match(source, /cue_hair_curly_crop/)
  assert.match(source, /cue_hair_locs/)
  assert.match(source, /cue_facial_short_beard/)
  assert.match(source, /cue_top_oversized_tee/)
  assert.match(source, /cue_top_bomber/)
  assert.match(source, /cue_bottom_wide_trouser/)
  assert.match(source, /cue_bottom_cargo/)
  assert.match(source, /cue_footwear_technical_sneaker/)
  assert.match(source, /cue_footwear_boot/)
  assert.match(source, /cue_pose_neutral/)
  assert.match(source, /cue_pose_relaxed/)
  assert.match(source, /MAX_TRIANGLES = 35000/)
  assert.match(source, /MAX_MATERIALS = 4/)
  assert.match(source, /MAX_TEXTURE_DIMENSION = 2048/)
  assert.match(source, /expected exactly one shared armature/)
  assert.match(source, /bpy\.ops\.export_scene\.gltf/)
  assert.match(source, /export_format="GLB"/)
})

test('Blender Creator V1 export defaults to the canonical visible outfit', async () => {
  const source = await readFile(
    new URL('../scripts/blender/cue-id-creator-v1-export.py', import.meta.url),
    'utf8'
  )

  assert.match(source, /cue_hair_textured_crop/)
  assert.match(source, /cue_top_oversized_tee/)
  assert.match(source, /cue_bottom_wide_trouser/)
  assert.match(source, /cue_footwear_technical_sneaker/)
  assert.match(source, /obj\.hide_viewport = not visible/)
  assert.match(source, /obj\.hide_render = not visible/)
})
