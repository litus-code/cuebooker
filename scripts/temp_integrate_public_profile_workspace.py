from pathlib import Path

workspace_path = Path('app/pages/workspace.vue')
controls_path = Path('app/components/PublicProfilePublishingControls.vue')
workspace = workspace_path.read_text()
controls = controls_path.read_text()


def replace_once(text: str, old: str, new: str, label: str) -> str:
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{label}: expected exactly 1 match, found {count}')
    return text.replace(old, new, 1)


if 'const publicPublishing = usePublicArtistPublishing()' in workspace:
    raise SystemExit('workspace already contains public publishing integration')

workspace = replace_once(
    workspace,
    "import type { CoreBooking, Hold } from '../domain/bookingCore'\n",
    "import type { CoreBooking, Hold } from '../domain/bookingCore'\nimport type { PublicArtistProfile } from '../domain/publicArtistProfile'\n",
    'public profile type import'
)

workspace = replace_once(
    workspace,
    "const artistProfiles = useArtistProfile()\nconst preferences = useCuePreferences()",
    "const artistProfiles = useArtistProfile()\nconst publicPublishing = usePublicArtistPublishing()\nconst preferences = useCuePreferences()",
    'public publishing composable'
)

workspace = replace_once(
    workspace,
    "const profileCoverMessage = ref('')\nconst tourCardStyle = ref<Record<string, string>>({})",
    "const profileCoverMessage = ref('')\nconst profileArtistImageUrl = ref('')\nconst profileArtistCutoutUrl = ref('')\nconst publicProfilePublished = ref(false)\nconst publicProfileAcceptingRequests = ref(false)\nconst publicProfileWorkspaceId = ref('')\nconst publicPublishingSaving = ref(false)\nconst publicPublishingMessage = ref('')\nconst tourCardStyle = ref<Record<string, string>>({})",
    'public profile state'
)

workspace = replace_once(
    workspace,
    "profileEyebrow: 'ARTISTA / FICHA PROFESIONAL', profileTitle: 'TU INFORMACIÓN DE BOOKING.', profileBody: 'Completa esta ficha a tu ritmo. Hoy es privada y servirá para organizar mejor tus solicitudes y preparar futuras opciones de descubrimiento.',",
    "profileEyebrow: 'ARTISTA / FICHA PROFESIONAL', profileTitle: 'TU INFORMACIÓN DE BOOKING.', profileBody: 'Edita lo que verá quien visite tu perfil público. Tus condiciones privadas de booking siguen siendo solo de tu workspace.',",
    'spanish profile body copy'
)
workspace = replace_once(
    workspace,
    "previewProfile: 'Vista previa', previewPrivate: 'VISTA PRIVADA / NO PUBLICADA', previewClose: 'Cerrar vista previa'",
    "previewProfile: 'Vista previa', previewPrivate: 'VISTA PREVIA / PERFIL PÚBLICO', previewClose: 'Cerrar vista previa'",
    'spanish preview copy'
)
workspace = replace_once(
    workspace,
    "profilePublicSection: 'Identidad y ubicación', profilePublicHint: 'Información profesional preparada para una futura ficha pública. Todavía no se publica.',",
    "profilePublicSection: 'Identidad y ubicación', profilePublicHint: 'Esta información forma parte de tu perfil público cuando decidas publicarlo.',",
    'spanish public hint'
)
workspace = replace_once(
    workspace,
    "profileEyebrow: 'ARTIST / PROFESSIONAL PROFILE', profileTitle: 'YOUR BOOKING INFORMATION.', profileBody: 'Complete this profile at your own pace. It is private today and will help organise requests and prepare future discovery options.',",
    "profileEyebrow: 'ARTIST / PROFESSIONAL PROFILE', profileTitle: 'YOUR BOOKING INFORMATION.', profileBody: 'Edit what people will see on your public artist profile. Your private booking terms remain visible only inside your workspace.',",
    'english profile body copy'
)
workspace = replace_once(
    workspace,
    "previewProfile: 'Preview', previewPrivate: 'PRIVATE PREVIEW / NOT PUBLISHED', previewClose: 'Close preview'",
    "previewProfile: 'Preview', previewPrivate: 'PREVIEW / PUBLIC PROFILE', previewClose: 'Close preview'",
    'english preview copy'
)
workspace = replace_once(
    workspace,
    "profilePublicSection: 'Identity and location', profilePublicHint: 'Professional information prepared for a future public profile. It is not published yet.',",
    "profilePublicSection: 'Identity and location', profilePublicHint: 'This information becomes part of your public profile when you choose to publish it.',",
    'english public hint'
)

old_preview_computed = """const profilePreviewGenres = computed(() => [
  ...splitList(profileForm.value.primaryGenres, 3),
  ...splitList(profileForm.value.secondaryGenres, 8)
].slice(0, 8))
const profilePreviewFormats = computed(() => splitList(profileForm.value.performanceFormats, 6))
const profilePreviewLocation = computed(() => [profileForm.value.city.trim(), profileForm.value.countryCode.trim().toUpperCase()].filter(Boolean).join(', '))
const profilePreviewLinks = computed(() => [
  { label: copy.value.website, url: profileForm.value.websiteUrl },
  { label: copy.value.instagram, url: profileForm.value.instagramUrl },
  { label: copy.value.soundcloud, url: profileForm.value.soundcloudUrl },
  { label: copy.value.mixcloud, url: profileForm.value.mixcloudUrl },
  { label: copy.value.youtube, url: profileForm.value.youtubeUrl },
  { label: copy.value.spotify, url: profileForm.value.spotifyUrl }
]
  .map(link => ({ ...link, url: link.url.trim() }))
  .filter(link => /^https?:\\/\\//i.test(link.url)))
const profileCoverSource = computed(() => profileCoverUrl.value || '/images/profile/cuebooker-default-cover.webp')
"""

new_preview_computed = """const publicProfilePreview = computed<PublicArtistProfile>(() => {
  const persisted = artistProfiles.activeProfile.value?.artist
  return {
    stageName: profileForm.value.stageName.trim() || selectedArtist.value?.stage_name || 'Artist',
    slug: selectedArtist.value?.slug || persisted?.slug || '',
    bio: nullableText(profileForm.value.bio),
    city: nullableText(profileForm.value.city),
    countryCode: nullableText(profileForm.value.countryCode)?.toUpperCase() || null,
    languages: splitList(profileForm.value.languages, 8),
    primaryGenres: splitList(profileForm.value.primaryGenres, 3),
    secondaryGenres: splitList(profileForm.value.secondaryGenres, 8),
    performanceFormats: splitList(profileForm.value.performanceFormats, 6),
    eventTypes: splitList(profileForm.value.eventTypes, 10),
    yearsActive: nullableNumber(profileForm.value.yearsActive),
    websiteUrl: nullableText(profileForm.value.websiteUrl),
    instagramUrl: nullableText(profileForm.value.instagramUrl),
    soundcloudUrl: nullableText(profileForm.value.soundcloudUrl),
    mixcloudUrl: nullableText(profileForm.value.mixcloudUrl),
    youtubeUrl: nullableText(profileForm.value.youtubeUrl),
    spotifyUrl: nullableText(profileForm.value.spotifyUrl),
    coverUrl: profileCoverUrl.value || null,
    coverPositionY: profileForm.value.coverPositionY,
    artistImageUrl: profileArtistImageUrl.value || null,
    artistCutoutUrl: profileArtistCutoutUrl.value || null,
    artistImageStyle: persisted?.artist_image_style || 'photo',
    artistImagePositionX: persisted?.artist_image_position_x ?? 50,
    artistImagePositionY: persisted?.artist_image_position_y ?? 50,
    artistImageScale: persisted?.artist_image_scale ?? 1,
    acceptingRequests: publicProfileAcceptingRequests.value
  }
})
"""
workspace = replace_once(workspace, old_preview_computed, new_preview_computed, 'shared public profile preview computed')

workspace = replace_once(
    workspace,
    "watch(selectedArtistId, async (artistId) => {\n  if (artistId) await loadArtistProfile()\n})",
    "watch(selectedArtistId, async (artistId) => {\n  bookingCoreWorkspaceId.value = ''\n  publicProfileWorkspaceId.value = ''\n  if (!artistId) return\n  await loadArtistProfile()\n  await ensureBookingCoreWorkspace()\n})",
    'selected artist operational refresh'
)

workspace = replace_once(
    workspace,
    "  if (profileCoverUrl.value.startsWith('blob:')) URL.revokeObjectURL(profileCoverUrl.value)\n  if (import.meta.client) window.removeEventListener('resize', handleViewportChange)",
    "  if (profileCoverUrl.value.startsWith('blob:')) URL.revokeObjectURL(profileCoverUrl.value)\n  if (profileArtistImageUrl.value.startsWith('blob:')) URL.revokeObjectURL(profileArtistImageUrl.value)\n  if (profileArtistCutoutUrl.value.startsWith('blob:')) URL.revokeObjectURL(profileArtistCutoutUrl.value)\n  if (import.meta.client) window.removeEventListener('resize', handleViewportChange)",
    'preview media cleanup'
)

old_nullable_number = """function nullableNumber(value: string) {
  const trimmed = value.trim()
  return trimmed ? Number(trimmed) : null
}

function replaceProfileCoverUrl(nextUrl: string) {
"""
new_nullable_number = """function nullableNumber(value: string) {
  const trimmed = value.trim()
  return trimmed ? Number(trimmed) : null
}

function replaceProfileArtistImageUrl(nextUrl: string) {
  if (profileArtistImageUrl.value.startsWith('blob:')) URL.revokeObjectURL(profileArtistImageUrl.value)
  profileArtistImageUrl.value = nextUrl
}

function replaceProfileArtistCutoutUrl(nextUrl: string) {
  if (profileArtistCutoutUrl.value.startsWith('blob:')) URL.revokeObjectURL(profileArtistCutoutUrl.value)
  profileArtistCutoutUrl.value = nextUrl
}

async function loadProfileVisualMedia(artistImagePath: string | null, artistCutoutPath: string | null) {
  replaceProfileArtistImageUrl('')
  replaceProfileArtistCutoutUrl('')
  if (artistImagePath) {
    try { replaceProfileArtistImageUrl(await artistProfiles.getArtistImageObjectUrl(artistImagePath)) } catch { /* optional preview media */ }
  }
  if (artistCutoutPath) {
    try { replaceProfileArtistCutoutUrl(await artistProfiles.getArtistCutoutObjectUrl(artistCutoutPath)) } catch { /* optional preview media */ }
  }
}

async function loadPublicPublishingState() {
  publicProfilePublished.value = false
  publicProfileAcceptingRequests.value = false
  publicProfileWorkspaceId.value = ''
  publicPublishingMessage.value = ''
  if (!selectedArtistId.value) return
  try {
    const state = await publicPublishing.load(selectedArtistId.value)
    publicProfilePublished.value = state.publicProfileEnabled
    publicProfileAcceptingRequests.value = state.acceptingRequests
    publicProfileWorkspaceId.value = state.workspaceId || ''
  } catch (error: any) {
    publicPublishingMessage.value = error?.message || (preferences.locale.value === 'es'
      ? 'No se pudo cargar el estado del perfil público.'
      : 'The public profile state could not be loaded.')
  }
}

function replaceProfileCoverUrl(nextUrl: string) {
"""
workspace = replace_once(workspace, old_nullable_number, new_nullable_number, 'public profile helper functions')

workspace = replace_once(
    workspace,
    "    await loadProfileCover(profileForm.value.coverImagePath)",
    "    await Promise.all([\n      loadProfileCover(profileForm.value.coverImagePath),\n      loadProfileVisualMedia(record.artist.artist_image_path, record.artist.artist_cutout_path),\n      loadPublicPublishingState()\n    ])",
    'load shared public profile state'
)

save_anchor = """async function saveArtistProfile() {
  if (!selectedArtistId.value || !canEditSelectedArtist.value) return
"""
public_actions = """async function updatePublicProfilePublished(enabled: boolean) {
  if (!selectedArtistId.value || !canEditSelectedArtist.value) return
  publicPublishingSaving.value = true
  publicPublishingMessage.value = ''
  try {
    if (!enabled && publicProfileAcceptingRequests.value) {
      const workspaceId = publicProfileWorkspaceId.value || bookingCoreWorkspaceId.value
      if (workspaceId) {
        publicProfileAcceptingRequests.value = await publicPublishing.setAcceptingRequests(selectedArtistId.value, workspaceId, false)
        publicProfileWorkspaceId.value = workspaceId
      }
    }
    publicProfilePublished.value = await publicPublishing.setPublicProfileEnabled(selectedArtistId.value, enabled)
    if (!publicProfilePublished.value) publicProfileAcceptingRequests.value = false
    publicPublishingMessage.value = preferences.locale.value === 'es'
      ? (enabled ? 'Perfil público activado.' : 'Perfil público desactivado.')
      : (enabled ? 'Public profile enabled.' : 'Public profile disabled.')
  } catch (error: any) {
    publicPublishingMessage.value = error?.message || (preferences.locale.value === 'es'
      ? 'No se pudo actualizar el perfil público.'
      : 'The public profile could not be updated.')
    await loadPublicPublishingState()
  } finally {
    publicPublishingSaving.value = false
  }
}

async function updatePublicAcceptingRequests(enabled: boolean) {
  if (!selectedArtistId.value || !canEditSelectedArtist.value || (enabled && !publicProfilePublished.value)) return
  publicPublishingSaving.value = true
  publicPublishingMessage.value = ''
  try {
    let workspaceId = publicProfileWorkspaceId.value || bookingCoreWorkspaceId.value
    if (!workspaceId) {
      await ensureBookingCoreWorkspace()
      workspaceId = bookingCoreWorkspaceId.value
    }
    if (!workspaceId) throw new Error('booking_workspace_required')
    publicProfileAcceptingRequests.value = await publicPublishing.setAcceptingRequests(selectedArtistId.value, workspaceId, enabled)
    publicProfileWorkspaceId.value = workspaceId
    publicPublishingMessage.value = preferences.locale.value === 'es'
      ? (enabled ? 'Solicitudes de booking abiertas.' : 'Solicitudes de booking cerradas.')
      : (enabled ? 'Booking enquiries opened.' : 'Booking enquiries closed.')
  } catch (error: any) {
    publicPublishingMessage.value = error?.message || (preferences.locale.value === 'es'
      ? 'No se pudo actualizar la recepción de bookings.'
      : 'Booking enquiry availability could not be updated.')
    await loadPublicPublishingState()
  } finally {
    publicPublishingSaving.value = false
  }
}

""" + save_anchor
workspace = replace_once(workspace, save_anchor, public_actions, 'public publishing actions')

old_heading_button = """            <button class="profile-preview-button" type="button" @click="profilePreviewOpen = true"><span>{{ copy.previewProfile }}</span><svg class="external-link-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 17 17 7M9 7h8v8"/></svg></button>
"""
new_heading_button = """            <button v-if="!canEditSelectedArtist" class="profile-preview-button" type="button" @click="profilePreviewOpen = true"><span>{{ copy.previewProfile }}</span><svg class="external-link-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 17 17 7M9 7h8v8"/></svg></button>
"""
workspace = replace_once(workspace, old_heading_button, new_heading_button, 'profile heading preview button')

profile_heading_close = """        </div>

        <aside v-if="profileWelcome" class="profile-welcome">
"""
profile_controls = """        </div>

        <PublicProfilePublishingControls
          v-if="selectedArtist && canEditSelectedArtist"
          :slug="selectedArtist.slug"
          :published="publicProfilePublished"
          :accepting-requests="publicProfileAcceptingRequests"
          :saving="publicPublishingSaving"
          :locale="preferences.locale.value"
          @preview="profilePreviewOpen = true"
          @update-published="updatePublicProfilePublished"
          @update-accepting-requests="updatePublicAcceptingRequests"
        />
        <p v-if="publicPublishingMessage" class="public-publishing-message">{{ publicPublishingMessage }}</p>

        <aside v-if="profileWelcome" class="profile-welcome">
"""
workspace = replace_once(workspace, profile_heading_close, profile_controls, 'public publishing controls surface')

old_preview_modal = """    <div v-if="profilePreviewOpen" class="profile-preview-backdrop" @click.self="profilePreviewOpen = false">
      <article class="profile-preview" role="dialog" aria-modal="true" aria-labelledby="profile-preview-title">
        <header>
          <p>{{ copy.previewPrivate }}</p>
          <button type="button" :aria-label="copy.previewClose" @click="profilePreviewOpen = false">×</button>
        </header>
        <section class="profile-preview-hero">
          <img :src="profileCoverSource" alt="" :style="{ objectPosition: `50% ${profileForm.coverPositionY}%` }">
          <div class="profile-preview-hero-shade" />
          <p v-if="profilePreviewLocation">{{ profilePreviewLocation }}</p>
          <h2 id="profile-preview-title">{{ profileForm.stageName || selectedArtist?.stage_name }}</h2>
          <div v-if="profilePreviewGenres.length" class="profile-preview-chips"><span v-for="genre in profilePreviewGenres" :key="genre">{{ genre }}</span></div>
          <p v-else class="profile-preview-empty">{{ copy.previewGenresEmpty }}</p>
        </section>
        <section class="profile-preview-body">
          <p class="profile-preview-bio">{{ profileForm.bio || copy.previewBioEmpty }}</p>
          <div v-if="profilePreviewFormats.length" class="profile-preview-block"><span>{{ copy.previewFormats }}</span><strong>{{ profilePreviewFormats.join(' · ') }}</strong></div>
          <div v-if="profilePreviewLinks.length" class="profile-preview-block"><span>{{ copy.previewLinks }}</span><nav><a v-for="link in profilePreviewLinks" :key="link.label" :href="link.url" target="_blank" rel="noopener noreferrer"><span>{{ link.label }}</span><svg class="external-link-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 17 17 7M9 7h8v8"/></svg></a></nav></div>
        </section>
      </article>
    </div>
"""
new_preview_modal = """    <div v-if="profilePreviewOpen" class="profile-preview-backdrop" @click.self="profilePreviewOpen = false">
      <article class="profile-preview" role="dialog" aria-modal="true" aria-labelledby="profile-preview-title">
        <header>
          <p id="profile-preview-title">{{ copy.previewPrivate }}</p>
          <button type="button" :aria-label="copy.previewClose" @click="profilePreviewOpen = false">×</button>
        </header>
        <PublicArtistProfile
          :profile="publicProfilePreview"
          :locale="preferences.locale.value"
          preview
        />
      </article>
    </div>
"""
workspace = replace_once(workspace, old_preview_modal, new_preview_modal, 'shared public profile preview modal')

workspace = replace_once(
    workspace,
    ".profile-savebar .primary-button { min-width: 180px; padding: 0 18px; }\n.profile-preview-backdrop",
    ".profile-savebar .primary-button { min-width: 180px; padding: 0 18px; }\n.public-publishing-message { margin: -12px 0 24px; color: var(--cue-muted); font-size: 12px; }\n.profile-preview-backdrop",
    'public publishing message style'
)
workspace = replace_once(
    workspace,
    ".profile-preview { width: min(980px, 100%); max-height: calc(100dvh - 48px);",
    ".profile-preview { width: min(1280px, 100%); max-height: calc(100dvh - 48px);",
    'public preview width'
)

controls = replace_once(
    controls,
    "const publicUrl = computed(() => `https://cuebooker.com/${props.slug}`)",
    "const publicUrl = computed(() => import.meta.client\n  ? `${window.location.origin}/${props.slug}`\n  : `https://cuebooker.com/${props.slug}`)",
    'environment-aware public profile URL'
)

workspace_path.write_text(workspace)
controls_path.write_text(controls)
print('Public profile workspace integration applied successfully.')
