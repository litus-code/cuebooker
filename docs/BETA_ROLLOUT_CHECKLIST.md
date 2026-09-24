# Cuebooker V1 beta rollout checklist

Updated: 24 September 2026

This checklist covers product and technical beta readiness on `feature/app-visual-system`.

It deliberately excludes the line owned by Work:

- RGPD / privacy;
- cookies and consent;
- legal notice / terms;
- commercial Pricing implementation;
- Stripe products, checkout, subscriptions and billing activation.

Those items remain launch dependencies, but should not be duplicated from this workstream.

## 1. Account access

### Code complete

- [x] Email/password signup.
- [x] Email confirmation compatible flow.
- [x] Returning-user sign in.
- [x] Sign out.
- [x] DJ / Agency onboarding.
- [x] Password change from authenticated Settings.
- [x] Password recovery request from Access.
- [x] Public `/reset-password` completion screen.
- [x] Recovery session is explicitly marked and cannot be substituted by a normal authenticated session.
- [x] Password reset request uses a non-enumerating success message.

### Manual staging gate

- [ ] Confirm `/reset-password` is included in the staging Supabase Auth redirect allow-list.
- [ ] Send one reset email to a dedicated QA account.
- [ ] Open the link, set a new password and confirm the recovery session is signed out afterwards.
- [ ] Verify expired / already-used recovery link shows the invalid-link state.
- [ ] Verify the new password signs in normally.
- [ ] Verify the old password no longer signs in.

## 2. Booking Core loop

The beta must pass the full loop without hidden manual database intervention:

```text
REQUEST
→ CONVERSATION
→ HOLD
→ DECISION
→ BOOKING
→ EVENT
→ CUE PASSPORT
```

### Hardened in code

- [x] Exact booking deep-links are independent from Inbox pagination.
- [x] Notification targets can open bookings outside the 100-row Inbox window.
- [x] Date-conflict bookings are queried directly by artist/date.
- [x] Hold conflicts are scoped to the selected artist, not the whole agency workspace.
- [x] Booking decisions have a single explicit confirmation path.
- [x] Operational activity cannot automatically enter confirmed/rejected/cancelled states.
- [x] Failed latest outbound delivery returns waiting-response bookings to in-conversation.
- [x] Soft bounce follows the same retry/failure semantics as the retry UI.
- [x] Email thread distinguishes provider send, accepted, delivered, deferred and failure states.
- [x] Relationship Memory is independent from Inbox pagination and scoped to the selected artist.

### Manual staging gate

- [ ] Submit a public booking request without an account.
- [ ] Confirm the request lands on the correct artist/workspace.
- [ ] Open the booking and verify New → In review behavior.
- [ ] Send an outbound email and verify Activity + delivery state.
- [ ] Reply from the external mailbox and verify the reply returns to the same booking thread.
- [ ] Create a Next Move.
- [ ] Create and release a Hold.
- [ ] Exercise an overlapping date and verify the warning does not make the decision for the artist.
- [ ] Confirm a booking manually.
- [ ] Verify confirmation appears in Calendar.
- [ ] Reject a separate booking manually.
- [ ] Archive and restore a booking.
- [ ] Verify archived bookings remain readable but operationally protected.

## 3. Artist Profile

### Code complete

- [x] Real Profile replaces the old profile-lab direction.
- [x] Desktop side-panel editing for Identity, Sound, Links, Passport and Distribution.
- [x] Desktop modal editing for Cover, Portrait and Booking settings.
- [x] Mobile fullscreen editors.
- [x] Public booking request uses modal/fullscreen flow instead of autoscroll.
- [x] Public profile sections: Hero, About, Sound, optional CUE ID, CUE Passport, Links, Booking.
- [x] Profile publication and booking-request controls are separate.
- [x] Public response cache no longer keeps shared stale visibility state.

### Manual staging gate

- [ ] Publish profile and verify public URL.
- [ ] Unpublish and verify the public profile becomes unavailable without stale CDN content.
- [ ] Toggle booking requests independently from profile visibility.
- [ ] Verify Cover and Portrait on desktop and mobile.
- [ ] Verify CUE ID can be hidden without affecting the rest of the profile.
- [ ] Verify external links open only from valid HTTP/HTTPS values.

## 4. CUE Passport

### Code complete

- [x] Dedicated Workspace Passport view, separate from CUE ID.
- [x] Confirmed-booking derived trajectory.
- [x] Country → City → Venue → Booking structure.
- [x] 2D constellation.
- [x] Country switching.
- [x] City selection and tooltip.
- [x] Stickers / milestones.
- [x] Timeline.
- [x] Linked Event Media.
- [x] Event Media manager for confirmed bookings.
- [x] External image/video/reel URL validation.
- [x] Link / hide / relink media without automatic public publication.
- [x] Passport confirmed-booking source is independent from Inbox pagination.
- [x] Public Passport visibility control.
- [x] Automatic or explicit public milestone selection.
- [x] Public Event Media opt-in selection.
- [x] No fake city node is created when a booking lacks geography.
- [x] Dense-world construction indexes linked media by booking rather than scanning all media per booking.
- [x] Mobile constellation does not trap vertical page scroll.
- [x] Touching a city node does not start a drag.
- [x] Staging schema + RLS applied.
- [x] Staging public profile Edge Function version 18 deployed.
- [x] Public profile response uses no shared visibility cache.

### Manual staging gate

- [ ] Direct HTTP/browser smoke of the public Passport payload.
- [ ] One-city trajectory.
- [ ] Two-city trajectory.
- [ ] Many-city trajectory.
- [ ] Many venues in one city.
- [ ] City with dates but no media.
- [ ] City with linked image.
- [ ] City with linked video/reel thumbnail.
- [ ] Empty Passport.
- [ ] Public Passport hidden.
- [ ] Explicit milestone selection.
- [ ] Public Event Media selection.
- [ ] Android touch / scroll behavior.
- [ ] iPhone touch / scroll behavior.
- [ ] Desktop mouse drag / zoom / reset.

## 5. Free / Artist Pro / Agency product states

### Implemented product boundaries

Free keeps the complete booking loop and current-product activation paths.

- [x] Up to 5 active bookings presented as Free capacity.
- [x] Workspace Activity limited to the latest 90 days.
- [x] Basic Smart Capture remains available.
- [x] Manual email remains available.
- [x] Manual Next Move remains available.
- [x] Holds remain available.
- [x] Public Profile remains available.
- [x] Public booking form remains available.
- [x] Basic Passport remains available.
- [x] Profile / booking / Instagram links, QR and iframe remain Free distribution channels.

Artist Pro value already wired:

- [x] Unlimited active-booking capacity presentation.
- [x] Full Workspace Activity history.
- [x] Extended Smart Capture capability presentation.
- [x] Prepared stale follow-up drafts.
- [x] Auto-complete a Next Move from a real inbound reply.
- [x] Public Passport Event Media selection.
- [x] Existing premium data is preserved when entitlement access is unavailable.

Agency-specific multi-artist/team entitlements remain represented centrally, but should only be surfaced where the matching operational feature exists.

### Still not claimed as enforced

- [ ] Monthly Smart Capture consumption counter.
- [ ] Paid-plan billing activation.
- [ ] Paid checkout / subscription lifecycle.

Billing/checkout belongs to the Work stream.

## 6. Email and notifications

### Manual staging gate

- [ ] Public acknowledgement email.
- [ ] Booking outbound email.
- [ ] Inbound booking email ingestion.
- [ ] Delivery event update.
- [ ] Bounce / failure visible to user.
- [ ] Retry a failed delivery.
- [ ] Notification opens the correct booking.
- [ ] Notification read state persists.

A delivery failure must never silently appear as a successful booking response.

## 7. Mobile and accessibility

### Manual gate

- [ ] Workspace navigation at narrow mobile width.
- [ ] Profile editors at narrow mobile width.
- [ ] Booking modal at narrow mobile width.
- [ ] Passport constellation touch.
- [ ] Booking Inbox list/detail transition.
- [ ] History filters.
- [ ] Calendar full-day interaction.
- [ ] Keyboard access to main desktop controls.
- [ ] Visible focus states.
- [ ] Reduced-motion behavior.
- [ ] No modal leaves `body` scroll locked after close/navigation.

## 8. Security / tenant isolation

### Staging gate

- [ ] User A cannot read User B workspace.
- [ ] User A cannot mutate User B artist.
- [x] Passport media RLS enabled.
- [x] Passport media SELECT requires workspace membership.
- [x] Passport media writes require workspace editing permission.
- [x] Public Passport artist settings inherit manager-only artist update policy.
- [ ] Public booking abuse/rate protection smoke.
- [ ] Password recovery abuse/rate behavior reviewed with staging Auth settings.
- [ ] Supabase leaked-password protection decision before production.

## 9. Analytics / observability

Product funnel instrumentation is present for the V1 product path.

### Manual staging gate

- [ ] Signup started/completed visible.
- [ ] Onboarding completed visible.
- [ ] Profile viewed/published visible.
- [ ] Booking entry shared visible.
- [ ] Booking request started/sent visible.
- [ ] Booking capture created visible.
- [ ] Booking response sent visible.
- [ ] Booking decision / confirmed visible.
- [ ] Passport event visible.
- [ ] Upgrade prompt view/action visible.
- [ ] Confirm no PII or free-text booking content is sent as analytics properties.

Payment events belong to the Work / checkout stream.

## 10. Rollback / release discipline

- [x] PR #75 remains the product reference.
- [x] Production is not touched from this workstream.
- [x] Passport schema/function changes were applied to staging only.
- [ ] Record the exact final beta candidate SHA.
- [ ] Confirm backup / rollback procedure for Supabase production before any later production apply.
- [ ] Run final smoke against that exact SHA, not a moving branch.

## Stop-ship conditions

Do not invite external beta users if any of these are true:

- cross-workspace data can be read or modified;
- signup/signin/onboarding cannot be completed reliably;
- password recovery has no working staging redirect;
- public booking requests are lost or land on the wrong artist;
- a successful-looking email response is actually undelivered;
- confirmation/rejection can occur without explicit artist action;
- confirmed dates fail to appear in Calendar;
- public Profile/Passport visibility controls expose hidden content;
- mobile navigation or core booking work is unusable;
- the exact beta candidate SHA has not passed its build and manual smoke.

## External dependencies owned by Work

Before public launch, reconcile this checklist with Work's output for:

- RGPD / privacy;
- cookies and consent;
- legal notice / terms;
- final commercial Pricing;
- Stripe test/live setup;
- checkout;
- subscription lifecycle;
- billing-to-entitlement synchronization.

Do not duplicate or overwrite that implementation from this branch workstream.
