begin;

create or replace function public.complete_onboarding(
  account_type text,
  display_name text,
  entity_name text,
  entity_slug text
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
  profile_complete boolean;
  created_entity_id uuid;
begin
  if current_user_id is null then
    raise exception 'authentication_required';
  end if;

  if $1 not in ('dj', 'agency') then
    raise exception 'invalid_account_type';
  end if;

  if char_length(trim(coalesce($2, ''))) < 2 then
    raise exception 'invalid_display_name';
  end if;

  if char_length(trim(coalesce($3, ''))) < 2 then
    raise exception 'invalid_entity_name';
  end if;

  if $4 is null or $4 <> lower($4)
    or $4 !~ '^[a-z0-9]+(?:-[a-z0-9]+)*$' then
    raise exception 'invalid_entity_slug';
  end if;

  select profile.onboarding_completed
  into profile_complete
  from public.profiles as profile
  where profile.user_id = current_user_id
  for update;

  if not found then
    raise exception 'profile_not_found';
  end if;

  if profile_complete then
    raise exception 'onboarding_already_completed';
  end if;

  update public.profiles as profile
  set display_name = trim($2)
  where profile.user_id = current_user_id;

  if $1 = 'dj' then
    insert into public.artists (stage_name, slug, created_by)
    values (trim($3), $4, current_user_id)
    returning id into created_entity_id;
  else
    insert into public.organizations (type, name, slug, created_by)
    values ('agency', trim($3), $4, current_user_id)
    returning id into created_entity_id;
  end if;

  update public.profiles as profile
  set onboarding_completed = true
  where profile.user_id = current_user_id;

  return jsonb_build_object(
    'account_type', $1,
    'entity_id', created_entity_id,
    'onboarding_completed', true
  );
end;
$$;

revoke all on function public.complete_onboarding(text, text, text, text) from public;
revoke all on function public.complete_onboarding(text, text, text, text) from anon;
grant execute on function public.complete_onboarding(text, text, text, text) to authenticated;

commit;
