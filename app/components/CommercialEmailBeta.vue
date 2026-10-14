<script setup lang="ts">
import type es from '../../content/es/landings.json'
defineProps<{ copy: typeof es }>()
</script>
<template><section class="cl-shell cl-section cl-email"><div><p class="cl-eyebrow">{{ copy.emailStatus }}</p><h2>{{ copy.emailTitle }}</h2><p class="cl-lead">{{ copy.emailBody }}</p><p class="cl-note">{{ copy.emailNote }}</p></div><ol class="cl-email-stages"><li v-for="(stage, i) in copy.emailStages" :key="stage[0]"><span class="cl-index">0{{ i + 1 }}</span><div><h3>{{ stage[0] }}</h3><p>{{ stage[1] }}</p></div></li></ol></section></template>
