<script setup lang="ts">
const route = useRoute()
const { locale } = useCuePreferences()

const copy = computed(() => locale.value === 'es'
  ? {
      eyebrow: 'PRIMEROS PASOS / ACTIVACIÓN',
      title: 'TU WORKSPACE ESTÁ LISTO.',
      intro: 'Todavía no hay solicitudes que mostrar. Activa estas tres piezas y Cuebooker empezará a trabajar contigo.',
      bookingLink: 'Tu enlace de booking',
      previewNote: 'Preview visual. Esta ruta no inicia sesión ni escribe datos.',
      steps: [
        {
          index: '01',
          title: 'Completa tu perfil público',
          body: 'Añade la información esencial que verá un promoter cuando llegue a tu enlace.',
          action: 'Completar perfil'
        },
        {
          index: '02',
          title: 'Publica y comparte tu booking',
          body: 'Activa tu perfil público y comparte el enlace para empezar a recibir solicitudes.',
          action: 'Configurar publicación'
        },
        {
          index: '03',
          title: 'Registra tu primera solicitud',
          body: '¿Ya tienes una conversación por WhatsApp, email o Instagram? Conviértela en booking.',
          action: 'Crear primer booking'
        }
      ]
    }
  : {
      eyebrow: 'FIRST STEPS / ACTIVATION',
      title: 'YOUR WORKSPACE IS READY.',
      intro: 'There are no enquiries to show yet. Activate these three pieces and Cuebooker will start working with you.',
      bookingLink: 'Your booking link',
      previewNote: 'Visual preview. This route does not sign in or write data.',
      steps: [
        {
          index: '01',
          title: 'Complete your public profile',
          body: 'Add the essential information a promoter will see when they open your link.',
          action: 'Complete profile'
        },
        {
          index: '02',
          title: 'Publish and share your booking',
          body: 'Publish your profile and share the link to start receiving enquiries.',
          action: 'Set up publishing'
        },
        {
          index: '03',
          title: 'Capture your first enquiry',
          body: 'Already have a WhatsApp, email or Instagram conversation? Turn it into a booking.',
          action: 'Create first booking'
        }
      ]
    })

const allowed = ref(true)

onMounted(async () => {
  const hostname = window.location.hostname.toLowerCase()
  if (hostname === 'cuebooker.com' || hostname === 'www.cuebooker.com') {
    allowed.value = false
    await navigateTo('/')
  }
})

useHead(() => ({
  title: 'First-run preview | Cuebooker',
  meta: [{ name: 'robots', content: 'noindex,nofollow' }]
}))
</script>

<template>
  <main v-if="allowed" class="preview-page">
    <section class="preview-shell">
      <div class="preview-bar">
        <span>PR #98 · preview/first-run-activation</span>
        <small>{{ copy.previewNote }}</small>
      </div>

      <section class="activation-panel">
        <div class="activation-panel__intro">
          <p class="eyebrow">{{ copy.eyebrow }}</p>
          <h1>{{ copy.title }}</h1>
          <p>{{ copy.intro }}</p>
        </div>

        <div class="activation-panel__steps">
          <article v-for="step in copy.steps" :key="step.index" class="activation-step">
            <span class="activation-step__index">{{ step.index }}</span>
            <div>
              <h2>{{ step.title }}</h2>
              <p>{{ step.body }}</p>
            </div>
            <button type="button">{{ step.action }}</button>
          </article>
        </div>

        <div class="activation-panel__footer">
          <span>{{ copy.bookingLink }}</span>
          <code>cuebooker.com/tu-artista?booking=1</code>
        </div>
      </section>
    </section>
  </main>
</template>

<style scoped>
.preview-page{
  min-height:100vh;
  padding:clamp(16px,3vw,34px);
  background:var(--cue-bg);
  color:var(--cue-text);
}
.preview-shell{
  width:min(1320px,100%);
  margin:0 auto;
}
.preview-bar{
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:18px;
  margin-bottom:14px;
  padding:12px 14px;
  border:1px solid var(--cue-border);
  background:var(--cue-surface);
  color:var(--cue-muted);
  font:700 10px/1.3 monospace;
  letter-spacing:.06em;
  text-transform:uppercase;
}
.preview-bar small{
  color:var(--cue-muted);
  font:600 10px/1.3 monospace;
  text-transform:none;
  letter-spacing:0;
}
.activation-panel{
  overflow:hidden;
  border:1px solid var(--cue-border);
  background:
    radial-gradient(circle at 82% 0%,color-mix(in srgb,var(--cue-accent) 12%,transparent),transparent 34%),
    var(--cue-surface);
  box-shadow:0 28px 90px var(--cue-shadow);
}
.activation-panel__intro{
  max-width:820px;
  padding:clamp(28px,5vw,58px);
}
.eyebrow{
  margin:0;
  color:var(--cue-accent);
  font:800 10px/1.2 monospace;
  letter-spacing:.12em;
}
.activation-panel__intro h1{
  max-width:760px;
  margin:8px 0 16px;
  font-size:clamp(2.6rem,6vw,5.5rem);
  line-height:.88;
  letter-spacing:-.055em;
}
.activation-panel__intro>p:last-child{
  max-width:640px;
  margin:0;
  color:var(--cue-muted);
  font-size:15px;
  line-height:1.6;
}
.activation-panel__steps{
  display:grid;
  grid-template-columns:repeat(3,minmax(0,1fr));
  border-top:1px solid var(--cue-border);
}
.activation-step{
  min-width:0;
  padding:26px;
  border-right:1px solid var(--cue-border);
}
.activation-step:last-child{border-right:0}
.activation-step__index{
  display:grid;
  width:34px;
  height:34px;
  margin-bottom:28px;
  place-items:center;
  border:1px solid var(--cue-border);
  color:var(--cue-accent);
  font:800 11px/1 monospace;
}
.activation-step h2{
  margin:0 0 9px;
  font-size:1.05rem;
}
.activation-step p{
  min-height:66px;
  margin:0 0 22px;
  color:var(--cue-muted);
  font-size:12px;
  line-height:1.55;
}
.activation-step button{
  min-height:42px;
  padding:0 15px;
  border:1px solid var(--cue-border);
  background:transparent;
  color:var(--cue-text);
  font:800 10px/1 monospace;
  letter-spacing:.05em;
  text-transform:uppercase;
  cursor:default;
}
.activation-panel__footer{
  display:flex;
  align-items:center;
  gap:18px;
  padding:18px 26px;
  border-top:1px solid var(--cue-border);
  background:color-mix(in srgb,var(--cue-bg) 70%,transparent);
}
.activation-panel__footer span{
  color:var(--cue-muted);
  font:800 9px/1 monospace;
  letter-spacing:.08em;
  text-transform:uppercase;
}
.activation-panel__footer code{
  overflow:hidden;
  color:var(--cue-text);
  font-size:11px;
  text-overflow:ellipsis;
  white-space:nowrap;
}
@media(max-width:900px){
  .preview-bar{align-items:flex-start;flex-direction:column}
  .activation-panel__steps{grid-template-columns:1fr}
  .activation-step{border-right:0;border-bottom:1px solid var(--cue-border)}
  .activation-step:last-child{border-bottom:0}
  .activation-step p{min-height:0}
  .activation-panel__footer{align-items:flex-start;flex-direction:column;gap:7px}
}
</style>
