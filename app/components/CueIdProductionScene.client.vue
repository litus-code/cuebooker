<script setup lang="ts">
import { TresCanvas } from '@tresjs/core'
import {
  AnimationMixer,
  Box3,
  LoopOnce,
  MeshStandardMaterial,
  Object3D,
  Vector3,
  type AnimationClip
} from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import type { CueIdConfigV1 } from '../domain/cueId'
import type { CueIdCreatorConfigV1 } from '../domain/cueIdCreator'
import { resolveCueIdCreator3dBindings } from '../domain/cueIdCreator3dBindings'
import { getCueIdAccentColor, CUE_ID_MATERIAL_PRESETS } from '../domain/cueIdMaterial'
import { resolveCueIdProductionBindings } from '../domain/cueIdProductionBindings'
import type { CueIdProductionManifest } from '../domain/cueIdProductionManifest'
import type { CueIdRuntimeDecision } from '../domain/cueIdRuntime'
import { loadCueIdGlbBuffer } from '../services/cueIdAssetLoader'

const props = defineProps<{
  config: CueIdConfigV1
  creatorConfig?: CueIdCreatorConfigV1 | null
  manifest: CueIdProductionManifest
  decision: CueIdRuntimeDecision
}>()

const emit = defineEmits<{
  ready: [metrics: { assetVersion: string; bytes: number; loadMs: number; parseMs: number; firstFrameMs: number }]
  failed: []
}>()

const sceneRoot = ref<HTMLElement | null>(null)
const scene = shallowRef<Object3D | null>(null)
const ready = ref(false)

let loadAbort: AbortController | null = null
let frameStartedAt = 0
let metrics: { assetVersion: string; bytes: number; loadMs: number; parseMs: number } | null = null
let contextCanvas: HTMLCanvasElement | null = null
let contextLostHandler: ((event: Event) => void) | null = null
let mixer: AnimationMixer | null = null
let animations: AnimationClip[] = []

const cameraPosition = computed(() =>
  props.decision.tier === 'reduced'
    ? [0, 0.40, 7.25]
    : [0, 0.38, 7.25]
)

function frameScene(root: Object3D) {
  const bounds = new Box3().setFromObject(root)
  const size = bounds.getSize(new Vector3())
  const center = bounds.getCenter(new Vector3())
  const maxDimension = Math.max(size.x, size.y, size.z) || 1
  const scale = 3.92 / maxDimension

  root.scale.setScalar(scale)
  root.position.set(
    -center.x * scale,
    -center.y * scale + (props.decision.tier === 'reduced' ? 0.10 : -0.04),
    -center.z * scale
  )
}


function listSemanticNodes(groups: Record<string, string[] | undefined>) {
  return Object.values(groups).flatMap(nodes => nodes || [])
}

function setSemanticVisibility(root: Object3D, selectedNodes: string[], allNodes: string[]) {
  const selected = new Set(selectedNodes)
  const controlled = new Set(allNodes)

  root.traverse(node => {
    if (controlled.has(node.name)) {
      node.visible = selected.has(node.name)
    }
  })
}

function applyMorphBindings(root: Object3D) {
  const resolved = resolveCueIdProductionBindings(props.config, props.manifest)
  if (!resolved) return false

  const creatorResolved = props.creatorConfig
    ? resolveCueIdCreator3dBindings(props.creatorConfig, props.manifest)
    : null

  if (props.creatorConfig && !creatorResolved) return false

  const semanticMorphNames = new Set([
    ...Object.values(props.manifest.bindings.morphs || {}),
    ...Object.values(props.manifest.bindings.creator?.faces || {})
  ].filter((value): value is string => Boolean(value)))

  root.traverse(node => {
    const mesh = node as Object3D & {
      morphTargetDictionary?: Record<string, number>
      morphTargetInfluences?: number[]
    }
    const dictionary = mesh.morphTargetDictionary
    const influences = mesh.morphTargetInfluences
    if (!dictionary || !influences) return

    for (const name of semanticMorphNames) {
      const index = dictionary[name]
      if (index !== undefined) influences[index] = 0
    }

    for (const morph of [...resolved.morphs, ...(creatorResolved?.morphs || [])]) {
      const index = dictionary[morph.name]
      if (index !== undefined) influences[index] = morph.weight
    }
  })

  return true
}

function applyPoseBinding(root: Object3D) {
  const resolved = resolveCueIdProductionBindings(props.config, props.manifest)
  if (!resolved) return false

  const clip = animations.find(item => item.name === resolved.poseClip)
  if (!clip) return false

  mixer?.stopAllAction()
  mixer = new AnimationMixer(root)
  const action = mixer.clipAction(clip)
  action.reset()
  action.setLoop(LoopOnce, 1)
  action.clampWhenFinished = true
  action.play()
  mixer.setTime(Math.max(0, clip.duration))
  action.paused = true
  return true
}

function applyMaterialBindings(root: Object3D) {
  const resolved = resolveCueIdProductionBindings(props.config, props.manifest)
  if (!resolved) return false

  const creatorResolved = props.creatorConfig
    ? resolveCueIdCreator3dBindings(props.creatorConfig, props.manifest)
    : null

  if (props.creatorConfig && !creatorResolved) return false

  const preset = CUE_ID_MATERIAL_PRESETS[props.config.material]
  const mapped = new Map<string, keyof typeof preset>([
    [resolved.materials.body, 'body'],
    [resolved.materials.textile, 'mid']
  ])

  if (resolved.materials.technical) {
    mapped.set(resolved.materials.technical, 'dark')
  }
  if (resolved.materials.accent) {
    mapped.set(resolved.materials.accent, 'accent')
  }

  const seen = new Set<string>()

  root.traverse(node => {
    const materialValue = (node as Object3D & {
      material?: MeshStandardMaterial | MeshStandardMaterial[]
    }).material
    const materials = Array.isArray(materialValue)
      ? materialValue
      : materialValue
        ? [materialValue]
        : []

    for (const material of materials) {
      if (!material.isMeshStandardMaterial || seen.has(material.uuid)) continue
      const semanticSurface = mapped.get(material.name)
      if (!semanticSurface) continue

      seen.add(material.uuid)
      const surface = preset[semanticSurface]
      material.roughness = surface.roughness
      material.metalness = surface.metalness

      if (semanticSurface === 'body' && creatorResolved) {
        material.color.set(creatorResolved.skinColor)
      } else if (semanticSurface === 'accent') {
        material.color.set(getCueIdAccentColor(props.config.accent))
      }

      material.needsUpdate = true
    }
  })

  return true
}

function applyProductionSemantics(root: Object3D) {
  const resolved = resolveCueIdProductionBindings(props.config, props.manifest)
  if (!resolved) return false

  const creatorResolved = props.creatorConfig
    ? resolveCueIdCreator3dBindings(props.creatorConfig, props.manifest)
    : null

  if (props.creatorConfig && !creatorResolved) return false

  const allOutfitNodes = Object.values(props.manifest.bindings.outfits || {})
    .flat()
    .filter((value): value is string => Boolean(value))
  const allAccessoryNodes = Object.values(props.manifest.bindings.accessories || {})
    .flat()
    .filter((value): value is string => Boolean(value))

  setSemanticVisibility(
    root,
    creatorResolved ? [] : resolved.outfitNodes,
    allOutfitNodes
  )
  setSemanticVisibility(root, resolved.accessoryNodes, allAccessoryNodes)

  const creator = props.manifest.bindings.creator
  if (creatorResolved && creator) {
    const allHairNodes = listSemanticNodes(creator.hairs || {})
    const allFacialHairNodes = listSemanticNodes(creator.facialHair || {})
    const allTopNodes = listSemanticNodes(creator.tops || {})
    const allBottomNodes = listSemanticNodes(creator.bottoms || {})
    const allFootwearNodes = listSemanticNodes(creator.footwear || {})

    setSemanticVisibility(root, creatorResolved.hairNodes, allHairNodes)
    setSemanticVisibility(root, creatorResolved.facialHairNodes, allFacialHairNodes)
    setSemanticVisibility(root, creatorResolved.topNodes, allTopNodes)
    setSemanticVisibility(root, creatorResolved.bottomNodes, allBottomNodes)
    setSemanticVisibility(root, creatorResolved.footwearNodes, allFootwearNodes)
  }

  return applyMorphBindings(root)
    && applyPoseBinding(root)
    && applyMaterialBindings(root)
}

function disposeObject(object: Object3D | null) {
  if (!object) return

  object.traverse(child => {
    const mesh = child as Object3D & {
      geometry?: { dispose?: () => void }
      material?: unknown
    }

    mesh.geometry?.dispose?.()
    const materials = Array.isArray(mesh.material)
      ? mesh.material
      : mesh.material
        ? [mesh.material]
        : []

    for (const material of materials) {
      const disposable = material as { dispose?: () => void; [key: string]: unknown }
      for (const value of Object.values(disposable)) {
        if (value && typeof value === 'object' && 'dispose' in value) {
          ;(value as { dispose?: () => void }).dispose?.()
        }
      }
      disposable.dispose?.()
    }
  })
}

async function loadProductionAsset() {
  loadAbort?.abort()
  loadAbort = new AbortController()
  ready.value = false
  metrics = null

  try {
    const result = await loadCueIdGlbBuffer(
      {
        glbPath: props.manifest.glbPath,
        compressedBytes: props.manifest.metrics.compressedBytes
      },
      { signal: loadAbort.signal }
    )

    const parseStartedAt = performance.now()
    const loader = new GLTFLoader()
    const gltf = await loader.parseAsync(result.buffer, '/cue-id/production/')
    const parsed = gltf.scene
    animations = gltf.animations

    if (!applyProductionSemantics(parsed)) {
      throw new Error('CUE ID production semantic bindings could not be applied')
    }

    frameScene(parsed)
    disposeObject(scene.value)
    scene.value = parsed

    metrics = {
      assetVersion: props.manifest.assetVersion,
      bytes: result.bytes,
      loadMs: result.loadMs,
      parseMs: Math.max(0, Math.round(performance.now() - parseStartedAt))
    }
    frameStartedAt = performance.now()
  } catch (error) {
    if (loadAbort?.signal.aborted) return
    scene.value = null
    ready.value = false
    console.error('[CUE ID] production GLB load failed', error)
    emit('failed')
  }
}

function bindWebGlContextLifecycle() {
  const canvas = sceneRoot.value?.querySelector('canvas')
  if (!(canvas instanceof HTMLCanvasElement) || contextCanvas === canvas) return

  if (contextCanvas && contextLostHandler) {
    contextCanvas.removeEventListener('webglcontextlost', contextLostHandler)
  }

  contextCanvas = canvas
  contextLostHandler = (event: Event) => {
    event.preventDefault()
    ready.value = false
    emit('failed')
  }

  contextCanvas.addEventListener('webglcontextlost', contextLostHandler, { passive: false })
}

function unbindWebGlContextLifecycle() {
  if (contextCanvas && contextLostHandler) {
    contextCanvas.removeEventListener('webglcontextlost', contextLostHandler)
  }
  contextCanvas = null
  contextLostHandler = null
}

function handleCanvasReady() {
  bindWebGlContextLifecycle()
}

function handleRender() {
  if (!scene.value || !metrics || !frameStartedAt) return

  ready.value = true
  emit('ready', {
    ...metrics,
    firstFrameMs: Math.max(0, Math.round(performance.now() - frameStartedAt))
  })

  frameStartedAt = 0
  metrics = null
}

watch(
  () => props.manifest.assetVersion,
  () => loadProductionAsset()
)

watch(
  () => [
    props.config.base,
    props.config.build,
    props.config.outfit,
    props.config.accessory,
    props.config.pose,
    props.config.material,
    props.config.accent,
    props.creatorConfig?.skin,
    props.creatorConfig?.face,
    props.creatorConfig?.hair,
    props.creatorConfig?.facialHair,
    props.creatorConfig?.top,
    props.creatorConfig?.bottom,
    props.creatorConfig?.footwear
  ],
  () => {
    if (!scene.value) return
    if (!applyProductionSemantics(scene.value)) {
      ready.value = false
      emit('failed')
    }
  }
)

onMounted(loadProductionAsset)

onBeforeUnmount(() => {
  loadAbort?.abort()
  unbindWebGlContextLifecycle()
  mixer?.stopAllAction()
  mixer = null
  animations = []
  disposeObject(scene.value)
})

onErrorCaptured(() => {
  ready.value = false
  emit('failed')
  return false
})
</script>

<template>
  <div ref="sceneRoot" class="cue-id-production-scene" :class="{ ready }">
    <TresCanvas
      alpha
      :antialias="decision.tier === 'full'"
      :dpr="decision.dprCap"
      :fail-if-major-performance-caveat="true"
      :power-preference="decision.tier === 'full' ? 'default' : 'low-power'"
      :render-mode="ready ? 'on-demand' : 'always'"
      :clear-alpha="0"
      @ready="handleCanvasReady"
      @render="handleRender"
    >
      <TresPerspectiveCamera :position="cameraPosition" :fov="40" />
      <TresAmbientLight :intensity="0.52" />
      <TresDirectionalLight :position="[3.2, 5.2, 4.2]" :intensity="1.75" />

      <primitive
        v-if="scene"
        :object="scene"
      />
    </TresCanvas>
  </div>
</template>

<style scoped>
.cue-id-production-scene {
  position: absolute;
  inset: 0;
  z-index: 3;
  opacity: 0;
  pointer-events: none;
}
.cue-id-production-scene.ready {
  opacity: 1;
}
.cue-id-production-scene :deep(canvas) {
  display: block;
  width: 100% !important;
  height: 100% !important;
}
</style>
