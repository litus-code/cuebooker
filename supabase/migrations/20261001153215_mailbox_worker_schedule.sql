-- Operator-controlled scheduling. Tokens and destination are read from Vault,
-- never embedded in cron SQL. Installation always leaves the job paused.
create extension if not exists pg_cron;
create extension if not exists pg_net;
select cron.alter_job(job_id := cron.schedule(
  'cuebooker-mailbox-incoming',
  '* * * * *',
  $command$
    select net.http_post(
      url := (select decrypted_secret from vault.decrypted_secrets where name = 'cuebooker_mailbox_worker_url'),
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'cuebooker_mailbox_worker_secret')
      ),
      body := '{}'::jsonb,
      timeout_milliseconds := 30000
    )
    where exists (select 1 from public.mailbox_incoming_jobs where state = 'pending')
      and exists (select 1 from vault.secrets where name = 'cuebooker_mailbox_worker_url')
      and exists (select 1 from vault.secrets where name = 'cuebooker_mailbox_worker_secret');
  $command$
), active := false);
