# CueBooker Artist Profile system

Updated: 16 September 2026
Status: approved product direction for staged validation

## Product hierarchy

CueBooker has one Artist Profile. It is the artist's home inside the product and the single source of truth for identity, music, presentation, booking context and trajectory.

CUE ID, CUE SIGNAL and CUE PASSPORT are layers of Artist Profile. They must never become duplicate profiles or force the artist to enter the same information twice.

```text
ARTIST PROFILE
├── Identity
│   ├── artist name
│   ├── biography
│   ├── location
│   ├── image / cover
│   └── years active
├── Music
│   ├── styles
│   ├── substyles
│   ├── sound descriptors
│   └── performance formats
├── CUE ID
│   ├── photo / artwork / visual identity
│   ├── optional 3D representation
│   └── visual customisation
├── Booking
│   ├── private commercial terms
│   ├── travel
│   └── riders / technical information
├── Media
│   └── listening and professional links
├── CUE PASSPORT
│   └── trajectory derived from history and bookings
└── Preview / Share
    └── public and social outputs with privacy controls
```

CUE SIGNAL is a small contextual layer shown where useful. Share is an action, not a separate section.

The `/cue-id` route remains a non-indexed visual laboratory while the identity direction is being designed. It is not intended to become a second destination in final navigation.

## Purpose

CueBooker starts as a booking workflow for DJs and managers. Artist Profile extends that workflow into a place where the artist can represent and preserve professional identity and history.

The experience must feel native to club culture. It should respect electronic-music history, the work behind a career and the differences between scenes. It must avoid caricature, empty gamification and social-media vanity metrics.

The product should feel credible to an artist starting today and to someone with decades of club history.

## Product principles

CueBooker does not rank artistic quality and does not decide who is a "real DJ". It documents professional activity and lets the artist decide how to represent it.

The product can value real signals such as booking requests, confirmed dates, repeat promoters, venues, cities, residencies, years active, performance formats and artist-provided music or biography.

Follower counts, likes, reach and similar metrics must never define progression, status or artistic legitimacy inside CueBooker. They can exist later as optional profile data only if artists need them for practical reasons.

Every feature in Artist Profile should pass these checks:

1. Would the language feel credible to an artist with deep club culture?
2. Does it respect musical history and scene context?
3. Is the artist represented rather than scored?
4. Does progression come from meaningful activity rather than app usage?
5. Can an established artist use it without feeling that their career has become a game?
6. Can a new artist participate without being treated as lesser?
7. Does the visual language avoid generic influencer and videogame aesthetics?

The visual reference should be closer to record sleeves, club artwork, editorial music design, industrial objects, material, light and typography than to cartoon character customisation.

## CUE ID

CUE ID is the visual identity layer of Artist Profile.

It uses profile data already supplied by the artist, including name, location, music identity and performance format. The artist then adds visual choices. No identity field should be duplicated purely for CUE ID.

CUE ID should eventually support three broad presentation modes:

- photography;
- artwork;
- CueBooker visual identity, including the optional modular 3D representation.

The 3D representation is not mandatory and must never become a mark of status. Music data may suggest an initial visual direction, but the artist controls the final result. The system must not infer personality, quality or authenticity from appearance or genre.

### 3D direction

The first 3D family should be art-directed, sculptural and gender-flexible. Avoid realistic face reconstruction in the initial release.

Technical direction:

- Three.js through a Vue/Nuxt integration such as TresJS;
- GLB/glTF assets;
- modular body, head, outfit, accessory and material parts;
- a small idle-animation set;
- lazy loading;
- static WebP/PNG fallback for low-power devices and social exports;
- no 3D dependency in booking flows.

Temporary art-direction families for exploration can include Void, Chrome, Translucent and Signal. These are visual families, not music categories.

### Performance contract

Performance is part of the CUE ID product definition, not a later optimisation task.

The interactive 3D renderer will live behind a client-only boundary and lazy hydration. Artist Profile renders its content and a lightweight static CUE ID fallback first. Three.js/TresJS and the base model load only when the 3D stage approaches the viewport. Optional accessories and visual treatments load on demand.

The scene must pause or reduce work when it is outside the viewport or the document is hidden. Device pixel ratio, effects, animation, shadows and asset quality can adapt to device capability. Low-power devices and WebGL failures fall back to a static representation without affecting Profile, Booking or Passport.

The first real 3D implementation requires before/after measurement of JavaScript transfer, model and texture payload, LCP, CLS, interaction responsiveness, main-thread work and representative mobile behaviour. A visual feature that does not justify its runtime cost should not ship.

The detailed architecture, budgets, degradation path and failure contract live in `docs/CUE_ID_PERFORMANCE.md`.

## CUE SIGNAL

CUE SIGNAL is a discreet indication of meaningful CueBooker activity. It is secondary to Artist Profile and booking operations.

Initial working states:

- SIGNAL 00, Created
- SIGNAL 01, Identified
- SIGNAL 02, Connected
- SIGNAL 03, Confirmed
- SIGNAL 04, Active

Naming remains provisional.

Opening the app, clicking buttons, sharing posts or maintaining daily streaks must not increase SIGNAL. It does not represent talent, popularity or status in the scene.

## CUE PASSPORT

CUE PASSPORT is the trajectory section of Artist Profile.

It can contain, when the artist chooses to include or expose them:

- years and career milestones;
- cities;
- venues;
- residencies;
- booking milestones;
- recurring professional relationships;
- selected statistics derived from CueBooker activity.

CueBooker should derive future Passport entries from normalized booking data instead of copying booking history into a second store. The artist may also add meaningful history from before CueBooker.

Private commercial information, contacts, exact fees, negotiations and internal notes never become public Passport data by default.

## Sharing

Sharing belongs to Profile Preview and Passport. It is not a standalone module.

Planned outputs:

- Instagram Story, visual-first;
- square artist card;
- restrained LinkedIn presentation;
- direct PNG/WebP export;
- later motion output where useful.

Every export respects visibility controls. CueBooker branding remains present but subordinate to the artist.

## Music taxonomy

Genre taxonomy requires editorial care. CueBooker must not invent fashionable labels or collapse scenes into vague categories.

The data model separates three concepts.

### Main styles

Broad musical families for navigation and discovery. Initial candidates for research include Techno, House, Electro, Trance, Breaks, Drum & Bass, Ambient and Experimental.

### Substyles

More precise artist-selected terms. Techno candidates for review with scene practitioners include Detroit Techno, Dub Techno, Hypnotic Techno, Acid Techno, Industrial Techno, Hard Techno, Schranz, Hardgroove and Raw Techno.

Terms such as Peak Time require editorial review because platform taxonomies, record-store categories and scene usage do not always mean the same thing.

### Sound descriptors

Descriptors describe character rather than genre. Examples include dark, deep, hypnotic, raw, driving, groovy, stripped-back, mechanical and psychedelic.

These values stay separate from genre and subgenre data.

## Onboarding

Artist Profile starts during onboarding but remains optional beyond the account information needed to create the workspace.

Target flow:

1. Create account identity.
2. Choose DJ/artist or agency.
3. Enter artist or agency basics.
4. DJ accounts see an Artist Profile / CUE ID preview.
5. The artist can continue or choose "Do it later".
6. Skipping never blocks workspace access.
7. The profile keeps a visible completion state and a persistent entry point.

The user should understand that they are building one profile progressively. CueBooker should never ask them to "complete the profile" and then separately "complete CUE ID" using duplicated information.

## Data model direction

Bookings, venues, cities and promoter relationships remain normalized product data. Artist Profile and Passport derive presentation from those records where possible.

Conceptual shape:

```ts
artist_profile: {
  identity: {...}
  music: {
    main_styles: string[]
    substyles: string[]
    sound_descriptors: string[]
    performance_formats: string[]
  }
  visual: {
    mode: 'photo' | 'artwork' | 'cue_id'
  }
}

cue_id: {
  enabled: boolean
  visual_family: string | null
  body: string | null
  head: string | null
  outfit: string | null
  accessory: string | null
  material: string | null
  accent: string | null
}

cue_signal: {
  state: string
  milestones: string[]
}

cue_passport: {
  visibility: 'private' | 'selected' | 'public'
}
```

Do not migrate every future field now. Add persistence as each vertical slice becomes real.

## Delivery plan

### Phase 0, current visual foundation

- document product hierarchy and cultural constraints;
- keep `/cue-id` as a non-indexed design laboratory;
- show an Artist Profile / CUE ID teaser during DJ onboarding;
- keep CUE ID optional;
- preserve existing booking flows.

### Phase 1, unified Artist Profile

- make Artist Profile the single product surface;
- integrate CUE ID entry inside its identity area;
- separate music styles, substyles and descriptors after editorial review;
- expose profile completion from Overview;
- retain "Do it later" throughout;
- keep Share as an action from Preview.

### Phase 2, first 3D identity

- introduce client-only, lazy-hydrated TresJS/Three.js;
- ship one art-directed modular family;
- allow photography, artwork or CUE ID as presentation modes;
- create static fallback output;
- load optional assets only on demand;
- validate desktop and mobile performance against the documented performance contract;
- test with artists from different generations and electronic scenes.

### Phase 3, SIGNAL and first PASSPORT

- derive milestones from real booking activity;
- add private Passport timeline;
- support selected previous history;
- let the artist choose what becomes shareable;
- avoid rankings and follower-based progression.

### Phase 4, share outputs

- Instagram Story export;
- square artist card;
- LinkedIn presentation;
- public-profile link and optional QR;
- visibility controls for every exported field.

### Phase 5, richer trajectory

Only after Passport has demonstrated value, explore collectible visual treatments such as flight-case stamps, city marks or venue history. The working CUE CASE concept remains deferred until then and is not a first-class product area today.

### Phase 6, network intelligence

Only after enough real booking data exists, explore private relationship insights between artists, promoters and venues and opt-in discovery. Hidden relationships must never become public endorsements without consent.

## Success criteria

Early validation should measure useful behaviour rather than vanity engagement:

- Artist Profile completion;
- percentage of DJs who explore CUE ID;
- percentage who choose a visual representation;
- Passport usage once real booking history exists;
- share-card generation;
- public-profile visits from shared outputs;
- qualitative feedback from working DJs and promoters;
- whether experienced artists describe the system as credible and respectful.

Daily active usage is not the primary success metric for a booking tool. CueBooker should be useful when professional activity happens rather than manufacture reasons to open the app every day.

## Explicit non-goals

Do not build global DJ rankings, follower-based levels, daily login streaks, XP for clicks, popularity scores, automatic claims that one artist is more professional or authentic than another, cartoon customisation as the default visual direction, unreviewed genre taxonomy or public commercial history without explicit artist control.
