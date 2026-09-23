<script setup lang="ts">
type EditSection = 'identity' | 'about' | 'sound' | 'booking' | 'links' | 'visual' | null

const editSection = ref<EditSection>(null)
const publicMode = ref(false)
const published = ref(false)

const profile = reactive({
  stageName: 'LITS',
  city: 'Barcelona',
  country: 'ES',
  genres: 'Techno · Hardgroove · Acid',
  formats: 'DJ SET · CLUB · FESTIVAL',
  tagline: 'Club-driven sets with industrial energy and late-night tension.',
  bio: 'Barcelona-based DJ focused on fast, physical club music. A sound built around pressure, groove and long-form dancefloor progression.',
  avatar: true,
  acceptingBookings: true,
  instagram: '@lits',
  soundcloud: 'soundcloud.com/lits',
  spotify: 'Spotify',
  cueId: true
})

useHead({
  title: 'Profile Lab · Cuebooker',
  meta: [{ name: 'robots', content: 'noindex,nofollow' }]
})

function openEditor(section: Exclude<EditSection, null>) {
  if (publicMode.value) return
  editSection.value = section
}

function closeEditor() {
  editSection.value = null
}

function saveEditor() {
  editSection.value = null
}
</script>

<template>
  <main class="profile-lab" :class="{ 'profile-lab--public': publicMode }">
    <header class="profile-lab__topbar">
      <NuxtLink to="/workspace?view=profile" class="profile-lab__back">← Volver a Mi perfil</NuxtLink>
      <div class="profile-lab__topbar-center">
        <span class="profile-lab__mode">{{ publicMode ? 'VISTA PÚBLICA' : 'PROFILE LAB' }}</span>
        <span :class="['profile-lab__status', { 'profile-lab__status--published': published }]">
          {{ published ? 'PUBLICADO' : 'BORRADOR' }}
        </span>
      </div>
      <div class="profile-lab__topbar-actions">
        <button type="button" class="profile-lab__secondary" @click="publicMode = !publicMode">
          {{ publicMode ? 'Volver a editar' : 'Ver como público' }}
        </button>
        <button v-if="!publicMode" type="button" class="profile-lab__primary" @click="published = !published">
          {{ published ? 'Despublicar' : 'Publicar perfil' }}
        </button>
      </div>
    </header>

    <article class="artist-portfolio">
      <section class="artist-hero">
        <div class="artist-hero__media" aria-hidden="true">
          <img src="/images/profile/cuebooker-default-cover.webp" alt="">
          <div class="artist-hero__wash" />
          <div class="artist-hero__brand-mark">
            <img src="/logo-full-dark.png" alt="">
          </div>
          <div class="artist-hero__industrial-grid" />
        </div>

        <button v-if="!publicMode" type="button" class="edit-button edit-button--hero" @click="openEditor('visual')">
          <span>Editar visual</span>
          <b>✎</b>
        </button>

        <div class="artist-hero__content">
          <div class="artist-hero__identity">
            <div v-if="profile.avatar" class="artist-avatar">
              <div class="artist-avatar__placeholder">LI</div>
            </div>

            <div class="artist-hero__copy">
              <div class="artist-hero__meta">
                <span>{{ profile.city }} · {{ profile.country }}</span>
                <span>ARTIST PROFILE</span>
              </div>
              <h1>{{ profile.stageName }}</h1>
              <p class="artist-hero__genres">{{ profile.genres }}</p>
              <p class="artist-hero__tagline">{{ profile.tagline }}</p>
            </div>
          </div>

          <div class="artist-hero__actions">
            <button v-if="profile.acceptingBookings" type="button" class="artist-cta">REQUEST BOOKING</button>
            <a href="#sound">LISTEN</a>
            <a href="#links">LINKS</a>
          </div>
        </div>

        <button v-if="!publicMode" type="button" class="edit-button edit-button--identity" @click="openEditor('identity')">
          <span>Editar identidad</span>
          <b>✎</b>
        </button>
      </section>

      <section class="artist-section artist-section--about">
        <div class="artist-section__label">
          <span>01</span>
          <strong>ABOUT</strong>
        </div>
        <div class="artist-section__content">
          <p class="artist-section__lead">{{ profile.bio }}</p>
          <div class="artist-facts">
            <div><span>BASE</span><strong>{{ profile.city }}</strong></div>
            <div><span>FORMAT</span><strong>DJ SET</strong></div>
            <div><span>LANGUAGES</span><strong>ES · EN</strong></div>
            <div><span>ACTIVE</span><strong>10+ YEARS</strong></div>
          </div>
        </div>
        <button v-if="!publicMode" type="button" class="edit-button" @click="openEditor('about')"><b>✎</b></button>
      </section>

      <section id="sound" class="artist-section artist-section--sound">
        <div class="artist-section__label">
          <span>02</span>
          <strong>SOUND</strong>
        </div>
        <div class="artist-section__content">
          <div class="sound-display">
            <strong>TECHNO</strong>
            <strong>HARDGROOVE</strong>
            <strong>ACID</strong>
          </div>
          <p class="sound-format">{{ profile.formats }}</p>
          <div class="sound-links">
            <a href="#">SOUNDCLOUD ↗</a>
            <a href="#">SPOTIFY ↗</a>
            <a href="#">MIXCLOUD ↗</a>
          </div>
        </div>
        <button v-if="!publicMode" type="button" class="edit-button" @click="openEditor('sound')"><b>✎</b></button>
      </section>

      <section v-if="profile.cueId" class="cue-id-band">
        <div class="cue-id-band__visual">
          <div class="cue-id-band__figure" />
          <div class="cue-id-band__scanline" />
        </div>
        <div class="cue-id-band__copy">
          <span>CUE ID / BETA</span>
          <h2>YOUR DIGITAL<br>ARTIST IDENTITY.</h2>
          <p>Una identidad visual que conecta tu perfil, tu presencia pública y el universo Cuebooker.</p>
          <NuxtLink to="/cue-id?from=workspace&section=identity">Editar CUE ID ↗</NuxtLink>
        </div>
      </section>

      <section class="artist-section artist-section--booking">
        <div class="artist-section__label">
          <span>03</span>
          <strong>BOOKING</strong>
        </div>
        <div class="artist-section__content booking-callout">
          <div>
            <span>AVAILABLE FOR BOOKINGS</span>
            <h2>LET'S PUT<br>LITS ON STAGE.</h2>
          </div>
          <div class="booking-callout__meta">
            <p>Barcelona / Europe</p>
            <p>Typical set · 90 min</p>
            <p>Travel · Available</p>
          </div>
          <button type="button" class="artist-cta">REQUEST BOOKING</button>
        </div>
        <button v-if="!publicMode" type="button" class="edit-button" @click="openEditor('booking')"><b>✎</b></button>
      </section>

      <section id="links" class="artist-section artist-section--links">
        <div class="artist-section__label">
          <span>04</span>
          <strong>LINKS / PRESS</strong>
        </div>
        <div class="artist-section__content link-grid">
          <a href="#"><span>INSTAGRAM</span><strong>{{ profile.instagram }}</strong><b>↗</b></a>
          <a href="#"><span>SOUNDCLOUD</span><strong>{{ profile.soundcloud }}</strong><b>↗</b></a>
          <a href="#"><span>SPOTIFY</span><strong>{{ profile.spotify }}</strong><b>↗</b></a>
          <a href="#"><span>TECH RIDER</span><strong>PDF</strong><b>↗</b></a>
        </div>
        <button v-if="!publicMode" type="button" class="edit-button" @click="openEditor('links')"><b>✎</b></button>
      </section>

      <footer class="artist-footer">
        <img src="/logo-full-dark.png" alt="Cuebooker">
        <span>ARTIST PRESENCE / 2026</span>
      </footer>
    </article>

    <div v-if="editSection" class="editor-backdrop" @click.self="closeEditor">
      <section class="inline-editor" role="dialog" aria-modal="true">
        <header>
          <div>
            <span>EDIT PROFILE</span>
            <h2>
              {{ editSection === 'visual' ? 'Imagen y portada'
                : editSection === 'identity' ? 'Identidad'
                  : editSection === 'about' ? 'Sobre el artista'
                    : editSection === 'sound' ? 'Sonido'
                      : editSection === 'booking' ? 'Booking'
                        : 'Links' }}
            </h2>
          </div>
          <button type="button" @click="closeEditor">×</button>
        </header>

        <div class="inline-editor__body">
          <template v-if="editSection === 'identity'">
            <label><span>Nombre artístico</span><input v-model="profile.stageName"></label>
            <label><span>Ciudad</span><input v-model="profile.city"></label>
            <label class="wide"><span>Géneros</span><input v-model="profile.genres"></label>
            <label class="wide"><span>Claim</span><textarea v-model="profile.tagline" rows="3" /></label>
          </template>

          <template v-else-if="editSection === 'about'">
            <label class="wide"><span>Bio</span><textarea v-model="profile.bio" rows="7" /></label>
          </template>

          <template v-else-if="editSection === 'sound'">
            <label class="wide"><span>Géneros</span><input v-model="profile.genres"></label>
            <label class="wide"><span>Formatos</span><input v-model="profile.formats"></label>
          </template>

          <template v-else-if="editSection === 'booking'">
            <label class="toggle-row wide"><input v-model="profile.acceptingBookings" type="checkbox"><span>Aceptar solicitudes públicas</span></label>
            <label><span>Base</span><input v-model="profile.city"></label>
            <label><span>Duración habitual</span><input value="90 min"></label>
          </template>

          <template v-else-if="editSection === 'links'">
            <label><span>Instagram</span><input v-model="profile.instagram"></label>
            <label><span>SoundCloud</span><input v-model="profile.soundcloud"></label>
            <label><span>Spotify</span><input v-model="profile.spotify"></label>
          </template>

          <template v-else>
            <div class="visual-choice wide">
              <strong>PORTADA CUEBOOKER</strong>
              <p>La portada por defecto forma parte del lenguaje visual del producto. Después podrá sustituirse por una portada propia.</p>
            </div>
            <label class="toggle-row wide"><input v-model="profile.avatar" type="checkbox"><span>Mostrar foto de perfil</span></label>
            <label class="toggle-row wide"><input v-model="profile.cueId" type="checkbox"><span>Mostrar CUE ID en el portfolio</span></label>
          </template>
        </div>

        <footer>
          <button type="button" class="profile-lab__secondary" @click="closeEditor">Cancelar</button>
          <button type="button" class="profile-lab__primary" @click="saveEditor">Guardar cambios</button>
        </footer>
      </section>
    </div>
  </main>
</template>

<style scoped>
:global(body) { background:#070707; }
.profile-lab { --lime:#dfff35; --line:#2a2a2a; --muted:#989898; min-height:100vh; background:#070707; color:#f5f5f2; font-family:Inter,Arial,sans-serif; }
.profile-lab * { box-sizing:border-box; }
.profile-lab__topbar { position:sticky; top:0; z-index:30; display:grid; grid-template-columns:1fr auto 1fr; align-items:center; min-height:62px; padding:0 28px; border-bottom:1px solid var(--line); background:rgba(7,7,7,.94); backdrop-filter:blur(14px); }
.profile-lab__back { color:#aaa; font-size:12px; text-decoration:none; }
.profile-lab__topbar-center { display:flex; align-items:center; gap:10px; }
.profile-lab__mode,.profile-lab__status { font:800 9px/1 monospace; letter-spacing:.1em; }
.profile-lab__status { padding:6px 8px; border:1px solid #454545; border-radius:6px; color:#aaa; }
.profile-lab__status--published { border-color:var(--lime); color:var(--lime); }
.profile-lab__topbar-actions { display:flex; justify-content:flex-end; gap:8px; }
.profile-lab button { font:800 10px/1 monospace; letter-spacing:.04em; }
.profile-lab__secondary,.profile-lab__primary { min-height:38px; padding:0 13px; border-radius:8px; cursor:pointer; }
.profile-lab__secondary { border:1px solid #393939; background:#111; color:#ddd; }
.profile-lab__primary { border:1px solid var(--lime); background:var(--lime); color:#080808; }

.artist-portfolio { width:min(1480px,100%); margin:0 auto; border-inline:1px solid #171717; background:#090909; }
.artist-hero { position:relative; min-height:700px; overflow:hidden; border-bottom:1px solid var(--line); }
.artist-hero__media { position:absolute; inset:0; }
.artist-hero__media>img { width:100%; height:100%; object-fit:cover; filter:grayscale(1) contrast(1.08) brightness(.46); }
.artist-hero__wash { position:absolute; inset:0; background:linear-gradient(90deg,rgba(5,5,5,.98) 0%,rgba(5,5,5,.68) 42%,rgba(5,5,5,.24) 75%,rgba(5,5,5,.6) 100%),linear-gradient(0deg,#090909 0%,transparent 45%); }
.artist-hero__industrial-grid { position:absolute; inset:0; opacity:.12; background-image:linear-gradient(rgba(255,255,255,.13) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.13) 1px,transparent 1px); background-size:110px 110px; }
.artist-hero__brand-mark { position:absolute; top:42px; right:48px; width:210px; opacity:.72; }
.artist-hero__brand-mark img { width:100%; filter:grayscale(1) brightness(2); }
.artist-hero__content { position:relative; z-index:2; display:flex; min-height:700px; flex-direction:column; justify-content:flex-end; padding:60px; }
.artist-hero__identity { display:flex; align-items:flex-end; gap:24px; }
.artist-avatar { flex:none; width:108px; height:108px; padding:5px; border:1px solid #585858; background:#111; }
.artist-avatar__placeholder { display:grid; width:100%; height:100%; place-items:center; background:linear-gradient(145deg,#252525,#0e0e0e); color:var(--lime); font:900 24px monospace; }
.artist-hero__copy { max-width:850px; }
.artist-hero__meta { display:flex; gap:18px; margin-bottom:10px; color:#bbb; font:800 9px/1 monospace; letter-spacing:.12em; }
.artist-hero h1 { margin:0; font-size:clamp(5rem,11vw,10.5rem); line-height:.72; letter-spacing:-.075em; text-transform:uppercase; }
.artist-hero__genres { margin:22px 0 0; color:var(--lime); font:800 11px monospace; letter-spacing:.08em; text-transform:uppercase; }
.artist-hero__tagline { max-width:660px; margin:15px 0 0; color:#bbb; font-size:16px; line-height:1.55; }
.artist-hero__actions { display:flex; align-items:center; gap:22px; margin-top:34px; }
.artist-hero__actions a { color:#d5d5d5; font:800 10px monospace; text-decoration:none; }
.artist-cta { min-height:46px; padding:0 18px; border:1px solid var(--lime); border-radius:8px; background:var(--lime); color:#080808; cursor:pointer; }
.edit-button { position:absolute; z-index:5; top:18px; right:18px; display:flex; align-items:center; gap:8px; min-height:34px; padding:0 10px; border:1px solid #414141; border-radius:8px; background:rgba(9,9,9,.88); color:#ddd; cursor:pointer; }
.edit-button span { font-size:9px; }
.edit-button b { color:var(--lime); }
.edit-button--hero { top:26px; right:280px; }
.edit-button--identity { top:auto; right:38px; bottom:38px; }

.artist-section { position:relative; display:grid; grid-template-columns:180px minmax(0,1fr); gap:40px; padding:58px 60px; border-bottom:1px solid var(--line); }
.artist-section__label { display:grid; align-content:start; gap:8px; color:#777; font:800 9px monospace; letter-spacing:.1em; }
.artist-section__label strong { color:#d7d7d7; }
.artist-section__content { min-width:0; }
.artist-section__lead { max-width:900px; margin:0; font-size:clamp(1.6rem,2.7vw,2.6rem); line-height:1.18; letter-spacing:-.025em; }
.artist-facts { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:1px; margin-top:44px; background:var(--line); border:1px solid var(--line); }
.artist-facts>div { padding:17px; background:#0b0b0b; }
.artist-facts span,.booking-callout span { display:block; margin-bottom:8px; color:#777; font:800 8px monospace; letter-spacing:.08em; }
.artist-facts strong { font-size:13px; }
.sound-display { display:flex; flex-wrap:wrap; gap:10px; }
.sound-display strong { padding:12px 15px; border:1px solid #353535; font-size:clamp(1.3rem,2vw,2rem); }
.sound-display strong:first-child { border-color:var(--lime); color:var(--lime); }
.sound-format { margin:25px 0; color:#888; font:800 10px monospace; letter-spacing:.1em; }
.sound-links { display:flex; gap:24px; }
.sound-links a { color:#ddd; font:800 10px monospace; text-decoration:none; }

.cue-id-band { display:grid; grid-template-columns:minmax(0,1.15fr) minmax(340px,.85fr); min-height:440px; border-bottom:1px solid var(--line); background:#0b0b0b; }
.cue-id-band__visual { position:relative; overflow:hidden; background:radial-gradient(circle at 50% 80%,rgba(223,255,53,.22),transparent 27%),linear-gradient(135deg,#141414,#080808); }
.cue-id-band__figure { position:absolute; left:50%; bottom:-12%; width:230px; height:410px; transform:translateX(-50%); border-radius:48% 48% 16% 16%; background:linear-gradient(90deg,#141414,#3a3a3a 50%,#111); box-shadow:0 0 0 1px #343434; }
.cue-id-band__figure::before { content:""; position:absolute; left:50%; top:-72px; width:118px; height:132px; transform:translateX(-50%); border-radius:46%; background:linear-gradient(90deg,#151515,#464646,#121212); }
.cue-id-band__scanline { position:absolute; inset:0; opacity:.15; background:repeating-linear-gradient(0deg,transparent 0 5px,#fff 6px); }
.cue-id-band__copy { display:flex; flex-direction:column; justify-content:center; padding:48px; border-left:1px solid var(--line); }
.cue-id-band__copy>span { color:var(--lime); font:800 9px monospace; }
.cue-id-band__copy h2,.booking-callout h2 { margin:14px 0; font-size:clamp(2.4rem,4.8vw,4.8rem); line-height:.86; letter-spacing:-.055em; }
.cue-id-band__copy p { max-width:450px; color:#999; line-height:1.55; }
.cue-id-band__copy a { margin-top:20px; color:#eee; font:800 10px monospace; text-decoration:none; }

.booking-callout { display:grid; grid-template-columns:minmax(0,1fr) auto; align-items:end; gap:36px; }
.booking-callout>div:first-child { grid-column:1; }
.booking-callout__meta { grid-column:2; grid-row:1; }
.booking-callout__meta p { margin:7px 0; color:#aaa; font:700 10px monospace; }
.booking-callout>.artist-cta { grid-column:1 / -1; justify-self:start; }

.link-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:1px; background:var(--line); border:1px solid var(--line); }
.link-grid a { display:grid; grid-template-columns:1fr auto; gap:8px; padding:20px; background:#0b0b0b; color:#eee; text-decoration:none; }
.link-grid a span { grid-column:1 / -1; color:#727272; font:800 8px monospace; }
.link-grid a strong { font-size:14px; }
.link-grid a b { color:var(--lime); }

.artist-footer { display:flex; align-items:center; justify-content:space-between; min-height:92px; padding:0 60px; }
.artist-footer img { width:145px; filter:grayscale(1) brightness(2); }
.artist-footer span { color:#666; font:800 8px monospace; }

.editor-backdrop { position:fixed; z-index:60; inset:0; display:grid; place-items:center; padding:24px; background:rgba(0,0,0,.72); backdrop-filter:blur(5px); }
.inline-editor { width:min(680px,100%); max-height:calc(100vh - 48px); overflow:auto; border:1px solid #353535; border-radius:12px; background:#0c0c0c; box-shadow:0 28px 80px rgba(0,0,0,.55); }
.inline-editor>header,.inline-editor>footer { display:flex; align-items:center; justify-content:space-between; gap:16px; padding:18px 20px; border-bottom:1px solid var(--line); }
.inline-editor>footer { border-top:1px solid var(--line); border-bottom:0; justify-content:flex-end; }
.inline-editor>header span { color:var(--lime); font:800 8px monospace; }
.inline-editor>header h2 { margin:5px 0 0; font-size:22px; }
.inline-editor>header>button { width:34px; height:34px; border:1px solid #333; border-radius:8px; background:#111; color:#aaa; cursor:pointer; }
.inline-editor__body { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:16px; padding:20px; }
.inline-editor label { display:grid; gap:7px; }
.inline-editor label.wide,.visual-choice.wide { grid-column:1/-1; }
.inline-editor label>span { color:#858585; font:800 9px monospace; text-transform:uppercase; }
.inline-editor input,.inline-editor textarea { width:100%; min-height:44px; padding:11px 12px; border:1px solid #353535; border-radius:8px; outline:none; background:#111; color:#eee; font:inherit; }
.inline-editor textarea { resize:vertical; }
.inline-editor input:focus,.inline-editor textarea:focus { border-color:var(--lime); }
.toggle-row { display:flex!important; grid-column:1/-1; grid-template-columns:auto 1fr; align-items:center; padding:14px; border:1px solid #333; border-radius:8px; }
.toggle-row input { width:18px; min-height:18px; }
.visual-choice { padding:18px; border:1px solid #333; border-radius:8px; background:#111; }
.visual-choice strong { color:var(--lime); font:800 10px monospace; }
.visual-choice p { margin:8px 0 0; color:#999; font-size:12px; line-height:1.5; }

.profile-lab--public .artist-portfolio { max-width:1320px; }

@media (max-width:900px) {
  .profile-lab__topbar { grid-template-columns:1fr auto; gap:12px; padding:10px 16px; }
  .profile-lab__topbar-center { display:none; }
  .profile-lab__topbar-actions { gap:6px; }
  .artist-hero { min-height:620px; }
  .artist-hero__content { min-height:620px; padding:32px 22px; }
  .artist-hero__brand-mark { top:28px; right:22px; width:150px; }
  .edit-button--hero { top:78px; right:22px; }
  .artist-hero__identity { align-items:flex-start; flex-direction:column; }
  .artist-avatar { width:88px; height:88px; }
  .artist-hero h1 { font-size:clamp(4rem,21vw,7rem); }
  .artist-section { grid-template-columns:1fr; gap:24px; padding:40px 22px; }
  .artist-facts { grid-template-columns:repeat(2,minmax(0,1fr)); }
  .cue-id-band { grid-template-columns:1fr; }
  .cue-id-band__visual { min-height:330px; }
  .cue-id-band__copy { padding:38px 22px; border-left:0; border-top:1px solid var(--line); }
  .booking-callout { grid-template-columns:1fr; }
  .booking-callout__meta,.booking-callout>div:first-child,.booking-callout>.artist-cta { grid-column:1; grid-row:auto; }
  .link-grid { grid-template-columns:1fr; }
  .artist-footer { padding:0 22px; }
}

@media (max-width:560px) {
  .profile-lab__topbar { position:relative; }
  .profile-lab__back { font-size:10px; }
  .profile-lab__secondary,.profile-lab__primary { min-height:34px; padding:0 9px; font-size:8px; }
  .artist-hero__content { padding-bottom:28px; }
  .artist-hero__brand-mark { width:120px; }
  .artist-hero__meta { flex-wrap:wrap; }
  .artist-hero__tagline { font-size:14px; }
  .artist-hero__actions { flex-wrap:wrap; gap:14px; }
  .edit-button--identity { right:18px; bottom:18px; }
  .sound-display strong { width:100%; }
  .sound-links { flex-direction:column; gap:13px; }
  .artist-facts { grid-template-columns:1fr; }
  .inline-editor__body { grid-template-columns:1fr; }
  .inline-editor label.wide,.visual-choice.wide { grid-column:1; }
}
</style>
