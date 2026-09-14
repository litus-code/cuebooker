begin;

create index availability_blocks_created_by_idx
  on public.availability_blocks(created_by);

commit;
