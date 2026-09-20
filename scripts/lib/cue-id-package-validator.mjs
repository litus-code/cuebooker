import { inspectGlb } from './cue-id-glb-inspector.mjs'

function issue(field, message) {
  return { field, message }
}

function bindingValues(record) {
  return Object.values(record || {}).flat().filter(value => typeof value === 'string' && value.length > 0)
}

export function validateCueIdPackage(buffer, manifest) {
  const inspection = inspectGlb(buffer)
  const issues = []

  if (manifest.manifestVersion !== 1) {
    issues.push(issue('manifestVersion', 'manifestVersion must be 1'))
  }

  if (!manifest.assetVersion || typeof manifest.assetVersion !== 'string') {
    issues.push(issue('assetVersion', 'assetVersion is required'))
  }

  if (manifest.metrics?.compressedBytes !== inspection.bytes) {
    issues.push(issue(
      'metrics.compressedBytes',
      `manifest declares ${manifest.metrics?.compressedBytes ?? 'missing'} bytes but GLB contains ${inspection.bytes}`
    ))
  }

  if (manifest.metrics?.triangles !== inspection.triangles) {
    issues.push(issue(
      'metrics.triangles',
      `manifest declares ${manifest.metrics?.triangles ?? 'missing'} triangles but GLB contains ${inspection.triangles}`
    ))
  }

  if (manifest.metrics?.materials !== inspection.counts.materials) {
    issues.push(issue(
      'metrics.materials',
      `manifest declares ${manifest.metrics?.materials ?? 'missing'} materials but GLB contains ${inspection.counts.materials}`
    ))
  }

  if (manifest.metrics?.textures !== inspection.counts.textures) {
    issues.push(issue(
      'metrics.textures',
      `manifest declares ${manifest.metrics?.textures ?? 'missing'} textures but GLB contains ${inspection.counts.textures}`
    ))
  }

  const morphNames = new Set(inspection.discovered.morphTargets)
  const animationNames = new Set(inspection.discovered.animationNames)
  const nodeNames = new Set(inspection.discovered.nodeNames)
  const materialNames = new Set(inspection.discovered.materialNames)

  for (const [semantic, name] of Object.entries(manifest.bindings?.morphs || {})) {
    if (typeof name === 'string' && !morphNames.has(name)) {
      issues.push(issue(`bindings.morphs.${semantic}`, `morph target "${name}" was not found in the GLB`))
    }
  }

  for (const [semantic, name] of Object.entries(manifest.bindings?.poses || {})) {
    if (typeof name === 'string' && !animationNames.has(name)) {
      issues.push(issue(`bindings.poses.${semantic}`, `animation clip "${name}" was not found in the GLB`))
    }
  }

  for (const [semantic, names] of Object.entries(manifest.bindings?.outfits || {})) {
    for (const name of Array.isArray(names) ? names : []) {
      if (!nodeNames.has(name)) {
        issues.push(issue(`bindings.outfits.${semantic}`, `outfit node "${name}" was not found in the GLB`))
      }
    }
  }

  for (const [semantic, names] of Object.entries(manifest.bindings?.accessories || {})) {
    for (const name of Array.isArray(names) ? names : []) {
      if (!nodeNames.has(name)) {
        issues.push(issue(`bindings.accessories.${semantic}`, `accessory node "${name}" was not found in the GLB`))
      }
    }
  }

  for (const [semantic, name] of Object.entries(manifest.bindings?.materials || {})) {
    if (typeof name === 'string' && !materialNames.has(name)) {
      issues.push(issue(`bindings.materials.${semantic}`, `material "${name}" was not found in the GLB`))
    }
  }

  const allBindingNames = bindingValues(manifest.bindings?.outfits)
    .concat(bindingValues(manifest.bindings?.accessories))

  if (new Set(allBindingNames).size !== allBindingNames.length) {
    issues.push(issue('bindings.visibility', 'outfit/accessory visibility bindings must not reuse the same node'))
  }

  return { inspection, issues, valid: issues.length === 0 }
}
