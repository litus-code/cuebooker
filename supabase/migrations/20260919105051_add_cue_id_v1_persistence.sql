begin;

alter table public.artists
  add column visual_mode text not null default 'photo'
    check (visual_mode in ('photo', 'artwork', 'cue_id')),
  add column cue_id_config jsonb not null default '{
    "schemaVersion": 1,
    "enabled": true,
    "family": "club_minimal",
    "base": "neutral",
    "build": "regular",
    "outfit": "tee",
    "accessory": null,
    "pose": "neutral",
    "material": "matte",
    "accent": "lime"
  }'::jsonb;

alter table public.artists
  add constraint artists_cue_id_config_object
    check (jsonb_typeof(cue_id_config) = 'object'),
  add constraint artists_cue_id_config_schema_version
    check (
      jsonb_typeof(cue_id_config -> 'schemaVersion') = 'number'
      and (cue_id_config ->> 'schemaVersion')::integer = 1
    ),
  add constraint artists_cue_id_config_enabled
    check (jsonb_typeof(cue_id_config -> 'enabled') = 'boolean'),
  add constraint artists_cue_id_config_family
    check (cue_id_config ->> 'family' = 'club_minimal'),
  add constraint artists_cue_id_config_base
    check (cue_id_config ->> 'base' in ('masculine', 'feminine', 'neutral')),
  add constraint artists_cue_id_config_build
    check (cue_id_config ->> 'build' in ('slim', 'regular', 'strong')),
  add constraint artists_cue_id_config_outfit
    check (cue_id_config ->> 'outfit' in ('tank', 'tee', 'hoodie', 'bomber')),
  add constraint artists_cue_id_config_accessory
    check (
      cue_id_config -> 'accessory' = 'null'::jsonb
      or cue_id_config ->> 'accessory' in ('headphones', 'cap', 'glasses')
    ),
  add constraint artists_cue_id_config_pose
    check (cue_id_config ->> 'pose' in ('neutral', 'relaxed', 'focused', 'editorial')),
  add constraint artists_cue_id_config_material
    check (cue_id_config ->> 'material' in ('matte', 'satin')),
  add constraint artists_cue_id_config_accent
    check (
      cue_id_config -> 'accent' = 'null'::jsonb
      or cue_id_config ->> 'accent' in ('lime', 'red')
    );

grant update (visual_mode, cue_id_config)
on public.artists to authenticated;

commit;
