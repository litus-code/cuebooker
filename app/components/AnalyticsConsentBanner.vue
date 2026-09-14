<script setup lang="ts">
const analytics = useAnalytics()
const { locale } = useCuePreferences()

const visible = computed(() => analytics.enabled.value && analytics.consent.value === 'unknown')
const copy = computed(() => locale.value === 'es' ? {
  label: 'Preferencias de analítica', title: 'Analítica opcional',
  body: 'Nos ayuda a entender cómo se usa CueBooker y mejorar el producto. No cargaremos Google Tag Manager hasta que aceptes.',
  deny: 'Rechazar', accept: 'Aceptar analítica'
} : {
  label: 'Analytics preferences', title: 'Optional analytics',
  body: 'This helps us understand how CueBooker is used and improve the product. Google Tag Manager will not load until you accept.',
  deny: 'Decline', accept: 'Accept analytics'
})
</script>

<template>
  <aside v-if="visible" class="analytics-consent" :aria-label="copy.label">
    <div class="analytics-consent__copy">
      <strong>{{ copy.title }}</strong>
      <p>{{ copy.body }}</p>
    </div>

    <div class="analytics-consent__actions">
      <button class="analytics-consent__button analytics-consent__button--secondary" type="button" @click="analytics.deny">
        {{ copy.deny }}
      </button>
      <button class="analytics-consent__button" type="button" @click="analytics.accept">
        {{ copy.accept }}
      </button>
    </div>
  </aside>
</template>

<style scoped>
.analytics-consent {
  position: fixed;
  z-index: 1000;
  right: 20px;
  bottom: 20px;
  left: 20px;
  display: flex;
  max-width: 760px;
  margin: 0 auto;
  padding: 18px;
  gap: 20px;
  align-items: center;
  justify-content: space-between;
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 14px;
  background: rgba(12, 12, 14, 0.96);
  color: #fff;
  box-shadow: 0 18px 60px rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(16px);
}

.analytics-consent__copy {
  min-width: 0;
}

.analytics-consent__copy strong {
  display: block;
  margin-bottom: 6px;
}

.analytics-consent__copy p {
  margin: 0;
  color: rgba(255, 255, 255, 0.72);
  font-size: 0.9rem;
  line-height: 1.45;
}

.analytics-consent__actions {
  display: flex;
  flex-shrink: 0;
  gap: 8px;
}

.analytics-consent__button {
  min-height: 40px;
  padding: 0 14px;
  border: 1px solid #fff;
  border-radius: 999px;
  background: #fff;
  color: #0c0c0e;
  font: inherit;
  font-weight: 700;
  cursor: pointer;
}

.analytics-consent__button--secondary {
  background: transparent;
  color: #fff;
  border-color: rgba(255, 255, 255, 0.3);
}

@media (max-width: 680px) {
  .analytics-consent {
    align-items: stretch;
    flex-direction: column;
  }

  .analytics-consent__actions {
    width: 100%;
  }

  .analytics-consent__button {
    flex: 1;
  }
}
</style>
