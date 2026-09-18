begin;

create index if not exists notifications_activity_id_idx
  on public.notifications(activity_id)
  where activity_id is not null;

commit;
