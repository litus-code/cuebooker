<script setup lang="ts">
import { TresCanvas } from '@tresjs/core'
import { Box3, MeshStandardMaterial, Object3D, Vector3 } from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import type { CueIdConfigV1 } from '../domain/cueId'
import {
  CUE_ID_BENCHMARK_ASSET,
  CUE_ID_CANDIDATE_ASSETS,
  type CueIdCandidateQuality
} from '../domain/cueIdAssets'
import { CUE_ID_POSES } from '../domain/cueIdPose'
import { CUE_ID_BUILDS } from '../domain/cueIdBuild'
import { CUE_ID_BASES } from '../domain/cueIdBase'
import { CUE_ID_MATERIAL_PRESETS, getCueIdAccentColor } from '../domain/cueIdMaterial'
import { CUE_ID_OUTFITS, CUE_ID_OUTFIT_NODES } from '../domain/cueIdOutfit'
import { CUE_ID_ACCESSORY_NODES, getCueIdAccessoryNodes } from '../domain/cueIdAccessory'
import type { CueIdRuntimeDecision } from '../domain/cueIdRuntime'
import { loadCueIdGlbBuffer } from '../services/cueIdAssetLoader'

const props = withDefaults(defineProps<{
  config: CueIdConfigV1
  decision: CueIdRuntimeDecision
  labAsset?: 'benchmark' | 'candidate' | null
  labQuality?: CueIdCandidateQuality
}>(), {
  labAsset: null,
  labQuality: 'light'
})

const emit = defineEmits<{
  ready: []
  failed: []
  labAssetLoaded: [metrics: { assetId: string; bytes: number; loadMs: number; parseMs: number; firstFrameMs: number }]
}>()

const ready = ref(false)
const labScene = shallowRef<Object3D | null>(null)

const labSceneVersion = ref(0)
const baseNodeTransforms = new Map<string, {
  rotation: [number, number, number]
  position: [number, number, number]
  scale: [number, number, number]
}>()
let baseRootRotation: [number, number, number] = [0, 0, 0]
let baseRootPosition: [number, number, number] = [0, 0, 0]
let baseRootScale: [number, number, number] = [1, 1, 1]
let labFrameStartedAt = 0
let labMetrics: { assetId: string; bytes: number; loadMs: number; parseMs: number } | null = null

const buildScale = computed(() =>
  props.config.build === 'strong' ? 1.12 : props.config.build === 'slim' ? 0.9 : 1
)

const poseRotation = computed(() =>
  props.config.pose === 'editorial'
    ? [0, 0.24, 0.035]
    : props.config.pose === 'focused'
      ? [0, -0.08, 0]
      : props.config.pose === 'relaxed'
        ? [0, 0.12, -0.02]
        : [0, 0, 0]
)

const surfaceColor = computed(() =>
  props.config.material === 'satin' ? '#555c53' : '#303630'
)

const accentColor = computed(() => getCueIdAccentColor(props.config.accent))



function rememberBaseTransforms(root: Object3D) {
  baseNodeTransforms.clear()
  root.traverse(node => {
    baseNodeTransforms.set(node.name, {
      rotation: [node.rotation.x, node.rotation.y, node.rotation.z],
      position: [node.position.x, node.position.y, node.position.z],
      scale: [node.scale.x, node.scale.y, node.scale.z]
    })
  })
  baseRootRotation = [root.rotation.x, root.rotation.y, root.rotation.z]
  baseRootPosition = [root.position.x, root.position.y, root.position.z]
  baseRootScale = [root.scale.x, root.scale.y, root.scale.z]
}

function applySemanticMaterials(root: Object3D) {
  const preset = CUE_ID_MATERIAL_PRESETS[props.config.material]
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
      seen.add(material.uuid)

      const key = material.name as keyof typeof preset
      const surface = preset[key]
      if (!surface) continue

      material.roughness = surface.roughness
      material.metalness = surface.metalness

      if (material.name === 'accent') {
        material.color.set(getCueIdAccentColor(props.config.accent))
      }

      material.needsUpdate = true
    }
  })
}

function applySemanticVisibility(root: Object3D) {
  const selectedOutfitNodes = new Set(CUE_ID_OUTFITS[props.config.outfit].nodes)
  const selectedAccessoryNodes = new Set(getCueIdAccessoryNodes(props.config.accessory))
  const outfitNodes = new Set(CUE_ID_OUTFIT_NODES)
  const accessoryNodes = new Set(CUE_ID_ACCESSORY_NODES)

  root.traverse(node => {
    if (outfitNodes.has(node.name)) {
      node.visible = selectedOutfitNodes.has(node.name)
    }
    if (accessoryNodes.has(node.name)) {
      node.visible = selectedAccessoryNodes.has(node.name)
    }
  })
}

function applySemanticAppearance(root: Object3D) {
  if (props.labAsset !== 'candidate') return

  const pose = CUE_ID_POSES[props.config.pose]
  const build = CUE_ID_BUILDS[props.config.build]
  const baseVariant = CUE_ID_BASES[props.config.base]

  root.rotation.set(
    baseRootRotation[0] + pose.rootRotation[0],
    baseRootRotation[1] + pose.rootRotation[1],
    baseRootRotation[2] + pose.rootRotation[2]
  )
  root.position.set(
    baseRootPosition[0] + pose.rootPosition[0],
    baseRootPosition[1] + pose.rootPosition[1],
    baseRootPosition[2] + pose.rootPosition[2]
  )
  root.scale.set(
    baseRootScale[0] * build.rootScale[0] * baseVariant.rootScale[0],
    baseRootScale[1] * build.rootScale[1] * baseVariant.rootScale[1],
    baseRootScale[2] * build.rootScale[2] * baseVariant.rootScale[2]
  )

  root.traverse(node => {
    const base = baseNodeTransforms.get(node.name)
    if (!base) return
    const transform = pose.nodes[node.name]
    const buildScale = build.nodes[node.name] || [1, 1, 1]
    const baseScale = baseVariant.nodes[node.name] || [1, 1, 1]

    node.rotation.set(
      base.rotation[0] + (transform?.rotation?.[0] || 0),
      base.rotation[1] + (transform?.rotation?.[1] || 0),
      base.rotation[2] + (transform?.rotation?.[2] || 0)
    )
    node.position.set(
      base.position[0] + (transform?.position?.[0] || 0),
      base.position[1] + (transform?.position?.[1] || 0),
      base.position[2] + (transform?.position?.[2] || 0)
    )
    node.scale.set(
      base.scale[0] * buildScale[0] * baseScale[0],
      base.scale[1] * buildScale[1] * baseScale[1],
      base.scale[2] * buildScale[2] * baseScale[2]
    )
  })

  applySemanticMaterials(root)
  applySemanticVisibility(root)
  labSceneVersion.value += 1
}


async function loadLabAsset() {
  if (!props.labAsset) return

  const asset = props.labAsset === 'candidate'
    ? CUE_ID_CANDIDATE_ASSETS[props.labQuality]
    : CUE_ID_BENCHMARK_ASSET

  try {
    const result = await loadCueIdGlbBuffer(asset)
    const parseStartedAt = performance.now()
    const loader = new GLTFLoader()
    const gltf = await loader.parseAsync(result.buffer, '/cue-id/benchmarks/')
    const parsed = gltf.scene

    const bounds = new Box3().setFromObject(parsed)
    const size = bounds.getSize(new Vector3())
    const center = bounds.getCenter(new Vector3())
    const maxDimension = Math.max(size.x, size.y, size.z) || 1
    const scale = 3.72 / maxDimension

    parsed.scale.setScalar(scale)
    parsed.position.set(
      -center.x * scale,
      -center.y * scale - 0.25,
      -center.z * scale
    )

    rememberBaseTransforms(parsed)
    applySemanticAppearance(parsed)

    labMetrics = {
      assetId: asset.id,
      bytes: result.bytes,
      loadMs: result.loadMs,
      parseMs: Math.max(0, Math.round(performance.now() - parseStartedAt))
    }
    labFrameStartedAt = performance.now()
    labScene.value = parsed
  } catch {
    labScene.value = null
  }
}

function disposeObject(object: Object3D | null) {
  if (!object) return
  object.traverse(child => {
    const mesh = child as Object3D & {
      geometry?: { dispose?: () => void }
      material?: unknown
    }
    mesh.geometry?.dispose?.()
    const materials = Array.isArray(mesh.material) ? mesh.material : mesh.material ? [mesh.material] : []
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

onMounted(loadLabAsset)

watch(
  () => props.labQuality,
  async (next, previous) => {
    if (next === previous || props.labAsset !== 'candidate') return
    disposeObject(labScene.value)
    labScene.value = null
    baseNodeTransforms.clear()
    await loadLabAsset()
  }
)

watch(
  () => [
    props.config.pose,
    props.config.build,
    props.config.base,
    props.config.outfit,
    props.config.accessory,
    props.config.material,
    props.config.accent
  ],
  () => {
    if (!labScene.value || props.labAsset !== 'candidate') return
    applySemanticAppearance(labScene.value)
  }
)

onBeforeUnmount(() => {
  disposeObject(labScene.value)
})

function handleReady() {
  ready.value = true
  emit('ready')
}

function handleRender() {
  if (!labScene.value || !labMetrics || !labFrameStartedAt) return

  emit('labAssetLoaded', {
    ...labMetrics,
    firstFrameMs: Math.max(0, Math.round(performance.now() - labFrameStartedAt))
  })

  labFrameStartedAt = 0
  labMetrics = null
}

onErrorCaptured(() => {
  ready.value = false
  emit('failed')
  return false
})
</script>

<template>
  <div class="cue-id-scene" :class="{ ready }">
    <TresCanvas
      alpha
      :antialias="decision.tier === 'full'"
      :dpr="decision.dprCap"
      :fail-if-major-performance-caveat="true"
      :power-preference="decision.tier === 'full' ? 'default' : 'low-power'"
      render-mode="on-demand"
      :clear-alpha="0"
      @ready="handleReady"
      @render="handleRender"
    >
      <TresPerspectiveCamera :position="[0, 0.35, 7.4]" :fov="42" />

      <TresAmbientLight :intensity="0.72" />
      <TresDirectionalLight :position="[3, 5, 4]" :intensity="1.55" />
      <TresDirectionalLight :position="[-3, 1, 2]" :intensity="0.4" :color="accentColor" />

      <primitive
        v-if="labAsset && labScene"
        :key="labSceneVersion"
        :object="labScene"
      />

      <TresGroup
        v-else
        :rotation="poseRotation"
        :scale="[buildScale, 1, 1]"
        :position="[0, -0.15, 0]"
      >
        <TresMesh :position="[0, 1.55, 0]">
          <TresBoxGeometry :args="[0.8, 0.9, 0.72]" />
          <TresMeshStandardMaterial
            :color="surfaceColor"
            :roughness="config.material === 'satin' ? 0.42 : 0.78"
            :metalness="config.material === 'satin' ? 0.18 : 0.04"
          />
        </TresMesh>

        <TresMesh :position="[0, 0.2, 0]">
          <TresBoxGeometry :args="[1.5, 1.9, 0.7]" />
          <TresMeshStandardMaterial
            :color="surfaceColor"
            :roughness="config.material === 'satin' ? 0.42 : 0.8"
            :metalness="config.material === 'satin' ? 0.16 : 0.03"
          />
        </TresMesh>

        <TresMesh :position="[-0.95, 0.18, 0]" :rotation="[0, 0, config.pose === 'relaxed' ? -0.12 : 0.04]">
          <TresBoxGeometry :args="[0.34, 1.75, 0.4]" />
          <TresMeshStandardMaterial color="#171a17" :roughness="0.85" />
        </TresMesh>

        <TresMesh :position="[0.95, 0.18, 0]" :rotation="[0, 0, config.pose === 'focused' ? -0.08 : -0.04]">
          <TresBoxGeometry :args="[0.34, 1.75, 0.4]" />
          <TresMeshStandardMaterial color="#171a17" :roughness="0.85" />
        </TresMesh>

        <TresMesh :position="[-0.45, -1.65, 0]">
          <TresBoxGeometry :args="[0.42, 1.85, 0.46]" />
          <TresMeshStandardMaterial color="#141714" :roughness="0.88" />
        </TresMesh>

        <TresMesh :position="[0.45, -1.65, 0]">
          <TresBoxGeometry :args="[0.42, 1.85, 0.46]" />
          <TresMeshStandardMaterial color="#141714" :roughness="0.88" />
        </TresMesh>

        <TresMesh :position="[0, 0.58, -0.39]">
          <TresBoxGeometry :args="[1.05, 0.055, 0.04]" />
          <TresMeshBasicMaterial :color="accentColor" />
        </TresMesh>
      </TresGroup>
    </TresCanvas>
  </div>
</template>

<style scoped>
.cue-id-scene {
  position: absolute;
  inset: 0;
  z-index: 3;
  opacity: 0;
  pointer-events: none;
}
.cue-id-scene.ready {
  opacity: 1;
}
.cue-id-scene :deep(canvas) {
  display: block;
  width: 100% !important;
  height: 100% !important;
}
@media (prefers-reduced-motion: reduce) {
  .cue-id-scene {
    transition: none;
  }
}
</style>
