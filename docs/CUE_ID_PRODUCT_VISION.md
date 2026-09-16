# CueBooker identity system: CUE ID, SIGNAL, PASSPORT and CASE

Updated: 16 September 2026
Status: product direction approved for staged validation

## Purpose

CueBooker starts as a booking workflow for DJs and managers, but the long-term product should also preserve the artist's professional history and identity.

The identity layer must feel native to club culture. It must respect the history of electronic music, the craft of DJing, the work behind a career and the differences between scenes. It must avoid caricature, empty gamification and social-media vanity metrics.

The product should be able to feel credible to a new artist and to someone with decades of club history.

## Product principle

CueBooker does not rank artistic quality and does not decide who is a "real DJ".

CueBooker documents professional activity and lets the artist decide how to represent it.

The system values signals that come from real activity:

- booking requests;
- confirmed bookings;
- repeat promoters;
- venues;
- cities;
- years active;
- residencies;
- performance formats;
- artist-provided biography, music and professional links.

Follower counts, likes, reach and similar social metrics must never define progression, status or artistic legitimacy inside CueBooker. They may exist later as optional profile data if users need them, but they are not a prestige mechanic.

## Cultural guardrails

Every product decision in this area should pass these checks:

1. Would the language feel credible to an artist with deep club culture?
2. Does the feature respect the history and context of the music instead of treating genres as decoration?
3. Is the artist represented rather than scored?
4. Does the mechanic come from real professional activity rather than repeated app usage?
5. Can an established artist use the feature without feeling that their career has been turned into a game?
6. Can a new artist participate without being treated as lesser?
7. Does the visual language avoid festival-game aesthetics and generic influencer tropes?

The visual reference should be closer to club artwork, record sleeves, editorial music design, industrial objects, light, material and typography than to a cartoon avatar system.

## The system

### CUE ID

CUE ID is the artist's visual identity inside CueBooker.

Initial inputs:

- artist name;
- base city/country;
- music taxonomy;
- performance format;
- optional visual direction chosen by the artist.

Long-term output:

- a modular 3D avatar or sculptural artist representation;
- materials, silhouette, head treatment, clothing/accessories and visual effects;
- reusable identity across profile, booking, passport and share cards.

CUE ID is optional. An artist can postpone it, use the default CueBooker visual language or disable the avatar from their public presentation.

The avatar must not infer personality, artistic quality or music taste from appearance. Music data can suggest a starting visual direction, but the artist always controls the final representation.

### CUE SIGNAL

CUE SIGNAL represents progress through CueBooker activity.

It is not a ranking of talent and must not become a popularity score.

Initial states:

- SIGNAL 00, Created
- SIGNAL 01, Identified
- SIGNAL 02, Connected
- SIGNAL 03, Confirmed
- SIGNAL 04, Active

The exact naming can evolve after artist testing.

Progress comes from meaningful events such as profile completion, first incoming request, first confirmed booking and recurring professional activity. Opening the app, clicking buttons, sharing posts or maintaining daily streaks must not increase SIGNAL.

### CUE PASSPORT

CUE PASSPORT is the structured history of the artist.

It can contain, when the artist chooses to expose them:

- cities;
- venues;
- booking milestones;
- years;
- residencies;
- repeat professional relationships;
- selected statistics derived from CueBooker activity.

Private commercial information, contact details, exact fees, negotiations and internal notes never become public passport data by default.

The artist controls public, private and share-card visibility independently.

### CUE CASE

CUE CASE is the more expressive visual history.

The working metaphor is a flight case that accumulates stamps, stickers or marks from real activity: cities, venues, years and milestones.

It should feel collectible without becoming childish. It is primarily a visual memory object and a shareable artifact.

## Music taxonomy

Genre taxonomy requires editorial care. CueBooker must not invent fashionable genre labels or collapse scenes into vague categories.

The data model should separate three concepts.

### 1. Main styles

Broad musical families used for navigation and discovery. Initial candidates:

- Techno
- House
- Electro
- Trance
- Breaks
- Drum & Bass
- Ambient
- Experimental

This list is deliberately small. It should expand only after research with artists and promoters.

### 2. Substyles

More precise artist-selected descriptors. Techno candidates for review with scene practitioners include:

- Detroit Techno
- Dub Techno
- Hypnotic Techno
- Acid Techno
- Industrial Techno
- Hard Techno
- Schranz
- Hardgroove
- Raw Techno

Terms such as "Peak Time" should be reviewed carefully before becoming canonical taxonomy because platform taxonomies, record-store categories and scene usage do not always mean the same thing.

Substyles must be editable and extensible. CueBooker should not claim to define the music canon.

### 3. Sound descriptors

Descriptors describe character rather than genre. Examples:

- dark
- deep
- hypnotic
- raw
- driving
- groovy
- stripped-back
- mechanical
- psychedelic

They must be stored separately from genre and subgenre data.

## Onboarding

CUE ID should appear during onboarding without becoming a blocker.

Target flow:

1. Create account identity.
2. Choose DJ/artist or agency.
3. Enter artist/agency basics.
4. DJ accounts see a CUE ID teaser immediately.
5. Artist can choose "Start CUE ID" or "Do it later".
6. Skipping never blocks workspace access.
7. The workspace profile keeps a persistent entry point and completion state.

The first implementation only introduces the teaser and visual concept. The interactive builder arrives after the profile foundation is stable.

## Sharing

Sharing is part of the product architecture, not a marketing afterthought.

Planned outputs:

### Instagram Story

Visual-first. Avatar/CUE ID, artist name, selected styles, city, SIGNAL and one optional milestone.

### Instagram post

Square artist card with stronger artwork treatment and limited professional data.

### LinkedIn

More restrained presentation. Artist identity, selected trajectory data, cities/venues if public, years active and link to the public profile.

### Direct asset

Downloadable PNG/WebP and later short motion output. Every export must respect the artist's visibility settings.

CueBooker branding should remain present but subordinate to the artist.

## 3D direction

The 3D layer should use a modular web-native asset system rather than generated one-off heavy models.

Proposed architecture:

- Three.js runtime through a Vue/Nuxt integration such as TresJS;
- GLB/glTF assets;
- modular body, head, outfit, accessory and material parts;
- small animation set for idle motion;
- lazy-loaded renderer;
- static WebP/PNG fallback for low-power devices and social exports;
- no 3D dependency on booking flows or profile editing.

The first 3D family should be art-directed, sculptural and gender-flexible. Avoid realistic facial reconstruction in the initial release.

Possible visual families for exploration, treated as art direction rather than music categories:

- Void
- Chrome
- Translucent
- Signal

Names are temporary and must not imply a musical hierarchy.

## Data model direction

Do not migrate all future fields now. Add them as each vertical slice becomes real.

Conceptual shape:

```ts
artist_identity: {
  main_styles: string[]
  substyles: string[]
  sound_descriptors: string[]
  performance_formats: string[]
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

Bookings, venues, cities and promoter relationships should remain normalized product data. PASSPORT derives presentation from those records instead of duplicating the booking history.

## Delivery plan

### Phase 0, visual foundation

Current branch target:

- document the product philosophy and cultural constraints;
- add a reusable CUE ID teaser component;
- expose a non-indexed visual prototype route;
- show CUE ID during DJ onboarding without blocking account creation;
- keep existing artist profile and booking flows unchanged.

### Phase 1, identity foundation

After artist-profile branches are integrated:

- replace free-text genre grouping with reviewed main style/substyle/descriptor fields;
- add CUE ID entry inside Artist Profile;
- persist CUE ID enabled/disabled state and initial visual choices;
- show completion state on Overview;
- add "Do it later" behaviour throughout.

### Phase 2, first 3D identity

- introduce TresJS/Three.js behind lazy loading;
- ship one art-directed avatar family with limited modular choices;
- create static fallback renderer;
- validate desktop/mobile performance;
- test with artists from different electronic-music backgrounds before adding more families.

### Phase 3, SIGNAL and first PASSPORT

- derive first milestone events from real booking activity;
- expose private PASSPORT timeline;
- let artist select which milestones become shareable;
- avoid rankings, leaderboards and follower-based progression.

### Phase 4, share artifacts

- Instagram Story export;
- square artist card;
- LinkedIn professional card;
- QR/public-profile link;
- visibility controls per exported field.

### Phase 5, CUE CASE and richer history

- visual flight-case history;
- city/venue stamps where data quality is sufficient;
- repeat-promoter milestones;
- richer year-by-year trajectory.

### Phase 6, network intelligence

Only after enough real booking data exists:

- relationship graph between artists, promoters and venues;
- useful private insights such as repeat relationships and active cities;
- opt-in discovery features.

This phase must never turn hidden private relationships into public endorsements without consent.

## Success criteria

Early validation should measure behaviour rather than vanity engagement:

- percentage of DJs who open CUE ID from onboarding;
- percentage who complete or customise the identity later;
- artist profile completion rate before and after CUE ID introduction;
- share-card generation rate;
- public-profile visits coming from shared cards;
- qualitative feedback from working DJs and promoters;
- whether experienced artists describe the system as credible and respectful.

Daily active usage is not the primary success metric for a booking tool. CueBooker should be useful when professional activity happens, not manufacture reasons to open the app every day.

## Explicit non-goals

Do not build:

- global DJ rankings;
- follower-based levels;
- daily login streaks;
- XP for clicks;
- popularity scores;
- automatic claims that one artist is more professional or authentic than another;
- cartoon character customisation as the default visual direction;
- genre taxonomy generated without editorial review;
- public commercial history without explicit artist control.
