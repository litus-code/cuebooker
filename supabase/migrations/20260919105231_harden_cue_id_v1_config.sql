begin;

alter table public.artists
  add constraint artists_cue_id_config_required_keys
    check (
      cue_id_config ?& array[
        'schemaVersion',
        'enabled',
        'family',
        'base',
        'build',
        'outfit',
        'accessory',
        'pose',
        'material',
        'accent'
      ]
    ),
  add constraint artists_cue_id_config_accessory_type
    check (
      jsonb_typeof(cue_id_config -> 'accessory') in ('string', 'null')
    ),
  add constraint artists_cue_id_config_accent_type
    check (
      jsonb_typeof(cue_id_config -> 'accent') in ('string', 'null')
    );

commit;
