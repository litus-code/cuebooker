# Cuebooker Work handoff

Updated: 16 September 2026
Branch to continue from: `feature/app-visual-system`

This document is the operational handoff for the next Work session. Read it before changing UI, Artist Profile or CUE ID. It consolidates the product decisions taken during the current redesign and the exact open work.

## 1. North star

Cuebooker should feel like a real, honest space rooted in club culture where artists with very different careers can feel represented and respected.

The product balance is:

- professionalism without corporate coldness;
- culture without elitism;
- identity without posturing;
- progression without turning a career into empty gamification.

The main internal test for every feature, visual treatment or piece of copy is:

> Would this feel natural and respectful to an artist with 20–30 years of club culture behind them, while still welcoming someone who is beginning today?

If the answer is no, revise it.

Cuebooker must not decide who is a “real DJ”, rank artistic quality or use followers/likes/reach as prestige. It should document trajectory, craft and professional activity: bookings, repeat promoters, venues, cities, residencies, years active, performance formats and relationships.

## 2. Product hierarchy

There is ONE Artist Profile. Do not create a second identity/profile surface.

```text
ARTIST PROFILE
├── Identity
├── Music
├── CUE ID
├── Booking
├── Media
├── CUE PASSPORT
└── Preview / Share
```

CUE ID, CUE SIGNAL and CUE PASSPORT are layers of that profile.

- CUE ID = visual identity/presence.
- CUE SIGNAL = discreet meaningful activity state, never XP/popularity.
- CUE PASSPORT = trajectory/history derived from real activity and selected prior career history.
- Share = an action/output from Profile/Passport, not another product area.

Read `docs/CUE_ID_PRODUCT_VISION.md` before implementing any identity feature.

## 3. Cultural/product rules that must not regress

Do not:

- attack “DJ influencers” in product copy;
- use “real DJ” as a product judgement;
- use followers, shares, app activity or streaks to advance CUE SIGNAL;
- create global rankings, levels such as “Level 10 DJ”, leaderboards or arbitrary XP;
- make veteran artists complete childish progression tasks;
- map music genres directly to costumes/personality;
- treat club culture as a generic cyber/festival visual costume;
- lock core booking/calendar capability behind identity progression.

Prefer vocabulary around music, craft, consistency, history, scene, bookings, connections and trajectory.

## 4. Current visual-system direction

The approved direction is documented in `docs/APP_VISUAL_SYSTEM.md`.

Cuebooker is no longer meant to look like a generic SaaS with a dark theme. The approved prototype established a more editorial, club-rooted application language:

- deep black/graphite surfaces in Dark;
- thin borders rather than floating rounded cards;
- lime used as signal/selection, not everywhere;
- restrained monospace metadata;
- strong display typography only where hierarchy needs it;
- denser operational surfaces;
- artist-identity surfaces can be more expressive;
- Light is deliberately designed with white/warm grey + lilac/purple, not a colour inversion.

The prototype is the visual source of truth. Deviate only for a functional reason.

## 5. Non-negotiable platform capabilities

Every redesign must preserve:

- Dark and Light;
- ES and EN;
- desktop and mobile as first-class experiences;
- request filters and counts;
- full request detail;
- conversation/reply flow;
- Calendar dates AND start/end times;
- 24-hour selected-day view;
- overlap/availability behaviour;
- History and traceability back to the request;
- Guided Tour, currently 8 steps;
- Artist Profile and Preview;
- performance/accessibility discipline.

Never remove a working capability just to match a mockup.

## 6. Desktop shell agreed direction

Desktop uses a left sidebar/application rail.

Primary destinations:

- Resumen / Overview
- Bookings
- Calendario
- Historial
- Perfil
- Ajustes

Each destination should have an icon.

`Ajustes` is a real workspace section, visually at the same navigation level as the other destinations. It contains:

- Idioma / Language;
- Apariencia / Appearance;
- account/password controls.

Do not put independent language/theme clusters at the bottom of the desktop sidebar.

`Cerrar sesión` is the only persistent action at the bottom of the sidebar. It may use a restrained red treatment because it is a destructive/session action.

The Settings navigation bug was fixed so selecting another primary tab closes Settings and changes section normally. Do not regress this.

## 7. Shared geometry

One of the main redesign problems was inconsistent horizontal rhythm. The current direction is ONE app grid:

- stable desktop rail width;
- stable content inset;
- the right edge of page headers, profile progress and lower sections must align;
- do not introduce different arbitrary max-widths per section;
- readable text can have internal max-widths, but the app canvas shares a consistent outer grid.

Headers must not become giant marketing heroes. Pattern:

```text
small eyebrow
controlled page title
short supporting copy
optional right-side artist/context block
```

Overview, Bookings, Calendar, History and Profile should feel designed by the same system.

## 8. Operational surfaces

### Bookings

Bookings is the operational centre.

Desktop target:

- compact page header;
- sample-data notice with breathing room before filters;
- compact horizontally readable filters;
- list + selected Request Detail treated as one continuous operational surface;
- no unnecessary gutter between list and detail;
- selected request remains contextual while the detail gets visual priority.

Request Detail must retain event data, city, venue, capacity, fee/offer, schedule, contact/source, current status, conversation, reply composer, confirm/reject and traceability.

### Calendar

Do not simplify the calendar into dates only. Time is first-class.

Keep:

- monthly calendar;
- date navigation;
- coloured statuses;
- selected day;
- 24 hourly rows;
- start/end time;
- creation/editing of blocks;
- private labels;
- overlap protection;
- navigation back to linked requests where applicable.

### History

History is a professional trace, not a decorative activity feed. An item should be able to take the user back to the booking/request that produced it.

## 9. Mobile is the CURRENT PRIORITY before more desktop work

The current mobile implementation has fallen behind the desktop redesign because several old CSS layers still override newer workspace rules.

Do not continue with CUE ID implementation until a responsive pass stabilises the application shell.

Known problem: multiple mobile generations coexist (`mobile-polish.css`, `final-mobile-fixes.css`, workspace v2/v3/v4/v5/v6 overrides). Desktop rules often win correctly, while mobile inherits older patterns.

Recommended action:

1. Audit the CSS cascade and reduce/replace contradictory mobile workspace rules rather than stacking more fixes indefinitely.
2. Treat mobile as a dedicated composition, not a shrunken desktop sidebar.
3. Use a compact top shell with logo/actions and a horizontally scrollable primary nav with icons.
4. Keep all main destinations reachable, including Settings.
5. Reflow each page intentionally to one column where required.
6. Validate Dark/Light + ES/EN on representative narrow widths.

### Mobile Bookings

Recommended pattern:

- compact horizontal/scrollable request selector/list near the top;
- selected Request Detail below it;
- clear way to change request without scrolling through a very long vertical list;
- status filters locally scrollable;
- no page-level horizontal overflow.

### Mobile Calendar

Preserve month + selected-day 24-hour schedule. The day timeline may stack below the month, but time data must remain usable.

### Mobile Profile

Avoid sticky/save bars that obscure form fields. Profile Preview must be a real mobile composition, not a desktop modal squeezed down.

## 10. Guided Tour mobile bug and desired behaviour

Current tour sequence is 8 steps and targets Bookings + Calendar. Keep the sequence/hooks unless a deliberate product change is approved.

Current issue: on mobile the fixed tour card can cover the element it is explaining. The existing logic calls `scrollIntoView({ block: 'center' })`, which does not reserve space for the card.

Desired behaviour:

1. resolve the target;
2. measure viewport + target + tour-card height;
3. scroll the target into a safe visible region;
4. position the tour card above or below the target depending on available space;
5. if necessary use a compact bottom sheet but add scroll padding/offset so the highlighted target remains visible;
6. respect `prefers-reduced-motion`.

The card should never hide the primary action it is describing when another placement is available.

## 11. Brand assets: OPEN ISSUE before further visual polish

Do not compensate logo inconsistencies with per-theme CSS scaling.

`app/components/CueBrand.vue` currently points the wordmark to:

- `/cuebooker-header-dark-approved.png`
- `/cuebooker-header-light-approved.png`

Both files have the same pixel canvas dimensions, but the user had already prepared/uploaded a final normalised package with matching dark/light proportions. The current component may therefore be using older/alternate assets rather than the intended final package.

The final package naming discussed was:

- `logo-full-dark.png`
- `logo-full-light.png`
- `logo-dark.png`
- `logo-light.png`
- `favicon-dark.ico`
- `favicon-light.ico`

Before changing logo dimensions again:

1. locate the actual final uploaded assets/commit;
2. compare visible-content bounds, not only PNG canvas dimensions (transparent internal padding can change perceived size);
3. make `CueBrand.vue` use the exact final pair;
4. preserve natural aspect ratio;
5. use the same layout dimensions for both themes;
6. test sharpness at desktop and mobile sizes.

The user wants the sidebar logo roughly at the presence of the website wordmark, slightly larger than earlier iterations, but never stretched.

## 12. Artist Profile current direction

Artist Profile already stores identity/location/music/formats/media and private booking conditions. Cover and artist portrait are separate layers.

Read `docs/ARTIST_PROFILE_VISUALS.md`.

Visual composition direction:

- fallback cover remains Cuebooker acid/Detroit artwork;
- user can upload a cover independently;
- artist portrait/cutout can sit as a separate centred layer over the cover;
- portrait controls are separate from the artwork stage;
- original portrait and transparent cutout remain separate;
- Preview must look like a finished artist profile, not an editor modal.

The existing Preview went through multiple CSS fixes. If it is still structurally wrong, stop stacking CSS and refactor the markup/component deliberately.

Profile save/completion UI should remain compact: completion is contextual information, `Guardar ficha` is a normal action, never a full-width kilometre-long CTA on desktop.

## 13. CUE ID: approved creative direction

The earlier primitive/procedural “robot/totem” experiment was rejected. Do not revive it as the production character.

The user strongly approved the later visual prototype where CUE ID looked like a credible stylised humanoid/character creator rather than a futuristic robot.

Core idea:

> fewer closed characters, more modular identity system.

CUE ID should let the artist build a presence rather than choose one rigid sci-fi avatar.

### Broad representation modes

Artist Profile can ultimately present:

- Photo;
- Artwork;
- CUE ID.

CUE ID itself can range between:

- `Real Presence`: closer to a stylised human/club look;
- `Alter Ego`: more conceptual/editorial/sculptural.

These are not status levels.

### Humanoid base

The real implementation should use a proper humanoid asset/rig, not cylinders/cubes.

Body-base selection should support at least:

- masculine;
- feminine;
- androgynous/neutral.

Do not lock clothing or accessories to sex/gender.

Keep body customisation deliberately bounded, not Sims-level complexity. Initial concepts:

- slim;
- regular;
- strong;
- optional soft/other body preset after validation;
- short/medium/tall visual proportion if useful.

### Modular identity layers

Target conceptual stack:

```text
COMMON RIG
  ↓
HUMANOID BASE
  ↓
BODY PRESET
  ↓
OUTFIT
  ↓
ACCESSORIES
  ↓
POSE / ATTITUDE
  ↓
VISUAL TREATMENT
```

Initial outfit language should not be exclusively futuristic. Examples approved for exploration:

- tank top / sleeveless;
- T-shirt;
- hoodie;
- jacket/bomber;
- cargo/street/club clothing;
- later editorial/techwear options.

Accessories can include cap, headphones, glasses, hood, mask or none.

Poses/attitudes: neutral, relaxed, focused, editorial/powerful.

Finish/material is a lower-level visual treatment, not the centre of the editor: matte, satin, chrome, translucent, etc.

### Four visual directions used as guideline

These are art-direction families, not four fixed characters:

1. Club Minimal
2. Underground Raw
3. Editorial Dark
4. Alter Ego Conceptual

First real MVP candidate: `Club Minimal`, because it proves CUE ID can represent a normal club artist without forcing cyber aesthetics.

## 14. 3D technical direction

Do not change framework because the primitive prototype looked bad. The problem was the asset, not Three.js.

Approved technical approach:

- Nuxt 4 + Vue 3;
- Three.js through TresJS or a similarly thin Vue integration;
- GLB/glTF humanoid assets;
- common rig where practical;
- modular clothes/accessories;
- small idle/pose set;
- static render fallback;
- 3D completely isolated from booking flows.

The humanoid can be produced in Blender or validated first from a licensable base asset, then art-directed/customised. Do not spend weeks building a full character engine before validating one high-quality base.

Recommended MVP order:

1. build the final CUE ID UI/editor shell from the approved visual prototype;
2. integrate ONE credible humanoid base;
3. support body base + 2–4 outfits + a few accessories + 3–4 poses;
4. persist configuration to Artist Profile/CUE ID data;
5. create static fallback/export;
6. expand only after the identity feels credible.

## 15. Nuxt islands / performance

Performance has been explicitly prioritised throughout the project.

Use a Nuxt 4 island/client-isolation approach where it genuinely reduces hydration, but do not confuse a server-rendered island with the WebGL renderer itself. Three/WebGL still runs client-side.

Desired architecture:

```text
Artist Profile HTML/static identity first
        ↓
static CUE ID fallback
        ↓
near viewport
        ↓
lazy client chunk
        ↓
Three/Tres renderer + base GLB
        ↓
optional assets on demand
```

Renderer rules:

- client-only boundary;
- lazy import;
- no Three.js in initial booking/profile critical path;
- pause/reduce rendering when offscreen/document hidden;
- cap/adapt DPR;
- reduce effects/shadows/animation on low-power devices;
- fail safely to static art;
- measure JS transfer, model/texture weight, LCP, CLS, responsiveness and mobile main-thread cost.

Read `docs/CUE_ID_PERFORMANCE.md` before shipping 3D.

Public/indexable pages should target excellent Core Web Vitals/PageSpeed. The private workspace is not an SEO ranking surface, but the same performance discipline remains part of quality.

## 16. CUE SIGNAL / PASSPORT future direction

CUE SIGNAL provisional states have been explored as Created / Identified / Connected / Confirmed / Active, but naming is not final.

Signal only moves from meaningful real activity. Never from clicks, login streaks, followers or shares.

CUE PASSPORT should eventually represent:

- years active;
- cities;
- venues;
- residencies;
- bookings;
- repeat promoters;
- professional relationships;
- selected milestones;
- imported pre-Cuebooker history where useful.

Private commercial data such as fees, contacts, negotiations and internal notes never becomes public by default.

A later Flight Case/CUE CASE can visualise accumulated history with stamps/stickers, but it must feel like professional memory/scene history, not cartoon achievements.

## 17. Music taxonomy remains research work

Do not hardcode a casual taxonomy such as “electronic / techno / dark hard”. The user explicitly wants knowledgeable scene people to take the product seriously.

Separate:

- main styles;
- substyles;
- sound/atmosphere descriptors.

Before finalising taxonomy, research respected scene/catalogue sources and historical usage. Genre does not deterministically choose the avatar/outfit.

## 18. Current implementation state / what is safe to assume

Work branch: `feature/app-visual-system`.

Current branch contains the accumulated visual-system work on top of Artist Profile. Recent temporary validation PRs were intentionally closed without merge; they only existed to produce Cloudflare previews.

Recent CI/generate checks passed after Settings navigation/logo-size work.

Supabase staging already has the current Artist Profile and portrait/cutout migrations documented in `STATUS.md` and `ARTIST_PROFILE_VISUALS.md`. Production is not to be changed as part of visual iterations unless explicitly requested.

There is significant CSS layering debt in the workspace. Before adding another `workspace-vN` patch, prefer consolidating or refactoring the current rules, especially responsive ones.

## 19. Exact next order of work

### Block A: responsive stabilisation FIRST

1. Resolve the final logo asset pair and remove theme-dependent perceived-size mismatch.
2. Audit/collapse conflicting mobile workspace CSS.
3. Rebuild mobile shell/navigation using current desktop design language.
4. Verify Overview mobile.
5. Verify Bookings + Request Detail mobile.
6. Verify Calendar month + 24h timeline mobile.
7. Verify History mobile.
8. Verify Profile + Preview + save behaviour mobile.
9. Verify Settings mobile.
10. Fix Guided Tour scroll/placement so targets remain visible.
11. Test Dark/Light × ES/EN on mobile and desktop.

### Block B: close current application visual system

1. run desktop/mobile smoke pass;
2. fix remaining alignment/grid inconsistencies;
3. remove obsolete CSS overrides where safe;
4. document final shell/tokens/components;
5. validate performance/accessibility regressions.

### Block C: move into Artist Profile + real CUE ID

1. use Artist Profile as the single identity surface;
2. refine public/private Preview composition;
3. define CUE ID editor UI from the approved humanoid prototype;
4. choose/create the first real humanoid GLB;
5. implement Club Minimal vertical slice;
6. persist modular CUE ID config;
7. add lazy/static performance architecture;
8. validate desktop/mobile quality and load cost;
9. only then expand outfits/body bases/Alter Ego.

### Block D: later identity/trajectory work

- taxonomy research;
- first meaningful CUE SIGNAL;
- private CUE PASSPORT timeline;
- shareable Artist Card/Story/LinkedIn outputs;
- later Flight Case concept.

## 20. Documents Work should read

Read in this order:

1. `docs/WORK_HANDOFF_2026-09-16.md` (this file)
2. `docs/APP_VISUAL_SYSTEM.md`
3. `docs/CUE_ID_PRODUCT_VISION.md`
4. `docs/CUE_ID_PERFORMANCE.md`
5. `docs/ARTIST_PROFILE_VISUALS.md`
6. `docs/STATUS.md`
7. `docs/WORKSPACE_VISUAL_REFACTOR.md`
8. `docs/ARCHITECTURE.md` as needed for broader technical context

## 21. Working instruction for the next agent

Do not start by inventing another redesign. Inspect the branch and current staging state first. Preserve what already works. Fix responsive parity and the asset inconsistency before extending the visual system.

Once the app shell is stable, move directly into Artist Profile + the real humanoid CUE ID vertical slice. The approved direction is a credible modular identity system, not a procedural robot and not a separate gamified profile.

## 22. Block A stabilisation update

The first consolidation pass is now implemented on `feature/app-visual-system`:

- the approved `logo-full-*` and `logo-*` packages have matching canvases and near-matching visible bounds, so no additional rescaling asset was introduced;
- `workspace-v7-mobile-system.css` is loaded by Nuxt during SSR instead of being injected by a client plugin;
- the DOM patch plugins for navigation, request scroll and Guided Tour placement have been removed;
- Settings is an explicit sixth workspace destination on desktop and in the horizontally scrollable mobile navigation;
- Sign out is the only persistent account utility in the shell;
- request selection scroll remains owned by `workspace.vue` and accounts for the sticky mobile header;
- Guided Tour placement is measured against the current target, sticky header and viewport, with reduced-motion handling;
- the mobile profile save bar remains sticky but participates in document flow and no longer needs a large floating gap;
- Artist Profile already includes the requested chip inputs, optional cover image with Cuebooker fallback, completion link from Overview and public-profile preview.

Static generation and `git diff --check` pass after this consolidation. `nuxi typecheck` cannot run in the current checkout because no type-checker package is installed; the production Nuxt build still compiles both client and server successfully.

Do not begin the real CUE ID vertical slice until this commit has deployed to staging and the Dark/Light × ES/EN desktop/mobile smoke matrix has been completed there.
