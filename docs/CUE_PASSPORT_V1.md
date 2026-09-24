# CUE Passport V1

Updated: 24 September 2026  
Status: CODE COMPLETE · FRONTEND PREVIEW VALIDATED · BACKEND APPLY + DEVICE QA PENDING

## Product role

CUE Passport is the trajectory layer generated from real artist activity.

It is not a popularity score, game leaderboard or manually fabricated career history.

Primary hierarchy:

```text
WORLD
→ COUNTRY
→ CITY
→ VENUE
→ BOOKING / EVENT
→ MEDIA
```

## V1 surfaces

### Constellation

The map-like 2D constellation is the primary exploratory surface.

It must:

- use confirmed Cuebooker bookings;
- allow country selection;
- represent cities as nodes;
- allow drag and zoom;
- show city context without forcing navigation away from the constellation;
- remain lightweight inside Workspace.

Selecting a city shows contextual information near the node:

- city;
- venues;
- event dates;
- linked event media when available.

### Stickers

Stickers are collectible visual representations of real milestones.

Initial families:

- city stamp;
- venue flight-case sticker;
- touring tag;
- booking / count technical plate.

Stickers are a collection surface, not permanent clutter on the constellation.

### Timeline

Timeline presents earned trajectory milestones chronologically.

No fake history should be rendered to make the interface look fuller.

## Media

Passport Media is linked at booking level:

```text
BOOKING → MEDIA
```

Supported media types:

- image;
- video;
- reel.

Supported states:

- suggested;
- linked;
- hidden.

The matching engine may suggest media using date, city and venue context. A suggestion is not treated as confirmed truth.

Automatic Instagram ingestion is deferred. The domain and persistence layer are source-agnostic so Instagram can become one authorized source later.

## Public Profile

The real artist profile includes a summarized editorial Passport surface.

Rules:

- Workspace Passport remains the management/exploration surface.
- Public Profile shows only the summarized trajectory.
- The artist can hide or show the Passport summary without deleting Passport history.
- Public visibility is persisted through `artists.passport_public_enabled`.
- Hiding Passport does not stop trajectory generation from confirmed activity.
- CUE ID and CUE Passport remain independent profile modules.
- Public milestone selection supports automatic mode or an explicit selection of up to three unlocked milestones.
- Public media is opt-in only and supports up to six linked items.
- Public media IDs are validated against confirmed bookings for the artist before they are returned.
- Event Media remains classified as Artist Pro presentation; entitlement enforcement is handled in the commercial UI phase.

## Commercial classification

Free:

- basic Passport;
- basic constellation;
- basic timeline;
- basic stickers.

Artist Pro:

- advanced Passport;
- event media;
- exports / recaps;
- richer historical presentation;
- advanced presentation/customization.

Agency inherits Artist Pro Passport capabilities where relevant.

## V1 technical constraints

- Workspace Passport stays 2D.
- Do not load ThreeJS for Booking, Calendar, Activity or general workspace navigation.
- Future 3D Passport should be dynamically loaded only inside an explicit Passport experience.
- Mobile/reduced/static representations must remain first-class fallbacks.
- Public profile remains static-first.
- Public profile includes a summarized Passport surface built from real confirmed activity.
- Final V1 validation includes mobile tooltip scrolling, linked-media interaction, pointer-capture recovery, empty states and dense city/venue cases.


## Workspace navigation

CUE Passport is now a first-class Workspace view and no longer lives inside CUE ID.

Rules:

- CUE ID and CUE Passport have separate navigation entries and separate responsibilities.
- Profile shows a summarized Passport block.
- `Open Passport` enters the dedicated Passport workspace.
- `Public settings` opens the Profile Passport publication editor.
- Leaving Profile clears any open Profile editor state so hidden overlays cannot keep body scroll locked.
- Passport empty state points back to Booking Core and never renders fabricated trajectory data.

Frontend preview validation:

- HEAD `1316cbe7ef4d77972365c611e6fcfe3b7ba79a15`;
- GitHub Actions run `36031829227`;
- `Generate preview build` passed;
- PR preview deployment passed;
- this does not apply the pending Supabase migrations or Edge Function update.


## Staging backend applied on 24 Sep 2026

Applied only to `cuebooker-staging` (`lycprjeuuynfzwskycwv`):

- `passport_media` table, enums, indexes and RLS policies;
- `artists.passport_public_enabled`;
- `artists.passport_public_milestone_ids`;
- `artists.passport_public_media_ids`;
- creator FK index for `passport_media.created_by`;
- `get-public-artist-profile` Edge Function version 17 with Passport summary/media support.

Validation:

- RLS is enabled on `passport_media`;
- select is limited to workspace members;
- insert/update/delete require workspace edit permission;
- Artist update policy remains `private.can_manage_artist(id)`;
- Supabase security advisor shows no new Passport-specific warning;
- the new unindexed-FK warning was removed after adding `passport_media_created_by_idx`;
- staging has a published profile with a confirmed booking that resolves to 1 city and 1 venue.

The HTTP response itself was not invoked from this session because its network runtime cannot reach the staging hostname. Do not describe the public endpoint as fully smoke-tested until it is opened from the real PR preview/device.

Production was not touched.
