# CUE ID — first humanoid asset research

Updated: 19 September 2026
Status: research / no asset admitted to production catalogue

## Purpose

This note separates two different needs:

1. a technically cheap GLB used to validate the future loader/runtime path;
2. the first art-directed CUE ID humanoid that is credible enough to ship.

They are not the same thing.

## Technical benchmark candidates

### Quaternius / Casual Character

Source: Poly Pizza / Quaternius mirror.

Observed public metadata:

```text
license: CC0 1.0
format: GLB
triangles: ~3,350
file size: ~322 KB
animated: yes
```

Assessment:

```text
performance benchmark: YES
final CUE ID art direction: NO
```

Reason:

The asset is useful because it is extremely cheap relative to the current CUE ID base budget and is already animated. It can validate future GLB loading, animation lifecycle and Android memory behavior.

It is not accepted as the brand identity because the visual language reads as generic low-poly/game asset.

Reference:
https://poly.pizza/m/kZ3DmIoGip

### CC0 standing civilian

Observed public metadata:

```text
license: CC0 1.0
format: GLB
triangles: ~1,200
height: ~1.76 m
animation: none
decoder: no additional decoder required
```

Assessment:

```text
lowest-cost static loader benchmark: YES
final CUE ID art direction: NO
```

Reason:

Useful for establishing the lowest practical GLB load/decode baseline. Too generic to define CUE ID visually.

Reference:
https://3dassets.dev/assets/low-poly-character-figures-civilian-standing-idle-514e9033

### Plewr rigged character

Observed public metadata:

```text
license: CC0
unrigged GLB: ~182 KB
rigged GLB: ~993 KB
```

Assessment:

```text
rig/animation budget benchmark: POSSIBLE
final CUE ID art direction: NO
```

The rigged file sits almost exactly at the current 1 MB base GLB target, making it useful as a stress/upper-bound benchmark.

Reference:
https://plewr.itch.io/3d-rigged-character

## Rejected direction examples

Public marketplace/search examples with overt cyber/fantasy, game-character or costume-heavy styling were intentionally rejected even when technically usable.

CUE ID should not inherit a visual language merely because a downloadable GLB already exists.

## Decision

No researched third-party model is currently admitted to:

```text
CUE_ID_ASSETS
```

The catalogue remains empty.

The first external/base asset may be used temporarily as a loader benchmark only when the real TresJS/Three integration exists.

The first shippable humanoid should instead be:

- original or substantially art-directed;
- sculptural/editorial;
- culturally credible beside professional DJ photography;
- neutral enough to support multiple scenes;
- modular for outfit/accessory composition;
- within the mobile budgets enforced by `app/domain/cueIdAssets.ts`.

## Licensing rule

For benchmark assets, prefer CC0/public-domain-compatible sources.

For any production art asset:

- archive the original license/source at acquisition time;
- confirm commercial modification/distribution rights;
- avoid assets derived from recognisable copyrighted characters or third-party IP;
- do not rely on marketplace thumbnails or unclear reuploads as license evidence.

## Next action

When the GLB loader exists:

1. use one CC0 benchmark asset to measure loader/decode/first-frame behavior;
2. do not expose the benchmark as a selectable CUE ID;
3. compare against the procedural runtime baseline;
4. only then integrate the first art-directed production humanoid.
