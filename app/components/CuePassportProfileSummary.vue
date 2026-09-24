<script setup lang="ts">
type PassportMilestone = {
  id: string
  title: string
  subtitle: string
}

type PassportMedia = {
  id: string
  mediaType: 'image' | 'video' | 'reel'
  permalink: string | null
  mediaUrl: string | null
  thumbnailUrl: string | null
  caption: string | null
  capturedAt: string | null
}

const props = withDefaults(defineProps<{
  bookings?: number
  cities?: string[]
  venues?: string[]
  milestones?: PassportMilestone[]
  media?: PassportMedia[]
  locale?: 'es' | 'en'
  editable?: boolean
  publicEnabled?: boolean
}>(), {
  bookings: 0,
  cities: () => [],
  venues: () => [],
  milestones: () => [],
  media: () => [],
  locale: 'es',
  editable: false,
  publicEnabled: true
})

const emit = defineEmits<{
  manage: []
}>()

const visibleCities = computed(() => props.cities.slice(0, 5))
const visibleMilestones = computed(() => props.milestones.slice(0, 3))
const visibleMedia = computed(() => props.media.slice(0, 6))
function safeMediaUrl(value: string | null) {
  if (!value) return null
  return /^https?:\/\//i.test(value) ? value : null
}

function mediaPreview(item: PassportMedia) {
  if (safeMediaUrl(item.thumbnailUrl)) return item.thumbnailUrl
  return item.mediaType === 'image' ? safeMediaUrl(item.mediaUrl) : null
}

function mediaLink(item: PassportMedia) {
  return safeMediaUrl(item.permalink) || safeMediaUrl(item.mediaUrl)
}
</script>

<template>
  <section class="profile-passport">
    <div class="profile-passport__copy">
      <div class="profile-passport__eyebrow">
        <span>CUE PASSPORT</span>
        <small v-if="editable" :class="{ hidden: !publicEnabled }">
          {{ publicEnabled ? (locale === 'es' ? 'PÚBLICO' : 'PUBLIC') : (locale === 'es' ? 'OCULTO' : 'HIDDEN') }}
        </small>
      </div>
      <h2>{{ locale === 'es' ? 'TRAYECTORIA, CONSTRUIDA CON FECHAS REALES.' : 'TRAJECTORY, BUILT FROM REAL DATES.' }}</h2>
      <p>{{ locale === 'es'
        ? 'Ciudades, venues e hitos aparecen a medida que tu actividad confirmada crece dentro de Cuebooker.'
        : 'Cities, venues and milestones appear as your confirmed activity grows inside Cuebooker.' }}</p>

      <div class="profile-passport__stats">
        <div><strong>{{ bookings }}</strong><span>BOOKINGS</span></div>
        <div><strong>{{ venues.length }}</strong><span>VENUES</span></div>
        <div><strong>{{ cities.length }}</strong><span>CITIES</span></div>
      </div>

      <button v-if="editable" type="button" @click="emit('manage')">
        {{ locale === 'es' ? 'Gestionar Passport' : 'Manage Passport' }}
        <span class="arrow arrow--ne" aria-hidden="true" />
      </button>
    </div>

    <div class="profile-passport__visual" aria-label="CUE Passport summary">
      <div v-if="visibleCities.length" class="profile-passport__route" aria-hidden="true">
        <i
          v-for="(city, index) in visibleCities"
          :key="city"
          :class="`profile-passport__node profile-passport__node--${index + 1}`"
        />
      </div>

      <div v-if="visibleCities.length" class="profile-passport__cities">
        <span v-for="city in visibleCities" :key="city">{{ city }}</span>
      </div>

      <div v-if="visibleMilestones.length" class="profile-passport__milestones">
        <article v-for="milestone in visibleMilestones" :key="milestone.id">
          <span>STAMP</span>
          <strong>{{ milestone.title }}</strong>
          <small>{{ milestone.subtitle }}</small>
        </article>
      </div>

      <div v-if="visibleMedia.length" class="profile-passport__media">
        <a
          v-for="item in visibleMedia"
          :key="item.id"
          :href="mediaLink(item) || undefined"
          target="_blank"
          rel="noopener noreferrer"
          :aria-label="item.caption || item.mediaType"
        >
          <img v-if="mediaPreview(item)" :src="mediaPreview(item) || ''" alt="">
          <span>{{ item.mediaType.toUpperCase() }}</span>
        </a>
      </div>

      <p v-if="!visibleCities.length" class="profile-passport__empty">
        {{ locale === 'es'
          ? 'Tu Passport empezará a dibujarse con tus primeras fechas confirmadas.'
          : 'Your Passport will start taking shape with your first confirmed dates.' }}
      </p>
    </div>
  </section>
</template>

<style scoped>
.profile-passport{
  display:grid;
  grid-template-columns:minmax(0,.9fr) minmax(0,1.1fr);
  min-height:330px;
  border-top:1px solid #252525;
  background:#090909;
}
.profile-passport__copy{
  display:flex;
  flex-direction:column;
  justify-content:center;
  padding:32px;
  border-right:1px solid #252525;
}
.profile-passport__eyebrow{display:flex;align-items:center;gap:9px}
.profile-passport__eyebrow>span{
  color:var(--cue-accent);
  font:800 8px/1 monospace;
  letter-spacing:.1em;
}
.profile-passport__eyebrow small{
  padding:4px 6px;
  border:1px solid color-mix(in srgb,var(--cue-accent) 38%,#303030);
  border-radius:6px;
  color:var(--cue-accent);
  font:800 6px/1 monospace;
  letter-spacing:.08em;
}
.profile-passport__eyebrow small.hidden{border-color:#373737;color:#777}
.profile-passport__copy h2{
  max-width:580px;
  margin:12px 0;
  font-size:clamp(28px,3.4vw,48px);
  line-height:.92;
  letter-spacing:-.045em;
}
.profile-passport__copy p{
  max-width:560px;
  margin:0;
  color:#888;
  font-size:12px;
  line-height:1.55;
}
.profile-passport__copy button{
  align-self:flex-start;
  display:inline-flex;
  align-items:center;
  gap:8px;
  min-height:36px;
  margin-top:18px;
  padding:0 11px;
  border:1px solid #383838;
  border-radius:8px;
  background:#0f0f0f;
  color:#d2d2d2;
  cursor:pointer;
  font:800 9px/1 monospace;
}
.profile-passport__copy button:hover{
  border-color:var(--cue-accent);
  color:var(--cue-accent);
}
.profile-passport__stats{
  display:grid;
  grid-template-columns:repeat(3,minmax(0,1fr));
  gap:1px;
  margin-top:20px;
  border:1px solid #292929;
  background:#292929;
}
.profile-passport__stats>div{
  display:grid;
  gap:3px;
  padding:11px;
  background:#0c0c0c;
}
.profile-passport__stats strong{
  color:var(--cue-accent);
  font:900 20px/1 monospace;
}
.profile-passport__stats span{
  color:#666;
  font:700 7px/1 monospace;
}
.profile-passport__visual{
  position:relative;
  display:flex;
  flex-direction:column;
  justify-content:flex-end;
  gap:12px;
  min-height:330px;
  overflow:hidden;
  padding:24px;
  background:
    radial-gradient(circle at 56% 40%,color-mix(in srgb,var(--cue-accent) 9%,transparent),transparent 32%),
    linear-gradient(140deg,#0d0d0d,#070707);
}
.profile-passport__visual:before{
  content:"";
  position:absolute;
  inset:0;
  opacity:.12;
  background-image:
    linear-gradient(rgba(255,255,255,.05) 1px,transparent 1px),
    linear-gradient(90deg,rgba(255,255,255,.05) 1px,transparent 1px);
  background-size:38px 38px;
}
.profile-passport__route{
  position:absolute;
  z-index:1;
  inset:22% 8% 31%;
}
.profile-passport__route:before,
.profile-passport__route:after{
  content:"";
  position:absolute;
  height:1px;
  background:linear-gradient(90deg,transparent,var(--cue-accent),rgba(255,255,255,.18));
}
.profile-passport__route:before{
  left:8%;
  top:52%;
  width:78%;
  transform:rotate(-8deg);
}
.profile-passport__route:after{
  left:24%;
  top:58%;
  width:58%;
  transform:rotate(17deg);
  opacity:.45;
}
.profile-passport__node{
  position:absolute;
  width:10px;
  height:10px;
  border:2px solid var(--cue-accent);
  border-radius:50%;
  background:#080808;
  box-shadow:0 0 0 6px color-mix(in srgb,var(--cue-accent) 8%,transparent);
}
.profile-passport__node--1{left:8%;top:58%}
.profile-passport__node--2{left:31%;top:29%}
.profile-passport__node--3{left:53%;top:54%}
.profile-passport__node--4{left:72%;top:25%}
.profile-passport__node--5{left:90%;top:47%}
.profile-passport__cities{
  position:relative;
  z-index:2;
  display:flex;
  flex-wrap:wrap;
  gap:6px;
}
.profile-passport__cities span{
  padding:6px 8px;
  border:1px solid #303030;
  border-radius:7px;
  background:#0a0a0a;
  color:#c5c5c5;
  font:800 8px/1 monospace;
  text-transform:uppercase;
}
.profile-passport__milestones{
  position:relative;
  z-index:2;
  display:grid;
  grid-template-columns:repeat(3,minmax(0,1fr));
  gap:7px;
}
.profile-passport__milestones article{
  display:grid;
  gap:4px;
  min-width:0;
  padding:9px;
  border:1px solid #313131;
  border-radius:7px;
  background:rgba(8,8,8,.92);
}
.profile-passport__milestones span{
  color:var(--cue-accent);
  font:800 6px/1 monospace;
  letter-spacing:.08em;
}
.profile-passport__milestones strong{
  overflow:hidden;
  color:#d7d7d7;
  font-size:9px;
  text-overflow:ellipsis;
  white-space:nowrap;
}
.profile-passport__milestones small{
  color:#676767;
  font-size:7px;
  line-height:1.3;
}
.profile-passport__media{
  position:relative;
  z-index:2;
  display:grid;
  grid-template-columns:repeat(3,minmax(0,1fr));
  gap:7px;
}
.profile-passport__media a{
  position:relative;
  min-height:84px;
  overflow:hidden;
  border:1px solid #303030;
  border-radius:7px;
  background:#0a0a0a;
  color:#d7d7d7;
  text-decoration:none;
}
.profile-passport__media img{
  width:100%;
  height:100%;
  min-height:84px;
  object-fit:cover;
  opacity:.8;
}
.profile-passport__media span{
  position:absolute;
  right:6px;
  bottom:6px;
  padding:4px 5px;
  border:1px solid #3a3a3a;
  border-radius:5px;
  background:rgba(8,8,8,.84);
  font:800 6px/1 monospace;
}
.profile-passport__empty{
  position:relative;
  z-index:2;
  max-width:360px;
  margin:auto;
  color:#777;
  font-size:11px;
  line-height:1.5;
  text-align:center;
}
@media(max-width:760px){
  .profile-passport{grid-template-columns:1fr}
  .profile-passport__copy{padding:24px 18px;border-right:0;border-bottom:1px solid #252525}
  .profile-passport__visual{min-height:280px;padding:18px}
  .profile-passport__milestones{grid-template-columns:1fr}
  .profile-passport__media{grid-template-columns:repeat(2,minmax(0,1fr))}
}
</style>
