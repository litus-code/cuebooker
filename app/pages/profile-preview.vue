<script setup lang="ts">
import type { PublicArtistProfile } from '../domain/publicArtistProfile'

const router = useRouter()
const preferences = useCuePreferences()
const profile = useState<PublicArtistProfile | null>('cuebooker-profile-preview', () => null)
const ready = ref(false)

onMounted(() => {
  if (!profile.value) {
    try {
      const saved = window.sessionStorage.getItem('cuebooker.profile.preview')
      if (saved) profile.value = JSON.parse(saved) as PublicArtistProfile
    } catch {
      window.sessionStorage.removeItem('cuebooker.profile.preview')
    }
  }
  ready.value = true
})

function returnToEditor() {
  if (window.opener) {
    window.close()
    return
  }
  if (window.history.state?.back?.includes('/workspace')) router.back()
  else router.push('/workspace?view=profile')
}

useHead({ title: 'Vista previa del perfil · Cuebooker', meta: [{ name: 'robots', content: 'noindex,nofollow' }] })
</script>

<template>
  <div class="artist-preview-page">
    <div class="artist-preview-page__control">
      <span>{{ preferences.locale.value === 'es' ? 'VISTA PREVIA · SOLO TÚ' : 'PREVIEW · ONLY YOU' }}</span>
      <button type="button" @click="returnToEditor">
        <span aria-hidden="true">←</span> {{ preferences.locale.value === 'es' ? 'Volver a editar' : 'Back to editor' }}
      </button>
    </div>
    <PublicArtistProfile v-if="profile" :profile="profile" :locale="preferences.locale.value" preview />
    <main v-else-if="ready" class="artist-preview-page__empty">
      <h1>{{ preferences.locale.value === 'es' ? 'La vista previa ha caducado.' : 'Your preview has expired.' }}</h1>
      <button type="button" @click="returnToEditor">{{ preferences.locale.value === 'es' ? 'Volver al perfil' : 'Back to profile' }}</button>
    </main>
  </div>
</template>

<style scoped>
.artist-preview-page { min-height:100dvh; background:#070707; }
.artist-preview-page :deep(.public-artist-profile__topbar > span) { display:none; }
.artist-preview-page__control { position:fixed; z-index:30; top:16px; right:18px; display:flex; align-items:center; gap:18px; padding:7px 7px 7px 14px; border:1px solid rgba(255,255,255,.22); border-radius:4px; background:rgba(6,6,6,.83); color:#d2d2d2; backdrop-filter:blur(18px); box-shadow:0 16px 42px rgba(0,0,0,.35); }
.artist-preview-page__control span { font:800 9px/1.2 monospace; letter-spacing:.11em; }
.artist-preview-page__control button,.artist-preview-page__empty button { min-height:38px; padding:0 14px; border:0; border-radius:2px; background:#d9fa5c; color:#080808; cursor:pointer; font:800 11px/1 sans-serif; }
.artist-preview-page__control button:focus-visible,.artist-preview-page__empty button:focus-visible { outline:2px solid #fff; outline-offset:3px; }
.artist-preview-page__empty { display:grid; place-content:center; justify-items:start; gap:20px; min-height:100dvh; padding:24px; color:#f6f5f0; }
.artist-preview-page__empty h1 { max-width:600px; font-size:clamp(2.5rem,7vw,6rem);line-height:.95; }
@media(max-width:600px) { .artist-preview-page__control { top:10px;right:10px;gap:8px; } .artist-preview-page__control>span { display:none; } }
</style>
