<script setup lang="ts">
const analytics = useAnalytics()
useHead({ title: 'Política de cookies | CueBooker' })
</script>

<template>
  <main class="legal-page">
    <NuxtLink to="/">← CueBooker</NuxtLink>
    <h1>Política de cookies</h1>
    <p class="legal-note">Versión inicial · Última actualización: septiembre de 2026</p>

    <h2>Qué utilizamos</h2>
    <p>CueBooker utiliza almacenamiento y tecnologías necesarias para el funcionamiento, seguridad y preferencias del servicio. Las tecnologías analíticas solo se activan cuando la persona usuaria presta su consentimiento.</p>

    <h2>Categorías</h2>
    <p><strong>Necesarias.</strong> Son imprescindibles para el funcionamiento y no pueden desactivarse desde el gestor de consentimiento.</p>
    <p><strong>Analíticas.</strong> Permiten entender cómo se utiliza CueBooker y medir el rendimiento del producto. Actualmente la arquitectura está preparada para Google Tag Manager y Google Analytics 4, condicionados al consentimiento.</p>
    <p><strong>Marketing.</strong> Categoría reservada para futuras herramientas de medición publicitaria o campañas. No debe activarse ningún proveedor de esta categoría hasta documentarlo y obtener consentimiento.</p>

    <h2>Cómo cambiar tus preferencias</h2>
    <p>Puedes aceptar, rechazar o configurar las tecnologías opcionales. También puedes volver a abrir el panel en cualquier momento.</p>
    <button class="preferences-button" type="button" @click="analytics.openPreferences">Preferencias de cookies</button>

    <h2>Información pendiente antes de producción</h2>
    <p>Antes de considerar esta política definitiva se deberá completar el inventario real de cookies y tecnologías, indicando proveedor, nombre, finalidad, duración y, cuando proceda, transferencias internacionales.</p>

    <div class="legal-warning"><strong>Estado:</strong> estructura preparada para revisión jurídica y para completar el inventario técnico real antes del lanzamiento definitivo.</div>
  </main>
</template>

<style scoped>
.legal-page { max-width: 820px; margin: 0 auto; padding: 56px 22px 100px; color: #f4f4f4; line-height: 1.7; }
.legal-page a { color: inherit; } h1 { margin: 32px 0 4px; font-size: clamp(2rem, 6vw, 3.6rem); } h2 { margin-top: 36px; font-size: 1.15rem; } p { color: rgba(255,255,255,.72); } .legal-note { font-size: .85rem; } .preferences-button { min-height: 44px; padding: 0 18px; border: 1px solid #fff; border-radius: 999px; background: #fff; color: #0c0c0e; font: inherit; font-weight: 700; cursor: pointer; } .legal-warning { margin-top: 48px; padding: 18px; border: 1px solid rgba(255,255,255,.16); border-radius: 12px; color: rgba(255,255,255,.72); }
</style>
