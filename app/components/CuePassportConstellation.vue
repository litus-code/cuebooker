<script setup lang="ts">
import type { CuePassportCountryNode } from '../domain/cuePassport'

const props = withDefaults(defineProps<{
  countries: CuePassportCountryNode[]
  countryId?: string
  cityId?: string
  locale?: 'es' | 'en'
}>(), {
  countryId: '',
  cityId: '',
  locale: 'es'
})

const emit = defineEmits<{
  selectCountry: [countryId: string]
  selectCity: [cityId: string]
  emptyAction: []
}>()

const zoom = ref(1)
const offsetX = ref(0)
const offsetY = ref(0)
const dragging = ref(false)
const dragMoved = ref(false)
const tooltipCityId = ref('')
const viewportEl = ref<HTMLElement | null>(null)
const tooltipEl = ref<HTMLElement | null>(null)
const viewportSize = reactive({ width: 1000, height: 520 })
const tooltipSize = reactive({ width: 230, height: 150 })
const dragStart = reactive({ x: 0, y: 0, offsetX: 0, offsetY: 0 })

const activeCountry = computed(() =>
  props.countries.find(country => country.id === props.countryId)
    || props.countries[0]
    || null
)

function hash(value: string) {
  let result = 0
  for (let index = 0; index < value.length; index += 1) {
    result = ((result << 5) - result + value.charCodeAt(index)) | 0
  }
  return Math.abs(result)
}

const nodes = computed(() => {
  const cities = activeCountry.value?.cities || []
  const count = cities.length

  return cities.map((city, index) => {
    if (count === 1) {
      return {
        city,
        x: 500,
        y: 245,
        size: Math.min(22, 11 + city.bookings.length * 2)
      }
    }

    if (count === 2) {
      return {
        city,
        x: index === 0 ? 340 : 660,
        y: index === 0 ? 225 : 285,
        size: Math.min(22, 11 + city.bookings.length * 2)
      }
    }

    const angle = (index / count) * Math.PI * 2 - Math.PI / 2
    const seed = hash(city.id)
    const radialOffset = (seed % 46) - 23
    const x = 500 + Math.cos(angle) * (300 + radialOffset)
    const y = 255 + Math.sin(angle) * (140 + radialOffset * .4)

    return {
      city,
      x: Math.round(x),
      y: Math.round(y),
      size: Math.min(22, 11 + city.bookings.length * 2)
    }
  })
})

const edges = computed(() => {
  if (nodes.value.length < 2) return []
  const connections: Array<{ id: string; x1: number; y1: number; x2: number; y2: number }> = []

  nodes.value.forEach((node, index) => {
    if (index === 0) return
    const previous = nodes.value[index - 1]
    if (!previous) return
    connections.push({
      id: `${previous.city.id}-${node.city.id}`,
      x1: previous.x,
      y1: previous.y,
      x2: node.x,
      y2: node.y
    })
  })

  if (nodes.value.length > 2) {
    const first = nodes.value[0]
    const last = nodes.value[nodes.value.length - 1]
    if (first && last) {
      connections.push({
        id: `${last.city.id}-${first.city.id}`,
        x1: last.x,
        y1: last.y,
        x2: first.x,
        y2: first.y
      })
    }
  }

  return connections
})

const transform = computed(() => `translate(${offsetX.value} ${offsetY.value}) scale(${zoom.value})`)

const selectedNode = computed(() => nodes.value.find(node => node.city.id === tooltipCityId.value) || null)

const selectedNodePosition = computed(() => {
  if (!selectedNode.value) return { left: '50%', top: '50%' }

  const viewportWidth = Math.max(viewportSize.width, 1)
  const viewportHeight = Math.max(viewportSize.height, 1)
  const viewBoxWidth = 1000
  const viewBoxHeight = 520
  const renderScale = Math.min(viewportWidth / viewBoxWidth, viewportHeight / viewBoxHeight)
  const renderWidth = viewBoxWidth * renderScale
  const renderHeight = viewBoxHeight * renderScale
  const letterboxX = (viewportWidth - renderWidth) / 2
  const letterboxY = (viewportHeight - renderHeight) / 2

  const x = offsetX.value + selectedNode.value.x * zoom.value
  const y = offsetY.value + selectedNode.value.y * zoom.value

  const anchorX = letterboxX + x * renderScale
  const anchorY = letterboxY + y * renderScale
  const horizontalPadding = 10
  const verticalPadding = 10
  const halfTooltipWidth = Math.max(80, tooltipSize.width / 2)

  const left = Math.min(
    viewportWidth - halfTooltipWidth - horizontalPadding,
    Math.max(halfTooltipWidth + horizontalPadding, anchorX)
  )
  const top = Math.min(
    viewportHeight - verticalPadding,
    Math.max(tooltipSize.height + 22 + verticalPadding, anchorY)
  )

  return {
    left: `${left}px`,
    top: `${top}px`
  }
})

const selectedMedia = computed(() => {
  if (!selectedNode.value) return []
  const seen = new Set<string>()
  return selectedNode.value.city.bookings
    .flatMap(booking => booking.media)
    .filter(item => {
      if (seen.has(item.id)) return false
      seen.add(item.id)
      return true
    })
    .slice(0, 4)
})

const selectedDates = computed(() =>
  [...(selectedNode.value?.city.bookings || [])]
    .filter(booking => Boolean(booking.eventDate))
    .sort((a, b) => String(b.eventDate).localeCompare(String(a.eventDate)))
    .slice(0, 4)
)

function safeMediaUrl(value: string | null | undefined) {
  if (!value) return null
  return /^https?:\/\//i.test(value) ? value : null
}

function mediaPreview(item: { media_type: string; thumbnail_url?: string | null; media_url?: string | null }) {
  if (safeMediaUrl(item.thumbnail_url)) return item.thumbnail_url
  return item.media_type === 'image' ? safeMediaUrl(item.media_url) : null
}

function mediaLink(item: { permalink?: string | null; media_url?: string | null }) {
  return safeMediaUrl(item.permalink) || safeMediaUrl(item.media_url)
}

function formatPassportDate(value: string | null) {
  if (!value) return ''
  const date = new Date(`${value}T12:00:00`)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat(props.locale === 'es' ? 'es-ES' : 'en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  }).format(date)
}

function zoomBy(delta: number) {
  zoom.value = Math.min(1.8, Math.max(.7, Number((zoom.value + delta).toFixed(2))))
}

function resetView() {
  zoom.value = 1
  offsetX.value = 0
  offsetY.value = 0
}

function selectNode(cityId: string) {
  tooltipCityId.value = cityId
  emit('selectCity', cityId)
}

function closeTooltip() {
  tooltipCityId.value = ''
}

function syncViewportSize() {
  if (!viewportEl.value) return
  viewportSize.width = viewportEl.value.clientWidth || 1000
  viewportSize.height = viewportEl.value.clientHeight || 520
}

function syncTooltipSize() {
  if (!tooltipEl.value) return
  tooltipSize.width = tooltipEl.value.offsetWidth || 230
  tooltipSize.height = tooltipEl.value.offsetHeight || 150
}

function startDrag(event: PointerEvent) {
  if ((event.target as Element)?.closest('button, a, [role="button"], .passport-constellation__tooltip')) return
  dragging.value = true
  dragMoved.value = false
  dragStart.x = event.clientX
  dragStart.y = event.clientY
  dragStart.offsetX = offsetX.value
  dragStart.offsetY = offsetY.value
  ;(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId)
}

function moveDrag(event: PointerEvent) {
  if (!dragging.value) return
  const deltaX = event.clientX - dragStart.x
  const deltaY = event.clientY - dragStart.y
  if (Math.hypot(deltaX, deltaY) > 4) dragMoved.value = true
  const scale = 1000 / Math.max((event.currentTarget as HTMLElement).clientWidth, 1)
  offsetX.value = dragStart.offsetX + deltaX * scale
  offsetY.value = dragStart.offsetY + deltaY * scale
}

function stopDrag() {
  dragging.value = false
  dragMoved.value = false
}

function finishDrag() {
  if (!dragging.value) return
  const wasDrag = dragMoved.value
  stopDrag()
  if (!wasDrag) closeTooltip()
}

watch(() => props.countryId, () => {
  closeTooltip()
  resetView()
})

watch(nodes, currentNodes => {
  if (!tooltipCityId.value) return
  if (!currentNodes.some(node => node.city.id === tooltipCityId.value)) {
    closeTooltip()
  }
})

watch(selectedNode, async node => {
  if (!node) return
  await nextTick()
  syncTooltipSize()
})

let viewportObserver: ResizeObserver | null = null
let tooltipObserver: ResizeObserver | null = null

onMounted(() => {
  syncViewportSize()
  if (typeof ResizeObserver === 'undefined' || !viewportEl.value) return
  viewportObserver = new ResizeObserver(syncViewportSize)
  viewportObserver.observe(viewportEl.value)
})

watch(tooltipEl, element => {
  tooltipObserver?.disconnect()
  tooltipObserver = null
  if (!element) return
  syncTooltipSize()
  if (typeof ResizeObserver === 'undefined') return
  tooltipObserver = new ResizeObserver(syncTooltipSize)
  tooltipObserver.observe(element)
})

onBeforeUnmount(() => {
  viewportObserver?.disconnect()
  tooltipObserver?.disconnect()
  viewportObserver = null
  tooltipObserver = null
})
</script>

<template>
  <section class="passport-constellation">
    <header v-if="nodes.length" class="passport-constellation__toolbar">
      <div class="passport-constellation__countries" aria-label="Countries">
        <button
          v-for="country in countries"
          :key="country.id"
          type="button"
          :class="{ active: activeCountry?.id === country.id }"
          @click="emit('selectCountry', country.id)"
        >
          {{ country.code }}
        </button>
      </div>

      <div class="passport-constellation__controls">
        <button type="button" :aria-label="locale === 'es' ? 'Alejar' : 'Zoom out'" @click="zoomBy(-.15)">−</button>
        <span>{{ Math.round(zoom * 100) }}%</span>
        <button type="button" :aria-label="locale === 'es' ? 'Acercar' : 'Zoom in'" @click="zoomBy(.15)">+</button>
        <button type="button" @click="resetView">{{ locale === 'es' ? 'CENTRAR' : 'RESET' }}</button>
      </div>
    </header>

    <div
      ref="viewportEl"
      class="passport-constellation__viewport"
      :class="{ dragging }"
      @pointerdown="startDrag"
      @pointermove="moveDrag"
      @pointerup="finishDrag"
      @pointercancel="stopDrag"
      @lostpointercapture="stopDrag"
    >
      <svg viewBox="0 0 1000 520" role="img" :aria-label="locale === 'es' ? 'Constelación de ciudades del artista' : 'Artist city constellation'">
        <defs>
          <radialGradient id="passport-node-glow">
            <stop offset="0%" stop-color="currentColor" stop-opacity=".9" />
            <stop offset="100%" stop-color="currentColor" stop-opacity="0" />
          </radialGradient>
        </defs>

        <g :transform="transform">
          <g class="passport-constellation__grid" aria-hidden="true">
            <path v-for="line in 12" :key="`h-${line}`" :d="`M 0 ${line * 40} H 1000`" />
            <path v-for="line in 25" :key="`v-${line}`" :d="`M ${line * 40} 0 V 520`" />
          </g>

          <g class="passport-constellation__edges" aria-hidden="true">
            <line
              v-for="edge in edges"
              :key="edge.id"
              :x1="edge.x1"
              :y1="edge.y1"
              :x2="edge.x2"
              :y2="edge.y2"
            />
          </g>

          <g
            v-for="node in nodes"
            :key="node.city.id"
            class="passport-constellation__node"
            :class="{ active: node.city.id === cityId, 'tooltip-open': node.city.id === tooltipCityId }"
            :transform="`translate(${node.x} ${node.y})`"
            role="button"
            tabindex="0"
            :aria-label="`${node.city.name}, ${node.city.bookings.length} dates`"
            @click.stop="selectNode(node.city.id)"
            @keydown.enter.prevent="selectNode(node.city.id)"
            @keydown.space.prevent="selectNode(node.city.id)"
          >
            <circle class="passport-constellation__halo" :r="node.size + 18" />
            <circle class="passport-constellation__dot" :r="node.size" />
            <text x="0" :y="node.size + 24" text-anchor="middle">{{ node.city.name }}</text>
            <text class="passport-constellation__count" x="0" :y="node.size + 39" text-anchor="middle">
              {{ node.city.bookings.length }} {{ locale === 'es' ? 'FECHAS' : 'DATES' }}
            </text>
          </g>
        </g>
      </svg>

      <aside
        v-if="selectedNode"
        ref="tooltipEl"
        class="passport-constellation__tooltip"
        :style="selectedNodePosition"
        @pointerdown.stop
      >
        <span>{{ selectedNode.city.countryCode }} / CITY</span>
        <strong>{{ selectedNode.city.name }}</strong>
        <div class="passport-constellation__venues">
          <small v-for="venue in selectedNode.city.venues.slice(0, 5)" :key="venue.id">
            {{ venue.name }} · {{ venue.bookings.length }}
          </small>
        </div>

        <div v-if="selectedDates.length" class="passport-constellation__dates">
          <span>{{ locale === 'es' ? 'FECHAS' : 'DATES' }}</span>
          <small v-for="booking in selectedDates" :key="booking.id">
            <b>{{ formatPassportDate(booking.eventDate) }}</b>
            {{ booking.eventName || (locale === 'es' ? 'Evento confirmado' : 'Confirmed event') }}
          </small>
        </div>

        <div v-if="selectedMedia.length" class="passport-constellation__media">
          <a
            v-for="item in selectedMedia"
            :key="item.id"
            :href="mediaLink(item) || undefined"
            :target="mediaLink(item) ? '_blank' : undefined"
            :rel="mediaLink(item) ? 'noopener noreferrer' : undefined"
            :aria-label="`${item.source} ${item.media_type}`"
            @click.stop
          >
            <img
              v-if="mediaPreview(item)"
              :src="mediaPreview(item) || ''"
              alt=""
              loading="lazy"
            >
            <span v-else>{{ item.media_type.toUpperCase() }}</span>
          </a>
        </div>
      </aside>

      <div v-if="!nodes.length" class="passport-constellation__empty">
        <span>FIRST STAMP</span>
        <strong>{{ locale === 'es' ? 'TU PASSPORT EMPIEZA CON UNA FECHA CONFIRMADA.' : 'YOUR PASSPORT STARTS WITH A CONFIRMED DATE.' }}</strong>
        <p>{{ locale === 'es'
          ? 'Confirma un booking con ciudad y venue para que Cuebooker pueda construir tu primera parada real.'
          : 'Confirm a booking with a city and venue so Cuebooker can build your first real stop.' }}</p>
        <button type="button" @click.stop="emit('emptyAction')">
          {{ locale === 'es' ? 'Ir a Bookings' : 'Go to Bookings' }}
        </button>
      </div>
    </div>

    <footer v-if="nodes.length" class="passport-constellation__hint">
      <span>{{ locale === 'es' ? 'ARRASTRA PARA EXPLORAR' : 'DRAG TO EXPLORE' }}</span>
      <span>{{ locale === 'es' ? 'HAZ CLICK EN UN NODO PARA VER DETALLES' : 'CLICK A NODE TO VIEW DETAILS' }}</span>
    </footer>
  </section>
</template>

<style scoped>
.passport-constellation {
  --pc-accent:var(--cue-accent,#dfff35);
  display:grid;
  width:100%;
  min-width:0;
  gap:10px;
}

.passport-constellation__toolbar {
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:12px;
}

.passport-constellation__countries,
.passport-constellation__controls {
  display:flex;
  gap:6px;
  align-items:center;
  min-width:0;
}

.passport-constellation__countries {
  overflow:auto;
}

.passport-constellation button {
  flex:none;
  min-height:32px;
  padding:0 9px;
  border:1px solid #303030;
  border-radius:7px;
  background:#0a0a0a;
  color:#777;
  cursor:pointer;
  font:800 8px/1 monospace;
}

.passport-constellation button:hover,
.passport-constellation button.active {
  border-color:var(--pc-accent);
  color:var(--pc-accent);
}

.passport-constellation__controls > span {
  width:42px;
  color:#666;
  font:700 7px/1 monospace;
  text-align:center;
}

.passport-constellation__viewport {
  position:relative;
  width:100%;
  height:360px;
  min-height:360px;
  overflow:hidden;
  border:1px solid #272727;
  border-radius:10px;
  background:
    radial-gradient(circle at 50% 44%,color-mix(in srgb,var(--pc-accent) 8%,transparent),transparent 34%),
    #080808;
  cursor:grab;
  touch-action:none;
  user-select:none;
}

.passport-constellation__viewport.dragging {
  cursor:grabbing;
}

.passport-constellation svg {
  display:block;
  width:100%;
  height:360px;
  min-height:360px;
  color:var(--pc-accent);
}

.passport-constellation__grid path {
  fill:none;
  stroke:#fff;
  stroke-width:.6;
  opacity:.035;
}

.passport-constellation__edges line {
  stroke:var(--pc-accent);
  stroke-width:1.1;
  opacity:.32;
  vector-effect:non-scaling-stroke;
}

.passport-constellation__node {
  outline:none;
  cursor:pointer;
}

.passport-constellation__halo {
  fill:url(#passport-node-glow);
  opacity:.1;
  transition:opacity .16s ease;
}

.passport-constellation__dot {
  fill:#080808;
  stroke:var(--pc-accent);
  stroke-width:2;
  vector-effect:non-scaling-stroke;
  transition:fill .16s ease,filter .16s ease;
}

.passport-constellation__node:hover .passport-constellation__halo,
.passport-constellation__node:focus-visible .passport-constellation__halo,
.passport-constellation__node.active .passport-constellation__halo {
  opacity:.24;
}

.passport-constellation__node.active .passport-constellation__dot {
  stroke-width:2.6;
}

.passport-constellation__node.tooltip-open .passport-constellation__halo {
  opacity:.42;
}

.passport-constellation__node.tooltip-open .passport-constellation__dot {
  fill:var(--pc-accent);
  stroke-width:2;
  filter:drop-shadow(0 0 10px color-mix(in srgb,var(--pc-accent) 55%,transparent));
}

.passport-constellation__node text {
  fill:#d5d5d5;
  font:800 12px/1 monospace;
  letter-spacing:.02em;
  text-transform:uppercase;
  pointer-events:auto;
}

.passport-constellation__node .passport-constellation__count {
  fill:#676767;
  font-size:8px;
}

.passport-constellation__empty {
  position:absolute;
  inset:0;
  display:grid;
  place-content:center;
  justify-items:center;
  gap:9px;
  padding:28px;
  text-align:center;
}
.passport-constellation__empty>span{
  color:var(--pc-accent);
  font:800 7px/1 monospace;
  letter-spacing:.1em;
}
.passport-constellation__empty>strong{
  max-width:430px;
  color:#d8d8d8;
  font-size:16px;
  line-height:1.05;
}
.passport-constellation__empty>p{
  max-width:440px;
  margin:0;
  color:#777;
  font-size:10px;
  line-height:1.5;
}
.passport-constellation__empty>button{
  margin-top:4px;
  border-color:var(--pc-accent);
  color:var(--pc-accent);
}

.passport-constellation__hint {
  display:flex;
  justify-content:space-between;
  gap:12px;
  color:#555;
  font:700 7px/1 monospace;
  letter-spacing:.08em;
}

@media (max-width:620px) {
  .passport-constellation__toolbar {
    align-items:stretch;
    flex-direction:column;
  }

  .passport-constellation__controls {
    justify-content:flex-start;
    overflow:auto;
  }

  .passport-constellation__viewport,
  .passport-constellation svg {
    height:300px;
    min-height:300px;
  }

  .passport-constellation__viewport {
    touch-action:pan-y;
  }

  .passport-constellation__hint {
    flex-direction:column;
    gap:5px;
  }
}


.passport-constellation__tooltip {
  position:absolute;
  z-index:5;
  display:grid;
  gap:5px;
  min-width:160px;
  max-width:230px;
  padding:10px 12px;
  transform:translate(-50%,calc(-100% - 18px));
  border:1px solid #353535;
  border-radius:9px;
  background:rgba(8,8,8,.96);
  box-shadow:0 14px 34px rgba(0,0,0,.42);
  pointer-events:auto;
  overscroll-behavior:contain;
}

.passport-constellation__tooltip::after {
  content:"";
  position:absolute;
  left:50%;
  bottom:-6px;
  width:10px;
  height:10px;
  transform:translateX(-50%) rotate(45deg);
  border-right:1px solid #353535;
  border-bottom:1px solid #353535;
  background:#080808;
}

.passport-constellation__tooltip > span {
  color:var(--pc-accent);
  font:800 7px/1 monospace;
  letter-spacing:.08em;
}

.passport-constellation__tooltip > strong {
  font-size:13px;
  text-transform:uppercase;
}

.passport-constellation__tooltip > div {
  display:grid;
  gap:4px;
  margin-top:2px;
}

.passport-constellation__tooltip small {
  color:#8a8a8a;
  font:700 8px/1.3 monospace;
}

@media (max-width:620px) {
  .passport-constellation__tooltip {
    left:12px !important;
    right:12px;
    top:auto !important;
    bottom:12px;
    width:auto;
    min-width:0;
    max-width:none;
    max-height:154px;
    overflow:auto;
    transform:none;
    touch-action:pan-y;
  }

  .passport-constellation__tooltip::after {
    display:none;
  }
}


.passport-constellation__media {
  display:grid !important;
  grid-template-columns:repeat(4,minmax(0,1fr));
  gap:5px !important;
  margin-top:4px;
  padding-top:7px;
  border-top:1px solid #292929;
}

.passport-constellation__media a {
  position:relative;
  display:grid;
  min-width:0;
  aspect-ratio:1;
  place-items:center;
  overflow:hidden;
  border:1px solid #333;
  border-radius:5px;
  background:#111;
  color:#777;
  text-decoration:none;
}

.passport-constellation__media img {
  width:100%;
  height:100%;
  object-fit:cover;
}

.passport-constellation__media span {
  font:800 6px/1 monospace;
  letter-spacing:.06em;
}


.passport-constellation__venues,
.passport-constellation__dates {
  display:grid;
  gap:4px;
}

.passport-constellation__dates {
  margin-top:3px;
  padding-top:7px;
  border-top:1px solid #292929;
}

.passport-constellation__dates > span {
  color:#606060;
  font:800 6px/1 monospace;
  letter-spacing:.08em;
}

.passport-constellation__dates small {
  display:grid;
  grid-template-columns:auto minmax(0,1fr);
  gap:7px;
  align-items:baseline;
  color:#8a8a8a;
}

.passport-constellation__dates b {
  color:#cfcfcf;
  font:800 7px/1 monospace;
  white-space:nowrap;
}

@media (prefers-reduced-motion:reduce) {
  .passport-constellation__halo,
  .passport-constellation__dot {
    transition:none;
  }

  .passport-constellation__node.tooltip-open .passport-constellation__dot {
    filter:none;
  }
}
</style>
