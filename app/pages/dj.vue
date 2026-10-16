<script setup lang="ts">
const { copy, locale, signupTo, trackSignup } = useCommercialLanding('dj')
</script>
<template><CommercialAudienceLanding audience="dj" :copy="copy" :signup-to="signupTo" @signup="trackSignup">
  <CommercialArtistProfile :copy="copy" :locale="locale" />
  <CommercialProfileDistribution :copy="copy" :locale="locale" section-id="distribution" />
  <CommercialBookingJourney :copy="copy" />
  <CommercialProductEvidence :copy="copy" :locale="locale" />
  <CommercialEmailBeta :copy="copy" />
  <CommercialPassport :copy="copy" />
</CommercialAudienceLanding></template>
