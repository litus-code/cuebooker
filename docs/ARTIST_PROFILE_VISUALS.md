# Artist profile visual layer

Updated: 16 September 2026

This block extends the professional artist profile with a visual layer that keeps the cover, original artist portrait and generated transparent cutout separate.

## Data model

The existing `cover_image_path` and `cover_position_y` fields continue to own the background cover.

The artist portrait uses:

- `artist_image_path`: untouched uploaded source.
- `artist_cutout_path`: generated transparent PNG.
- `artist_image_style`: `photo`, `artwork` or `duotone`.
- `artist_image_position_x`.
- `artist_image_position_y`.
- `artist_image_scale`.

Portrait files use the existing private `artist-media` bucket under `<artist-id>/portraits/`. Generated cutouts are stored under `<artist-id>/cutouts/`. Existing RLS policies continue to restrict reads to artist members and writes to users allowed to manage the artist.

## Automatic background removal

When an artist uploads a portrait, the original file is stored first. CueBooker then runs MODNet portrait matting in the browser through Transformers.js and uploads the generated transparent PNG only after processing finishes.

The implementation uses the quantized `q8` MODNet model. The image is processed locally in the browser. The model assets are downloaded from Hugging Face/CDN infrastructure, but the uploaded portrait is not sent to a third-party inference API.

If client-side matting fails, the original portrait is still saved and the UI exposes a `Regenerate cutout` action. This keeps profile editing usable on unsupported browsers or unreliable networks.

## Editing behaviour

`ProfileCoverUploader.vue` is the visual composer for the profile header. The actual cover stage is kept visually clean. Portrait controls live in a separate integrated strip below the stage rather than floating on top of the artwork.

Once a transparent cutout exists, all three treatments use it:

- `Photo`: natural transparent portrait.
- `Artwork`: high-contrast monochrome treatment with CueBooker lime edging.
- `Duotone`: acid-toned treatment.

The original uploaded file remains unchanged in storage. Horizontal position, vertical position and scale are persisted independently.

The private profile preview receives the same cutout through CSS variables published by the visual editor, so the editing surface and preview use the same composition.

## Product rules

- The CueBooker acid and Detroit artwork remains the fallback cover.
- A portrait is optional.
- Cover and portrait can be changed independently.
- Original portrait and generated cutout are kept separately.
- Editors remain read-only.
- Portrait files accept JPG, PNG and WebP up to 8 MB.
- No public profile is published by this change.

## Migrations

Apply these migrations before testing this branch against a Supabase environment:

- `20260916094500_add_artist_visual_portrait.sql`
- `20260916083135_add_artist_cutout_path.sql`

Both are already applied to `cuebooker-staging`. Production remains unchanged.
