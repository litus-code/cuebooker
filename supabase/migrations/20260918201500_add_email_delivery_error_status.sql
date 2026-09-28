begin;

alter table public.email_messages
  drop constraint if exists email_messages_delivery_status_check;

alter table public.email_messages
  add constraint email_messages_delivery_status_check
  check (
    delivery_status is null or delivery_status = any (
      array[
        'accepted',
        'delivered',
        'deferred',
        'soft_bounce',
        'hard_bounce',
        'blocked',
        'spam',
        'invalid',
        'error'
      ]
    )
  );

comment on column public.email_messages.delivery_status
is 'Latest normalized provider delivery state. Provider acceptance is distinct from final delivery.';

commit;
