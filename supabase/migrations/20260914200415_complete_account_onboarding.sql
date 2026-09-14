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

  if account_type not in ('dj', 'agency') then
    raise exception 'invalid_account_type';
  end if;

  if char_length(trim(coalesce(display_name, ''))) < 2 then
    raise exception 'invalid_display_name';
  end if;

  if char_length(trim(coalesce(entity_name, ''))) < 2 then
    raise exception 'invalid_entity_name';
  end if;

  if entity_slug is null or entity_slug <> lower(entity_slug)
    or entity_slug !~ '^[a-z0-9]+(?:-[a-z0-9]+)*$' then
    raise exception 'invalid_entity_slug';
  end if;

  select onboarding_completed
  into profile_complete
  from public.profiles
  where user_id = current_user_id
  for update;

  if not found then
    raise exception 'profile_not_found';
  end if;

  if profile_complete then
    raise exception 'onboarding_already_completed';
  end if;

  update public.profiles
  set display_name = trim(display_name)
  where user_id = current_user_id;

  if account_type = 'dj' then
    insert into public.artists (stage_name, slug, created_by)
    values (trim(entity_name), entity_slug, current_user_id)
    returning id into created_entity_id;
  else
    insert into public.organizations (type, name, slug, created_by)
    values ('agency', trim(entity_name), entity_slug, current_user_id)
    returning id into created_entity_id;
  end if;

  update public.profiles
  set onboarding_completed = true
  where user_id = current_user_id;

  return jsonb_build_object(
    'account_type', account_type,
    'entity_id', created_entity_id,
    'onboarding_completed', true
  );
end;
$$;

revoke all on function public.complete_onboarding(text, text, text, text) from public;
revoke all on function public.complete_onboarding(text, text, text, text) from anon;
grant execute on function public.complete_onboarding(text, text, text, text) to authenticated;

commit;
