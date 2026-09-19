# CUE ID performance contract

Updated: 19 September 2026
Status: architectural constraint for the 3D implementation

## Principle

Performance is part of the CUE ID product definition. The 3D layer must never slow down booking, Artist Profile editing, navigation or access to the artist's information.

CUE ID is an enhancement. Artist Profile must remain usable when WebGL is unavailable, the device is low powered, assets fail to load or JavaScript for the 3D renderer has not hydrated yet.

## Nuxt 4 architecture

Use an island-style boundary without making the interactive 3D renderer a Nuxt Server Island.

The intended structure is:

```text
Artist Profile
├── normal Nuxt/Vue profile UI
├── static CUE ID fallback
└── CUE ID 3D client boundary
    ├── lazy-loaded renderer
    ├── GLB/glTF base asset
    ├── optional modular assets
    └── controls
```

Implementation direction:

- `CueIdStage.vue` owns the product boundary and always has a lightweight fallback;
- `CueIdScene.client.vue` owns Three.js/TresJS and WebGL;
- load the 3D client chunk only when the stage approaches the viewport;
- use Nuxt lazy hydration where it materially delays non-essential JavaScript;
- keep all booking and profile form logic outside the 3D bundle;
- do not make Artist Profile depend on renderer readiness.

A Nuxt Server Island is appropriate for static or server-rendered public profile fragments later, but the WebGL scene itself requires client interactivity. Do not use experimental selective-client islands as a dependency for the first production version.

## Loading sequence

Target sequence:

```text
1. HTML / profile data
2. cover, typography and static CUE ID fallback
3. user approaches CUE ID stage
4. client 3D chunk loads
5. base GLB loads
6. scene becomes interactive
7. optional assets load only when selected
```

The user must never stare at an empty canvas while waiting for the renderer.

## Asset strategy

- Start with one art-directed avatar family.
- Reuse geometry and materials before adding more models.
- Prefer compressed GLB/glTF assets suitable for web delivery.
- Keep texture dimensions proportional to their visible size.
- Avoid loading accessories, environments or effects before they are needed.
- Generate or store a static WebP/PNG representation for fallback and sharing.
- Do not bundle 3D assets into the initial application JavaScript.

## Rendering rules

- Cap device pixel ratio for the 3D canvas instead of blindly using the physical DPR.
- Pause or heavily reduce rendering when the CUE ID stage is outside the viewport or the document is hidden.
- Prefer event-driven rendering where possible. Do not run a permanent high-frequency render loop for a visually static scene.
- Keep idle animation subtle and inexpensive.
- Limit dynamic lights, shadows, post-processing and transparent layers.
- Respect `prefers-reduced-motion`.
- Provide a fallback when WebGL creation fails.

## Device adaptation

The renderer may reduce quality automatically based on device capability and viewport size. This is presentation adaptation, never a different product tier.

Possible degradation path:

```text
high capability   → full scene + idle animation
medium capability → reduced DPR / effects
low capability    → simplified scene or static render
no WebGL          → static render
```

Mobile must not receive desktop-quality assets by default when smaller assets or a static representation are sufficient.

## Performance budgets

Treat these as initial engineering targets, not promises to users. Revisit them with real measurements.

- Three.js/TresJS must remain outside the initial Artist Profile route payload until CUE ID approaches visibility.
- First CUE ID visual must be available immediately through the static fallback.
- The first base 3D asset should target roughly 1 MB compressed or less where art direction allows it.
- Initial texture payload for the base identity should target roughly 1 MB compressed or less.
- Optional accessories and visual families must be separate requests.
- Avoid blocking the main thread with model processing during first profile interaction.
- CUE ID must not cause a material regression in LCP, CLS or interaction responsiveness on Artist Profile.

Budgets can be relaxed only after measurement shows a visible benefit that justifies the cost.

## Measurement

Before merging the first real 3D implementation, record a baseline without 3D and compare the same Artist Profile with CUE ID enabled.

Measure at least:

- initial transferred JavaScript;
- lazy 3D chunk size;
- GLB and texture transfer size;
- LCP;
- CLS;
- interaction responsiveness;
- main-thread long tasks;
- time from CUE ID entering the preload margin to first rendered 3D frame;
- memory and frame behaviour on a representative mobile device.

Lighthouse is useful for lab comparison, but production Core Web Vitals and real device testing take precedence once CueBooker has enough traffic.

## Failure contract

If CUE ID fails, Artist Profile continues to work.

The application must be able to show the artist's photo, artwork or static CUE ID render without Three.js. A renderer error must never block saving the profile, viewing booking information, opening Passport or navigating the workspace.

## Review rule

Every new 3D feature must answer four questions before acceptance:

1. What does the artist gain visually or functionally?
2. What extra bytes are transferred?
3. What extra CPU/GPU work is introduced?
4. What happens on a device that cannot afford that cost?

If the visual gain does not justify the runtime cost, do not ship it.


## Runtime proof status — 19 September 2026

A dependency-free WebGL runtime proof now exists before TresJS/Three adoption.

Current implementation:

```text
CueIdStage.vue
-> static CSS fallback renders immediately
-> IntersectionObserver preload margin
-> dynamic client-only import
-> CueIdRuntime.client.vue
-> native WebGL procedural Club Minimal figure
```

Current runtime safeguards:

- the WebGL chunk is requested only when the stage approaches the viewport;
- static fallback remains visible until the runtime emits `ready`;
- no WebGL dependency is present in the initial app package graph;
- render loop runs only while the stage is visible and the document is active;
- `prefers-reduced-motion` disables the continuous idle loop and renders a still frame;
- device pixel ratio is capped at 1.5;
- canvas uses a low-power WebGL preference;
- `webglcontextlost` immediately restores the static fallback;
- renderer setup failure also keeps the static fallback;
- renderer lifecycle analytics record only technical state:
  - `cue_id_renderer_ready`
  - `cue_id_renderer_failed`
  - `cue_id_static_fallback_used`
- analytics does not include body/base/outfit/accessory/pose or other visual choices.

The current procedural renderer is intentionally not the final art direction and does not establish a permanent rendering API.

Its purpose is to validate:

```text
lazy runtime boundary
fallback transition
device lifecycle
reduced motion
visibility pause
context-loss recovery
measurement hooks
```

before adding:

```text
@tresjs/core
@tresjs/nuxt
three
GLB/glTF assets
```

### Replacement rule

The future TresJS/Three renderer must remain behind the same product boundary.

`CueIdStage.vue` should not know whether the interactive implementation is:

- native WebGL;
- TresJS;
- Three.js;
- a future renderer.

The semantic `CueIdConfigV1` contract and static fallback remain stable while the renderer is replaceable.

### Current measurement hooks

`cue_id_renderer_ready` records:

```text
renderer = webgl_procedural
reduced_motion
init_ms
dpr_cap
```

No appearance configuration is sent.

Before adding the first GLB, compare:

1. route JS without CUE ID visibility;
2. lazy runtime chunk transfer;
3. `init_ms` on desktop and representative mobile;
4. main-thread/GPU behaviour while visible;
5. runtime behaviour after tab hiding / stage leaving viewport;
6. fallback behaviour with WebGL disabled or context lost.

The procedural proof should be removed or replaced once the TresJS/GLB path has demonstrated equal or better resilience within budget.
