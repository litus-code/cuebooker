# CUE ID visual guidelines

Updated: 16 September 2026
Status: product and art-direction guideline

## Core idea

CUE ID is not a robot skin, a game character or a second artist profile.

It is the visual identity layer of Artist Profile. The artist should be able to recognise themselves in it, whether their real-world style is a cap and tank top, dark clubwear, editorial fashion or a more conceptual alter ego.

The system starts from a recognisable human presence and can move towards abstraction. It must not start from a futuristic character and force every artist into that language.

## Product hierarchy

```text
ARTIST PROFILE
└── visual representation
    ├── Photo
    ├── Artwork
    └── CUE ID
        ├── Presence
        ├── Outfit
        ├── Accessories
        ├── Pose / attitude
        ├── Visual tone
        └── Finish
```

CUE ID consumes the same artist identity as the rest of the profile. It does not duplicate name, genres, biography, location or booking data.

## Visual north star

The reference should feel closer to a club editorial, artist press image or digital sculpture than to a videogame avatar editor.

Desired qualities:

- human silhouette first;
- credible club clothing;
- strong posture and body language;
- sober materials;
- controlled light and colour;
- enough abstraction to feel authored by Cuebooker;
- enough realism that different artists can feel represented;
- dark does not automatically mean futuristic;
- underground does not mean costume.

Avoid:

- generic robots;
- geometric totems presented as final identities;
- sci-fi as the default visual language;
- Fortnite/Sims/cartoon proportions;
- genre-to-costume stereotypes;
- excessive neon;
- fake cyberpunk decoration;
- gamified rarity tiers for clothing or identity.

## Four reference directions

These are art-direction anchors, not four locked characters.

### 01 Club Minimal

The first production direction.

Reference language:

- cap;
- tank top or plain T-shirt;
- cargo or loose trousers;
- sneakers / simple boots;
- headphones optional;
- relaxed stance;
- almost monochrome;
- one controlled Cuebooker accent.

Purpose: prove that CUE ID can represent a real club artist without forcing a futuristic aesthetic.

### 02 Underground Raw

Reference language:

- hoodie;
- cargo trousers;
- heavier footwear;
- layered black clothing;
- cap, chain or headphones as optional details;
- lower, more grounded posture;
- rougher surface treatment.

The treatment should feel lived-in, not like a tactical costume.

### 03 Editorial Dark

Reference language:

- cleaner silhouette;
- jacket or structured garment;
- wider trousers;
- glasses optional;
- more deliberate pose;
- stronger lighting composition;
- fashion/editorial influence without luxury-brand cosplay.

### 04 Alter Ego

The most conceptual direction.

Reference language:

- mask or visor;
- more sculptural silhouette;
- unusual materials;
- stronger abstraction;
- controlled futuristic elements.

This is an option, not the default definition of CUE ID.

## Customisation model

Do not build hundreds of complete characters. Build a limited modular system with enough combinations to create ownership.

Initial target:

- 3-5 presence / silhouette bases;
- 4-8 outfit bases;
- 4-6 accessories;
- 3-5 poses;
- 3-4 finishes;
- a small accent palette.

The MVP starts smaller and grows only after the interaction proves useful.

### MVP slice

Current first slice:

- presence: Club Minimal;
- outfits: tank top, T-shirt, hoodie, jacket;
- accessories: cap, headphones, sunglasses, none;
- poses: relaxed, neutral, focused, editorial;
- finishes: matte, satin, chrome;
- accents: lime, red, violet, white.

These options exist to validate the identity system. They are not a promise that the final catalogue will use these exact labels.

## Music and identity

Music taxonomy and visual identity are related but separate.

A genre can influence recommendations, atmosphere or initial presets, but must never deterministically assign clothing or appearance.

A techno artist can choose a tank top, hoodie, simple jacket, editorial silhouette or conceptual alter ego. Cuebooker should not decide what a genre is supposed to look like.

## Senior artist test

Before accepting a visual decision, ask:

> Would this feel respectful and natural for an artist with twenty or thirty years of club culture behind them?

If it looks childish, trend-chasing, scene-naive or like a marketing costume, revise it.

The same system must also remain approachable for a new artist. Seniority changes trajectory, not dignity.

## Performance rule

Art direction does not override the CUE ID performance contract.

The first visual remains available as a lightweight fallback. WebGL is lazy, isolated and optional. Future outfits and accessories must load modularly rather than inflating the initial Artist Profile payload.

See `docs/CUE_ID_PERFORMANCE.md` for engineering budgets and degradation rules.
