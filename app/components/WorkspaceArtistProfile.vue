<script setup lang="ts">
type ProfileSection = 'identity' | 'image' | 'portrait' | 'sound' | 'links' | 'booking' | 'distribution'

type ProfilePassport = {
  confirmedBookings: number
  cities: string[]
  venues: string[]
  milestones: Array<{ id: string; title: string; subtitle: string }>
}

type ProfileView = {
  stageName: string
  bio: string | null
  city: string | null
  countryCode: string | null
  languages: string[]
  primaryGenres: string[]
  secondaryGenres: string[]
  performanceFormats: string[]
  yearsActive: number | null
  websiteUrl: string | null
  instagramUrl: string | null
  soundcloudUrl: string | null
  mixcloudUrl: string | null
  youtubeUrl: string | null
  spotifyUrl: string | null
  coverUrl: string | null
  artistImageUrl: string | null
  artistCutoutUrl: string | null
  visualMode: string
  cueId: unknown | null
  acceptingRequests: boolean
}

const props = withDefaults(defineProps<{
  profile: ProfileView
  published?: boolean
  editable?: boolean
  saving?: boolean
  locale?: 'es' | 'en'
  passport?: ProfilePassport
}>(), {
  published: false,
  editable: true,
  saving: false,
  locale: 'es',
  passport: () => ({
    confirmedBookings: 0,
    cities: [],
    venues: [],
    milestones: []
  })
})

const emit = defineEmits<{
  edit: [section: ProfileSection]
  preview: []
  togglePublished: [value: boolean]
  toggleRequests: [value: boolean]
  cueId: []
  passport: []
}>()

const genres = computed(() => [...props.profile.primaryGenres, ...props.profile.secondaryGenres].slice(0, 5))
const portrait = computed(() => props.profile.artistCutoutUrl || props.profile.artistImageUrl || '')
const initials = computed(() => props.profile.stageName.split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0]).join('').toUpperCase() || 'DJ')
const location = computed(() => [props.profile.city, props.profile.countryCode].filter(Boolean).join(' · '))
const formats = computed(() => props.profile.performanceFormats.slice(0, 4))
const links = computed(() => [
  ['INSTAGRAM', props.profile.instagramUrl],
  ['SOUNDCLOUD', props.profile.soundcloudUrl],
  ['SPOTIFY', props.profile.spotifyUrl],
  ['MIXCLOUD', props.profile.mixcloudUrl],
  ['YOUTUBE', props.profile.youtubeUrl],
  ['WEBSITE', props.profile.websiteUrl]
].filter(([, url]) => Boolean(url)) as Array<[string, string]>)
</script>

<template>
  <section class="artist-workspace-profile">
    <header class="artist-workspace-profile__bar">
      <div>
        <span>ARTIST PROFILE</span>
        <strong :class="{ published }">{{ published ? (locale === 'es' ? 'PUBLICADO' : 'PUBLISHED') : (locale === 'es' ? 'BORRADOR' : 'DRAFT') }}</strong>
      </div>
      <div class="artist-workspace-profile__bar-actions">
        <button type="button" class="secondary" @click="emit('preview')">{{ locale === 'es' ? 'Ver como público' : 'Public view' }}</button>
        <button
          v-if="editable"
          type="button"
          class="primary"
          :disabled="saving"
          @click="emit('togglePublished', !published)"
        >
          {{ published ? (locale === 'es' ? 'Despublicar' : 'Unpublish') : (locale === 'es' ? 'Publicar perfil' : 'Publish profile') }}
        </button>
      </div>
    </header>

    <article class="artist-workspace-profile__portfolio">
      <section class="artist-workspace-profile__hero">
        <div class="artist-workspace-profile__cover">
          <img v-if="profile.coverUrl" :src="profile.coverUrl" alt="">
          <div v-else class="artist-workspace-profile__cover-fallback" />
          <div class="artist-workspace-profile__cover-grid" />
          <div class="artist-workspace-profile__brand"><CueBrand variant="icon" decorative /></div>
        </div>

        <button v-if="editable" type="button" class="artist-workspace-profile__edit artist-workspace-profile__edit--cover" @click="emit('edit','image')">
          {{ locale === 'es' ? 'Editar portada' : 'Edit cover' }}
        </button>

        <div class="artist-workspace-profile__hero-content">
          <button v-if="editable" type="button" class="artist-workspace-profile__portrait editable" @click="emit('edit','portrait')">
            <img v-if="portrait" :src="portrait" :alt="profile.stageName">
            <span v-else>{{ initials }}</span>
            <i aria-hidden="true" />
          </button>
          <div v-else class="artist-workspace-profile__portrait">
            <img v-if="portrait" :src="portrait" :alt="profile.stageName">
            <span v-else>{{ initials }}</span>
          </div>

          <div class="artist-workspace-profile__identity">
            <div class="artist-workspace-profile__meta">
              <span>{{ location || (locale === 'es' ? 'BASE PENDIENTE' : 'BASE PENDING') }}</span>
              <span>{{ profile.cueId ? 'CUE ID CONNECTED' : 'ARTIST PROFILE' }}</span>
            </div>
            <h1>{{ profile.stageName }}</h1>
            <p class="artist-workspace-profile__genres">{{ genres.join(' · ') || (locale === 'es' ? 'Añade tu sonido' : 'Add your sound') }}</p>
            <p class="artist-workspace-profile__bio">{{ profile.bio || (locale === 'es' ? 'Añade una bio breve que explique tu propuesta artística.' : 'Add a short bio that explains your artistic direction.') }}</p>
          </div>

          <div class="artist-workspace-profile__hero-actions">
            <button
              v-if="profile.acceptingRequests"
              type="button"
              class="artist-workspace-profile__booking"
              @click="emit('preview')"
            >REQUEST BOOKING</button>
            <button v-if="editable" type="button" @click="emit('edit','identity')">{{ locale === 'es' ? 'Editar identidad' : 'Edit identity' }}</button>
          </div>
        </div>
      </section>

      <section class="artist-workspace-profile__section">
        <div class="artist-workspace-profile__section-label"><span>01</span><strong>ABOUT</strong></div>
        <div class="artist-workspace-profile__section-content">
          <p class="lead">{{ profile.bio || (locale === 'es' ? 'Tu historia y posicionamiento artístico aparecerán aquí.' : 'Your artist story and positioning will appear here.') }}</p>
          <div class="artist-workspace-profile__facts">
            <div><span>BASE</span><strong>{{ profile.city || '—' }}</strong></div>
            <div><span>FORMAT</span><strong>{{ formats[0] || 'DJ SET' }}</strong></div>
            <div><span>LANGUAGES</span><strong>{{ profile.languages.slice(0,3).join(' · ') || '—' }}</strong></div>
            <div><span>ACTIVE</span><strong>{{ profile.yearsActive ? `${profile.yearsActive}+ YEARS` : '—' }}</strong></div>
          </div>
        </div>
        <button v-if="editable" type="button" class="artist-workspace-profile__section-edit" @click="emit('edit','identity')" aria-label="Edit about" />
      </section>

      <section class="artist-workspace-profile__section artist-workspace-profile__section--sound">
        <div class="artist-workspace-profile__section-label"><span>02</span><strong>SOUND</strong></div>
        <div class="artist-workspace-profile__section-content">
          <div class="artist-workspace-profile__sound">
            <strong v-for="genre in genres.slice(0,3)" :key="genre">{{ genre }}</strong>
            <strong v-if="!genres.length">YOUR SOUND</strong>
          </div>
          <p>{{ formats.join(' · ') || 'DJ SET' }}</p>
        </div>
        <button v-if="editable" type="button" class="artist-workspace-profile__section-edit" @click="emit('edit','sound')" aria-label="Edit sound" />
      </section>

      <section class="artist-workspace-profile__cue">
        <div class="artist-workspace-profile__cue-visual" aria-hidden="true">
          <span>CUE</span>
          <strong>ID</strong>
          <i />
        </div>
        <div>
          <span>CUE ID / BETA</span>
          <h2>{{ locale === 'es' ? 'TU IDENTIDAD VISUAL DIGITAL.' : 'YOUR DIGITAL ARTIST IDENTITY.' }}</h2>
          <p>{{ locale === 'es' ? 'Gestiona tu representación visual desde su espacio dedicado. El perfil funciona igualmente sin CUE ID.' : 'Manage your visual representation from its dedicated space. The profile works without CUE ID.' }}</p>
          <button type="button" @click="emit('cueId')">{{ locale === 'es' ? 'Gestionar CUE ID' : 'Manage CUE ID' }} <span class="arrow arrow--ne" aria-hidden="true" /></button>
        </div>
      </section>

      <CuePassportProfileSummary
        :bookings="passport.confirmedBookings"
        :cities="passport.cities"
        :venues="passport.venues"
        :milestones="passport.milestones"
        :locale="locale"
        :editable="editable"
        @manage="emit('passport')"
      />

      <section class="artist-workspace-profile__section artist-workspace-profile__section--links">
        <div class="artist-workspace-profile__section-label"><span>03</span><strong>LINKS</strong></div>
        <div class="artist-workspace-profile__section-content">
          <div v-if="links.length" class="artist-workspace-profile__links">
            <a v-for="[label,url] in links" :key="label" :href="url" target="_blank" rel="noopener noreferrer">
              <span>{{ label }}</span><span class="arrow arrow--ne" aria-hidden="true" />
            </a>
          </div>
          <p v-else>{{ locale === 'es' ? 'Añade tus canales para que promoters y público encuentren tu trabajo.' : 'Add your channels so promoters and listeners can find your work.' }}</p>
        </div>
        <button v-if="editable" type="button" class="artist-workspace-profile__section-edit" @click="emit('edit','links')" aria-label="Edit links" />
      </section>

      <section class="artist-workspace-profile__booking-band">
        <div>
          <span>BOOKING</span>
          <h2>{{ profile.acceptingRequests ? (locale === 'es' ? 'SOLICITUDES ABIERTAS.' : 'OPEN FOR BOOKINGS.') : (locale === 'es' ? 'BOOKING PAUSADO.' : 'BOOKING PAUSED.') }}</h2>
          <p>{{ locale === 'es' ? 'El formulario público alimenta el mismo Booking Core que gestionas en el workspace.' : 'The public form feeds the same Booking Core you manage in the workspace.' }}</p>
        </div>
        <div class="artist-workspace-profile__booking-actions">
          <button v-if="published" type="button" class="primary" @click="emit('toggleRequests', !profile.acceptingRequests)">
            {{ profile.acceptingRequests ? (locale === 'es' ? 'Cerrar solicitudes' : 'Close requests') : (locale === 'es' ? 'Abrir solicitudes' : 'Open requests') }}
          </button>
          <button v-if="editable" type="button" @click="emit('edit','booking')">{{ locale === 'es' ? 'Configurar booking' : 'Booking settings' }}</button>
          <button v-if="editable" type="button" @click="emit('edit','distribution')">{{ locale === 'es' ? 'Distribución' : 'Distribution' }}</button>
        </div>
      </section>
    </article>
  </section>
</template>

<style scoped>
.artist-workspace-profile{display:grid;gap:16px}.artist-workspace-profile__bar{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:12px 14px;border:1px solid var(--workspace-line,#292929);border-radius:10px;background:#0a0a0a}.artist-workspace-profile__bar>div:first-child{display:flex;align-items:center;gap:10px}.artist-workspace-profile__bar span{color:#666;font:800 8px/1 monospace;letter-spacing:.08em}.artist-workspace-profile__bar strong{padding:6px 8px;border:1px solid #343434;border-radius:6px;color:#777;font:800 7px/1 monospace}.artist-workspace-profile__bar strong.published{border-color:color-mix(in srgb,var(--cue-accent) 45%,#343434);color:var(--cue-accent)}.artist-workspace-profile__bar-actions,.artist-workspace-profile__hero-actions,.artist-workspace-profile__booking-actions{display:flex;gap:8px;flex-wrap:wrap}.artist-workspace-profile button{min-height:36px;padding:0 12px;border:1px solid #383838;border-radius:8px;background:#101010;color:#d3d3d3;cursor:pointer;font:800 9px/1 monospace}.artist-workspace-profile button:hover{border-color:var(--cue-accent);color:var(--cue-accent)}.artist-workspace-profile button.primary,.artist-workspace-profile__booking{border-color:var(--cue-accent);background:var(--cue-accent);color:#050505}.artist-workspace-profile__portfolio{overflow:hidden;border:1px solid var(--workspace-line,#292929);border-radius:12px;background:#090909}.artist-workspace-profile__hero{position:relative;min-height:480px;display:flex;align-items:flex-end;overflow:hidden}.artist-workspace-profile__cover{position:absolute;inset:0}.artist-workspace-profile__cover img{width:100%;height:100%;object-fit:cover;filter:saturate(.72) contrast(1.06)}.artist-workspace-profile__cover:after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,.18),rgba(0,0,0,.45) 48%,#090909 94%)}.artist-workspace-profile__cover-fallback{position:absolute;inset:0;background:radial-gradient(circle at 70% 25%,color-mix(in srgb,var(--cue-accent) 12%,transparent),transparent 28%),linear-gradient(130deg,#171717,#080808 68%)}.artist-workspace-profile__cover-grid{position:absolute;inset:0;background-image:linear-gradient(rgba(255,255,255,.035) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.035) 1px,transparent 1px);background-size:56px 56px;mask-image:linear-gradient(to bottom,#000,transparent 80%)}.artist-workspace-profile__brand{position:absolute;top:20px;left:20px;width:32px;height:32px}.artist-workspace-profile__edit{position:absolute;z-index:3;top:18px;right:18px}.artist-workspace-profile__hero-content{position:relative;z-index:2;display:grid;grid-template-columns:auto minmax(0,1fr) auto;align-items:end;gap:22px;width:100%;padding:32px}.artist-workspace-profile__portrait{position:relative;width:132px;height:162px;display:grid;place-items:center;overflow:hidden;border:1px solid #3a3a3a;border-radius:10px;background:#111;color:var(--cue-accent);font:900 28px/1 monospace}.artist-workspace-profile__portrait img{width:100%;height:100%;object-fit:cover}.artist-workspace-profile__portrait.editable{padding:0}.artist-workspace-profile__portrait i{position:absolute;right:8px;bottom:8px;width:26px;height:26px;border:1px solid #555;border-radius:50%;background:#090909}.artist-workspace-profile__portrait i:before,.artist-workspace-profile__portrait i:after{content:"";position:absolute;left:7px;top:12px;width:12px;height:2px;background:#ddd;transform:rotate(-45deg)}.artist-workspace-profile__identity{min-width:0}.artist-workspace-profile__meta{display:flex;gap:12px;margin-bottom:8px;color:#8a8a8a;font:800 8px/1 monospace}.artist-workspace-profile__identity h1{margin:0;font-size:clamp(46px,7vw,92px);line-height:.86;letter-spacing:-.055em}.artist-workspace-profile__genres{margin:12px 0 0;color:var(--cue-accent);font:800 11px/1.3 monospace;text-transform:uppercase}.artist-workspace-profile__bio{max-width:640px;margin:12px 0 0;color:#aaa;font-size:13px;line-height:1.55}.artist-workspace-profile__section{position:relative;display:grid;grid-template-columns:120px minmax(0,1fr);gap:24px;padding:28px 32px;border-top:1px solid #252525}.artist-workspace-profile__section-label{display:grid;align-content:start;gap:7px;color:#777;font:800 8px/1 monospace}.artist-workspace-profile__section-label span{color:var(--cue-accent)}.artist-workspace-profile__section-content{min-width:0}.artist-workspace-profile__section-content .lead{max-width:760px;margin:0;color:#d4d4d4;font-size:22px;line-height:1.4}.artist-workspace-profile__facts{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:1px;margin-top:24px;background:#282828;border:1px solid #282828}.artist-workspace-profile__facts div{display:grid;gap:5px;padding:13px;background:#0d0d0d}.artist-workspace-profile__facts span{color:#666;font:700 7px/1 monospace}.artist-workspace-profile__facts strong{font-size:11px;text-transform:uppercase}.artist-workspace-profile__section-edit{position:absolute;top:20px;right:20px;width:34px;min-height:34px;padding:0;border-radius:50%!important}.artist-workspace-profile__section-edit:after{content:"";display:block;width:11px;height:2px;margin:auto;background:currentColor;transform:rotate(-45deg)}.artist-workspace-profile__sound{display:flex;flex-wrap:wrap;gap:8px}.artist-workspace-profile__sound strong{padding:9px 11px;border:1px solid #343434;border-radius:7px;font:900 13px/1 monospace}.artist-workspace-profile__section-content>p:not(.lead){color:#777;font:800 8px/1.4 monospace}.artist-workspace-profile__cue{display:grid;grid-template-columns:minmax(220px,.65fr) 1fr;min-height:280px;border-top:1px solid #252525;background:#0c0c0c}.artist-workspace-profile__cue-visual{position:relative;display:grid;place-content:center;overflow:hidden;background:radial-gradient(circle,color-mix(in srgb,var(--cue-accent) 14%,transparent),transparent 45%),#070707}.artist-workspace-profile__cue-visual span,.artist-workspace-profile__cue-visual strong{font:900 52px/.8 monospace;letter-spacing:-.08em}.artist-workspace-profile__cue-visual strong{color:var(--cue-accent)}.artist-workspace-profile__cue-visual i{position:absolute;inset:18%;border:1px solid color-mix(in srgb,var(--cue-accent) 25%,transparent);transform:rotate(10deg)}.artist-workspace-profile__cue>div:last-child{display:grid;align-content:center;gap:10px;padding:32px}.artist-workspace-profile__cue>div:last-child>span{color:var(--cue-accent);font:800 8px/1 monospace}.artist-workspace-profile__cue h2{max-width:520px;margin:0;font-size:30px;line-height:.95}.artist-workspace-profile__cue p{max-width:600px;margin:0;color:#888;font-size:12px;line-height:1.5}.artist-workspace-profile__cue button{justify-self:start}.artist-workspace-profile__links{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.artist-workspace-profile__links a{display:flex;align-items:center;justify-content:space-between;min-height:48px;padding:0 13px;border:1px solid #303030;border-radius:8px;color:#cfcfcf;text-decoration:none;font:800 9px/1 monospace}.artist-workspace-profile__links a:hover{border-color:var(--cue-accent);color:var(--cue-accent)}.artist-workspace-profile__booking-band{display:flex;align-items:end;justify-content:space-between;gap:24px;padding:32px;border-top:1px solid #252525;background:linear-gradient(110deg,color-mix(in srgb,var(--cue-accent) 7%,#090909),#090909 55%)}.artist-workspace-profile__booking-band>div:first-child>span{color:var(--cue-accent);font:800 8px/1 monospace}.artist-workspace-profile__booking-band h2{margin:8px 0 5px;font-size:30px}.artist-workspace-profile__booking-band p{max-width:620px;margin:0;color:#888;font-size:12px;line-height:1.5}
@media(max-width:760px){.artist-workspace-profile__bar{align-items:flex-start;flex-direction:column}.artist-workspace-profile__bar-actions{width:100%}.artist-workspace-profile__bar-actions button{flex:1}.artist-workspace-profile__hero{min-height:560px}.artist-workspace-profile__hero-content{grid-template-columns:1fr;padding:22px 18px;gap:14px}.artist-workspace-profile__portrait{width:112px;height:136px}.artist-workspace-profile__identity h1{font-size:52px}.artist-workspace-profile__hero-actions{width:100%}.artist-workspace-profile__hero-actions button{flex:1}.artist-workspace-profile__section{grid-template-columns:1fr;gap:14px;padding:22px 18px}.artist-workspace-profile__section-content .lead{font-size:18px}.artist-workspace-profile__facts{grid-template-columns:repeat(2,minmax(0,1fr))}.artist-workspace-profile__cue{grid-template-columns:1fr}.artist-workspace-profile__cue-visual{min-height:200px}.artist-workspace-profile__cue>div:last-child{padding:24px 18px}.artist-workspace-profile__links{grid-template-columns:1fr}.artist-workspace-profile__booking-band{align-items:stretch;flex-direction:column;padding:24px 18px}.artist-workspace-profile__booking-actions button{flex:1}.artist-workspace-profile__edit--cover{top:12px;right:12px}}
</style>
