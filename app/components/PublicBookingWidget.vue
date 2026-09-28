<script setup lang="ts">
import type { PublicArtistProfile, PublicBookingRequestInput } from '../domain/publicArtistProfile'

type BookingFormSubmission = Omit<PublicBookingRequestInput, 'artistSlug' | 'requestId' | 'entrySource' | 'locale'>

withDefaults(defineProps<{
  profile: PublicArtistProfile
  locale?: 'es' | 'en'
  submitting?: boolean
  sent?: boolean
  confirmationSent?: boolean | null
  reference?: string
  error?: string
}>(), {
  locale: 'es',
  submitting: false,
  sent: false,
  confirmationSent: null,
  reference: '',
  error: ''
})

const emit = defineEmits<{
  submit: [payload: BookingFormSubmission]
}>()
</script>

<template>
  <main class="public-booking-widget">
    <header class="public-booking-widget__header">
      <div>
        <span>{{ locale === 'es' ? 'BOOKING CON' : 'BOOKING WITH' }}</span>
        <strong>{{ profile.stageName }}</strong>
      </div>
      <a href="https://cuebooker.com" target="_blank" rel="noopener noreferrer" aria-label="Cuebooker">
        <CueBrand />
      </a>
    </header>

    <div v-if="!profile.acceptingRequests" class="public-booking-widget__closed">
      <span>{{ locale === 'es' ? 'BOOKING CERRADO' : 'BOOKING CLOSED' }}</span>
      <strong>{{ locale === 'es' ? 'Ahora mismo no acepta nuevas solicitudes.' : 'New enquiries are currently closed.' }}</strong>
    </div>

    <PublicBookingForm
      v-else
      :artist-name="profile.stageName"
      :locale="locale"
      :submitting="submitting"
      :sent="sent"
      :confirmation-sent="confirmationSent"
      :reference="reference"
      :error="error"
      compact
      @submit="emit('submit', $event)"
    />
  </main>
</template>

<style scoped>
:global(html), :global(body), :global(#__nuxt) { min-height: 100%; }
:global(body) { margin: 0; background: var(--cue-surface, #101010); }
.public-booking-widget { min-height: 100vh; background: var(--cue-surface, #101010); color: var(--cue-text, #f2f0eb); font-family: Arial, Helvetica, sans-serif; }
.public-booking-widget__header { display: flex; justify-content: space-between; align-items: center; gap: 18px; min-height: 58px; padding: 0 20px; border-bottom: 1px solid var(--cue-border, #303030); }
.public-booking-widget__header > div { min-width: 0; }
.public-booking-widget__header span { display: block; color: var(--cue-muted, #888); font: 700 8px/1.2 monospace; letter-spacing: .1em; }
.public-booking-widget__header strong { display: block; margin-top: 2px; overflow: hidden; font-size: 13px; text-overflow: ellipsis; text-transform: uppercase; white-space: nowrap; }
.public-booking-widget__header a { width: 116px; color: inherit; text-decoration: none; }
.public-booking-widget__closed { display: grid; align-content: center; min-height: 360px; box-sizing: border-box; padding: 28px; }
.public-booking-widget__closed span { color: var(--cue-accent, #e8ff2f); font: 800 9px/1.2 monospace; letter-spacing: .11em; }
.public-booking-widget__closed strong { display: block; max-width: 520px; margin-top: 12px; font-size: clamp(2rem, 7vw, 4rem); line-height: .92; text-transform: uppercase; }
@media (max-width: 520px) {
  .public-booking-widget__header { min-height: 54px; padding-inline: 14px; }
  .public-booking-widget__header a { width: 102px; }
}
</style>
