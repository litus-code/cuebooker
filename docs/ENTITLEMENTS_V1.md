# Cuebooker entitlements V1

Updated: 24 September 2026  
Status: PRODUCT / COMMERCIAL CONTRACT

## Purpose

Cuebooker uses entitlements instead of scattered plan checks.

UI and product logic should ask:

```ts
can('passport.media')
```

not:

```ts
plan === 'artist_pro'
```

This keeps pricing, plan names and commercial packaging changeable without rewriting product components.

## Plan matrix

| Capability | Free | Artist Pro | Agency |
|---|:---:|:---:|:---:|
| Booking Core | Yes | Yes | Yes |
| Public profile | Yes | Yes | Yes |
| Public booking form | Yes | Yes | Yes |
| Basic calendar | Yes | Yes | Yes |
| Basic notifications | Yes | Yes | Yes |
| Manual capture | Yes | Yes | Yes |
| Basic CUE Passport | Yes | Yes | Yes |
| Basic CUE ID | Yes | Yes | Yes |
| Basic distribution / QR | Yes | Yes | Yes |
| Unlimited booking capacity |  | Yes | Yes |
| Full operational history |  | Yes | Yes |
| Extended Smart Capture |  | Yes | Yes |
| Advanced automation |  | Yes | Yes |
| Advanced Passport |  | Yes | Yes |
| Passport event media |  | Yes | Yes |
| Passport exports / recaps |  | Yes | Yes |
| Advanced CUE ID |  | Yes | Yes |
| Advanced analytics |  | Yes | Yes |
| Advanced distribution |  | Yes | Yes |
| Custom branding |  | Yes | Yes |
| Advanced integrations |  | Yes | Yes |
| Data export |  | Yes | Yes |
| Multi-artist workspace |  |  | Yes |
| Team members |  |  | Yes |
| Roles / permissions |  |  | Yes |
| Shared inbox |  |  | Yes |
| Roster calendar |  |  | Yes |
| Roster reporting |  |  | Yes |
| Agency templates |  |  | Yes |

## Initial Free limits

These are launch hypotheses and should remain configurable during beta:

- 5 active booking processes;
- 10 new booking captures per month;
- 90 days of easily browsable operational history;
- small Smart Capture allowance;
- no Passport Media persistence on Free;
- 1 artist;
- 1 user.

Limits should not interrupt a commercial decision already in progress. Reaching a limit should explain the additional Pro value and preserve existing data.

## Presentation rules

Premium capabilities should generally remain visible.

Use a discreet `PRO` or `AGENCY` label when the commercial distinction helps the user understand the product.

Do not place upgrade friction on:

- receiving the first enquiry;
- confirming a booking;
- viewing the basic calendar;
- publishing the basic artist profile;
- seeing the basic Passport;
- using the basic CUE ID.

Good premium presentation:

```text
EVENT MEDIA  PRO
Attach photos and reels to confirmed dates.
```

The user understands the capability before an upgrade decision is requested.

## Locking behaviour

There are two commercial mechanisms.

### Capability entitlement

Example:

```text
passport.media → Artist Pro
workspace.multi_artist → Agency
```

The feature can be visible but its primary action can require the entitlement.

### Capacity entitlement

Example:

```text
Free active bookings: 5
Artist Pro active bookings: unlimited
```

Capacity should be checked separately from feature availability.

## Staging and demo

Staging supports a non-production plan override through `useCueEntitlements()`.

Supported demo plans:

- `free`;
- `artist_pro`;
- `agency`.

The workspace Settings panel exposes the selector outside production. A `?demoPlan=...` query can also set the demo plan and persists it locally for the browser.

Production ignores this override and clears demo entitlement overrides. It is never billing state.

## Product rule

Every new commercial feature should declare:

1. entitlement id;
2. minimum plan;
3. whether it remains visible when unavailable;
4. whether the restriction is capability-based or capacity-based;
5. what happens to existing data after downgrade.

If a feature has no declared entitlement, default it to Free until a product decision is made.

## Current mapping

### Free

- `booking.core`
- `profile.public`
- `booking_form.public`
- `calendar.basic`
- `notifications.basic`
- `capture.manual`
- `passport.basic`
- `cue_id.basic`
- `distribution.basic`

### Artist Pro

- `booking.unlimited`
- `booking.history_full`
- `capture.smart_extended`
- `automation.advanced`
- `passport.advanced`
- `passport.media`
- `passport.export`
- `cue_id.advanced`
- `analytics.advanced`
- `distribution.advanced`
- `branding.custom`
- `integrations.advanced`
- `data.export`

### Agency

- `workspace.multi_artist`
- `workspace.team`
- `workspace.roles`
- `workspace.shared_inbox`
- `workspace.roster_calendar`
- `workspace.roster_reporting`
- `workspace.agency_templates`

Implementation source of truth: `app/domain/entitlements.ts`.

## UI implementation state

Reusable commercial primitives now exist:

- `useCueEntitlements()` for `can(...)`, limits, minimum plan and non-production overrides;
- `CuePlanBadge.vue` for PRO / AGENCY presentation;
- `passport.media` is visible on Free but its selection action requires the entitlement;
- `capture.smart_extended` is presented as Artist Pro capacity while basic Smart Capture remains available on Free.

Real billing is still intentionally disconnected. The base plan remains Free until `workspace_billing` is reconciled with the freemium model.


## Automation boundary

`automation.advanced` currently covers mechanical assistance that removes repeat work while leaving final decisions to the artist.

Artist Pro:

- prepares an editable follow-up draft when a booking has been waiting for a reply long enough;
- can mark a saved next action as completed when a real inbound reply arrives.

Free remains able to:

- see stale-waiting attention;
- write and send email manually;
- create and complete next actions manually;
- create and manage holds;
- retry a failed email delivery;
- receive automatic operational status transitions from real inbound/outbound activity.

Confirmation, rejection, cancellation and final economic decisions are never automated by this entitlement.
