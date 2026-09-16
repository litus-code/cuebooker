# Artist profile visual layer

Updated: 16 September 2026

This block extends the professional artist profile with a visual layer that keeps the cover and the artist portrait separate.

## Data model

The existing `cover_image_path` and `cover_position_y` fields continue to own the background cover.

The artist portrait uses:

- `artist_image_path`
- `artist_image_style`: `photo`, `artwork` or `duotone`
- `artist_image_position_x`
- `artist_image_position_y`
- `artist_image_scale`

Portrait files use the existing private `artist-media` bucket under `<artist-id>/portraits/`. Existing RLS policies continue to restrict reads to artist members and writes to users allowed to manage the artist.

## Editing behaviour

`ProfileCoverUploader.vue` now acts as the visual composer for the profile header. It renders the artist portrait as an independent layer above the cover and provides controls for style, horizontal position, vertical position and scale.

The default treatment is `artwork`. The original uploaded file remains unchanged in storage. The current implementation applies a presentation filter in the browser, so `artwork` is a graphic treatment rather than destructive image conversion.

Changing the portrait uploads the replacement first, persists the new path, and deletes the previous object only after the database update succeeds. Failed uploads are cleaned up where possible.

The private profile preview receives the same portrait through CSS variables published by the visual editor, so the editing surface and preview use the same position, scale and treatment.

## Product rules

- The CueBooker acid and Detroit artwork remains the fallback cover.
- A portrait is optional.
- Cover and portrait can be changed independently.
- Editors remain read-only.
- Portrait files accept JPG, PNG and WebP up to 8 MB.
- No public profile is published by this change.

## Migration

Apply `supabase/migrations/20260916094500_add_artist_visual_portrait.sql` before testing this branch against a Supabase environment.
