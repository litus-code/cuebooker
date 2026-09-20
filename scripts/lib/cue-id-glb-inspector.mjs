const GLB_MAGIC = 0x46546c67
const GLB_VERSION = 2
const GLB_JSON_CHUNK = 0x4e4f534a
const GLB_BIN_CHUNK = 0x004e4942
const TRIANGLES_MODE = 4

export function parseGlb(buffer) {
  const bytes = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer)

  if (bytes.length < 12) {
    throw new Error('GLB is smaller than the required 12-byte header')
  }

  const magic = bytes.readUInt32LE(0)
  const version = bytes.readUInt32LE(4)
  const declaredLength = bytes.readUInt32LE(8)

  if (magic !== GLB_MAGIC) throw new Error('Invalid GLB magic')
  if (version !== GLB_VERSION) throw new Error(`Unsupported GLB version ${version}`)
  if (declaredLength !== bytes.length) {
    throw new Error(`GLB declared ${declaredLength} bytes but file contains ${bytes.length}`)
  }

  let offset = 12
  let json = null
  let binaryChunk = null

  while (offset + 8 <= bytes.length) {
    const chunkLength = bytes.readUInt32LE(offset)
    const chunkType = bytes.readUInt32LE(offset + 4)
    const chunkStart = offset + 8
    const chunkEnd = chunkStart + chunkLength

    if (chunkEnd > bytes.length) throw new Error('GLB chunk exceeds file length')

    if (chunkType === GLB_JSON_CHUNK) {
      const raw = bytes.subarray(chunkStart, chunkEnd).toString('utf8').replace(/\u0000+$/g, '').trimEnd()
      json = JSON.parse(raw)
    } else if (chunkType === GLB_BIN_CHUNK) {
      binaryChunk = bytes.subarray(chunkStart, chunkEnd)
    }

    offset = chunkEnd
  }

  if (!json) throw new Error('GLB JSON chunk not found')

  return { json, binaryChunk, bytes: bytes.length, version }
}

function accessorCount(gltf, accessorIndex) {
  if (accessorIndex === undefined || accessorIndex === null) return 0
  return Number(gltf.accessors?.[accessorIndex]?.count || 0)
}

export function countTriangles(gltf) {
  let triangles = 0

  for (const mesh of gltf.meshes || []) {
    for (const primitive of mesh.primitives || []) {
      const mode = primitive.mode ?? TRIANGLES_MODE
      if (mode !== TRIANGLES_MODE) continue

      const elementCount = primitive.indices !== undefined
        ? accessorCount(gltf, primitive.indices)
        : accessorCount(gltf, primitive.attributes?.POSITION)

      triangles += Math.floor(elementCount / 3)
    }
  }

  return triangles
}

function unique(values) {
  return [...new Set(values.filter(value => typeof value === 'string' && value.length > 0))]
}

export function inspectGlb(buffer) {
  const parsed = parseGlb(buffer)
  const gltf = parsed.json

  const nodes = (gltf.nodes || []).map((node, index) => ({
    index,
    name: node.name || `node_${index}`,
    mesh: node.mesh ?? null,
    skin: node.skin ?? null
  }))

  const meshes = (gltf.meshes || []).map((mesh, index) => {
    const targetNames = Array.isArray(mesh.extras?.targetNames)
      ? mesh.extras.targetNames
      : []

    const targetCount = Math.max(
      targetNames.length,
      ...(mesh.primitives || []).map(primitive => primitive.targets?.length || 0),
      0
    )

    return {
      index,
      name: mesh.name || `mesh_${index}`,
      primitives: mesh.primitives?.length || 0,
      targetCount,
      morphTargets: Array.from({ length: targetCount }, (_, targetIndex) =>
        targetNames[targetIndex] || `target_${targetIndex}`
      )
    }
  })

  const animations = (gltf.animations || []).map((animation, index) => ({
    index,
    name: animation.name || `animation_${index}`,
    channels: animation.channels?.length || 0,
    samplers: animation.samplers?.length || 0
  }))

  const materials = (gltf.materials || []).map((material, index) => ({
    index,
    name: material.name || `material_${index}`,
    alphaMode: material.alphaMode || 'OPAQUE',
    doubleSided: Boolean(material.doubleSided)
  }))

  const images = (gltf.images || []).map((image, index) => ({
    index,
    name: image.name || `image_${index}`,
    mimeType: image.mimeType || null,
    uri: image.uri || null,
    bufferView: image.bufferView ?? null
  }))

  const textures = (gltf.textures || []).map((texture, index) => ({
    index,
    name: texture.name || `texture_${index}`,
    source: texture.source ?? null,
    sampler: texture.sampler ?? null
  }))

  const morphTargets = unique(meshes.flatMap(mesh => mesh.morphTargets))
  const animationNames = unique(animations.map(animation => animation.name))
  const materialNames = unique(materials.map(material => material.name))
  const nodeNames = unique(nodes.map(node => node.name))

  return {
    format: 'glb',
    version: parsed.version,
    bytes: parsed.bytes,
    triangles: countTriangles(gltf),
    counts: {
      scenes: gltf.scenes?.length || 0,
      nodes: nodes.length,
      meshes: meshes.length,
      skins: gltf.skins?.length || 0,
      animations: animations.length,
      materials: materials.length,
      textures: textures.length,
      images: images.length,
      accessors: gltf.accessors?.length || 0
    },
    discovered: {
      nodeNames,
      morphTargets,
      animationNames,
      materialNames
    },
    nodes,
    meshes,
    animations,
    materials,
    textures,
    images
  }
}

export function createManifestDraft(inspection, options = {}) {
  const assetVersion = options.assetVersion || 'v2-review'
  const basePath = options.basePath || '/cue-id/production'

  return {
    manifestVersion: 1,
    family: 'club_minimal',
    assetVersion,
    glbPath: `${basePath}/cue-id-club-minimal-${assetVersion}.glb`,
    static: {
      variants: {}
    },
    metrics: {
      compressedBytes: inspection.bytes,
      triangles: inspection.triangles,
      materials: inspection.counts.materials,
      textures: inspection.counts.textures,
      largestTextureDimension: 0
    },
    supportedTiers: ['full', 'reduced'],
    capabilities: {
      bases: ['feminine', 'masculine', 'neutral'],
      builds: ['slim', 'regular', 'strong'],
      outfits: ['tee'],
      accessories: [null],
      poses: ['neutral', 'relaxed', 'focused', 'editorial'],
      materials: ['matte'],
      accents: ['lime', 'red', null]
    },
    bindings: {
      morphs: {},
      poses: {},
      outfits: {},
      accessories: {},
      materials: {}
    },
    inspection: {
      discoveredMorphTargets: inspection.discovered.morphTargets,
      discoveredAnimationNames: inspection.discovered.animationNames,
      discoveredMaterialNames: inspection.discovered.materialNames,
      discoveredNodeNames: inspection.discovered.nodeNames
    }
  }
}
