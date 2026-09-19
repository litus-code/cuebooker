<script setup lang="ts">
import type { CueIdConfigV1 } from '../domain/cueId'
import { decideCueIdRuntime, getCueIdRuntimeSignals, type CueIdRuntimeDecision } from '../domain/cueIdRuntime'
import { evaluateCueIdReadyPerformance } from '../domain/cueIdPerformance'

const props = withDefaults(defineProps<{
  config: CueIdConfigV1
  artistName?: string
  compact?: boolean
  interactive?: boolean
  labAsset?: 'benchmark' | 'candidate' | null
  showDiagnostics?: boolean
}>(), {
  artistName: 'ARTIST',
  compact: false,
  interactive: true,
  labAsset: null,
  showDiagnostics: false
})

const analytics = useAnalytics()
const stageRoot = ref<HTMLElement | null>(null)
const runtimeWanted = ref(false)
const runtimeReady = ref(false)
const runtimeDecision = ref<CueIdRuntimeDecision | null>(null)
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

onMounted(() => {
  if (!props.interactive) return
  runtimeDecision.value = decideCueIdRuntime(getCueIdRuntimeSignals())

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

function handleRuntimeReady() {
  runtimeReady.value = true
  runtimeInitMs.value = runtimeLoadStartedAt
    ? Math.max(0, Math.round(performance.now() - runtimeLoadStartedAt))
    : null

  analytics.track('cue_id_renderer_ready', {
    renderer: 'tresjs_procedural',
    runtime_tier: runtimeDecision.value?.tier || null,
    init_ms: runtimeInitMs.value,
    dpr_cap: runtimeDecision.value?.dprCap || null
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

  analytics.track('cue_id_glb_lab_asset_loaded', {
    asset_id: metrics.assetId,
    bytes: metrics.bytes,
    load_ms: metrics.loadMs,
    parse_ms: metrics.parseMs,
    first_frame_ms: metrics.firstFrameMs,
    total_ready_ms: totalReadyMs,
    runtime_tier: runtimeDecision.value?.tier || null
  })
}

function handleRuntimeFailed() {
  runtimeReady.value = false
  analytics.track('cue_id_renderer_failed', {
    renderer: 'tresjs_procedural',
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
    aria-label="CUE ID static preview"
  >
    <div class="cue-id-stage__grid" aria-hidden="true" />
    <div class="cue-id-stage__halo cue-id-stage__halo--one" aria-hidden="true" />
    <div class="cue-id-stage__halo cue-id-stage__halo--two" aria-hidden="true" />

    <div class="cue-id-stage__figure" aria-hidden="true">
      <i class="cue-id-stage__head" />
      <i class="cue-id-stage__torso" />
      <i class="cue-id-stage__arm cue-id-stage__arm--left" />
      <i class="cue-id-stage__arm cue-id-stage__arm--right" />
      <i class="cue-id-stage__accessory" :data-accessory="config.accessory || 'none'" />
    </div>

    <div class="cue-id-stage__scan" aria-hidden="true" />

    <ClientOnly>
      <LazyCueIdScene
        v-if="interactive && runtimeWanted && runtimeDecision"
        :config="config"
        :decision="runtimeDecision"
        :lab-asset="labAsset"
        @ready="handleRuntimeReady"
        @failed="handleRuntimeFailed"
        @lab-asset-loaded="handleLabAssetLoaded"
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
  position:absolute; left:50%; top:47%; width:190px; height:330px;
  transform:translate(-50%,-50%) rotateY(-12deg);
  transform-style:preserve-3d; filter:drop-shadow(0 38px 46px rgba(0,0,0,.8))
}
.cue-id-stage__figure i{position:absolute;display:block}
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
  left:57px; top:0; width:76px; height:88px; border-radius:45% 45% 40% 40%;
  background:linear-gradient(120deg,#4b5149 0%,#151815 46%,#969d90 49%,#242924 57%,#090a09 100%);
  box-shadow:inset -10px 0 20px rgba(201,255,45,.09)
}
.cue-id-stage__head::after{content:'';position:absolute;left:8px;right:8px;top:36px;height:7px;background:var(--cue-accent);box-shadow:0 0 18px color-mix(in srgb,var(--cue-accent) 55%,transparent)}
.cue-id-stage__torso {
  left:26px; top:74px; width:138px; height:200px;
  clip-path:polygon(18% 0,82% 0,100% 26%,82% 100%,18% 100%,0 26%);
  background:linear-gradient(120deg,#52584f,#151815 34%,#050605 66%,#292f28);
  border:1px solid rgba(255,255,255,.14)
}
.cue-id-stage__torso::after{content:'CUE';position:absolute;left:50%;top:55%;transform:translate(-50%,-50%) rotate(-90deg);font:800 13px/1 monospace;letter-spacing:.3em;color:rgba(255,255,255,.4)}
.cue-id-stage__arm{top:92px;width:34px;height:170px;background:linear-gradient(#262a25,#080908);border:1px solid rgba(255,255,255,.09)}
.cue-id-stage__arm--left{left:4px;transform:rotate(8deg)}.cue-id-stage__arm--right{right:4px;transform:rotate(-8deg)}
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
.cue-id-stage--outfit-hoodie .cue-id-stage__torso::before{content:'';position:absolute;left:28px;right:28px;top:-13px;height:44px;border:1px solid rgba(255,255,255,.13);border-radius:50% 50% 35% 35%}
.cue-id-stage--outfit-bomber .cue-id-stage__torso{box-shadow:inset 0 0 0 8px rgba(255,255,255,.035)}
.cue-id-stage--outfit-tank .cue-id-stage__torso{clip-path:polygon(30% 0,70% 0,100% 26%,82% 100%,18% 100%,0 26%)}
.cue-id-stage__accessory[data-accessory="glasses"]{left:60px;top:34px;width:70px;height:12px;border:2px solid #d7d7d7;border-radius:8px}
.cue-id-stage__accessory[data-accessory="cap"]{left:53px;top:-7px;width:84px;height:22px;border-radius:50% 50% 20% 20%;background:#171a17}
.cue-id-stage__accessory[data-accessory="headphones"]{left:48px;top:18px;width:94px;height:76px;border:5px solid #252a24;border-bottom:0;border-radius:50% 50% 0 0}
.cue-id-stage__accessory[data-accessory="none"]{display:none}
.cue-id-stage--compact{min-height:360px}
@media(prefers-reduced-motion:reduce){.cue-id-stage--runtime-ready .cue-id-stage__figure{transition:none}}
@media(prefers-reduced-motion:no-preference){.cue-id-stage__figure{animation:cue-id-float 5.8s ease-in-out infinite}.cue-id-stage__scan{animation:cue-id-scan 4.4s ease-in-out infinite}}
@keyframes cue-id-float{0%,100%{translate:0 0}50%{translate:0 -8px}}@keyframes cue-id-scan{0%,100%{transform:translateY(-80px);opacity:.2}50%{transform:translateY(95px);opacity:.9}}
@media(max-width:680px){.cue-id-stage{min-height:430px}.cue-id-stage__diagnostics{left:10px;top:10px;padding:8px 10px;gap:3px 8px;font-size:8px;max-width:230px}.cue-id-stage__halo--one{width:300px;height:300px}.cue-id-stage__halo--two{width:410px;height:410px}.cue-id-stage__figure{transform:translate(-50%,-52%) scale(.88) rotateY(-12deg)}.cue-id-stage__meta{left:16px;right:16px;bottom:16px}.cue-id-stage__meta small{display:none}}
</style>
