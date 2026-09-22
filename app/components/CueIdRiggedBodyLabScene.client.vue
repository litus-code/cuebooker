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
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js'
import type { CueIdStylizedCreatorConfigV1 } from '../domain/cueIdStylizedCreator'
import {
  CUE_ID_SKIN_TONES,
  resolveCueIdBodySemanticState
} from '../domain/cueIdBodyMaterials'
import { getCueIdRiggedBodyLabAsset } from '../domain/cueIdRiggedBodyLab'

const props = defineProps<{
  config: CueIdStylizedCreatorConfigV1
}>()

const emit = defineEmits<{
  ready: []
  failed: [message: string]
}>()

const scene = shallowRef<Object3D | null>(null)
const ready = ref(false)
let abortController: AbortController | null = null

const asset = computed(() => getCueIdRiggedBodyLabAsset(props.config.body))
const cameraPosition = [0, 0.2, 6.8] as const

const hairColors: Record<CueIdStylizedCreatorConfigV1['hairColor'], string> = {
  black: '#141311',
  'dark-brown': '#2a1d18',
  brown: '#654332',
  blond: '#d8b77f',
  platinum: '#dedbd2',
  red: '#9e3027',
  blue: '#1f63d9'
}

function frameScene(root: Object3D) {
  const bounds = new Box3().setFromObject(root)
  const size = bounds.getSize(new Vector3())
  const center = bounds.getCenter(new Vector3())
  const maxDimension = Math.max(size.x, size.y, size.z) || 1
  const scale = 4.25 / maxDimension

  root.scale.setScalar(scale)
  root.position.set(
    -center.x * scale,
    -center.y * scale - 0.12,
    -center.z * scale
  )
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

  root.traverse(node => {
    if (node.name === currentAsset.semanticNodes.hair) {
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

  if (state.sourceHairVisible) {
    tintNode(
      root,
      currentAsset.semanticNodes.hair,
      hairColors[props.config.hairColor],
      0.52
    )
  }
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

async function loadBody() {
  abortController?.abort()
  abortController = new AbortController()
  ready.value = false

  try {
    const response = await fetch(asset.value.glbPath, {
      signal: abortController.signal,
      cache: 'force-cache'
    })
    if (!response.ok) {
      throw new Error(`CUE ID body GLB returned ${response.status}`)
    }

    const buffer = await response.arrayBuffer()
    const loader = new GLTFLoader()
    loader.setMeshoptDecoder(MeshoptDecoder)
    const gltf = await loader.parseAsync(buffer, '/cue-id/lab/bodies/')
    const parsed = gltf.scene

    applySemanticState(parsed)
    frameScene(parsed)

    disposeScene(scene.value)
    scene.value = parsed
  } catch (error) {
    if (abortController.signal.aborted) return
    console.error('[CUE ID] V10 lab body load failed', error)
    disposeScene(scene.value)
    scene.value = null
    const message = error instanceof Error ? error.message : String(error)
    emit('failed', message)
  }
}

function handleRender() {
  if (!scene.value || ready.value) return
  ready.value = true
  emit('ready')
}

watch(
  () => props.config.body,
  () => loadBody()
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
  <div class="cue-id-rigged-body-lab" :class="{ ready }">
    <TresCanvas
      alpha
      :antialias="true"
      :dpr="1.5"
      :clear-alpha="0"
      :fail-if-major-performance-caveat="true"
      power-preference="default"
      :render-mode="ready ? 'on-demand' : 'always'"
      @render="handleRender"
    >
      <TresPerspectiveCamera :position="cameraPosition" :fov="38" />
      <TresAmbientLight :intensity="0.78" />
      <TresDirectionalLight :position="[3.4, 5.5, 4.5]" :intensity="1.85" />
      <TresDirectionalLight :position="[-3, 2.4, 1.8]" :intensity="0.55" />

      <primitive
        v-if="scene"
        :object="scene"
      />
    </TresCanvas>
  </div>
</template>

<style scoped>
.cue-id-rigged-body-lab{position:absolute;inset:0;z-index:2;opacity:0;transition:opacity .22s ease;pointer-events:none}
.cue-id-rigged-body-lab.ready{opacity:1}
.cue-id-rigged-body-lab :deep(canvas){display:block;width:100%!important;height:100%!important}
</style>
