<script setup lang="ts">
import { TresCanvas } from '@tresjs/core'
import { Box3, Object3D, Vector3 } from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import type { CueIdConfigV1 } from '../domain/cueId'
import { CUE_ID_BENCHMARK_ASSET, CUE_ID_CANDIDATE_ASSET } from '../domain/cueIdAssets'
import type { CueIdRuntimeDecision } from '../domain/cueIdRuntime'
import { loadCueIdGlbBuffer } from '../services/cueIdAssetLoader'

const props = withDefaults(defineProps<{
  config: CueIdConfigV1
  decision: CueIdRuntimeDecision
  labAsset?: 'benchmark' | 'candidate' | null
}>(), {
  labAsset: null
})

const emit = defineEmits<{
  ready: []
  failed: []
  labAssetLoaded: [metrics: { assetId: string; bytes: number; loadMs: number; parseMs: number; firstFrameMs: number }]
}>()

const ready = ref(false)
const labScene = shallowRef<Object3D | null>(null)
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

const accentColor = computed(() =>
  props.config.accent === 'red'
    ? '#ff4545'
    : props.config.accent === 'lime'
      ? '#ceff54'
      : '#737a72'
)


async function loadLabAsset() {
  if (!props.labAsset) return

  const asset = props.labAsset === 'candidate'
    ? CUE_ID_CANDIDATE_ASSET
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
    const scale = 3.4 / maxDimension

    parsed.scale.setScalar(scale)
    parsed.position.set(
      -center.x * scale,
      -center.y * scale - 0.25,
      -center.z * scale
    )

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
onBeforeUnmount(() => disposeObject(labScene.value))

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

      <TresAmbientLight :intensity="1.25" />
      <TresDirectionalLight :position="[3, 5, 4]" :intensity="2.2" />
      <TresDirectionalLight :position="[-3, 1, 2]" :intensity="0.65" :color="accentColor" />

      <primitive
        v-if="labAsset && labScene"
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
