<script setup lang="ts">
const { copy, locale, signupTo, trackSignup } = useCommercialLanding('dj')
</script>
<template><CommercialAudienceLanding audience="dj" :copy="copy" :signup-to="signupTo" @signup="trackSignup">
  <CommercialProfileDistribution :copy="copy" :locale="locale" />
  <CommercialBookingJourney :copy="copy" />
  <CommercialEmailBeta :copy="copy" />
  <section class="cl-identity"><div class="cl-shell cl-section"><p class="cl-eyebrow">CUEBOOKER / IDENTITY</p><h2>{{ copy.ecosystemTitle }}</h2><div class="cl-identity-grid"><article v-for="(item, i) in copy.ecosystem" :key="item[0]" class="cl-identity-tile"><span class="cl-index">0{{ i + 1 }} / {{ item[2] }}</span><div class="cl-identity-art" :class="`cl-identity-art--${i}`" aria-hidden="true"><template v-if="i === 0"><span class="cl-identity-art-circle" /><span class="cl-identity-art-line" /><span class="cl-identity-art-line short" /></template><template v-else-if="i === 1"><span class="cl-identity-art-orbit" /><span class="cl-identity-art-orbit small" /><span class="cl-identity-art-point" /></template><template v-else><span class="cl-identity-art-head" /><span class="cl-identity-art-shoulders" /></template></div><h3>{{ item[0] }}</h3><p>{{ item[1] }}</p></article></div></div></section>
</CommercialAudienceLanding></template>
