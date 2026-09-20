<script setup lang="ts">
import { TresCanvas } from '@tresjs/core'
import { Box3, Object3D, Vector3 } from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import type { CueIdProductionManifest } from '../domain/cueIdProductionManifest'
import type { CueIdRuntimeDecision } from '../domain/cueIdRuntime'
import { loadCueIdGlbBuffer } from '../services/cueIdAssetLoader'

const props = defineProps<{
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

onMounted(loadProductionAsset)

onBeforeUnmount(() => {
  loadAbort?.abort()
  unbindWebGlContextLifecycle()
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
