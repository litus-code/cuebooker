# CUE Passport V1

Updated: 24 September 2026  
Status: CODE COMPLETE · BACKEND APPLY + FINAL VISUAL VALIDATION PENDING

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
