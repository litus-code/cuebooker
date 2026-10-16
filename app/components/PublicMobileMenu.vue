<script setup lang="ts">
import type { RouteLocationRaw } from 'vue-router'
import es from '../../content/es/home.json'
import en from '../../content/en/home.json'
import { campaignDestination } from '../domain/publicCampaign'
const props = defineProps<{ signupTo?: RouteLocationRaw }>()
const emit = defineEmits<{ signup: [] }>()
const { locale } = useCuePreferences()
const route = useRoute()
const copy = computed(() => (locale.value === 'es' ? es : en).nav)
const dialog = ref<HTMLDialogElement>()
const open = ref(false)
const id = useId()
let previousOverflow = ''
let desktop: MediaQueryList | undefined
const links = computed(() => [
  { label: copy.value.product, to: campaignDestination(`${route.path === '/' ? '' : '/'}#product`,route.query) },
  { label: copy.value.audience, to: campaignDestination(`${route.path === '/' ? '' : '/'}#audience`,route.query) },
  { label: copy.value.system, to: campaignDestination(`${route.path === '/' ? '' : '/'}#system`,route.query) },
  { label: copy.value.login, to: campaignDestination('/access?mode=signin',route.query) }
])
function show() {
  if (open.value) return
  previousOverflow = document.documentElement.style.overflow
  dialog.value?.showModal()
  open.value = true
  document.documentElement.classList.add('mobile-menu-open')
  document.documentElement.style.overflow = 'hidden'
}
function closed() {
  if (!open.value) return
  open.value = false
  document.documentElement.classList.remove('mobile-menu-open')
  document.documentElement.style.overflow = previousOverflow
}
function close() { dialog.value?.close(); closed() }
function navigate(event: MouseEvent, to: string) {
  close()
  if (!to.startsWith('#')) return
  event.preventDefault()
  nextTick(() => {
    const section = document.getElementById(to.slice(1))
    section?.setAttribute('tabindex', '-1')
    section?.focus({ preventScroll: true })
    section?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' })
  })
}
function keydown(event: KeyboardEvent) {
  if (event.key !== 'Tab') return
  const controls = Array.from(dialog.value?.querySelectorAll<HTMLElement>('a[href], button:not([disabled])') ?? []).filter(el => el.getClientRects().length)
  const first = controls[0], last = controls.at(-1)
  if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus() }
  else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus() }
}
function resized(event: MediaQueryListEvent) { if (event.matches) close() }
onMounted(() => { desktop = matchMedia('(min-width: 1101px)'); desktop.addEventListener('change', resized) })
onBeforeUnmount(() => { desktop?.removeEventListener('change', resized); closed() })
watch(() => route.fullPath, close)
</script>
<template>
  <button class="public-menu-toggle" type="button" :aria-label="copy.open" :aria-expanded="open" :aria-controls="id" @click="show"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 7h18M3 17h18" /></svg></button>
  <Teleport to="body">
    <dialog :id="id" ref="dialog" class="public-mobile-menu" :aria-label="copy.label" @close="closed" @keydown="keydown">
      <div class="public-menu-tools"><CuePreferencesControl /><button type="button" :aria-label="copy.close" @click="close"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 5 14 14M19 5 5 19" /></svg></button></div>
      <nav :aria-label="copy.label"><NuxtLink v-for="link in links" :key="link.to" :to="link.to" @click="navigate($event, link.to)">{{ link.label }}</NuxtLink><NuxtLink class="public-menu-signup" :to="props.signupTo || campaignDestination('/access?mode=signup', route.query)" @click="close(); emit('signup')">{{ copy.signup }}</NuxtLink></nav>
    </dialog>
  </Teleport>
</template>
<style scoped>
.public-menu-toggle{display:none}
.public-menu-toggle,.public-menu-tools>button{width:44px;height:44px;padding:10px;flex-shrink:0;border:1px solid var(--cue-border);border-radius:50%;background:var(--cue-surface);color:var(--cue-text);cursor:pointer}
.public-menu-toggle svg,.public-menu-tools svg{width:24px;height:24px;fill:none;stroke:currentColor;stroke-width:1.5}
.public-mobile-menu{position:fixed;inset:0;width:100%;max-width:none;height:100%;max-height:none;margin:0;border:0;padding:24px;overflow-y:auto;background:var(--cue-bg);color:var(--cue-text)}
.public-mobile-menu::backdrop{background:#0009}
.public-menu-tools{display:flex;align-items:center;justify-content:space-between;gap:12px}
.public-mobile-menu nav{display:grid;margin-top:28px}
.public-mobile-menu nav a{display:flex;align-items:center;min-height:64px;padding:14px 8px;border-bottom:1px solid var(--cue-border);color:var(--cue-muted);text-decoration:none;transition:color .18s ease;font-size:22px;font-weight:700}
.public-mobile-menu nav a:not(.public-menu-signup):is(:hover,:focus-visible){color:var(--cue-accent)}
.public-mobile-menu nav .public-menu-signup{justify-content:center;margin-top:24px;border-radius:999px;background:var(--cue-accent);color:var(--cue-accent-ink);font-size:16px}
:is(.public-menu-toggle,.public-mobile-menu a,.public-mobile-menu button):focus-visible{outline:2px solid var(--cue-accent);outline-offset:5px}
@media(prefers-reduced-motion:reduce){.public-mobile-menu nav a{transition:none}}
@media(max-width:1100px){.public-menu-toggle{display:inline-flex;align-items:center;justify-content:center}}
</style>
