<script setup lang="ts">
const { copy, locale, signupTo, trackSignup } = useCommercialLanding('agency')
</script>
<template><CommercialAudienceLanding audience="agency" :copy="copy" :signup-to="signupTo" @signup="trackSignup">
  <section id="how" class="cl-shell cl-section"><div class="cl-section-head"><p class="cl-eyebrow">01 / {{ copy.rosterStatus }}</p><h2>{{ copy.rosterTitle }}</h2><p class="cl-lead">{{ copy.rosterBody }}</p></div><div class="cl-roster"><div class="cl-console-head"><CueBrand /><span>{{ copy.rosterStatus }}</span></div><div class="cl-roster-row cl-roster-labels"><span>{{ copy.artist }}</span><span>{{ copy.requests }}</span><span>{{ copy.status }}</span><span>{{ copy.date }}</span></div><div v-for="(row, i) in copy.rosterRows" :key="row[0]" class="cl-roster-row"><strong><span class="cl-artist-index">0{{ i + 1 }}</span>{{ row[0] }}</strong><span>{{ row[1] }}</span><span class="cl-status">{{ row[2] }}</span><span>{{ row[3] }}</span></div><p class="cl-note">{{ copy.example }}</p></div></section>
  <section class="cl-context"><div class="cl-shell cl-section cl-context-grid"><div><p class="cl-eyebrow">02 / BOOKING CONTEXT</p><h2>{{ copy.contextTitle }}</h2><p class="cl-lead">{{ copy.contextBody }}</p></div><div class="cl-record"><p class="cl-eyebrow">BOOKING / A</p><dl><div v-for="field in copy.context" :key="field[0]"><dt>{{ field[0] }}</dt><dd>{{ field[1] }}</dd></div></dl><p class="cl-note">{{ copy.example }}</p></div></div></section>
  <CommercialBookingJourney :copy="copy" :title="copy.agencyJourney" />
  <CommercialEmailBeta :copy="copy" />
  <CommercialProfileDistribution section-id="distribution" :copy="copy" :locale="locale" :title="copy.agencyDistribution" />
</CommercialAudienceLanding></template>
