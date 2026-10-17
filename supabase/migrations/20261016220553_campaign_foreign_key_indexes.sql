begin;
set local lock_timeout = '3s';
set local statement_timeout = '30s';
create index campaign_registrations_visitor_idx
  on private.campaign_registrations (visitor_id);
create index campaign_workspace_dedup_workspace_idx
  on private.campaign_workspace_dedup (workspace_id);
commit;
