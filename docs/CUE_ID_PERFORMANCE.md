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


## Device capability tiers

CUE ID must behave predictably across Android, iPhone and desktop. Device adaptation is part of the product contract.

### Tier A — full interactive

Typical examples:

- recent iPhone / iPad;
- recent Android flagship;
- Apple Silicon desktop/laptop;
- modern discrete or capable integrated desktop GPU.

Target behavior:

- interactive 3D enabled;
- DPR cap up to 1.5;
- idle animation enabled unless reduced motion;
- selected accessory/model assets may lazy-load;
- restrained lighting/material effects allowed;
- no heavy post-processing by default.

### Tier B — reduced interactive

Typical examples:

- Android mid-range;
- older iPhone;
- older Intel/AMD integrated graphics;
- devices reporting moderate memory constraints.

Target behavior:

- interactive 3D may run;
- DPR cap 1.0;
- no expensive post-processing;
- simplified materials;
- reduced idle animation;
- one main light + ambient/environment approximation;
- accessories load only after explicit selection;
- scene should prefer event-driven redraw over continuous animation.

### Tier C — static-first only

Triggers include:

- Save-Data enabled;
- browser-reported device memory <= 2 GB;
- WebGL unavailable;
- WebGL context loss;
- repeated renderer/model failure;
- future measured runtime threshold breach on a known device class.

Target behavior:

- no 3D runtime download where detection happens before import;
- static CUE ID remains the complete representation;
- Artist Profile remains fully usable;
- no warning/error language that makes the user feel their device is unsupported.

### Browser support matrix

The first production-ready renderer must be tested on:

| Platform | Minimum validation |
| --- | --- |
| Android | Current Chrome on low/mid/high tier hardware |
| Android | Samsung Internet on representative Samsung hardware |
| iOS | Safari on one current and one older supported iPhone |
| macOS | Safari + Chrome |
| Windows | Chrome + Edge on integrated graphics |
| Firefox | Current desktop Firefox sanity pass |

Browser support is behavioral, not user-agent based. Prefer feature/capability detection over hardcoded model lists.

## Performance budgets by surface

### Booking / Calendar / Activity

CUE ID renderer cost:

```text
0 bytes
0 renderer initialization
0 GPU work
```

These surfaces must never import the renderer.

### Artist Profile editor before CUE ID approaches viewport

Target:

```text
renderer chunk not requested
no canvas
no WebGL context
static/profile UI fully interactive
```

### CUE ID editor after activation

Initial engineering targets:

- runtime JS lazy chunk: target <= 180 KB gzip before final measurement;
- base GLB: target <= 1 MB compressed;
- initial textures: target <= 1 MB compressed;
- first meaningful 3D frame after preload trigger:
  - Tier A: target <= 800 ms on warm-ish network/device conditions;
  - Tier B: target <= 1500 ms;
- steady idle frame rate:
  - Tier A: target 50–60 fps;
  - Tier B: target >= 30 fps or switch to event-driven/still mode;
- no main-thread task > 200 ms attributable to CUE ID during profile interaction;
- no visible layout shift when static fallback transitions to 3D.

These are engineering gates, not user-facing promises.

## Android-specific acceptance criteria

Android is not a secondary platform.

Before the first GLB renderer can be considered production-ready:

1. test at least one low-end or emulated constrained Android profile;
2. test one representative mid-range Android device;
3. test one recent high-end Android device;
4. verify Chrome and Samsung Internet where practical;
5. test DPR 1 / 2 / 3 behavior and confirm the renderer cap wins;
6. verify scrolling remains responsive while CUE ID is visible;
7. verify tab/background and screen-lock recovery;
8. verify WebGL context-loss fallback;
9. verify no reload loop or blank canvas after memory pressure;
10. verify portrait/landscape transitions do not create runaway canvas resolution.

If mid-range Android cannot keep acceptable interaction/scroll performance, Tier B must reduce quality before shipping.

## Mobile thermal/battery rule

CUE ID must not maintain an unnecessary render loop.

When:

- the scene is static;
- reduced motion is active;
- the editor is not being manipulated;
- the stage is offscreen;
- the document is hidden;

rendering should stop or become event-driven.

A visually subtle idle animation is never more important than battery and thermal behavior.

## 3D asset acceptance gate

No GLB enters the initial production catalogue unless it has recorded:

- compressed file size;
- triangle count;
- material count;
- texture count and dimensions;
- decode/load time on Tier A and Tier B;
- first-frame time;
- approximate steady-state frame rate;
- memory/thermal observations on representative mobile hardware.

A visually stronger asset can be rejected if its runtime cost is disproportionate.


## GLB loader boundary

The binary asset loading boundary now exists independently from the renderer.

Implementation:

```text
app/services/cueIdAssetLoader.ts
```

Responsibilities:

1. fetch the selected GLB lazily;
2. enforce the catalogue-declared compressed byte ceiling;
3. abort/timeout stalled requests;
4. reject HTTP failures with stable error codes;
5. validate the GLB v2 header before renderer handoff;
6. verify the GLB-declared byte length matches the received payload;
7. report transfer bytes and load time.

The renderer must not bypass this service with arbitrary asset fetches.

Current stable loader errors:

```text
asset_timeout
asset_http_error
asset_too_large
asset_invalid_glb
asset_length_mismatch
```

The loader intentionally stops at validated binary delivery. It does not parse meshes, materials or animation itself.

That responsibility belongs to the future Three/Tres GLB loader after the binary has passed the Cuebooker budget boundary.

This preserves the architecture:

```text
catalogue
-> runtime tier decision
-> bounded binary loader
-> renderer adapter
-> visual scene
```

and avoids growing the native WebGL proof into a custom 3D engine.


## Quality headroom policy

The performance budget is a ceiling, not a target to stay artificially far below.

Cuebooker should spend additional 3D budget when it creates a visible improvement in:

- silhouette continuity;
- head/shoulder anatomy;
- clothing volume;
- hand/foot readability;
- deformation quality;
- rigging quality;
- profile-size legibility.

Do not optimize for the smallest possible triangle count if that makes CUE ID look primitive.

### Universal base ceiling

Until representative Android measurements justify a tier-specific LOD strategy, the default production base keeps the current universal ceiling:

```text
compressed GLB <= 1,000,000 bytes
triangles <= 35,000
materials <= 4
textures <= 6
texture dimension <= 2048
```

A production candidate may approach the 30k–35k triangle range if the added geometry creates a material visual improvement and Tier B remains within the runtime gates.

### Current candidate headroom

For Club Minimal candidate v1 pass 4:

```text
bytes used: 45,904 / 1,000,000 (~4.6%)
triangles used: 2,272 / 35,000 (~6.5%)
materials used: 4 / 4
textures used: 0 / 6
```

This means the candidate is currently geometry-light, not budget-constrained.

The next refinements should therefore prefer geometry/topology improvements over new materials.

### Maximum-quality rule

Use as much of the available budget as is visibly justified, stopping at the first point where one of these regresses:

- Tier B first-frame target;
- scroll responsiveness;
- interaction latency;
- memory stability;
- thermal/battery behavior;
- context stability;
- page load or route transition performance.

### Future high-detail Tier A

Do not raise the universal base ceiling merely because desktop can handle more.

If measured visual quality eventually requires substantially more than the universal budget, introduce explicit Tier A / Tier B LOD assets instead:

```text
Tier A -> high-detail visual variant
Tier B -> mobile-safe reduced variant
Tier C -> static fallback
```

Only add LOD complexity after measurements prove that a single production asset cannot deliver the desired visual quality efficiently.

## Lab ready-time gate

The `/cue-id` lab now measures end-to-end interactive readiness from the moment the stage enters the preload window until the selected GLB has rendered its first frame.

Budgets:

```text
Tier A / full:    <= 800 ms  => PASS
Tier B / reduced: <= 1500 ms => PASS
Tier C / static:  not applicable
```

Anything above the relevant interactive budget is shown as WARN.

Individual technical timings remain visible:

```text
init_ms
load_ms
parse_ms
first_frame_ms
total_ready_ms
```

`total_ready_ms` is the product-facing performance signal because it covers the complete path experienced after the preload trigger.

The lab panel also shows:

```text
runtime tier
runtime decision reason
DPR cap
asset id
asset bytes
budget
PASS / WARN
```

These diagnostics are lab-only and must never appear on the public Artist Profile or normal workspace flows.

Use the gate to decide whether additional geometry/art quality can be spent safely. Do not interpret one desktop measurement as evidence that Tier B can absorb the same cost.
