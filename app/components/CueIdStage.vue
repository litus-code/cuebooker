<script setup lang="ts">
import type { CueIdConfigV1 } from '../domain/cueId'
import type { CueIdCandidateQuality } from '../domain/cueIdAssets'
import { selectCueIdCandidateQuality, type CueIdQualityMode } from '../domain/cueIdQuality'
import { decideCueIdRuntime, getCueIdRuntimeSignals, type CueIdRuntimeDecision } from '../domain/cueIdRuntime'
import { evaluateCueIdReadyPerformance } from '../domain/cueIdPerformance'
import { resolveCueIdAsset } from '../domain/cueIdAssetResolver'
import { CUE_ID_PRODUCTION_CATALOGUE } from '../domain/cueIdProductionCatalogue'

const props = withDefaults(defineProps<{
  config: CueIdConfigV1
  artistName?: string
  compact?: boolean
  interactive?: boolean
  labAsset?: 'benchmark' | 'candidate' | null
  labQuality?: CueIdQualityMode
  showDiagnostics?: boolean
}>(), {
  artistName: 'ARTIST',
  compact: false,
  interactive: true,
  labAsset: null,
  labQuality: 'auto',
  showDiagnostics: false
})

const analytics = useAnalytics()
const stageRoot = ref<HTMLElement | null>(null)
const runtimeWanted = ref(false)
const runtimeReady = ref(false)
const runtimeDecision = ref<CueIdRuntimeDecision | null>(null)
const productionStaticFailed = ref(false)
const runtimeInitMs = ref<number | null>(null)
const latestLabMetrics = ref<{
  assetId: string
  bytes: number
  loadMs: number
  parseMs: number
  firstFrameMs: number
  totalReadyMs: number | null
} | null>(null)
let runtimeLoadStartedAt = 0
let runtimeObserver: IntersectionObserver | null = null

const LazyCueIdScene = defineAsyncComponent(() => import('./CueIdScene.client.vue'))
const LazyCueIdProductionScene = defineAsyncComponent(() => import('./CueIdProductionScene.client.vue'))

const resolvedProductionAsset = computed(() => {
  if (!runtimeDecision.value || props.labAsset) return null
  return resolveCueIdAsset(
    props.config,
    runtimeDecision.value.tier,
    CUE_ID_PRODUCTION_CATALOGUE
  )
})

const productionStaticPath = computed(() =>
  productionStaticFailed.value
    ? null
    : resolvedProductionAsset.value?.staticPath || null
)

const productionInteractiveManifest = computed(() =>
  resolvedProductionAsset.value?.representation === 'interactive'
    ? resolvedProductionAsset.value.manifest
    : null
)

watch(productionStaticPath, () => {
  productionStaticFailed.value = false
})

watch(
  () => resolvedProductionAsset.value?.representation || null,
  () => {
    runtimeReady.value = false
    runtimeInitMs.value = null
  }
)

onMounted(() => {
  if (!props.interactive) return
  runtimeDecision.value = decideCueIdRuntime(getCueIdRuntimeSignals())

  if (!props.labAsset && !productionInteractiveManifest.value) {
    analytics.track('cue_id_static_fallback_used', {
      reason: resolvedProductionAsset.value ? 'production_static_first' : 'no_production_asset',
      tier: runtimeDecision.value.tier
    })
    return
  }

  if (!runtimeDecision.value.shouldLoadRuntime) {
    analytics.track('cue_id_static_fallback_used', {
      reason: runtimeDecision.value.reason,
      tier: runtimeDecision.value.tier
    })
    return
  }

  runtimeObserver = new IntersectionObserver(entries => {
    if (!entries[0]?.isIntersecting) return
    runtimeLoadStartedAt = performance.now()
    runtimeWanted.value = true
    runtimeObserver?.disconnect()
  }, { rootMargin: '220px 0px', threshold: .01 })
  if (stageRoot.value) runtimeObserver.observe(stageRoot.value)
})

function markRuntimeReady(renderer: 'tresjs_lab' | 'tresjs_production_v2') {
  runtimeReady.value = true
  runtimeInitMs.value = runtimeLoadStartedAt
    ? Math.max(0, Math.round(performance.now() - runtimeLoadStartedAt))
    : null

  analytics.track('cue_id_renderer_ready', {
    renderer,
    runtime_tier: runtimeDecision.value?.tier || null,
    init_ms: runtimeInitMs.value,
    dpr_cap: runtimeDecision.value?.dprCap || null
  })
}

function handleRuntimeReady() {
  markRuntimeReady('tresjs_lab')
}

function handleProductionRuntimeReady(metrics: {
  assetVersion: string
  bytes: number
  loadMs: number
  parseMs: number
  firstFrameMs: number
}) {
  markRuntimeReady('tresjs_production_v2')

  const totalReadyMs = runtimeLoadStartedAt
    ? Math.max(0, Math.round(performance.now() - runtimeLoadStartedAt))
    : null
  const gate = runtimeDecision.value
    ? evaluateCueIdReadyPerformance(runtimeDecision.value.tier, totalReadyMs)
    : null

  analytics.track('cue_id_production_asset_loaded', {
    asset_version: metrics.assetVersion,
    bytes: metrics.bytes,
    load_ms: metrics.loadMs,
    parse_ms: metrics.parseMs,
    first_frame_ms: metrics.firstFrameMs,
    total_ready_ms: totalReadyMs,
    runtime_tier: runtimeDecision.value?.tier || null,
    ready_budget_ms: gate?.budgetMs ?? null,
    ready_gate: gate?.status ?? 'not_applicable'
  })
}

function handleLabAssetLoaded(metrics: { assetId: string; bytes: number; loadMs: number; parseMs: number; firstFrameMs: number }) {
  const totalReadyMs = runtimeLoadStartedAt
    ? Math.max(0, Math.round(performance.now() - runtimeLoadStartedAt))
    : null

  latestLabMetrics.value = {
    ...metrics,
    totalReadyMs
  }

  const gate = runtimeDecision.value
    ? evaluateCueIdReadyPerformance(runtimeDecision.value.tier, totalReadyMs)
    : null

  analytics.track('cue_id_glb_lab_asset_loaded', {
    asset_id: metrics.assetId,
    quality: resolvedLabQuality.value,
    bytes: metrics.bytes,
    load_ms: metrics.loadMs,
    parse_ms: metrics.parseMs,
    first_frame_ms: metrics.firstFrameMs,
    total_ready_ms: totalReadyMs,
    runtime_tier: runtimeDecision.value?.tier || null,
    ready_budget_ms: gate?.budgetMs ?? null,
    ready_gate: gate?.status ?? 'not_applicable'
  })
}

function handleRuntimeFailed(renderer: 'tresjs_lab' | 'tresjs_production_v2' = 'tresjs_lab') {
  runtimeReady.value = false
  analytics.track('cue_id_renderer_failed', {
    renderer,
    reason: 'scene_failed',
    runtime_tier: runtimeDecision.value?.tier || null
  })
  analytics.track('cue_id_static_fallback_used', {
    reason: 'scene_failed'
  })
}

onBeforeUnmount(() => runtimeObserver?.disconnect())

const poseClass = computed(() => `cue-id-stage--pose-${props.config.pose}`)
const buildClass = computed(() => `cue-id-stage--build-${props.config.build}`)
const baseClass = computed(() => `cue-id-stage--base-${props.config.base}`)
const outfitClass = computed(() => `cue-id-stage--outfit-${props.config.outfit}`)
const materialClass = computed(() => `cue-id-stage--material-${props.config.material}`)
const accentClass = computed(() => props.config.accent ? `cue-id-stage--accent-${props.config.accent}` : '')
const resolvedLabQuality = computed<CueIdCandidateQuality>(() => {
  if (props.labQuality !== 'auto') return props.labQuality
  return runtimeDecision.value
    ? selectCueIdCandidateQuality(runtimeDecision.value)
    : 'light'
})

watch(resolvedLabQuality, () => {
  latestLabMetrics.value = null
  runtimeReady.value = false
  runtimeInitMs.value = null
  runtimeLoadStartedAt = performance.now()
})

const performanceGate = computed(() => {
  if (!runtimeDecision.value) return null
  return evaluateCueIdReadyPerformance(
    runtimeDecision.value.tier,
    latestLabMetrics.value?.totalReadyMs ?? null
  )
})
</script>

<template>
  <section
    ref="stageRoot"
    class="cue-id-stage"
    :class="[poseClass, buildClass, baseClass, outfitClass, materialClass, accentClass, { 'cue-id-stage--compact': compact, 'cue-id-stage--runtime-ready': runtimeReady }]"
    aria-label="CUE ID preview"
  >
    <div class="cue-id-stage__grid" aria-hidden="true" />
    <div class="cue-id-stage__halo cue-id-stage__halo--one" aria-hidden="true" />
    <div class="cue-id-stage__halo cue-id-stage__halo--two" aria-hidden="true" />

    <div v-if="!productionStaticPath" class="cue-id-stage__figure" aria-hidden="true">
      <i class="cue-id-stage__head" />
      <i class="cue-id-stage__neck" />
      <i class="cue-id-stage__torso" />
      <i class="cue-id-stage__arm cue-id-stage__arm--left" />
      <i class="cue-id-stage__arm cue-id-stage__arm--right" />
      <i class="cue-id-stage__hand cue-id-stage__hand--left" />
      <i class="cue-id-stage__hand cue-id-stage__hand--right" />
      <i class="cue-id-stage__pelvis" />
      <i class="cue-id-stage__leg cue-id-stage__leg--left" />
      <i class="cue-id-stage__leg cue-id-stage__leg--right" />
      <i class="cue-id-stage__accessory" :data-accessory="config.accessory || 'none'" />
    </div>

    <img
      v-if="productionStaticPath && !runtimeReady"
      class="cue-id-stage__production-static"
      :src="productionStaticPath"
      alt=""
      aria-hidden="true"
      @error="productionStaticFailed = true"
    />

    <div class="cue-id-stage__scan" aria-hidden="true" />

    <ClientOnly>
      <LazyCueIdScene
        v-if="labAsset && interactive && runtimeWanted && runtimeDecision"
        :config="config"
        :decision="runtimeDecision"
        :lab-asset="labAsset"
        :lab-quality="resolvedLabQuality"
        @ready="handleRuntimeReady"
        @failed="handleRuntimeFailed('tresjs_lab')"
        @lab-asset-loaded="handleLabAssetLoaded"
      />

      <LazyCueIdProductionScene
        v-if="!labAsset && interactive && runtimeWanted && runtimeDecision && productionInteractiveManifest"
        :config="config"
        :manifest="productionInteractiveManifest"
        :decision="runtimeDecision"
        @ready="handleProductionRuntimeReady"
        @failed="handleRuntimeFailed('tresjs_production_v2')"
      />
    </ClientOnly>

    <aside
      v-if="showDiagnostics"
      class="cue-id-stage__diagnostics"
      aria-label="CUE ID runtime diagnostics"
    >
      <strong>RUNTIME</strong>
      <span>tier <b>{{ runtimeDecision?.tier || '—' }}</b></span>
      <span>reason <b>{{ runtimeDecision?.reason || '—' }}</b></span>
      <span>dpr <b>{{ runtimeDecision?.dprCap ?? '—' }}</b></span>
      <span>init <b>{{ runtimeInitMs === null ? '—' : runtimeInitMs + 'ms' }}</b></span>
      <span>quality <b>{{ resolvedLabQuality }}</b></span>
      <span>asset <b>{{ latestLabMetrics?.assetId || '—' }}</b></span>
      <span>bytes <b>{{ latestLabMetrics?.bytes?.toLocaleString?.() || '—' }}</b></span>
      <span>load <b>{{ latestLabMetrics ? latestLabMetrics.loadMs + 'ms' : '—' }}</b></span>
      <span>parse <b>{{ latestLabMetrics ? latestLabMetrics.parseMs + 'ms' : '—' }}</b></span>
      <span>frame <b>{{ latestLabMetrics ? latestLabMetrics.firstFrameMs + 'ms' : '—' }}</b></span>
      <span>ready <b>{{ latestLabMetrics?.totalReadyMs == null ? '—' : latestLabMetrics.totalReadyMs + 'ms' }}</b></span>
      <span>budget <b>{{ performanceGate?.budgetMs == null ? '—' : performanceGate.budgetMs + 'ms' }}</b></span>
      <span class="cue-id-stage__diagnostic-gate">
        gate
        <b :data-status="performanceGate?.status || 'not_applicable'">
          {{ performanceGate?.status === 'pass' ? 'PASS' : performanceGate?.status === 'warn' ? 'WARN' : '—' }}
        </b>
      </span>
    </aside>

    <footer class="cue-id-stage__meta">
      <span>CUE ID / CLUB MINIMAL</span>
      <strong>{{ artistName }}</strong>
      <small>{{ config.base }} · {{ config.outfit }} · {{ config.pose }}</small>
    </footer>
  </section>
</template>

<style scoped>
.cue-id-stage {
  position: relative;
  min-height: 520px;
  overflow: hidden;
  border: 1px solid var(--cue-border);
  background:
    radial-gradient(circle at 50% 38%, color-mix(in srgb, var(--cue-accent) 10%, transparent), transparent 24%),
    linear-gradient(145deg,#111410 0%,#050605 58%,#0b0d0b 100%);
  color: #f3f1ec;
  isolation: isolate;
  perspective: 1000px;
}
.cue-id-stage__grid {
  position:absolute; inset:0; z-index:-2; opacity:.22;
  background-image:linear-gradient(rgba(255,255,255,.05) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.04) 1px,transparent 1px);
  background-size:42px 42px;
  transform:perspective(760px) rotateX(63deg) scale(1.55) translateY(12%);
  transform-origin:50% 100%;
}
.cue-id-stage__halo {
  position:absolute; left:50%; top:45%; border:1px solid color-mix(in srgb,var(--cue-accent) 26%,transparent); border-radius:50%;
  transform:translate(-50%,-50%) rotateX(69deg)
}
.cue-id-stage__halo--one{width:380px;height:380px}.cue-id-stage__halo--two{width:530px;height:530px;opacity:.45}
.cue-id-stage__figure {
  position:absolute; left:50%; top:45%; width:180px; height:390px;
  transform:translate(-50%,-50%) rotateY(-12deg);
  transform-style:preserve-3d;
  filter:drop-shadow(0 38px 46px rgba(0,0,0,.8))
}
.cue-id-stage__figure i{position:absolute;display:block}
.cue-id-stage__production-static{position:absolute;z-index:3;inset:18px 18px 70px;width:calc(100% - 36px);height:calc(100% - 88px);object-fit:contain;object-position:center center}
.cue-id-stage--runtime-ready .cue-id-stage__figure{opacity:0;transition:opacity .28s ease}
.cue-id-stage--runtime-ready .cue-id-stage__scan{opacity:.32}
.cue-id-stage__meta{z-index:5}
.cue-id-stage__diagnostics{
  position:absolute;z-index:7;left:16px;top:16px;display:grid;grid-template-columns:auto auto;gap:4px 12px;
  max-width:min(320px,calc(100% - 32px));padding:10px 12px;border:1px solid rgba(255,255,255,.12);
  background:rgba(5,6,5,.82);backdrop-filter:blur(8px);font:600 9px/1.35 monospace;letter-spacing:.04em;
  color:#858b83;pointer-events:none
}
.cue-id-stage__diagnostics strong{grid-column:1/-1;color:#dfe2dc;letter-spacing:.12em}
.cue-id-stage__diagnostics span{display:contents}.cue-id-stage__diagnostics b{color:#d5ff67;font-weight:700;text-align:right;overflow:hidden;text-overflow:ellipsis}
.cue-id-stage__diagnostics b[data-status="warn"]{color:#ffb64d}.cue-id-stage__diagnostics b[data-status="pass"]{color:#d5ff67}

.cue-id-stage__head {
  left:59px; top:0; width:62px; height:76px;
  border-radius:48% 48% 42% 42% / 44% 44% 54% 54%;
  clip-path:polygon(18% 4%,82% 4%,96% 33%,88% 68%,68% 94%,50% 100%,31% 94%,12% 68%,5% 34%);
  background:linear-gradient(122deg,#4c524a 0%,#171a17 42%,#848b80 48%,#272c27 58%,#090a09 100%);
  box-shadow:inset -8px 0 18px rgba(201,255,45,.08)
}
.cue-id-stage__head::after{content:'';position:absolute;left:10px;right:10px;top:34px;height:3px;background:color-mix(in srgb,var(--cue-accent) 72%,transparent);box-shadow:0 0 14px color-mix(in srgb,var(--cue-accent) 38%,transparent)}
.cue-id-stage__neck{left:78px;top:69px;width:24px;height:28px;background:linear-gradient(90deg,#272c27,#4a5048 48%,#171a17);clip-path:polygon(18% 0,82% 0,100% 100%,0 100%)}
.cue-id-stage__torso {
  left:27px; top:88px; width:126px; height:150px;
  clip-path:polygon(18% 0,82% 0,98% 18%,88% 92%,70% 100%,30% 100%,12% 92%,2% 18%);
  background:linear-gradient(120deg,#52584f,#151815 34%,#050605 66%,#292f28);
  border:1px solid rgba(255,255,255,.12)
}
.cue-id-stage__torso::after{content:'CUE';position:absolute;left:50%;top:54%;transform:translate(-50%,-50%) rotate(-90deg);font:800 11px/1 monospace;letter-spacing:.28em;color:rgba(255,255,255,.34)}
.cue-id-stage__arm{top:103px;width:25px;height:132px;background:linear-gradient(#292e29,#0a0b0a);border:1px solid rgba(255,255,255,.08);border-radius:38% 38% 46% 46%}
.cue-id-stage__arm--left{left:7px;transform:rotate(5deg)}.cue-id-stage__arm--right{right:7px;transform:rotate(-3deg)}
.cue-id-stage__hand{top:226px;width:15px;height:24px;border-radius:48% 48% 42% 42%;background:linear-gradient(#4a5048,#202420)}
.cue-id-stage__hand--left{left:9px;transform:rotate(4deg)}.cue-id-stage__hand--right{right:9px;transform:rotate(-3deg)}
.cue-id-stage__pelvis{left:47px;top:232px;width:86px;height:42px;border-radius:42% 42% 34% 34%;background:linear-gradient(120deg,#343934,#141714)}
.cue-id-stage__leg{top:260px;width:27px;height:120px;border-radius:42% 42% 28% 28%;background:linear-gradient(#202420,#080908);border:1px solid rgba(255,255,255,.06)}
.cue-id-stage__leg--left{left:53px;transform:rotate(1deg)}.cue-id-stage__leg--right{right:53px;transform:rotate(-2deg)}
.cue-id-stage__scan{position:absolute;left:12%;right:12%;top:46%;height:1px;background:linear-gradient(90deg,transparent,var(--cue-accent),transparent);box-shadow:0 0 18px color-mix(in srgb,var(--cue-accent) 42%,transparent)}
.cue-id-stage__meta{position:absolute;left:24px;right:24px;bottom:22px;display:grid;grid-template-columns:1fr auto;gap:7px 18px;align-items:end;padding-top:16px;border-top:1px solid rgba(255,255,255,.13)}
.cue-id-stage__meta span,.cue-id-stage__meta small{font:700 9px/1.3 monospace;letter-spacing:.1em;text-transform:uppercase;color:#777d76}
.cue-id-stage__meta strong{grid-column:1;font-size:clamp(1.8rem,4vw,3rem);line-height:.9;text-transform:uppercase}
.cue-id-stage__meta small{grid-column:2;grid-row:1/3;text-align:right;color:var(--cue-accent)}
.cue-id-stage--build-slim .cue-id-stage__figure{scale:.94 1}.cue-id-stage--build-strong .cue-id-stage__figure{scale:1.08 1}
.cue-id-stage--pose-relaxed .cue-id-stage__figure{transform:translate(-50%,-50%) rotateY(-18deg) rotateZ(-1deg)}
.cue-id-stage--pose-focused .cue-id-stage__figure{transform:translate(-50%,-50%) rotateY(-5deg) rotateX(2deg)}
.cue-id-stage--pose-editorial .cue-id-stage__figure{transform:translate(-50%,-50%) rotateY(18deg) rotateZ(2deg)}
.cue-id-stage--material-satin .cue-id-stage__torso{background:linear-gradient(118deg,#6a7065 0%,#1b1f1b 31%,#060706 58%,#4a5048 100%)}
.cue-id-stage--accent-red{--cue-accent:#ff4545}.cue-id-stage--accent-lime{--cue-accent:#ceff54}
.cue-id-stage--base-feminine .cue-id-stage__torso{clip-path:polygon(22% 0,78% 0,94% 26%,82% 100%,18% 100%,6% 26%)}
.cue-id-stage--base-masculine .cue-id-stage__torso{clip-path:polygon(13% 0,87% 0,100% 28%,82% 100%,18% 100%,0 28%)}
.cue-id-stage--outfit-hoodie .cue-id-stage__torso{left:23px;width:134px;clip-path:polygon(15% 0,85% 0,100% 20%,92% 96%,72% 100%,28% 100%,8% 96%,0 20%)}
.cue-id-stage--outfit-hoodie .cue-id-stage__torso::before{content:'';position:absolute;left:30px;right:30px;top:-16px;height:40px;border:1px solid rgba(255,255,255,.13);border-radius:50% 50% 35% 35%}
.cue-id-stage--outfit-bomber .cue-id-stage__torso{left:22px;width:136px;clip-path:polygon(12% 0,88% 0,100% 22%,86% 100%,14% 100%,0 22%);box-shadow:inset 0 0 0 7px rgba(255,255,255,.035)}
.cue-id-stage--outfit-tank .cue-id-stage__torso{left:34px;width:112px;clip-path:polygon(28% 0,72% 0,96% 18%,86% 100%,14% 100%,4% 18%)}
.cue-id-stage__accessory[data-accessory="glasses"]{left:60px;top:34px;width:70px;height:12px;border:2px solid #d7d7d7;border-radius:8px}
.cue-id-stage__accessory[data-accessory="cap"]{left:53px;top:-7px;width:84px;height:22px;border-radius:50% 50% 20% 20%;background:#171a17}
.cue-id-stage__accessory[data-accessory="headphones"]{left:48px;top:18px;width:94px;height:76px;border:5px solid #252a24;border-bottom:0;border-radius:50% 50% 0 0}
.cue-id-stage__accessory[data-accessory="none"]{display:none}
.cue-id-stage--compact{min-height:360px}
@media(prefers-reduced-motion:reduce){.cue-id-stage--runtime-ready .cue-id-stage__figure{transition:none}}
@media(prefers-reduced-motion:no-preference){.cue-id-stage__figure{animation:cue-id-float 5.8s ease-in-out infinite}.cue-id-stage__scan{animation:cue-id-scan 4.4s ease-in-out infinite}}
@keyframes cue-id-float{0%,100%{translate:0 0}50%{translate:0 -8px}}@keyframes cue-id-scan{0%,100%{transform:translateY(-80px);opacity:.2}50%{transform:translateY(95px);opacity:.9}}
@media(max-width:680px){.cue-id-stage{min-height:500px}.cue-id-stage__diagnostics{display:none}.cue-id-stage__halo--one{width:300px;height:300px}.cue-id-stage__halo--two{width:410px;height:410px}.cue-id-stage__figure{transform:translate(-50%,-50%) scale(.82) rotateY(-12deg)}.cue-id-stage__meta{left:16px;right:16px;bottom:16px}.cue-id-stage__meta small{display:none}}
</style>
