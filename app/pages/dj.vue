<script setup lang="ts">
const { copy, locale, signupTo, trackSignup } = useCommercialLanding('dj')
</script>
<template><CommercialAudienceLanding audience="dj" :copy="copy" :signup-to="signupTo" @signup="trackSignup">
  <CommercialProfileDistribution :copy="copy" :locale="locale" />
  <CommercialBookingJourney :copy="copy" />
  <CommercialEmailBeta :copy="copy" />
  <section class="cl-identity"><div class="cl-shell cl-section"><p class="cl-eyebrow">CUEBOOKER / IDENTITY</p><h2>{{ copy.ecosystemTitle }}</h2><div class="cl-identity-grid"><article v-for="(item, i) in copy.ecosystem" :key="item[0]"><span class="cl-index">0{{ i + 1 }} / {{ item[2] }}</span><div class="cl-identity-mark" aria-hidden="true">{{ ['PROFILE /', 'PASSPORT /', 'CUE ID /'][i] }}</div><h3>{{ item[0] }}</h3><p>{{ item[1] }}</p></article></div></div></section>
</CommercialAudienceLanding></template>
