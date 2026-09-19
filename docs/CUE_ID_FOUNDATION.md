# CUE ID Foundation

Updated: 19 September 2026  
Branch: `feature/app-visual-system`  
Status: APPROVED FOUNDATION — IMPLEMENTATION NOT STARTED

Read together with:

- `docs/CUE_ID_PRODUCT_VISION.md`
- `docs/CUE_ID_PERFORMANCE.md`
- `docs/ARTIST_PROFILE_VISUALS.md`
- `docs/APP_VISUAL_SYSTEM.md`
- `docs/BOOKING_CORE_PRODUCT_VISION.md`

## 1. Purpose

CUE ID is the visual identity layer of the existing Artist Profile.

It is not:

- a second artist profile;
- a popularity score;
- a game progression system;
- a mandatory onboarding step;
- a replacement for photography or artwork;
- a separate product disconnected from booking activity.

The first implementation must prove one thing:

> A working DJ can create a distinctive, credible Cuebooker visual presence without the experience becoming an avatar game or slowing down the operational product.

Artist Profile remains the source of truth.

## 2. Product hierarchy

```text
ARTIST PROFILE
├── Identity
├── Music
├── Booking
├── Media
├── Visual presentation
│   ├── Photo
│   ├── Artwork
│   └── CUE ID
├── future CUE PASSPORT
└── Preview / Share

Contextual layer:
└── future CUE SIGNAL
```

CUE ID reads identity/music context from Artist Profile. It must not ask the artist to enter those fields again.

PASSPORT and SIGNAL are architecturally considered now but are not part of the first CUE ID implementation.

## 3. V1 product promise

V1 should let the artist:

1. open Artist Profile;
2. choose CUE ID as a visual presentation option;
3. start from one high-quality humanoid art direction;
4. make a bounded set of visual choices;
5. immediately see a credible preview;
6. save those choices;
7. return later without losing them;
8. see a static representation before or without WebGL;
9. switch back to Photo or Artwork at any time;
10. use Cuebooker normally even if CUE ID is never configured.

The user should feel they are shaping a professional visual identity, not dressing a game character.

## 4. V1 visual scope

Start with one family:

```text
CLUB MINIMAL
```

Art direction:

- recognisably human;
- editorial/sculptural rather than photorealistic;
- club wardrobe rather than fantasy armour;
- dark, material, tactile surfaces;
- restrained Cuebooker lime/red signals;
- credible beside real artist photography;
- no forced cyberpunk aesthetic.

Initial controls should remain deliberately small.

### Base

Support three neutral presentation bases where the asset architecture allows it:

- masculine;
- feminine;
- androgynous / neutral.

These are visual base choices, not restrictions on clothes/accessories.

### Build

Initial bounded presets:

- slim;
- regular;
- strong.

No detailed body sliders in V1.

### Outfit

Target 3–4 options:

- sleeveless / tank;
- T-shirt;
- hoodie;
- jacket / bomber.

### Accessories

Target 3–4 plus none:

- headphones;
- cap;
- glasses;
- hood / mask only if the treatment remains culturally credible.

### Pose

Target:

- neutral;
- relaxed;
- focused;
- editorial.

### Finish

Keep material secondary:

- matte;
- satin;
- optional restrained chrome after performance/art-direction validation.

The number of options is intentionally limited. Quality and coherence matter more than catalogue size.

## 5. Presentation modes

Artist Profile owns one selected visual mode:

```text
photo
artwork
cue_id
```

Rules:

- changing mode does not delete the other assets/configuration;
- the artist can switch back without rebuilding CUE ID;
- CUE ID being incomplete must never prevent Photo/Artwork from working;
- public rendering always follows artist visibility/publication settings;
- private editing configuration is never exposed merely because the public profile exists.

## 6. Proposed persisted contract

Do not persist renderer implementation details.

Persist semantic choices that can survive future model/renderer changes.

Conceptual V1 shape:

```ts
cue_id_config: {
  schema_version: 1
  enabled: boolean
  family: 'club_minimal'
  base: 'masculine' | 'feminine' | 'neutral'
  build: 'slim' | 'regular' | 'strong'
  outfit: string
  accessory: string | null
  pose: string
  material: string
  accent: string | null
  updated_at: string
}
```

The persisted contract should not contain:

- raw Three.js scene graphs;
- node UUIDs;
- camera matrices;
- transient animation state;
- renderer-specific material JSON;
- arbitrary asset URLs supplied by the browser.

Asset identifiers resolve through an application-owned catalogue.

## 7. Storage ownership

Recommended initial ownership:

- CUE ID config belongs to the Artist;
- write access follows the existing artist-management permission boundary;
- viewers/read-only editors cannot mutate config;
- rendered static fallback/export belongs under the existing artist media ownership model or a dedicated private artist-owned path;
- no public bucket should be introduced solely for convenience.

Public profile exposure should use an intentional public projection or signed/rendered asset strategy, consistent with existing Artist Profile publication rules.

## 8. Static representation is first-class

The static representation is not merely an error screenshot.

It serves:

- immediate Artist Profile rendering;
- mobile/low-power fallback;
- WebGL failure fallback;
- public profile rendering where interactive 3D is unnecessary;
- future social/share export foundation.

Target formats:

- WebP for normal application delivery;
- PNG where transparency is required.

A config save and a static-render generation may initially be separate operations if necessary, but stale render state must be visible/handled rather than silently presenting the wrong identity.

## 9. Renderer boundary

Target component architecture:

```text
ArtistProfileVisualMode
└── CueIdStage.vue
    ├── CueIdStaticPreview.vue
    ├── lazy CueIdScene.client.vue
    └── CueIdControls.vue
```

Responsibilities:

### CueIdStage

- product state;
- fallback;
- loading/error/degraded state;
- renderer activation boundary.

### CueIdScene.client

- Three/Tres integration only;
- asset composition;
- camera/lights;
- pose/idle rendering;
- no booking/profile persistence logic.

### CueIdControls

- semantic config choices;
- accessible keyboard/touch controls;
- no direct mutation of Three object internals.

### Artist Profile application layer

- load/save semantic config;
- authorization;
- dirty/saved state;
- selected visual mode.

Three.js must remain replaceable without migrating product meaning.

## 10. Asset catalogue contract

The app should own a typed catalogue mapping semantic choices to compatible assets.

Conceptually:

```ts
family -> base -> compatible builds/outfits/accessories/poses/materials
```

The catalogue is responsible for:

- asset path;
- compatibility;
- optional thumbnail/static preview;
- download weight metadata;
- capability/degradation flags.

Do not let components assemble arbitrary filenames from user-selected strings.

## 11. Public/private boundary

Private:

- unpublished CUE ID config;
- unfinished drafts;
- renderer/debug metadata;
- source/private media;
- internal artist profile fields;
- booking/commercial data.

Potentially public only when profile/presentation settings allow:

- selected static CUE ID representation;
- selected presentation mode;
- public artist identity already permitted by Artist Profile.

CUE ID must never cause private fee, booking, contact, travel, rider, relationship or calendar data to become public.

## 12. Relationship to PASSPORT

PASSPORT remains derived from normalized professional history.

CUE ID should only provide a visual identity that PASSPORT may later use.

Do not store PASSPORT history inside `cue_id_config`.

Future conceptual composition:

```text
Artist identity + selected CUE ID
             +
Booking-derived trajectory
             ↓
      PASSPORT presentation
```

A future PASSPORT render may use the same visual identity, but its historical data remains owned by the booking/profile domain.

## 13. Relationship to SIGNAL

SIGNAL is future contextual state derived from meaningful activity.

CUE ID can eventually display a subtle SIGNAL treatment, but:

- SIGNAL does not unlock outfits;
- SIGNAL does not make one artist visually superior;
- no followers/likes/logins/streaks feed it;
- CUE ID configuration must remain fully usable without SIGNAL.

Do not add SIGNAL fields to the V1 CUE ID persistence unless a real implementation requires them.

## 14. Accessibility

V1 must support:

- full configuration without drag-only gestures;
- keyboard-operable controls;
- visible focus;
- readable labels instead of icon-only ambiguity;
- reduced motion;
- static fallback carrying the same essential identity;
- no important meaning encoded only through material colour/glow;
- touch targets consistent with the current 44px mobile interaction baseline.

Interactive 3D itself does not need to be the sole accessible representation. The semantic controls and static representation are the accessible product contract.

## 15. Performance gate

`docs/CUE_ID_PERFORMANCE.md` remains authoritative.

V1 must preserve:

```text
profile HTML/data first
-> static visual
-> lazy renderer near viewport
-> base GLB
-> optional selected assets
```

The renderer must not enter:

- Booking initial bundles;
- Calendar;
- Activity;
- CUE Capture;
- public booking form critical path.

Failure means fallback, never broken Artist Profile.

## 16. V1 data migration strategy

Do not pre-create every future field.

Preferred first migration:

- one versioned CUE ID config field/table owned by artist;
- selected visual mode if it does not already have an appropriate home;
- static render path/status only if the first implementation actually generates persisted renders;
- constraints for allowed schema version / ownership;
- existing artist RLS helpers reused where possible.

Before DDL:

1. inspect the exact current Artist Profile schema;
2. decide JSONB vs normalized first-slice storage based on existing conventions/query needs;
3. define update command/policy;
4. validate cross-tenant isolation;
5. define migration rollback/forward compatibility.

Do not add PASSPORT/SIGNAL schema in this migration.

## 17. V1 editor UX

The editor should feel closer to an art-directed identity studio than a character creator.

Recommended composition:

```text
CUE ID
[ large visual stage ]

PRESENCE
Base · Build

LOOK
Outfit · Accessory

ATTITUDE
Pose

TREATMENT
Material / accent

[ Save identity ]
```

Rules:

- visual stage remains dominant;
- controls are bounded choices, not dense game inventories;
- show one decision group at a time on mobile if necessary;
- no coins, locked items, levels, rarity, XP or progress rewards;
- preview changes can be instant/local;
- persistence remains an explicit understandable save contract consistent with Artist Profile.

## 18. Error/degraded states

Required states:

- static only / renderer not loaded;
- loading 3D;
- interactive 3D ready;
- reduced-quality mode;
- WebGL unavailable;
- model/asset load failed;
- incompatible optional asset;
- unsaved changes;
- static render out of date, if persisted renders are introduced.

None of these states may block the rest of Artist Profile.

## 19. Analytics contract

Measure product usefulness, not vanity.

Potential events:

```text
cue_id_opened
cue_id_mode_selected
cue_id_config_saved
cue_id_renderer_ready
cue_id_renderer_failed
cue_id_static_fallback_used
cue_id_share_exported   // later
```

Do not send body choice, gender/base choice or other potentially sensitive appearance configuration to generic analytics unless there is a specific justified product need.

No raw config payload should be sent to GA4.

## 20. V1 validation cohort

Before expanding the catalogue, validate qualitative credibility with a deliberately mixed cohort:

- emerging working DJ;
- established DJ;
- manager/agency perspective;
- different electronic-music scenes/generations.

Key questions:

- Does this feel professional?
- Does it feel like Cuebooker rather than a game?
- Would you use it instead of/in addition to a photo?
- Does any choice feel stereotyped by genre/gender?
- Is the editor understandable without explanation?
- Would you be comfortable seeing this on a public artist profile?

Do not use adoption percentage alone to judge cultural credibility.

## 21. Explicit V1 non-goals

Do not build yet:

- photoreal face scanning;
- user-uploaded 3D meshes;
- marketplace for outfits;
- unlockable cosmetics;
- avatar economy;
- rarity system;
- AI-generated personality;
- automatic genre-to-outfit mapping;
- PASSPORT timeline;
- SIGNAL progression;
- animated social exports;
- multiplayer/network representation;
- full Sims-like body editor.

## 22. Implementation order

### Block 0 — foundation

- this product/architecture contract;
- inspect current Artist Profile schema/components;
- inspect current `/cue-id` visual lab;
- decide first persistence shape;
- define typed config/catalogue contract.

### Block 1 — editor shell without real 3D dependency

- integrate CUE ID entry inside Artist Profile;
- presentation mode selector;
- CueIdStage with static placeholder/fallback;
- semantic controls;
- local config state;
- desktop/mobile composition;
- Dark/Light + ES/EN.

### Block 2 — persistence

- migration/RLS;
- load/save config;
- schema version;
- saved/dirty/error states;
- cross-tenant validation.

### Block 3 — first credible humanoid

- select/create licensed/art-directed humanoid base;
- integrate one GLB family;
- base/build/outfit/accessory/pose subset;
- lazy client renderer;
- static fallback stays visible until ready.

### Block 4 — static render/export foundation

- stable static representation;
- public-profile compatibility;
- performance degradation path;
- future share-output compatibility.

### Block 5 — validation and refinement

- real-device desktop/mobile performance;
- reduced-motion/WebGL failure tests;
- cohort review;
- refine art direction;
- expand catalogue only where evidence supports it.

## 23. Definition of done for the first CUE ID vertical slice

The first real slice is complete when:

1. CUE ID lives inside Artist Profile, not as a parallel profile;
2. Photo/Artwork remain valid alternatives;
3. one versioned semantic config persists safely;
4. one credible humanoid family renders;
5. at least base/build/outfit/pose can be changed;
6. config survives reload;
7. unauthorized users cannot mutate it;
8. static fallback appears immediately;
9. WebGL failure does not break Profile;
10. mobile is usable;
11. Dark/Light and ES/EN are verified;
12. renderer JS/assets are lazy and measured;
13. no booking route regresses;
14. `docs/HANDOFF.md` records exact staging/validation state.

## 24. Immediate next technical task

Do not choose a 3D library asset yet.

First inspect the real current implementation:

```text
Artist Profile schema
Artist Profile editor + preview
/cue-id visual lab
current visual mode/media state
existing artist-media storage/RLS
```

Then define the smallest persistence contract that can support the editor shell and one future humanoid family without binding product data to Three.js.


## First humanoid asset acceptance contract

The first real humanoid must satisfy both visual credibility and runtime constraints.

### Visual direction

The first accepted base must feel:

- recognisably human;
- sculptural/editorial rather than game-avatar;
- credible next to professional artist photography;
- grounded in club culture without genre costume;
- neutral enough to support multiple electronic scenes;
- expressive through silhouette, pose, material and styling rather than exaggerated facial detail.

Reject assets that read as:

- Sims/Bitmoji;
- metaverse mascot;
- superhero/fantasy armor;
- generic stock mannequin;
- cyberpunk cliché by default;
- hypersexualized body template;
- obvious male/female stereotype beyond the selected base;
- fashion render disconnected from working DJ culture.

### Geometry and materials

The first base asset should:

- use one coherent humanoid body;
- keep deformation/pose structure simple;
- avoid unnecessary facial topology;
- reuse materials across body parts;
- avoid transparent hair/fabric layers unless measurement proves they are affordable;
- prefer baked/material-driven depth over dynamic lighting complexity;
- use physically plausible but restrained materials.

### V1 performance gate

Before admission to `CUE_ID_ASSETS`, record:

```text
compressed GLB bytes
triangle count
material count
texture count
largest texture dimension
supported device tiers
fallback image path
```

Current base budget:

```text
compressed GLB <= 1,000,000 bytes
triangles <= 35,000
materials <= 4
textures <= 6
largest texture dimension <= 2048
```

Outfit and accessory budgets are stricter and live in:

```text
app/domain/cueIdAssets.ts
```

### Mobile rule

A visually stronger model that exceeds the Android/mobile budget is not accepted as the default base.

If an art direction requires a higher-cost asset, it must be an optional Tier A enhancement with a Tier B-safe representation, never the only identity asset.

### Catalogue rule

`CUE_ID_ASSETS` remains intentionally empty until a real art-directed asset passes review.

Do not add placeholder GLBs to make implementation appear further along than it is.
