<script setup lang="ts">
import type { CueNotification } from '../domain/notification'

const props = defineProps<{
  locale: 'es' | 'en'
}>()

const emit = defineEmits<{
  openBooking: [notification: CueNotification]
}>()

const notifications = useNotifications()
const open = ref(false)
const loading = ref(false)
const error = ref('')
const items = ref<CueNotification[]>([])
const unread = ref(0)
const root = ref<HTMLElement | null>(null)
let refreshTimer: ReturnType<typeof window.setInterval> | null = null

const copy = computed(() => props.locale === 'es' ? {
  label: 'Notificaciones',
  title: 'Notificaciones',
  empty: 'No tienes avisos pendientes.',
  markAll: 'Marcar todo como leído',
  booking: 'Nueva solicitud de booking',
  reply: 'Nueva respuesta del promotor',
  bookingBody: 'Ha entrado una nueva solicitud. Revisa los detalles y decide el siguiente movimiento.',
  replyBody: 'La conversación se ha movido. Abre el booking para ver la respuesta.',
  open: 'Abrir booking',
  retry: 'No se pudieron cargar las notificaciones.',
  close: 'Cerrar notificaciones',
  new: 'Nuevo'
} : {
  label: 'Notifications',
  title: 'Notifications',
  empty: 'You have no pending notifications.',
  markAll: 'Mark all as read',
  booking: 'New booking request',
  reply: 'New promoter reply',
  bookingBody: 'A new booking request has arrived. Review the details and decide the next move.',
  replyBody: 'The conversation moved. Open the booking to see the reply.',
  open: 'Open booking',
  retry: 'Notifications could not be loaded.',
  close: 'Close notifications',
  new: 'New'
})

function titleFor(item: CueNotification) {
  return item.kind === 'promoter_reply_received' ? copy.value.reply : copy.value.booking
}

function bodyFor(item: CueNotification) {
  return item.kind === 'promoter_reply_received' ? copy.value.replyBody : copy.value.bookingBody
}

function timeLabel(value: string) {
  try {
    return new Intl.DateTimeFormat(props.locale === 'es' ? 'es-ES' : 'en-GB', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(value))
  } catch {
    return ''
  }
}

async function refreshCount() {
  try {
    unread.value = await notifications.unreadCount()
  } catch {
    unread.value = 0
  }
}

async function load() {
  loading.value = true
  error.value = ''
  try {
    const [nextItems, nextUnread] = await Promise.all([
      notifications.list(40),
      notifications.unreadCount()
    ])
    items.value = nextItems
    unread.value = nextUnread
  } catch {
    error.value = copy.value.retry
  } finally {
    loading.value = false
  }
}

async function toggle() {
  open.value = !open.value
  if (open.value) await load()
}

async function markAll() {
  if (!unread.value) return
  try {
    await notifications.markAllRead()
    const readAt = new Date().toISOString()
    items.value = items.value.map(item => item.read_at ? item : { ...item, read_at: readAt })
    unread.value = 0
  } catch {
    error.value = copy.value.retry
  }
}

async function select(item: CueNotification) {
  if (!item.read_at) {
    try {
      const updated = await notifications.markRead(item.id)
      items.value = items.value.map(candidate => candidate.id === item.id ? updated : candidate)
      unread.value = Math.max(0, unread.value - 1)
    } catch {
      // Navigation still works even if read-state update fails.
    }
  }

  open.value = false
  emit('openBooking', item)
}

function handleDocumentClick(event: MouseEvent) {
  if (!open.value || !root.value) return
  if (!root.value.contains(event.target as Node)) open.value = false
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') open.value = false
}

function handleVisibilityChange() {
  if (document.visibilityState === 'visible') {
    if (open.value) void load()
    else void refreshCount()
  }
}

function handleNotificationStateChanged() {
  if (open.value) void load()
  else void refreshCount()
}

onMounted(() => {
  refreshCount()
  refreshTimer = window.setInterval(() => {
    if (document.visibilityState !== 'visible') return
    if (open.value) void load()
    else void refreshCount()
  }, 60_000)

  document.addEventListener('click', handleDocumentClick)
  document.addEventListener('keydown', handleKeydown)
  document.addEventListener('visibilitychange', handleVisibilityChange)
  window.addEventListener('focus', refreshCount)
  window.addEventListener('cuebooker:notifications-changed', handleNotificationStateChanged)
})

onBeforeUnmount(() => {
  if (refreshTimer) window.clearInterval(refreshTimer)
  document.removeEventListener('click', handleDocumentClick)
  document.removeEventListener('keydown', handleKeydown)
  document.removeEventListener('visibilitychange', handleVisibilityChange)
  window.removeEventListener('focus', refreshCount)
  window.removeEventListener('cuebooker:notifications-changed', handleNotificationStateChanged)
})
</script>

<template>
  <div ref="root" class="notification-center">
    <button
      class="notification-trigger"
      type="button"
      :aria-label="copy.label"
      :title="copy.label"
      :aria-expanded="open"
      aria-haspopup="dialog"
      @click.stop="toggle"
    >
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" />
      </svg>
      <span class="notification-trigger__label">{{ copy.label }}</span>
      <span v-if="unread" class="notification-badge" :aria-label="`${unread} ${copy.new}`">{{ unread > 9 ? '9+' : unread }}</span>
    </button>

    <section
      v-if="open"
      class="notification-panel"
      role="dialog"
      :aria-label="copy.title"
    >
      <header>
        <div>
          <span>{{ copy.title }}</span>
          <strong v-if="unread">{{ unread }} {{ copy.new.toLowerCase() }}</strong>
        </div>
        <button type="button" :aria-label="copy.close" @click="open = false">×</button>
      </header>

      <div class="notification-toolbar">
        <button type="button" :disabled="!unread" @click="markAll">{{ copy.markAll }}</button>
      </div>

      <p v-if="loading" class="notification-state">…</p>
      <p v-else-if="error" class="notification-state notification-state--error">{{ error }}</p>
      <p v-else-if="!items.length" class="notification-state">{{ copy.empty }}</p>

      <div v-else class="notification-list">
        <button
          v-for="item in items"
          :key="item.id"
          class="notification-item"
          :class="{ 'notification-item--unread': !item.read_at }"
          type="button"
          @click="select(item)"
        >
          <span class="notification-dot" aria-hidden="true" />
          <span class="notification-copy">
            <span class="notification-meta">
              <strong>{{ titleFor(item) }}</strong>
              <time :datetime="item.created_at">{{ timeLabel(item.created_at) }}</time>
            </span>
            <span class="notification-body">{{ bodyFor(item) }}</span>
            <span class="notification-action">{{ copy.open }}</span>
          </span>
        </button>
      </div>
    </section>
  </div>
</template>

<style scoped>
.notification-center { position: relative; }
.notification-trigger { position:relative; display:flex; align-items:center; gap:8px; min-height:36px; padding:7px 11px; border:1px solid var(--cue-border); border-radius:999px; background:transparent; color:var(--cue-muted); cursor:pointer; }
.notification-trigger__label { font:700 10px/1 monospace; text-transform:uppercase; letter-spacing:.06em; }
.notification-trigger:hover, .notification-trigger:focus-visible { border-color: var(--cue-accent); color: var(--cue-text); outline: none; }
.notification-trigger svg { width:18px; height:18px; flex:0 0 auto; fill:none; stroke:currentColor; stroke-width:1.7; stroke-linecap:round; stroke-linejoin:round; }
.notification-badge { position: absolute; top: -5px; right: -5px; display: grid; min-width: 17px; height: 17px; place-items: center; box-sizing: border-box; padding: 0 4px; border: 2px solid var(--cue-bg); border-radius: 999px; background: var(--cue-accent); color: #080808; font: 900 9px/1 monospace; }
.notification-panel { position:fixed; z-index:80; top:64px; right:18px; bottom:18px; width:min(420px,calc(100vw - 36px)); overflow:hidden; border:1px solid var(--cue-border); background:var(--cue-surface); color:var(--cue-text); box-shadow:0 22px 70px var(--cue-shadow); }
.notification-panel > header { display: flex; align-items: center; justify-content: space-between; gap: 18px; padding: 16px 16px 13px; border-bottom: 1px solid var(--cue-border); }
.notification-panel > header div { min-width: 0; }
.notification-panel > header span { display: block; font-size: 15px; font-weight: 900; }
.notification-panel > header strong { display: block; margin-top: 3px; color: var(--cue-accent); font: 700 9px/1.2 monospace; letter-spacing: .08em; text-transform: uppercase; }
.notification-panel > header button { width: 34px; height: 34px; border: 0; background: transparent; color: var(--cue-muted); cursor: pointer; font-size: 24px; line-height: 1; }
.notification-toolbar { display: flex; justify-content: flex-end; padding: 9px 14px; border-bottom: 1px solid var(--cue-border); }
.notification-toolbar button { border: 0; background: transparent; color: var(--cue-muted); cursor: pointer; font: 700 10px/1.2 monospace; text-decoration: underline; text-underline-offset: 3px; }
.notification-toolbar button:disabled { opacity: .35; cursor: default; }
.notification-list { height:calc(100% - 108px); overflow-y:auto; overscroll-behavior:contain; }
.notification-item { display: grid; grid-template-columns: 8px minmax(0,1fr); gap: 11px; width: 100%; padding: 16px; border: 0; border-bottom: 1px solid var(--cue-border); background: transparent; color: var(--cue-text); text-align: left; cursor: pointer; }
.notification-item:hover, .notification-item:focus-visible { background: color-mix(in srgb, var(--cue-accent) 5%, var(--cue-surface)); outline: none; }
.notification-item--unread { background: color-mix(in srgb, var(--cue-accent) 3%, var(--cue-surface)); }
.notification-dot { width: 7px; height: 7px; margin-top: 5px; border: 1px solid var(--cue-border); border-radius: 50%; }
.notification-item--unread .notification-dot { border-color: var(--cue-accent); background: var(--cue-accent); box-shadow: 0 0 10px color-mix(in srgb, var(--cue-accent) 36%, transparent); }
.notification-copy { min-width: 0; }
.notification-meta { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; }
.notification-meta strong { min-width: 0; font-size: 13px; line-height: 1.3; }
.notification-meta time { flex: 0 0 auto; color: var(--cue-muted); font: 700 9px/1.3 monospace; }
.notification-body { display: block; margin-top: 7px; color: var(--cue-muted); font-size: 12px; line-height: 1.45; }
.notification-action { display: inline-block; margin-top: 10px; color: var(--cue-accent); font: 800 10px/1.2 monospace; text-transform: uppercase; }
.notification-state { margin: 0; padding: 28px 18px; color: var(--cue-muted); font-size: 12px; text-align: center; }
.notification-state--error { color: #ff8d8d; }

@media (max-width: 680px) {
  .notification-trigger { width:36px; min-width:36px; padding:8px; border-radius:50%; justify-content:center; }
  .notification-trigger__label { display:none; }
  .notification-panel { position:fixed; top:auto; right:0; bottom:0; left:0; width:100%; height:min(72dvh,620px); border-right:0; border-bottom:0; border-left:0; box-shadow:0 -20px 60px var(--cue-shadow); }
  .notification-list { height:calc(100% - 108px); }
  .notification-item { padding:15px 16px; }
  .notification-meta { gap:8px; }
}
</style>
