import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { cueIdModularAssets, validateCueIdModularRegistry } from '../app/domain/cueIdModularAssets.ts'

const errors = validateCueIdModularRegistry(cueIdModularAssets)
for (const asset of Object.values(cueIdModularAssets)) {
  for (const path of [asset.src, asset.thumbnail]) {
    const file = resolve('public', path.slice(1))
    if (!existsSync(file)) errors.push(`${asset.id}: missing ${path}`)
  }
  const glb = resolve('public', asset.src.slice(1))
  if (existsSync(glb)) {
    const data = readFileSync(glb)
    if (data.length < 20 || data.toString('ascii', 0, 4) !== 'glTF'
      || data.readUInt32LE(4) !== 2 || data.readUInt32LE(8) !== data.length) {
      errors.push(`${asset.id}: invalid GLB header or length`)
    } else {
      const jsonLength = data.readUInt32LE(12)
      const jsonType = data.toString('ascii', 16, 20)
      try {
        if (jsonType !== 'JSON' || jsonLength + 20 > data.length) throw new Error('missing glTF JSON chunk')
        const gltf = JSON.parse(data.toString('utf8', 20, 20 + jsonLength))
        const nodeNames = new Set((gltf.nodes || []).map(node => node.name))
        if (asset.mount.kind === 'skinned' && (!(gltf.skins || []).length || !nodeNames.has('cue_rig'))) {
          errors.push(`${asset.id}: missing skin or cue_rig node`)
        }
        if ((gltf.cameras || []).length) errors.push(`${asset.id}: cameras must not be exported`)
        if ((gltf.extensionsUsed || []).includes('KHR_lights_punctual')) errors.push(`${asset.id}: lights must not be exported`)
      } catch (error) {
        errors.push(`${asset.id}: malformed GLB JSON: ${error.message}`)
      }
    }
  }
  const thumb = resolve('public', asset.thumbnail.slice(1))
  if (existsSync(thumb) && readFileSync(thumb).toString('ascii', 0, 4) !== 'RIFF') {
    errors.push(`${asset.id}: invalid WebP header`)
  }
}
if (errors.length) {
  console.error(errors.join('\n'))
  process.exitCode = 1
} else console.log(`Modular registry valid (${Object.keys(cueIdModularAssets).length} approved assets).`)
