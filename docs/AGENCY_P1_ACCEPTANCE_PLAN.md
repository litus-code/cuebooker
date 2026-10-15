# P1 — Agency acceptance plan (prepared, not executed)

15 October 2026. Prepared after the P0 Agency Settings UX request. This is a plan, not evidence of P1 execution or approval to deploy/change Supabase. Reference: the owner-supplied `CODEX_BACKLOG_CUEBOOKER_2026-10-15.md`.

## Existing owner acceptance — do not repeat without an incident

The owner reports successful connected-email receipt/automatic request creation and extraction; sending/replies on the original booking without duplicates; supported/rejected attachments associated per message; the DJ operational circuit; ES/EN switching and mobile review. These are owner-reported manual checks, not a security audit or proof of every browser/error scenario. Earlier historical handoffs/checklists must not turn these back into a generic pending Gmail/DJ smoke.

P0 local fixtures verify only layout/navigation. They do not establish real agency publication, invitation acceptance or role isolation.

## Next bounded block: actual agency journey

Target the exact reviewed PR96 candidate/preview and an authorized dedicated agency workspace. Record its immutable SHA before starting. Use controlled test accounts for Owner/Admin, Manager/Editor, Viewer, an invitation recipient and a second isolated tenant. Do not publish customer data or expose invitation tokens in evidence. Confirm access before calling a case blocked; do not manufacture results if credentials are missing.

| Case | Expected evidence | Current status |
| --- | --- | --- |
| Create/edit agency identity | Saved fields survive reload in the same agency | Not executed in P0 |
| Public/private agency page | Publish/unpublish matches the public view and visibility controls | Not executed in P0 |
| Invitation creation | Role/email/expiry and the existing manual share contract are clear | Not executed in P0 |
| Invitation acceptance | Intended verified account joins the intended workspace once | Not executed in P0 |
| Invalid/expired/reused invitation | Explicit safe state; no unintended membership | Not executed in P0 |
| Role changes/removal | Authorized changes persist; removed access is denied | Not executed in P0 |
| Manager/Editor/Viewer | Actual allowed/denied actions match the current server contract | Not executed in P0 |
| Multiple roster artists | Selection, edits and bookings retain the intended artist context | Not executed in P0 |
| Collective agency enquiry | One negotiation/booking remains one request when multiple artists are proposed; verify current Booking Core contract before changing anything | Not executed in P0 |
| Cross-artist / cross-workspace access | Exact authorized read/write scope; rejection evidence for forbidden access | Not executed in P0 |

For each case record **validated in environment / failed / pending / blocked**, SHA, environment, role, expected and observed result, and sanitized evidence. Only concrete failures justify a bounded code correction and regression test. Preserve one Booking model. Do not merge or modify production permissions.

## Following P1 block — integrity/security/recovery (also not executed)

Separately reconcile deployed staging SQL/Edge/Storage/RLS with the candidate; review attachment authorization, partial recovery/retries/orphans and duplicate protection. Use the current `BETA_ROLLOUT_CHECKLIST.md` gates for password recovery, notification/delivery states, calendar, visibility, abuse and accessible degradation, marking existing owner acceptance accurately rather than restarting all Gmail/DJ tests. Any actual deployment/schema modification remains outside the current P0 authorization.

P2 backup/export/restore, release execution, billing and commercial-PR integration are not part of either P0 or this next agency acceptance block. Keep #110/#111/#112 separate. No P1 account, invitation, booking, database or deployment operation was performed while preparing this document.
