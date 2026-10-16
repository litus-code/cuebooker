<script setup lang="ts">
import type es from '../../content/es/landings.json'
defineProps<{ copy: typeof es }>()
</script>
<template>
  <section class="cl-passport cl-shell cl-section" aria-labelledby="passport-title"><div class="cl-section-head"><p class="cl-eyebrow">{{ copy.passport.status }}</p><h2 id="passport-title">{{ copy.passport.title }}</h2><p class="cl-lead">{{ copy.passport.body }}</p></div>
    <figure class="passport-concept"><div class="passport-concept__map" aria-hidden="true"><svg viewBox="0 0 520 200"><path d="M40 150 260 50 480 130"/><circle cx="40" cy="150" r="7"/><circle cx="260" cy="50" r="7"/><circle cx="480" cy="130" r="7"/></svg><span>Barcelona · Sala Horizonte</span><span>Madrid · Club Central</span><span>Lisboa · Espacio Atlántico</span></div><ol class="passport-concept__steps"><li v-for="step in copy.passport.steps" :key="step">{{ step }}</li></ol><figcaption>{{ copy.passport.caption }}</figcaption></figure>
    <p class="cl-identity-secondary">{{ copy.passport.identity }}</p>
  </section>
</template>
