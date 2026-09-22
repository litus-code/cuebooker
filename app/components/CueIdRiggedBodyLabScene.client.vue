<script setup lang="ts">
import { TresCanvas } from '@tresjs/core'
import {
  Box3,
  Color,
  MeshStandardMaterial,
  Object3D,
  Vector3
} from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js'
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js'
import type { CueIdStylizedCreatorConfigV1 } from '../domain/cueIdStylizedCreator'
import {
  CUE_ID_SKIN_TONES,
  resolveCueIdBodySemanticState
} from '../domain/cueIdBodyMaterials'
import { getCueIdRiggedBodyLabAsset } from '../domain/cueIdRiggedBodyLab'

type ViewMode = 'body' | 'face'

const props = withDefaults(defineProps<{
  config: CueIdStylizedCreatorConfigV1
  viewMode?: ViewMode
}>(), {
  viewMode: 'body'
})

const emit = defineEmits<{
  ready: []
  failed: [message: string]
  progress: [value: number]
}>()

const scene = shallowRef<Object3D | null>(null)
const ready = ref(false)
const displayScale = ref(1)
const displayPosition = ref<[number, number, number]>([0, 0, 0])
const rotationY = ref(0)
const userZoom = ref(1)

let abortController: AbortController | null = null
let loadGeneration = 0
let dragPointerId: number | null = null
let dragX = 0
let frameMetrics: { center: Vector3, size: Vector3, maxDimension: number } | null = null

const bodyBufferCache = new Map<string, ArrayBuffer>()
const asset = computed(() => getCueIdRiggedBodyLabAsset(props.config.body))
const cameraPosition = [0, 0.15, 6.8] as const

const hairColors: Record<CueIdStylizedCreatorConfigV1['hairColor'], string> = {
  black: '#141311',
  'dark-brown': '#2a1d18',
  brown: '#654332',
  blond: '#d8b77f',
  platinum: '#dedbd2',
  red: '#9e3027',
  blue: '#1f63d9'
}

function materialsFor(node: Object3D) {
  const material = (node as Object3D & {
    material?: MeshStandardMaterial | MeshStandardMaterial[]
  }).material

  return Array.isArray(material)
    ? material
    : material
      ? [material]
      : []
}

function tintNode(
  root: Object3D,
  nodeName: string,
  targetHex: string,
  strength: number
) {
  const target = new Color(targetHex)

  root.traverse(node => {
    if (node.name !== nodeName) return

    for (const material of materialsFor(node)) {
      if (!material.isMeshStandardMaterial) continue
      material.color.lerp(target, strength)
      material.needsUpdate = true
    }
  })
}

function applySemanticState(root: Object3D) {
  const state = resolveCueIdBodySemanticState(props.config)
  const currentAsset = asset.value

  const hairNode = currentAsset.semanticNodes.hair

  root.traverse(node => {
    if (hairNode && node.name === hairNode) {
      node.visible = state.sourceHairVisible
    }

    if (node.name === currentAsset.semanticNodes.underwear) {
      node.visible = state.underwearVisible
    }
  })

  const skin = CUE_ID_SKIN_TONES[props.config.skin]
  tintNode(
    root,
    currentAsset.semanticNodes.skin,
    skin.color,
    Math.min(0.42, skin.tintStrength * 0.52)
  )

  if (state.sourceHairVisible && hairNode) {
    tintNode(
      root,
      hairNode,
      hairColors[props.config.hairColor],
      0.52
    )
  }
}

function measureScene(root: Object3D) {
  const bounds = new Box3().setFromObject(root)
  const size = bounds.getSize(new Vector3())
  const center = bounds.getCenter(new Vector3())
  frameMetrics = {
    center,
    size,
    maxDimension: Math.max(size.x, size.y, size.z) || 1
  }
  applyViewTransform()
}

function applyViewTransform() {
  if (!frameMetrics) return

  const { center, size, maxDimension } = frameMetrics
  const faceMode = props.viewMode === 'face'
  const baseScale = (faceMode ? 8.8 : 4.25) / maxDimension
  const scale = baseScale * userZoom.value
  const focusY = faceMode
    ? center.y + size.y * 0.32
    : center.y

  displayScale.value = scale
  displayPosition.value = [
    -center.x * scale,
    -focusY * scale - (faceMode ? 0.05 : 0.12),
    -center.z * scale
  ]
}

function disposeScene(root: Object3D | null) {
  if (!root) return

  root.traverse(node => {
    const mesh = node as Object3D & {
      geometry?: { dispose?: () => void }
      material?: MeshStandardMaterial | MeshStandardMaterial[]
    }

    mesh.geometry?.dispose?.()
    for (const material of materialsFor(mesh)) {
      material.dispose()
    }
  })
}

async function fetchBodyBuffer(
  path: string,
  signal: AbortSignal,
  fallbackBytes: number
) {
  const cached = bodyBufferCache.get(path)
  if (cached) {
    emit('progress', 80)
    return cached.slice(0)
  }

  const response = await fetch(path, {
    signal,
    cache: 'force-cache'
  })

  if (!response.ok) {
    throw new Error(`CUE ID body GLB returned ${response.status}`)
  }

  if (!response.body) {
    const buffer = await response.arrayBuffer()
    bodyBufferCache.set(path, buffer)
    emit('progress', 80)
    return buffer.slice(0)
  }

  const reader = response.body.getReader()
  const contentLength = Number(response.headers.get('content-length')) || fallbackBytes || 0
  const chunks: Uint8Array[] = []
  let received = 0

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    if (!value) continue

    chunks.push(value)
    received += value.byteLength

    if (contentLength > 0) {
      emit('progress', Math.min(80, Math.max(1, Math.round((received / contentLength) * 80))))
    }
  }

  const merged = new Uint8Array(received)
  let offset = 0
  for (const chunk of chunks) {
    merged.set(chunk, offset)
    offset += chunk.byteLength
  }

  const buffer = merged.buffer
  bodyBufferCache.set(path, buffer)
  emit('progress', 80)
  return buffer.slice(0)
}

async function loadBody() {
  abortController?.abort()
  abortController = new AbortController()
  const generation = ++loadGeneration
  ready.value = false
  rotationY.value = 0
  userZoom.value = 1
  frameMetrics = null
  emit('progress', 0)

  const currentAsset = asset.value

  try {
    const buffer = await fetchBodyBuffer(
      currentAsset.glbPath,
      abortController.signal,
      currentAsset.bytes
    )

    if (generation !== loadGeneration) return
    emit('progress', 86)

    const loader = new GLTFLoader()
    const dracoLoader = new DRACOLoader()
    dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.7/')
    loader.setDRACOLoader(dracoLoader)
    loader.setMeshoptDecoder(MeshoptDecoder)

    emit('progress', 90)
    const gltf = await loader.parseAsync(buffer, '/cue-id/lab/bodies/')
    if (generation !== loadGeneration) return

    const parsed = gltf.scene
    applySemanticState(parsed)
    measureScene(parsed)
    emit('progress', 96)

    disposeScene(scene.value)
    scene.value = parsed

    // The model is parsed, framed and attached at this point. Relying on
    // TresCanvas' render event left the loading overlay stuck at 96% even
    // while the body was already visible, so mark the asset ready here.
    await nextTick()
    if (generation !== loadGeneration) return
    ready.value = true
    emit('progress', 100)
    emit('ready')
  } catch (error) {
    if (abortController.signal.aborted || generation !== loadGeneration) return
    console.error('[CUE ID] V2 lab body load failed', error)
    disposeScene(scene.value)
    scene.value = null
    const message = error instanceof Error ? error.message : String(error)
    emit('failed', message)
  }
}

function handlePointerDown(event: PointerEvent) {
  if (!ready.value) return
  dragPointerId = event.pointerId
  dragX = event.clientX
  ;(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId)
}

function handlePointerMove(event: PointerEvent) {
  if (!ready.value || dragPointerId !== event.pointerId) return
  const delta = event.clientX - dragX
  dragX = event.clientX
  rotationY.value += delta * 0.009
}

function handlePointerEnd(event: PointerEvent) {
  if (dragPointerId !== event.pointerId) return
  dragPointerId = null
  const target = event.currentTarget as HTMLElement
  if (target.hasPointerCapture(event.pointerId)) {
    target.releasePointerCapture(event.pointerId)
  }
}

function handleWheel(event: WheelEvent) {
  if (!ready.value) return
  event.preventDefault()
  const next = userZoom.value * (event.deltaY > 0 ? 0.94 : 1.06)
  userZoom.value = Math.min(1.45, Math.max(0.78, next))
  applyViewTransform()
}

watch(
  () => props.config.body,
  () => loadBody()
)

watch(
  () => props.viewMode,
  () => {
    userZoom.value = 1
    applyViewTransform()
  }
)

watch(
  () => [
    props.config.skin,
    props.config.hair,
    props.config.hairColor
  ],
  () => {
    if (!scene.value) return
    applySemanticState(scene.value)
  }
)

onMounted(loadBody)

onBeforeUnmount(() => {
  abortController?.abort()
  disposeScene(scene.value)
})
</script>

<template>
  <div
    class="cue-id-rigged-body-lab"
    :class="{ ready }"
    @pointerdown="handlePointerDown"
    @pointermove="handlePointerMove"
    @pointerup="handlePointerEnd"
    @pointercancel="handlePointerEnd"
    @wheel="handleWheel"
  >
    <TresCanvas
      alpha
      :antialias="true"
      :dpr="1.5"
      :clear-alpha="0"
      :fail-if-major-performance-caveat="true"
      power-preference="default"
      :render-mode="ready ? 'on-demand' : 'always'"
    >
      <TresPerspectiveCamera :position="cameraPosition" :fov="38" />
      <TresAmbientLight :intensity="0.78" />
      <TresDirectionalLight :position="[3.4, 5.5, 4.5]" :intensity="1.85" />
      <TresDirectionalLight :position="[-3, 2.4, 1.8]" :intensity="0.55" />

      <TresGroup
        :position="displayPosition"
        :scale="[displayScale, displayScale, displayScale]"
        :rotation="[0, rotationY, 0]"
      >
        <primitive
          v-if="scene"
          :object="scene"
        />
      </TresGroup>
    </TresCanvas>
  </div>
</template>

<style scoped>
.cue-id-rigged-body-lab{position:absolute;inset:0;z-index:2;opacity:0;transition:opacity .22s ease;pointer-events:none;touch-action:none}
.cue-id-rigged-body-lab.ready{opacity:1;pointer-events:auto;cursor:grab}
.cue-id-rigged-body-lab.ready:active{cursor:grabbing}
.cue-id-rigged-body-lab :deep(canvas){display:block;width:100%!important;height:100%!important}
</style>
