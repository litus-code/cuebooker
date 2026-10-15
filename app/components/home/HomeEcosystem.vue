<script setup lang="ts">
defineProps<{ copy: {
  profile: { name: string; title: string; body: string; status: string; cta: string; example: string; stageName: string; tagline: string; sections: string[]; request: string; coverAlt: string }
  passport: { name: string; title: string; body: string; concept: string; steps: string[]; nodes: string[] }
  identity: { name: string; title: string; body: string; status: string; caption: string; alt: string }
} }>()
defineEmits<{ signup: [] }>()
const baseURL = useRuntimeConfig().app.baseURL
const profileCover = `${baseURL}images/profile/cuebooker-default-cover.webp`
const identityImage = `${baseURL}images/home21/cue-id-style-concept.jpg`
</script>

<template>
  <div class="ecosystem">
    <article class="ecosystem__profile">
      <div class="ecosystem__copy"><span class="ecosystem__status">{{ copy.profile.status }}</span><h3>{{ copy.profile.name }}</h3><p class="ecosystem__claim">{{ copy.profile.title }}</p><p>{{ copy.profile.body }}</p><NuxtLink class="cp-cta" to="/access?mode=signup" @click="$emit('signup')">{{ copy.profile.cta }}<span class="cp-arrow" aria-hidden="true" /></NuxtLink></div>
      <figure class="ecosystem__profile-visual">
        <div class="profile-composition"><div class="profile-composition__cover"><img :src="profileCover" width="1672" height="941" loading="lazy" decoding="async" :alt="copy.profile.coverAlt"><CueBrand decorative /></div><div class="profile-composition__body"><strong>{{ copy.profile.stageName }}</strong><p>{{ copy.profile.tagline }}</p><div class="profile-composition__sections"><span v-for="section in copy.profile.sections" :key="section">{{ section }}</span></div><div class="profile-composition__booking"><span>{{ copy.profile.request }}</span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12h15m-6-6 6 6-6 6" /></svg></div></div></div>
        <figcaption>{{ copy.profile.example }}</figcaption>
      </figure>
    </article>
    <div class="ecosystem__secondary">
      <article class="ecosystem__passport">
        <div class="ecosystem__copy"><h3>{{ copy.passport.name }}</h3><p class="ecosystem__claim">{{ copy.passport.title }}</p><p>{{ copy.passport.body }}</p></div>
        <figure class="passport-concept"><div class="passport-concept__map" aria-hidden="true"><svg viewBox="0 0 520 260" preserveAspectRatio="xMidYMid meet"><path class="passport-concept__grid" d="M20 65h480M20 130h480M20 195h480M130 20v220M260 20v220M390 20v220"/><path class="passport-concept__orbit" d="M65 175C130 20 355 15 455 155S235 255 65 175Z"/><path class="passport-concept__route" d="M100 170 255 82 420 160"/><circle cx="100" cy="170" r="7"/><circle cx="255" cy="82" r="7"/><circle cx="420" cy="160" r="7"/></svg><span v-for="(node, i) in copy.passport.nodes" :key="node" :class="`passport-concept__node--${i}`">{{ node }}</span></div><div class="passport-concept__steps"><span v-for="step in copy.passport.steps" :key="step">{{ step }}</span></div><figcaption>{{ copy.passport.concept }}</figcaption></figure>
      </article>
      <article class="ecosystem__identity">
        <div class="ecosystem__copy"><span class="ecosystem__status">{{ copy.identity.status }}</span><h3>{{ copy.identity.name }}</h3><p class="ecosystem__claim">{{ copy.identity.title }}</p><p>{{ copy.identity.body }}</p></div>
        <figure class="identity-preview"><img :src="identityImage" :alt="copy.identity.alt" width="640" height="640" loading="lazy" decoding="async"><figcaption>{{ copy.identity.caption }}</figcaption></figure>
      </article>
    </div>
  </div>
</template>

<style scoped>
.ecosystem { margin-top: 42px; }
.ecosystem__profile { display: grid; grid-template-columns: minmax(0, .85fr) minmax(0, 1.15fr); align-items: center; gap: 60px; padding: 44px 0 52px; border-top: 1px solid var(--cp-line); }
.ecosystem__copy { min-width: 0; }
.ecosystem h3 { color: var(--cp-paper); margin: 20px 0 18px; font-size: clamp(30px, 3.4vw, 46px); line-height: 1.1; letter-spacing: -.04em; }
.ecosystem__copy > p { color: var(--cp-muted); font-size: 16px; line-height: 1.65; margin: 16px 0 0; max-width: 460px; }
.ecosystem__copy > .ecosystem__claim { color: var(--cp-paper); font-size: clamp(21px, 2.2vw, 28px); line-height: 1.3; letter-spacing: -.025em; }
.ecosystem__status { display: inline-block; padding: 8px 10px; border: 1px solid var(--cp-line); color: var(--cp-paper); font: 10px/1.5 ui-monospace, monospace; letter-spacing: .08em; }
.ecosystem__copy .cp-cta { margin-top: 28px; }
.ecosystem__copy .cp-cta:focus-visible { outline: 2px solid var(--cp-lime); outline-offset: 5px; }
.ecosystem figure { margin: 0; min-width: 0; }
.ecosystem figcaption { font: 10px/1.6 ui-monospace, monospace; letter-spacing: .04em; color: var(--cp-muted); }
.ecosystem__profile-visual figcaption { padding-top: 14px; }
.profile-composition { overflow: hidden; border: 1px solid #34342f; border-radius: 6px; background: #090a08; color: #f2f0eb; }
.profile-composition__cover { position: relative; height: 180px; overflow: hidden; background: #101010; }
.profile-composition__cover > img { display: block; width: 100%; height: 100%; object-fit: cover; }
.profile-composition__cover :deep(.cue-brand) { position: absolute; top: 18px; left: 22px; width: 110px; height: 37px; }
.profile-composition__body { padding: 28px; }
.profile-composition__body > strong { display: block; max-width: 480px; font-size: clamp(26px, 3vw, 42px); line-height: 1.05; letter-spacing: -.04em; }
.profile-composition__body p { color: #b3b3ac; margin-block: 12px 24px; font-size: 14px; }
.profile-composition__sections { display: flex; flex-wrap: wrap; gap: 24px; padding-block: 18px; border-block: 1px solid #34342f; color: #d8f56b; font: 10px ui-monospace, monospace; letter-spacing: .08em; }
.profile-composition__booking { display: flex; align-items: center; justify-content: space-between; margin-top: 24px; font-size: 16px; }
.profile-composition__booking svg { width: 24px; height: 24px; fill: none; stroke: #d8f56b; stroke-width: 1.5; }
.ecosystem__secondary { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 48px; padding-top: 40px; border-top: 1px solid var(--cp-line); }
.ecosystem__secondary > article { min-width: 0; display: grid; grid-template-rows: auto 1fr; gap: 28px; }
.ecosystem__secondary h3 { font-size: 30px; }
.ecosystem__passport .ecosystem__copy { padding-top: 38px; }
.passport-concept { display: flex; flex-direction: column; justify-content: end; min-height: 350px; border: 1px solid var(--cp-line); background: var(--cp-panel); }
.passport-concept__map { position: relative; min-height: 260px; display: grid; align-items: center; }
.passport-concept svg { display: block; width: 100%; height: auto; max-height: 270px; fill: none; stroke: var(--cp-lime); stroke-width: 1.2; }
.passport-concept__grid { stroke: var(--cp-line); }
.passport-concept__orbit { stroke: var(--cp-line); }
.passport-concept__route { stroke-dasharray: 4 5; }
.passport-concept circle { fill: var(--cp-lime); stroke: var(--cp-panel); stroke-width: 4; }
.passport-concept__map > span { position: absolute; font: 11px ui-monospace, monospace; color: var(--cp-paper); }
.passport-concept__node--0 { left: 13%; top: 78%; }
.passport-concept__node--1 { left: 43%; top: 20%; }
.passport-concept__node--2 { right: 12%; top: 73%; }
.passport-concept__steps { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 12px; padding: 16px 20px; border-top: 1px solid var(--cp-line); font: 10px ui-monospace, monospace; color: var(--cp-paper); }
.passport-concept figcaption { padding: 12px 20px; border-top: 1px solid var(--cp-line); }
.identity-preview { display: flex; flex-direction: column; justify-content: end; overflow: hidden; background: #0a0b0a; border: 1px solid var(--cp-line); }
.identity-preview > img { display: block; width: 100%; height: 330px; object-fit: contain; object-position: center; }
.identity-preview figcaption { color: #b3b3ac; padding: 16px 20px; border-top: 1px solid #34342f; }
@media (max-width: 800px) {
  .ecosystem__profile { grid-template-columns: 1fr; gap: 32px; padding-top: 28px; }
  .ecosystem__secondary { grid-template-columns: 1fr; gap: 40px; }
  .ecosystem__secondary > article { gap: 24px; }
  .ecosystem__passport .ecosystem__copy { padding-top: 0; }
  .ecosystem__secondary h3 { margin-top: 0; }
  .identity-preview > img { height: auto; max-height: 430px; object-fit: contain; }
}
@media (max-width: 365px) {
  .profile-composition__body { padding: 20px; }
  .profile-composition__cover { height: 140px; }
  .passport-concept__steps { gap: 8px; font-size: 9px; }
  .ecosystem figcaption { font-size: 9px; }
}
</style>
